import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLoginPage.css'
import { AdminLoginForm } from '../components/auth/AdminLoginForm'
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { AuthLayout } from '../layouts/AuthLayout'
import { authService } from '../services/authService'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogin(values: { email: string; senha: string }) {
    try {
      setErrorMessage('')
      const session = await authService.loginAdmin(values)

      if (session.access_token) {
        navigate('/dashboard', { replace: true })
        return
      }

      setErrorMessage('Login retornou sucesso, mas sem token de acesso valido.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nao foi possivel realizar o login.'
      setErrorMessage(message)
    }
  }

  return (
    <AuthLayout aside={<LoginBrandPanel />}>
      <AdminLoginForm errorMessage={errorMessage} onSubmit={handleLogin} />
    </AuthLayout>
  )
}
