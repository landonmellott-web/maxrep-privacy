import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Zap, Target, Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/motivatorProfiles'
import StreakFlame from '../components/StreakFlame'
import type { HabitWithStatus, Goal } from '../lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: '#222226' }}
    />
  )
}

// ─── Celebration Overlay ──────────────────────────────────────────────────────

interface CelebrationProps {
  streak: number
  message: string
  onDone: () => void
}

function CelebrationOverlay({ streak, message, onDone }: CelebrationProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(10,10,11,0.94)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Check-in celebration"
      onClick={onDone}
    >
      {/* Gold burst rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full animate-gold-burst"
          style={{
            width: 120 + i * 90,
            height: 120 + i * 90,
            border: `2px solid rgba(232,163,61,${0.7 - i * 0.2})`,
            animationDelay: `${i * 160}ms`,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Flame */}
      <div className="text-8xl animate-streak-burst mb-2" aria-hidden="true">
        🔥
      </div>

      {/* Streak count */}
      <div
        className="animate-streak-burst delay-100"
        style={{
          fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
          fontSize: '6rem',
          color: '#E8A33D',
          lineHeight: 1,
          textShadow: '0 0 48px rgba(232,163,61,0.65)',
        }}
      >
        {streak}
      </div>
      <div
        className="animate-fade-up delay-200 mt-1 uppercase tracking-widest text-base"
        style={{
          fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
          color: '#8B8B92',
        }}
      >
        Day Streak
      </div>

      {/* Check-in message */}
      <p
        className="animate-fade-up delay-300 mt-6 text-center px-8 text-base italic leading-relaxed"
        style={{ color: '#F4F2EE', maxWidth: 320 }}
      >
        &ldquo;{message}&rdquo;
      </p>

      <p
        className="animate-fade-up delay-500 mt-4 text-xs"
        style={{ color: '#8B8B92' }}
      >
        Tap anywhere to continue
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useApp()
  const navigate = useNavigate()

  const [streak, setStreak] = useState(0)
  const [todayCheckedIn, setTodayCheckedIn] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [habits, setHabits] = useState<HabitWithStatus[]>([])
  const [todayMessage, setTodayMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const profile = user?.primary_motivator
    ? getProfile(user.primary_motivator)
    : getProfile('igniter')

  // ── Daily message (consistent per day) ──────────────────────────────────────
  useEffect(() => {
    const dayIdx = getDayOfYear() % profile.dailyMessages.length
    setTodayMessage(profile.dailyMessages[dayIdx])
  }, [profile])

  // ── Compute streak from habit_logs ──────────────────────────────────────────
  const computeStreak = useCallback(async (userId: string): Promise<number> => {
    const { data, error: fetchError } = await supabase
      .from('habit_logs')
      .select('date, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false })

    if (fetchError || !data) return 0

    const uniqueDates = Array.from(new Set(data.map((r: { date: string }) => r.date))).sort(
      (a, b) => b.localeCompare(a)
    )

    if (uniqueDates.length === 0) return 0

    let count = 0
    const cursor = new Date()

    for (const date of uniqueDates) {
      const expected = cursor.toISOString().slice(0, 10)
      if (date === expected) {
        count++
        cursor.setDate(cursor.getDate() - 1)
      } else if (date < expected) {
        break
      }
    }

    return count
  }, [])

  // ── Fetch today's habits ─────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      // Get goals
      const { data: goals, error: goalsErr } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (goalsErr) throw goalsErr

      if (!goals || goals.length === 0) {
        setHabits([])
        const s = await computeStreak(user.id)
        setStreak(s)
        setLoading(false)
        return
      }

      const goalIds = (goals as Goal[]).map((g) => g.id)
      const todayStr = todayISO()
      const dayName = new Date()
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase()

      // Get habits for those goals
      const { data: habitsData, error: habitsErr } = await supabase
        .from('habits')
        .select('*')
        .in('goal_id', goalIds)

      if (habitsErr) throw habitsErr

      type RawHabit = { id: string; goal_id: string; title: string; frequency: string | string[] }

      // Filter habits due today
      const todayHabits = (habitsData as RawHabit[] || []).filter((h) => {
        if (h.frequency === 'daily') return true
        if (Array.isArray(h.frequency)) return h.frequency.includes(dayName)
        return false
      })

      if (todayHabits.length === 0) {
        setHabits([])
        const s = await computeStreak(user.id)
        setStreak(s)
        setLoading(false)
        return
      }

      const habitIds = todayHabits.map((h) => h.id)

      // Get today's logs
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, completed')
        .in('habit_id', habitIds)
        .eq('date', todayStr)
        .eq('completed', true)

      const completedSet = new Set(
        (logs as { habit_id: string }[] || []).map((l) => l.habit_id)
      )
      setTodayCheckedIn(completedSet.size > 0)

      const goalMap = Object.fromEntries((goals as Goal[]).map((g) => [g.id, g]))

      const enriched: HabitWithStatus[] = todayHabits.map((h) => ({
        ...h,
        frequency: (h.frequency === 'daily' || Array.isArray(h.frequency) ? h.frequency : 'daily') as 'daily' | string[],
        completed: completedSet.has(h.id),
        goal: goalMap[h.goal_id],
      }))

      setHabits(enriched)

      // Compute streak
      const s = await computeStreak(user.id)
      setStreak(s)
    } catch (err) {
      console.error('[Home] fetchData error:', err)
      setError('Failed to load your data. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }, [user, computeStreak])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Check in for today ────────────────────────────────────────────────────────
  const handleCheckIn = useCallback(async () => {
    if (!user || todayCheckedIn || checkingIn) return
    setCheckingIn(true)

    try {
      const todayStr = todayISO()

      const uncompleted = habits.filter((h) => !h.completed)
      if (uncompleted.length > 0) {
        const inserts = uncompleted.map((h) => ({
          habit_id: h.id,
          user_id: user.id,
          date: todayStr,
          completed: true,
        }))

        const { error: upsertErr } = await supabase
          .from('habit_logs')
          .upsert(inserts, { onConflict: 'habit_id,date' })

        if (upsertErr) throw upsertErr
      }

      setHabits((prev) => prev.map((h) => ({ ...h, completed: true })))
      setTodayCheckedIn(true)
      setStreak((s) => s + 1)
      setShowCelebration(true)
    } catch (err) {
      console.error('[Home] check-in error:', err)
      showToastMsg('Check-in failed. Please try again.')
    } finally {
      setCheckingIn(false)
    }
  }, [user, todayCheckedIn, checkingIn, habits])

  // ── Toggle individual habit ──────────────────────────────────────────────────
  const handleToggleHabit = useCallback(
    async (habitId: string, currentlyCompleted: boolean) => {
      if (!user) return
      const todayStr = todayISO()

      // Optimistic update
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completed: !currentlyCompleted } : h
        )
      )

      try {
        if (currentlyCompleted) {
          const { error: delErr } = await supabase
            .from('habit_logs')
            .delete()
            .eq('habit_id', habitId)
            .eq('date', todayStr)
          if (delErr) throw delErr
        } else {
          const { error: upsertErr } = await supabase.from('habit_logs').upsert(
            { habit_id: habitId, user_id: user.id, date: todayStr, completed: true },
            { onConflict: 'habit_id,date' }
          )
          if (upsertErr) throw upsertErr
          if (!todayCheckedIn) setTodayCheckedIn(true)
        }
      } catch (err) {
        console.error('[Home] toggle habit error:', err)
        // Revert optimistic update
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId ? { ...h, completed: currentlyCompleted } : h
          )
        )
      }
    },
    [user, todayCheckedIn]
  )

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function showToastMsg(msg: string) {
    setToastMessage(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3000)
  }

  const isPro =
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing'

  const firstName = user?.first_name || 'there'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
      {/* Celebration overlay */}
      {showCelebration && (
        <CelebrationOverlay
          streak={streak}
          message={profile.checkInMessage}
          onDone={() => setShowCelebration(false)}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed top-4 left-4 right-4 z-40 animate-fade-up rounded-xl px-5 py-3 text-sm font-medium text-center"
          style={{
            backgroundColor: '#1A1A1D',
            border: '1px solid #2A2A2E',
            color: '#F4F2EE',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {toastMessage}
        </div>
      )}

      <div className="px-4 pb-28 pt-14 max-w-lg mx-auto">
        {/* ── Top Bar ── */}
        <div className="flex items-start justify-between mb-5 animate-fade-up">
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: '#8B8B92' }}
            >
              {formatDate()}
            </p>
            <h1
              className="text-2xl font-semibold"
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                color: '#F4F2EE',
              }}
            >
              {getGreeting()}, {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-1 pt-1">
            <StreakFlame count={streak} size="sm" animated={streak > 0} />
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <button
            type="button"
            onClick={fetchData}
            className="mb-4 w-full rounded-xl px-4 py-3 text-sm text-left animate-fade-up"
            style={{
              backgroundColor: '#2A1515',
              border: '1px solid #D8412F',
              color: '#F4F2EE',
            }}
          >
            {error}
          </button>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-16 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero Message Card ── */}
            <div
              className="relative overflow-hidden rounded-2xl mb-4 animate-fade-up delay-100"
              style={{ height: 260 }}
            >
              {/* Background image with Ken-Burns */}
              <img
                src={profile.heroImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
                loading="eager"
              />
              {/* Cinematic overlay */}
              <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(10,10,11,0.1) 0%, rgba(10,10,11,0.45) 45%, rgba(10,10,11,0.95) 100%)',
                }}
              />
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <p
                  className="mb-3"
                  style={{
                    fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                    fontSize: '1.2rem',
                    color: '#F4F2EE',
                    lineHeight: 1.25,
                    textShadow: '0 2px 16px rgba(0,0,0,0.7)',
                  }}
                >
                  {todayMessage}
                </p>
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full self-start"
                  style={{
                    color: profile.accentColor,
                    backgroundColor: `${profile.accentColor}22`,
                    border: `1px solid ${profile.accentColor}44`,
                  }}
                >
                  {profile.name}
                </span>
              </div>
            </div>

            {/* ── Check-In Button ── */}
            <div className="mb-6 animate-fade-up delay-200">
              {todayCheckedIn ? (
                <div
                  className="w-full flex items-center justify-center gap-3 rounded-xl py-5 px-6"
                  style={{
                    backgroundColor: '#0D2016',
                    border: '1px solid #1A4A2A',
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 28,
                      height: 28,
                      backgroundColor: '#34D399',
                    }}
                  >
                    <Check size={15} color="#0A0A0B" strokeWidth={3} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                        fontSize: '1.1rem',
                        letterSpacing: '0.05em',
                        color: '#34D399',
                        lineHeight: 1,
                      }}
                    >
                      SHOWED UP TODAY
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#8B8B92' }}>
                      Showing up. Every day.
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full rounded-xl py-5 px-6 animate-pulse-glow btn-press disabled:opacity-60 disabled:cursor-wait"
                  style={{
                    background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                    boxShadow: '0 0 30px rgba(232,163,61,0.4)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                      fontSize: '1.25rem',
                      letterSpacing: '0.08em',
                      color: '#0A0A0B',
                    }}
                  >
                    {checkingIn ? 'LOGGING…' : 'I SHOWED UP TODAY'}
                  </span>
                </button>
              )}
            </div>

            {/* ── Today's Focus ── */}
            <div className="animate-fade-up delay-300">
              <h2
                className="text-xs uppercase tracking-widest mb-3"
                style={{
                  fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                  color: '#8B8B92',
                  letterSpacing: '0.15em',
                }}
              >
                Today&apos;s Focus
              </h2>

              {user?.goal_text && (
                <p
                  className="italic mb-4 text-sm leading-relaxed"
                  style={{ color: '#8B8B92' }}
                >
                  &ldquo;{user.goal_text}&rdquo;
                </p>
              )}

              {habits.length === 0 ? (
                <div
                  className="rounded-xl p-5 text-center"
                  style={{
                    backgroundColor: '#1A1A1D',
                    border: '1px solid #2A2A2E',
                  }}
                >
                  <Target
                    size={32}
                    className="mx-auto mb-3"
                    style={{ color: '#8B8B92' }}
                  />
                  <p className="text-sm mb-1" style={{ color: '#8B8B92' }}>
                    No habits scheduled for today.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/goals')}
                    className="text-sm font-semibold underline"
                    style={{ color: '#E8A33D' }}
                  >
                    Add a goal to get started
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.map((habit) => (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => handleToggleHabit(habit.id, habit.completed)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-4 btn-press text-left"
                      style={{
                        backgroundColor: '#1A1A1D',
                        border: `1px solid ${habit.completed ? '#1A4A2A' : '#2A2A2E'}`,
                        transition: 'border-color 200ms',
                      }}
                    >
                      {/* Checkmark circle */}
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded-full transition-colors duration-200"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: habit.completed ? '#34D399' : 'transparent',
                          border: `2px solid ${habit.completed ? '#34D399' : '#2A2A2E'}`,
                        }}
                      >
                        {habit.completed && (
                          <Check size={14} color="#0A0A0B" strokeWidth={3} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-sm leading-snug"
                          style={{
                            color: habit.completed ? '#8B8B92' : '#F4F2EE',
                            textDecoration: habit.completed ? 'line-through' : 'none',
                          }}
                        >
                          {habit.title}
                        </p>
                        {habit.goal && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#8B8B92' }}>
                            {habit.goal.title}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Quick Access ── */}
            <div className="flex gap-3 mt-5 animate-fade-up delay-400">
              <button
                type="button"
                onClick={() => navigate('/motivators')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 btn-press"
                style={{
                  backgroundColor: '#1A1A1D',
                  border: '1px solid #2A2A2E',
                  color: '#F4F2EE',
                }}
              >
                <Zap size={16} style={{ color: '#E8A33D' }} />
                <span className="text-sm font-medium">Switch Motivator</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/goals')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 btn-press"
                style={{
                  backgroundColor: '#1A1A1D',
                  border: '1px solid #2A2A2E',
                  color: '#F4F2EE',
                }}
              >
                <Target size={16} style={{ color: '#E8A33D' }} />
                <span className="text-sm font-medium">My Goals</span>
              </button>
            </div>

            {/* ── Free Upgrade Prompt ── */}
            {!isPro && (
              <div
                className="mt-5 rounded-2xl p-4 flex items-center justify-between animate-fade-up delay-500"
                style={{
                  backgroundColor: '#1A1A1D',
                  border: '1px solid #E8A33D55',
                }}
              >
                <div className="flex items-start gap-3 flex-1 pr-3">
                  <Crown
                    size={20}
                    style={{ color: '#E8A33D', flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: '#E8A33D' }}
                    >
                      Upgrade to PRO
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#8B8B92' }}>
                      Unlimited goals, multiple motivators &amp; analytics
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/paywall')}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 btn-press flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                    color: '#0A0A0B',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Go PRO
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
