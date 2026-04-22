import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  veiculoService,
  type VeiculoConsumo,
  type VeiculoCustos,
  type VeiculoHistoricoItem,
  type VeiculoListItem,
  type VeiculoStatus,
  type VeiculoTipo,
} from '../services/veiculoService'

const statusOptions: Array<{ value: '' | VeiculoStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'em_uso', label: 'Em uso' },
  { value: 'manutencao', label: 'Manutencao' },
  { value: 'inativo', label: 'Inativo' },
]

const tipoOptions: Array<{ value: '' | VeiculoTipo; label: string }> = [
  { value: '', label: 'Todos os tipos' },
  { value: 'truck', label: 'Truck' },
  { value: 'bitruck', label: 'Bitruck' },
  { value: 'carreta', label: 'Carreta' },
  { value: 'toco', label: 'Toco' },
  { value: 'vuc', label: 'VUC' },
  { value: 'van', label: 'Van' },
  { value: 'utilitario', label: 'Utilitario' },
  { value: 'outro', label: 'Outro' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

function formatLabel(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function VeiculosListPage() {
  const [items, setItems] = useState<VeiculoListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedVeiculo, setSelectedVeiculo] = useState<VeiculoListItem | null>(null)
  const [custos, setCustos] = useState<VeiculoCustos | null>(null)
  const [consumo, setConsumo] = useState<VeiculoConsumo | null>(null)
  const [historico, setHistorico] = useState<VeiculoHistoricoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSideLoading, setIsSideLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadVeiculos() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await veiculoService.list({ search, status, tipo, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedVeiculo((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar os veiculos.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSidePanel(id: number) {
    try {
      setIsSideLoading(true)
      const [custosResponse, consumoResponse, historicoResponse] = await Promise.all([
        veiculoService.getCustos(id),
        veiculoService.getConsumo(id),
        veiculoService.getHistorico(id),
      ])

      setCustos(custosResponse.data)
      setConsumo(consumoResponse.data)
      setHistorico(historicoResponse.data)
    } catch {
      setCustos(null)
      setConsumo(null)
      setHistorico([])
    } finally {
      setIsSideLoading(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir este veiculo?')

    if (!confirmed) {
      return
    }

    try {
      await veiculoService.remove(id)
      await loadVeiculos()
    } catch {
      setErrorMessage('Nao foi possivel excluir o veiculo.')
    }
  }

  useEffect(() => {
    void loadVeiculos()
  }, [page, limit, status, tipo])

  useEffect(() => {
    if (!selectedVeiculo) {
      return
    }

    void loadSidePanel(selectedVeiculo.id)
  }, [selectedVeiculo])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Frota</p>
          <h1 className="dashboard-title">Veiculos</h1>
          <p className="dashboard-subtitle">
            Gestao central da frota com visao de status, custos, consumo e historico operacional.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadVeiculos()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/veiculos/novo">
            Novo veiculo
          </Link>
        </div>
      </header>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="veiculo-search">Buscar</label>
          <input
            id="veiculo-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Placa, modelo, marca ou RENAVAM"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="veiculo-status">Status</label>
          <select id="veiculo-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="veiculo-tipo">Tipo</label>
          <select id="veiculo-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {tipoOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="veiculo-limit">Por pagina</label>
          <select
            id="veiculo-limit"
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
        <button
          className="entity-action entity-action--secondary"
          type="button"
          onClick={() => {
            setPage(1)
            void loadVeiculos()
          }}
        >
          Filtrar
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="entity-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Lista de veiculos</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando veiculos...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhum veiculo encontrado para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--veiculos">
                  <span>Veiculo</span>
                  <span>Tipo</span>
                  <span>Uso</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>

                {items.map((item) => (
                  <div
                    className={`entity-table__row entity-table__row--veiculos ${
                      selectedVeiculo?.id === item.id ? 'is-selected' : ''
                    }`}
                    key={item.id}
                  >
                    <button
                      className="entity-table__main entity-table__main--veiculos"
                      type="button"
                      onClick={() => setSelectedVeiculo(item)}
                    >
                      <span>
                        <strong>{item.placa}</strong>
                        <small>{item.marca} {item.modelo} · {item.ano}</small>
                      </span>
                      <span>
                        <strong>{formatLabel(item.tipo)}</strong>
                        <small>{item.capacidade_carga_kg} kg</small>
                      </span>
                      <span>
                        <strong>{item.km_atual} km</strong>
                        <small>Odometro atual</small>
                      </span>
                      <span>
                        <span className={`entity-status entity-status--${item.status}`}>{formatLabel(item.status)}</span>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/veiculos/${item.id}/editar`}>
                        Editar
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
              <h2>Painel do veiculo</h2>
              <p>{selectedVeiculo?.placa ?? 'Selecione um veiculo'}</p>
            </div>
          </div>

          {!selectedVeiculo ? (
            <div className="entity-empty-state">Selecione um veiculo para ver custos, consumo e historico.</div>
          ) : isSideLoading ? (
            <div className="entity-empty-state">Carregando dados complementares...</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Custo combustivel</span>
                  <strong>{formatCurrency(custos?.custo_combustivel ?? 0)}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Custo manutencao</span>
                  <strong>{formatCurrency(custos?.custo_manutencao ?? 0)}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Custo total</span>
                  <strong>{formatCurrency(custos?.custo_total ?? 0)}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Consumo km/l</span>
                  <strong>{consumo?.consumo_km_por_litro ?? 0}</strong>
                </div>
              </div>

              <div className="entity-timeline">
                <div>
                  <h3>Consumo e abastecimentos</h3>
                  <div className="entity-metric-list">
                    <span>Total de abastecimentos: <strong>{consumo?.total_abastecimentos ?? 0}</strong></span>
                    <span>Total de litros: <strong>{consumo?.total_litros ?? 0}</strong></span>
                    <span>Km percorridos: <strong>{consumo?.km_percorridos ?? 0}</strong></span>
                  </div>
                </div>

                <div>
                  <h3>Historico recente</h3>
                  {historico.length === 0 ? (
                    <p className="entity-empty-inline">Sem historico recente.</p>
                  ) : (
                    historico.slice(0, 5).map((item) => (
                      <div className="entity-timeline__item" key={item.id}>
                        <strong>{item.titulo ?? item.tipo ?? 'Evento'}</strong>
                        <span>{item.descricao ?? item.status ?? 'Sem detalhes'} · {item.data ?? 'Sem data'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
