import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Check,
  Circle,
  X,
  Calendar,
  Target,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import GoldButton from '../components/GoldButton'
import PaywallGate from '../components/PaywallGate'
import type { Goal, Habit, GoalCategory } from '../lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: GoalCategory[] = [
  'Fitness',
  'Career',
  'Discipline',
  'Mindset',
  'Business',
  'Recovery',
  'Other',
]

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  Fitness: '#E8A33D',
  Career: '#4A90A4',
  Discipline: '#C0392B',
  Mindset: '#8E6BBF',
  Business: '#27AE60',
  Recovery: '#2980B9',
  Other: '#8B8B92',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_VALUES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function todayWeekday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
}

function frequencyLabel(freq: Habit['frequency']): string {
  if (freq === 'daily') return 'Daily'
  if (Array.isArray(freq)) {
    if (freq.length === 7) return 'Daily'
    return freq.map((d) => d.slice(0, 3)).join(', ')
  }
  return String(freq)
}

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: '#222226' }}
    />
  )
}

// ─── Goal Form Modal ──────────────────────────────────────────────────────────

interface GoalFormProps {
  initial?: Partial<Goal>
  onClose: () => void
  onSave: (data: { title: string; category: GoalCategory; why: string; target_date: string | null }) => void
  saving: boolean
}

function GoalFormModal({ initial, onClose, onSave, saving }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [category, setCategory] = useState<GoalCategory>(initial?.category ?? 'Fitness')
  const [why, setWhy] = useState(initial?.why ?? '')
  const [targetDate, setTargetDate] = useState(initial?.target_date ?? '')

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      category,
      why: why.trim(),
      target_date: targetDate || null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(10,10,11,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-t-3xl animate-fade-up overflow-y-auto"
        style={{
          backgroundColor: '#121214',
          border: '1px solid #2A2A2E',
          borderBottom: 'none',
          maxHeight: '88vh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#2A2A2E' }} />
        </div>

        <div className="px-5 pb-10 pt-3">
          <div className="flex items-center justify-between mb-6">
            <h2
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                fontSize: '1.5rem',
                color: '#F4F2EE',
              }}
            >
              {initial?.id ? 'EDIT GOAL' : 'NEW GOAL'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl btn-press"
              style={{ backgroundColor: '#1A1A1D', color: '#8B8B92' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#8B8B92' }}
            >
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a 5K in under 25 min"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: '#1A1A1D',
                border: '1px solid #2A2A2E',
                color: '#F4F2EE',
                caretColor: '#E8A33D',
              }}
            />
          </div>

          {/* Category */}
          <div className="mb-5">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: '#8B8B92' }}
            >
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c
                const color = CATEGORY_COLORS[c]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold btn-press"
                    style={{
                      backgroundColor: isSelected ? `${color}22` : '#1A1A1D',
                      border: `1px solid ${isSelected ? color : '#2A2A2E'}`,
                      color: isSelected ? color : '#8B8B92',
                    }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Why */}
          <div className="mb-5">
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#8B8B92' }}
            >
              Your Why
            </label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Why does this goal matter to you?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: '#1A1A1D',
                border: '1px solid #2A2A2E',
                color: '#F4F2EE',
                caretColor: '#E8A33D',
              }}
            />
          </div>

          {/* Target date */}
          <div className="mb-7">
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#8B8B92' }}
            >
              Target Date (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: '#1A1A1D',
                border: '1px solid #2A2A2E',
                color: targetDate ? '#F4F2EE' : '#8B8B92',
                colorScheme: 'dark',
              }}
            />
          </div>

          <GoldButton onClick={handleSubmit} loading={saving} disabled={!title.trim()}>
            {initial?.id ? 'Save Goal' : 'Create Goal'}
          </GoldButton>
        </div>
      </div>
    </div>
  )
}

// ─── Habit Form Modal ─────────────────────────────────────────────────────────

interface HabitFormProps {
  goalId: string
  initial?: Partial<Habit>
  onClose: () => void
  onSave: (data: { title: string; frequency: 'daily' | string[] }) => void
  saving: boolean
}

function HabitFormModal({ initial, onClose, onSave, saving }: HabitFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [isDaily, setIsDaily] = useState(
    !initial?.frequency || initial.frequency === 'daily'
  )
  const [selectedDays, setSelectedDays] = useState<string[]>(
    Array.isArray(initial?.frequency) ? (initial.frequency as string[]) : []
  )

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      frequency: isDaily ? 'daily' : selectedDays.length > 0 ? selectedDays : 'daily',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(10,10,11,0.75)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-t-3xl animate-fade-up overflow-y-auto"
        style={{
          backgroundColor: '#121214',
          border: '1px solid #2A2A2E',
          borderBottom: 'none',
          maxHeight: '75vh',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#2A2A2E' }} />
        </div>

        <div className="px-5 pb-10 pt-3">
          <div className="flex items-center justify-between mb-6">
            <h2
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                fontSize: '1.5rem',
                color: '#F4F2EE',
              }}
            >
              {initial?.id ? 'EDIT HABIT' : 'ADD HABIT'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl btn-press"
              style={{ backgroundColor: '#1A1A1D', color: '#8B8B92' }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: '#8B8B92' }}
            >
              Habit
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run for 30 minutes"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: '#1A1A1D',
                border: '1px solid #2A2A2E',
                color: '#F4F2EE',
                caretColor: '#E8A33D',
              }}
            />
          </div>

          {/* Frequency */}
          <div className="mb-7">
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ color: '#8B8B92' }}
            >
              Frequency
            </p>
            <div className="flex gap-3 mb-3">
              <button
                type="button"
                onClick={() => setIsDaily(true)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{
                  backgroundColor: isDaily ? '#E8A33D22' : '#1A1A1D',
                  border: `1px solid ${isDaily ? '#E8A33D' : '#2A2A2E'}`,
                  color: isDaily ? '#E8A33D' : '#8B8B92',
                }}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setIsDaily(false)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{
                  backgroundColor: !isDaily ? '#E8A33D22' : '#1A1A1D',
                  border: `1px solid ${!isDaily ? '#E8A33D' : '#2A2A2E'}`,
                  color: !isDaily ? '#E8A33D' : '#8B8B92',
                }}
              >
                Specific Days
              </button>
            </div>

            {!isDaily && (
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => {
                  const val = DAY_VALUES[idx]
                  const isSelected = selectedDays.includes(val)
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleDay(val)}
                      className="flex-1 rounded-lg py-2.5 text-xs font-bold btn-press"
                      style={{
                        backgroundColor: isSelected ? '#E8A33D' : '#1A1A1D',
                        border: `1px solid ${isSelected ? '#E8A33D' : '#2A2A2E'}`,
                        color: isSelected ? '#0A0A0B' : '#8B8B92',
                      }}
                    >
                      {label[0]}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <GoldButton onClick={handleSubmit} loading={saving} disabled={!title.trim()}>
            {initial?.id ? 'Save Habit' : 'Add Habit'}
          </GoldButton>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GoalWithHabits extends Goal {
  habits: (Habit & { completed: boolean })[]
}

export default function Goals() {
  const { user } = useApp()

  const [goals, setGoals] = useState<GoalWithHabits[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'today'>('all')

  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [showHabitModal, setShowHabitModal] = useState<string | null>(null) // goalId
  const [editHabit, setEditHabit] = useState<Habit | null>(null)

  const [savingGoal, setSavingGoal] = useState(false)
  const [savingHabit, setSavingHabit] = useState(false)
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState<string | null>(null)
  const [confirmDeleteHabit, setConfirmDeleteHabit] = useState<string | null>(null)

  const isPro =
    user?.subscription_status === 'active' ||
    user?.subscription_status === 'trialing'

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const { data: goalsData, error: goalsErr } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (goalsErr) throw goalsErr

      const fetchedGoals = (goalsData || []) as Goal[]

      if (fetchedGoals.length === 0) {
        setGoals([])
        setLoading(false)
        return
      }

      const goalIds = fetchedGoals.map((g) => g.id)

      const { data: habitsData, error: habitsErr } = await supabase
        .from('habits')
        .select('*')
        .in('goal_id', goalIds)

      if (habitsErr) throw habitsErr

      // Get today's logs for today-view completions
      const allHabitIds = (habitsData || []).map((h: Habit) => h.id)
      let completedSet = new Set<string>()

      if (allHabitIds.length > 0) {
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('habit_id')
          .in('habit_id', allHabitIds)
          .eq('date', todayISO())
          .eq('completed', true)
        completedSet = new Set((logsData || []).map((l: { habit_id: string }) => l.habit_id))
      }

      const habitsMap: Record<string, (Habit & { completed: boolean })[]> = {}
      for (const h of (habitsData || []) as Habit[]) {
        if (!habitsMap[h.goal_id]) habitsMap[h.goal_id] = []
        habitsMap[h.goal_id].push({ ...h, completed: completedSet.has(h.id) })
      }

      setGoals(
        fetchedGoals.map((g) => ({
          ...g,
          habits: habitsMap[g.id] || [],
        }))
      )
    } catch (err) {
      console.error('[Goals] fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Goal CRUD ─────────────────────────────────────────────────────────────────
  const handleSaveGoal = async (data: {
    title: string
    category: GoalCategory
    why: string
    target_date: string | null
  }) => {
    if (!user) return
    setSavingGoal(true)

    try {
      if (editGoal?.id) {
        const { error } = await supabase
          .from('goals')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editGoal.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('goals').insert({
          ...data,
          user_id: user.id,
          is_active: true,
        })
        if (error) throw error
      }

      setShowGoalModal(false)
      setEditGoal(null)
      await fetchData()
    } catch (err) {
      console.error('[Goals] saveGoal error:', err)
    } finally {
      setSavingGoal(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId)
    if (error) console.error('[Goals] deleteGoal error:', error.message)
    else setGoals((prev) => prev.filter((g) => g.id !== goalId))
    setConfirmDeleteGoal(null)
  }

  // ── Habit CRUD ────────────────────────────────────────────────────────────────
  const handleSaveHabit = async (data: { title: string; frequency: 'daily' | string[] }) => {
    if (!showHabitModal) return
    setSavingHabit(true)

    try {
      if (editHabit?.id) {
        const { error } = await supabase
          .from('habits')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editHabit.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('habits').insert({
          ...data,
          goal_id: showHabitModal,
        })
        if (error) throw error
      }

      setShowHabitModal(null)
      setEditHabit(null)
      await fetchData()
    } catch (err) {
      console.error('[Goals] saveHabit error:', err)
    } finally {
      setSavingHabit(false)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId)
    if (error) console.error('[Goals] deleteHabit error:', error.message)
    else {
      setGoals((prev) =>
        prev.map((g) => ({ ...g, habits: g.habits.filter((h) => h.id !== habitId) }))
      )
    }
    setConfirmDeleteHabit(null)
  }

  // ── Toggle today habit ───────────────────────────────────────────────────────
  const toggleTodayHabit = async (habit: Habit & { completed: boolean }) => {
    if (!user) return
    const newCompleted = !habit.completed

    // Optimistic update
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        habits: g.habits.map((h) =>
          h.id === habit.id ? { ...h, completed: newCompleted } : h
        ),
      }))
    )

    try {
      if (newCompleted) {
        await supabase.from('habit_logs').upsert(
          { habit_id: habit.id, user_id: user.id, date: todayISO(), completed: true },
          { onConflict: 'habit_id,date' }
        )
      } else {
        await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habit.id)
          .eq('date', todayISO())
      }
    } catch (err) {
      console.error('[Goals] toggleHabit error:', err)
      // Revert
      setGoals((prev) =>
        prev.map((g) => ({
          ...g,
          habits: g.habits.map((h) =>
            h.id === habit.id ? { ...h, completed: habit.completed } : h
          ),
        }))
      )
    }
  }

  // ── Today view ────────────────────────────────────────────────────────────────
  const todayWeekdayName = todayWeekday()
  const todayHabits = goals.flatMap((g) =>
    g.habits
      .filter((h) => {
        if (h.frequency === 'daily') return true
        if (Array.isArray(h.frequency)) return h.frequency.includes(todayWeekdayName)
        return false
      })
      .map((h) => ({ ...h, goalTitle: g.title }))
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0B' }}>
      {/* Goal modal */}
      {showGoalModal && (
        <GoalFormModal
          initial={editGoal ?? undefined}
          onClose={() => { setShowGoalModal(false); setEditGoal(null) }}
          onSave={handleSaveGoal}
          saving={savingGoal}
        />
      )}

      {/* Habit modal */}
      {showHabitModal && (
        <HabitFormModal
          goalId={showHabitModal}
          initial={editHabit ?? undefined}
          onClose={() => { setShowHabitModal(null); setEditHabit(null) }}
          onSave={handleSaveHabit}
          saving={savingHabit}
        />
      )}

      {/* Delete goal confirm */}
      {confirmDeleteGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(10,10,11,0.85)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: '#F4F2EE' }}>
              Delete Goal?
            </h3>
            <p className="text-sm mb-6" style={{ color: '#8B8B92' }}>
              All habits under this goal will also be deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteGoal(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{ backgroundColor: '#222226', border: '1px solid #2A2A2E', color: '#F4F2EE' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGoal(confirmDeleteGoal)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{ backgroundColor: '#2A1515', border: '1px solid #D8412F', color: '#D8412F' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete habit confirm */}
      {confirmDeleteHabit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(10,10,11,0.85)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-up"
            style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: '#F4F2EE' }}>Delete Habit?</h3>
            <p className="text-sm mb-6" style={{ color: '#8B8B92' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteHabit(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{ backgroundColor: '#222226', border: '1px solid #2A2A2E', color: '#F4F2EE' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteHabit(confirmDeleteHabit)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold btn-press"
                style={{ backgroundColor: '#2A1515', border: '1px solid #D8412F', color: '#D8412F' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-28 pt-14 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-4 animate-fade-up">
          <div>
            <h1
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                fontSize: '2rem',
                color: '#F4F2EE',
                lineHeight: 1,
              }}
            >
              MY GOALS
            </h1>
            <p className="text-sm mt-1" style={{ color: '#8B8B92' }}>
              {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
            </p>
          </div>

          {/* Add Goal button — gated for free users with 1+ goals */}
          {!isPro && goals.length >= 1 ? (
            <PaywallGate feature="Multiple goals">
              <button
                type="button"
                onClick={() => { setEditGoal(null); setShowGoalModal(true) }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 btn-press"
                style={{
                  background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                  color: '#0A0A0B',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                <Plus size={16} />
                Add Goal
              </button>
            </PaywallGate>
          ) : (
            <button
              type="button"
              onClick={() => { setEditGoal(null); setShowGoalModal(true) }}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 btn-press"
              style={{
                background: 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)',
                color: '#0A0A0B',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              <Plus size={16} />
              Add Goal
            </button>
          )}
        </div>

        {/* ── Tab toggle ── */}
        <div
          className="flex rounded-xl mb-5 p-1 animate-fade-up delay-100"
          style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
        >
          {(['all', 'today'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold btn-press transition-colors duration-200"
              style={{
                backgroundColor: activeTab === tab ? '#E8A33D' : 'transparent',
                color: activeTab === tab ? '#0A0A0B' : '#8B8B92',
              }}
            >
              {tab === 'all' ? 'All Goals' : "Today's Habits"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : activeTab === 'today' ? (
          /* ── Today view ── */
          <div className="animate-fade-up">
            {todayHabits.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
              >
                <Target size={32} className="mx-auto mb-3" style={{ color: '#8B8B92' }} />
                <p className="text-sm" style={{ color: '#8B8B92' }}>
                  No habits scheduled for today.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayHabits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleTodayHabit(habit)}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left btn-press"
                    style={{
                      backgroundColor: '#1A1A1D',
                      border: `1px solid ${habit.completed ? '#1A4A2A' : '#2A2A2E'}`,
                    }}
                  >
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 26,
                        height: 26,
                        backgroundColor: habit.completed ? '#34D399' : 'transparent',
                        border: `2px solid ${habit.completed ? '#34D399' : '#2A2A2E'}`,
                      }}
                    >
                      {habit.completed && <Check size={13} color="#0A0A0B" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: habit.completed ? '#8B8B92' : '#F4F2EE',
                          textDecoration: habit.completed ? 'line-through' : 'none',
                        }}
                      >
                        {habit.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#8B8B92' }}>
                        {habit.goalTitle}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : goals.length === 0 ? (
          /* ── Empty state ── */
          <div
            className="rounded-2xl p-8 text-center animate-fade-up"
            style={{ backgroundColor: '#1A1A1D', border: '1px solid #2A2A2E' }}
          >
            <Target size={40} className="mx-auto mb-4" style={{ color: '#8B8B92' }} />
            <h3
              className="text-lg font-bold mb-2"
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                color: '#F4F2EE',
              }}
            >
              SET YOUR FIRST GOAL
            </h3>
            <p className="text-sm mb-5" style={{ color: '#8B8B92' }}>
              Goals give your daily habits purpose and direction.
            </p>
            <GoldButton onClick={() => setShowGoalModal(true)} className="max-w-xs mx-auto">
              Create a Goal
            </GoldButton>
          </div>
        ) : (
          /* ── Goals list (accordion) ── */
          <div className="space-y-3 animate-fade-up delay-100">
            {goals.map((goal) => {
              const isExpanded = expandedGoal === goal.id
              const catColor = CATEGORY_COLORS[goal.category] || '#8B8B92'

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: '#1A1A1D',
                    border: `1px solid ${isExpanded ? catColor + '55' : '#2A2A2E'}`,
                  }}
                >
                  {/* Goal header */}
                  <button
                    type="button"
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    className="w-full flex items-start gap-3 px-4 py-4 text-left"
                  >
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: catColor, minHeight: 24 }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                          style={{
                            color: catColor,
                            backgroundColor: `${catColor}22`,
                            border: `1px solid ${catColor}44`,
                          }}
                        >
                          {goal.category}
                        </span>
                        <span className="text-xs" style={{ color: '#8B8B92' }}>
                          {goal.habits.length} {goal.habits.length === 1 ? 'habit' : 'habits'}
                        </span>
                      </div>
                      <p
                        className="font-bold text-base leading-snug"
                        style={{ color: '#F4F2EE' }}
                      >
                        {goal.title}
                      </p>
                      {goal.why && (
                        <p className="text-xs mt-1 italic leading-relaxed" style={{ color: '#8B8B92' }}>
                          &ldquo;{goal.why}&rdquo;
                        </p>
                      )}
                      {goal.target_date && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Calendar size={11} style={{ color: '#8B8B92' }} />
                          <p className="text-xs" style={{ color: '#8B8B92' }}>
                            {new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditGoal(goal)
                          setShowGoalModal(true)
                        }}
                        className="p-2 rounded-lg btn-press"
                        style={{ backgroundColor: '#222226', color: '#8B8B92' }}
                        aria-label={`Edit ${goal.title}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDeleteGoal(goal.id)
                        }}
                        className="p-2 rounded-lg btn-press"
                        style={{ backgroundColor: '#2A1515', color: '#D8412F' }}
                        aria-label={`Delete ${goal.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                      {isExpanded ? (
                        <ChevronUp size={18} style={{ color: '#8B8B92', marginLeft: 2 }} />
                      ) : (
                        <ChevronDown size={18} style={{ color: '#8B8B92', marginLeft: 2 }} />
                      )}
                    </div>
                  </button>

                  {/* Habits accordion content */}
                  {isExpanded && (
                    <div
                      className="border-t"
                      style={{ borderColor: '#2A2A2E' }}
                    >
                      {goal.habits.length === 0 ? (
                        <div className="px-4 py-3">
                          <p className="text-xs italic" style={{ color: '#8B8B92' }}>
                            No habits yet.
                          </p>
                        </div>
                      ) : (
                        <div className="px-4 py-2 space-y-1.5">
                          {goal.habits.map((habit) => (
                            <div
                              key={habit.id}
                              className="flex items-center gap-3 py-2.5 rounded-xl px-3"
                              style={{ backgroundColor: '#222226' }}
                            >
                              <Circle
                                size={16}
                                style={{ color: '#2A2A2E', flexShrink: 0 }}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: '#F4F2EE' }}
                                >
                                  {habit.title}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: '#8B8B92' }}>
                                  {frequencyLabel(habit.frequency)}
                                </p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditHabit(habit)
                                    setShowHabitModal(goal.id)
                                  }}
                                  className="p-1.5 rounded-lg btn-press"
                                  style={{ backgroundColor: '#1A1A1D', color: '#8B8B92' }}
                                  aria-label={`Edit ${habit.title}`}
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteHabit(habit.id)}
                                  className="p-1.5 rounded-lg btn-press"
                                  style={{ backgroundColor: '#2A1515', color: '#D8412F' }}
                                  aria-label={`Delete ${habit.title}`}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add habit button */}
                      <div className="px-4 pb-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditHabit(null)
                            setShowHabitModal(goal.id)
                          }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold btn-press"
                          style={{
                            backgroundColor: '#222226',
                            border: '1px dashed #2A2A2E',
                            color: '#8B8B92',
                          }}
                        >
                          <Plus size={14} />
                          Add Habit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
