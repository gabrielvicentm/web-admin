import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { viagemService, type ViagemListItem, type ViagemStatus } from '../services/viagemService'

const statusOptions: Array<{ value: '' | ViagemStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'cancelada', label: 'Cancelada' },
]

type LoadViagensOverrides = {
  search?: string
  status?: string
  dataInicio?: string
  dataFim?: string
  page?: number
  limit?: number
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

function formatLabel(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value: string | number) {
  const parsed = Number(value ?? 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isNaN(parsed) ? 0 : parsed)
}

function formatDateTime(value: string) {
  if (!value) {
    return 'Sem data'
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/)

  if (match) {
    const [, year, month, day, hour, minute] = match
    return `${day}/${month}/${year} ${hour}:${minute}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatNumber(value: string | number, suffix: string) {
  const parsed = Number(value ?? 0)
  return `${new Intl.NumberFormat('pt-BR').format(Number.isNaN(parsed) ? 0 : parsed)} ${suffix}`
}

export function ViagensListPage() {
  const [items, setItems] = useState<ViagemListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dataInicioInput, setDataInicioInput] = useState('')
  const [dataFimInput, setDataFimInput] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedViagem, setSelectedViagem] = useState<ViagemListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadViagens(overrides: LoadViagensOverrides = {}) {
    const nextSearch = overrides.search ?? search
    const nextStatus = overrides.status ?? status
    const nextDataInicio = overrides.dataInicio ?? dataInicio
    const nextDataFim = overrides.dataFim ?? dataFim
    const nextPage = overrides.page ?? page
    const nextLimit = overrides.limit ?? limit

    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await viagemService.list({
        search: nextSearch,
        status: nextStatus,
        data_saida_de: nextDataInicio,
        data_saida_ate: nextDataFim,
        page: nextPage,
        limit: nextLimit,
      })

      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedViagem((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar as viagens.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Deseja realmente excluir esta viagem?')

    if (!confirmed) {
      return
    }

    try {
      await viagemService.remove(id)
      await loadViagens()
    } catch {
      setErrorMessage('Nao foi possivel excluir a viagem.')
    }
  }

  function handleFilter() {
    setDataInicio(buildApiDate(dataInicioInput))
    setDataFim(buildApiDate(dataFimInput))
    setPage(1)
    void loadViagens({ dataInicio: buildApiDate(dataInicioInput), dataFim: buildApiDate(dataFimInput), page: 1 })
  }

  function handleClearFilters() {
    setSearch('')
    setStatus('')
    setDataInicio('')
    setDataFim('')
    setDataInicioInput('')
    setDataFimInput('')
    setPage(1)
    void loadViagens({ search: '', status: '', dataInicio: '', dataFim: '', page: 1 })
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadViagens()
    })
    // The search and date fields are applied by the Filtrar button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Viagens</h1>
          <p className="dashboard-subtitle">
            Acompanhe rotas, agenda, carga, frete e situacao operacional das viagens cadastradas.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadViagens()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/viagens/nova">
            Nova viagem
          </Link>
        </div>
      </header>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="viagem-search">Buscar</label>
          <input
            id="viagem-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Origem, destino, cliente, motorista ou placa"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="viagem-status">Status</label>
          <select id="viagem-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="viagem-data-inicio">Saida inicial</label>
          <input
            id="viagem-data-inicio"
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={dataInicioInput}
            onChange={(event) => setDataInicioInput(formatBrazilianDate(event.target.value))}
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="viagem-data-fim">Saida final</label>
          <input
            id="viagem-data-fim"
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={dataFimInput}
            onChange={(event) => setDataFimInput(formatBrazilianDate(event.target.value))}
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="viagem-limit">Por pagina</label>
          <select
            id="viagem-limit"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value))
              setPage(1)
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
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
              <h2>Lista de viagens</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando viagens...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhuma viagem encontrada para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--viagens">
                  <span>Rota</span>
                  <span>Agenda</span>
                  <span>Equipe</span>
                  <span>Frete</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>

                {items.map((item) => (
                  <div
                    className={`entity-table__row entity-table__row--viagens ${selectedViagem?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                  >
                    <button className="entity-table__main entity-table__main--viagens" type="button" onClick={() => setSelectedViagem(item)}>
                      <span>
                        <strong>{`${item.origem_cidade}/${item.origem_uf} → ${item.destino_cidade}/${item.destino_uf}`}</strong>
                        <small>{item.tipo_carga_nome ?? 'Carga nao informada'}</small>
                      </span>
                      <span>
                        <strong>{formatDateTime(item.data_saida)}</strong>
                        <small>Prev. {formatDateTime(item.data_chegada_prevista)}</small>
                      </span>
                      <span>
                        <strong>{item.motorista_nome ?? `Motorista #${item.motorista_id}`}</strong>
                        <small>{item.veiculo_placa ?? `Veiculo #${item.veiculo_id}`}{item.veiculo_modelo ? ` · ${item.veiculo_modelo}` : ''}</small>
                      </span>
                      <span>
                        <strong>{formatCurrency(item.valor_frete)}</strong>
                        <small>{formatNumber(item.distancia_km, 'km')}</small>
                      </span>
                      <span>
                        <span className={`entity-status entity-status--${item.status}`}>{formatLabel(item.status)}</span>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/viagens/${item.id}/editar`}>
                        Ver/editar
                      </Link>
                      <button className="entity-action entity-action--danger" type="button" onClick={() => void handleDelete(item.id)}>
                        Excluir
                      </button>
                    </span>
                  </div>
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
              <h2>Painel da viagem</h2>
              <p>{selectedViagem ? `${selectedViagem.origem_cidade}/${selectedViagem.origem_uf} para ${selectedViagem.destino_cidade}/${selectedViagem.destino_uf}` : 'Selecione uma viagem'}</p>
            </div>
          </div>

          {!selectedViagem ? (
            <div className="entity-empty-state">Selecione uma viagem para visualizar o resumo operacional.</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Valor do frete</span>
                  <strong>{formatCurrency(selectedViagem.valor_frete)}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Distancia</span>
                  <strong>{formatNumber(selectedViagem.distancia_km, 'km')}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Peso da carga</span>
                  <strong>{formatNumber(selectedViagem.peso_carga_kg, 'kg')}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Status</span>
                  <strong>{formatLabel(selectedViagem.status)}</strong>
                </div>
              </div>

              <div className="entity-timeline">
                <div>
                  <h3>Vinculos</h3>
                  <div className="entity-timeline__item">
                    <strong>{selectedViagem.cliente_nome ?? `Cliente #${selectedViagem.cliente_id}`}</strong>
                    <span>Cliente vinculado ao faturamento desta viagem.</span>
                  </div>
                  <div className="entity-timeline__item">
                    <strong>{selectedViagem.motorista_nome ?? `Motorista #${selectedViagem.motorista_id}`}</strong>
                    <span>{selectedViagem.veiculo_placa ?? `Veiculo #${selectedViagem.veiculo_id}`}</span>
                  </div>
                </div>

                <div>
                  <h3>Carga e agenda</h3>
                  <div className="entity-timeline__item">
                    <strong>{selectedViagem.tipo_carga_nome ?? 'Carga nao informada'}</strong>
                    <span>Saida {formatDateTime(selectedViagem.data_saida)} · previsao {formatDateTime(selectedViagem.data_chegada_prevista)}</span>
                  </div>
                  {selectedViagem.observacoes ? (
                    <div className="entity-timeline__item">
                      <strong>Observacoes</strong>
                      <span>{selectedViagem.observacoes}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
