import { api } from './api'
import type { ApiResponse } from './httpTypes'

export type FolhaPagamentoStatus = 'aberta' | 'fechada' | 'paga'

export type FolhaPagamentoResumo = {
  funcionario_id: string
  nome: string
  cargo: string
  setor: string
  status_funcionario: string
  status_folha: FolhaPagamentoStatus
  competencia: string
  salario_base: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
  dias_faltas: number
  dias_ferias: number
  horas_extras_50: number
  horas_extras_100: number
  registro_existente: boolean
}

export type FolhaPagamentoFuncionario = {
  id: string
  nome: string
  cargo: string
  setor: string
  status: string
  tipo_pagamento: string
  is_motorista: boolean
}

export type FolhaPagamentoFormData = {
  competencia: string
  salario_base_snapshot: number
  valor_hora_extra_snapshot: number
  vale_alimentacao_snapshot: number
  outros_descontos_snapshot: number
  dias_faltas: number
  dias_atestado: number
  dias_ferias: number
  dias_afastamento: number
  horas_extras_50: number
  horas_extras_100: number
  horas_adicional_noturno: number
  bonus: number
  comissoes: number
  outros_proventos: number
  adiantamentos: number
  desconto_inss: number
  desconto_irrf: number
  desconto_vale_transporte: number
  descontos_manuais: number
  observacoes: string
  status: FolhaPagamentoStatus
}

export type FolhaPagamentoCalculo = {
  salario_base: number
  valor_dia: number
  valor_hora: number
  valor_hora_extra_50: number
  valor_hora_extra_100: number
  valor_adicional_noturno: number
  valor_ferias: number
  terco_ferias: number
  desconto_faltas: number
  desconto_afastamento: number
  desconto_ferias: number
  total_proventos: number
  total_descontos: number
  salario_liquido: number
}

export type FolhaPagamentoDetalhe = {
  funcionario: FolhaPagamentoFuncionario
  folha: FolhaPagamentoFormData
  calculo: FolhaPagamentoCalculo
  registro_existente: boolean
}

type ListFolhaParams = {
  competencia: string
  search?: string
  status?: string
}

export const folhaPagamentoService = {
  async list(params: ListFolhaParams) {
    const response = await api.get<ApiResponse<FolhaPagamentoResumo[]>>('/admin/folha-pagamento', { params })
    return response.data
  },

  async getByFuncionario(id: string, competencia: string) {
    const response = await api.get<ApiResponse<FolhaPagamentoDetalhe>>(`/admin/funcionarios/${id}/folha-pagamento`, {
      params: { competencia },
    })
    return response.data
  },

  async save(id: string, payload: FolhaPagamentoFormData) {
    const response = await api.put<ApiResponse<FolhaPagamentoDetalhe>>(`/admin/funcionarios/${id}/folha-pagamento`, payload)
    return response.data
  },
}
