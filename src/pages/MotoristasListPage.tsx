import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  motoristaService,
  type MotoristaHistoricoViagem,
  type MotoristaIndicadores,
  type MotoristaListItem,
  type MotoristaOcorrencia,
  type MotoristaStatus,
} from '../services/motoristaService'

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

export function MotoristasListPage() {
  const [items, setItems] = useState<MotoristaListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [selectedMotorista, setSelectedMotorista] = useState<MotoristaListItem | null>(null)
  const [indicadores, setIndicadores] = useState<MotoristaIndicadores | null>(null)
  const [viagens, setViagens] = useState<MotoristaHistoricoViagem[]>([])
  const [ocorrencias, setOcorrencias] = useState<MotoristaOcorrencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSideLoading, setIsSideLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  async function loadMotoristas() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await motoristaService.list({ search, status, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)

      if (response.data.length === 0) {
        setSelectedMotorista(null)
        return
      }

      setSelectedMotorista((current) => current && response.data.some((item) => item.id === current.id) ? current : response.data[0])
    } catch {
      setErrorMessage('Nao foi possivel carregar os motoristas.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSidePanel(id: number) {
    try {
      setIsSideLoading(true)
      const [indicadoresResponse, viagensResponse, ocorrenciasResponse] = await Promise.all([
        motoristaService.getIndicadores(id),
        motoristaService.getViagens(id),
        motoristaService.getOcorrencias(id),
      ])

      setIndicadores(indicadoresResponse.data)
      setViagens(viagensResponse.data)
      setOcorrencias(ocorrenciasResponse.data)
    } catch {
      setIndicadores(null)
      setViagens([])
      setOcorrencias([])
    } finally {
      setIsSideLoading(false)
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm('Deseja realmente excluir este motorista?')

    if (!confirmed) {
      return
    }

    try {
      await motoristaService.remove(id)
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

  useEffect(() => {
    if (!selectedMotorista) {
      return
    }

    void loadSidePanel(selectedMotorista.id)
  }, [selectedMotorista])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Operacao</p>
          <h1 className="dashboard-title">Motoristas</h1>
          <p className="dashboard-subtitle">
            Controle de cadastro, situacao operacional, historico e indicadores individuais dos motoristas.
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

      <div className="entity-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Lista de motoristas</h2>
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
                  <div
                    className={`entity-table__row entity-table__row--motoristas ${
                      selectedMotorista?.id === item.id ? 'is-selected' : ''
                    }`}
                    key={item.id}
                  >
                    <button
                      className="entity-table__main entity-table__main--motoristas"
                      type="button"
                      onClick={() => setSelectedMotorista(item)}
                    >
                      <span className="entity-person">
                        {item.foto_url ? (
                          <img className="entity-person__avatar" src={item.foto_url} alt="" />
                        ) : (
                          <span className="entity-person__avatar entity-person__avatar--placeholder">{item.nome.slice(0, 1)}</span>
                        )}
                        <span>
                          <strong>{item.nome}</strong>
                          <small>CNH {item.tipo_cnh} · validade {item.validade_cnh}</small>
                        </span>
                      </span>
                      <span>
                        <strong>{item.cpf}</strong>
                        <small>{item.numero_cnh}</small>
                      </span>
                      <span>
                        <strong>{item.telefone}</strong>
                        <small>{item.email}</small>
                      </span>
                      <span>
                        <span className={`entity-status entity-status--${item.status}`}>{formatStatusLabel(item.status)}</span>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/motoristas/${item.id}/editar`}>
                        Editar
                      </Link>
                      <button className="entity-action entity-action--ghost" type="button" onClick={() => void handleStatusChange(item)}>
                        {item.status === 'ativo' ? 'Inativar' : 'Ativar'}
                      </button>
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
              <h2>Painel do motorista</h2>
              <p>{selectedMotorista?.nome ?? 'Selecione um motorista'}</p>
            </div>
          </div>

          {!selectedMotorista ? (
            <div className="entity-empty-state">Selecione um motorista para ver indicadores e historico.</div>
          ) : isSideLoading ? (
            <div className="entity-empty-state">Carregando dados complementares...</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Total de viagens</span>
                  <strong>{indicadores?.total_viagens ?? 0}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Km rodados</span>
                  <strong>{indicadores?.total_km_rodados ?? 0}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Ocorrencias</span>
                  <strong>{indicadores?.total_ocorrencias ?? 0}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Frete gerado</span>
                  <strong>{formatCurrency(indicadores?.total_frete_gerado ?? 0)}</strong>
                </div>
              </div>

              <div className="entity-timeline">
                <div>
                  <h3>Ultimas viagens</h3>
                  {viagens.length === 0 ? (
                    <p className="entity-empty-inline">Sem viagens registradas.</p>
                  ) : (
                    viagens.slice(0, 4).map((item) => (
                      <div className="entity-timeline__item" key={item.id}>
                        <strong>{item.origem ?? 'Origem'} → {item.destino ?? 'Destino'}</strong>
                        <span>{item.status ?? 'Sem status'} · {item.data_saida ?? 'Sem data'}</span>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <h3>Ocorrencias recentes</h3>
                  {ocorrencias.length === 0 ? (
                    <p className="entity-empty-inline">Sem ocorrencias registradas.</p>
                  ) : (
                    ocorrencias.slice(0, 4).map((item) => (
                      <div className="entity-timeline__item" key={item.id}>
                        <strong>{item.titulo ?? 'Ocorrencia'}</strong>
                        <span>{item.status ?? 'Sem status'} · {item.data_ocorrencia ?? 'Sem data'}</span>
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
