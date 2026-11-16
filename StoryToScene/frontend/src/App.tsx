import { Toaster } from '@/components/ui/sonner'
import { Smoke } from '@/dev/Smoke'

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Smoke />
      <Toaster position="top-right" />
    </div>
  )
}

export default App
