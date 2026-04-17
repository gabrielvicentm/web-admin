import { useState } from 'react'

type AdminLoginFormValues = {
  email: string
  senha: string
}

type AdminLoginFormProps = {
  onSubmit: (values: AdminLoginFormValues) => Promise<void> | void
}

export function AdminLoginForm({ onSubmit }: AdminLoginFormProps) {
  const [formValues, setFormValues] = useState<AdminLoginFormValues>({
    email: '',
    senha: '',
  })

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(formValues)
  }

  return (
    <form className="admin-login-form" onSubmit={handleSubmit}>
      <fieldset className="admin-login-form__fieldset">
        <legend className="sr-only">Acesso administrativo</legend>

        <div className="admin-login-form__field">
          <label className="sr-only" htmlFor="email">
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
          <label className="sr-only" htmlFor="senha">
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
        <button className="admin-login-form__button admin-login-form__button--primary" type="submit">
          Entrar
        </button>
        <button className="admin-login-form__button admin-login-form__button--secondary" type="button">
          Recuperar senha
        </button>
      </div>
    </form>
  )
}
