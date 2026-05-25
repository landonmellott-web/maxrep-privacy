import { useState, useEffect, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { MOTIVATOR_PROFILES } from '../lib/motivatorProfiles'
import type { Message, MotivatorProfile } from '../lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  const todayStr = now.toISOString().slice(0, 10)
  const dateStr = date.toISOString().slice(0, 10)

  if (dateStr === todayStr) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'

  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: '#222226' }}
    />
  )
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({ message }: { message: Message }) {
  const profile = MOTIVATOR_PROFILES[message.motivator_ref as MotivatorProfile]

  return (
    <div
      className="relative rounded-2xl px-4 py-4 animate-fade-up"
      style={{
        backgroundColor: '#1A1A1D',
        border: `1px solid ${!message.read ? '#E8A33D33' : '#2A2A2E'}`,
      }}
    >
      {/* Unread indicator */}
      {!message.read && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: '#E8A33D' }}
          aria-label="Unread"
        />
      )}

      <div className={!message.read ? 'pl-1' : ''}>
        {/* Header: profile badge + date */}
        <div className="flex items-center justify-between mb-2">
          {profile ? (
            <span
              className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                color: profile.accentColor,
                backgroundColor: `${profile.accentColor}22`,
                border: `1px solid ${profile.accentColor}44`,
              }}
            >
              {profile.name}
            </span>
          ) : (
            <span
              className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                color: '#8B8B92',
                backgroundColor: '#222226',
                border: '1px solid #2A2A2E',
              }}
            >
              {message.motivator_ref}
            </span>
          )}

          <span className="text-xs" style={{ color: '#8B8B92' }}>
            {relativeDate(message.delivered_at)}
          </span>
        </div>

        {/* Message content */}
        <p
          className="text-sm italic leading-relaxed"
          style={{ color: '#F4F2EE' }}
        >
          &ldquo;{message.content}&rdquo;
        </p>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MessageHistory() {
  const { user } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: fetchErr } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('delivered_at', { ascending: false })
      .limit(50)

    if (fetchErr) {
      console.error('[MessageHistory] fetch error:', fetchErr.message)
      setError('Failed to load messages.')
    } else {
      setMessages((data || []) as Message[])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Mark messages as read on mount
  useEffect(() => {
    if (!user || messages.length === 0) return

    const unreadIds = messages.filter((m) => !m.read).map((m) => m.id)
    if (unreadIds.length === 0) return

    supabase
      .from('messages')
      .update({ read: true })
      .in('id', unreadIds)
      .then(({ error }) => {
        if (error) console.error('[MessageHistory] markRead error:', error.message)
      })
  }, [user, messages])

  const unreadCount = messages.filter((m) => !m.read).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
      <div className="px-4 pb-28 pt-14 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 animate-fade-up">
          <div>
            <h1
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                fontSize: '2rem',
                color: '#F4F2EE',
                lineHeight: 1,
              }}
            >
              MESSAGE HISTORY
            </h1>
            <p className="text-sm mt-1" style={{ color: '#8B8B92' }}>
              {unreadCount > 0
                ? `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`
                : 'Your daily motivation, archived'}
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#1A1A1D',
              border: '1px solid #2A2A2E',
            }}
          >
            <MessageCircle size={22} style={{ color: '#E8A33D' }} />
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm animate-fade-up"
            style={{
              backgroundColor: '#2A1515',
              border: '1px solid #D8412F',
              color: '#F4F2EE',
            }}
          >
            {error}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* ── Empty state ── */
          <div
            className="relative overflow-hidden rounded-2xl p-8 text-center animate-fade-up"
            style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
          >
            {/* Subtle cinematic background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1534438327273-5c42c6a17ef9?w=600&auto=format&fit=crop&q=60)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.06,
              }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div
                className="mx-auto mb-4 flex items-center justify-center rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: '#222226',
                  border: '1px solid #2A2A2E',
                }}
              >
                <MessageCircle size={26} style={{ color: '#E8A33D' }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{
                  fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                  color: '#F4F2EE',
                }}
              >
                NO MESSAGES YET
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#8B8B92', maxWidth: 260, margin: '0 auto' }}
              >
                Your daily motivation messages will appear here once your motivator is active.
              </p>
            </div>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="space-y-3">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`delay-${Math.min(idx * 100, 700)}`}
              >
                <MessageCard message={message} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
