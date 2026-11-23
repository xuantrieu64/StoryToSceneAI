import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContextCore'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (! context) throw new Error('useAuth phải được dùng trong AuthProvider.')
  return context
}
