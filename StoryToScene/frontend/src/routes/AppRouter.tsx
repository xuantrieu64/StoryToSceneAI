import { Route, Routes } from 'react-router-dom'
import routeConfig from './routeConfig'
import { GuestOnlyRoute, ProtectedRoute } from './guards'

export function AppRouter() {
  return (
    <Routes>
      {routeConfig.map(({ path, element: Page, access }) => (
        <Route
          key={path}
          path={path}
          element={
            access === 'protected'
              ? <ProtectedRoute><Page /></ProtectedRoute>
              : access === 'guestOnly'
                ? <GuestOnlyRoute><Page /></GuestOnlyRoute>
                : <Page />
          }
        />
      ))}
    </Routes>
  )
}
