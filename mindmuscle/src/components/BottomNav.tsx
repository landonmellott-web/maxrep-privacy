import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Zap, Target, BarChart2, Settings } from 'lucide-react'

// ─── Nav Tabs ─────────────────────────────────────────────────────────────────

const NAV_TABS = [
  { label: 'Home', path: '/home', Icon: Home },
  { label: 'Motivators', path: '/motivators', Icon: Zap },
  { label: 'Goals', path: '/goals', Icon: Target },
  { label: 'Progress', path: '/progress', Icon: BarChart2 },
  { label: 'Settings', path: '/settings', Icon: Settings },
] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        backgroundColor: '#1A1A1D',
        borderTop: '1px solid #2A2A2E',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Main navigation"
    >
      {NAV_TABS.map(({ label, path, Icon }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/')
        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-opacity active:opacity-70"
            style={{ color: isActive ? '#E8A33D' : '#8B8B92' }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.2 : 1.8}
              aria-hidden="true"
            />
            <span
              className="text-xs font-medium leading-none tracking-wide"
              style={{ fontSize: '10px' }}
            >
              {label}
            </span>
            {/* Active dot indicator */}
            <span
              className="rounded-full transition-all duration-200"
              style={{
                width: isActive ? '4px' : '0px',
                height: isActive ? '4px' : '0px',
                backgroundColor: '#E8A33D',
                marginTop: isActive ? '1px' : '0px',
              }}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </nav>
  )
}
