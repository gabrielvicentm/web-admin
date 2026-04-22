import {
  AlertIcon,
  FuelIcon,
  PayrollIcon,
  ReportIcon,
  RouteIcon,
  TruckIcon,
  UserBadgeIcon,
  UsersIcon,
  WrenchIcon,
} from '../components/dashboard/DashboardIcons'

const summaryCards = [
  { title: 'Total de viagens', value: '128', hint: '12 viagens iniciadas hoje', tone: 'blue', icon: RouteIcon },
  { title: 'Veiculos em uso', value: '34', hint: '6 indisponiveis no momento', tone: 'cyan', icon: TruckIcon },
  { title: 'Motoristas ativos', value: '52', hint: '4 com vencimentos proximos', tone: 'green', icon: UserBadgeIcon },
  { title: 'Alertas e pendencias', value: '9', hint: '3 itens exigem acao imediata', tone: 'orange', icon: AlertIcon },
]

const quickActions = [
  { title: 'Nova viagem', description: 'Cadastrar rota e equipe de atendimento', icon: RouteIcon },
  { title: 'Novo veiculo', description: 'Adicionar frota e documentacao', icon: TruckIcon },
  { title: 'Novo funcionario', description: 'Registrar colaborador administrativo', icon: UsersIcon },
  { title: 'Novo motorista', description: 'Vincular condutor e categorias', icon: UserBadgeIcon },
]

const alertColumns = [
  {
    title: 'Alertas operacionais',
    items: [
      '3 viagens aguardando liberacao de carga',
      '2 motoristas com CNH vencendo nesta semana',
      '1 ocorrencia aberta sem responsavel definido',
    ],
  },
  {
    title: 'Manutencoes e abastecimentos',
    items: [
      'Revisao preventiva do veiculo GHI-9012 agendada para amanha',
      'Abastecimento acima da media no veiculo ABC-1234',
      'Troca de pneus pendente em 2 veiculos',
    ],
  },
]

const activities = [
  { vehicle: 'ABC-1234', driver: 'Carlos Silva', route: 'Fortaleza > Recife', status: 'Em rota' },
  { vehicle: 'JKL-3456', driver: 'Ana Costa', route: 'Salvador > Maceio', status: 'Carregando' },
  { vehicle: 'MNO-7890', driver: 'Joao Pedro', route: 'Sao Luis > Teresina', status: 'Em conferencia' },
  { vehicle: 'QRS-1122', driver: 'Maria Oliveira', route: 'Natal > Joao Pessoa', status: 'Concluida' },
]

const panels = [
  {
    title: 'Resumo financeiro',
    metric: 'R$ 18.420,00',
    description: 'Custos operacionais registrados hoje',
    icon: PayrollIcon,
  },
  {
    title: 'Relatorios gerenciais',
    metric: '14',
    description: 'Relatorios prontos para exportacao',
    icon: ReportIcon,
  },
  {
    title: 'Saude da frota',
    metric: '91%',
    description: 'Disponibilidade media da operacao',
    icon: WrenchIcon,
  },
  {
    title: 'Abastecimentos',
    metric: '23',
    description: 'Lancamentos validados nas ultimas 24h',
    icon: FuelIcon,
  },
]

export function DashboardHome() {
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
          <span className="dashboard-chip">Atualizado ha 2 min</span>
        </div>
      </section>

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
        <article className="dashboard-panel dashboard-panel--span-8">
          <header className="dashboard-panel__header">
            <div>
              <h2>Atalhos rapidos</h2>
              <p>Fluxos mais usados para manter a operacao em movimento.</p>
            </div>
          </header>

          <div className="dashboard-shortcuts">
            {quickActions.map(({ title, description, icon: Icon }) => (
              <button className="dashboard-shortcut" key={title} type="button">
                <span className="dashboard-shortcut__icon">
                  <Icon width={20} height={20} />
                </span>
                <strong>{title}</strong>
                <span>{description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--span-4">
          <header className="dashboard-panel__header">
            <div>
              <h2>Indicadores</h2>
              <p>Blocos prontos para leitura rapida da equipe.</p>
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
            {activities.map((activity) => (
              <div className="dashboard-table__row" key={`${activity.vehicle}-${activity.driver}`}>
                <span>{activity.vehicle}</span>
                <span>{activity.driver}</span>
                <span>{activity.route}</span>
                <span className="dashboard-status-pill">{activity.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
