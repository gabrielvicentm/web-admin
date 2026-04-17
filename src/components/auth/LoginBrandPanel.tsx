import heroImage from '../../assets/hero.png'

export function LoginBrandPanel() {
  return (
    <article className="login-brand-panel">
      <div className="login-brand-panel__logo" aria-label="Transportadora Gusmao">
        <button className="login-brand-panel__logo-mark" type="button">
          G
        </button>
        <button className="login-brand-panel__logo-wordmark" type="button">
          GUSMAO
        </button>
      </div>

      <figure className="login-brand-panel__figure">
        <img
          className="login-brand-panel__image"
          src={heroImage}
          width="320"
          height="320"
          alt="Imagem institucional generica da Transportadora Gusmao"
        />
      </figure>
    </article>
  )
}
