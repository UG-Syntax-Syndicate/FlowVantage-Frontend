import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuthLoadingOverlay } from '../components/auth/AuthLoadingOverlay'
import { peekPendingAuthRedirect } from '../lib/pendingAuthRedirect'

export function PublicOnlyRoute() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return <AuthLoadingOverlay />
  }

  if (currentUser) {
    return <Navigate to={peekPendingAuthRedirect() ?? '/dashboard'} replace />
  }

  return <Outlet />
}
