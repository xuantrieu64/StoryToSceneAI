import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { paths } from './paths'

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-svh place-items-center text-sm text-slate-600">
      Đang khôi phục phiên đăng nhập...
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />
  if (! isAuthenticated) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />
  }

  return children
}

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to={paths.dashboard} replace />

  return children
}
