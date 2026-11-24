import { useState } from 'react'
import { ImagePlay, UserRoundPlus } from 'lucide-react'
import { AuthIllustration } from '../features/auth/components/AuthIllustration'
import { AuthPanel } from '../features/auth/components/AuthPanel'
import { AuthHeadline, AuthHighlights, Highlight } from '../features/auth/components/AuthShowcase'
import { AuthShell } from '../features/auth/components/AuthShell'
import { AuthSiteHeader } from '../features/auth/components/AuthSiteHeader'
import { RegisterForm } from '../features/auth/components/RegisterForm'

/** Trang Đăng ký – /register */
function Register() {
  const [verifyingEmail, setVerifyingEmail] = useState(false)

  return (
    <AuthShell
      wideCard
      header={<AuthSiteHeader cta="login" />}
      headline={
        <AuthHeadline
          badgeIcon={UserRoundPlus}
          badge="Tham gia cộng đồng sáng tạo"
          title={
            <>
              <span className="block sm:whitespace-nowrap">Bắt đầu hành trình</span>
              <span className="sm:whitespace-nowrap">
                kể chuyện{' '}
                <Highlight className="inline-block" underlineClassName="left-0 w-full">
                  bằng AI
                </Highlight>
              </span>
            </>
          }
          description="Tạo tài khoản để biên kịch, dựng cảnh và tạo video hoàn chỉnh chỉ trong vài phút với sức mạnh AI."
        />
      }
      illustration={<AuthIllustration storyTitle="Từ ý tưởng đến video chỉ với AI" storyIcon={ImagePlay} multilineTitle />}
      card={
        <AuthPanel
          eyebrow={verifyingEmail ? 'Xác thực email' : 'Tạo tài khoản miễn phí'}
          title={verifyingEmail ? 'Xác thực email' : 'Đăng ký tài khoản'}
          titleId="register-title"
          compact
        >
          <RegisterForm onVerificationChange={setVerifyingEmail} />
        </AuthPanel>
      }
      highlights={
        <AuthHighlights
          benefits={['Tạo video từ kịch bản, ý tưởng hoặc văn bản', 'Lưu trữ, quản lý dự án trên đám mây', 'Truy cập các tính năng AI nâng cao']}
        />
      }
    />
  )
}

export default Register
