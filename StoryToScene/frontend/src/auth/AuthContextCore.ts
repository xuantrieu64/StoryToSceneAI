import { createContext } from 'react'
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from '@/types/auth'

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<LoginResponse>
  register: (payload: RegisterPayload) => Promise<void>
  verifyEmail: (email: string, otp: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: (credential: string) => Promise<LoginResponse>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
