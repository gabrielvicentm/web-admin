import { useEffect, useMemo, useState } from 'react'
import {
  historicoAlteracoesService,
  type HistoricoAlteracao,
  type HistoricoAlteracaoCampo,
} from '../services/historicoAlteracoesService'

type LoadOverrides = {
  search?: string
  entidadeId?: string
  acao?: string
  usuario?: string
  dataInicio?: string
  dataFim?: string
  page?: number
  limit?: number
}

function formatLabel(text?: string) {
  if (!text) {
    return 'Nao informado'
  }

  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sem data'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'Vazio'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function getChangeDate(item: HistoricoAlteracao) {
  return item.criado_em ?? item.data_alteracao
}

function getActionTone(action?: string) {
  switch (action) {
    case 'create':
      return 'success'
    case 'update':
      return 'info'
    case 'status':
      return 'warning'
    default:
      return 'neutral'
  }
}

function buildChangeList(item: HistoricoAlteracao | null): HistoricoAlteracaoCampo[] {
  if (!item) {
    return []
  }

  if (item.alteracoes?.length) {
    return item.alteracoes
  }

  const before = item.dados_antes ?? {}
  const after = item.dados_depois ?? {}
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))

  return keys
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({
      campo: key,
      valor_anterior: before[key],
      valor_novo: after[key],
    }))
}

export function HistoricoAlteracoesPage() {
  const [items, setItems] = useState<HistoricoAlteracao[]>([])
  const [search, setSearch] = useState('')
  const [entidadeId, setEntidadeId] = useState('')
  const [acao, setAcao] = useState('')
  const [usuario, setUsuario] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [total, setTotal] = useState(0)
  const [selectedItem, setSelectedItem] = useState<HistoricoAlteracao | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const selectedChanges = useMemo(() => buildChangeList(selectedItem), [selectedItem])
  const actionSummary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.acao === 'create') {
          acc.creates += 1
        } else if (item.acao === 'update') {
          acc.updates += 1
        } else if (item.acao === 'status') {
          acc.status += 1
        } else {
          acc.events += 1
        }

        return acc
      },
      { creates: 0, updates: 0, status: 0, events: 0 },
    )
  }, [items])

  async function loadHistorico(overrides: LoadOverrides = {}) {
    const nextSearch = overrides.search ?? search
    const nextEntidadeId = overrides.entidadeId ?? entidadeId
    const nextAcao = overrides.acao ?? acao
    const nextUsuario = overrides.usuario ?? usuario
    const nextDataInicio = overrides.dataInicio ?? dataInicio
    const nextDataFim = overrides.dataFim ?? dataFim
    const nextPage = overrides.page ?? page
    const nextLimit = overrides.limit ?? limit

    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await historicoAlteracoesService.list({
        search: nextSearch,
        entidade: 'viagens',
        entidade_id: nextEntidadeId,
        acao: nextAcao,
        usuario: nextUsuario,
        data_inicio: nextDataInicio,
        data_fim: nextDataFim,
        page: nextPage,
        limit: nextLimit,
      })

      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedItem((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar o historico de alteracoes.')
      setItems([])
      setSelectedItem(null)
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setPage(1)
    void loadHistorico({ page: 1 })
  }

  function handleClearFilters() {
    setSearch('')
    setEntidadeId('')
    setAcao('')
    setUsuario('')
    setDataInicio('')
    setDataFim('')
    setPage(1)
    void loadHistorico({
      search: '',
      entidadeId: '',
      acao: '',
      usuario: '',
      dataInicio: '',
      dataFim: '',
      page: 1,
    })
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistorico()
    })
    // Search fields are applied by the Filtrar button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Auditoria</p>
          <h1 className="dashboard-title">Historico de alteracoes de viagens</h1>
          <p className="dashboard-subtitle">
            Esta tela mostra a trilha de auditoria das viagens: criacao, edicao, mudanca de status e eventos operacionais vinculados a elas.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <span className="dashboard-chip dashboard-chip--success">{total} registros</span>
          <span className="dashboard-chip">Somente viagens</span>
          <button className="dashboard-chip" type="button" onClick={() => void loadHistorico()}>
            Atualizar historico
          </button>
        </div>
      </header>

      <section className="history-summary-grid">
        <article className="history-summary-card history-summary-card--blue">
          <span>Total carregado</span>
          <strong>{total}</strong>
          <small>Resultados da pagina atual e filtros aplicados.</small>
        </article>
        <article className="history-summary-card history-summary-card--green">
          <span>Criacoes</span>
          <strong>{actionSummary.creates}</strong>
          <small>Novas viagens registradas.</small>
        </article>
        <article className="history-summary-card history-summary-card--cyan">
          <span>Edicoes</span>
          <strong>{actionSummary.updates}</strong>
          <small>Ajustes de campos e dados operacionais.</small>
        </article>
        <article className="history-summary-card history-summary-card--orange">
          <span>Status e eventos</span>
          <strong>{actionSummary.status + actionSummary.events}</strong>
          <small>Paradas, finalizacoes e eventos de apoio.</small>
        </article>
      </section>

      <div className="history-toolbar">
        <div className="entity-toolbar__field history-toolbar__field--wide">
          <label htmlFor="historico-search">Buscar</label>
          <input
            id="historico-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Resumo, motorista da viagem, placa, cliente ou identificador"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-entidade-id">ID da viagem</label>
          <input id="historico-entidade-id" value={entidadeId} onChange={(event) => setEntidadeId(event.target.value)} placeholder="UUID da viagem" />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-acao">Tipo de evento</label>
          <select id="historico-acao" value={acao} onChange={(event) => setAcao(event.target.value)}>
            <option value="">Todas</option>
            <option value="create">Criacao</option>
            <option value="update">Edicao</option>
            <option value="status">Mudanca de status</option>
            <option value="evento">Evento operacional</option>
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-usuario">Usuario</label>
          <input id="historico-usuario" value={usuario} onChange={(event) => setUsuario(event.target.value)} placeholder="Nome, e-mail ou ID" />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-data-inicio">Inicio</label>
          <input id="historico-data-inicio" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-data-fim">Fim</label>
          <input id="historico-data-fim" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="historico-limit">Por pagina</label>
          <select
            id="historico-limit"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value))
              setPage(1)
            }}
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button className="entity-action entity-action--secondary" type="button" onClick={handleFilter}>
          Filtrar
        </button>
        <button className="entity-action entity-action--ghost" type="button" onClick={handleClearFilters}>
          Limpar
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="entity-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Eventos registrados</h2>
              <p>{total} registros encontrados</p>
            </div>
            <span className="dashboard-chip">Pagina {page} de {totalPages}</span>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando historico...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhuma alteracao encontrada para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--historico">
                  <span>Evento</span>
                  <span>Viagem</span>
                  <span>Usuario</span>
                  <span>Data</span>
                </div>

                {items.map((item) => (
                  <button
                    className={`entity-table__row entity-table__row--historico history-row ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                  >
                    <span className="entity-table__cell">
                      <strong className={`history-badge history-badge--${getActionTone(item.acao)}`}>{formatLabel(item.acao)}</strong>
                      <small>{item.resumo ?? `Registro #${item.id}`}</small>
                    </span>
                    <span className="entity-table__cell">
                      <strong>Viagem</strong>
                      <small>{item.entidade_id ? `ID ${item.entidade_id}` : 'Sem identificador'}</small>
                    </span>
                    <span className="entity-table__cell">
                      <strong>{item.usuario_nome ?? item.usuario_email ?? `Usuario #${item.usuario_id ?? '-'}`}</strong>
                      <small>{item.origem ?? item.ip ?? 'Origem nao informada'}</small>
                    </span>
                    <span className="entity-table__cell">
                      <strong>{formatDateTime(getChangeDate(item))}</strong>
                      <small>{selectedItem?.id === item.id ? 'Selecionado' : 'Ver detalhes'}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="entity-pagination">
                <button disabled={page <= 1} type="button" onClick={() => setPage((current) => current - 1)}>
                  Anterior
                </button>
                <span>
                  Pagina {page} de {totalPages}
                </span>
                <button disabled={page >= totalPages} type="button" onClick={() => setPage((current) => current + 1)}>
                  Proxima
                </button>
              </div>
            </>
          )}
        </article>

        <aside className="entity-card entity-card--aside">
          <div className="entity-card__header">
            <div>
              <h2>Detalhe da alteracao</h2>
              <p>{selectedItem ? `Viagem #${selectedItem.entidade_id ?? selectedItem.id}` : 'Selecione um evento'}</p>
            </div>
          </div>

          {!selectedItem ? (
            <div className="entity-empty-state">Selecione um evento para visualizar os dados alterados.</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Acao</span>
                  <strong>{formatLabel(selectedItem.acao)}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Campos</span>
                  <strong>{selectedChanges.length}</strong>
                </div>
              </div>

              <div className="entity-detail-grid history-detail-grid">
                <span>Usuario</span>
                <strong>{selectedItem.usuario_nome ?? selectedItem.usuario_email ?? `#${selectedItem.usuario_id ?? '-'}`}</strong>
                <span>Data</span>
                <strong>{formatDateTime(getChangeDate(selectedItem))}</strong>
                <span>Origem</span>
                <strong>{selectedItem.origem ?? selectedItem.ip ?? 'Nao informada'}</strong>
                <span>Registro</span>
                <strong>{selectedItem.entidade_id ?? selectedItem.id}</strong>
              </div>

              <div className="history-change-list">
                <h3>Campos alterados</h3>
                {selectedChanges.length === 0 ? (
                  <p className="entity-empty-inline">Sem diff detalhado neste registro.</p>
                ) : (
                  selectedChanges.map((change, index) => (
                    <div className="history-change" key={`${change.campo ?? 'campo'}-${index}`}>
                      <strong>{formatLabel(change.campo)}</strong>
                      <div className="history-change__values">
                        <span>
                          <small>Antes</small>
                          <code>{formatJsonValue(change.valor_anterior)}</code>
                        </span>
                        <span>
                          <small>Depois</small>
                          <code>{formatJsonValue(change.valor_novo)}</code>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
