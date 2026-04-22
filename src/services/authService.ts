import axios from 'axios'
import { api } from './api'
import { sessionService, type AuthUser } from './sessionService'

type AdminLoginPayload = {
  email: string
  senha: string
}

type LoginResponse = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number | string
  user?: Partial<AuthUser>
}

type LoginApiResponse = LoginResponse | { data?: LoginResponse; user?: Partial<AuthUser> }

function isLoginResponse(payload: LoginApiResponse): payload is LoginResponse {
  return 'access_token' in payload
}

function normalizeLoginResponse(payload: LoginApiResponse): LoginResponse {
  const normalizedPayload = isLoginResponse(payload) ? payload : payload.data

  if (!normalizedPayload?.access_token) {
    throw new Error('Resposta de login sem access_token.')
  }

  return {
    access_token: normalizedPayload.access_token,
    refresh_token: normalizedPayload.refresh_token,
    token_type: normalizedPayload.token_type,
    expires_in: normalizedPayload.expires_in,
    user: normalizedPayload.user ?? ('user' in payload ? payload.user : undefined),
  }
}

function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return 'A rota de login nao foi encontrada no backend. Confira se o endpoint correto e /auth/login.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Nao foi possivel conectar ao backend em localhost:8081.'
    }
  }

  return 'Nao foi possivel realizar o login agora.'
}

export const authService = {
  async loginAdmin(payload: AdminLoginPayload) {
    try {
      const response = await api.post<LoginApiResponse>('auth/login', payload)
      const session = normalizeLoginResponse(response.data)

      sessionService.saveSession(session)

      return session
    } catch (error) {
      throw new Error(getLoginErrorMessage(error))
    }
  },

  logout() {
    sessionService.clearSession()
  },
}
