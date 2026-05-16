import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  motoristaService,
  type Motorista,
  type MotoristaHistoricoViagem,
  type MotoristaIndicadores,
  type MotoristaOcorrencia,
} from '../services/motoristaService'

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

function formatDate(value?: string) {
  if (!value) {
    return 'Nao informada'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date)
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

function getInitials(nome?: string) {
  if (!nome) {
    return 'MT'
  }

  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatRoute(item: MotoristaHistoricoViagem) {
  const origem = [item.origem_cidade, item.origem_uf].filter(Boolean).join('/')
  const destino = [item.destino_cidade, item.destino_uf].filter(Boolean).join('/')

  if (!origem && !destino) {
    return 'Rota nao informada'
  }

  if (!destino) {
    return origem
  }

  return `${origem} para ${destino}`
}

function formatAddress(motorista: Motorista) {
  return [
    motorista.endereco_logradouro,
    motorista.endereco_numero,
    motorista.endereco_complemento,
    motorista.endereco_bairro,
    motorista.endereco_cidade,
    motorista.endereco_uf,
    motorista.endereco_cep,
  ]
    .filter(Boolean)
    .join(', ')
}

export function MotoristaDetailPage() {
  const { id } = useParams()
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [indicadores, setIndicadores] = useState<MotoristaIndicadores | null>(null)
  const [viagens, setViagens] = useState<MotoristaHistoricoViagem[]>([])
  const [ocorrencias, setOcorrencias] = useState<MotoristaOcorrencia[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const filteredTrips = useMemo(
    () => viagens.filter((item) => isWithinPeriod(item.data_saida, dataInicio, dataFim)),
    [viagens, dataInicio, dataFim],
  )

  const filteredOccurrences = useMemo(
    () => ocorrencias.filter((item) => isWithinPeriod(item.registrado_em, dataInicio, dataFim)),
    [ocorrencias, dataInicio, dataFim],
  )

  const tripsInPeriod = filteredTrips.length
  const freightInPeriod = useMemo(
    () => filteredTrips.reduce((total, item) => total + Number(item.valor_frete ?? 0), 0),
    [filteredTrips],
  )
  const occurrencesInPeriod = filteredOccurrences.length
  const completedTrips = useMemo(
    () => filteredTrips.filter((item) => ['concluida', 'finalizada'].includes(String(item.status ?? '').toLowerCase())).length,
    [filteredTrips],
  )

  useEffect(() => {
    if (!id) {
      return
    }

    const motoristaId = id

    async function loadMotoristaDetails() {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const [motoristaResponse, indicadoresResponse, viagensResponse, ocorrenciasResponse] = await Promise.all([
          motoristaService.getById(motoristaId),
          motoristaService.getIndicadores(motoristaId),
          motoristaService.getViagens(motoristaId),
          motoristaService.getOcorrencias(motoristaId),
        ])

        setMotorista(motoristaResponse.data)
        setIndicadores(indicadoresResponse.data)
        setViagens(viagensResponse.data)
        setOcorrencias(ocorrenciasResponse.data)
      } catch {
        setMotorista(null)
        setIndicadores(null)
        setViagens([])
        setOcorrencias([])
        setErrorMessage('Nao foi possivel carregar os detalhes do motorista.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadMotoristaDetails()
  }, [id])

  function handleClearPeriod() {
    setDataInicio('')
    setDataFim('')
  }

  if (isLoading) {
    return <section className="entity-empty-state">Carregando detalhes do motorista...</section>
  }

  if (!motorista) {
    return (
      <section className="entity-page">
        <div className="entity-empty-state">Motorista nao encontrado.</div>
        <div className="entity-form__actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/motoristas/listar">
            Voltar para listagem
          </Link>
        </div>
      </section>
    )
  }

  const enderecoCompleto = formatAddress(motorista)

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Detalhe do motorista</p>
          <h1 className="dashboard-title">{motorista.nome}</h1>
          <p className="dashboard-subtitle">
            Painel consolidado com indicadores, historico de viagens e ocorrencias operacionais conectadas ao backend.
          </p>
        </div>
        <div className="entity-page__hero-actions">
          <Link className="entity-action entity-action--secondary" to="/dashboard/motoristas/listar">
            Voltar para listagem
          </Link>
          <Link className="entity-action entity-action--ghost" to={`/dashboard/motoristas/${motorista.id}/editar`}>
            Editar motorista
          </Link>
          <Link className="entity-action entity-action--primary" to="/dashboard/viagens/listar">
            Ver viagens
          </Link>
        </div>
      </header>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}

      <div className="motorista-detail-layout">
        <div className="entity-aside">
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Indicadores do motorista</h2>
                <p>Dados vindos da view `vw_indicadores_motorista` e dos historicos ligados ao motorista.</p>
              </div>
              <span className={`entity-status entity-status--${motorista.status}`}>{formatLabel(motorista.status)}</span>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Total de viagens</span>
                <strong>{formatNumber(indicadores?.total_viagens)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Total km rodados</span>
                <strong>{formatNumber(indicadores?.total_km_rodados, 'km')}</strong>
              </div>
              <div className="entity-kpi">
                <span>Total de ocorrencias</span>
                <strong>{formatNumber(indicadores?.total_ocorrencias)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Total de frete gerado</span>
                <strong>{formatCurrency(indicadores?.total_frete_gerado)}</strong>
              </div>
            </div>

            <div className="entity-toolbar vehicle-history-toolbar">
              <div className="entity-toolbar__field">
                <label htmlFor="motorista-data-inicio">Inicio</label>
                <input
                  id="motorista-data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                />
              </div>
              <div className="entity-toolbar__field">
                <label htmlFor="motorista-data-fim">Fim</label>
                <input
                  id="motorista-data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                />
              </div>
              <button className="entity-action entity-action--ghost" type="button" onClick={handleClearPeriod}>
                Limpar periodo
              </button>
            </div>

            <div className="entity-kpi-grid entity-kpi-grid--4">
              <div className="entity-kpi">
                <span>Viagens no periodo</span>
                <strong>{tripsInPeriod}</strong>
              </div>
              <div className="entity-kpi">
                <span>Viagens concluidas</span>
                <strong>{completedTrips}</strong>
              </div>
              <div className="entity-kpi">
                <span>Frete no periodo</span>
                <strong>{formatCurrency(freightInPeriod)}</strong>
              </div>
              <div className="entity-kpi">
                <span>Ocorrencias no periodo</span>
                <strong>{occurrencesInPeriod}</strong>
              </div>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Historico de viagens</h2>
                <p>Ultimas viagens vinculadas ao motorista, com status, rota e valor de frete.</p>
              </div>
            </div>

            <div className="motorista-history-stack">
              {filteredTrips.length === 0 ? (
                <div className="entity-empty-state">Nenhuma viagem encontrada para o periodo informado.</div>
              ) : (
                filteredTrips.map((item) => (
                  <div className="entity-timeline__item" key={item.id}>
                    <strong>{formatRoute(item)}</strong>
                    <span>{formatDateTime(item.data_saida)} - {formatLabel(item.status)}</span>
                    <small>
                      Chegada prevista {formatDateTime(item.data_chegada_prevista)} · Frete {formatCurrency(item.valor_frete)}
                    </small>
                    <div className="entity-form__actions">
                      <Link className="entity-action entity-action--ghost" to={`/dashboard/viagens/${item.id}/editar`}>
                        Abrir viagem
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Ocorrencias registradas</h2>
                <p>Historico operacional do motorista com descricao, tipo e momento do registro.</p>
              </div>
            </div>

            <div className="motorista-history-stack">
              {filteredOccurrences.length === 0 ? (
                <div className="entity-empty-state">Nenhuma ocorrencia encontrada para o periodo informado.</div>
              ) : (
                filteredOccurrences.map((item) => (
                  <div className="entity-timeline__item" key={item.id}>
                    <strong>{formatLabel(item.tipo)}</strong>
                    <span>{formatDateTime(item.registrado_em)}</span>
                    <small>{item.descricao || 'Sem descricao adicional para esta ocorrencia.'}</small>
                    <small>
                      Coordenadas {formatNumber(item.latitude)} / {formatNumber(item.longitude)}
                    </small>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>

        <aside className="entity-aside">
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Perfil do motorista</h2>
                <p>Cadastro principal, situacao e dados de identificacao.</p>
              </div>
            </div>

            <div className="motorista-profile">
              <div className="entity-person entity-person--motorista">
                {motorista.foto_url ? (
                  <img
                    className="entity-person__avatar entity-person__avatar--motorista"
                    src={motorista.foto_url}
                    alt={`Foto de ${motorista.nome}`}
                  />
                ) : (
                  <span className="entity-person__avatar entity-person__avatar--motorista entity-person__avatar--placeholder">
                    {getInitials(motorista.nome)}
                  </span>
                )}
                <div className="motorista-profile__meta">
                  <strong>{motorista.nome}</strong>
                  <p>{motorista.email || 'Sem e-mail cadastrado'}</p>
                  <span className={`entity-status entity-status--${motorista.status}`}>{formatLabel(motorista.status)}</span>
                </div>
              </div>

              <div className="entity-detail-grid">
                <span>CPF</span>
                <strong>{motorista.cpf || 'Nao informado'}</strong>
                <span>CNH</span>
                <strong>{motorista.numero_cnh || 'Nao informada'}</strong>
                <span>Categoria</span>
                <strong>{motorista.tipo_cnh || 'Nao informada'}</strong>
                <span>Validade da CNH</span>
                <strong>{formatDate(motorista.validade_cnh)}</strong>
                <span>Data de admissao</span>
                <strong>{formatDate(motorista.data_admissao)}</strong>
                <span>Telefone</span>
                <strong>{motorista.telefone || 'Nao informado'}</strong>
              </div>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Contato e endereco</h2>
                <p>Informacoes administrativas do cadastro do motorista.</p>
              </div>
            </div>

            <div className="entity-detail-grid">
              <span>E-mail</span>
              <strong>{motorista.email || 'Nao informado'}</strong>
              <span>Telefone</span>
              <strong>{motorista.telefone || 'Nao informado'}</strong>
              <span>Endereco</span>
              <strong>{enderecoCompleto || 'Endereco nao cadastrado.'}</strong>
            </div>
          </article>

          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Observacoes</h2>
                <p>Notas adicionais da operacao e do RH.</p>
              </div>
            </div>

            <div className="entity-timeline__item">
              <strong>Registro interno</strong>
              <span>{motorista.observacoes || 'Nenhuma observacao registrada para este motorista.'}</span>
            </div>
          </article>
        </aside>
      </div>
    </section>
  )
}
