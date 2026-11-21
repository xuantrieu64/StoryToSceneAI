import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Home from './Page/Home'
import Dashboard from './Page/Dashboard'
import Login from './Page/Login'
import Register from './Page/Register'
import Tutorials from './Page/Tutorials'
import Upgrade from './Page/Upgrade'
import ProjectOverview from './Page/ProjectOverview'
import ProjectStory from './Page/ProjectStory'
import ScriptAssistant from './Page/ScriptAssistant'
import ProjectScripts from './Page/ProjectScripts'
import ScriptEditorPage from './Page/ScriptEditorPage'
import ProjectCharacters from './Page/ProjectCharacters'
import CharacterDetailPage from './Page/CharacterDetailPage'
import ProjectStoryboard from './Page/ProjectStoryboard'
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
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/projects/:projectId" element={<ProjectOverview />} />
        <Route path="/projects/:projectId/story" element={<ProjectStory />} />
        <Route path="/projects/:projectId/script-assistant" element={<ScriptAssistant />} />
        <Route path="/projects/:projectId/scripts" element={<ProjectScripts />} />
        <Route path="/projects/:projectId/scripts/:scriptId" element={<ScriptEditorPage />} />
        <Route path="/projects/:projectId/characters" element={<ProjectCharacters />} />
        <Route path="/projects/:projectId/characters/:characterId" element={<CharacterDetailPage />} />
        <Route path="/projects/:projectId/storyboard" element={<ProjectStoryboard mode="storyboard" />} />
        {/* Mục 6, 7, 8 dùng chung màn hình với mục 5 (cùng component → chuyển qua lại không dựng lại) */}
        <Route path="/projects/:projectId/frames" element={<ProjectStoryboard mode="frames" />} />
        <Route path="/projects/:projectId/voice" element={<ProjectStoryboard mode="voice" />} />
        <Route path="/projects/:projectId/video" element={<ProjectStoryboard mode="video" />} />
      </Routes>

      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

export default App