import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import GoldButton from '../components/GoldButton'

// ─── Slide Data ────────────────────────────────────────────────────────────────

interface Slide {
  image: string
  headline: string
  subline: string
}

const SLIDES: Slide[] = [
  {
    image:
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=900&auto=format&fit=crop&q=80',
    headline: "MOTIVATION ISN'T A MOOD.",
    subline: "It's a muscle.",
  },
  {
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&auto=format&fit=crop&q=80',
    headline: 'MOST APPS SHOUT THE SAME THING.',
    subline: "We don't.",
  },
  {
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=80',
    headline: "LET'S FIND OUT WHAT ACTUALLY MOVES YOU.",
    subline: '',
  },
]

// ─── Ken Burns keyframe injection ─────────────────────────────────────────────

const STYLE_ID = 'welcome-ken-burns'

function injectKenBurnsStyle() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes welcomeKenBurns {
      from { transform: scale(1) translateZ(0); }
      to   { transform: scale(1.08) translateZ(0); }
    }
    .welcome-ken-burns {
      animation: welcomeKenBurns 14s ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .welcome-ken-burns { animation: none !important; }
    }
  `
  document.head.appendChild(style)
}

injectKenBurnsStyle()

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Welcome() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index))
    setCurrent(clamped)
    setAnimKey((k) => k + 1)
  }, [])

  const goNext = useCallback(() => {
    setCurrent((c) => {
      const next = Math.min(c + 1, SLIDES.length - 1)
      setAnimKey((k) => k + 1)
      return next
    })
  }, [])

  const goPrev = useCallback(() => {
    setCurrent((c) => {
      const prev = Math.max(c - 1, 0)
      setAnimKey((k) => k + 1)
      return prev
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) goNext()
    else goPrev()
  }

  const slide = SLIDES[current]
  const isLast = current === SLIDES.length - 1

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', backgroundColor: '#0A0A0B' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Background image with Ken Burns ── */}
      <img
        key={`img-${current}-${animKey}`}
        src={slide.image}
        alt=""
        aria-hidden="true"
        className="welcome-ken-burns absolute inset-0 h-full w-full object-cover"
        style={{ willChange: 'transform' }}
        loading="eager"
        decoding="async"
      />

      {/* ── Dark gradient overlay ── */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,11,0.25) 0%, rgba(10,10,11,0.55) 40%, rgba(10,10,11,0.92) 80%, rgba(10,10,11,1) 100%)',
        }}
      />

      {/* ── Left tap zone ── */}
      {current > 0 && (
        <button
          type="button"
          aria-label="Previous slide"
          onClick={goPrev}
          className="absolute left-0 top-0 z-20 h-full"
          style={{ width: '25%', background: 'transparent', border: 'none', cursor: 'pointer' }}
        />
      )}

      {/* ── Right tap zone (only when not on last) ── */}
      {!isLast && (
        <button
          type="button"
          aria-label="Next slide"
          onClick={goNext}
          className="absolute right-0 top-0 z-20 h-full"
          style={{ width: '25%', background: 'transparent', border: 'none', cursor: 'pointer' }}
        />
      )}

      {/* ── Content ── */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
        style={{ paddingBottom: '120px' }}
      >
        <div
          key={`content-${current}`}
          className="animate-fade-up flex flex-col items-center text-center"
        >
          {/* Headline */}
          <h1
            className="uppercase text-white leading-none tracking-tight"
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: 'clamp(2.75rem, 9vw, 5rem)',
              maxWidth: '720px',
              textShadow: '0 2px 24px rgba(0,0,0,0.7)',
            }}
          >
            {slide.headline}
          </h1>

          {/* Subline */}
          {slide.subline && (
            <p
              className="mt-4 italic animate-fade-up delay-200"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                color: '#F4F2EE',
                opacity: 0.85,
                maxWidth: '480px',
              }}
            >
              {slide.subline}
            </p>
          )}

          {/* CTA on last slide */}
          {isLast && (
            <div className="mt-10 w-full max-w-xs animate-fade-up delay-300">
              <GoldButton
                onClick={() => navigate('/assessment')}
                className="text-sm font-bold uppercase tracking-widest"
              >
                Build My Profile
              </GoldButton>
            </div>
          )}
        </div>
      </div>

      {/* ── Dot indicators ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center gap-4"
        style={{ paddingBottom: '2.5rem' }}
      >
        {/* Dots */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Welcome slides">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                background: i === current ? '#E8A33D' : 'rgba(244,242,238,0.3)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Sign in link on last slide */}
        {isLast && (
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="animate-fade-in delay-500"
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.875rem',
              color: 'rgba(139,139,146,1)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Already have an account?{' '}
            <span style={{ color: '#E8A33D', textDecoration: 'underline' }}>Sign in</span>
          </button>
        )}
      </div>
    </div>
  )
}
