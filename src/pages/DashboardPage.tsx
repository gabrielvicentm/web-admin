import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertIcon,
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
import { sessionService } from '../services/sessionService'
import './DashboardPage.css'

type DashboardNavItem = {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  to?: string
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
  { label: 'Manutencao', icon: WrenchIcon, to: '/dashboard/manutencao' },
  { label: 'Abastecimentos', icon: FuelIcon, to: '/dashboard/abastecimentos' },
  { label: 'Ocorrencias', icon: AlertIcon, to: '/dashboard/ocorrencias' },
  { label: 'Folha de pagamento', icon: PayrollIcon, to: '/dashboard/folha-pagamento' },
  { label: 'Relatorios', icon: ReportIcon, to: '/dashboard/relatorios' },
]

function getExpandedGroups(pathname: string) {
  return {
    Viagens: pathname.startsWith('/dashboard/viagens'),
    Veiculos: pathname.startsWith('/dashboard/veiculos'),
    Funcionarios: pathname.startsWith('/dashboard/funcionarios'),
    Motoristas: pathname.startsWith('/dashboard/motoristas'),
  }
}

export function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = sessionService.getSession()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(() => getExpandedGroups(location.pathname))

  useEffect(() => {
    setExpandedGroups((current) => ({
      ...current,
      ...getExpandedGroups(location.pathname),
    }))
  }, [location.pathname])

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
            const isGroupActive = item.children?.some((child) => location.pathname === child.to) ?? false

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
                        className={({ isActive }) =>
                          `dashboard-sidebar__sublink ${isActive ? 'dashboard-sidebar__sublink--active' : ''}`
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

          <div className="dashboard-topbar__badge">
            <span>{session?.user.actor_type ?? 'admin'}</span>
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
