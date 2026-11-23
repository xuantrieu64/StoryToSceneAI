import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, setAccessToken } from '@/auth/tokenStorage'
import type { ApiError, ApiFieldErrors } from '@/types/auth'

const configuredBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const apiBaseUrl = configuredBaseUrl ? `${configuredBaseUrl}/v1` : '/api/v1'

// Origin do trình duyệt gửi tự động. TODO: xác nhận VITE_AUTH_REFRESH_ORIGIN sau khi biết domain SPA thật.
export const REFRESH_REQUEST_CONFIG = {
  origin: (import.meta.env.VITE_AUTH_REFRESH_ORIGIN as string | undefined) ?? window.location.origin,
  requestedWith: 'XMLHttpRequest',
} as const

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

let refreshPromise: Promise<string> | null = null
let loginRedirectStarted = false

function normalizeApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data
    const record = typeof data === 'object' && data !== null
      ? data as Record<string, unknown>
      : {}
    const rawFieldErrors = record.errors
    let fieldErrors: ApiFieldErrors | undefined

    if (typeof rawFieldErrors === 'object' && rawFieldErrors !== null) {
      fieldErrors = {}
      for (const [field, value] of Object.entries(rawFieldErrors)) {
        if (Array.isArray(value)) {
          fieldErrors[field] = value.filter((item): item is string => typeof item === 'string')
        }
      }
    }

    return {
      code: typeof record.code === 'string' ? record.code : 'unknown_error',
      message: typeof record.message === 'string'
        ? record.message
        : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.',
      status: error.response?.status ?? 0,
      fieldErrors,
    }
  }

  return {
    code: 'network_error',
    message: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
    status: 0,
  }
}

function shouldSkipRefresh(url: string | undefined): boolean {
  if (! url) return false
  return /\/auth\/(?:login|register|refresh)(?:\?|$)/.test(url)
}

function redirectToLoginOnce(): void {
  if (loginRedirectStarted) return
  loginRedirectStarted = true
  setAccessToken(null)
  window.location.replace('/login')
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = api.post<{ access_token: string }>(
    '/auth/refresh',
    undefined,
    {
      headers: {
        'X-Requested-With': REFRESH_REQUEST_CONFIG.requestedWith,
      },
    },
  ).then((response) => {
    setAccessToken(response.data.access_token)
    return response.data.access_token
  }).finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

type RetryableRequestConfig = AxiosRequestConfig & { _authRetry?: boolean }

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    const axiosError = error instanceof AxiosError ? error : null
    const status = axiosError?.response?.status
    const originalRequest = axiosError?.config as RetryableRequestConfig | undefined

    if (
      status === 401
      && originalRequest
      && ! originalRequest._authRetry
      && ! shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._authRetry = true

      try {
        const token = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers ?? {}
        if ('set' in originalRequest.headers && typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${token}`)
        } else {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api.request(originalRequest)
      } catch {
        redirectToLoginOnce()
      }
    }

    return Promise.reject(normalizeApiError(error))
  },
)

export async function getPing(): Promise<unknown> {
  const response = await api.get('/ping')
  return response.data
}
