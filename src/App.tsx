import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { ClienteFormPage } from './pages/ClienteFormPage'
import { ClientesListPage } from './pages/ClientesListPage'
import { DashboardHome } from './pages/DashboardHome'
import { DashboardPage } from './pages/DashboardPage'
import { MotoristaFormPage } from './pages/MotoristaFormPage'
import { MotoristasListPage } from './pages/MotoristasListPage'
import { SectionPage } from './pages/SectionPage'
import { TipoCargaFormPage } from './pages/TipoCargaFormPage'
import { TiposCargaListPage } from './pages/TiposCargaListPage'
import { VeiculoFormPage } from './pages/VeiculoFormPage'
import { VeiculosListPage } from './pages/VeiculosListPage'

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
          <Route path="veiculos/listar" element={<VeiculosListPage />} />
          <Route path="veiculos/novo" element={<VeiculoFormPage />} />
          <Route path="veiculos/:id/editar" element={<VeiculoFormPage />} />
          <Route path="clientes/listar" element={<ClientesListPage />} />
          <Route path="clientes/novo" element={<ClienteFormPage />} />
          <Route path="clientes/:id/editar" element={<ClienteFormPage />} />
          <Route path="tipos-carga/listar" element={<TiposCargaListPage />} />
          <Route path="tipos-carga/novo" element={<TipoCargaFormPage />} />
          <Route path="tipos-carga/:id/editar" element={<TipoCargaFormPage />} />
          <Route path="funcionarios/listar" element={<SectionPage />} />
          <Route path="funcionarios/novo" element={<SectionPage />} />
          <Route path="motoristas/listar" element={<MotoristasListPage />} />
          <Route path="motoristas/novo" element={<MotoristaFormPage />} />
          <Route path="motoristas/:id/editar" element={<MotoristaFormPage />} />
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
