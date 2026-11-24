import { useId, useState, type FormEvent } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, RotateCw, UserRound } from 'lucide-react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/auth/useAuth'
import type { ApiError } from '@/types/auth'
import { siteLinks } from '@/config/site-links'
import { ActionLink } from '@/features/home/components/shared/ActionLink'
import { authRoutes } from '../auth-config'
import { FormNotice, GoogleButton, OrDivider, PrimaryButton, TextField } from './FormControls'
import { OtpInput } from './OtpInput'
import { PasswordStrength } from './PasswordStrength'

const MIN_PASSWORD = 10
const OTP_LENGTH = 6

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên.'),
    email: z.email('Vui lòng nhập email hợp lệ.'),
    password: z.string().min(MIN_PASSWORD, `Mật khẩu cần tối thiểu ${MIN_PASSWORD} ký tự.`),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
    code: z.string(),
    agree: z.boolean().refine((v) => v, 'Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  })

type RegisterValues = z.infer<typeof registerSchema>
type NoticeAt = 'submit' | 'google' | null

/** Nút hiện/ẩn mật khẩu nằm trong ô nhập. */
function VisibilityToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      aria-pressed={shown}
      className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-jade-500/40 focus-visible:outline-none"
    >
      {shown ? <Eye aria-hidden="true" className="size-5" /> : <EyeOff aria-hidden="true" className="size-5" />}
    </button>
  )
}

export function RegisterForm({ onVerificationChange }: { onVerificationChange: (verifying: boolean) => void }) {
  const id = useId()
  const [notice, setNotice] = useState<NoticeAt>(null)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [authError, setAuthError] = useState<ApiError | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isResendingCode, setIsResendingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, control, formState, trigger, setError, setFocus, getValues, reset } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', code: '', agree: false },
  })
  const { errors } = formState
  const password = useWatch({ control, name: 'password' })
  const agreed = useWatch({ control, name: 'agree' })

  const { register: registerAccount, verifyEmail, resendOtp } = useAuth()
  const navigate = useNavigate()

  const submitRegistration = async (values: RegisterValues) => {
    setAuthError(null)
    setAuthSuccess(null)
    setIsRegistering(true)
    try {
      const email = values.email
      await registerAccount({
        name: values.fullName,
        email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      })
      reset({
        fullName: '',
        email,
        password: '',
        confirmPassword: '',
        code: '',
        agree: false,
      })
      setStep('verify')
      onVerificationChange(true)
      setNotice(null)
      setAuthSuccess('Mã xác minh đã được gửi đến email của bạn.')
    } catch (error) {
      setNotice('submit')
      setAuthError(error as ApiError)
    } finally {
      setIsRegistering(false)
    }
  }

  const submitVerification = async (values: RegisterValues) => {
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(values.code)) {
      setError('code', {
        type: 'validate',
        message: `Vui lòng nhập đủ ${OTP_LENGTH} số của mã xác minh.`,
      })
      return
    }

    setIsSubmitting(true)
    setAuthError(null)
    try {
      await verifyEmail(values.email, values.code)
      navigate(authRoutes.login, {
        replace: true,
        state: { successMessage: 'Xác thực email thành công. Bạn có thể đăng nhập.' },
      })
    } catch (error) {
      setNotice('submit')
      setAuthError(error as ApiError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)
    setAuthSuccess(null)

    if (step === 'register') {
      const valid = await trigger(['fullName', 'email', 'password', 'confirmPassword', 'agree'])
      if (!valid) {
        setFocus('email')
        return
      }

      await submitRegistration(getValues())
      return
    }

    const emailValid = await trigger('email')
    if (!emailValid) {
      setFocus('email')
      return
    }

    await submitVerification(getValues())
  }

  const resendCode = async () => {
    setAuthError(null)
    setAuthSuccess(null)
    setIsResendingCode(true)
    try {
      await resendOtp(getValues('email'))
      setAuthSuccess('Mã xác minh mới đã được gửi đến email của bạn.')
    } catch (error) {
      setAuthError(error as ApiError)
    } finally {
      setIsResendingCode(false)
    }
  }

  const { loginWithGoogle } = useAuth()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const requireGoogleAgreement = () => {
    setAuthError(null)
    if (!agreed) {
      setError('agree', { message: 'Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật trước khi đăng ký bằng Google.' })
      setFocus('agree')
      return
    }
    if (!googleClientId) {
      setNotice('google')
      setAuthError({
        code: 'google_not_configured',
        message: 'Đăng ký bằng Google hiện chưa được cấu hình.',
        status: 0,
      })
    }
  }

  const googleSignUp = async (response: CredentialResponse) => {
    const credential = response.credential
    if (!credential) {
      setNotice('google')
      setAuthError({
        code: 'google_credential_missing',
        message: 'Google không trả về thông tin xác thực. Vui lòng thử lại.',
        status: 0,
      })
      return
    }

    setAuthError(null)
    try {
      const result = await loginWithGoogle(credential)
      if ('requires_2fa' in result) {
        setNotice('google')
        setAuthError({
          code: 'two_factor_required',
          message: 'Tài khoản yêu cầu xác thực hai lớp. Luồng xác minh 2FA chưa được triển khai.',
          status: 202,
        })
        return
      }
      navigate(authRoutes.dashboard, { replace: true })
    } catch (error) {
      setNotice('google')
      setAuthError(error as ApiError)
    }
  }

  const googleSignUpFailed = () => {
    setNotice('google')
    setAuthError({
      code: 'google_login_failed',
      message: 'Không thể đăng nhập bằng Google. Vui lòng thử lại.',
      status: 0,
    })
  }

  const codeLabelId = `${id}-code-label`

  return (
    <form noValidate onSubmit={handleFormSubmit}>
      {step === 'register' && <>
        <div className="flex flex-col gap-4">
          <TextField
            id={`${id}-name`}
            label="Họ và tên"
            requiredMark
            aria-required
            leadingIcon={UserRound}
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextField
            id={`${id}-email`}
            label="Email"
            requiredMark
            aria-required
            leadingIcon={Mail}
            type="email"
            autoComplete="email"
            placeholder="ten@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <div>
            <TextField
              id={`${id}-password`}
              label="Mật khẩu"
              requiredMark
              aria-required
              leadingIcon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
              error={errors.password?.message}
              endAdornment={<VisibilityToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              {...register('password')}
            />
            <PasswordStrength id={`${id}-strength`} password={password} />
          </div>
          <TextField
            id={`${id}-confirm`}
            label="Xác nhận mật khẩu"
            requiredMark
            aria-required
            leadingIcon={Lock}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword?.message}
            endAdornment={<VisibilityToggle shown={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />}
            {...register('confirmPassword')}
          />
        </div>

        {/* Điều khoản */}
        <div className="mt-5">
          <label htmlFor={`${id}-agree`} className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate-700">
            <input
              id={`${id}-agree`}
              type="checkbox"
              aria-invalid={errors.agree ? true : undefined}
              aria-describedby={errors.agree ? `${id}-agree-error` : undefined}
              className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-jade-600"
              {...register('agree')}
            />
            <span>
              Tôi đồng ý với{' '}
              <ActionLink href={siteLinks.terms} className="font-semibold text-jade-700 hover:underline">
                Điều khoản sử dụng
              </ActionLink>{' '}
              và{' '}
              <ActionLink href={siteLinks.privacy} className="font-semibold text-jade-700 hover:underline">
                Chính sách bảo mật
              </ActionLink>{' '}
              của StoryToScene.
            </span>
          </label>
          {errors.agree && (
            <p id={`${id}-agree-error`} className="mt-1.5 text-xs leading-4 text-rose-600">
              {errors.agree.message}
            </p>
          )}
        </div>

        <PrimaryButton
          type="submit"
          disabled={isRegistering}
          className="mt-5 h-[52px] gap-2 rounded-xl bg-jade-700 text-base shadow-[0_12px_24px_-12px_rgb(3_108_69/0.7)] hover:bg-jade-800"
        >
          {isRegistering ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
          <ArrowRight aria-hidden="true" className="size-5" />
        </PrimaryButton>
        {notice === 'submit' && authError && <FormNotice tone="error">{authError.message}</FormNotice>}

        <OrDivider label="Hoặc" />
        {agreed && googleClientId ? (
          <div className="relative">
            <GoogleButton
              aria-hidden="true"
              tabIndex={-1}
              className="pointer-events-none h-[52px] gap-3 rounded-xl text-base font-semibold [&_svg]:size-5"
            >
              Đăng ký bằng Google
            </GoogleButton>
            <GoogleLogin
              onSuccess={(response) => void googleSignUp(response)}
              onError={googleSignUpFailed}
              text="signup_with"
              theme="outline"
              shape="rectangular"
              width="100%"
              containerProps={{
                className: 'absolute inset-0 z-10 opacity-0',
                style: { width: '100%', height: '100%' },
              }}
            />
          </div>
        ) : (
          <GoogleButton
            className="h-[52px] gap-3 rounded-xl text-base font-semibold [&_svg]:size-5"
            onClick={requireGoogleAgreement}
          >
            Đăng ký bằng Google
          </GoogleButton>
        )}
        {notice === 'google' && authError && <FormNotice tone="error">{authError.message}</FormNotice>}
      </>}

      {step === 'verify' && (
        <fieldset className="rounded-2xl border border-jade-100 bg-jade-50/40 p-4 sm:p-5">
          <legend className="sr-only">Xác thực email</legend>
          <div className="flex items-start gap-3">
            <MailCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-jade-600" strokeWidth={1.75} />
            <div>
              <p className="text-sm leading-5 font-semibold text-slate-800">Xác thực email</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Nhập mã xác minh {OTP_LENGTH} số đã gửi đến {getValues('email')}.
              </p>
            </div>
          </div>

          <p id={codeLabelId} className="mt-4 mb-2 text-sm leading-5 font-semibold text-slate-800">
            Nhập mã xác minh
            <span aria-hidden="true" className="ml-0.5 text-rose-500">*</span>
          </p>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <OtpInput
                id={`${id}-code`}
                length={OTP_LENGTH}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.code}
                describedBy={errors.code ? `${id}-code-error` : undefined}
              />
            )}
          />
          {errors.code && (
            <p id={`${id}-code-error`} className="mt-1.5 text-xs leading-4 text-rose-600">
              {errors.code.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => void resendCode()}
            disabled={isResendingCode}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-jade-700 hover:bg-jade-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            {isResendingCode ? 'Đang gửi lại...' : 'Gửi lại mã'}
          </button>
          {authSuccess && <FormNotice tone="info">{authSuccess}</FormNotice>}
          {authError && <FormNotice tone="error">{authError.message}</FormNotice>}

          <PrimaryButton
            type="submit"
            disabled={isSubmitting}
            className="mt-5 h-[52px] gap-2 rounded-xl bg-jade-700 text-base shadow-[0_12px_24px_-12px_rgb(3_108_69/0.7)] hover:bg-jade-800"
          >
            {isSubmitting ? 'Đang xác thực...' : 'Xác thực email'}
            <ArrowRight aria-hidden="true" className="size-5" />
          </PrimaryButton>
        </fieldset>
      )}

      <p className="mt-6 text-center text-[15px] leading-6 text-slate-700">
        Đã có tài khoản?{' '}
        <Link to={authRoutes.login} className="font-semibold text-jade-600 hover:text-jade-700 hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  )
}
