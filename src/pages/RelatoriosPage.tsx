import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { clienteService, type Cliente } from '../services/clienteService'
import { motoristaService, type MotoristaListItem } from '../services/motoristaService'
import { relatoriosService, type RelatorioViagensParams } from '../services/relatoriosService'
import {
  veiculoService,
  type VeiculoConsumoMedioItem,
  type VeiculoCustoTotalItem,
  type VeiculoListItem,
} from '../services/veiculoService'

type PreviewRow = Record<string, unknown>
type PreviewStatus = 'idle' | 'loading' | 'success' | 'error'
type FleetRankingStatus = 'idle' | 'loading' | 'success' | 'error'

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

const initialFilters: RelatorioViagensParams = {
  data_saida_de: '',
  data_saida_ate: '',
  motorista_id: '',
  veiculo_id: '',
  cliente_id: '',
  status: '',
}

function formatBrazilianDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function buildApiDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) {
    return ''
  }

  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

function formatCurrency(value?: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
}

function formatNumber(value?: number | string, suffix = '') {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))

  return suffix ? `${formatted} ${suffix}` : formatted
}

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'string') {
    const maybeDate = new Date(value)
    if (!Number.isNaN(maybeDate.getTime()) && /[tT:]/.test(value)) {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(maybeDate)
    }
  }

  return String(value)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export function RelatoriosPage() {
  const [filters, setFilters] = useState<RelatorioViagensParams>(initialFilters)
  const [dataSaidaDeInput, setDataSaidaDeInput] = useState('')
  const [dataSaidaAteInput, setDataSaidaAteInput] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [motoristas, setMotoristas] = useState<MotoristaListItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('idle')
  const [fleetSearch, setFleetSearch] = useState('')
  const [consumoRanking, setConsumoRanking] = useState<VeiculoConsumoMedioItem[]>([])
  const [custosRanking, setCustosRanking] = useState<VeiculoCustoTotalItem[]>([])
  const [fleetRankingStatus, setFleetRankingStatus] = useState<FleetRankingStatus>('idle')
  const [feedback, setFeedback] = useState('')
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportingXlsx, setIsExportingXlsx] = useState(false)

  const previewColumns = useMemo(() => {
    if (previewRows.length === 0) {
      return []
    }

    return Object.keys(previewRows[0])
  }, [previewRows])

  useEffect(() => {
    async function loadFilters() {
      try {
        setIsLoadingFilters(true)
        setFeedback('')

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
          setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel carregar os filtros.')
        } else {
          setFeedback('Nao foi possivel carregar os filtros.')
        }
      } finally {
        setIsLoadingFilters(false)
      }
    }

    void loadFilters()
  }, [])

  useEffect(() => {
    async function loadFleetRankings() {
      try {
        setFleetRankingStatus('loading')

        const [consumoResponse, custosResponse] = await Promise.all([
          veiculoService.listConsumoMedio({ search: fleetSearch, page: 1, limit: 8 }),
          veiculoService.listCustosTotais({ search: fleetSearch, page: 1, limit: 8 }),
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
  }, [fleetSearch])

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function handleDateFilterChange(field: 'data_saida_de' | 'data_saida_ate', value: string) {
    const formattedValue = formatBrazilianDate(value)

    if (field === 'data_saida_de') {
      setDataSaidaDeInput(formattedValue)
    } else {
      setDataSaidaAteInput(formattedValue)
    }

    setFilters((current) => ({
      ...current,
      [field]: buildApiDate(formattedValue),
    }))
  }

  function handleClearFilters() {
    setFilters(initialFilters)
    setDataSaidaDeInput('')
    setDataSaidaAteInput('')
    setPreviewRows([])
    setPreviewTotal(0)
    setPreviewStatus('idle')
    setFeedback('')
  }

  async function handlePreview() {
    try {
      setPreviewStatus('loading')
      setFeedback('')

      const response = await relatoriosService.listarViagens(filters)
      setPreviewRows(response.items.slice(0, 10))
      setPreviewTotal(response.total)
      setPreviewStatus('success')
    } catch (error) {
      setPreviewStatus('error')

      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel gerar a previa.')
      } else {
        setFeedback('Nao foi possivel gerar a previa.')
      }
    }
  }

  async function handleExportCsv() {
    try {
      setIsExportingCsv(true)
      setFeedback('')
      const blob = await relatoriosService.baixarViagensCsv(filters)
      downloadBlob(blob, 'relatorio_viagens.csv')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel exportar o CSV.')
      } else {
        setFeedback('Nao foi possivel exportar o CSV.')
      }
    } finally {
      setIsExportingCsv(false)
    }
  }

  async function handleExportXlsx() {
    try {
      setIsExportingXlsx(true)
      setFeedback('')
      const blob = await relatoriosService.baixarViagensXlsx(filters)
      downloadBlob(blob, 'relatorio_viagens.xlsx')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel exportar o XLSX.')
      } else {
        setFeedback('Nao foi possivel exportar o XLSX.')
      }
    } finally {
      setIsExportingXlsx(false)
    }
  }

  return (
    <section className="dashboard-home reports-page">
      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Relatorios</p>
          <h1 className="dashboard-title">Central de exportacoes</h1>
          <p className="dashboard-subtitle">
            Gere relatorios operacionais com filtros por periodo, motorista, veiculo e cliente. O microservico Python ja
            exporta viagens em CSV e XLSX.
          </p>
        </div>

        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">Microservico Python ativo</span>
          <span className="dashboard-chip">CSV e XLSX</span>
          <span className="dashboard-chip">Relatorio de viagens</span>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <div className="dashboard-layout-grid">
        <article className="dashboard-panel dashboard-panel--span-8 reports-builder">
          <div className="dashboard-panel__header">
            <div>
              <h2>Relatorio de viagens</h2>
              <p>Configure os filtros e gere a previa antes de exportar.</p>
            </div>
            <span className="dashboard-chip">{previewTotal} registro(s)</span>
          </div>

          <div className="reports-filters-grid">
            <label className="entity-field">
              <span>Data de saida inicial</span>
              <input
                name="data_saida_de_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataSaidaDeInput}
                onChange={(event) => handleDateFilterChange('data_saida_de', event.target.value)}
              />
            </label>
            <label className="entity-field">
              <span>Data de saida final</span>
              <input
                name="data_saida_ate_input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={dataSaidaAteInput}
                onChange={(event) => handleDateFilterChange('data_saida_ate', event.target.value)}
              />
            </label>
            <label className="entity-field">
              <span>Status</span>
              <select name="status" value={filters.status ?? ''} onChange={handleFilterChange}>
                {statusOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Motorista</span>
              <select name="motorista_id" value={filters.motorista_id ?? ''} onChange={handleFilterChange} disabled={isLoadingFilters}>
                <option value="">Todos</option>
                {motoristas.map((motorista) => (
                  <option key={motorista.id} value={String(motorista.id)}>
                    {motorista.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Veiculo</span>
              <select name="veiculo_id" value={filters.veiculo_id ?? ''} onChange={handleFilterChange} disabled={isLoadingFilters}>
                <option value="">Todos</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={String(veiculo.id)}>
                    {veiculo.placa} - {veiculo.modelo}
                  </option>
                ))}
              </select>
            </label>
            <label className="entity-field">
              <span>Cliente</span>
              <select name="cliente_id" value={filters.cliente_id ?? ''} onChange={handleFilterChange} disabled={isLoadingFilters}>
                <option value="">Todos</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={String(cliente.id)}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="reports-actions">
            <button className="entity-action entity-action--secondary" type="button" onClick={handleClearFilters}>
              Limpar filtros
            </button>
            <button className="entity-action entity-action--secondary" type="button" onClick={() => void handlePreview()}>
              {previewStatus === 'loading' ? 'Gerando previa...' : 'Visualizar previa'}
            </button>
            <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportCsv()} disabled={isExportingCsv}>
              {isExportingCsv ? 'Exportando CSV...' : 'Exportar CSV'}
            </button>
            <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportXlsx()} disabled={isExportingXlsx}>
              {isExportingXlsx ? 'Exportando XLSX...' : 'Exportar XLSX'}
            </button>
          </div>
        </article>

        <aside className="dashboard-panel dashboard-panel--span-4 reports-sidepanel">
          <div className="dashboard-panel__header">
            <div>
              <h2>Escopo atual</h2>
              <p>O primeiro fluxo ja esta pronto para uso.</p>
            </div>
          </div>

          <div className="dashboard-metric-stack">
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">1</div>
              <div>
                <p>Disponivel agora</p>
                <strong>Viagens</strong>
                <span>Previa JSON e exportacao em CSV/XLSX pelo servico Python.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">2</div>
              <div>
                <p>Disponivel agora</p>
                <strong>Ranking da frota</strong>
                <span>Consumo medio e custo total por veiculo conectados diretamente aos novos endpoints.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">3</div>
              <div>
                <p>Observacao tecnica</p>
                <strong>Servico separado</strong>
                <span>O frontend chama o microservico por proxy de desenvolvimento em <code>/reports-api</code>.</span>
              </div>
            </div>
          </div>
        </aside>

        <article className="dashboard-panel dashboard-panel--span-12 reports-preview">
          <div className="dashboard-panel__header">
            <div>
              <h2>Previa do relatorio</h2>
              <p>Exibindo ate 10 linhas para conferencia antes do download.</p>
            </div>
          </div>

          {previewStatus === 'idle' ? (
            <div className="entity-empty-state">Aplique filtros e clique em visualizar previa para conferir os dados.</div>
          ) : previewStatus === 'loading' ? (
            <div className="entity-empty-state">Consultando microservico de relatorios...</div>
          ) : previewRows.length === 0 ? (
            <div className="entity-empty-state">Nenhum dado encontrado para os filtros informados.</div>
          ) : (
            <div className="reports-preview-table">
              <div className="reports-preview-table__head" style={{ gridTemplateColumns: `repeat(${previewColumns.length}, minmax(140px, 1fr))` }}>
                {previewColumns.map((column) => (
                  <span key={column}>{column.replace(/_/g, ' ')}</span>
                ))}
              </div>

              {previewRows.map((row, index) => (
                <div
                  className="reports-preview-table__row"
                  key={`${String(row.id ?? index)}-${index}`}
                  style={{ gridTemplateColumns: `repeat(${previewColumns.length}, minmax(140px, 1fr))` }}
                >
                  {previewColumns.map((column) => (
                    <span key={`${column}-${index}`}>{formatCellValue(row[column])}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel dashboard-panel--span-12 reports-fleet">
          <div className="dashboard-panel__header">
            <div>
              <h2>Ranking da frota</h2>
              <p>Comparativo alimentado pelos endpoints agregados de consumo medio e custo total por veiculo.</p>
            </div>
            <div className="reports-fleet__actions">
              <label className="entity-field reports-fleet__search">
                <span>Buscar veiculo</span>
                <input
                  value={fleetSearch}
                  onChange={(event) => setFleetSearch(event.target.value)}
                  placeholder="Placa ou modelo"
                />
              </label>
            </div>
          </div>

          <div className="reports-fleet-grid">
            <section className="reports-fleet-panel">
              <div className="dashboard-panel__header">
                <div>
                  <h2>Top consumo medio</h2>
                  <p>Maior eficiencia km/l da frota.</p>
                </div>
              </div>

              {fleetRankingStatus === 'loading' ? (
                <div className="entity-empty-state">Carregando consumo medio...</div>
              ) : consumoRanking.length === 0 ? (
                <div className="entity-empty-state">Nenhum dado de consumo medio encontrado.</div>
              ) : (
                <div className="reports-preview-table">
                  <div className="reports-preview-table__head reports-preview-table__head--fleet">
                    <span>Veiculo</span>
                    <span>Consumo</span>
                    <span>Base</span>
                  </div>

                  {consumoRanking.map((item) => (
                    <div className="reports-preview-table__row reports-preview-table__row--fleet" key={item.veiculo_id}>
                      <span>
                        <strong>{item.placa}</strong>
                        <small>{item.modelo}</small>
                      </span>
                      <span>{formatNumber(item.consumo_km_por_litro, 'km/l')}</span>
                      <span>{formatNumber(item.total_abastecimentos)} abastecimentos</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="reports-fleet-panel">
              <div className="dashboard-panel__header">
                <div>
                  <h2>Maiores custos totais</h2>
                  <p>Visao consolidada de combustivel e manutencao.</p>
                </div>
              </div>

              {fleetRankingStatus === 'loading' ? (
                <div className="entity-empty-state">Carregando custos totais...</div>
              ) : custosRanking.length === 0 ? (
                <div className="entity-empty-state">Nenhum dado de custo total encontrado.</div>
              ) : (
                <div className="reports-preview-table">
                  <div className="reports-preview-table__head reports-preview-table__head--fleet">
                    <span>Veiculo</span>
                    <span>Custo total</span>
                    <span>Manutencao</span>
                  </div>

                  {custosRanking.map((item) => (
                    <div className="reports-preview-table__row reports-preview-table__row--fleet" key={item.veiculo_id}>
                      <span>
                        <strong>{item.placa}</strong>
                        <small>{item.modelo}</small>
                      </span>
                      <span>{formatCurrency(item.custo_total)}</span>
                      <span>{formatCurrency(item.custo_manutencao)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </article>
      </div>
    </section>
  )
}
