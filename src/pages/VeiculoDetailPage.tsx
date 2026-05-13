import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  veiculoService,
  type Veiculo,
  type VeiculoConsumoMedioItem,
  type VeiculoConsumo,
  type VeiculoCustoTotalItem,
  type VeiculoCustos,
  type VeiculoHistoricoItem,
} from '../services/veiculoService'

function formatLabel(text?: string) {
  if (!text) {
    return 'Nao informado'
  }

  return text.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCurrency(value?: number | string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
}

function formatNumber(value?: number | string, suffix = '') {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))

  return suffix ? `${formatted} ${suffix}` : formatted
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
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function isWithinPeriod(value: string | undefined, startDate: string, endDate: string) {
  if (!value) {
    return !startDate && !endDate
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return false
  }

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`)
    if (date < start) {
      return false
    }
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`)
    if (date > end) {
      return false
    }
  }

  return true
}

export function VeiculoDetailPage() {
  const { id } = useParams()
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null)
  const [custos, setCustos] = useState<VeiculoCustos | null>(null)
  const [consumo, setConsumo] = useState<VeiculoConsumo | null>(null)
  const [historico, setHistorico] = useState<VeiculoHistoricoItem[]>([])
  const [rankingConsumo, setRankingConsumo] = useState<VeiculoConsumoMedioItem[]>([])
  const [rankingCustos, setRankingCustos] = useState<VeiculoCustoTotalItem[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const filteredHistory = useMemo(
    () => historico.filter((item) => isWithinPeriod(item.data_evento, dataInicio, dataFim)),
    [historico, dataInicio, dataFim],
  )

  const maintenanceEvents = useMemo(
    () => filteredHistory.filter((item) => item.tipo === 'manutencao').length,
    [filteredHistory],
  )

  const fuelingEvents = useMemo(
    () => filteredHistory.filter((item) => item.tipo === 'abastecimento').length,
    [filteredHistory],
  )

  const tripEvents = useMemo(
    () => filteredHistory.filter((item) => item.tipo === 'viagem').length,
    [filteredHistory],
  )

  const consumoPosition = useMemo(
    () => rankingConsumo.findIndex((item) => item.veiculo_id === String(veiculo?.id)) + 1,
    [rankingConsumo, veiculo?.id],
  )

  const custosPosition = useMemo(
    () => rankingCustos.findIndex((item) => item.veiculo_id === String(veiculo?.id)) + 1,
    [rankingCustos, veiculo?.id],
  )

  useEffect(() => {
    if (!id) {
      return
    }

    const veiculoId = id

    async function loadVeiculoDetails() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const [veiculoResponse, custosResponse, consumoResponse, historicoResponse, consumoMedioResponse, custosTotaisResponse] = await Promise.all([
          veiculoService.getById(veiculoId),
          veiculoService.getCustos(veiculoId),
          veiculoService.getConsumo(veiculoId),
          veiculoService.getHistorico(veiculoId),
          veiculoService.listConsumoMedio({ page: 1, limit: 10 }),
          veiculoService.listCustosTotais({ page: 1, limit: 10 }),
        ])

        setVeiculo(veiculoResponse.data)
        setCustos(custosResponse.data)
        setConsumo(consumoResponse.data)
        setHistorico(historicoResponse.data)
        setRankingConsumo(consumoMedioResponse.data)
        setRankingCustos(custosTotaisResponse.data)
      } catch {
        setVeiculo(null)
        setCustos(null)
        setConsumo(null)
        setHistorico([])
        setRankingConsumo([])
        setRankingCustos([])
        setErrorMessage('Nao foi possivel carregar os detalhes do veiculo.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadVeiculoDetails()
  }, [id])

  function handleClearPeriod() {
    setDataInicio('')
    setDataFim('')
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando detalhes do veiculo...</section>
  }

  if (!veiculo) {
    return (
      <section className="entity-page">
        <div className="entity-empty-state">Veiculo nao encontrado.</div>
        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/veiculos/listar">
            Voltar para listagem
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Detalhe do veiculo</p>
          <h1 className="dashboard-title">{veiculo.placa}</h1>
          <p className="dashboard-subtitle">
            {veiculo.marca} {veiculo.modelo} - {veiculo.ano}. Visao completa de consumo, custos e historico operacional com filtro por periodo.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/veiculos/listar">
            Voltar para listagem
          </Link>
          <Link className="entity-action entity-action--ghost" to={`/dashboard/veiculos/${veiculo.id}/editar`}>
            Editar veiculo
          </Link>
          <Link className="entity-action entity-action--primary" to={`/dashboard/veiculos/${veiculo.id}/manutencoes`}>
            Ver manutencoes
          </Link>
        </div>
      </header>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="vehicle-detail-layout">
        <div className="entity-aside">
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Resumo financeiro e operacional</h2>
                <p>Indicadores consolidados de uso, combustivel e manutencao.</p>
              </div>
              <span className={`entity-status entity-status--${veiculo.status}`}>{formatLabel(veiculo.status)}</span>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Consumo medio</span>
                <strong>{formatNumber(consumo?.consumo_km_por_litro, 'km/l')}</strong>
              </div>
              <div className="entity-kpi">
                <span>Custo combustivel</span>
                <strong>{formatCurrency(custos?.custo_combustivel)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Custo manutencao</span>
                <strong>{formatCurrency(custos?.custo_manutencao)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Custo total</span>
                <strong>{formatCurrency(custos?.custo_total)}</strong>
              </div>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Ranking consumo</span>
                <strong>{consumoPosition > 0 ? `${consumoPosition}º` : 'N/A'}</strong>
              </div>
              <div className="entity-kpi">
                <span>Ranking custo</span>
                <strong>{custosPosition > 0 ? `${custosPosition}º` : 'N/A'}</strong>
              </div>
              <div className="entity-kpi">
                <span>Veiculo lider em consumo</span>
                <strong>{rankingConsumo[0]?.placa ?? 'N/A'}</strong>
                <span>{rankingConsumo[0] ? formatNumber(rankingConsumo[0].consumo_km_por_litro, 'km/l') : 'Sem ranking'}</span>
              </div>
              <div className="entity-kpi">
                <span>Veiculo de maior custo</span>
                <strong>{rankingCustos[0]?.placa ?? 'N/A'}</strong>
                <span>{rankingCustos[0] ? formatCurrency(rankingCustos[0].custo_total) : 'Sem ranking'}</span>
              </div>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Consumo e custo acumulado</h2>
                <p>Base alimentada pelos endpoints de consumo e custo por veiculo.</p>
              </div>
            </div>

            <div className="entity-detail-grid">
              <span>Total de abastecimentos</span>
              <strong>{formatNumber(consumo?.total_abastecimentos)}</strong>
              <span>Total de litros</span>
              <strong>{formatNumber(consumo?.total_litros, 'l')}</strong>
              <span>Km percorridos</span>
              <strong>{formatNumber(consumo?.km_percorridos, 'km')}</strong>
              <span>KM atual</span>
              <strong>{formatNumber(veiculo.km_atual, 'km')}</strong>
              <span>Capacidade de carga</span>
              <strong>{veiculo.capacidade_carga_kg ? formatNumber(veiculo.capacidade_carga_kg, 'kg') : 'Nao informada'}</strong>
              <span>RENAVAM</span>
              <strong>{veiculo.renavam || 'Nao informado'}</strong>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Historico completo</h2>
                <p>Filtre os eventos operacionais e financeiros por periodo.</p>
              </div>
            </div>

            <div className="entity-toolbar vehicle-history-toolbar">
              <div className="entity-toolbar__field">
                <label htmlFor="veiculo-data-inicio">Inicio</label>
                <input
                  id="veiculo-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </div>
              <div className="entity-toolbar__field">
                <label htmlFor="veiculo-data-fim">Fim</label>
                <input id="veiculo-data-fim" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
              </div>
              <button className="entity-action entity-action--ghost" type="button" onClick={handleClearPeriod}>
                Limpar periodo
              </button>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Eventos no periodo</span>
                <strong>{filteredHistory.length}</strong>
              </div>
              <div className="entity-kpi">
                <span>Viagens</span>
                <strong>{tripEvents}</strong>
              </div>
              <div className="entity-kpi">
                <span>Abastecimentos</span>
                <strong>{fuelingEvents}</strong>
              </div>
              <div className="entity-kpi">
                <span>Manutencoes</span>
                <strong>{maintenanceEvents}</strong>
              </div>
            </div>

            <div className="vehicle-history-stack">
              {filteredHistory.length === 0 ? (
                <div className="entity-empty-state">Nenhum evento encontrado para o periodo informado.</div>
              ) : (
                filteredHistory.map((item) => (
                  <div className="entity-timeline__item" key={item.id}>
                    <strong>{item.titulo ?? formatLabel(item.tipo)}</strong>
                    <span>{formatDateTime(item.data_evento)} - {formatLabel(item.status ?? item.tipo)}</span>
                    <small>{item.descricao ?? 'Sem detalhes adicionais para este evento.'}</small>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Comparativo da frota</h2>
                <p>Dados alimentados pelos endpoints agregados de consumo medio e custo total.</p>
              </div>
            </div>

            <div className="vehicle-comparison-grid">
              <div className="vehicle-comparison-panel">
                <h3>Top consumo medio</h3>
                {rankingConsumo.length === 0 ? (
                  <p className="entity-empty-inline">Sem dados de consumo medio.</p>
                ) : (
                  <div className="entity-table">
                    <div className="entity-table__head entity-table__head--vehicle-ranking">
                      <span>Veiculo</span>
                      <span>Consumo</span>
                    </div>
                    {rankingConsumo.map((item) => (
                      <div className="entity-table__row entity-table__row--vehicle-ranking" key={item.veiculo_id}>
                        <span className="entity-table__cell">
                          <strong>{item.placa}</strong>
                          <small>{item.modelo}</small>
                        </span>
                        <span className="entity-table__cell">
                          <strong>{formatNumber(item.consumo_km_por_litro, 'km/l')}</strong>
                          <small>{formatNumber(item.total_abastecimentos)} abastecimentos</small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="vehicle-comparison-panel">
                <h3>Maiores custos totais</h3>
                {rankingCustos.length === 0 ? (
                  <p className="entity-empty-inline">Sem dados de custo total.</p>
                ) : (
                  <div className="entity-table">
                    <div className="entity-table__head entity-table__head--vehicle-ranking">
                      <span>Veiculo</span>
                      <span>Custo total</span>
                    </div>
                    {rankingCustos.map((item) => (
                      <div className="entity-table__row entity-table__row--vehicle-ranking" key={item.veiculo_id}>
                        <span className="entity-table__cell">
                          <strong>{item.placa}</strong>
                          <small>{item.modelo}</small>
                        </span>
                        <span className="entity-table__cell">
                          <strong>{formatCurrency(item.custo_total)}</strong>
                          <small>Manutencao {formatCurrency(item.custo_manutencao)}</small>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>

        <aside className="entity-aside">
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Cadastro do veiculo</h2>
                <p>Informacoes operacionais, status e vencimentos.</p>
              </div>
            </div>

            <div className="entity-detail-grid">
              <span>Placa</span>
              <strong>{veiculo.placa}</strong>
              <span>Modelo</span>
              <strong>{veiculo.modelo}</strong>
              <span>Marca</span>
              <strong>{veiculo.marca}</strong>
              <span>Ano</span>
              <strong>{veiculo.ano}</strong>
              <span>Tipo</span>
              <strong>{formatLabel(veiculo.tipo)}</strong>
              <span>Status</span>
              <strong>{formatLabel(veiculo.status)}</strong>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Documentacao e seguro</h2>
                <p>Campos administrativos associados ao cadastro da frota.</p>
              </div>
            </div>

            <div className="entity-detail-grid">
              <span>Seguradora</span>
              <strong>{veiculo.seguradora || 'Nao informada'}</strong>
              <span>Apolice</span>
              <strong>{veiculo.numero_apolice || 'Nao informada'}</strong>
              <span>Vencimento do seguro</span>
              <strong>{veiculo.vencimento_seguro || 'Nao informado'}</strong>
              <span>Licenciamento</span>
              <strong>{veiculo.vencimento_licenciamento || 'Nao informado'}</strong>
              <span>IPVA</span>
              <strong>{veiculo.vencimento_ipva || 'Nao informado'}</strong>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Observacoes</h2>
                <p>Anotacoes complementares da equipe administrativa.</p>
              </div>
            </div>

            <div className="entity-timeline__item">
              <strong>Notas internas</strong>
              <span>{veiculo.observacoes || 'Nenhuma observacao registrada para este veiculo.'}</span>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}
