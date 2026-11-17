import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Home from './Page/Home'
import Dashboard from './Page/Dashboard'
import Login from './Page/Login'
import Register from './Page/Register'
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
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>

      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App