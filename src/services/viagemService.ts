import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type ViagemStatus = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'

export type ViagemFormData = {
  cliente_id: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id: string
  origem: string
  destino: string
  data_saida: string
  data_previsao_chegada: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  status: ViagemStatus
  descricao_carga: string
  observacoes: string
}

export type Viagem = {
  id: number
  cliente_id: number
  motorista_id: number
  veiculo_id: number
  tipo_carga_id: number
  origem: string
  destino: string
  data_saida: string
  data_previsao_chegada: string
  distancia_km: number
  peso_carga_kg: number
  valor_frete: number
  status: ViagemStatus
  descricao_carga: string
  observacoes: string
}

export type ViagemListItem = Viagem & {
  cliente_nome?: string
  motorista_nome?: string
  veiculo_placa?: string
  veiculo_modelo?: string
  tipo_carga_nome?: string
}

type ListViagensParams = {
  search?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  limit?: number
}

type ViagemPayload = {
  cliente_id: number
  motorista_id: number
  veiculo_id: number
  tipo_carga_id: number
  origem: string
  destino: string
  data_saida: string
  data_previsao_chegada: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  status: ViagemStatus
  descricao_carga: string
  observacoes: string
}

function normalizeViagemPayload(payload: ViagemFormData): ViagemPayload {
  return {
    cliente_id: Number(payload.cliente_id),
    motorista_id: Number(payload.motorista_id),
    veiculo_id: Number(payload.veiculo_id),
    tipo_carga_id: Number(payload.tipo_carga_id),
    origem: payload.origem.trim(),
    destino: payload.destino.trim(),
    data_saida: payload.data_saida,
    data_previsao_chegada: payload.data_previsao_chegada,
    distancia_km: payload.distancia_km.trim(),
    peso_carga_kg: payload.peso_carga_kg.trim(),
    valor_frete: payload.valor_frete.trim(),
    status: payload.status,
    descricao_carga: payload.descricao_carga.trim(),
    observacoes: payload.observacoes.trim(),
  }
}

export const viagemService = {
  async list(params: ListViagensParams) {
    const response = await api.get<PaginatedApiResponse<ViagemListItem[]>>('/admin/viagens', { params })
    return response.data
  },

  async create(payload: ViagemFormData) {
    const response = await api.post<ApiResponse<Viagem>>('/admin/viagens', normalizeViagemPayload(payload))
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/viagens/${id}`)
    return response.data
  },
}
