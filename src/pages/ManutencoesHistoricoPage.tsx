import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { manutencaoService, type ManutencaoListItem, type ManutencaoStatus } from '../services/manutencaoService'
import { veiculoService, type VeiculoListItem } from '../services/veiculoService'

function formatLabel(text: string) {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value: string) {
  const parsed = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(parsed) ? parsed : 0)
}

function formatDate(value: string) {
  if (!value) {
    return 'Sem data'
  }

  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T00:00:00`))
}

export function ManutencoesHistoricoPage() {
  const navigate = useNavigate()
  const { veiculoId: routeVeiculoId } = useParams()
  const [veiculos, setVeiculos] = useState<VeiculoListItem[]>([])
  const [veiculoId, setVeiculoId] = useState(routeVeiculoId ?? '')
  const [items, setItems] = useState<ManutencaoListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedVeiculo = useMemo(
    () => veiculos.find((item) => String(item.id) === veiculoId) ?? null,
    [veiculos, veiculoId],
  )

  const totalInvestido = useMemo(
    () =>
      items.reduce((accumulator, item) => {
        const parsed = Number(item.custo || 0)
        return accumulator + (Number.isFinite(parsed) ? parsed : 0)
      }, 0),
    [items],
  )

  const pendentes = useMemo(
    () => items.filter((item) => item.status === 'agendada' || item.status === 'em_andamento').length,
    [items],
  )

  const concluidas = useMemo(() => items.filter((item) => item.status === 'concluida').length, [items])

  const ultimaManutencao = useMemo(() => items.find((item) => item.data_conclusao || item.data_agendada) ?? null, [items])

  async function loadVeiculos() {
    try {
      const response = await veiculoService.list({ page: 1, limit: 100 })
      setVeiculos(response.data)

      if (!routeVeiculoId && response.data[0]) {
        setVeiculoId(String(response.data[0].id))
      }
    } catch {
      setVeiculos([])
    }
  }

  async function loadHistorico(targetVeiculoId: string) {
    if (!targetVeiculoId) {
      setItems([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await manutencaoService.getByVeiculo(targetVeiculoId, 1, 100)
      setItems(response.data)
    } catch {
      setErrorMessage('Nao foi possivel carregar o historico de manutencoes do veiculo.')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVeiculos()
  }, [routeVeiculoId])

  useEffect(() => {
    setVeiculoId(routeVeiculoId ?? '')
  }, [routeVeiculoId])

  useEffect(() => {
    void loadHistorico(veiculoId)
  }, [veiculoId])

  function handleVehicleChange(nextVeiculoId: string) {
    setVeiculoId(nextVeiculoId)

    if (nextVeiculoId) {
      navigate(`/dashboard/veiculos/${nextVeiculoId}/manutencoes`, { replace: true })
    }
  }

  function getStatusCount(status: ManutencaoStatus) {
    return items.filter((item) => item.status === status).length
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Historico por veiculo</p>
          <h1 className="dashboard-title">Manutencoes da frota</h1>
          <p className="dashboard-subtitle">
            Consulte o historico completo de manutencoes por veiculo, com leitura rapida de custos, status e oficina.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/manutencoes/listar">
            Voltar para manutencoes
          </Link>
          <Link className="entity-action entity-action--primary" to="/dashboard/manutencoes/nova">
            Nova manutencao
          </Link>
        </div>
      </header>

      <div className="entity-toolbar entity-toolbar--compact">
        <div className="entity-toolbar__field entity-toolbar__field--grow">
          <label htmlFor="historico-veiculo">Veiculo</label>
          <select id="historico-veiculo" value={veiculoId} onChange={(event) => handleVehicleChange(event.target.value)}>
            <option value="">Selecione um veiculo</option>
            {veiculos.map((veiculo) => (
              <option key={veiculo.id} value={String(veiculo.id)}>
                {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
              </option>
            ))}
          </select>
        </div>
        <button className="entity-action entity-action--secondary" type="button" onClick={() => void loadHistorico(veiculoId)}>
          Atualizar historico
        </button>
      </div>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="entity-grid">
        <article className="entity-card entity-card--table">
          <div className="entity-card__header">
            <div>
              <h2>Linha do tempo do veiculo</h2>
              <p>{selectedVeiculo ? `${selectedVeiculo.placa} - ${selectedVeiculo.modelo}` : 'Selecione um veiculo'}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="entity-empty-state">Carregando historico...</div>
          ) : items.length === 0 ? (
            <div className="entity-empty-state">Nenhuma manutencao cadastrada para este veiculo.</div>
          ) : (
            <div className="entity-timeline">
              {items.map((item) => (
                <div className="entity-timeline__item entity-timeline__item--maintenance" key={item.id}>
                  <div className="entity-timeline__meta">
                    <div>
                      <strong>{formatLabel(item.tipo)} - {item.oficina || 'Oficina nao informada'}</strong>
                      <span>{item.descricao}</span>
                    </div>
                    <span className={`entity-status entity-status--${item.status}`}>{formatLabel(item.status)}</span>
                  </div>

                  <div className="entity-detail-grid">
                    <span>Agendada: <strong>{formatDate(item.data_agendada)}</strong></span>
                    <span>Conclusao: <strong>{formatDate(item.data_conclusao)}</strong></span>
                    <span>KM na manutencao: <strong>{item.km_na_manutencao || 'Nao informado'}</strong></span>
                    <span>Proxima manutencao: <strong>{item.km_proxima_manutencao || 'Nao informado'}</strong></span>
                    <span>Custo: <strong>{formatCurrency(item.custo)}</strong></span>
                  </div>

                  <div className="entity-table__actions">
                    <Link className="entity-action entity-action--ghost" to={`/dashboard/manutencoes/${item.id}/editar`}>
                      Editar registro
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="entity-card entity-card--aside">
          <div className="entity-card__header">
            <div>
              <h2>Resumo do veiculo</h2>
              <p>{selectedVeiculo?.placa ?? 'Nenhum veiculo selecionado'}</p>
            </div>
          </div>

          <div className="entity-aside">
            <div className="entity-kpi-grid">
              <div className="entity-kpi">
                <span>Total de manutencoes</span>
                <strong>{items.length}</strong>
              </div>
              <div className="entity-kpi">
                <span>Pendentes</span>
                <strong>{pendentes}</strong>
              </div>
              <div className="entity-kpi">
                <span>Concluidas</span>
                <strong>{concluidas}</strong>
              </div>
              <div className="entity-kpi">
                <span>Investimento total</span>
                <strong>{formatCurrency(String(totalInvestido))}</strong>
              </div>
            </div>

            <div className="entity-timeline">
              <div>
                <h3>Status da carteira</h3>
                <div className="entity-metric-list">
                  <span>Agendadas: <strong>{getStatusCount('agendada')}</strong></span>
                  <span>Em andamento: <strong>{getStatusCount('em_andamento')}</strong></span>
                  <span>Concluidas: <strong>{getStatusCount('concluida')}</strong></span>
                  <span>Canceladas: <strong>{getStatusCount('cancelada')}</strong></span>
                </div>
              </div>

              <div>
                <h3>Ultimo apontamento</h3>
                {ultimaManutencao ? (
                  <div className="entity-timeline__item">
                    <strong>{formatLabel(ultimaManutencao.tipo)}</strong>
                    <span>{formatDate(ultimaManutencao.data_conclusao || ultimaManutencao.data_agendada)}</span>
                  </div>
                ) : (
                  <p className="entity-empty-inline">Sem apontamentos registrados.</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
