import { useState } from 'react'
import { authService } from '../services/authService'

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sem expiracao'
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

export function AdminPasswordResetPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      setFeedback('')
      const response = await authService.generateAdminPasswordResetToken({ email })
      setToken(response.data.token)
      setExpiresAt(response.data.expires_at)
      setFeedback(response.message ?? 'Token de redefinicao gerado com sucesso.')
    } catch (error) {
      setToken('')
      setExpiresAt('')
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel gerar o token.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopyToken() {
    if (!token) {
      return
    }

    try {
      await navigator.clipboard.writeText(token)
      setFeedback('Token copiado para a area de transferencia.')
    } catch {
      setFeedback('Nao foi possivel copiar automaticamente. Copie manualmente o token exibido.')
    }
  }

  return (
    <section className="entity-page">
      <header className="entity-page__hero">
        <div>
          <p className="dashboard-eyebrow">Acessos</p>
          <h1 className="dashboard-title">Reset interno de senha</h1>
          <p className="dashboard-subtitle">
            Gere um token temporario para um admin interno e repasse por canal operacional confiavel.
          </p>
        </div>
      </header>

      {errorMessage ? <p className="entity-feedback entity-feedback--error">{errorMessage}</p> : null}
      {feedback ? <p className="entity-feedback entity-feedback--success">{feedback}</p> : null}

      <form className="entity-form" onSubmit={handleSubmit}>
        <article className="entity-card">
          <div className="entity-card__header">
            <div>
              <h2>Gerar token</h2>
              <p>Informe o e-mail do usuario administrativo que precisa redefinir a senha.</p>
            </div>
          </div>

          <div className="entity-form__grid entity-form__grid--4">
            <label className="entity-field entity-field--span-2">
              <span>E-mail do admin</span>
              <input
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@empresa.com"
                required
              />
            </label>
          </div>

          <div className="entity-form__actions">
            <button className="entity-action entity-action--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Gerando...' : 'Gerar token'}
            </button>
          </div>
        </article>

        {token ? (
          <article className="entity-card">
            <div className="entity-card__header">
              <div>
                <h2>Token gerado</h2>
                <p>Esse token e de uso unico. Envie apenas por um canal interno confiavel.</p>
              </div>
            </div>

            <div className="entity-form__grid entity-form__grid--4">
              <label className="entity-field entity-field--span-4">
                <span>Token</span>
                <textarea value={token} readOnly rows={4} />
              </label>
              <div className="trip-selection">
                <span>Expira em</span>
                <strong>{formatDateTime(expiresAt)}</strong>
                <small>Depois disso, sera necessario gerar outro token.</small>
              </div>
            </div>

            <div className="entity-form__actions">
              <button className="entity-action entity-action--secondary" type="button" onClick={() => void handleCopyToken()}>
                Copiar token
              </button>
            </div>
          </article>
        ) : null}
      </form>
    </section>
  )
}
