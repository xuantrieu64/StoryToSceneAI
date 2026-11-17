import { Toaster } from '@/components/ui/sonner'
import { Smoke } from '@/dev/Smoke'
import { HomePage } from '@/features/home/HomePage'
import Dashboard from './Page/Dashboard'

/**
 * Trang kiểm thử stack (Smoke) vẫn được giữ lại, chỉ hiển thị khi chạy dev tại
 * đường dẫn /dev/smoke. Mặc định render Homepage.
 */
const showSmoke = import.meta.env.DEV && window.location.pathname === '/dev/smoke'

function App() {
  return (
    <>
      {showSmoke ? (
        <div className="min-h-svh bg-background text-foreground">
          <Smoke />
        </div>
      ) : (
        <HomePage />
      )}
      <Toaster position="top-right" />
    </>
  )
}

export default App
