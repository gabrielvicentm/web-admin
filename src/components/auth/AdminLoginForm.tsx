import { useState } from 'react'
import logoImage from '../../assets/logo.png'

type AdminLoginFormValues = {
  email: string
  senha: string
}

type AdminLoginFormProps = {
  onSubmit: (values: AdminLoginFormValues) => Promise<void> | void
  errorMessage?: string
}

export function AdminLoginForm({ onSubmit, errorMessage = '' }: AdminLoginFormProps) {
  const [formValues, setFormValues] = useState<AdminLoginFormValues>({
    email: '',
    senha: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formValues)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <div className="admin-login-form__brand">
        <img className="admin-login-form__brand-logo" src={logoImage} alt="Logo da Transportadora Gusmao" />
        <div>
          <strong className="admin-login-form__brand-title">Transportadora Gusmao</strong>
          <span className="admin-login-form__brand-subtitle">Acesso ao sistema interno</span>
        </div>
      </div>

      <div className="admin-login-form__heading">
        <h1 className="admin-login-form__title">Entrar</h1>
        <p className="admin-login-form__subtitle">Use suas credenciais administrativas para acessar o dashboard.</p>
      </div>

      <fieldset className="admin-login-form__fieldset">
        <legend className="sr-only">Acesso administrativo</legend>

        <div className="admin-login-form__field">
          <label className="admin-login-form__label" htmlFor="email">
            E-mail corporativo
          </label>
          <input
            className="admin-login-form__input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="E-mail corporativo"
            value={formValues.email}
            onChange={handleChange}
          />
        </div>

        <div className="admin-login-form__field">
          <label className="admin-login-form__label" htmlFor="senha">
            Senha
          </label>
          <input
            className="admin-login-form__input"
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={formValues.senha}
            onChange={handleChange}
          />
        </div>
      </fieldset>

      <div className="admin-login-form__actions">
        {errorMessage ? <p className="admin-login-form__error">{errorMessage}</p> : null}
        <button
          className="admin-login-form__button admin-login-form__button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}
