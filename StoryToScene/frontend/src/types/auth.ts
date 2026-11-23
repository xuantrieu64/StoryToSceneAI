export type User = {
  id: number
  name: string
  email: string
  avatar_url: string | null
  role: string
  two_factor_enabled: boolean
  two_factor_recovery_codes_remaining: number
  wallet?: {
    balance_available: number
    balance_held: number
  } | null
  last_login_at: string | null
  created_at: string | null
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export type RegisterResponse = {
  message: string
  email: string
}

export type VerifyEmailPayload = {
  email: string
  otp: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type SessionResponse = {
  access_token: string
  expires_in: number
  user: User
}

export type TwoFactorChallenge = {
  requires_2fa: true
  two_factor_token: string
}

export type LoginResponse = SessionResponse | TwoFactorChallenge

export type CurrentUserResponse = {
  user: User
}

export type GoogleLoginPayload = {
  credential: string
}

export type ApiFieldErrors = Record<string, string[]>

export type ApiError = {
  code: string
  message: string
  status: number
  fieldErrors?: ApiFieldErrors
}
