import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { relatoriosService, type RelatorioViagensParams } from '../services/relatoriosService'
import {
  downloadBlob,
  formatCellValue,
  initialTripFilters,
  reportDirectoryItems,
  tripStatusOptions,
  type PreviewRow,
  type PreviewStatus,
  useReportFilterOptions,
} from './relatoriosShared'

export function RelatorioViagensPage() {
  const [tripFilters, setTripFilters] = useState<RelatorioViagensParams>(initialTripFilters)
  const [tripPreviewRows, setTripPreviewRows] = useState<PreviewRow[]>([])
  const [tripPreviewTotal, setTripPreviewTotal] = useState(0)
  const [tripPreviewStatus, setTripPreviewStatus] = useState<PreviewStatus>('idle')
  const [feedback, setFeedback] = useState('')
  const [isExportingTripCsv, setIsExportingTripCsv] = useState(false)
  const [isExportingTripXlsx, setIsExportingTripXlsx] = useState(false)
  const { clientes, motoristas, veiculos, isLoadingFilters, filtersFeedback } = useReportFilterOptions()
  const tripPreviewColumns = tripPreviewRows.length > 0 ? Object.keys(tripPreviewRows[0]) : []
  const relatedReports = reportDirectoryItems.filter((item) => item.to !== '/dashboard/relatorios/viagens').slice(0, 4)
  const currentFeedback = feedback || filtersFeedback

  function handleTripFilterChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setTripFilters((current) => ({ ...current, [name]: value }))
  }

  function handleClearTripFilters() {
    setTripFilters(initialTripFilters)
    setTripPreviewRows([])
    setTripPreviewTotal(0)
    setTripPreviewStatus('idle')
    setFeedback('')
  }

  async function handleTripPreview() {
    try {
      setTripPreviewStatus('loading')
      setFeedback('')

      const response = await relatoriosService.listarViagens(tripFilters)
      setTripPreviewRows(response.items.slice(0, 10))
      setTripPreviewTotal(response.total)
      setTripPreviewStatus('success')
    } catch (error) {
      setTripPreviewStatus('error')

      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel gerar a previa.')
      } else {
        setFeedback('Nao foi possivel gerar a previa.')
      }
    }
  }

  async function handleExportTripCsv() {
    try {
      setIsExportingTripCsv(true)
      setFeedback('')
      const blob = await relatoriosService.baixarViagensCsv(tripFilters)
      downloadBlob(blob, 'relatorio_viagens.csv')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel exportar o CSV.')
      } else {
        setFeedback('Nao foi possivel exportar o CSV.')
      }
    } finally {
      setIsExportingTripCsv(false)
    }
  }

  async function handleExportTripXlsx() {
    try {
      setIsExportingTripXlsx(true)
      setFeedback('')
      const blob = await relatoriosService.baixarViagensXlsx(tripFilters)
      downloadBlob(blob, 'relatorio_viagens.xlsx')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel exportar o XLSX.')
      } else {
        setFeedback('Nao foi possivel exportar o XLSX.')
      }
    } finally {
      setIsExportingTripXlsx(false)
    }
  }

  return (
    <section className="dashboard-home reports-page">
      <Link className="reports-backlink" to="/dashboard/relatorios">
        {'<'} Voltar para a central de relatorios
      </Link>

      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Relatorio de viagens</p>
          <h1 className="dashboard-title">Viagens</h1>
          <p className="dashboard-subtitle">
            Consulte viagens por periodo, motorista, veiculo, cliente e status antes de exportar o arquivo final.
          </p>
        </div>

        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">{tripPreviewTotal} registro(s)</span>
          <span className="dashboard-chip">CSV</span>
          <span className="dashboard-chip">XLSX</span>
        </div>
      </header>

      {currentFeedback ? <p className="entity-feedback entity-feedback--error">{currentFeedback}</p> : null}

      <div className="dashboard-layout-grid">
        <div className="dashboard-panel--span-8 reports-main-column">
          <article className="dashboard-panel reports-builder">
            <div className="dashboard-panel__header">
              <div>
                <h2>Filtros de viagens</h2>
                <p>Use os campos abaixo para montar a previa ou exportar direto.</p>
              </div>
            </div>

            <div className="reports-filters-grid">
              <label className="entity-field">
                <span>Data de saida inicial</span>
                <input name="data_saida_de" type="date" value={tripFilters.data_saida_de ?? ''} onChange={handleTripFilterChange} />
              </label>
              <label className="entity-field">
                <span>Data de saida final</span>
                <input name="data_saida_ate" type="date" value={tripFilters.data_saida_ate ?? ''} onChange={handleTripFilterChange} />
              </label>
              <label className="entity-field">
                <span>Status</span>
                <select name="status" value={tripFilters.status ?? ''} onChange={handleTripFilterChange}>
                  {tripStatusOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Motorista</span>
                <select name="motorista_id" value={tripFilters.motorista_id ?? ''} onChange={handleTripFilterChange} disabled={isLoadingFilters}>
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
                <select name="veiculo_id" value={tripFilters.veiculo_id ?? ''} onChange={handleTripFilterChange} disabled={isLoadingFilters}>
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
                <select name="cliente_id" value={tripFilters.cliente_id ?? ''} onChange={handleTripFilterChange} disabled={isLoadingFilters}>
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
              <button className="entity-action entity-action--secondary" type="button" onClick={handleClearTripFilters}>
                Limpar filtros
              </button>
              <button className="entity-action entity-action--secondary" type="button" onClick={() => void handleTripPreview()}>
                {tripPreviewStatus === 'loading' ? 'Gerando previa...' : 'Visualizar previa'}
              </button>
              <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportTripCsv()} disabled={isExportingTripCsv}>
                {isExportingTripCsv ? 'Exportando CSV...' : 'Exportar CSV'}
              </button>
              <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportTripXlsx()} disabled={isExportingTripXlsx}>
                {isExportingTripXlsx ? 'Exportando XLSX...' : 'Exportar XLSX'}
              </button>
            </div>
          </article>

          <article className="dashboard-panel reports-preview">
            <div className="dashboard-panel__header">
              <div>
                <h2>Previa do relatorio</h2>
                <p>Exibindo ate 10 linhas com os dados principais antes do download.</p>
              </div>
            </div>

            {tripPreviewStatus === 'idle' ? (
              <div className="entity-empty-state">Aplique filtros e clique em visualizar previa para conferir os dados.</div>
            ) : tripPreviewStatus === 'loading' ? (
              <div className="entity-empty-state">Consultando microservico de relatorios...</div>
            ) : tripPreviewRows.length === 0 ? (
              <div className="entity-empty-state">Nenhum dado encontrado para os filtros informados.</div>
            ) : (
              <div className="reports-preview-table">
                <div className="reports-preview-table__head" style={{ gridTemplateColumns: `repeat(${tripPreviewColumns.length}, minmax(140px, 1fr))` }}>
                  {tripPreviewColumns.map((column) => (
                    <span key={column}>{column.replace(/_/g, ' ')}</span>
                  ))}
                </div>

                {tripPreviewRows.map((row, index) => (
                  <div
                    className="reports-preview-table__row"
                    key={`${String(row.id ?? index)}-${index}`}
                    style={{ gridTemplateColumns: `repeat(${tripPreviewColumns.length}, minmax(140px, 1fr))` }}
                  >
                    {tripPreviewColumns.map((column) => (
                      <span key={`${column}-${index}`}>{formatCellValue(row[column])}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <aside className="dashboard-panel dashboard-panel--span-4 reports-sidepanel">
          <div className="dashboard-panel__header">
            <div>
              <h2>Escopo deste relatorio</h2>
              <p>Pagina focada apenas nas viagens para evitar a mistura com outros fluxos.</p>
            </div>
          </div>

          <div className="dashboard-metric-stack">
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">1</div>
              <div>
                <p>Filtros</p>
                <strong>Periodo, status e entidades</strong>
                <span>Motorista, veiculo e cliente podem ser combinados antes do download.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">2</div>
              <div>
                <p>Exportacao</p>
                <strong>CSV e XLSX</strong>
                <span>Os dois formatos saem do mesmo endpoint de relatorios do servico Python.</span>
              </div>
            </div>
          </div>

          <div className="reports-related">
            <p className="dashboard-card__label">Abrir outro relatorio</p>
            <div className="reports-related-list">
              {relatedReports.map((item) => (
                <Link className="reports-related-link" key={item.to} to={item.to}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </section>
  )
}
