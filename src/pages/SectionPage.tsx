import { useLocation } from 'react-router-dom'

function formatSectionTitle(pathname: string) {
  const section = pathname
    .replace('/dashboard/', '')
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ')

  return section || 'Dashboard'
}

export function SectionPage() {
  const location = useLocation()
  const title = formatSectionTitle(location.pathname)

  return (
    <section className="dashboard-placeholder">
      <p className="dashboard-eyebrow">Modulo</p>
      <h1 className="dashboard-title">{title}</h1>
      <p className="dashboard-subtitle">
        Esta area ja esta preparada dentro da estrutura protegida do sistema e pode receber listagens, formularios e
        filtros sem mudar a navegacao principal.
      </p>

      <div className="dashboard-placeholder__card">
        <strong>Espaco pronto para evolucao</strong>
        <p>
          A sidebar, as rotas internas e o controle de autenticacao ja estao conectados. Agora fica simples encaixar as
          proximas telas da operacao.
        </p>
      </div>
    </section>
  )
}
