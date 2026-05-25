import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { UserProfile, AssessmentResult } from '../lib/types'
import { supabase } from '../lib/supabase'

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  user: UserProfile | null
  isLoading: boolean
  assessmentResult: AssessmentResult | null
  pendingAssessment: AssessmentResult | null
  setUser: (user: UserProfile | null) => void
  setAssessmentResult: (result: AssessmentResult | null) => void
  setPendingAssessment: (result: AssessmentResult | null) => void
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

// ─── Default Context Value ────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue>({
  user: null,
  isLoading: true,
  assessmentResult: null,
  pendingAssessment: null,
  setUser: () => {},
  setAssessmentResult: () => {},
  setPendingAssessment: () => {},
  refreshUser: async () => {},
  logout: async () => {},
})

// ─── Storage Key ──────────────────────────────────────────────────────────────

const PENDING_ASSESSMENT_KEY = 'mm_pending_assessment'

// ─── Helper: Fetch Profile ────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[AppContext] fetchProfile error:', error.message)
    return null
  }

  return data as UserProfile
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [assessmentResult, setAssessmentResult] =
    useState<AssessmentResult | null>(null)

  // Hydrate pendingAssessment from localStorage on mount
  const [pendingAssessment, setPendingAssessmentState] =
    useState<AssessmentResult | null>(() => {
      try {
        const stored = localStorage.getItem(PENDING_ASSESSMENT_KEY)
        return stored ? (JSON.parse(stored) as AssessmentResult) : null
      } catch {
        return null
      }
    })

  // Keep localStorage in sync whenever pendingAssessment changes
  const setPendingAssessment = useCallback(
    (result: AssessmentResult | null) => {
      setPendingAssessmentState(result)
      if (result === null) {
        localStorage.removeItem(PENDING_ASSESSMENT_KEY)
      } else {
        try {
          localStorage.setItem(PENDING_ASSESSMENT_KEY, JSON.stringify(result))
        } catch {
          // Storage quota exceeded — silently ignore
        }
      }
    },
    []
  )

  // Fetch and set profile for the given userId
  const refreshUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      setUser(null)
      return
    }

    const profile = await fetchProfile(session.user.id)
    setUser(profile)
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAssessmentResult(null)
  }, [])

  // Bootstrap: check existing session on mount, then subscribe to auth changes
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user && mounted) {
        const profile = await fetchProfile(session.user.id)
        if (mounted) setUser(profile)
      }

      if (mounted) setIsLoading(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        if (mounted) setUser(profile)
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Optionally re-fetch profile on token refresh
        const profile = await fetchProfile(session.user.id)
        if (mounted) setUser(profile)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AppContextValue = {
    user,
    isLoading,
    assessmentResult,
    pendingAssessment,
    setUser,
    setAssessmentResult,
    setPendingAssessment,
    refreshUser,
    logout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return ctx
}
