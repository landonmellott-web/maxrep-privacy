// ─── Motivator Archetypes ──────────────────────────────────────────────────

export type MotivatorProfile = 'enforcer' | 'igniter' | 'visionary'

// ─── Goal Categories ───────────────────────────────────────────────────────

export type GoalCategory =
  | 'Fitness'
  | 'Career'
  | 'Discipline'
  | 'Mindset'
  | 'Business'
  | 'Recovery'
  | 'Other'

// ─── Subscription Status ───────────────────────────────────────────────────

export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

// ─── Motivator Blend ───────────────────────────────────────────────────────

export interface MotivatorBlend {
  enforcer: number
  igniter: number
  visionary: number
}

// ─── Schedule ──────────────────────────────────────────────────────────────

export interface MotivatorSchedule {
  /** e.g. ['monday', 'wednesday', 'friday'] or ['daily'] */
  days: string[]
  /** 24-hour time string, e.g. '07:00' */
  time: string
}

// ─── Motivator Setting ─────────────────────────────────────────────────────

export interface MotivatorSetting {
  id: string
  user_id: string
  name: string
  profile_type: MotivatorProfile
  /** Percentage blend (values should sum to 100) */
  blend: MotivatorBlend
  /** 1 (gentle) – 5 (extreme) */
  intensity: 1 | 2 | 3 | 4 | 5
  goal_id: string | null
  schedule: MotivatorSchedule
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// ─── Assessment Result ─────────────────────────────────────────────────────

export interface AssessmentResult {
  scores: MotivatorBlend
  primary: MotivatorProfile
  secondary: MotivatorProfile | null
}

// ─── User Profile ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  first_name: string
  email: string
  primary_motivator: MotivatorProfile | null
  motivation_scores: MotivatorBlend | null
  goal_text: string | null
  goal_category: GoalCategory | null
  /** Preferred notification time in 24-hour format, e.g. '07:00' */
  preferred_time: string | null
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  created_at?: string
  updated_at?: string
}

// ─── Goal ──────────────────────────────────────────────────────────────────

export interface Goal {
  id: string
  user_id: string
  title: string
  category: GoalCategory
  /** The user's "why" — their deeper purpose for this goal */
  why: string
  target_date: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// ─── Habit ─────────────────────────────────────────────────────────────────

export interface Habit {
  id: string
  goal_id: string
  title: string
  /** 'daily' or an array of weekday names, e.g. ['monday', 'wednesday'] */
  frequency: 'daily' | string[]
  created_at?: string
  updated_at?: string
}

// ─── Habit Log ─────────────────────────────────────────────────────────────

export interface HabitLog {
  id: string
  habit_id: string
  /** ISO date string, e.g. '2025-05-25' */
  date: string
  completed: boolean
  created_at?: string
}

// ─── Message ───────────────────────────────────────────────────────────────

export interface Message {
  id: string
  user_id: string
  content: string
  /** Which motivator archetype generated this message */
  motivator_ref: MotivatorProfile
  delivered_at: string
  read: boolean
  created_at?: string
}

// ─── Composite / UI Types ──────────────────────────────────────────────────

/** Habit enriched with today's completion state and its parent goal */
export interface HabitWithStatus extends Habit {
  completed: boolean
  goal: Goal
}

/** Scores keyed by profile type for display / calculation convenience */
export type ProfileScores = MotivatorBlend
