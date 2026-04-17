import './AdminLoginPage.css'
import { AdminLoginForm } from '../components/auth/AdminLoginForm'
import { LoginBrandPanel } from '../components/auth/LoginBrandPanel'
import { AuthLayout } from '../layouts/AuthLayout'
import { authService } from '../services/authService'

export function AdminLoginPage() {
  async function handleLogin(values: { email: string; senha: string }) {
    await authService.loginAdmin(values)
  }

  return (
    <AuthLayout aside={<LoginBrandPanel />}>
      <AdminLoginForm onSubmit={handleLogin} />
    </AuthLayout>
  )
}
