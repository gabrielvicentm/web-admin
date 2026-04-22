import { Navigate, Outlet } from 'react-router-dom'
import { sessionService } from '../../services/sessionService'

export function PublicOnlyRoute() {
  if (sessionService.isAuthenticated()) {
    return <Navigate replace to="/dashboard" />
  }

  return <Outlet />
}
