import { useEffect, useMemo, useState } from 'react'
import {
  AlertIcon,
  FuelIcon,
  ListIcon,
  PayrollIcon,
  ReportIcon,
  RouteIcon,
  TruckIcon,
  UserBadgeIcon,
  WrenchIcon,
} from '../components/dashboard/DashboardIcons'
import { dashboardService, type DashboardSnapshot } from '../services/dashboardService'

function formatCurrency(value?: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
}

function formatNumber(value?: number, suffix = '') {
  const formatted = new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
  return suffix ? `${formatted} ${suffix}` : formatted
}

function formatPercent(value?: number) {
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number(value ?? 0))}%`
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return 'Atualizacao indisponivel'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `Atualizado em ${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)}`
}

export function DashboardHome() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadSnapshot() {
      try {
        setIsLoading(true)
        setErrorMessage('')
        const response = await dashboardService.getSnapshot()

        if (isActive) {
          setSnapshot(response.data)
        }
      } catch {
        if (isActive) {
          setErrorMessage('Nao foi possivel carregar os indicadores do dashboard.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadSnapshot()

    return () => {
      isActive = false
    }
  }, [])

  const summaryCards = useMemo(() => {
    if (!snapshot) {
      return []
    }

    return [
      {
        title: 'Viagens atrasadas',
        value: formatNumber(snapshot.summary.viagens_atrasadas),
        hint: `${formatNumber(snapshot.summary.viagens_em_andamento)} em rota e ${formatNumber(snapshot.summary.viagens_pendentes)} pendentes`,
        tone: 'orange',
        icon: RouteIcon,
      },
      {
        title: 'Finalizacoes pendentes',
        value: formatNumber(snapshot.metrics.finalizacoes_pendentes),
        hint: `${formatNumber(snapshot.metrics.paradas_abertas)} paradas abertas exigindo retorno`,
        tone: 'blue',
        icon: ListIcon,
      },
      {
        title: 'Frota indisponivel',
        value: formatNumber(snapshot.summary.veiculos_indisponiveis),
        hint: `${formatNumber(snapshot.summary.manutencoes_em_andamento)} manutencoes em andamento`,
        tone: 'cyan',
        icon: TruckIcon,
      },
      {
        title: 'Alertas criticos',
        value: formatNumber(snapshot.summary.alertas_pendencias_total),
        hint: `${formatNumber(snapshot.summary.alertas_criticos_total)} vencem em ate 7 dias`,
        tone: 'green',
        icon: UserBadgeIcon,
      },
    ]
  }, [snapshot])

  const panels = useMemo(() => {
    if (!snapshot) {
      return []
    }

    return [
      {
        title: 'Custo operacional hoje',
        metric: formatCurrency(snapshot.metrics.gasto_operacional_hoje),
        description: `Abastecimento ${formatCurrency(snapshot.metrics.gasto_abastecimento_hoje)} + manutencao ${formatCurrency(snapshot.metrics.gasto_manutencao_hoje)}`,
        icon: PayrollIcon,
      },
      {
        title: 'Despacho e entrega',
        metric: formatNumber(snapshot.metrics.viagens_concluidas_hoje),
        description: `${formatNumber(snapshot.summary.viagens_hoje)} saidas hoje e ${formatNumber(snapshot.summary.viagens_pendentes)} aguardando despacho`,
        icon: ReportIcon,
      },
      {
        title: 'Disponibilidade da frota',
        metric: formatPercent(snapshot.metrics.disponibilidade_frota),
        description: `${formatNumber(snapshot.summary.veiculos_em_uso)} em uso e ${formatNumber(snapshot.summary.veiculos_indisponiveis)} indisponiveis`,
        icon: WrenchIcon,
      },
      {
        title: 'Abastecimentos e ocorrencias',
        metric: formatNumber(snapshot.metrics.abastecimentos_hoje),
        description: `${formatNumber(snapshot.metrics.ocorrencias_hoje)} ocorrencias registradas e ${formatNumber(snapshot.metrics.paradas_abertas)} paradas abertas`,
        icon: FuelIcon,
      },
    ]
  }, [snapshot])

  const alertColumns = useMemo(() => {
    if (!snapshot) {
      return []
    }

    return [
      {
        title: 'Alertas operacionais',
        items: snapshot.alerts.operational,
      },
      {
        title: 'Frota e documentacao',
        items: snapshot.alerts.fleet,
      },
    ]
  }, [snapshot])

  return (
    <div className="dashboard-home">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Dashboard</p>
          <h1 className="dashboard-title">Visao geral da operacao</h1>
          <p className="dashboard-subtitle">
            Acompanhe os indicadores mais importantes da transportadora em um unico painel.
          </p>
        </div>
        <div className="dashboard-chip-row">
          <span className="dashboard-chip dashboard-chip--success">Sistema online</span>
          <span className="dashboard-chip">{formatUpdatedAt(snapshot?.updated_at)}</span>
        </div>
      </section>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}
      {isLoading ? <section className="entity-empty-state">Carregando dashboard...</section> : null}

      {!isLoading && snapshot ? (
        <>
      <section className="dashboard-summary-grid">
        {summaryCards.map(({ title, value, hint, tone, icon: Icon }) => (
          <article className={`dashboard-card dashboard-card--${tone}`} key={title}>
            <div>
              <p className="dashboard-card__label">{title}</p>
              <strong className="dashboard-card__value">{value}</strong>
              <p className="dashboard-card__hint">{hint}</p>
            </div>
            <span className="dashboard-card__icon">
              <Icon width={24} height={24} />
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard-layout-grid">
        <article className="dashboard-panel dashboard-panel--span-12">
          <header className="dashboard-panel__header">
            <div>
              <h2>Indicadores</h2>
              <p>Leitura consolidada da operacao, frota e custos do dia.</p>
            </div>
          </header>

          <div className="dashboard-metric-stack">
            {panels.map(({ title, metric, description, icon: Icon }) => (
              <div className="dashboard-metric" key={title}>
                <span className="dashboard-metric__icon">
                  <Icon width={18} height={18} />
                </span>
                <div>
                  <p>{title}</p>
                  <strong>{metric}</strong>
                  <span>{description}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        {alertColumns.map((column) => (
          <article className="dashboard-panel dashboard-panel--span-6" key={column.title}>
            <header className="dashboard-panel__header">
              <div>
                <h2>{column.title}</h2>
                <p>Itens que merecem acompanhamento ao longo do dia.</p>
              </div>
            </header>

            <div className="dashboard-alert-list">
              {column.items.map((item) => (
                <div className="dashboard-alert" key={item}>
                  <AlertIcon width={16} height={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        ))}

        <article className="dashboard-panel dashboard-panel--span-12">
          <header className="dashboard-panel__header">
            <div>
              <h2>Operacao em andamento</h2>
              <p>Resumo das viagens e equipes monitoradas agora.</p>
            </div>
          </header>

          <div className="dashboard-table">
            <div className="dashboard-table__head">
              <span>Veiculo</span>
              <span>Motorista</span>
              <span>Rota</span>
              <span>Status</span>
            </div>
            {snapshot.activities.length === 0 ? (
              <div className="dashboard-table__row">
                <span>Nenhum</span>
                <span>Sem viagens</span>
                <span>Nao ha operacoes em andamento</span>
                <span className="dashboard-status-pill">Sem dados</span>
              </div>
            ) : snapshot.activities.map((activity) => (
              <div className="dashboard-table__row" key={activity.id}>
                <span>{activity.vehicle}</span>
                <span>{activity.driver}</span>
                <span>{activity.route}</span>
                <span className="dashboard-status-pill">{formatStatusLabel(activity.status)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
        </>
      ) : null}
    </div>
  )
}
