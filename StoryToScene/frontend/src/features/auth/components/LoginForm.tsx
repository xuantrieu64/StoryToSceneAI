import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/auth/useAuth'
import type { ApiError } from '@/types/auth'
import { AUTH_NOT_CONNECTED, authRoutes } from '../auth-config'
import { FormNotice, GoogleButton, OrDivider, PrimaryButton, TextField } from './FormControls'

const emailField = z.email('Vui lòng nhập email hợp lệ.')

const passwordSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
  remember: z.boolean(),
})
const codeSchema = z.object({ email: emailField })

/** Kiểu nút chính / nút Google cỡ lớn theo thiết kế Login. */
const bigPrimary = 'h-[52px] gap-2 rounded-xl bg-jade-700 text-base hover:bg-jade-800 shadow-[0_12px_24px_-12px_rgb(3_108_69/0.7)]'
const bigGoogle = 'h-[52px] gap-3 rounded-xl text-base font-semibold [&_svg]:size-5'

/** Đăng nhập bằng mật khẩu: email, mật khẩu (hiện/ẩn), ghi nhớ đăng nhập. */
function PasswordForm({
  onSubmitted,
  onForgot,
  isLoading,
}: {
  onSubmitted: (values: z.infer<typeof passwordSchema>) => Promise<void>
  onForgot: () => void
  isLoading: boolean
}) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  return (
    <form noValidate onSubmit={handleSubmit(onSubmitted)} className="flex flex-col gap-5">
      <TextField
        id={`${id}-email`}
        label="Email"
        icon={Mail}
        inputSize="lg"
        type="email"
        autoComplete="email"
        placeholder="ten@example.com"
        error={formState.errors.email?.message}
        {...register('email')}
      />
      <TextField
        id={`${id}-password`}
        label="Mật khẩu"
        icon={Lock}
        inputSize="lg"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="Nhập mật khẩu"
        error={formState.errors.password?.message}
        labelAside={
          <button type="button" onClick={onForgot} className="text-sm leading-5 font-semibold text-jade-600 hover:text-jade-700 hover:underline">
            Quên mật khẩu?
          </button>
        }
        endAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-jade-500/40 focus-visible:outline-none"
          >
            {showPassword ? <Eye aria-hidden="true" className="size-5" /> : <EyeOff aria-hidden="true" className="size-5" />}
          </button>
        }
        {...register('password')}
      />
      <label className="flex cursor-pointer items-center gap-3 text-sm leading-5 text-slate-700">
        <input type="checkbox" className="size-5 shrink-0 cursor-pointer rounded accent-jade-600" {...register('remember')} />
        Ghi nhớ đăng nhập trên thiết bị này
      </label>
      <PrimaryButton type="submit" className={bigPrimary} disabled={isLoading}>
        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        <ArrowRight aria-hidden="true" className="size-5" />
      </PrimaryButton>
    </form>
  )
}

/** Quên mật khẩu → đăng nhập bằng mã gửi qua email (chưa có thiết kế bước nhập mã). */
function CodeForm({ onSubmitted, onBack }: { onSubmitted: () => void; onBack: () => void }) {
  const id = useId()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
  })
  return (
    <form noValidate onSubmit={handleSubmit(onSubmitted)} className="flex flex-col gap-5">
      <p className="text-sm leading-6 text-slate-600">Nhập email đã đăng ký, chúng tôi sẽ gửi mã đăng nhập cho bạn.</p>
      <TextField
        id={`${id}-email`}
        label="Email"
        icon={Mail}
        inputSize="lg"
        type="email"
        autoComplete="email"
        placeholder="ten@example.com"
        error={formState.errors.email?.message}
        {...register('email')}
      />
      <PrimaryButton type="submit" className={bigPrimary}>
        Gửi mã đăng nhập
        <ArrowRight aria-hidden="true" className="size-5" />
      </PrimaryButton>
      <button type="button" onClick={onBack} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-jade-600 hover:text-jade-700 hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Đăng nhập bằng mật khẩu
      </button>
    </form>
  )
}

export function LoginForm() {
  const [mode, setMode] = useState<'password' | 'code'>('password')
  const [notice, setNotice] = useState(false)
  const [authError, setAuthError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const showNotice = () => setNotice(true)
  const switchMode = (next: 'password' | 'code') => {
    setMode(next)
    setNotice(false)
    setAuthError(null)
  }

  const submitPassword = async (values: z.infer<typeof passwordSchema>) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      const result = await login({
        email: values.email,
        password: values.password,
      })

      if ('requires_2fa' in result) {
        setAuthError({
          code: 'two_factor_required',
          message: 'Tài khoản yêu cầu xác thực hai lớp. Giao diện xác minh 2FA chưa được triển khai.',
          status: 202,
        })
        return
      }

      const state = location.state as { from?: string } | null
      navigate(state?.from && state.from !== authRoutes.login ? state.from : authRoutes.dashboard, { replace: true })
    } catch (error) {
      setAuthError(error as ApiError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <GoogleButton className={bigGoogle} onClick={showNotice}>
        Tiếp tục với Google
      </GoogleButton>
      <OrDivider label="HOẶC" />

      {mode === 'password' ? (
        <PasswordForm onSubmitted={submitPassword} onForgot={() => switchMode('code')} isLoading={isLoading} />
      ) : (
        <CodeForm onSubmitted={showNotice} onBack={() => switchMode('password')} />
      )}

      {authError && <FormNotice tone="error">{authError.message}</FormNotice>}
      {notice && <FormNotice>{AUTH_NOT_CONNECTED}</FormNotice>}

      <p className="mt-7 text-center text-[15px] leading-6 text-slate-700">
        Chưa có tài khoản?{' '}
        <Link to={authRoutes.register} className="font-semibold text-jade-600 hover:text-jade-700 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
