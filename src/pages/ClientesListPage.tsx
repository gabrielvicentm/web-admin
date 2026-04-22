import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clienteService, type Cliente } from '../services/clienteService'

export function ClientesListPage() {
  const [items, setItems] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadClientes() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await clienteService.list({ search, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedCliente((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null)
    } catch {
      setErrorMessage('Nao foi possivel carregar os clientes.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir este cliente?')

    if (!confirmed) {
      return
    }

    try {
      await clienteService.remove(id)
      await loadClientes()
    } catch {
      setErrorMessage('Nao foi possivel excluir o cliente.')
    }
  }

  useEffect(() => {
    void loadClientes()
  }, [page, limit])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Comercial</p>
          <h1 className="dashboard-title">Clientes</h1>
          <p className="dashboard-subtitle">
            Cadastro empresarial de clientes para faturamento, contratos e vinculacao futura nas viagens.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadClientes()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/clientes/novo">
            Novo cliente
          </Link>
        </div>
      </header>

      <div className="entity-toolbar entity-toolbar--compact">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="cliente-search">Buscar</label>
          <input
            id="cliente-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, CPF/CNPJ, telefone ou e-mail"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="cliente-limit">Por pagina</label>
          <select
            id="cliente-limit"
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
            void loadClientes()
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
              <h2>Base de clientes</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando clientes...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhum cliente encontrado para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--clientes">
                  <span>Cliente</span>
                  <span>Documento</span>
                  <span>Contato</span>
                  <span>Acoes</span>
                </div>

                {items.map((item) => (
                  <div
                    className={`entity-table__row entity-table__row--clientes ${selectedCliente?.id === item.id ? 'is-selected' : ''}`}
                    key={item.id}
                  >
                    <button
                      className="entity-table__main entity-table__main--clientes"
                      type="button"
                      onClick={() => setSelectedCliente(item)}
                    >
                      <span>
                        <strong>{item.nome}</strong>
                        <small>Cadastro comercial ativo</small>
                      </span>
                      <span>
                        <strong>{item.cpf_cnpj}</strong>
                        <small>CPF/CNPJ</small>
                      </span>
                      <span>
                        <strong>{item.telefone}</strong>
                        <small>{item.email}</small>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/clientes/${item.id}/editar`}>
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
              <h2>Painel do cliente</h2>
              <p>{selectedCliente?.nome ?? 'Selecione um cliente'}</p>
            </div>
          </div>

          {!selectedCliente ? (
            <div className="entity-empty-state">Selecione um cliente para visualizar o resumo do cadastro.</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Documento</span>
                  <strong>{selectedCliente.cpf_cnpj}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Canal principal</span>
                  <strong>{selectedCliente.telefone}</strong>
                </div>
              </div>

              <div className="entity-timeline">
                <div>
                  <h3>Contato principal</h3>
                  <div className="entity-timeline__item">
                    <strong>{selectedCliente.email || 'Sem e-mail informado'}</strong>
                    <span>Cadastro pronto para uso em contratos, viagens e faturamento.</span>
                  </div>
                </div>

                <div>
                  <h3>Pronto para integracao</h3>
                  <div className="entity-timeline__item">
                    <strong>Uso futuro nas viagens</strong>
                    <span>Este cliente ja pode ser ligado a fretes, ordens de servico e modulos comerciais.</span>
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
