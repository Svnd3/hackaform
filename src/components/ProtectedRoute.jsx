import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function ProtectedRoute() {
  const { authenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="route-loading" role="status">
        <span className="route-loading__mark" aria-hidden="true">H</span>
        <strong>Getting your workspace ready…</strong>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

