import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type ManutencaoTipo = 'preventiva' | 'corretiva' | 'revisao'
export type ManutencaoStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada'

export type ManutencaoListItem = {
  id: string
  veiculo_id: string
  veiculo_placa: string
  veiculo_modelo: string
  tipo: ManutencaoTipo
  status: ManutencaoStatus
  descricao: string
  oficina: string
  km_na_manutencao: string
  km_proxima_manutencao: string
  custo: string
  data_agendada: string
  data_conclusao: string
}

export type Manutencao = ManutencaoListItem & {
  observacoes: string
}

export type ManutencaoFormData = {
  veiculo_id: string
  tipo: ManutencaoTipo
  status: ManutencaoStatus
  descricao: string
  oficina: string
  km_na_manutencao: string
  km_proxima_manutencao: string
  data_agendada: string
  data_conclusao: string
  custo: string
  observacoes: string
}

type ListManutencoesParams = {
  search?: string
  status?: string
  tipo?: string
  veiculo_id?: string
  page?: number
  limit?: number
}

function normalizeManutencaoPayload(payload: ManutencaoFormData) {
  return {
    veiculo_id: payload.veiculo_id.trim(),
    tipo: payload.tipo,
    status: payload.status,
    descricao: payload.descricao.trim(),
    oficina: payload.oficina.trim(),
    km_na_manutencao: payload.km_na_manutencao.trim(),
    km_proxima_manutencao: payload.km_proxima_manutencao.trim(),
    data_agendada: payload.data_agendada,
    data_conclusao: payload.data_conclusao,
    custo: payload.custo.trim(),
    observacoes: payload.observacoes.trim(),
  }
}

export const manutencaoService = {
  async list(params: ListManutencoesParams) {
    const response = await api.get<PaginatedApiResponse<ManutencaoListItem[]>>('/admin/manutencoes', { params })
    return response.data
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<Manutencao>>(`/admin/manutencoes/${id}`)
    return response.data
  },

  async create(payload: ManutencaoFormData) {
    const response = await api.post<ApiResponse<Manutencao>>('/admin/manutencoes', normalizeManutencaoPayload(payload))
    return response.data
  },

  async update(id: string, payload: ManutencaoFormData) {
    const response = await api.put<ApiResponse<Manutencao>>(`/admin/manutencoes/${id}`, normalizeManutencaoPayload(payload))
    return response.data
  },

  async getByVeiculo(veiculoId: string, page = 1, limit = 50) {
    const response = await api.get<PaginatedApiResponse<ManutencaoListItem[]>>(`/admin/veiculos/${veiculoId}/manutencoes`, {
      params: { page, limit },
    })
    return response.data
  },
}
