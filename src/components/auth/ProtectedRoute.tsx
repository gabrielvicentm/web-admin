import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { sessionService } from '../../services/sessionService'

export function ProtectedRoute() {
  const location = useLocation()

  if (!sessionService.hasUsableSession()) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return <Outlet />
}
