import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { DashboardLoadingScreen } from '../components/dashboard/DashboardLoadingScreen'

export function ProtectedRoute() {
  const { currentUser, loading, sessionExpired } = useAuth()
  const location = useLocation()

  if (loading) {
    return <DashboardLoadingScreen />
  }

  // An idle-timeout sign-out keeps rendering the page the user was already
  // on — DashboardLayout blurs it behind a blocking "log in again" overlay
  // instead of navigating away. Any other unauthenticated access (first
  // visit, a manual logout) redirects to /login as usual.
  if (!currentUser && !sessionExpired) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
