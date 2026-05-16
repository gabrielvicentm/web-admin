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

export type RelatorioFolhaPagamentoParams = {
  competencia?: string
  search?: string
  status_funcionario?: string
  status_folha?: string
}

export type RelatorioFolhaPagamentoResumo = {
  competencia: string
  total_funcionarios: number
  folhas_com_registro: number
  folhas_abertas: number
  folhas_fechadas: number
  folhas_pagas: number
  salario_base_total: number
  total_proventos: number
  total_descontos: number
  salario_liquido_total: number
}

export type RelatorioOperacionalTipo = 'combustivel' | 'manutencoes' | 'custos' | 'desempenho' | 'lucro-por-viagem'

export type RelatorioOperacionalParams = {
  data_de?: string
  data_ate?: string
  motorista_id?: string
  veiculo_id?: string
  cliente_id?: string
}

type RelatorioViagensResponse = {
  items: Array<Record<string, unknown>>
  total: number
}

type RelatorioFolhaPagamentoResponse = {
  items: Array<Record<string, unknown>>
  total: number
  resumo: RelatorioFolhaPagamentoResumo
}

type RelatorioOperacionalResponse = {
  items: Array<Record<string, unknown>>
  total: number
  resumo: Record<string, unknown>
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

  async listarFolhaPagamento(params: RelatorioFolhaPagamentoParams) {
    const response = await reportsApi.get<RelatorioFolhaPagamentoResponse>('/relatorios/folha-pagamento', { params })
    return response.data
  },

  async baixarFolhaPagamentoXlsx(params: RelatorioFolhaPagamentoParams) {
    const response = await reportsApi.get('/relatorios/folha-pagamento/xlsx', {
      params,
      responseType: 'blob',
    })

    return response.data as Blob
  },

  async listarOperacional(tipo: RelatorioOperacionalTipo, params: RelatorioOperacionalParams) {
    const response = await reportsApi.get<RelatorioOperacionalResponse>(`/relatorios/${tipo}`, { params })
    return response.data
  },

  async baixarOperacionalCsv(tipo: RelatorioOperacionalTipo, params: RelatorioOperacionalParams) {
    const response = await reportsApi.get(`/relatorios/${tipo}/csv`, {
      params,
      responseType: 'blob',
    })

    return response.data as Blob
  },

  async baixarOperacionalXlsx(tipo: RelatorioOperacionalTipo, params: RelatorioOperacionalParams) {
    const response = await reportsApi.get(`/relatorios/${tipo}/xlsx`, {
      params,
      responseType: 'blob',
    })

    return response.data as Blob
  },
}
