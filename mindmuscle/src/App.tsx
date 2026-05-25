import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'

// Screens (lazily imported for code-splitting)
import { lazy, Suspense } from 'react'

const Welcome        = lazy(() => import('./screens/Welcome'))
const Assessment     = lazy(() => import('./screens/Assessment'))
const Analyzing      = lazy(() => import('./screens/Analyzing'))
const ProfileReveal  = lazy(() => import('./screens/ProfileReveal'))
const Auth           = lazy(() => import('./screens/Auth'))
const Home           = lazy(() => import('./screens/Home'))
const Motivators     = lazy(() => import('./screens/Motivators'))
const Goals          = lazy(() => import('./screens/Goals'))
const Progress       = lazy(() => import('./screens/Progress'))
const Paywall        = lazy(() => import('./screens/Paywall'))
const MessageHistory = lazy(() => import('./screens/MessageHistory'))
const Settings       = lazy(() => import('./screens/Settings'))

// Full-screen spinner fallback
function ScreenLoader() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="animate-spin-slow"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid #2A2A2E',
          borderTopColor: '#E8A33D',
        }}
      />
    </div>
  )
}

// Guard: redirect logged-out users to welcome
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp()
  if (isLoading) return <ScreenLoader />
  if (!user) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

// Guard: redirect logged-in users away from auth screens
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp()
  if (isLoading) return <ScreenLoader />
  if (user) return <Navigate to="/home" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<ScreenLoader />}>
        <Routes>
          {/* Public / onboarding */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/analyzing" element={<Analyzing />} />
          <Route path="/reveal" element={<ProfileReveal />} />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            }
          />

          {/* Authenticated */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/motivators"
            element={
              <PrivateRoute>
                <Motivators />
              </PrivateRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <PrivateRoute>
                <Goals />
              </PrivateRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <Progress />
              </PrivateRoute>
            }
          />
          <Route
            path="/paywall"
            element={
              <PrivateRoute>
                <Paywall />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MessageHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
