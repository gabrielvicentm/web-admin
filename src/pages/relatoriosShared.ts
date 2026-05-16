import axios from 'axios'
import { useEffect, useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import {
  FuelIcon,
  PayrollIcon,
  ReportIcon,
  RouteIcon,
  TruckIcon,
  UserBadgeIcon,
  WrenchIcon,
} from '../components/dashboard/DashboardIcons'
import { clienteService, type Cliente } from '../services/clienteService'
import { motoristaService, type MotoristaListItem } from '../services/motoristaService'
import type {
  RelatorioFolhaPagamentoParams,
  RelatorioOperacionalParams,
  RelatorioOperacionalTipo,
  RelatorioViagensParams,
} from '../services/relatoriosService'
import {
  veiculoService,
  type VeiculoConsumoMedioItem,
  type VeiculoCustoTotalItem,
  type VeiculoListItem,
} from '../services/veiculoService'

type DashboardIcon = ComponentType<SVGProps<SVGSVGElement>>

type ReportDirectoryItem = {
  value: 'viagens' | 'folha-pagamento' | RelatorioOperacionalTipo
  title: string
  description: string
  to: string
  tone: 'blue' | 'cyan' | 'green' | 'orange'
  icon: DashboardIcon
  chips: string[]
}

export type PreviewRow = Record<string, unknown>
export type PreviewStatus = 'idle' | 'loading' | 'success' | 'error'
export type FleetRankingStatus = 'idle' | 'loading' | 'success' | 'error'
export type ReportFilterOptionData = {
  clientes: Cliente[]
  motoristas: MotoristaListItem[]
  veiculos: VeiculoListItem[]
  isLoadingFilters: boolean
  filtersFeedback: string
}
export type OperationalReportOption = {
  value: RelatorioOperacionalTipo
  title: string
  description: string
  filename: string
  availableFilters: Array<'motorista_id' | 'veiculo_id' | 'cliente_id'>
  previewColumns: string[]
  summaryKeys: string[]
  chips: string[]
}
export type FleetRankingData = {
  consumoRanking: VeiculoConsumoMedioItem[]
  custosRanking: VeiculoCustoTotalItem[]
  fleetRankingStatus: FleetRankingStatus
}

const currencyKeys = new Set([
  'valor_total',
  'ticket_medio',
  'custo_total',
  'custo',
  'custo_combustivel',
  'custo_manutencao',
  'custo_medio_por_viagem',
  'lucro_operacional',
  'total_frete',
  'frete_total',
  'lucro_total',
  'frete_medio_por_viagem',
  'lucro_medio_por_viagem',
  'valor_frete',
  'custo_manutencao_rateado',
  'lucro_viagem',
])

const numericKeys = new Set([
  'litros',
  'total_litros',
  'total_km',
  'km_percorridos',
  'consumo_km_por_litro',
  'margem_media',
  'margem_lucro_percentual',
])

export const tripStatusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

export const funcionarioStatusOptions = [
  { value: '', label: 'Todos os funcionarios' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'ferias', label: 'Ferias' },
  { value: 'afastado', label: 'Afastado' },
  { value: 'desligado', label: 'Desligado' },
] as const

export const folhaStatusOptions = [
  { value: '', label: 'Todos os status da folha' },
  { value: 'aberta', label: 'Aberta' },
  { value: 'fechada', label: 'Fechada' },
  { value: 'paga', label: 'Paga' },
] as const

export const initialTripFilters: RelatorioViagensParams = {
  data_saida_de: '',
  data_saida_ate: '',
  motorista_id: '',
  veiculo_id: '',
  cliente_id: '',
  status: '',
}

export const folhaPreviewColumns = [
  'nome',
  'cargo',
  'setor',
  'status_funcionario',
  'status_folha',
  'salario_base',
  'total_proventos',
  'total_descontos',
  'salario_liquido',
] as const

export const folhaPreviewColumnLabels: Record<(typeof folhaPreviewColumns)[number], string> = {
  nome: 'Funcionario',
  cargo: 'Cargo',
  setor: 'Setor',
  status_funcionario: 'Status Funcionario',
  status_folha: 'Status Folha',
  salario_base: 'Salario Base',
  total_proventos: 'Total Proventos',
  total_descontos: 'Total Descontos',
  salario_liquido: 'Salario Liquido',
}

export const operationalReportOptions: OperationalReportOption[] = [
  {
    value: 'combustivel',
    title: 'Relatorio de combustivel',
    description: 'Abastecimentos com custo, litros, fornecedor, motorista, veiculo e cliente vinculado.',
    filename: 'relatorio_combustivel',
    availableFilters: ['motorista_id', 'veiculo_id', 'cliente_id'],
    previewColumns: ['registrado_em', 'motorista_nome', 'veiculo_placa', 'cliente_nome', 'tipo_combustivel', 'litros', 'valor_total'],
    summaryKeys: ['total_abastecimentos', 'total_litros', 'custo_total', 'ticket_medio'],
    chips: ['Abastecimentos', 'CSV e XLSX'],
  },
  {
    value: 'manutencoes',
    title: 'Relatorio de manutencoes',
    description: 'Historico de manutencoes com custo, oficina, status e datas de referencia.',
    filename: 'relatorio_manutencoes',
    availableFilters: ['veiculo_id'],
    previewColumns: ['data_referencia', 'veiculo_placa', 'tipo', 'status', 'oficina', 'custo'],
    summaryKeys: ['total_manutencoes', 'custo_total', 'agendadas', 'concluidas'],
    chips: ['Oficina', 'Status e custo'],
  },
  {
    value: 'custos',
    title: 'Relatorio de custos operacionais',
    description: 'Consolidado por veiculo com custo total, frete, lucro operacional e custo medio por viagem.',
    filename: 'relatorio_custos_operacionais',
    availableFilters: ['motorista_id', 'veiculo_id', 'cliente_id'],
    previewColumns: ['veiculo_placa', 'total_viagens', 'total_km', 'total_frete', 'custo_total', 'lucro_operacional'],
    summaryKeys: ['total_veiculos', 'total_viagens', 'total_frete', 'custo_total', 'lucro_operacional'],
    chips: ['Custo total por veiculo', 'Frete e lucro'],
  },
  {
    value: 'desempenho',
    title: 'Relatorio de desempenho',
    description: 'Resultado por motorista com viagens, km, consumo, frete e lucro do periodo.',
    filename: 'relatorio_desempenho',
    availableFilters: ['motorista_id', 'veiculo_id', 'cliente_id'],
    previewColumns: ['motorista_nome', 'total_viagens', 'total_km', 'total_frete', 'consumo_km_por_litro', 'lucro_total'],
    summaryKeys: ['total_motoristas', 'total_viagens', 'total_km', 'total_frete', 'lucro_total'],
    chips: ['Motoristas', 'Produtividade'],
  },
  {
    value: 'lucro-por-viagem',
    title: 'Relatorio de lucro por viagem',
    description: 'Calculo do lucro por viagem subtraindo combustivel e manutencao rateada do frete.',
    filename: 'relatorio_lucro_por_viagem',
    availableFilters: ['motorista_id', 'veiculo_id', 'cliente_id'],
    previewColumns: ['data_saida', 'motorista_nome', 'veiculo_placa', 'cliente_nome', 'valor_frete', 'custo_total', 'lucro_viagem'],
    summaryKeys: ['total_viagens', 'frete_total', 'custo_total', 'lucro_total', 'margem_media'],
    chips: ['Lucro por viagem', 'Frete menos custos'],
  },
]

export const reportDirectoryItems: ReportDirectoryItem[] = [
  {
    value: 'viagens',
    title: 'Relatorio de viagens',
    description: 'Filtre por periodo, status, motorista, veiculo e cliente antes de exportar.',
    to: '/dashboard/relatorios/viagens',
    tone: 'blue',
    icon: RouteIcon,
    chips: ['CSV e XLSX', 'Data, motorista, veiculo e cliente'],
  },
  {
    value: 'folha-pagamento',
    title: 'Relatorio de folha de pagamento',
    description: 'Consulte a competencia, confira a previa e gere a planilha da folha.',
    to: '/dashboard/relatorios/folha-pagamento',
    tone: 'green',
    icon: PayrollIcon,
    chips: ['XLSX', 'Competencia e status'],
  },
  {
    value: 'combustivel',
    title: 'Relatorio de combustivel',
    description: 'Acompanhe abastecimentos, litros, valor e cliente vinculado.',
    to: '/dashboard/relatorios/combustivel',
    tone: 'cyan',
    icon: FuelIcon,
    chips: ['CSV e XLSX', 'Consumo e ticket medio'],
  },
  {
    value: 'manutencoes',
    title: 'Relatorio de manutencoes',
    description: 'Veja custos, oficina, status e datas de referencia por veiculo.',
    to: '/dashboard/relatorios/manutencoes',
    tone: 'orange',
    icon: WrenchIcon,
    chips: ['CSV e XLSX', 'Historico por veiculo'],
  },
  {
    value: 'custos',
    title: 'Relatorio de custos operacionais',
    description: 'Consolidado com frete, custo total e lucro operacional por veiculo.',
    to: '/dashboard/relatorios/custos',
    tone: 'blue',
    icon: TruckIcon,
    chips: ['CSV e XLSX', 'Custo total por veiculo'],
  },
  {
    value: 'desempenho',
    title: 'Relatorio de desempenho',
    description: 'Compare produtividade, km, consumo e lucro por motorista.',
    to: '/dashboard/relatorios/desempenho',
    tone: 'green',
    icon: UserBadgeIcon,
    chips: ['CSV e XLSX', 'Desempenho por motorista'],
  },
  {
    value: 'lucro-por-viagem',
    title: 'Relatorio de lucro por viagem',
    description: 'Calcule o lucro de cada viagem com frete menos custos operacionais.',
    to: '/dashboard/relatorios/lucro-por-viagem',
    tone: 'cyan',
    icon: ReportIcon,
    chips: ['CSV e XLSX', 'Lucro por viagem'],
  },
]

export function buildInitialOperationalFilters(): RelatorioOperacionalParams {
  const today = new Date().toISOString().slice(0, 10)
  return {
    data_de: '',
    data_ate: today,
    motorista_id: '',
    veiculo_id: '',
    cliente_id: '',
  }
}

export function getCurrentCompetencia() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function buildInitialFolhaFilters(): RelatorioFolhaPagamentoParams {
  return {
    competencia: getCurrentCompetencia(),
    search: '',
    status_funcionario: '',
    status_folha: '',
  }
}

export function formatCurrency(value?: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
}

export function formatNumber(value?: number | string, suffix = '') {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))

  return suffix ? `${formatted} ${suffix}` : formatted
}

export function formatSummaryLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-')
      return `${day}/${month}/${year}`
    }

    const maybeDate = new Date(value)
    if (!Number.isNaN(maybeDate.getTime()) && /[tT:]/.test(value)) {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(maybeDate)
    }
  }

  return String(value)
}

export function formatPayrollCellValue(column: (typeof folhaPreviewColumns)[number], value: unknown) {
  if (column === 'salario_base' || column === 'total_proventos' || column === 'total_descontos' || column === 'salario_liquido') {
    return formatCurrency(Number(value ?? 0))
  }

  return formatCellValue(value)
}

export function formatOperationalValue(column: string, value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (currencyKeys.has(column)) {
    return formatCurrency(Number(value))
  }

  if (numericKeys.has(column)) {
    return formatNumber(Number(value))
  }

  return formatCellValue(value)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export function isOperationalReportType(value: string): value is RelatorioOperacionalTipo {
  return operationalReportOptions.some((item) => item.value === value)
}

export function getOperationalReportOption(value: RelatorioOperacionalTipo) {
  return operationalReportOptions.find((item) => item.value === value) ?? operationalReportOptions[0]
}

export function useReportFilterOptions(): ReportFilterOptionData {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motoristas, setMotoristas] = useState<MotoristaListItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [filtersFeedback, setFiltersFeedback] = useState('')

  useEffect(() => {
    async function loadFilters() {
      try {
        setIsLoadingFilters(true)
        setFiltersFeedback('')

        const [clientesResponse, motoristasResponse, veiculosResponse] = await Promise.all([
          clienteService.list({ page: 1, limit: 100 }),
          motoristaService.list({ status: 'ativo', page: 1, limit: 100 }),
          veiculoService.list({ page: 1, limit: 100 }),
        ])

        setClientes(clientesResponse.data)
        setMotoristas(motoristasResponse.data)
        setVeiculos(veiculosResponse.data)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setFiltersFeedback(
            typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel carregar os filtros.',
          )
        } else {
          setFiltersFeedback('Nao foi possivel carregar os filtros.')
        }
      } finally {
        setIsLoadingFilters(false)
      }
    }

    void loadFilters()
  }, [])

  return { clientes, motoristas, veiculos, isLoadingFilters, filtersFeedback }
}

export function useFleetRankings(search: string): FleetRankingData {
  const [consumoRanking, setConsumoRanking] = useState<VeiculoConsumoMedioItem[]>([])
  const [custosRanking, setCustosRanking] = useState<VeiculoCustoTotalItem[]>([])
  const [fleetRankingStatus, setFleetRankingStatus] = useState<FleetRankingStatus>('idle')

  useEffect(() => {
    async function loadFleetRankings() {
      try {
        setFleetRankingStatus('loading')

        const [consumoResponse, custosResponse] = await Promise.all([
          veiculoService.listConsumoMedio({ search, page: 1, limit: 8 }),
          veiculoService.listCustosTotais({ search, page: 1, limit: 8 }),
        ])

        setConsumoRanking(consumoResponse.data)
        setCustosRanking(custosResponse.data)
        setFleetRankingStatus('success')
      } catch {
        setConsumoRanking([])
        setCustosRanking([])
        setFleetRankingStatus('error')
      }
    }

    void loadFleetRankings()
  }, [search])

  return { consumoRanking, custosRanking, fleetRankingStatus }
}
