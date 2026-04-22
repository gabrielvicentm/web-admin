const ACCESS_TOKEN_KEY = 'transgestao.access_token'
const REFRESH_TOKEN_KEY = 'transgestao.refresh_token'
const TOKEN_TYPE_KEY = 'transgestao.token_type'
const EXPIRES_AT_KEY = 'transgestao.expires_at'
const USER_KEY = 'transgestao.user'

export type AuthUser = {
  id: string | number
  nome: string
  email: string
  role: string
  actor_type: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresAt: number
  user: AuthUser
}

type PersistedAuthPayload = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number | string
  user?: Partial<AuthUser>
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function getTokenExpiryFromJwt(token: string) {
  try {
    const [, payload] = token.split('.')

    if (!payload) {
      return null
    }

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }

    return typeof decodedPayload.exp === 'number' ? decodedPayload.exp * 1000 : null
  } catch {
    return null
  }
}

function calculateExpiresAt(accessToken: string, expiresIn: number) {
  const jwtExpiry = getTokenExpiryFromJwt(accessToken)

  if (jwtExpiry) {
    return jwtExpiry
  }

  return Date.now() + expiresIn * 1000
}

function normalizeExpiresIn(expiresIn?: number | string) {
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0) {
    return expiresIn
  }

  if (typeof expiresIn === 'string') {
    const parsed = Number(expiresIn)

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return 60 * 60 * 24
}

function normalizeUser(user?: Partial<AuthUser>): AuthUser {
  return {
    id: user?.id ?? '',
    nome: user?.nome ?? 'Administrador',
    email: user?.email ?? '',
    role: user?.role ?? 'admin',
    actor_type: user?.actor_type ?? 'admin',
  }
}

export const sessionService = {
  saveSession(payload: PersistedAuthPayload) {
    if (!isBrowser()) {
      return
    }

    const expiresAt = calculateExpiresAt(payload.access_token, normalizeExpiresIn(payload.expires_in))
    const user = normalizeUser(payload.user)

    window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh_token ?? '')
    window.localStorage.setItem(TOKEN_TYPE_KEY, payload.token_type ?? 'Bearer')
    window.localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt))
    window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  clearSession() {
    if (!isBrowser()) {
      return
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    window.localStorage.removeItem(TOKEN_TYPE_KEY)
    window.localStorage.removeItem(EXPIRES_AT_KEY)
    window.localStorage.removeItem(USER_KEY)
  },

  getSession(): AuthSession | null {
    if (!isBrowser()) {
      return null
    }

    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''
    const tokenType = window.localStorage.getItem(TOKEN_TYPE_KEY) ?? 'Bearer'
    const expiresAtValue = window.localStorage.getItem(EXPIRES_AT_KEY)
    const userValue = window.localStorage.getItem(USER_KEY)

    if (!accessToken || !expiresAtValue) {
      return null
    }

    try {
      const user = normalizeUser(userValue ? (JSON.parse(userValue) as Partial<AuthUser>) : undefined)
      const expiresAt = Number(expiresAtValue)

      if (!Number.isFinite(expiresAt)) {
        return null
      }

      return {
        accessToken,
        refreshToken,
        tokenType,
        expiresAt,
        user,
      }
    } catch {
      return null
    }
  },

  getAccessToken() {
    return this.getSession()?.accessToken ?? null
  },

  isAuthenticated() {
    const session = this.getSession()

    if (!session) {
      return false
    }

    if (session.expiresAt <= Date.now()) {
      this.clearSession()
      return false
    }

    return true
  },
}
