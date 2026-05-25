import type { CSSProperties } from 'react'

// ─── Flicker keyframe (injected once) ─────────────────────────────────────────

const STYLE_ID = 'streak-flame-styles'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes flameFlicker {
      0%   { transform: scaleY(1)    rotate(-1deg); }
      25%  { transform: scaleY(1.04) rotate(1.5deg); }
      50%  { transform: scaleY(0.97) rotate(-2deg); }
      75%  { transform: scaleY(1.06) rotate(1deg); }
      100% { transform: scaleY(1)    rotate(-1deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .flame-flicker {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

injectStyles()

// ─── Types ────────────────────────────────────────────────────────────────────

type FlameSize = 'sm' | 'md' | 'lg'

interface StreakFlameProps {
  count: number
  size?: FlameSize
  animated?: boolean
}

// ─── Size Maps ────────────────────────────────────────────────────────────────

const flameSizeClass: Record<FlameSize, string> = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-4xl',
}

const countSizeClass: Record<FlameSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StreakFlame({
  count,
  size = 'md',
  animated = false,
}: StreakFlameProps) {
  // Show empty-streak message for sm and md only
  if (count === 0 && size !== 'lg') {
    return (
      <span
        className={`${countSizeClass[size]} font-medium`}
        style={{ color: '#8B8B92' }}
      >
        Start your streak
      </span>
    )
  }

  const flameStyle: CSSProperties = animated
    ? {
        display: 'inline-block',
        animation: 'flameFlicker 1.2s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }
    : {}

  return (
    <span className="inline-flex items-center gap-1">
      {/* Flame */}
      <span
        className={`flame-flicker leading-none ${flameSizeClass[size]}`}
        style={flameStyle}
        aria-hidden="true"
      >
        🔥
      </span>

      {/* Count */}
      <span
        className={`${countSizeClass[size]} font-bold leading-none tabular-nums`}
        style={{ color: '#E8A33D' }}
        aria-label={`${count} day streak`}
      >
        {count}
      </span>
    </span>
  )
}
