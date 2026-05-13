import axios from 'axios'
import { attachAuthInterceptors } from './api'

export type RelatorioViagensParams = {
  data_saida_de?: string
  data_saida_ate?: string
  motorista_id?: string
  veiculo_id?: string
  cliente_id?: string
  status?: string
}

type RelatorioViagensResponse = {
  items: Array<Record<string, unknown>>
  total: number
}

const reportsApi = axios.create({
  baseURL: '/reports-api',
})

attachAuthInterceptors(reportsApi)

export const relatoriosService = {
  async listarViagens(params: RelatorioViagensParams) {
    const response = await reportsApi.get<RelatorioViagensResponse>('/relatorios/viagens', { params })
    return response.data
  },

  async baixarViagensCsv(params: RelatorioViagensParams) {
    const response = await reportsApi.get('/relatorios/viagens/csv', {
      params,
      responseType: 'blob',
    })

    return response.data as Blob
  },

  async baixarViagensXlsx(params: RelatorioViagensParams) {
    const response = await reportsApi.get('/relatorios/viagens/xlsx', {
      params,
      responseType: 'blob',
    })

    return response.data as Blob
  },
}
