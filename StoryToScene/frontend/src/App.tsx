import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { HomePage } from '@/features/home/HomePage'
import Dashboard from './Page/Dashboard' 
import { Smoke } from '@/dev/Smoke'

function App() {
  const showSmoke =
    import.meta.env.DEV &&
    window.location.pathname === '/dev/smoke'

  if (showSmoke) {
    return (
      <>
        <Smoke />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>

      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App