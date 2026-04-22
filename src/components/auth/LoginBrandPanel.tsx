import logoImage from '../../assets/logo.png'

export function LoginBrandPanel() {
  return (
    <article className="login-brand-panel">
      <div className="login-brand-panel__spotlight">
        <img className="login-brand-panel__logo-image" src={logoImage} alt="Logo da Transportadora Gusmao" />
        <div className="login-brand-panel__title-group">
          <strong>Transportadora Gusmao</strong>
          <span>Painel administrativo</span>
        </div>
      </div>
    </article>
  )
}
