import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motoristaService, type MotoristaListItem, type MotoristaStatus } from '../services/motoristaService'

const statusOptions: Array<{ value: '' | MotoristaStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'ferias', label: 'Ferias' },
  { value: 'afastado', label: 'Afastado' },
]

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function MotoristasListPage() {
  const [items, setItems] = useState<MotoristaListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const activeCount = items.filter((item) => item.status === 'ativo').length
  const withPhotoCount = items.filter((item) => Boolean(item.foto_url)).length

  async function loadMotoristas() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await motoristaService.list({ search, status, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)
    } catch {
      setErrorMessage('Nao foi possivel carregar os motoristas.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(item: MotoristaListItem) {
    const confirmed = window.confirm(`Deseja realmente excluir ${item.nome}?`)
    if (!confirmed) {
      return
    }

    try {
      await motoristaService.remove(item.id)
      await loadMotoristas()
    } catch {
      setErrorMessage('Nao foi possivel excluir o motorista.')
    }
  }

  async function handleStatusChange(item: MotoristaListItem) {
    const nextStatus: MotoristaStatus = item.status === 'ativo' ? 'inativo' : 'ativo'

    try {
      await motoristaService.updateStatus(item.id, nextStatus)
      await loadMotoristas()
    } catch {
      setErrorMessage('Nao foi possivel atualizar o status do motorista.')
    }
  }

  useEffect(() => {
    void loadMotoristas()
  }, [page, limit, status])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Motoristas</h1>
          <p className="dashboard-subtitle">
            Cadastro centralizado da equipe de conducao, com visao clara de documentos, contato e situacao operacional.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadMotoristas()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/motoristas/novo">
            Novo motorista
          </Link>
        </div>
      </header>

      <div className="entity-kpi-grid entity-kpi-grid--4">
        <article className="entity-kpi">
          <span>Total em tela</span>
          <strong>{items.length}</strong>
        </article>
        <article className="entity-kpi">
          <span>Ativos</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="entity-kpi">
          <span>Com foto</span>
          <strong>{withPhotoCount}</strong>
        </article>
        <article className="entity-kpi">
          <span>CNHs listadas</span>
          <strong>{items.length}</strong>
        </article>
      </div>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="motorista-search">Buscar</label>
          <input
            id="motorista-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, CPF, telefone ou e-mail"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="motorista-status">Status</label>
          <select id="motorista-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="motorista-limit">Por pagina</label>
          <select
            id="motorista-limit"
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
            void loadMotoristas()
          }}
        >
          Filtrar
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <article className="entity-card entity-card--table">
        <div className="entity-card__header">
          <div>
            <h2>Equipe de motoristas</h2>
            <p>{total} registros encontrados</p>
          </div>
        </div>

        {isLoading ? (
          <div className="entity-empty-state">Carregando motoristas...</div>
        ) : items.length === 0 ? (
          <div className="entity-empty-state">Nenhum motorista encontrado para os filtros informados.</div>
        ) : (
          <>
            <div className="entity-table">
              <div className="entity-table__head entity-table__head--motoristas">
                <span>Motorista</span>
                <span>Documento</span>
                <span>Contato</span>
                <span>Status</span>
                <span>Acoes</span>
              </div>

              {items.map((item) => (
                <div className="entity-table__row entity-table__row--motoristas" key={item.id}>
                  <div className="entity-table__main entity-table__main--motoristas">
                    <span className="entity-table__cell entity-table__cell--motorista">
                      <span className="entity-person entity-person--motorista">
                        {item.foto_url ? (
                          <img
                            className="entity-person__avatar entity-person__avatar--motorista"
                            src={item.foto_url}
                            alt={`Foto de ${item.nome}`}
                            loading="lazy"
                          />
                        ) : (
                          <span className="entity-person__avatar entity-person__avatar--motorista entity-person__avatar--placeholder">
                            {getInitials(item.nome)}
                          </span>
                        )}
                        <span className="entity-person__content">
                          <strong>{item.nome}</strong>
                          <small>CNH {item.tipo_cnh} · validade {item.validade_cnh}</small>
                        </span>
                      </span>
                    </span>
                    <span className="entity-table__cell entity-table__cell--documento">
                      <strong>{item.cpf || 'CPF nao informado'}</strong>
                      <small>{item.numero_cnh || 'CNH nao informada'}</small>
                    </span>
                    <span className="entity-table__cell entity-table__cell--contato">
                      <strong>{item.telefone || 'Sem telefone'}</strong>
                      <small>{item.email || 'Sem e-mail'}</small>
                    </span>
                    <span className="entity-table__cell entity-table__cell--status">
                      <span className={`entity-status entity-status--${item.status}`}>{formatStatusLabel(item.status)}</span>
                    </span>
                  </div>
                  <span className="entity-table__actions entity-table__actions--motoristas">
                    <Link className="entity-action entity-action--ghost" to={`/dashboard/motoristas/${item.id}/editar`}>
                      Editar
                    </Link>
                    <button className="entity-action entity-action--ghost" type="button" onClick={() => void handleStatusChange(item)}>
                      {item.status === 'ativo' ? 'Inativar' : 'Ativar'}
                    </button>
                    <button className="entity-action entity-action--danger" type="button" onClick={() => void handleDelete(item)}>
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
    </section>
  )
}
