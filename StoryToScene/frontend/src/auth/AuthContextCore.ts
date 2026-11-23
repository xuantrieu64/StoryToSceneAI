import { createContext } from 'react'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  SessionResponse,
  User,
} from '@/types/auth'

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<void>
  verifyEmail: (email: string, otp: string) => Promise<SessionResponse>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
