import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tipoCargaService, type TipoCarga } from '../services/tipoCargaService'

export function TiposCargaListPage() {
  const [items, setItems] = useState<TipoCarga[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedTipo, setSelectedTipo] = useState<TipoCarga | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadTiposCarga() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await tipoCargaService.list({ search, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedTipo((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar os tipos de carga.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir este tipo de carga?')

    if (!confirmed) {
      return
    }

    try {
      await tipoCargaService.remove(id)
      await loadTiposCarga()
    } catch {
      setErrorMessage('Nao foi possivel excluir o tipo de carga.')
    }
  }

  useEffect(() => {
    void loadTiposCarga()
  }, [page, limit])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Catalogo</p>
          <h1 className="dashboard-title">Tipos de carga</h1>
          <p className="dashboard-subtitle">
            Catalogo padronizado para abastecer selects, regras operacionais e o cadastro futuro de viagens.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadTiposCarga()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/tipos-carga/novo">
            Novo tipo
          </Link>
        </div>
      </header>

      <div className="entity-toolbar entity-toolbar--compact">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="tipo-carga-search">Buscar</label>
          <input
            id="tipo-carga-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome ou descricao"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="tipo-carga-limit">Por pagina</label>
          <select
            id="tipo-carga-limit"
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
            void loadTiposCarga()
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
              <h2>Catalogo de tipos</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando tipos de carga...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhum tipo de carga encontrado para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--tipos-carga">
                  <span>Tipo</span>
                  <span>Descricao</span>
                  <span>Acoes</span>
                </div>

                {items.map((item) => (
                  <div
                    className={`entity-table__row entity-table__row--tipos-carga ${selectedTipo?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                  >
                    <button
                      className="entity-table__main entity-table__main--tipos-carga"
                      type="button"
                      onClick={() => setSelectedTipo(item)}
                    >
                      <span>
                        <strong>{item.nome}</strong>
                        <small>Disponivel para uso em selects operacionais</small>
                      </span>
                      <span>
                        <strong>{item.descricao || 'Sem descricao'}</strong>
                        <small>Descricao funcional</small>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/tipos-carga/${item.id}/editar`}>
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
              <h2>Painel do tipo</h2>
              <p>{selectedTipo?.nome ?? 'Selecione um tipo de carga'}</p>
            </div>
          </div>

          {!selectedTipo ? (
            <div className="entity-empty-state">Selecione um tipo para visualizar o resumo do cadastro.</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-timeline">
                <div>
                  <h3>Descricao funcional</h3>
                  <div className="entity-timeline__item">
                    <strong>{selectedTipo.nome}</strong>
                    <span>{selectedTipo.descricao || 'Sem descricao adicional cadastrada.'}</span>
                  </div>
                </div>

                <div>
                  <h3>Uso recomendado</h3>
                  <div className="entity-timeline__item">
                    <strong>Pronto para a tela de viagem</strong>
                    <span>Este item ja pode alimentar selects e modais de criacao rapida sem sair do fluxo.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
