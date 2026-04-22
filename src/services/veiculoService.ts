import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type VeiculoStatus = 'disponivel' | 'em_uso' | 'manutencao' | 'inativo'
export type VeiculoTipo = 'truck' | 'bitruck' | 'carreta' | 'toco' | 'vuc' | 'van' | 'utilitario' | 'outro'

export type VeiculoListItem = {
  id: number
  placa: string
  modelo: string
  marca: string
  ano: number
  tipo: VeiculoTipo
  status: VeiculoStatus
  km_atual: number
  capacidade_carga_kg: number
}

export type Veiculo = VeiculoListItem & {
  renavam: string
  vencimento_seguro: string
  vencimento_licenciamento: string
  vencimento_ipva: string
  seguradora: string
  numero_apolice: string
  observacoes: string
}

export type VeiculoFormData = {
  placa: string
  modelo: string
  marca: string
  ano: number | string
  tipo: VeiculoTipo
  capacidade_carga_kg: number | string
  renavam: string
  km_atual: number | string
  status: VeiculoStatus
  vencimento_seguro: string
  vencimento_licenciamento: string
  vencimento_ipva: string
  seguradora: string
  numero_apolice: string
  observacoes: string
}

export type VeiculoCustos = {
  custo_combustivel: number
  custo_manutencao: number
  custo_total: number
}

export type VeiculoConsumo = {
  total_abastecimentos: number
  total_litros: number
  km_percorridos: number
  consumo_km_por_litro: number
  custo_combustivel: number
}

export type VeiculoHistoricoItem = {
  id: number
  tipo?: string
  titulo?: string
  descricao?: string
  data?: string
  status?: string
}

type ListVeiculosParams = {
  search?: string
  status?: string
  tipo?: string
  page?: number
  limit?: number
}

type VeiculoPayload = {
  placa: string
  modelo: string
  marca: string
  ano: number
  tipo: VeiculoTipo
  capacidade_carga_kg: string
  renavam: string
  km_atual: string
  status: VeiculoStatus
  vencimento_seguro: string
  vencimento_licenciamento: string
  vencimento_ipva: string
  seguradora: string
  numero_apolice: string
  observacoes: string
}

function normalizeVeiculoPayload(payload: VeiculoFormData): VeiculoPayload {
  return {
    placa: payload.placa.trim().toUpperCase(),
    modelo: payload.modelo.trim(),
    marca: payload.marca.trim(),
    ano: Number(payload.ano),
    tipo: payload.tipo,
    capacidade_carga_kg: String(payload.capacidade_carga_kg ?? '').trim(),
    renavam: payload.renavam.trim(),
    km_atual: String(payload.km_atual ?? '').trim(),
    status: payload.status,
    vencimento_seguro: payload.vencimento_seguro,
    vencimento_licenciamento: payload.vencimento_licenciamento,
    vencimento_ipva: payload.vencimento_ipva,
    seguradora: payload.seguradora.trim(),
    numero_apolice: payload.numero_apolice.trim(),
    observacoes: payload.observacoes.trim(),
  }
}

export const veiculoService = {
  async list(params: ListVeiculosParams) {
    const response = await api.get<PaginatedApiResponse<VeiculoListItem[]>>('/admin/veiculos', { params })
    return response.data
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<Veiculo>>(`/admin/veiculos/${id}`)
    return response.data
  },

  async create(payload: VeiculoFormData) {
    const response = await api.post<ApiResponse<Veiculo>>('/admin/veiculos', normalizeVeiculoPayload(payload))
    return response.data
  },

  async update(id: string | number, payload: VeiculoFormData) {
    const response = await api.put<ApiResponse<Veiculo>>(`/admin/veiculos/${id}`, normalizeVeiculoPayload(payload))
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/veiculos/${id}`)
    return response.data
  },

  async getCustos(id: string | number) {
    const response = await api.get<ApiResponse<VeiculoCustos>>(`/admin/veiculos/${id}/custos`)
    return response.data
  },

  async getConsumo(id: string | number) {
    const response = await api.get<ApiResponse<VeiculoConsumo>>(`/admin/veiculos/${id}/consumo`)
    return response.data
  },

  async getHistorico(id: string | number) {
    const response = await api.get<ApiResponse<VeiculoHistoricoItem[]>>(`/admin/veiculos/${id}/historico`)
    return response.data
  },
}
