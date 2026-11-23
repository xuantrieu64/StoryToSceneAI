import type { ComponentType } from 'react'
import CharacterDetailPage from '@/Page/CharacterDetailPage'
import Dashboard from '@/Page/Dashboard'
import Home from '@/Page/Home'
import Login from '@/Page/Login'
import ProjectCharacters from '@/Page/ProjectCharacters'
import ProjectOverview from '@/Page/ProjectOverview'
import ProjectScripts from '@/Page/ProjectScripts'
import ProjectStory from '@/Page/ProjectStory'
import Register from '@/Page/Register'
import ScriptAssistant from '@/Page/ScriptAssistant'
import ScriptEditorPage from '@/Page/ScriptEditorPage'
import Tutorials from '@/Page/Tutorials'
import Upgrade from '@/Page/Upgrade'
import { Smoke } from '@/dev/Smoke'
import StatusPage from '@/Page/StatusPage'
import { paths } from './paths'

export type RouteAccess = 'public' | 'guestOnly' | 'protected'

export type RouteConfig = {
  path: string
  element: ComponentType
  access: RouteAccess
  roles?: readonly string[]
}

const routes: RouteConfig[] = [
  { path: paths.home, element: Home, access: 'public' },
  { path: paths.tutorials, element: Tutorials, access: 'public' },
  { path: paths.login, element: Login, access: 'guestOnly' },
  { path: paths.register, element: Register, access: 'guestOnly' },
  { path: paths.dashboard, element: Dashboard, access: 'protected' },
  { path: paths.upgrade, element: Upgrade, access: 'protected' },
  { path: '/projects/:projectId', element: ProjectOverview, access: 'protected' },
  { path: '/projects/:projectId/story', element: ProjectStory, access: 'protected' },
  { path: '/projects/:projectId/script-assistant', element: ScriptAssistant, access: 'protected' },
  { path: '/projects/:projectId/scripts', element: ProjectScripts, access: 'protected' },
  { path: '/projects/:projectId/scripts/:scriptId', element: ScriptEditorPage, access: 'protected' },
  { path: '/projects/:projectId/characters', element: ProjectCharacters, access: 'protected' },
  { path: '/projects/:projectId/characters/:characterId', element: CharacterDetailPage, access: 'protected' },
  { path: paths.forbidden, element: () => <StatusPage code={403} />, access: 'public' },
  { path: '*', element: () => <StatusPage code={404} />, access: 'public' },
]

if (import.meta.env.DEV) {
  routes.splice(-2, 0, { path: '/dev/smoke', element: Smoke, access: 'public' })
}

export default routes
