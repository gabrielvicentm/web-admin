import { api } from './api'
import type { ApiResponse } from './httpTypes'

export type DashboardSnapshot = {
  summary: {
    total_viagens: number
    viagens_hoje: number
    viagens_em_andamento: number
    viagens_pendentes: number
    viagens_atrasadas: number
    veiculos_em_uso: number
    veiculos_indisponiveis: number
    manutencoes_em_andamento: number
    motoristas_ativos: number
    motoristas_cnh_vencendo: number
    alertas_pendencias_total: number
    alertas_criticos_total: number
  }
  metrics: {
    gasto_operacional_hoje: number
    gasto_abastecimento_hoje: number
    gasto_manutencao_hoje: number
    viagens_concluidas_hoje: number
    abastecimentos_hoje: number
    finalizacoes_pendentes: number
    ocorrencias_hoje: number
    paradas_abertas: number
    disponibilidade_frota: number
  }
  alerts: {
    operational: string[]
    fleet: string[]
  }
  activities: Array<{
    id: string
    vehicle: string
    driver: string
    route: string
    status: string
  }>
  updated_at: string
}

export const dashboardService = {
  async getSnapshot() {
    const response = await api.get<ApiResponse<DashboardSnapshot>>('admin/dashboard')
    return response.data
  },
}
