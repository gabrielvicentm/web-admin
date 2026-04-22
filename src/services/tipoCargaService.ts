import { api } from './api'
import type { ApiResponse, PaginatedApiResponse } from './httpTypes'

export type TipoCarga = {
  id: number
  nome: string
  descricao: string
}

export type TipoCargaFormData = {
  nome: string
  descricao: string
}

type ListTiposCargaParams = {
  search?: string
  page?: number
  limit?: number
}

export const tipoCargaService = {
  async list(params: ListTiposCargaParams) {
    const response = await api.get<PaginatedApiResponse<TipoCarga[]>>('/admin/tipos-carga', { params })
    return response.data
  },

  async getById(id: string | number) {
    const response = await api.get<ApiResponse<TipoCarga>>(`/admin/tipos-carga/${id}`)
    return response.data
  },

  async create(payload: TipoCargaFormData) {
    const response = await api.post<ApiResponse<TipoCarga>>('/admin/tipos-carga', payload)
    return response.data
  },

  async update(id: string | number, payload: TipoCargaFormData) {
    const response = await api.put<ApiResponse<TipoCarga>>(`/admin/tipos-carga/${id}`, payload)
    return response.data
  },

  async remove(id: string | number) {
    const response = await api.delete<ApiResponse<null>>(`/admin/tipos-carga/${id}`)
    return response.data
  },
}
