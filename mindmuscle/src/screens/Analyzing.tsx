import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

// ─── Rotating subtitle strings ─────────────────────────────────────────────────

const SUBTITLES: string[] = [
  'Analyzing your responses...',
  'Mapping your motivation DNA...',
  'Finalizing your profile...',
]

// ─── Pulse-glow style injection ────────────────────────────────────────────────

const STYLE_ID = 'analyzing-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes analyzeRotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes analyzeRotateReverse {
      from { transform: rotate(0deg); }
      to   { transform: rotate(-360deg); }
    }
    @keyframes analyzePulse {
      0%, 100% { box-shadow: 0 0 24px rgba(232,163,61,0.35), 0 0 60px rgba(232,163,61,0.12); }
      50%       { box-shadow: 0 0 48px rgba(232,163,61,0.65), 0 0 100px rgba(232,163,61,0.25); }
    }
    @keyframes analyzeDotFade {
      0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
      40%            { opacity: 1;   transform: scale(1); }
    }
    .analyze-ring-outer {
      animation: analyzeRotate 4s linear infinite;
    }
    .analyze-ring-inner {
      animation: analyzeRotateReverse 2.8s linear infinite;
    }
    .analyze-core {
      animation: analyzePulse 2.5s ease-in-out infinite;
    }
    .analyze-dot:nth-child(1) { animation: analyzeDotFade 1.2s ease-in-out 0s    infinite; }
    .analyze-dot:nth-child(2) { animation: analyzeDotFade 1.2s ease-in-out 0.2s  infinite; }
    .analyze-dot:nth-child(3) { animation: analyzeDotFade 1.2s ease-in-out 0.4s  infinite; }

    @media (prefers-reduced-motion: reduce) {
      .analyze-ring-outer,
      .analyze-ring-inner,
      .analyze-core,
      .analyze-dot {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

injectStyles()

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Analyzing() {
  const navigate = useNavigate()
  const { assessmentResult } = useApp()
  const [subtitleIndex, setSubtitleIndex] = useState(0)

  // Guard: if no result, redirect to assessment
  useEffect(() => {
    if (!assessmentResult) {
      navigate('/assessment', { replace: true })
    }
  }, [assessmentResult, navigate])

  // Rotate subtitle text every 1.5 s
  useEffect(() => {
    const id = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % SUBTITLES.length)
    }, 1500)
    return () => clearInterval(id)
  }, [])

  // Navigate to reveal after 4 s
  useEffect(() => {
    if (!assessmentResult) return
    const id = setTimeout(() => {
      navigate('/reveal')
    }, 4000)
    return () => clearTimeout(id)
  }, [assessmentResult, navigate])

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        minHeight: '100dvh',
        backgroundColor: '#0A0A0B',
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,163,61,0.06) 0%, #0A0A0B 70%)',
      }}
    >
      {/* ── Animated rings + core ── */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: '220px', height: '220px' }}
        aria-hidden="true"
      >
        {/* Outer ring */}
        <div
          className="analyze-ring-outer absolute inset-0 rounded-full"
          style={{
            border: '1.5px solid rgba(232,163,61,0.25)',
            borderTopColor: 'rgba(232,163,61,0.8)',
          }}
        />

        {/* Middle ring */}
        <div
          className="analyze-ring-inner absolute rounded-full"
          style={{
            inset: '20px',
            border: '1.5px solid rgba(232,163,61,0.15)',
            borderBottomColor: 'rgba(232,163,61,0.6)',
          }}
        />

        {/* Inner ring */}
        <div
          className="analyze-ring-outer absolute rounded-full"
          style={{
            inset: '42px',
            border: '1px solid rgba(232,163,61,0.1)',
            borderRightColor: 'rgba(232,163,61,0.45)',
            animationDuration: '2s',
          }}
        />

        {/* Core glow */}
        <div
          className="analyze-core relative rounded-full flex items-center justify-center"
          style={{
            width: '90px',
            height: '90px',
            background: 'radial-gradient(circle, rgba(232,163,61,0.22) 0%, rgba(232,163,61,0.06) 60%, transparent 100%)',
            border: '1px solid rgba(232,163,61,0.35)',
          }}
        >
          {/* M monogram */}
          <span
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '2rem',
              color: '#E8A33D',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textShadow: '0 0 20px rgba(232,163,61,0.6)',
            }}
          >
            M
          </span>
        </div>
      </div>

      {/* ── Headline ── */}
      <h1
        className="mt-10 uppercase tracking-widest animate-fade-in"
        style={{
          fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          color: '#E8A33D',
          textShadow: '0 0 30px rgba(232,163,61,0.35)',
          letterSpacing: '0.12em',
        }}
      >
        BUILDING YOUR PROFILE
        {/* Animated ellipsis dots */}
        <span className="inline-flex ml-1 gap-[3px] align-bottom" style={{ paddingBottom: '3px' }}>
          <span
            className="analyze-dot inline-block rounded-full"
            style={{ width: '5px', height: '5px', backgroundColor: '#E8A33D' }}
          />
          <span
            className="analyze-dot inline-block rounded-full"
            style={{ width: '5px', height: '5px', backgroundColor: '#E8A33D' }}
          />
          <span
            className="analyze-dot inline-block rounded-full"
            style={{ width: '5px', height: '5px', backgroundColor: '#E8A33D' }}
          />
        </span>
      </h1>

      {/* ── Rotating subtitle ── */}
      <p
        key={subtitleIndex}
        className="mt-4 animate-fade-in"
        style={{
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          fontSize: '0.9375rem',
          color: 'rgba(139,139,146,1)',
          letterSpacing: '0.02em',
        }}
      >
        {SUBTITLES[subtitleIndex]}
      </p>
    </div>
  )
}
