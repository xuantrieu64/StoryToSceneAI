import { useId, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, RotateCw, Send, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import type { ApiError } from '@/types/auth'
import { siteLinks } from '@/config/site-links'
import { ActionLink } from '@/features/home/components/shared/ActionLink'
import { AUTH_NOT_CONNECTED, authRoutes } from '../auth-config'
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
    code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `Vui lòng nhập đủ ${OTP_LENGTH} số của mã xác minh.`),
    agree: z.boolean().refine((v) => v, 'Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  })

type RegisterValues = z.infer<typeof registerSchema>
/** Nơi hiện thông báo "chưa kết nối máy chủ" – ngay dưới nút vừa bấm. */
type NoticeAt = 'code' | 'submit' | 'google' | null

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

export function RegisterForm() {
  const id = useId()
  const [notice, setNotice] = useState<NoticeAt>(null)

  const [authError, setAuthError] = useState<ApiError | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, control, formState, trigger, setError, setFocus, getValues } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', code: '', agree: false },
  })
  const { errors } = formState
  const password = useWatch({ control, name: 'password' })
  const agreed = useWatch({ control, name: 'agree' })

  const { register: registerAccount, verifyEmail } = useAuth()
  const navigate = useNavigate()

  /** Gửi mã xác minh: cần email hợp lệ; backend chưa có API nên chỉ báo chưa kết nối (không giả lập đã gửi). */
  const sendCode = async () => {
    setAuthError(null)
    setAuthSuccess(null)
    const valid = await trigger(['fullName', 'email', 'password', 'confirmPassword', 'agree'])
    if (!valid) {
      setFocus('email')
      return
    }

    const values = getValues()
    setIsSendingCode(true)
    try {
      await registerAccount({
        name: values.fullName,
        email: values.email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      })
      setNotice(null)
      setAuthSuccess('Mã xác minh đã được gửi đến email của bạn.')
    } catch (error) {
      setNotice('code')
      setAuthError(error as ApiError)
    } finally {
      setIsSendingCode(false)
    }
  }

  /** Đăng ký bằng Google: cần đồng ý điều khoản trước. */
  const googleSignUp = () => {
    if (!agreed) {
      setError('agree', { message: 'Bạn cần đồng ý Điều khoản sử dụng và Chính sách bảo mật trước khi đăng ký bằng Google.' })
      setFocus('agree')
      return
    }
    setNotice('google')
  }

  const codeLabelId = `${id}-code-label`

  const submitRegistration = async (values: RegisterValues) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      await verifyEmail(values.email, values.code)
      navigate(authRoutes.dashboard, { replace: true })
    } catch (error) {
      setNotice('submit')
      setAuthError(error as ApiError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(submitRegistration)}>
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

      {/* Xác minh email */}
      <fieldset className="mt-5 rounded-2xl border border-jade-100 bg-jade-50/40 p-4 sm:p-5">
        <legend className="sr-only">Xác minh email</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MailCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-jade-600" strokeWidth={1.75} />
            <div>
              <p className="text-sm leading-5 font-semibold text-slate-800">Xác minh email</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">Nhấn gửi mã để nhận mã xác minh {OTP_LENGTH} số qua email.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={isSendingCode}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-jade-700 px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-jade-800 focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none"
          >
            <Send aria-hidden="true" className="size-4" />
            {isSendingCode ? 'Đang gửi mã...' : 'Gửi mã xác minh'}
          </button>
        </div>
        {notice === 'code' && authError && <FormNotice tone="error">{authError.message}</FormNotice>}
        {authSuccess && <FormNotice tone="info">{authSuccess}</FormNotice>}

        <p id={codeLabelId} className="mt-4 mb-2 text-sm leading-5 font-semibold text-slate-800">
          Nhập mã xác minh
          <span aria-hidden="true" className="ml-0.5 text-rose-500">
            *
          </span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
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
          </div>
          {/* Chỉ bật (kèm đếm ngược) sau khi máy chủ gửi mã thành công – hiện chưa có API gửi mã */}
          <button
            type="button"
            disabled
            title="Cần gửi mã xác minh trước"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-500 disabled:cursor-not-allowed"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            Gửi lại mã
          </button>
        </div>
        {errors.code && (
          <p id={`${id}-code-error`} className="mt-1.5 text-xs leading-4 text-rose-600">
            {errors.code.message}
          </p>
        )}
      </fieldset>

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
        disabled={isSubmitting}
        className="mt-5 h-[52px] gap-2 rounded-xl bg-jade-700 text-base shadow-[0_12px_24px_-12px_rgb(3_108_69/0.7)] hover:bg-jade-800"
      >
        {isSubmitting ? 'Đang xác minh...' : 'Đăng ký tài khoản'}
        <ArrowRight aria-hidden="true" className="size-5" />
      </PrimaryButton>
      {notice === 'submit' && authError && <FormNotice tone="error">{authError.message}</FormNotice>}

      <OrDivider label="Hoặc" />
      <GoogleButton className="h-[52px] gap-3 rounded-xl text-base font-semibold [&_svg]:size-5" onClick={googleSignUp}>
        Đăng ký bằng Google
      </GoogleButton>
      {notice === 'google' && <FormNotice>{AUTH_NOT_CONNECTED}</FormNotice>}

      <p className="mt-6 text-center text-[15px] leading-6 text-slate-700">
        Đã có tài khoản?{' '}
        <Link to={authRoutes.login} className="font-semibold text-jade-600 hover:text-jade-700 hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  )
}
