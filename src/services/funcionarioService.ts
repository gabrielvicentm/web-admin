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

export const funcionarioService = {
  async list(params: ListFuncionariosParams) {
    const response = await api.get<PaginatedApiResponse<FuncionarioListItem[]>>('/admin/funcionarios', { params })
    return response.data
  },

  async getById(id: string) {
    const response = await api.get<ApiResponse<Funcionario>>(`/admin/funcionarios/${id}`)
    return response.data
  },

  async create(payload: FuncionarioFormData) {
    const response = await api.post<ApiResponse<Funcionario>>('/admin/funcionarios', payload)
    return response.data
  },

  async update(id: string, payload: FuncionarioFormData) {
    const response = await api.put<ApiResponse<Funcionario>>(`/admin/funcionarios/${id}`, payload)
    return response.data
  },

  async remove(id: string) {
    const response = await api.delete<ApiResponse<null>>(`/admin/funcionarios/${id}`)
    return response.data
  },

  async updateStatus(id: string, status: FuncionarioStatus) {
    const response = await api.patch<ApiResponse<Funcionario>>(`/admin/funcionarios/${id}/status`, { status })
    return response.data
  },
}
