import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type Cliente = {
  id: number
  nome: string
  cpf_cnpj: string
  telefone: string
  email: string
}

export type ClienteFormData = {
  nome: string
  cpf_cnpj: string
  telefone: string
  email: string
}

type ListClientesParams = {
  search?: string
  page?: number
  limit?: number
}

export const clienteService = {
  async list(params: ListClientesParams) {
    const response = await api.get<PaginatedApiResponse<Cliente[]>>('/admin/clientes', { params })
    return response.data
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<Cliente>>(`/admin/clientes/${id}`)
    return response.data
  },

  async create(payload: ClienteFormData) {
    const response = await api.post<ApiResponse<Cliente>>('/admin/clientes', payload)
    return response.data
  },

  async update(id: string | number, payload: ClienteFormData) {
    const response = await api.put<ApiResponse<Cliente>>(`/admin/clientes/${id}`, payload)
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/clientes/${id}`)
    return response.data
  },
}
