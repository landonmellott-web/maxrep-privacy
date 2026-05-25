import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getProfile } from '../lib/motivatorProfiles'
import GoldButton from '../components/GoldButton'
import type { MotivatorProfile } from '../lib/types'

// ─── Style injection ───────────────────────────────────────────────────────────

const STYLE_ID = 'profile-reveal-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes revealKenBurns {
      from { transform: scale(1) translateZ(0); }
      to   { transform: scale(1.07) translateZ(0); }
    }
    @keyframes barFill {
      from { width: 0%; }
    }
    .reveal-ken-burns {
      animation: revealKenBurns 16s ease-out forwards;
    }
    .score-bar-fill {
      transition: width 800ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal-ken-burns { animation: none !important; }
      .score-bar-fill { transition: none !important; }
    }
  `
  document.head.appendChild(style)
}

injectStyles()

// ─── Score bar label map ───────────────────────────────────────────────────────

const PROFILE_LABELS: Record<MotivatorProfile, string> = {
  enforcer: 'Enforcer',
  igniter: 'Igniter',
  visionary: 'Visionary',
}

// ─── Score Bar ─────────────────────────────────────────────────────────────────

interface ScoreBarProps {
  label: string
  pct: number
  animate: boolean
  isPrimary: boolean
}

function ScoreBar({ label, pct, animate, isPrimary }: ScoreBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isPrimary ? '#E8A33D' : 'rgba(139,139,146,1)',
            fontWeight: isPrimary ? 600 : 400,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.875rem',
            color: isPrimary ? '#E8A33D' : 'rgba(244,242,238,0.7)',
            letterSpacing: '0.04em',
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: '4px', background: 'rgba(42,42,46,0.9)' }}
      >
        <div
          className="h-full rounded-full score-bar-fill"
          style={{
            width: animate ? `${pct}%` : '0%',
            background: isPrimary
              ? 'linear-gradient(90deg, #E8A33D, #C8872A)'
              : 'rgba(139,139,146,0.5)',
          }}
        />
      </div>
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProfileReveal() {
  const navigate = useNavigate()
  const { assessmentResult } = useApp()
  const [barsAnimated, setBarsAnimated] = useState(false)
  const barsRef = useRef<HTMLDivElement>(null)

  // Guard: redirect if no result
  useEffect(() => {
    if (!assessmentResult) {
      navigate('/assessment', { replace: true })
    }
  }, [assessmentResult, navigate])

  // Trigger bar animation after mount
  useEffect(() => {
    const id = setTimeout(() => setBarsAnimated(true), 120)
    return () => clearTimeout(id)
  }, [])

  if (!assessmentResult) return null

  const { scores, primary, secondary } = assessmentResult
  const profile = getProfile(primary)
  const profileOrder: MotivatorProfile[] = ['enforcer', 'igniter', 'visionary']

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100dvh', backgroundColor: '#0A0A0B' }}
    >
      {/* ── Hero background with Ken Burns ── */}
      <img
        src={profile.heroImage}
        alt=""
        aria-hidden="true"
        className="reveal-ken-burns absolute inset-0 h-full w-full object-cover"
        style={{ willChange: 'transform' }}
        loading="eager"
        decoding="async"
      />

      {/* ── Strong dark overlay (heavier at bottom for readability) ── */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,11,0.35) 0%, rgba(10,10,11,0.55) 30%, rgba(10,10,11,0.88) 60%, rgba(10,10,11,0.97) 80%, rgba(10,10,11,1) 100%)',
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col justify-end px-5"
        style={{ minHeight: '100dvh', paddingBottom: '2.5rem', paddingTop: '4rem' }}
      >
        {/* ── YOU ARE label ── */}
        <p
          className="animate-fade-up mb-1"
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#E8A33D',
            fontVariant: 'small-caps',
            fontWeight: 600,
          }}
        >
          You Are
        </p>

        {/* ── Profile name ── */}
        <h1
          className="uppercase leading-none tracking-tight animate-fade-up delay-200"
          style={{
            fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
            fontSize: 'clamp(3rem, 12vw, 5rem)',
            color: '#F4F2EE',
            textShadow: '0 2px 32px rgba(0,0,0,0.8)',
          }}
        >
          {profile.name.toUpperCase()}
        </h1>

        {/* ── Tagline ── */}
        <p
          className="mt-3 italic animate-fade-up delay-300"
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
            color: 'rgba(244,242,238,0.85)',
            maxWidth: '400px',
            lineHeight: 1.5,
          }}
        >
          &ldquo;{profile.tagline}&rdquo;
        </p>

        {/* ── Secondary blend badge ── */}
        {secondary && (
          <p
            className="mt-2 animate-fade-up delay-300"
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.8125rem',
              color: 'rgba(139,139,146,1)',
              letterSpacing: '0.02em',
            }}
          >
            with{' '}
            <span style={{ color: 'rgba(244,242,238,0.7)' }}>
              {PROFILE_LABELS[secondary]} tendencies
            </span>
          </p>
        )}

        {/* ── Shareable card ── */}
        <div
          className="mt-6 rounded-2xl animate-fade-up delay-400"
          ref={barsRef}
          style={{
            background: 'rgba(26,26,29,0.92)',
            border: '1px solid rgba(42,42,46,0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '1.25rem 1.25rem 1rem',
            maxWidth: '440px',
          }}
        >
          {/* Card header */}
          <p
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.6875rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(139,139,146,0.7)',
              marginBottom: '0.25rem',
            }}
          >
            Motivation Profile
          </p>
          <p
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '1.125rem',
              color: '#E8A33D',
              letterSpacing: '0.04em',
              marginBottom: '0.25rem',
            }}
          >
            {profile.name.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.8125rem',
              color: 'rgba(244,242,238,0.6)',
              fontStyle: 'italic',
              marginBottom: '1rem',
              lineHeight: 1.4,
            }}
          >
            {profile.tagline}
          </p>

          {/* Score bars */}
          <div className="flex flex-col gap-3">
            {profileOrder.map((p) => (
              <ScoreBar
                key={p}
                label={PROFILE_LABELS[p]}
                pct={scores[p]}
                animate={barsAnimated}
                isPrimary={p === primary}
              />
            ))}
          </div>
        </div>

        {/* ── Voice description ── */}
        <p
          className="mt-4 animate-fade-up delay-400"
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.9375rem',
            color: 'rgba(244,242,238,0.72)',
            lineHeight: 1.6,
            maxWidth: '440px',
          }}
        >
          {profile.voiceDescription}
        </p>

        {/* ── CTA button ── */}
        <div className="mt-8 w-full max-w-xs animate-fade-up delay-600">
          <GoldButton
            onClick={() => navigate('/auth')}
            className="text-sm font-bold uppercase tracking-widest"
          >
            Start Training
          </GoldButton>
        </div>
      </div>
    </div>
  )
}
