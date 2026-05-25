import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import BottomNav from './BottomNav'

// Routes where the bottom nav should NOT appear
const NO_NAV_ROUTES = ['/welcome', '/assessment', '/analyzing', '/reveal', '/auth']

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useApp()
  const { pathname } = useLocation()

  const showNav =
    !!user && !NO_NAV_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
      {/* Main content — padded to avoid being hidden behind the bottom nav */}
      <main
        className="flex flex-col"
        style={{
          paddingBottom: showNav
            ? 'calc(64px + env(safe-area-inset-bottom, 0px))'
            : undefined,
          minHeight: '100dvh',
        }}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
