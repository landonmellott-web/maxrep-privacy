import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Award } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import StreakFlame from '../components/StreakFlame'
import type { Habit, Goal, HabitLog } from '../lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function computeStreak(logs: { date: string }[]): number {
  const uniqueDates = [...new Set(logs.map((l) => l.date))].sort((a, b) =>
    b.localeCompare(a)
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
}

function computeLongestStreak(logs: { date: string }[]): number {
  const uniqueDates = [...new Set(logs.map((l) => l.date))].sort()
  if (uniqueDates.length === 0) return 0

  let max = 1
  let current = 1

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00')
    const curr = new Date(uniqueDates[i] + 'T00:00:00')
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      current++
      max = Math.max(max, current)
    } else {
      current = 1
    }
  }
  return max
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: '#222226' }}
    />
  )
}

// ─── Badge definitions ────────────────────────────────────────────────────────

interface BadgeDef {
  id: string
  icon: string
  name: string
  description: string
  check: (stats: Stats) => boolean
}

interface Stats {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  hasComeback: boolean
}

const BADGES: BadgeDef[] = [
  {
    id: 'first_step',
    icon: '👣',
    name: 'First Step',
    description: 'Complete your first check-in',
    check: (s) => s.totalActiveDays >= 1,
  },
  {
    id: 'week_warrior',
    icon: '⚡',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'month_monster',
    icon: '🦁',
    name: 'Month Monster',
    description: 'Maintain a 30-day streak',
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: 'century',
    icon: '💯',
    name: 'Century',
    description: 'Maintain a 100-day streak',
    check: (s) => s.longestStreak >= 100,
  },
  {
    id: 'consistent',
    icon: '🏆',
    name: 'Consistent',
    description: 'Log 30 total active days',
    check: (s) => s.totalActiveDays >= 30,
  },
  {
    id: 'comeback',
    icon: '🔄',
    name: 'Comeback',
    description: 'Return after missing 3+ days',
    check: (s) => s.hasComeback,
  },
]

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function HeatmapCell({ count }: { count: number }) {
  const opacity =
    count === 0 ? 0.08 : count === 1 ? 0.35 : count === 2 ? 0.6 : 0.9

  return (
    <div
      className="rounded-sm"
      style={{
        width: 12,
        height: 12,
        backgroundColor: `rgba(232, 163, 61, ${opacity})`,
        flexShrink: 0,
      }}
    />
  )
}

function HeatmapGrid({ heatmapData }: { heatmapData: Record<string, number> }) {
  const today = todayISO()

  // Build 12 weeks = 84 days grid (Sunday-anchored)
  const todayDate = new Date(today + 'T00:00:00')
  const dayOfWeek = todayDate.getDay() // 0 = Sun

  // We want exactly 12 full weeks ending on the last complete week's Saturday
  const gridDays = 12 * 7
  const weeks: string[][] = []
  let week: string[] = []

  for (let i = gridDays - 1; i >= 0; i--) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i + (6 - dayOfWeek))
    const iso = d.toISOString().slice(0, 10)
    week.push(iso)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week)

  // Month labels: find first day of each month in the grid
  const monthLabels: { label: string; colIndex: number }[] = []
  weeks.forEach((w, idx) => {
    const firstDay = w[0]
    const d = new Date(firstDay + 'T00:00:00')
    if (d.getDate() <= 7) {
      monthLabels.push({
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        colIndex: idx,
      })
    }
  })

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-1 mb-1 pl-0">
        {weeks.map((_, idx) => {
          const ml = monthLabels.find((m) => m.colIndex === idx)
          return (
            <div key={idx} style={{ width: 12, flexShrink: 0 }}>
              {ml && (
                <span
                  className="text-xs"
                  style={{ color: '#8B8B92', fontSize: 9, whiteSpace: 'nowrap' }}
                >
                  {ml.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-1">
            {week.map((date) => (
              <HeatmapCell
                key={date}
                count={heatmapData[date] ?? 0}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs" style={{ color: '#8B8B92', fontSize: 10 }}>Less</span>
        {[0, 1, 2, 3].map((v) => (
          <HeatmapCell key={v} count={v} />
        ))}
        <span className="text-xs" style={{ color: '#8B8B92', fontSize: 10 }}>More</span>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Progress() {
  const { user } = useApp()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [totalActiveDays, setTotalActiveDays] = useState(0)
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [habitRates, setHabitRates] = useState<{ habit: Habit; goal: Goal; rate: number }[]>([])
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set())
  const [newBadgeIds, setNewBadgeIds] = useState<Set<string>>(new Set())

  const isPro =
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing'

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch all completed habit logs
      const { data: logsData, error: logsErr } = await supabase
        .from('habit_logs')
        .select('habit_id, date, completed')
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })

      if (logsErr) throw logsErr

      const logs = (logsData || []) as Pick<HabitLog, 'habit_id' | 'date' | 'completed'>[]

      // Streak stats
      const streak = computeStreak(logs)
      const longest = computeLongestStreak(logs)
      const uniqueDays = new Set(logs.map((l) => l.date))
      setCurrentStreak(streak)
      setLongestStreak(longest)
      setTotalActiveDays(uniqueDays.size)

      // Heatmap: count completions per date
      const heatmap: Record<string, number> = {}
      for (const log of logs) {
        heatmap[log.date] = (heatmap[log.date] || 0) + 1
      }
      setHeatmapData(heatmap)

      // Check for "comeback" badge: missed 3+ days then returned
      const sortedDates = [...uniqueDays].sort()
      let hasComeback = false
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1] + 'T00:00:00')
        const curr = new Date(sortedDates[i] + 'T00:00:00')
        const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
        if (gap >= 4) { hasComeback = true; break }
      }

      // Compute badges
      const stats: Stats = { currentStreak: streak, longestStreak: longest, totalActiveDays: uniqueDays.size, hasComeback }
      const earned = new Set(BADGES.filter((b) => b.check(stats)).map((b) => b.id))
      setEarnedBadgeIds(earned)

      // Detect newly earned (simple heuristic: earned this session)
      // In production you'd persist this to Supabase
      setNewBadgeIds(earned)

      // Habit completion rates (last 30 days)
      const thirtyDaysAgo = subtractDays(todayISO(), 30)
      const recentLogs = logs.filter((l) => l.date >= thirtyDaysAgo)

      // Get habits + goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const goals = (goalsData || []) as Goal[]
      if (goals.length > 0) {
        const goalIds = goals.map((g) => g.id)
        const { data: habitsData } = await supabase
          .from('habits')
          .select('*')
          .in('goal_id', goalIds)

        const habits = (habitsData || []) as Habit[]
        const goalMap = Object.fromEntries(goals.map((g) => [g.id, g]))

        // Count completions per habit in last 30 days
        const habitCompletions: Record<string, number> = {}
        for (const log of recentLogs) {
          habitCompletions[log.habit_id] = (habitCompletions[log.habit_id] || 0) + 1
        }

        const rates = habits.map((h) => ({
          habit: h,
          goal: goalMap[h.goal_id],
          rate: Math.min(100, Math.round(((habitCompletions[h.id] || 0) / 30) * 100)),
        }))

        setHabitRates(rates.filter((r) => r.goal))
      }
    } catch (err) {
      console.error('[Progress] fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
      <div className="px-4 pb-28 pt-14 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="mb-6 animate-fade-up">
          <h1
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '2rem',
              color: '#F4F2EE',
              lineHeight: 1,
            }}
          >
            YOUR PROGRESS
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8B8B92' }}>
            Keep showing up. The numbers don&apos;t lie.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up delay-100">
              {/* Current streak */}
              <div
                className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
              >
                <StreakFlame count={currentStreak} size="sm" animated={currentStreak > 0} />
                <p
                  className="text-xs mt-2"
                  style={{ color: '#8B8B92' }}
                >
                  Current
                </p>
              </div>

              {/* Longest streak */}
              <div
                className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
              >
                <p
                  style={{
                    fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                    fontSize: '1.5rem',
                    color: '#E8A33D',
                    lineHeight: 1,
                  }}
                >
                  {longestStreak}
                </p>
                <p className="text-xs mt-1" style={{ color: '#8B8B92' }}>Longest</p>
              </div>

              {/* Total days */}
              <div
                className="rounded-2xl p-3 text-center"
                style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
              >
                <p
                  style={{
                    fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                    fontSize: '1.5rem',
                    color: '#4A90A4',
                    lineHeight: 1,
                  }}
                >
                  {totalActiveDays}
                </p>
                <p className="text-xs mt-1" style={{ color: '#8B8B92' }}>Total Days</p>
              </div>
            </div>

            {/* ── Calendar Heatmap (PRO gate) ── */}
            <div className="mb-6 animate-fade-up delay-200">
              <h2
                className="text-xs uppercase tracking-widest mb-3"
                style={{
                  fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                  color: '#8B8B92',
                  letterSpacing: '0.15em',
                }}
              >
                Activity Heatmap
              </h2>

              {isPro ? (
                <div
                  className="rounded-2xl p-4 overflow-x-auto no-scrollbar"
                  style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
                >
                  <HeatmapGrid heatmapData={heatmapData} />
                </div>
              ) : (
                <div
                  className="rounded-2xl p-6 text-center relative overflow-hidden"
                  style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
                >
                  {/* Blurred preview */}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ filter: 'blur(4px)', opacity: 0.3 }}
                  >
                    <HeatmapGrid heatmapData={{ [todayISO()]: 3, [subtractDays(todayISO(), 1)]: 2 }} />
                  </div>
                  {/* Lock overlay */}
                  <div className="relative z-10 flex flex-col items-center py-4">
                    <Lock size={24} style={{ color: '#E8A33D', marginBottom: 10 }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: '#F4F2EE' }}>
                      PRO Feature
                    </p>
                    <p className="text-xs mb-4" style={{ color: '#8B8B92' }}>
                      Full heatmap available on PRO.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/paywall')}
                      className="rounded-lg py-2 px-4 text-xs font-bold btn-press"
                      style={{
                        background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                        color: '#0A0A0B',
                      }}
                    >
                      Unlock PRO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Habit completion rates ── */}
            {habitRates.length > 0 && (
              <div className="mb-6 animate-fade-up delay-300">
                <h2
                  className="text-xs uppercase tracking-widest mb-3"
                  style={{
                    fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                    color: '#8B8B92',
                    letterSpacing: '0.15em',
                  }}
                >
                  30-Day Completion Rates
                </h2>
                <div
                  className="rounded-2xl p-4 space-y-4"
                  style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
                >
                  {habitRates.map(({ habit, goal, rate }) => (
                    <div key={habit.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex-1 min-w-0 pr-4">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: '#F4F2EE' }}
                          >
                            {habit.title}
                          </p>
                          <p className="text-xs truncate" style={{ color: '#8B8B92' }}>
                            {goal.title}
                          </p>
                        </div>
                        <p
                          className="text-sm font-bold flex-shrink-0"
                          style={{ color: rate >= 70 ? '#E8A33D' : rate >= 40 ? '#F0B555' : '#8B8B92' }}
                        >
                          {rate}%
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div
                        className="w-full rounded-full overflow-hidden"
                        style={{ height: 6, backgroundColor: '#2A2A2E' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${rate}%`,
                            background:
                              rate >= 70
                                ? 'linear-gradient(90deg, #E8A33D, #C8872A)'
                                : rate >= 40
                                  ? 'linear-gradient(90deg, #F0B555, #E8A33D)'
                                  : '#2A2A2E',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Badges ── */}
            <div className="animate-fade-up delay-400">
              <h2
                className="text-xs uppercase tracking-widest mb-3"
                style={{
                  fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                  color: '#8B8B92',
                  letterSpacing: '0.15em',
                }}
              >
                Badges
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {BADGES.map((badge) => {
                  const earned = earnedBadgeIds.has(badge.id)
                  const isNew = newBadgeIds.has(badge.id)

                  return (
                    <div
                      key={badge.id}
                      className={`rounded-2xl p-3 text-center relative overflow-hidden ${earned && isNew ? 'animate-streak-burst' : ''}`}
                      style={{
                        backgroundColor: earned ? '#1A1A1D' : '#121214',
                        border: `1px solid ${earned ? '#E8A33D55' : '#2A2A2E'}`,
                        background: earned
                          ? 'linear-gradient(135deg, #1A1A1D 0%, #221A10 100%)'
                          : '#121214',
                      }}
                    >
                      {!earned && (
                        <div
                          className="absolute inset-0 flex items-center justify-center rounded-2xl"
                          style={{ backgroundColor: 'rgba(10,10,11,0.65)' }}
                          aria-hidden="true"
                        >
                          <Lock size={18} style={{ color: '#2A2A2E' }} />
                        </div>
                      )}

                      <div className={`text-2xl mb-1.5 ${earned ? '' : 'opacity-30'}`}>
                        {badge.icon}
                      </div>
                      <p
                        className="text-xs font-bold leading-snug"
                        style={{ color: earned ? '#E8A33D' : '#8B8B92' }}
                      >
                        {badge.name}
                      </p>
                      <p
                        className="text-xs mt-0.5 leading-tight"
                        style={{ color: '#8B8B92', fontSize: 9 }}
                      >
                        {badge.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── PRO analytics promo ── */}
            {!isPro && (
              <div
                className="mt-6 rounded-2xl p-4 flex items-center justify-between animate-fade-up delay-500"
                style={{
                  backgroundColor: '#1A1A1D',
                  border: '1px solid #E8A33D55',
                }}
              >
                <div className="flex items-start gap-3 flex-1 pr-3">
                  <Award size={20} style={{ color: '#E8A33D', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: '#E8A33D' }}
                    >
                      Full Analytics on PRO
                    </p>
                    <p className="text-xs" style={{ color: '#8B8B92' }}>
                      Heatmap, detailed rates, and all badge milestones.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/paywall')}
                  className="rounded-lg py-2 px-3 text-xs font-bold btn-press flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                    color: '#0A0A0B',
                  }}
                >
                  Go PRO
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
