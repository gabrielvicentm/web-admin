import { fetchEventSource } from '@microsoft/fetch-event-source'
import { api, getValidAccessToken } from './api'
import type { PaginatedApiResponse } from './httpTypes'
import { sessionService } from './sessionService'

export type Notificacao = {
  id: string
  destinatario_tipo?: string
  destinatario_id?: string
  origem_tipo?: string
  origem_id?: string
  titulo: string
  mensagem?: string
  lida: boolean
  referencia_tipo?: string
  referencia_id?: string
  created_at?: string
}

export type ListNotificacoesParams = {
  lida?: boolean
  page?: number
  limit?: number
}

type SubscribeOptions = {
  signal: AbortSignal
  onNotification: (notification: Notificacao) => void
}

function getApiUrl(path: string) {
  const baseUrl = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : ''
  return `${baseUrl}${path}`
}

export const notificacaoService = {
  async list(params: ListNotificacoesParams = {}) {
    const response = await api.get<PaginatedApiResponse<Notificacao[]>>('/admin/notificacoes', { params })
    return response.data
  },

  async countUnread() {
    const response = await this.list({ lida: false, page: 1, limit: 1 })
    return response.meta.total
  },

  async subscribeAdmin({ signal, onNotification }: SubscribeOptions) {
    const token = await getValidAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined

    await fetchEventSource(getApiUrl('/admin/notificacoes/stream'), {
      headers,
      signal,
      async onopen(response) {
        if (response.ok) {
          return
        }

        if (response.status === 401) {
          sessionService.clearSession()
          throw new Error('Sessao expirada ao conectar notificacoes.')
        }

        throw new Error(`Falha ao conectar stream de notificacoes (${response.status}).`)
      },
      onmessage(event) {
        if (event.event !== 'notificacao' || !event.data) {
          return
        }

        try {
          onNotification(JSON.parse(event.data) as Notificacao)
        } catch {
          // Ignore malformed stream events and keep the notification channel open.
        }
      },
    })
  },
}
