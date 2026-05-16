import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './AdminLoginPage.css'
import logoImage from '../assets/logo.png'
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { AuthLayout } from '../layouts/AuthLayout'
import { authService } from '../services/authService'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [feedback, setFeedback] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (novaSenha.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (novaSenha !== confirmacaoSenha) {
      setErrorMessage('A confirmacao da senha precisa ser igual a nova senha.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const response = await authService.resetPassword({
        token,
        nova_senha: novaSenha,
      })
      setFeedback(response.message ?? 'Senha redefinida com sucesso.')
      window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel redefinir a senha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout aside={<LoginBrandPanel />}>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <div className="admin-login-form__brand">
          <img className="admin-login-form__brand-logo" src={logoImage} alt="Logo da Transportadora Gusmao" />
          <div>
            <strong className="admin-login-form__brand-title">Transportadora Gusmao</strong>
            <span className="admin-login-form__brand-subtitle">Redefinicao de senha administrativa</span>
          </div>
        </div>

        <div className="admin-login-form__heading">
          <h1 className="admin-login-form__title">Redefinir senha</h1>
          <p className="admin-login-form__subtitle">Cole o token recebido e defina uma nova senha para voltar ao dashboard.</p>
        </div>

        <fieldset className="admin-login-form__fieldset">
          <legend className="sr-only">Redefinicao de senha</legend>

          <div className="admin-login-form__field">
            <label className="admin-login-form__label" htmlFor="reset-token">
              Token de redefinicao
            </label>
            <input
              className="admin-login-form__input"
              id="reset-token"
              name="token"
              type="text"
              autoComplete="one-time-code"
              placeholder="Cole o token recebido"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
          </div>

          <div className="admin-login-form__field">
            <label className="admin-login-form__label" htmlFor="nova-senha">
              Nova senha
            </label>
            <input
              className="admin-login-form__input"
              id="nova-senha"
              name="novaSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Minimo de 6 caracteres"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              required
            />
          </div>

          <div className="admin-login-form__field">
            <label className="admin-login-form__label" htmlFor="confirmacao-senha">
              Confirmar nova senha
            </label>
            <input
              className="admin-login-form__input"
              id="confirmacao-senha"
              name="confirmacaoSenha"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={confirmacaoSenha}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              required
            />
          </div>
        </fieldset>

        <div className="admin-login-form__actions">
          {errorMessage ? <p className="admin-login-form__error">{errorMessage}</p> : null}
          {feedback ? <p className="admin-login-form__success">{feedback}</p> : null}
          <button className="admin-login-form__button admin-login-form__button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
          <div className="admin-login-form__links">
            <Link className="admin-login-form__link" to="/forgot-password">
              Solicitar novo token
            </Link>
            <Link className="admin-login-form__link" to="/login">
              Voltar ao login
            </Link>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
