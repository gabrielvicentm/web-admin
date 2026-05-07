import { api } from './api'
import type { PaginatedApiResponse } from './httpTypes'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type HistoricoAlteracaoCampo = {
  campo?: string
  valor_anterior?: JsonValue
  valor_novo?: JsonValue
}

export type HistoricoAlteracao = {
  id: string | number
  entidade?: string
  entidade_id?: string | number
  acao?: string
  usuario_id?: string | number
  usuario_nome?: string
  usuario_email?: string
  origem?: string
  ip?: string
  resumo?: string
  dados_antes?: Record<string, JsonValue> | null
  dados_depois?: Record<string, JsonValue> | null
  alteracoes?: HistoricoAlteracaoCampo[]
  criado_em?: string
  data_alteracao?: string
}

export type ListHistoricoAlteracoesParams = {
  search?: string
  entidade?: string
  entidade_id?: string
  acao?: string
  usuario?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
}

export const historicoAlteracoesService = {
  async list(params: ListHistoricoAlteracoesParams) {
    const response = await api.get<PaginatedApiResponse<HistoricoAlteracao[]>>('/admin/historico-alteracoes', { params })
    return response.data
  },
}
