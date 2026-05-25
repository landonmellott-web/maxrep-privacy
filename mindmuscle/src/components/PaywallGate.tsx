import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import GoldButton from './GoldButton'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaywallGateProps {
  children: ReactNode
  feature: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaywallGate({ children, feature }: PaywallGateProps) {
  const { user } = useApp()
  const navigate = useNavigate()

  // Allow access for active subscribers and trialing users
  const hasAccess =
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing'

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl p-8 text-center"
      style={{
        backgroundColor: '#1A1A1D',
        border: '1px solid #2A2A2E',
      }}
    >
      {/* Lock icon */}
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#2A2A2E' }}
      >
        <Lock size={28} style={{ color: '#E8A33D' }} aria-hidden="true" />
      </div>

      {/* Headline */}
      <h3
        className="mb-2 text-xl font-bold leading-snug"
        style={{ color: '#F4F2EE' }}
      >
        PRO Feature
      </h3>

      {/* Feature description */}
      <p
        className="mb-6 max-w-xs text-sm leading-relaxed"
        style={{ color: '#8B8B92' }}
      >
        {feature} is available on the PRO plan. Upgrade to unlock the full
        MindMuscle experience.
      </p>

      {/* CTA */}
      <GoldButton
        onClick={() => navigate('/paywall')}
        className="max-w-xs"
      >
        Unlock with PRO
      </GoldButton>
    </div>
  )
}
