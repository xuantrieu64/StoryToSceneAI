export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  tutorials: '/tutorials',
  upgrade: '/upgrade',
  forbidden: '/403',
  projectOverview: (projectId: string) => `/projects/${projectId}`,
  projectStory: (projectId: string) => `/projects/${projectId}/story`,
  projectScriptAssistant: (projectId: string) => `/projects/${projectId}/script-assistant`,
  projectScripts: (projectId: string) => `/projects/${projectId}/scripts`,
  scriptEditor: (projectId: string, scriptId: string) =>
    `/projects/${projectId}/scripts/${scriptId}`,
  projectCharacters: (projectId: string) => `/projects/${projectId}/characters`,
  characterDetail: (projectId: string, characterId: string) =>
    `/projects/${projectId}/characters/${characterId}`,
} as const
