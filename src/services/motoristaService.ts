import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type MotoristaStatus = 'ativo' | 'inativo' | 'ferias' | 'afastado'
export type TipoCnh = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE'

export type MotoristaListItem = {
  id: number
  nome: string
  cpf: string
  numero_cnh: string
  tipo_cnh: TipoCnh
  validade_cnh: string
  telefone: string
  email: string
  status: MotoristaStatus
  foto_url?: string
}

export type Motorista = MotoristaListItem & {
  endereco_logradouro: string
  endereco_numero: string
  endereco_complemento: string
  endereco_bairro: string
  endereco_cidade: string
  endereco_uf: string
  endereco_cep: string
  data_admissao: string
  observacoes: string
}

export type MotoristaFormData = {
  nome: string
  cpf: string
  numero_cnh: string
  tipo_cnh: TipoCnh
  validade_cnh: string
  telefone: string
  email: string
  endereco_logradouro: string
  endereco_numero: string
  endereco_complemento: string
  endereco_bairro: string
  endereco_cidade: string
  endereco_uf: string
  endereco_cep: string
  data_admissao: string
  status: MotoristaStatus
  observacoes: string
  senha_inicial?: string
  nova_senha?: string
}

export type MotoristaIndicadores = {
  motorista_id: number
  nome: string
  total_viagens: number
  total_km_rodados: number
  total_ocorrencias: number
  total_frete_gerado: number
}

export type MotoristaHistoricoViagem = {
  id: number
  origem?: string
  destino?: string
  status?: string
  data_saida?: string
  data_chegada?: string
}

export type MotoristaOcorrencia = {
  id: number
  titulo?: string
  descricao?: string
  status?: string
  data_ocorrencia?: string
}

type ListMotoristasParams = {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export const motoristaService = {
  async list(params: ListMotoristasParams) {
    const response = await api.get<PaginatedApiResponse<MotoristaListItem[]>>('/admin/motoristas', { params })
    return response.data
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<Motorista>>(`/admin/motoristas/${id}`)
    return response.data
  },

  async create(payload: MotoristaFormData) {
    const response = await api.post<ApiResponse<Motorista>>('/admin/motoristas', payload)
    return response.data
  },

  async update(id: string | number, payload: MotoristaFormData) {
    const response = await api.put<ApiResponse<Motorista>>(`/admin/motoristas/${id}`, payload)
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/motoristas/${id}`)
    return response.data
  },

  async updateStatus(id: string | number, status: MotoristaStatus) {
    const response = await api.patch<ApiResponse<Motorista>>(`/admin/motoristas/${id}/status`, { status })
    return response.data
  },

  async uploadPhoto(id: string | number, file: File) {
    const formData = new FormData()
    formData.append('foto', file)

    const response = await api.post<ApiResponse<Motorista>>(`/admin/motoristas/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  },

  async getIndicadores(id: string | number) {
    const response = await api.get<ApiResponse<MotoristaIndicadores>>(`/admin/motoristas/${id}/indicadores`)
    return response.data
  },

  async getViagens(id: string | number) {
    const response = await api.get<ApiResponse<MotoristaHistoricoViagem[]>>(`/admin/motoristas/${id}/viagens`)
    return response.data
  },

  async getOcorrencias(id: string | number) {
    const response = await api.get<ApiResponse<MotoristaOcorrencia[]>>(`/admin/motoristas/${id}/ocorrencias`)
    return response.data
  },
}
