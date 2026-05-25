import type { ReactNode, CSSProperties } from 'react'

// ─── Ken Burns keyframe (injected once) ───────────────────────────────────────

const STYLE_ID = 'cinematic-hero-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes kenBurns {
      0%   { transform: scale(1)    translateZ(0); }
      100% { transform: scale(1.08) translateZ(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .cinematic-ken-burns {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

injectStyles()

// ─── Props ────────────────────────────────────────────────────────────────────

interface CinematicHeroProps {
  src: string
  alt?: string
  children?: ReactNode
  className?: string
  overlayClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CinematicHero({
  src,
  alt = '',
  children,
  className = '',
  overlayClassName = '',
}: CinematicHeroProps) {
  const imageStyle: CSSProperties = {
    animation: 'kenBurns 14s ease-out forwards',
    willChange: 'transform',
  }

  const overlayStyle: CSSProperties = {
    background:
      'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 11, 0.55) 50%, rgba(10, 10, 11, 0.92) 100%)',
  }

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ backgroundColor: '#0A0A0B' }}
    >
      {/* Hero image with Ken Burns zoom */}
      <img
        src={src}
        alt={alt}
        className="cinematic-ken-burns absolute inset-0 h-full w-full object-cover"
        style={imageStyle}
        loading="eager"
        decoding="async"
      />

      {/* Dark gradient overlay */}
      <div
        className={`absolute inset-0 ${overlayClassName}`}
        style={overlayStyle}
        aria-hidden="true"
      />

      {/* Content rendered above overlay */}
      {children && (
        <div className="relative z-10 flex h-full w-full flex-col">
          {children}
        </div>
      )}
    </div>
  )
}
