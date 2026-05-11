import { Navigate, Outlet } from 'react-router-dom'
import { sessionService } from '../../services/sessionService'

export function PublicOnlyRoute() {
  if (sessionService.hasUsableSession()) {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}
