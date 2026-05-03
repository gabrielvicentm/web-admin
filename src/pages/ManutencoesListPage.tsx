import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  manutencaoService,
  type Manutencao,
  type ManutencaoListItem,
  type ManutencaoStatus,
  type ManutencaoTipo,
} from '../services/manutencaoService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'

const statusOptions: Array<{ value: '' | ManutencaoStatus; label: string }> = [
  { value: '', label: 'Todos os status' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'cancelada', label: 'Cancelada' },
]

const tipoOptions: Array<{ value: '' | ManutencaoTipo; label: string }> = [
  { value: '', label: 'Todos os tipos' },
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
  { value: 'revisao', label: 'Revisao' },
]

function formatLabel(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value: string) {
  const parsedValue = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(parsedValue) ? parsedValue : 0)
}

function formatDate(value: string) {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export function ManutencoesListPage() {
  const [items, setItems] = useState<ManutencaoListItem[]>([])
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [selectedManutencao, setSelectedManutencao] = useState<ManutencaoListItem | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<Manutencao | null>(null)
  const [veiculoHistorico, setVeiculoHistorico] = useState<ManutencaoListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [tipo, setTipo] = useState('')
  const [veiculoId, setVeiculoId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isAsideLoading, setIsAsideLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const investmentSummary = useMemo(
    () =>
      veiculoHistorico.reduce((accumulator, item) => {
        const parsed = Number(item.custo || 0)
        return accumulator + (Number.isFinite(parsed) ? parsed : 0)
      }, 0),
    [veiculoHistorico],
  )

  const nextMaintenanceKm = useMemo(() => {
    const nextItem = veiculoHistorico.find((item) => item.km_proxima_manutencao)
    return nextItem?.km_proxima_manutencao ?? ''
  }, [veiculoHistorico])

  async function loadVeiculos() {
    try {
      const response = await veiculoService.list({ page: 1, limit: 100 })
      setVeiculos(response.data)
    } catch {
      setVeiculos([])
    }
  }

  async function loadManutencoes() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await manutencaoService.list({ search, status, tipo, veiculo_id: veiculoId, page, limit })
      setItems(response.data)
      setTotal(response.meta.total)
      setSelectedManutencao((current) =>
        current && response.data.some((item) => item.id === current.id) ? current : response.data[0] ?? null,
      )
    } catch {
      setErrorMessage('Nao foi possivel carregar as manutencoes.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadAsideData(item: ManutencaoListItem) {
    try {
      setIsAsideLoading(true)
      const [detailResponse, historyResponse] = await Promise.all([
        manutencaoService.getById(item.id),
        manutencaoService.getByVeiculo(item.veiculo_id, 1, 6),
      ])

      setSelectedDetail(detailResponse.data)
      setVeiculoHistorico(historyResponse.data)
    } catch {
      setSelectedDetail(null)
      setVeiculoHistorico([])
    } finally {
      setIsAsideLoading(false)
    }
  }

  useEffect(() => {
    void loadVeiculos()
  }, [])

  useEffect(() => {
    void loadManutencoes()
  }, [page, limit, status, tipo, veiculoId])

  useEffect(() => {
    if (!selectedManutencao) {
      return
    }

    void loadAsideData(selectedManutencao)
  }, [selectedManutencao])

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Oficina e frota</p>
          <h1 className="dashboard-title">Manutencoes</h1>
          <p className="dashboard-subtitle">
            Controle administrativo das manutencoes com custo, status, oficina e previsao da proxima parada.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <button className="dashboard-chip" type="button" onClick={() => void loadManutencoes()}>
            Atualizar lista
          </button>
          <Link className="entity-action entity-action--primary" to="/dashboard/manutencoes/nova">
            Nova manutencao
          </Link>
        </div>
      </header>

      <div className="entity-toolbar">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="manutencao-search">Buscar</label>
          <input
            id="manutencao-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Descricao, oficina, placa ou modelo"
          />
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="manutencao-status">Status</label>
          <select id="manutencao-status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="manutencao-tipo">Tipo</label>
          <select id="manutencao-tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
            {tipoOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="manutencao-veiculo">Veiculo</label>
          <select id="manutencao-veiculo" value={veiculoId} onChange={(event) => setVeiculoId(event.target.value)}>
            <option value="">Todos os veiculos</option>
            {veiculos.map((veiculo) => (
              <option key={veiculo.id} value={String(veiculo.id)}>
                {veiculo.placa} - {veiculo.modelo}
              </option>
            ))}
          </select>
        </div>
        <div className="entity-toolbar__field">
          <label htmlFor="manutencao-limit">Por pagina</label>
          <select
            id="manutencao-limit"
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
            void loadManutencoes()
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
              <h2>Agenda de manutencoes</h2>
              <p>{total} registros encontrados</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando manutencoes...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhuma manutencao encontrada para os filtros informados.</div>
          ) : (
            <>
              <div className="entity-table">
                <div className="entity-table__head entity-table__head--manutencoes">
                  <span>Veiculo</span>
                  <span>Tipo e oficina</span>
                  <span>Agenda</span>
                  <span>Status</span>
                  <span>Acoes</span>
                </div>

                {items.map((item) => (
                  <div
                    className={`entity-table__row entity-table__row--manutencoes ${
                      selectedManutencao?.id === item.id ? 'is-selected' : ''
                    }`}
                    key={item.id}
                  >
                    <button
                      className="entity-table__main entity-table__main--manutencoes"
                      type="button"
                      onClick={() => setSelectedManutencao(item)}
                    >
                      <span className="entity-table__cell">
                        <strong>{item.veiculo_placa}</strong>
                        <small>{item.veiculo_modelo}</small>
                      </span>
                      <span className="entity-table__cell">
                        <strong>{formatLabel(item.tipo)}</strong>
                        <small>{item.oficina || 'Oficina nao informada'}</small>
                      </span>
                      <span className="entity-table__cell">
                        <strong>{formatDate(item.data_agendada)}</strong>
                        <small>Proxima km: {item.km_proxima_manutencao || 'Nao informada'}</small>
                      </span>
                      <span className="entity-table__cell entity-table__cell--status">
                        <span className={`entity-status entity-status--${item.status}`}>{formatLabel(item.status)}</span>
                      </span>
                    </button>
                    <span className="entity-table__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/manutencoes/${item.id}/editar`}>
                        Editar
                      </Link>
                      <Link
                        className="entity-action entity-action--secondary"
                        to={`/dashboard/veiculos/${item.veiculo_id}/manutencoes`}
                      >
                        Historico
                      </Link>
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
              <h2>Painel da manutencao</h2>
              <p>{selectedManutencao?.veiculo_placa ?? 'Selecione uma manutencao'}</p>
            </div>
          </div>

          {!selectedManutencao ? (
            <div className="entity-empty-state">Selecione uma manutencao para ver os detalhes e o historico do veiculo.</div>
          ) : isAsideLoading ? (
            <div className="entity-empty-state">Carregando dados complementares...</div>
          ) : (
            <div className="entity-aside">
              <div className="entity-kpi-grid">
                <div className="entity-kpi">
                  <span>Custo registrado</span>
                  <strong>{formatCurrency(selectedDetail?.custo ?? '0')}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Km na manutencao</span>
                  <strong>{selectedDetail?.km_na_manutencao || 'N/A'}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Proxima manutencao</span>
                  <strong>{nextMaintenanceKm || 'Nao definida'}</strong>
                </div>
                <div className="entity-kpi">
                  <span>Investimento no veiculo</span>
                  <strong>{formatCurrency(String(investmentSummary))}</strong>
                </div>
              </div>

              <div className="entity-timeline">
                <div className="entity-timeline__item">
                  <strong>{selectedDetail?.descricao ?? selectedManutencao.descricao}</strong>
                  <span>{selectedDetail?.oficina || 'Oficina nao informada'} - {formatDate(selectedDetail?.data_agendada ?? '')}</span>
                </div>

                {selectedDetail?.observacoes ? (
                  <div className="entity-timeline__item">
                    <strong>Observacoes internas</strong>
                    <span>{selectedDetail.observacoes}</span>
                  </div>
                ) : null}

                <div>
                  <h3>Historico recente do veiculo</h3>
                  {veiculoHistorico.length === 0 ? (
                    <p className="entity-empty-inline">Sem manutencoes anteriores cadastradas para este veiculo.</p>
                  ) : (
                    veiculoHistorico.map((item) => (
                      <div className="entity-timeline__item" key={item.id}>
                        <strong>{formatLabel(item.tipo)} - {item.oficina || 'Oficina nao informada'}</strong>
                        <span>{formatLabel(item.status)} - {formatDate(item.data_agendada || item.data_conclusao)}</span>
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
