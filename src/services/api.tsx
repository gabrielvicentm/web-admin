import axios, { AxiosHeaders, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { sessionService, type AuthUser } from './sessionService'

type TokenPayload = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number | string
  user?: Partial<AuthUser>
}

type TokenApiResponse = TokenPayload | { data?: TokenPayload; user?: Partial<AuthUser> }

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const REFRESH_BUFFER_MS = 60_000

const refreshApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshRequest: Promise<string | null> | null = null

function normalizeUrl(url?: string) {
  return (url ?? '').replace(/^\/+/, '')
}

function isRefreshResponse(payload: TokenApiResponse): payload is TokenPayload {
  return typeof payload === 'object' && payload !== null && 'access_token' in payload
}

function normalizeTokenResponse(payload: TokenApiResponse) {
  const data = isRefreshResponse(payload) ? payload : payload.data

  if (!data?.access_token) {
    throw new Error('Resposta de refresh sem access_token.')
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    user: data.user ?? ('user' in payload ? payload.user : undefined),
  }
}

function isBypassAuthRequest(url?: string) {
  const normalizedUrl = normalizeUrl(url)

  return (
    normalizedUrl === 'auth/login'
    || normalizedUrl === 'auth/admin/login'
    || normalizedUrl === 'auth/motorista/login'
    || normalizedUrl === 'auth/refresh'
    || normalizedUrl === 'auth/logout'
    || normalizedUrl === 'auth/reset-password'
  )
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

function setAuthorizationHeader(config: InternalAxiosRequestConfig, token: string) {
  const tokenType = sessionService.getSession()?.tokenType ?? 'Bearer'

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set('Authorization', `${tokenType} ${token}`)
    return
  }

  config.headers = config.headers ?? {}
  config.headers.Authorization = `${tokenType} ${token}`
}

async function refreshAccessToken() {
  const refreshToken = sessionService.getRefreshToken()

  if (!refreshToken) {
    return null
  }

  const response = await refreshApi.post<TokenApiResponse>('auth/refresh', {
    refresh_token: refreshToken,
  })

  const session = normalizeTokenResponse(response.data)
  sessionService.saveSession(session)

  return session.access_token
}

async function ensureAccessToken(forceRefresh = false) {
  const session = sessionService.getSession()

  if (!session) {
    return null
  }

  if (!forceRefresh && !sessionService.isAccessTokenExpired(REFRESH_BUFFER_MS)) {
    return session.accessToken
  }

  if (!sessionService.hasRefreshToken() || sessionService.isRefreshTokenExpired()) {
    sessionService.clearSession()
    return null
  }

  if (!refreshRequest) {
    refreshRequest = refreshAccessToken().finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

export async function getValidAccessToken(forceRefresh = false) {
  return ensureAccessToken(forceRefresh)
}

export function attachAuthInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    if (isBypassAuthRequest(config.url)) {
      return config
    }

    let token: string | null = null

    try {
      token = await ensureAccessToken()
    } catch (error) {
      sessionService.clearSession()
      redirectToLogin()
      return Promise.reject(error)
    }

    if (token) {
      setAuthorizationHeader(config, token)
    }

    return config
  })

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        return Promise.reject(error)
      }

      const requestConfig = error.config as RetryableRequestConfig | undefined

      if (requestConfig && !requestConfig._retry && !isBypassAuthRequest(requestConfig.url)) {
        requestConfig._retry = true

        try {
          const token = await ensureAccessToken(true)

          if (token) {
            setAuthorizationHeader(requestConfig, token)
            return client(requestConfig)
          }
        } catch {
          sessionService.clearSession()
          redirectToLogin()
          return Promise.reject(error)
        }
      }

      sessionService.clearSession()
      redirectToLogin()
      return Promise.reject(error)
    },
  )
}

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

attachAuthInterceptors(api)
