import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type ViagemStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export type ViagemFormData = {
  cliente_id: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  status: ViagemStatus
  observacoes: string
}

export type Viagem = {
  id: string
  cliente_id: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  km_final?: string
  status: ViagemStatus
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
  data_saida_de?: string
  data_saida_ate?: string
  page?: number
  limit?: number
}

type ViagemPayload = {
  cliente_id?: string
  motorista_id: string
  veiculo_id: string
  tipo_carga_id?: string
  origem_cidade: string
  origem_uf: string
  destino_cidade: string
  destino_uf: string
  data_saida: string
  data_chegada_prevista: string
  distancia_km: string
  peso_carga_kg: string
  valor_frete: string
  km_inicial: string
  observacoes: string
}

function normalizeViagemPayload(payload: ViagemFormData): ViagemPayload {
  return {
    cliente_id: payload.cliente_id || undefined,
    motorista_id: payload.motorista_id,
    veiculo_id: payload.veiculo_id,
    tipo_carga_id: payload.tipo_carga_id || undefined,
    origem_cidade: payload.origem_cidade.trim(),
    origem_uf: payload.origem_uf.trim().toUpperCase(),
    destino_cidade: payload.destino_cidade.trim(),
    destino_uf: payload.destino_uf.trim().toUpperCase(),
    data_saida: payload.data_saida,
    data_chegada_prevista: payload.data_chegada_prevista,
    distancia_km: payload.distancia_km.trim(),
    peso_carga_kg: payload.peso_carga_kg.trim(),
    valor_frete: payload.valor_frete.trim(),
    km_inicial: payload.km_inicial.trim(),
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
