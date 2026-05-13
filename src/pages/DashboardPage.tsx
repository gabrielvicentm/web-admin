import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertIcon,
  BellIcon,
  ChevronDownIcon,
  FuelIcon,
  GridIcon,
  ListIcon,
  LogOutIcon,
  MenuIcon,
  PayrollIcon,
  PlusIcon,
  ReportIcon,
  RouteIcon,
  TruckIcon,
  UserBadgeIcon,
  UsersIcon,
  WrenchIcon,
} from '../components/dashboard/DashboardIcons'
import { authService } from '../services/authService'
import { notificacaoService } from '../services/notificacaoService'
import { sessionService } from '../services/sessionService'
import './DashboardPage.css'

type DashboardBadgeKey = 'notifications'

type DashboardNavItem = {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  to?: string
  badgeKey?: DashboardBadgeKey
  children?: Array<{
    label: string
    icon: ComponentType<SVGProps<SVGSVGElement>>
    to: string
  }>
}

const navigationItems: DashboardNavItem[] = [
  { label: 'Dashboard', icon: GridIcon, to: '/dashboard' },
  {
    label: 'Viagens',
    icon: RouteIcon,
    children: [
      { label: 'Listar viagens', icon: ListIcon, to: '/dashboard/viagens/listar' },
      { label: 'Historico finalizadas', icon: ListIcon, to: '/dashboard/viagens/finalizadas' },
      { label: 'Nova viagem', icon: PlusIcon, to: '/dashboard/viagens/nova' },
    ],
  },
  {
    label: 'Veiculos',
    icon: TruckIcon,
    children: [
      { label: 'Listar veiculos', icon: ListIcon, to: '/dashboard/veiculos/listar' },
      { label: 'Novo veiculo', icon: PlusIcon, to: '/dashboard/veiculos/novo' },
    ],
  },
  {
    label: 'Funcionarios',
    icon: UsersIcon,
    children: [
      { label: 'Listar funcionarios', icon: ListIcon, to: '/dashboard/funcionarios/listar' },
      { label: 'Novo funcionario', icon: PlusIcon, to: '/dashboard/funcionarios/novo' },
    ],
  },
  {
    label: 'Motoristas',
    icon: UserBadgeIcon,
    children: [
      { label: 'Listar motoristas', icon: ListIcon, to: '/dashboard/motoristas/listar' },
      { label: 'Novo motorista', icon: PlusIcon, to: '/dashboard/motoristas/novo' },
    ],
  },
  { label: 'Clientes', icon: UsersIcon, to: '/dashboard/clientes/listar' },
  { label: 'Tipos de carga', icon: ReportIcon, to: '/dashboard/tipos-carga/listar' },
  {
    label: 'Manutencoes',
    icon: WrenchIcon,
    children: [
      { label: 'Listar manutencoes', icon: ListIcon, to: '/dashboard/manutencoes/listar' },
      { label: 'Nova manutencao', icon: PlusIcon, to: '/dashboard/manutencoes/nova' },
    ],
  },
  { label: 'Abastecimentos', icon: FuelIcon, to: '/dashboard/abastecimentos' },
  { label: 'Ocorrencias', icon: AlertIcon, to: '/dashboard/ocorrencias' },
  { label: 'Notificacoes', icon: BellIcon, to: '/dashboard/notificacoes', badgeKey: 'notifications' },
  { label: 'Folha de pagamento', icon: PayrollIcon, to: '/dashboard/folha-pagamento' },
  { label: 'Historico de alteracoes', icon: ListIcon, to: '/dashboard/historico-alteracoes' },
  { label: 'Relatorios', icon: ReportIcon, to: '/dashboard/relatorios' },
]

function getExpandedGroups(pathname: string) {
  return {
    Viagens: pathname.startsWith('/dashboard/viagens'),
    Veiculos: pathname.startsWith('/dashboard/veiculos'),
    Funcionarios: pathname.startsWith('/dashboard/funcionarios'),
    Motoristas: pathname.startsWith('/dashboard/motoristas'),
    Manutencoes: pathname.startsWith('/dashboard/manutencoes'),
  }
}

function isSidebarRouteActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = sessionService.getSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(() => getExpandedGroups(location.pathname))
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const notificationBadgeLabel = unreadNotifications > 99 ? '99+' : String(unreadNotifications)

  function renderSidebarBadge(badgeKey?: DashboardBadgeKey) {
    if (badgeKey !== 'notifications' || unreadNotifications <= 0) {
      return null
    }

    return <span className="dashboard-sidebar__badge">{notificationBadgeLabel}</span>
  }

  useEffect(() => {
    setExpandedGroups((current) => ({
      ...current,
      ...getExpandedGroups(location.pathname),
    }))
  }, [location.pathname])

  useEffect(() => {
    let isActive = true

    async function loadUnreadNotifications() {
      try {
        const count = await notificacaoService.countUnread()

        if (isActive) {
          setUnreadNotifications(count)
        }
      } catch {
        if (isActive) {
          setUnreadNotifications(0)
        }
      }
    }

    void loadUnreadNotifications()

    return () => {
      isActive = false
    }
  }, [location.pathname])

  useEffect(() => {
    const controller = new AbortController()

    void notificacaoService
      .subscribeAdmin({
        signal: controller.signal,
        onNotification(notification) {
          if (!notification.lida) {
            setUnreadNotifications((current) => current + 1)
          }
        },
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          void notificacaoService.countUnread().then(setUnreadNotifications).catch(() => setUnreadNotifications(0))
        }
      })

    return () => {
      controller.abort()
    }
  }, [])

  function handleToggleGroup(label: keyof ReturnType<typeof getExpandedGroups>) {
    setExpandedGroups((current) => ({
      ...current,
      [label]: !current[label],
    }))
  }

  function handleLogout() {
    authService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'dashboard-sidebar--open' : ''}`}>
        <div className="dashboard-sidebar__brand">
          <div className="dashboard-sidebar__logo">
            <span>TG</span>
          </div>
          <div>
            <strong>TransGestao</strong>
            <p>Painel administrativo</p>
          </div>
        </div>

        <nav className="dashboard-sidebar__nav" aria-label="Navegacao principal">
          {navigationItems.map((item) => {
            const isGrouped = Boolean(item.children?.length)
            const isGroupActive = item.children?.some((child) => isSidebarRouteActive(location.pathname, child.to)) ?? false

            if (!isGrouped && item.to) {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `dashboard-sidebar__link ${isActive ? 'dashboard-sidebar__link--active' : ''}`
                  }
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon width={18} height={18} />
                  <span>{item.label}</span>
                  {renderSidebarBadge(item.badgeKey)}
                </NavLink>
              )
            }

            const Icon = item.icon
            const isExpanded = expandedGroups[item.label as keyof typeof expandedGroups]

            return (
              <div className={`dashboard-sidebar__group ${isGroupActive ? 'is-active' : ''}`} key={item.label}>
                <button
                  className={`dashboard-sidebar__link ${isGroupActive ? 'dashboard-sidebar__link--active' : ''}`}
                  type="button"
                  onClick={() => handleToggleGroup(item.label as keyof typeof expandedGroups)}
                >
                  <Icon width={18} height={18} />
                  <span>{item.label}</span>
                  <ChevronDownIcon
                    className={`dashboard-sidebar__chevron ${isExpanded ? 'dashboard-sidebar__chevron--open' : ''}`}
                    width={16}
                    height={16}
                  />
                </button>

                <div className={`dashboard-sidebar__submenu ${isExpanded ? 'dashboard-sidebar__submenu--open' : ''}`}>
                  {item.children?.map((child) => {
                    const ChildIcon = child.icon

                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={() =>
                          `dashboard-sidebar__sublink ${
                            isSidebarRouteActive(location.pathname, child.to) ? 'dashboard-sidebar__sublink--active' : ''
                          }`
                        }
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <ChildIcon width={14} height={14} />
                        <span>{child.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="dashboard-sidebar__footer">
          <div className="dashboard-sidebar__user">
            <strong>{session?.user.nome ?? 'Administrador'}</strong>
            <span>{session?.user.role ?? 'admin'}</span>
          </div>
          <button className="dashboard-sidebar__logout" type="button" onClick={handleLogout}>
            <LogOutIcon width={18} height={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-shell__content">
        <header className="dashboard-topbar">
          <button className="dashboard-topbar__menu" type="button" onClick={() => setIsSidebarOpen((value) => !value)}>
            <MenuIcon width={20} height={20} />
          </button>

          <div className="dashboard-topbar__welcome">
            <strong>{session?.user.nome ?? 'Equipe administrativa'}</strong>
            <span>{session?.user.email ?? 'painel@transgestao.local'}</span>
          </div>

          <div className="dashboard-topbar__actions">
            <NavLink
              className="dashboard-topbar__notifications"
              to="/dashboard/notificacoes"
              aria-label={
                unreadNotifications > 0
                  ? `${unreadNotifications} notificacoes nao lidas`
                  : 'Nenhuma notificacao nao lida'
              }
            >
              <BellIcon width={20} height={20} />
              {unreadNotifications > 0 ? (
                <span className="dashboard-notification-badge">{notificationBadgeLabel}</span>
              ) : null}
            </NavLink>

            <div className="dashboard-topbar__badge">
              <span>{session?.user.actor_type ?? 'admin'}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen ? <button className="dashboard-overlay" type="button" onClick={() => setIsSidebarOpen(false)} /> : null}
    </div>
  )
}
