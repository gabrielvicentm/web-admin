import axios from 'axios'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { relatoriosService, type RelatorioOperacionalParams, type RelatorioOperacionalTipo } from '../services/relatoriosService'
import {
  buildInitialOperationalFilters,
  downloadBlob,
  formatOperationalValue,
  formatSummaryLabel,
  getOperationalReportOption,
  isOperationalReportType,
  reportDirectoryItems,
  type PreviewRow,
  type PreviewStatus,
  useReportFilterOptions,
} from './relatoriosShared'

export function RelatorioOperacionalPage() {
  const { tipo } = useParams<{ tipo: string }>()

  if (!tipo || !isOperationalReportType(tipo)) {
    return <Navigate replace to="/dashboard/relatorios" />
  }

  const reportType: RelatorioOperacionalTipo = tipo
  const selectedReport = getOperationalReportOption(tipo)
  const [operationalFilters, setOperationalFilters] = useState<RelatorioOperacionalParams>(buildInitialOperationalFilters)
  const [operationalPreviewRows, setOperationalPreviewRows] = useState<PreviewRow[]>([])
  const [operationalPreviewTotal, setOperationalPreviewTotal] = useState(0)
  const [operationalPreviewStatus, setOperationalPreviewStatus] = useState<PreviewStatus>('idle')
  const [operationalResumo, setOperationalResumo] = useState<Record<string, unknown> | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isExportingOperationalCsv, setIsExportingOperationalCsv] = useState(false)
  const [isExportingOperationalXlsx, setIsExportingOperationalXlsx] = useState(false)
  const { clientes, motoristas, veiculos, isLoadingFilters, filtersFeedback } = useReportFilterOptions()
  const operationalPreviewColumns =
    operationalPreviewRows.length === 0
      ? selectedReport.previewColumns
      : selectedReport.previewColumns.filter((column) => column in operationalPreviewRows[0])
  const currentFeedback = feedback || filtersFeedback
  const relatedReports = reportDirectoryItems.filter((item) => item.to !== `/dashboard/relatorios/${tipo}`).slice(0, 4)

  function handleOperationalFilterChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setOperationalFilters((current) => ({ ...current, [name]: value }))
  }

  function handleClearOperationalFilters() {
    setOperationalFilters(buildInitialOperationalFilters())
    setOperationalPreviewRows([])
    setOperationalPreviewTotal(0)
    setOperationalPreviewStatus('idle')
    setOperationalResumo(null)
    setFeedback('')
  }

  async function handleOperationalPreview() {
    try {
      setOperationalPreviewStatus('loading')
      setFeedback('')

      const response = await relatoriosService.listarOperacional(reportType, operationalFilters)
      setOperationalPreviewRows(response.items.slice(0, 10))
      setOperationalPreviewTotal(response.total)
      setOperationalResumo(response.resumo)
      setOperationalPreviewStatus('success')
    } catch (error) {
      setOperationalPreviewStatus('error')

      if (axios.isAxiosError(error)) {
        setFeedback(
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel gerar a previa do relatorio operacional.',
        )
      } else {
        setFeedback('Nao foi possivel gerar a previa do relatorio operacional.')
      }
    }
  }

  async function handleExportOperationalCsv() {
    try {
      setIsExportingOperationalCsv(true)
      setFeedback('')
      const blob = await relatoriosService.baixarOperacionalCsv(reportType, operationalFilters)
      downloadBlob(blob, `${selectedReport.filename}.csv`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel exportar o CSV do relatorio operacional.',
        )
      } else {
        setFeedback('Nao foi possivel exportar o CSV do relatorio operacional.')
      }
    } finally {
      setIsExportingOperationalCsv(false)
    }
  }

  async function handleExportOperationalXlsx() {
    try {
      setIsExportingOperationalXlsx(true)
      setFeedback('')
      const blob = await relatoriosService.baixarOperacionalXlsx(reportType, operationalFilters)
      downloadBlob(blob, `${selectedReport.filename}.xlsx`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(
          typeof error.response?.data?.message === 'string'
            ? error.response.data.message
            : 'Nao foi possivel exportar o XLSX do relatorio operacional.',
        )
      } else {
        setFeedback('Nao foi possivel exportar o XLSX do relatorio operacional.')
      }
    } finally {
      setIsExportingOperationalXlsx(false)
    }
  }

  return (
    <section className="dashboard-home reports-page">
      <Link className="reports-backlink" to="/dashboard/relatorios">
        {'<'} Voltar para a central de relatorios
      </Link>

      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Relatorio operacional</p>
          <h1 className="dashboard-title">{selectedReport.title}</h1>
          <p className="dashboard-subtitle">{selectedReport.description}</p>
        </div>

        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">{operationalPreviewTotal} registro(s)</span>
          {selectedReport.chips.map((chip) => (
            <span className="dashboard-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </header>

      {currentFeedback ? <p className="entity-feedback entity-feedback--error">{currentFeedback}</p> : null}

      <div className="dashboard-layout-grid">
        <div className="dashboard-panel--span-8 reports-main-column">
          <article className="dashboard-panel reports-builder">
            <div className="dashboard-panel__header">
              <div>
                <h2>Filtros do relatorio</h2>
                <p>Os campos exibidos aqui sao apenas os que fazem sentido para {selectedReport.title.toLowerCase()}.</p>
              </div>
            </div>

            <div className="reports-filters-grid">
              <label className="entity-field">
                <span>Data inicial</span>
                <input name="data_de" type="date" value={operationalFilters.data_de ?? ''} onChange={handleOperationalFilterChange} />
              </label>
              <label className="entity-field">
                <span>Data final</span>
                <input name="data_ate" type="date" value={operationalFilters.data_ate ?? ''} onChange={handleOperationalFilterChange} />
              </label>
              {selectedReport.availableFilters.includes('motorista_id') ? (
                <label className="entity-field">
                  <span>Motorista</span>
                  <select name="motorista_id" value={operationalFilters.motorista_id ?? ''} onChange={handleOperationalFilterChange} disabled={isLoadingFilters}>
                    <option value="">Todos</option>
                    {motoristas.map((motorista) => (
                      <option key={motorista.id} value={String(motorista.id)}>
                        {motorista.nome}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {selectedReport.availableFilters.includes('veiculo_id') ? (
                <label className="entity-field">
                  <span>Veiculo</span>
                  <select name="veiculo_id" value={operationalFilters.veiculo_id ?? ''} onChange={handleOperationalFilterChange} disabled={isLoadingFilters}>
                    <option value="">Todos</option>
                    {veiculos.map((veiculo) => (
                      <option key={veiculo.id} value={String(veiculo.id)}>
                        {veiculo.placa} - {veiculo.modelo}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {selectedReport.availableFilters.includes('cliente_id') ? (
                <label className="entity-field">
                  <span>Cliente</span>
                  <select name="cliente_id" value={operationalFilters.cliente_id ?? ''} onChange={handleOperationalFilterChange} disabled={isLoadingFilters}>
                    <option value="">Todos</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={String(cliente.id)}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="reports-actions">
              <button className="entity-action entity-action--secondary" type="button" onClick={handleClearOperationalFilters}>
                Limpar filtros
              </button>
              <button className="entity-action entity-action--secondary" type="button" onClick={() => void handleOperationalPreview()}>
                {operationalPreviewStatus === 'loading' ? 'Gerando previa...' : 'Visualizar previa'}
              </button>
              <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportOperationalCsv()} disabled={isExportingOperationalCsv}>
                {isExportingOperationalCsv ? 'Exportando CSV...' : 'Exportar CSV'}
              </button>
              <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportOperationalXlsx()} disabled={isExportingOperationalXlsx}>
                {isExportingOperationalXlsx ? 'Exportando XLSX...' : 'Exportar XLSX'}
              </button>
            </div>

            {operationalResumo ? (
              <div className="entity-kpi-grid entity-kpi-grid--4">
                {selectedReport.summaryKeys.map((key) => (
                  <article className="entity-kpi" key={key}>
                    <span>{formatSummaryLabel(key)}</span>
                    <strong>{formatOperationalValue(key, operationalResumo[key])}</strong>
                  </article>
                ))}
              </div>
            ) : null}
          </article>

          <article className="dashboard-panel reports-preview">
            <div className="dashboard-panel__header">
              <div>
                <h2>Previa do relatorio</h2>
                <p>Exibindo ate 10 linhas do resultado antes da exportacao.</p>
              </div>
            </div>

            {operationalPreviewStatus === 'idle' ? (
              <div className="entity-empty-state">Gere a previa para validar os dados deste relatorio.</div>
            ) : operationalPreviewStatus === 'loading' ? (
              <div className="entity-empty-state">Consultando microservico de relatorios operacionais...</div>
            ) : operationalPreviewRows.length === 0 ? (
              <div className="entity-empty-state">Nenhum registro encontrado para os filtros informados.</div>
            ) : (
              <div className="reports-preview-table">
                <div className="reports-preview-table__head" style={{ gridTemplateColumns: `repeat(${operationalPreviewColumns.length}, minmax(160px, 1fr))` }}>
                  {operationalPreviewColumns.map((column) => (
                    <span key={column}>{formatSummaryLabel(column)}</span>
                  ))}
                </div>

                {operationalPreviewRows.map((row, index) => (
                  <div
                    className="reports-preview-table__row"
                    key={`${String(row.id ?? row.veiculo_id ?? row.motorista_id ?? index)}-${index}`}
                    style={{ gridTemplateColumns: `repeat(${operationalPreviewColumns.length}, minmax(160px, 1fr))` }}
                  >
                    {operationalPreviewColumns.map((column) => (
                      <span key={`${column}-${index}`}>{formatOperationalValue(column, row[column])}</span>
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
              <h2>Resumo desta pagina</h2>
              <p>Os indicadores e as colunas de preview acompanham o tipo de relatorio aberto.</p>
            </div>
          </div>

          <div className="dashboard-metric-stack">
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">1</div>
              <div>
                <p>Resumo superior</p>
                <strong>{selectedReport.summaryKeys.length} indicadores</strong>
                <span>Os cards abaixo do filtro exibem somente os totais mais relevantes deste relatorio.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">2</div>
              <div>
                <p>Exportacao</p>
                <strong>CSV e XLSX</strong>
                <span>O mesmo conjunto filtrado pode ser baixado em ambos os formatos.</span>
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
