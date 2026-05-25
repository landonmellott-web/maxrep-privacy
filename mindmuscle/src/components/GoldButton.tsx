import type { ReactNode, CSSProperties } from 'react'
import { Loader2 } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface GoldButtonProps {
  children?: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const baseStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
  color: '#0A0A0B',
  boxShadow: '0 0 20px rgba(232, 163, 61, 0.35), 0 4px 12px rgba(0, 0, 0, 0.4)',
}

const disabledStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
  color: '#0A0A0B',
  opacity: 0.5,
  cursor: 'not-allowed',
  boxShadow: 'none',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoldButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  loading = false,
}: GoldButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`
        relative w-full rounded-xl py-4 px-6
        font-bold text-base leading-none
        transition-transform duration-100
        active:scale-[0.97]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        flex items-center justify-center gap-2
        ${className}
      `}
      style={isDisabled ? disabledStyle : baseStyle}
    >
      {loading ? (
        <>
          <Loader2
            size={20}
            className="animate-spin"
            aria-hidden="true"
          />
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
