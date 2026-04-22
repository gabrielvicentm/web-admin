import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { DashboardHome } from './pages/DashboardHome'
import { DashboardPage } from './pages/DashboardPage'
import { SectionPage } from './pages/SectionPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<AdminLoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />}>
          <Route index element={<DashboardHome />} />
          <Route path="viagens/listar" element={<SectionPage />} />
          <Route path="viagens/nova" element={<SectionPage />} />
          <Route path="veiculos/listar" element={<SectionPage />} />
          <Route path="veiculos/novo" element={<SectionPage />} />
          <Route path="funcionarios/listar" element={<SectionPage />} />
          <Route path="funcionarios/novo" element={<SectionPage />} />
          <Route path="motoristas/listar" element={<SectionPage />} />
          <Route path="motoristas/novo" element={<SectionPage />} />
          <Route path="manutencao" element={<SectionPage />} />
          <Route path="abastecimentos" element={<SectionPage />} />
          <Route path="ocorrencias" element={<SectionPage />} />
          <Route path="folha-pagamento" element={<SectionPage />} />
          <Route path="relatorios" element={<SectionPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}

export default App
