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

type ApiMotoristaImageFields = {
  foto_url?: string | null
  foto?: string | null
  foto_path?: string | null
  foto_key?: string | null
  foto_r2_url?: string | null
  foto_public_url?: string | null
}

const r2PublicBaseUrl = 'https://pub-f4e4a14a40454d748b2db48ccf60e04c.r2.dev'

function resolveDriverPhotoUrl(value?: string | null) {
  if (!value) {
    return undefined
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return undefined
  }

  if (/^https?:\/\//i.test(normalizedValue) || normalizedValue.startsWith('data:') || normalizedValue.startsWith('blob:')) {
    return normalizedValue
  }

  if (r2PublicBaseUrl) {
    return new URL(normalizedValue.replace(/^\/+/, ''), `${r2PublicBaseUrl.replace(/\/+$/, '')}/`).toString()
  }

  return normalizedValue
}

function normalizeMotorista<T extends MotoristaListItem & ApiMotoristaImageFields>(motorista: T): T {
  const fotoUrl = resolveDriverPhotoUrl(
    motorista.foto_url ??
      motorista.foto_public_url ??
      motorista.foto_r2_url ??
      motorista.foto_path ??
      motorista.foto_key ??
      motorista.foto,
  )

  return {
    ...motorista,
    foto_url: fotoUrl,
  }
}

export const motoristaService = {
  async list(params: ListMotoristasParams) {
    const response = await api.get<PaginatedApiResponse<Array<MotoristaListItem & ApiMotoristaImageFields>>>('/admin/motoristas', {
      params,
    })

    return {
      ...response.data,
      data: response.data.data.map((item) => normalizeMotorista(item)),
    }
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<Motorista & ApiMotoristaImageFields>>(`/admin/motoristas/${id}`)

    return {
      ...response.data,
      data: normalizeMotorista(response.data.data),
    }
  },

  async create(payload: MotoristaFormData) {
    const response = await api.post<ApiResponse<Motorista & ApiMotoristaImageFields>>('/admin/motoristas', payload)

    return {
      ...response.data,
      data: normalizeMotorista(response.data.data),
    }
  },

  async update(id: string | number, payload: MotoristaFormData) {
    const response = await api.put<ApiResponse<Motorista & ApiMotoristaImageFields>>(`/admin/motoristas/${id}`, payload)

    return {
      ...response.data,
      data: normalizeMotorista(response.data.data),
    }
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/motoristas/${id}`)
    return response.data
  },

  async updateStatus(id: string | number, status: MotoristaStatus) {
    const response = await api.patch<ApiResponse<Motorista & ApiMotoristaImageFields>>(`/admin/motoristas/${id}/status`, { status })

    return {
      ...response.data,
      data: normalizeMotorista(response.data.data),
    }
  },

  async uploadPhoto(id: string | number, file: File) {
    const formData = new FormData()
    formData.append('foto', file)

    const response = await api.post<ApiResponse<Motorista & ApiMotoristaImageFields>>(`/admin/motoristas/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      ...response.data,
      data: normalizeMotorista(response.data.data),
    }
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
