import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  funcionarioService,
  type FuncionarioListItem,
  type FuncionarioStatus,
  type FuncionarioTipo,
} from '../services/funcionarioService'

const statusOptions: Array<{ value: '' | FuncionarioStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'ferias', label: 'Ferias' },
  { value: 'afastado', label: 'Afastado' },
  { value: 'desligado', label: 'Desligado' },
]

const tipoOptions: Array<{ value: '' | FuncionarioTipo; label: string }> = [
  { value: '', label: 'Todos os perfis' },
  { value: 'funcionario', label: 'Somente funcionarios' },
  { value: 'motorista', label: 'Somente motoristas' },
]

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

function getEditRoute(item: FuncionarioListItem) {
  return `/dashboard/funcionarios/${item.id}/editar`
}

function getInitials(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function FuncionariosListPage() {
  const [items, setItems] = useState<FuncionarioListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const activeCount = items.filter((item) => item.status === 'ativo').length
  const motoristaCount = items.filter((item) => item.is_motorista).length

  async function loadFuncionarios() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await funcionarioService.list({ search, status, tipo, page, limit, include_motoristas: true })
      setItems(response.data)
      setTotal(response.meta.total)
    } catch {
      setErrorMessage('Nao foi possivel carregar os funcionarios.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(item: FuncionarioListItem) {
    if (item.is_motorista) {
      setErrorMessage('Motoristas devem ser gerenciados pelo modulo de motoristas.')
      return
    }

    const confirmed = window.confirm(`Deseja realmente excluir ${item.nome}?`)
    if (!confirmed) {
      return
    }

    try {
      await funcionarioService.remove(item.id)
      await loadFuncionarios()
    } catch {
      setErrorMessage('Nao foi possivel excluir o funcionario.')
    }
  }

  async function handleStatusChange(item: FuncionarioListItem) {
    const nextStatus: FuncionarioStatus = item.status === 'ativo' ? 'inativo' : 'ativo'

    try {
      await funcionarioService.updateStatus(item.id, nextStatus)
      await loadFuncionarios()
    } catch {
      setErrorMessage('Nao foi possivel atualizar o status do funcionario.')
    }
  }

  useEffect(() => {
    void loadFuncionarios()
  }, [page, limit, status, tipo])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Pessoas</p>
          <h1 className="dashboard-title">Funcionarios</h1>
          <p className="dashboard-subtitle">
            Cadastro centralizado de equipe, com visao clara de status, cargo, setor e indicacao de quem tambem e motorista.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadFuncionarios()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/funcionarios/novo">
            Novo funcionario
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
          <span>Motoristas</span>
          <strong>{motoristaCount}</strong>
        </article>
        <article className="entity-kpi">
          <span>Folha estimada</span>
          <strong>{formatCurrency(items.reduce((sum, item) => sum + (item.salario_base ?? 0), 0))}</strong>
        </article>
      </div>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="funcionario-search">Buscar</label>
          <input
            id="funcionario-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, e-mail, cargo ou setor"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="funcionario-status">Status</label>
          <select id="funcionario-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="funcionario-tipo">Perfil</label>
          <select id="funcionario-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {tipoOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="funcionario-limit">Por pagina</label>
          <select
            id="funcionario-limit"
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
            void loadFuncionarios()
          }}
        >
          Filtrar
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <article className="entity-card entity-card--table">
        <div className="entity-card__header">
          <div>
            <h2>Equipe cadastrada</h2>
            <p>{total} registros encontrados</p>
          </div>
        </div>

        {isLoading ? (
          <div className="entity-empty-state">Carregando funcionarios...</div>
        ) : items.length === 0 ? (
          <div className="entity-empty-state">Nenhum funcionario encontrado para os filtros informados.</div>
        ) : (
          <>
            <div className="entity-table">
              <div className="entity-table__head entity-table__head--motoristas">
                <span>Funcionario</span>
                <span>Atuacao</span>
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
                          <small>
                            {item.cpf} {item.is_motorista ? '· Motorista' : '· Funcionario'}
                          </small>
                        </span>
                      </span>
                    </span>
                      <span className="entity-table__cell entity-table__cell--documento">
                        <strong>{item.cargo || 'Cargo nao informado'}</strong>
                        <small>{item.setor || 'Setor nao informado'}</small>
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
                      <Link className="entity-action entity-action--ghost" to={getEditRoute(item)}>
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
