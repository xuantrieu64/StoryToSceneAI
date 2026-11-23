import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AppRouter } from '@/routes/AppRouter'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App