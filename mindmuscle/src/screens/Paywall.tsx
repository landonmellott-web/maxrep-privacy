import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Check, Crown, Zap, Target, BarChart2, Bell, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'
import GoldButton from '../components/GoldButton'
import { redirectToCheckout, STRIPE_PRICES } from '../lib/stripe'

// ─── Feature lists ────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Full motivator assessment',
  '1 motivator profile',
  '1 daily message',
  '1 active goal',
  'Basic streak tracking',
]

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited motivator profiles',
  'Custom motivator blends',
  'Multiple daily pushes',
  'Unlimited goals & habits',
  'Full analytics & heatmap',
  'Badge milestones',
  'Priority support',
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&auto=format&fit=crop&q=80'

// ─── Component ────────────────────────────────────────────────────────────────

export default function Paywall() {
  const { user } = useApp()
  const navigate = useNavigate()

  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingAnnual, setLoadingAnnual] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (priceId: string, isAnnual = false) => {
    if (!user) return
    setError(null)

    if (isAnnual) setLoadingAnnual(true)
    else setLoadingMonthly(true)

    try {
      await redirectToCheckout(priceId, user.id, user.email)
    } catch (err) {
      console.error('[Paywall] checkout error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingMonthly(false)
      setLoadingAnnual(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0A0A0B' }}
    >
      {/* ── Hero ── */}
      <div className="relative" style={{ height: 320, flexShrink: 0 }}>
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
        />
        {/* Cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,10,11,0.2) 0%, rgba(10,10,11,0.55) 55%, rgba(10,10,11,1) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-12 right-4 z-10 flex items-center justify-center rounded-full btn-press"
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'rgba(10,10,11,0.6)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#F4F2EE',
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Headline */}
        <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
          <Crown
            size={32}
            className="mx-auto mb-3 animate-fade-up"
            style={{ color: '#E8A33D' }}
          />
          <h1
            className="animate-fade-up delay-100"
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '2rem',
              color: '#F4F2EE',
              lineHeight: 1.1,
              textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            }}
          >
            UNLOCK TOP-TIER MOTIVATION
          </h1>
        </div>
      </div>

      {/* ── Content Card ── */}
      <div
        className="flex-1 -mt-6 relative z-10 rounded-t-3xl px-5 pt-6 pb-10 animate-fade-up delay-200"
        style={{ backgroundColor: '#121214', border: '1px solid #2A2A2E', borderBottom: 'none' }}
      >
        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: '#2A1515',
              border: '1px solid #D8412F',
              color: '#F4F2EE',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Feature comparison ── */}
        <div className="flex gap-3 mb-6">
          {/* Free column */}
          <div
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#8B8B92' }}
            >
              Free
            </p>
            <div className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={13} style={{ color: '#8B8B92', flexShrink: 0, marginTop: 1.5 }} />
                  <p className="text-xs leading-snug" style={{ color: '#8B8B92' }}>
                    {f}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PRO column */}
          <div
            className="flex-1 rounded-2xl p-4"
            style={{
              backgroundColor: '#1A1A1D',
              border: '1px solid #E8A33D55',
              background: 'linear-gradient(135deg, #1A1A1D 0%, #1E1810 100%)',
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#E8A33D' }}
            >
              PRO ✦
            </p>
            <div className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={13} style={{ color: '#E8A33D', flexShrink: 0, marginTop: 1.5 }} />
                  <p className="text-xs leading-snug" style={{ color: '#F4F2EE' }}>
                    {f}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Proof icons ── */}
        <div className="flex justify-around mb-6">
          {[
            { Icon: Zap, label: 'Daily fire' },
            { Icon: Target, label: 'Unlimited goals' },
            { Icon: BarChart2, label: 'Full analytics' },
            { Icon: Bell, label: 'Multi-push' },
            { Icon: Shield, label: 'Cancel anytime' },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#E8A33D18',
                  border: '1px solid #E8A33D33',
                }}
              >
                <Icon size={18} style={{ color: '#E8A33D' }} />
              </div>
              <span className="text-center" style={{ color: '#8B8B92', fontSize: 10 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Pricing ── */}
        <div className="text-center mb-5">
          <p
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '2.5rem',
              color: '#E8A33D',
              lineHeight: 1,
            }}
          >
            $9.99
          </p>
          <p className="text-sm mt-1" style={{ color: '#8B8B92' }}>
            per month
          </p>
          <p className="text-xs mt-1" style={{ color: '#8B8B92' }}>
            or{' '}
            <span style={{ color: '#F4F2EE', fontWeight: 600 }}>
              $79.99 / year{' '}
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{
                color: '#0A0A0B',
                backgroundColor: '#E8A33D',
              }}
            >
              save 33%
            </span>
          </p>
        </div>

        {/* ── CTA buttons ── */}
        <div className="space-y-3 mb-4">
          <GoldButton
            onClick={() => handleCheckout(STRIPE_PRICES.monthly)}
            loading={loadingMonthly}
            disabled={loadingAnnual}
          >
            GO PRO — $9.99/month
          </GoldButton>

          <button
            type="button"
            onClick={() => handleCheckout(STRIPE_PRICES.annual, true)}
            disabled={loadingMonthly || loadingAnnual}
            className="w-full rounded-xl py-4 px-6 text-sm font-semibold btn-press disabled:opacity-60"
            style={{
              backgroundColor: '#1A1A1D',
              border: '1px solid #E8A33D55',
              color: '#E8A33D',
            }}
          >
            {loadingAnnual ? 'Loading…' : 'Annual — $79.99/year (Best Value)'}
          </button>
        </div>

        {/* ── Fine print ── */}
        <p className="text-center text-xs" style={{ color: '#8B8B92' }}>
          Cancel anytime. No commitment. Billed securely via Stripe.
        </p>
      </div>
    </div>
  )
}
