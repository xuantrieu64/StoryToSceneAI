import { useEffect, useState, type ReactNode } from 'react'
import { authService } from '@/services/authService'
import { getAccessToken, setAccessToken } from '@/auth/tokenStorage'
import { AuthContext } from './AuthContextCore'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '@/types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      try {
        const session = await authService.refresh()
        setAccessToken(session.access_token)

        const current = await authService.getCurrentUser()
        if (active) setUser(current.user)
      } catch {
        setAccessToken(null)
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      active = false
    }
  }, [])

  async function login(payload: LoginPayload): Promise<LoginResponse> {
    const result = await authService.login(payload)
    if ('requires_2fa' in result) return result

    setAccessToken(result.access_token)
    setUser(result.user)
    return result
  }

  async function register(payload: RegisterPayload): Promise<void> {
    await authService.register(payload)
  }

  async function verifyEmail(email: string, otp: string): Promise<void> {
    const session = await authService.verifyEmail({ email, otp })
    setAccessToken(session.access_token)
    setUser(session.user)

    try {
      await authService.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  async function resendOtp(email: string): Promise<void> {
    await authService.resendOtp(email)
  }

  async function logout(): Promise<void> {
    try {
      await authService.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  async function loginWithGoogle(credential: string): Promise<LoginResponse> {
    const result = await authService.googleLogin({ credential })
    if ('requires_2fa' in result) return result

    setAccessToken(result.access_token)
    setUser(result.user)
    return result
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null && getAccessToken() !== null,
        isLoading,
        login,
        register,
        verifyEmail,
        resendOtp,
        logout,
        loginWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
