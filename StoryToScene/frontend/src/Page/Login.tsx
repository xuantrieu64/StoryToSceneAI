import { Sparkles } from 'lucide-react'
import { AuthIllustration } from '../features/auth/components/AuthIllustration'
import { AuthPanel } from '../features/auth/components/AuthPanel'
import { AuthHeadline, AuthHighlights, Highlight } from '../features/auth/components/AuthShowcase'
import { AuthShell } from '../features/auth/components/AuthShell'
import { AuthSiteHeader } from '../features/auth/components/AuthSiteHeader'
import { LoginForm } from '../features/auth/components/LoginForm'

/** Trang Đăng nhập – /login */
function Login() {
  return (
    <AuthShell
      header={<AuthSiteHeader cta="register" />}
      headline={
        <AuthHeadline
          badgeIcon={Sparkles}
          badge="Nền tảng tạo video bằng AI"
          title={
            <>
              <span className="sm:whitespace-nowrap">Đăng nhập vào</span>
              <Highlight className="block" underlineClassName="left-[38%] w-[62%]">
                StoryToScene
              </Highlight>
            </>
          }
          description="Biến câu chuyện, kịch bản hoặc ý tưởng của bạn thành video hoàn chỉnh chỉ trong vài phút với sức mạnh AI."
        />
      }
      illustration={<AuthIllustration />}
      card={
        <AuthPanel eyebrow="Tài khoản của bạn" title="Đăng nhập" titleId="login-title">
          <LoginForm />
        </AuthPanel>
      }
      highlights={
        <AuthHighlights
          benefits={['Tạo video từ văn bản hoặc kịch bản', 'Tự động tạo cảnh, hình ảnh, lồng tiếng', 'Dễ sử dụng, không cần kỹ năng dựng video']}
        />
      }
    />
  )
}

export default Login
