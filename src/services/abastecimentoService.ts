import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type AbastecimentoItem = {
  id: string
  viagem_id?: string
  veiculo_id: string
  veiculo_placa?: string
  veiculo_modelo?: string
  motorista_id: string
  motorista_nome?: string
  tipo_combustivel: string
  km_atual: string
  litros: string
  valor_por_litro: string
  valor_total: string
  fornecedor?: string
  foto_url?: string
  registrado_em?: string
  created_at?: string
}

export type ListAbastecimentosParams = {
  veiculo_id?: string
  motorista_id?: string
  page?: number
  limit?: number
}

export const abastecimentoService = {
  async list(params: ListAbastecimentosParams) {
    const response = await api.get<PaginatedApiResponse<AbastecimentoItem[]>>('/admin/abastecimentos', { params })
    return response.data
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<AbastecimentoItem>>(`/admin/abastecimentos/${id}`)
    return response.data
  },
}
