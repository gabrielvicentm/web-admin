import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type OcorrenciaItem = {
  id: string
  viagem_id?: string
  veiculo_id?: string
  veiculo_placa?: string
  veiculo_modelo?: string
  motorista_id: string
  motorista_nome?: string
  tipo: string
  motivo: string
  descricao: string
  foto_url?: string
  latitude?: string
  longitude?: string
  registrado_em?: string
  created_at?: string
}

type OcorrenciaListParams = {
  search?: string
  tipo?: string
  viagem_id?: string
  veiculo_id?: string
  motorista_id?: string
  page?: number
  limit?: number
}

export const ocorrenciaService = {
  async list(params: OcorrenciaListParams) {
    const response = await api.get<PaginatedApiResponse<OcorrenciaItem[]>>('admin/ocorrencias', { params })
    return response.data
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<OcorrenciaItem>>(`admin/ocorrencias/${id}`)
    return response.data
  },
}
