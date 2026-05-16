import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ocorrenciaService, type OcorrenciaItem } from '../services/ocorrenciaService'
import './AbastecimentosListPage.css'
import './OcorrenciasPage.css'

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'acidente', label: 'Acidente' },
  { value: 'pane_mecanica', label: 'Pane mecanica' },
  { value: 'pane_eletrica', label: 'Pane eletrica' },
  { value: 'furto', label: 'Furto' },
  { value: 'avaria_carga', label: 'Avaria de carga' },
  { value: 'outro', label: 'Outro' },
] as const

type LoadOverrides = {
  search?: string
  tipo?: string
  page?: number
  limit?: number
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatLabel(value?: string) {
  if (!value) {
    return 'Sem informacao'
  }

  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCoordinate(value?: string) {
  if (!value) {
    return 'Nao informado'
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 7 }).format(parsed)
}

export function OcorrenciasPage() {
  const [items, setItems] = useState<OcorrenciaItem[]>([])
  const [selectedItem, setSelectedItem] = useState<OcorrenciaItem | null>(null)
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadOcorrencias(overrides: LoadOverrides = {}) {
    const nextSearch = overrides.search ?? search
    const nextTipo = overrides.tipo ?? tipo
    const nextPage = overrides.page ?? page
    const nextLimit = overrides.limit ?? limit

    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await ocorrenciaService.list({
        search: nextSearch,
        tipo: nextTipo,
        page: nextPage,
        limit: nextLimit,
      })

      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedItem((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar as ocorrencias.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleFilter() {
    setPage(1)
    void loadOcorrencias({ page: 1 })
  }

  function handleClearFilters() {
    setSearch('')
    setTipo('')
    setPage(1)
    void loadOcorrencias({ search: '', tipo: '', page: 1 })
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadOcorrencias()
    })
    // Filters are applied by the Filtrar button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  return (
    <section className="entity-page abastecimentos-page">
      <header className="entity-page__hero abastecimentos-hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Ocorrencias</h1>
          <p className="dashboard-subtitle">
            Visualize as ocorrencias registradas pelos motoristas durante as viagens e acompanhe os detalhes operacionais.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadOcorrencias()}>
            Atualizar lista
          </button>
        </div>
      </header>

      <div className="entity-toolbar abastecimentos-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="ocorrencia-search">Buscar</label>
          <input
            id="ocorrencia-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Motorista, placa, motivo ou descricao"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="ocorrencia-tipo">Tipo</label>
          <select id="ocorrencia-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {tipoOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="ocorrencia-limit">Por pagina</label>
          <select
            id="ocorrencia-limit"
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

      <div className="entity-grid abastecimentos-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Lista de ocorrencias</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando ocorrencias...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhuma ocorrencia encontrada para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="abastecimentos-table__head">
                  <span>Registro</span>
                  <span>Motorista</span>
                  <span>Veiculo</span>
                  <span>Tipo</span>
                  <span>Resumo</span>
                </div>

                {items.map((item) => (
                  <button
                    className={`abastecimentos-table__row ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                  >
                    <span>
                      <strong>{formatDateTime(item.registrado_em)}</strong>
                      <small>{item.viagem_id ? `Viagem ${item.viagem_id}` : 'Sem viagem vinculada'}</small>
                    </span>
                    <span>
                      <strong>{item.motorista_nome || `Motorista #${item.motorista_id}`}</strong>
                      <small>{item.motorista_id}</small>
                    </span>
                    <span>
                      <strong>{item.veiculo_placa || `Veiculo #${item.veiculo_id || 'N/A'}`}</strong>
                      <small>{item.veiculo_modelo || 'Modelo nao informado'}</small>
                    </span>
                    <span>
                      <strong>{formatLabel(item.tipo)}</strong>
                      <small>{item.motivo}</small>
                    </span>
                    <span>
                      <strong>{item.descricao}</strong>
                      <small>{item.foto_url ? 'Com foto anexada' : 'Sem foto anexada'}</small>
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

        <aside className="entity-card abastecimentos-summary">
          <div className="entity-card__header">
            <div>
              <h2>Detalhes</h2>
              <p>{selectedItem ? selectedItem.motivo : 'Selecione uma ocorrencia'}</p>
            </div>
          </div>

          {!selectedItem ? (
            <div className="entity-empty-state">Escolha uma ocorrencia para ver o detalhamento.</div>
          ) : (
            <div className="entity-stack">
              <div className="trip-selection">
                <span>Tipo</span>
                <strong>{formatLabel(selectedItem.tipo)}</strong>
                <small>{formatDateTime(selectedItem.registrado_em)}</small>
              </div>
              <div className="trip-selection">
                <span>Motorista</span>
                <strong>{selectedItem.motorista_nome || `Motorista #${selectedItem.motorista_id}`}</strong>
                <small>{selectedItem.motorista_id}</small>
              </div>
              <div className="trip-selection">
                <span>Veiculo</span>
                <strong>{selectedItem.veiculo_placa || 'Nao informado'}</strong>
                <small>{selectedItem.veiculo_modelo || 'Modelo nao informado'}</small>
              </div>
              <div className="trip-selection">
                <span>Motivo</span>
                <strong>{selectedItem.motivo}</strong>
                <small>{selectedItem.viagem_id ? `Viagem ${selectedItem.viagem_id}` : 'Sem viagem vinculada'}</small>
              </div>
              <div className="trip-selection">
                <span>Descricao</span>
                <strong>{selectedItem.descricao}</strong>
                <small>Latitude {formatCoordinate(selectedItem.latitude)} · Longitude {formatCoordinate(selectedItem.longitude)}</small>
              </div>
              {selectedItem.foto_url ? (
                <div className="trip-selection">
                  <span>Foto anexada</span>
                  <img className="ocorrencias-photo" src={selectedItem.foto_url} alt={selectedItem.motivo} />
                  <small>
                    <a href={selectedItem.foto_url} target="_blank" rel="noreferrer">
                      Abrir imagem em nova aba
                    </a>
                  </small>
                </div>
              ) : null}
              <div className="entity-form__actions">
                {selectedItem.viagem_id ? (
                  <Link className="entity-action entity-action--secondary" to={`/dashboard/viagens/${selectedItem.viagem_id}/editar`}>
                    Ver viagem
                  </Link>
                ) : null}
                {selectedItem.latitude && selectedItem.longitude ? (
                  <a
                    className="entity-action entity-action--ghost"
                    href={`https://www.google.com/maps?q=${selectedItem.latitude},${selectedItem.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir no mapa
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
