import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type FuncionarioStatus = 'ativo' | 'inativo' | 'ferias' | 'afastado' | 'desligado'
export type FuncionarioTipo = 'funcionario' | 'motorista'
export type FuncionarioTipoContrato = 'clt' | 'pj' | 'temporario' | 'estagio' | 'aprendiz' | 'terceirizado' | 'outro'
export type FuncionarioTipoPagamento = 'mensal' | 'quinzenal' | 'semanal' | 'diario' | 'hora'
export type FuncionarioTipoConta = 'corrente' | 'poupanca' | 'salario' | 'pix'

export type FuncionarioListItem = {
  id: string
  nome: string
  cpf: string
  foto_url?: string
  telefone: string
  email: string
  cargo: string
  setor: string
  status: FuncionarioStatus
  tipo: FuncionarioTipo
  is_motorista: boolean
  data_admissao: string
  salario_base: number
}

export type Funcionario = FuncionarioListItem & {
  rg: string
  data_nascimento: string
  cep: string
  endereco: string
  complemento: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  tipo_contrato: FuncionarioTipoContrato
  data_demissao: string
  tipo_pagamento: FuncionarioTipoPagamento
  valor_hora_extra: number
  adicional_noturno: number
  vale_alimentacao: number
  outros_descontos: number
  banco: string
  agencia: string
  conta: string
  tipo_conta: FuncionarioTipoConta
  chave_pix: string
  horario_entrada: string
  horario_saida: string
  horario_almoco: string
  horas_extras: number
  faltas: number
  atestados: number
  observacoes: string
}

export type FuncionarioFormData = {
  nome: string
  cpf: string
  rg: string
  data_nascimento: string
  telefone: string
  email: string
  cep: string
  endereco: string
  complemento: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cargo: string
  setor: string
  tipo_contrato: FuncionarioTipoContrato
  data_admissao: string
  data_demissao: string
  status: FuncionarioStatus
  salario_base: number
  tipo_pagamento: FuncionarioTipoPagamento
  valor_hora_extra: number
  adicional_noturno: number
  vale_alimentacao: number
  outros_descontos: number
  banco: string
  agencia: string
  conta: string
  tipo_conta: FuncionarioTipoConta
  chave_pix: string
  horario_entrada: string
  horario_saida: string
  horario_almoco: string
  horas_extras: number
  faltas: number
  atestados: number
  observacoes: string
}

type ListFuncionariosParams = {
  search?: string
  status?: string
  tipo?: string
  page?: number
  limit?: number
  include_motoristas?: boolean
}

type ApiFuncionarioImageFields = {
  foto_url?: string | null
}

const r2PublicBaseUrl = 'https://pub-f4e4a14a40454d748b2db48ccf60e04c.r2.dev'

function resolveFuncionarioPhotoUrl(value?: string | null) {
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

function normalizeFuncionario<T extends FuncionarioListItem & ApiFuncionarioImageFields>(funcionario: T): T {
  return {
    ...funcionario,
    foto_url: resolveFuncionarioPhotoUrl(funcionario.foto_url),
  }
}

export const funcionarioService = {
  async list(params: ListFuncionariosParams) {
    const response = await api.get<PaginatedApiResponse<Array<FuncionarioListItem & ApiFuncionarioImageFields>>>('/admin/funcionarios', { params })

    return {
      ...response.data,
      data: response.data.data.map((item) => normalizeFuncionario(item)),
    }
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<Funcionario & ApiFuncionarioImageFields>>(`/admin/funcionarios/${id}`)

    return {
      ...response.data,
      data: normalizeFuncionario(response.data.data),
    }
  },

  async create(payload: FuncionarioFormData) {
    const response = await api.post<ApiResponse<Funcionario & ApiFuncionarioImageFields>>('/admin/funcionarios', payload)

    return {
      ...response.data,
      data: normalizeFuncionario(response.data.data),
    }
  },

  async update(id: string, payload: FuncionarioFormData) {
    const response = await api.put<ApiResponse<Funcionario & ApiFuncionarioImageFields>>(`/admin/funcionarios/${id}`, payload)

    return {
      ...response.data,
      data: normalizeFuncionario(response.data.data),
    }
  },

  async remove(id: string) {
    const response = await api.delete<ApiResponse<null>>(`/admin/funcionarios/${id}`)
    return response.data
  },

  async updateStatus(id: string, status: FuncionarioStatus) {
    const response = await api.patch<ApiResponse<Funcionario & ApiFuncionarioImageFields>>(`/admin/funcionarios/${id}/status`, { status })

    return {
      ...response.data,
      data: normalizeFuncionario(response.data.data),
    }
  },

  async uploadPhoto(id: string, file: File) {
    const formData = new FormData()
    formData.append('foto', file)

    const response = await api.post<ApiResponse<Funcionario & ApiFuncionarioImageFields>>(`/admin/funcionarios/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return {
      ...response.data,
      data: normalizeFuncionario(response.data.data),
    }
  },
}
