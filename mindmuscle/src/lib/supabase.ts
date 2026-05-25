import { createClient } from '@supabase/supabase-js'
import type { Goal, Habit, HabitWithStatus, Message, UserProfile } from './types'

// ─── Client ────────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── User Profile ──────────────────────────────────────────────────────────

/**
 * Fetches the full profile row for the given user ID.
 * Returns null if the row doesn't exist or on any error.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[supabase] getUserProfile error:', error.message)
      return null
    }

    return data as UserProfile
  } catch (err) {
    console.error('[supabase] getUserProfile unexpected error:', err)
    return null
  }
}

/**
 * Creates or updates the profile row. The `id` field is required;
 * all other fields are optional partial updates.
 */
export async function upsertProfile(
  profile: Partial<UserProfile> & { id: string }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() })

    if (error) {
      console.error('[supabase] upsertProfile error:', error.message)
    }
  } catch (err) {
    console.error('[supabase] upsertProfile unexpected error:', err)
  }
}

// ─── Habits ────────────────────────────────────────────────────────────────

/**
 * Returns all habits that are due today for the given user, enriched
 * with a `completed` flag (based on today's habit_logs) and the
 * parent `goal` object.
 *
 * "Due today" means:
 *   - frequency === 'daily', OR
 *   - frequency is an array that includes today's lowercase weekday name
 *     (e.g. 'monday', 'tuesday', …)
 */
export async function getTodayHabits(userId: string): Promise<HabitWithStatus[]> {
  try {
    const today = new Date()
    const todayISO = today.toISOString().slice(0, 10) // 'YYYY-MM-DD'
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    // Fetch all habits belonging to this user's active goals, with goal info
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*, goal:goals!inner(*)')
      .eq('goals.user_id', userId)
      .eq('goals.is_active', true)

    if (habitsError) {
      console.error('[supabase] getTodayHabits habits error:', habitsError.message)
      return []
    }

    if (!habitsData || habitsData.length === 0) return []

    // Filter to habits due today
    const dueToday = (habitsData as Array<Habit & { goal: Goal }>).filter((h) => {
      if (h.frequency === 'daily') return true
      if (Array.isArray(h.frequency)) return h.frequency.includes(weekday)
      return false
    })

    if (dueToday.length === 0) return []

    const habitIds = dueToday.map((h) => h.id)

    // Fetch today's logs for these habits
    const { data: logsData, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, completed')
      .in('habit_id', habitIds)
      .eq('date', todayISO)

    if (logsError) {
      console.error('[supabase] getTodayHabits logs error:', logsError.message)
    }

    const completedSet = new Set<string>(
      (logsData ?? [])
        .filter((l) => l.completed)
        .map((l) => l.habit_id as string)
    )

    return dueToday.map((h) => ({
      ...h,
      completed: completedSet.has(h.id),
    }))
  } catch (err) {
    console.error('[supabase] getTodayHabits unexpected error:', err)
    return []
  }
}

/**
 * Upserts a habit_log row marking the given habit as completed for the date.
 * Uses upsert so calling it twice for the same habit/date is idempotent.
 */
export async function logHabit(habitId: string, date: string): Promise<void> {
  try {
    const { error } = await supabase.from('habit_logs').upsert(
      {
        habit_id: habitId,
        date,
        completed: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'habit_id,date' }
    )

    if (error) {
      console.error('[supabase] logHabit error:', error.message)
    }
  } catch (err) {
    console.error('[supabase] logHabit unexpected error:', err)
  }
}

// ─── Streaks ───────────────────────────────────────────────────────────────

/**
 * Calculates the current consecutive-day streak for a user.
 *
 * A day "counts" if the user completed at least one habit that day.
 * The streak starts from today (or yesterday if today has no log yet)
 * and walks backwards until a gap is found.
 */
export async function getStreak(userId: string): Promise<number> {
  try {
    // Get all distinct dates where the user completed at least one habit,
    // ordered most-recent-first, limited to a safe window (e.g. 365 days).
    const { data, error } = await supabase
      .from('habit_logs')
      .select('date, habits!inner(goal_id, goals!inner(user_id))')
      .eq('habits.goals.user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false })
      .limit(365)

    if (error) {
      console.error('[supabase] getStreak error:', error.message)
      return 0
    }

    if (!data || data.length === 0) return 0

    // Collect unique dates
    const uniqueDates = Array.from(new Set(data.map((r) => r.date as string))).sort(
      (a, b) => b.localeCompare(a) // descending
    )

    if (uniqueDates.length === 0) return 0

    const todayISO = new Date().toISOString().slice(0, 10)
    const yesterdayISO = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    })()

    // Streak must start from today or yesterday (allow today to still be in progress)
    if (uniqueDates[0] !== todayISO && uniqueDates[0] !== yesterdayISO) return 0

    let streak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1])
      const curr = new Date(uniqueDates[i])
      const diffDays = Math.round(
        (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (err) {
    console.error('[supabase] getStreak unexpected error:', err)
    return 0
  }
}

// ─── Messages ──────────────────────────────────────────────────────────────

/**
 * Returns the most recent messages for the user, newest first.
 * Defaults to 20 messages; pass a custom limit if needed.
 */
export async function getMessages(userId: string, limit = 20): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('delivered_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[supabase] getMessages error:', error.message)
      return []
    }

    return (data ?? []) as Message[]
  } catch (err) {
    console.error('[supabase] getMessages unexpected error:', err)
    return []
  }
}

/**
 * Marks a single message as read by its ID.
 */
export async function markMessageRead(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId)

    if (error) {
      console.error('[supabase] markMessageRead error:', error.message)
    }
  } catch (err) {
    console.error('[supabase] markMessageRead unexpected error:', err)
  }
}
