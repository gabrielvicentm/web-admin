import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { relatoriosService, type RelatorioFolhaPagamentoResumo } from '../services/relatoriosService'
import {
  buildInitialFolhaFilters,
  downloadBlob,
  folhaPreviewColumnLabels,
  folhaPreviewColumns,
  folhaStatusOptions,
  formatCurrency,
  formatPayrollCellValue,
  funcionarioStatusOptions,
  getCurrentCompetencia,
  reportDirectoryItems,
  type PreviewRow,
  type PreviewStatus,
} from './relatoriosShared'

export function RelatorioFolhaPagamentoPage() {
  const [folhaFilters, setFolhaFilters] = useState(buildInitialFolhaFilters)
  const [folhaPreviewRows, setFolhaPreviewRows] = useState<PreviewRow[]>([])
  const [folhaPreviewTotal, setFolhaPreviewTotal] = useState(0)
  const [folhaPreviewStatus, setFolhaPreviewStatus] = useState<PreviewStatus>('idle')
  const [folhaResumo, setFolhaResumo] = useState<RelatorioFolhaPagamentoResumo | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isExportingFolhaXlsx, setIsExportingFolhaXlsx] = useState(false)
  const relatedReports = reportDirectoryItems.filter((item) => item.to !== '/dashboard/relatorios/folha-pagamento').slice(0, 4)

  function handleFolhaFilterChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFolhaFilters((current) => ({ ...current, [name]: value }))
  }

  function handleClearFolhaFilters() {
    setFolhaFilters(buildInitialFolhaFilters())
    setFolhaPreviewRows([])
    setFolhaPreviewTotal(0)
    setFolhaPreviewStatus('idle')
    setFolhaResumo(null)
    setFeedback('')
  }

  async function handleFolhaPreview() {
    try {
      setFolhaPreviewStatus('loading')
      setFeedback('')

      const response = await relatoriosService.listarFolhaPagamento(folhaFilters)
      setFolhaPreviewRows(response.items.slice(0, 10))
      setFolhaPreviewTotal(response.total)
      setFolhaResumo(response.resumo)
      setFolhaPreviewStatus('success')
    } catch (error) {
      setFolhaPreviewStatus('error')

      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel gerar a previa da folha.')
      } else {
        setFeedback('Nao foi possivel gerar a previa da folha.')
      }
    }
  }

  async function handleExportFolhaXlsx() {
    try {
      setIsExportingFolhaXlsx(true)
      setFeedback('')
      const blob = await relatoriosService.baixarFolhaPagamentoXlsx(folhaFilters)
      downloadBlob(blob, `relatorio_folha_pagamento_${folhaFilters.competencia ?? getCurrentCompetencia()}.xlsx`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setFeedback(typeof error.response?.data?.message === 'string' ? error.response.data.message : 'Nao foi possivel exportar o XLSX da folha.')
      } else {
        setFeedback('Nao foi possivel exportar o XLSX da folha.')
      }
    } finally {
      setIsExportingFolhaXlsx(false)
    }
  }

  return (
    <section className="dashboard-home reports-page">
      <Link className="reports-backlink" to="/dashboard/relatorios">
        {'<'} Voltar para a central de relatorios
      </Link>

      <header className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Relatorio de folha de pagamento</p>
          <h1 className="dashboard-title">Folha de pagamento</h1>
          <p className="dashboard-subtitle">
            Escolha a competencia, gere a previa e exporte a planilha final da folha em uma tela exclusiva.
          </p>
        </div>

        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">{folhaPreviewTotal} funcionario(s)</span>
          <span className="dashboard-chip">XLSX</span>
          <span className="dashboard-chip">Competencia e status</span>
        </div>
      </header>

      {feedback ? <p className="entity-feedback entity-feedback--error">{feedback}</p> : null}

      <div className="dashboard-layout-grid">
        <div className="dashboard-panel--span-8 reports-main-column">
          <article className="dashboard-panel reports-builder">
            <div className="dashboard-panel__header">
              <div>
                <h2>Filtros da folha</h2>
                <p>Filtre por competencia, busca textual e status antes de exportar a planilha.</p>
              </div>
            </div>

            <div className="reports-filters-grid">
              <label className="entity-field">
                <span>Competencia</span>
                <input name="competencia" type="month" value={folhaFilters.competencia ?? ''} onChange={handleFolhaFilterChange} />
              </label>
              <label className="entity-field">
                <span>Buscar funcionario</span>
                <input name="search" value={folhaFilters.search ?? ''} onChange={handleFolhaFilterChange} placeholder="Nome, cargo ou setor" />
              </label>
              <label className="entity-field">
                <span>Status do funcionario</span>
                <select name="status_funcionario" value={folhaFilters.status_funcionario ?? ''} onChange={handleFolhaFilterChange}>
                  {funcionarioStatusOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="entity-field">
                <span>Status da folha</span>
                <select name="status_folha" value={folhaFilters.status_folha ?? ''} onChange={handleFolhaFilterChange}>
                  {folhaStatusOptions.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="reports-actions">
              <button className="entity-action entity-action--secondary" type="button" onClick={handleClearFolhaFilters}>
                Limpar filtros
              </button>
              <button className="entity-action entity-action--secondary" type="button" onClick={() => void handleFolhaPreview()}>
                {folhaPreviewStatus === 'loading' ? 'Gerando previa...' : 'Visualizar previa'}
              </button>
              <button className="entity-action entity-action--primary" type="button" onClick={() => void handleExportFolhaXlsx()} disabled={isExportingFolhaXlsx}>
                {isExportingFolhaXlsx ? 'Exportando XLSX...' : 'Exportar XLSX'}
              </button>
            </div>

            {folhaResumo ? (
              <div className="entity-kpi-grid entity-kpi-grid--4">
                <article className="entity-kpi">
                  <span>Folhas pagas</span>
                  <strong>{folhaResumo.folhas_pagas}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Total de proventos</span>
                  <strong>{formatCurrency(folhaResumo.total_proventos)}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Total de descontos</span>
                  <strong>{formatCurrency(folhaResumo.total_descontos)}</strong>
                </article>
                <article className="entity-kpi">
                  <span>Liquido total</span>
                  <strong>{formatCurrency(folhaResumo.salario_liquido_total)}</strong>
                </article>
              </div>
            ) : null}
          </article>

          <article className="dashboard-panel reports-preview">
            <div className="dashboard-panel__header">
              <div>
                <h2>Previa da folha</h2>
                <p>Exibindo ate 10 funcionarios com os principais campos para validar antes do download.</p>
              </div>
            </div>

            {folhaPreviewStatus === 'idle' ? (
              <div className="entity-empty-state">Escolha a competencia e gere a previa para validar a folha.</div>
            ) : folhaPreviewStatus === 'loading' ? (
              <div className="entity-empty-state">Consultando microservico de relatorios para folha de pagamento...</div>
            ) : folhaPreviewRows.length === 0 ? (
              <div className="entity-empty-state">Nenhum funcionario encontrado para os filtros informados.</div>
            ) : (
              <div className="reports-preview-table">
                <div className="reports-preview-table__head" style={{ gridTemplateColumns: `repeat(${folhaPreviewColumns.length}, minmax(160px, 1fr))` }}>
                  {folhaPreviewColumns.map((column) => (
                    <span key={column}>{folhaPreviewColumnLabels[column]}</span>
                  ))}
                </div>

                {folhaPreviewRows.map((row, index) => (
                  <div
                    className="reports-preview-table__row"
                    key={`${String(row.funcionario_id ?? index)}-${index}`}
                    style={{ gridTemplateColumns: `repeat(${folhaPreviewColumns.length}, minmax(160px, 1fr))` }}
                  >
                    {folhaPreviewColumns.map((column) => (
                      <span key={`${column}-${index}`}>{formatPayrollCellValue(column, row[column])}</span>
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
              <h2>Conteudo da planilha</h2>
              <p>O XLSX continua focado em conferencia operacional e fechamento financeiro da competencia.</p>
            </div>
          </div>

          <div className="dashboard-metric-stack">
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">1</div>
              <div>
                <p>Aba detalhada</p>
                <strong>Funcionario por funcionario</strong>
                <span>Dados cadastrais, status, adicionais, descontos e salario liquido.</span>
              </div>
            </div>
            <div className="dashboard-metric">
              <div className="dashboard-metric__icon">2</div>
              <div>
                <p>Aba de resumo</p>
                <strong>Fechamento da competencia</strong>
                <span>Totais gerais, distribuicao por status e consolidado financeiro por setor.</span>
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
