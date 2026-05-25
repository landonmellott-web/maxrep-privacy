import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import GoldButton from '../components/GoldButton'
import type { GoalCategory } from '../lib/types'

// ─── Constants ─────────────────────────────────────────────────────────────────

const GOAL_CATEGORIES: GoalCategory[] = [
  'Fitness',
  'Career',
  'Discipline',
  'Mindset',
  'Business',
  'Recovery',
  'Other',
]

type AuthTab = 'signup' | 'login'
type LoginMode = 'password' | 'magic'

// ─── Input field component ──────────────────────────────────────────────────────

interface InputFieldProps {
  id: string
  type: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
  onTrailingIconClick?: () => void
  error?: string
  disabled?: boolean
}

function InputField({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  trailingIcon,
  onTrailingIconClick,
  error,
  disabled = false,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        style={{
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(139,139,146,1)',
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(139,139,146,0.8)' }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="w-full rounded-xl py-3 transition-all duration-150"
          style={{
            paddingLeft: icon ? '2.75rem' : '1rem',
            paddingRight: trailingIcon ? '3rem' : '1rem',
            background: '#1A1A1D',
            border: error ? '1px solid rgba(216,65,47,0.7)' : '1px solid #2A2A2E',
            color: '#F4F2EE',
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.9375rem',
            outline: 'none',
            caretColor: '#E8A33D',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.border = '1px solid rgba(232,163,61,0.7)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,163,61,0.12)'
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.border = '1px solid #2A2A2E'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        />
        {trailingIcon && (
          <button
            type="button"
            tabIndex={-1}
            onClick={onTrailingIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{
              color: 'rgba(139,139,146,0.8)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
          >
            {trailingIcon}
          </button>
        )}
      </div>
      {error && (
        <p
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.8125rem',
            color: '#D8412F',
            marginTop: '2px',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Sign Up Form ───────────────────────────────────────────────────────────────

interface SignUpFormProps {
  pendingResult: ReturnType<typeof useApp>['pendingAssessment']
  onSuccess: () => void
}

function SignUpForm({ pendingResult, onSuccess }: SignUpFormProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [goalText, setGoalText] = useState('')
  const [goalCategory, setGoalCategory] = useState<GoalCategory | null>(null)
  const [preferredTime, setPreferredTime] = useState('07:00')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'First name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setLoading(true)
    setGlobalError('')

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
        },
      },
    })

    if (error) {
      setGlobalError(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setGlobalError('Account created — please check your email to confirm.')
      setLoading(false)
      return
    }

    // Upsert the profile row with assessment data + user preferences
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName.trim(),
      email: email.trim(),
      primary_motivator: pendingResult?.primary ?? null,
      motivation_scores: pendingResult?.scores ?? null,
      goal_text: goalText.trim() || null,
      goal_category: goalCategory,
      preferred_time: preferredTime || '07:00',
      subscription_status: 'free',
      stripe_customer_id: null,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error('[Auth] profile upsert error:', profileError.message)
    }

    // Clear pending assessment from localStorage
    localStorage.removeItem('mm_pending_assessment')

    setLoading(false)
    onSuccess()
  }, [
    firstName,
    email,
    password,
    goalText,
    goalCategory,
    preferredTime,
    pendingResult,
    onSuccess,
  ])

  return (
    <div className="flex flex-col gap-4">
      <InputField
        id="signup-first-name"
        type="text"
        label="First Name"
        value={firstName}
        onChange={setFirstName}
        placeholder="Your first name"
        autoComplete="given-name"
        icon={<User size={16} />}
        error={errors.firstName}
        disabled={loading}
      />

      <InputField
        id="signup-email"
        type="email"
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail size={16} />}
        error={errors.email}
        disabled={loading}
      />

      <InputField
        id="signup-password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="8+ characters"
        autoComplete="new-password"
        icon={<Lock size={16} />}
        trailingIcon={
          showPassword ? <EyeOff size={16} /> : <Eye size={16} />
        }
        onTrailingIconClick={() => setShowPassword((s) => !s)}
        error={errors.password}
        disabled={loading}
      />

      <InputField
        id="signup-goal"
        type="text"
        label="Your #1 Goal"
        value={goalText}
        onChange={setGoalText}
        placeholder="What's your #1 goal right now?"
        autoComplete="off"
        icon={<Target size={16} />}
        disabled={loading}
      />

      {/* Goal category chips */}
      <div className="flex flex-col gap-2">
        <span
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(139,139,146,1)',
            fontWeight: 500,
          }}
        >
          Goal Category
        </span>
        <div className="flex flex-wrap gap-2">
          {GOAL_CATEGORIES.map((cat) => {
            const isSelected = goalCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setGoalCategory(isSelected ? null : cat)}
                disabled={loading}
                className="rounded-full transition-all duration-150 active:scale-95"
                style={{
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  paddingLeft: '0.875rem',
                  paddingRight: '0.875rem',
                  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected
                    ? 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)'
                    : 'rgba(26,26,29,1)',
                  border: isSelected
                    ? '1px solid transparent'
                    : '1px solid rgba(42,42,46,0.9)',
                  color: isSelected ? '#0A0A0B' : 'rgba(244,242,238,0.8)',
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: isSelected
                    ? '0 0 12px rgba(232,163,61,0.25)'
                    : 'none',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Preferred time */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="signup-time"
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(139,139,146,1)',
            fontWeight: 500,
          }}
        >
          Daily Check-in Time
        </label>
        <input
          id="signup-time"
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          disabled={loading}
          className="w-full rounded-xl py-3 px-4"
          style={{
            background: '#1A1A1D',
            border: '1px solid #2A2A2E',
            color: '#F4F2EE',
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.9375rem',
            outline: 'none',
            colorScheme: 'dark',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid rgba(232,163,61,0.7)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,163,61,0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid #2A2A2E'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {globalError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: 'rgba(216,65,47,0.1)',
            border: '1px solid rgba(216,65,47,0.35)',
            color: '#E85540',
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          {globalError}
        </div>
      )}

      <GoldButton
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
        className="mt-2 text-sm font-bold uppercase tracking-widest"
      >
        Create Account
      </GoldButton>
    </div>
  )
}

// ─── Log In Form ────────────────────────────────────────────────────────────────

interface LogInFormProps {
  onSuccess: () => void
}

function LogInForm({ onSuccess }: LogInFormProps) {
  const [loginMode, setLoginMode] = useState<LoginMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  const validatePassword = (): boolean => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateMagic = (): boolean => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePasswordLogin = useCallback(async () => {
    if (!validatePassword()) return
    setLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (error) {
      setGlobalError(error.message)
      return
    }

    localStorage.removeItem('mm_pending_assessment')
    onSuccess()
  }, [email, password, onSuccess])

  const handleMagicLink = useCallback(async () => {
    if (!validateMagic()) return
    setLoading(true)
    setGlobalError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    })

    setLoading(false)

    if (error) {
      setGlobalError(error.message)
      return
    }

    setMagicSent(true)
  }, [email])

  if (magicSent) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-6 animate-fade-up"
        role="status"
        aria-live="polite"
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '56px',
            height: '56px',
            background: 'rgba(232,163,61,0.12)',
            border: '1px solid rgba(232,163,61,0.35)',
          }}
        >
          <Mail size={24} style={{ color: '#E8A33D' }} />
        </div>
        <div>
          <p
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: '1.25rem',
              color: '#F4F2EE',
              letterSpacing: '0.04em',
              marginBottom: '0.5rem',
            }}
          >
            CHECK YOUR EMAIL
          </p>
          <p
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.9rem',
              color: 'rgba(139,139,146,1)',
              lineHeight: 1.6,
            }}
          >
            We sent a magic link to{' '}
            <span style={{ color: '#E8A33D' }}>{email}</span>.
            <br />
            Click it to sign in instantly.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setMagicSent(false); setGlobalError('') }}
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.875rem',
            color: 'rgba(139,139,146,1)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            textDecoration: 'underline',
          }}
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div
        className="flex rounded-xl overflow-hidden"
        style={{ border: '1px solid #2A2A2E', background: '#1A1A1D' }}
        role="group"
        aria-label="Login method"
      >
        {(['password', 'magic'] as LoginMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => { setLoginMode(mode); setErrors({}); setGlobalError('') }}
            className="flex-1 py-2.5 transition-all duration-150"
            style={{
              fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: loginMode === mode ? 600 : 400,
              color: loginMode === mode ? '#0A0A0B' : 'rgba(139,139,146,1)',
              background:
                loginMode === mode
                  ? 'linear-gradient(135deg, #E8A33D 0%, #C8872A 100%)'
                  : 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: mode === 'password' ? '11px 0 0 11px' : '0 11px 11px 0',
              letterSpacing: '0.02em',
            }}
          >
            {mode === 'password' ? 'Password' : 'Magic Link'}
          </button>
        ))}
      </div>

      <InputField
        id="login-email"
        type="email"
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        icon={<Mail size={16} />}
        error={errors.email}
        disabled={loading}
      />

      {loginMode === 'password' && (
        <InputField
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
          autoComplete="current-password"
          icon={<Lock size={16} />}
          trailingIcon={
            showPassword ? <EyeOff size={16} /> : <Eye size={16} />
          }
          onTrailingIconClick={() => setShowPassword((s) => !s)}
          error={errors.password}
          disabled={loading}
        />
      )}

      {globalError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: 'rgba(216,65,47,0.1)',
            border: '1px solid rgba(216,65,47,0.35)',
            color: '#E85540',
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          {globalError}
        </div>
      )}

      <GoldButton
        onClick={loginMode === 'password' ? handlePasswordLogin : handleMagicLink}
        loading={loading}
        disabled={loading}
        className="mt-2 text-sm font-bold uppercase tracking-widest"
      >
        {loginMode === 'password' ? 'Sign In' : 'Send Magic Link'}
      </GoldButton>
    </div>
  )
}

// ─── Auth Screen ────────────────────────────────────────────────────────────────

export default function Auth() {
  const navigate = useNavigate()
  const { pendingAssessment, setPendingAssessment } = useApp()
  const [activeTab, setActiveTab] = useState<AuthTab>('signup')

  const handleSuccess = useCallback(() => {
    setPendingAssessment(null)
    navigate('/home', { replace: true })
  }, [navigate, setPendingAssessment])

  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(232,163,61,0.05) 0%, rgba(10,10,11,1) 60%), linear-gradient(180deg, #121214 0%, #0A0A0B 100%)',
      }}
    >
      {/* ── Scrollable content area ── */}
      <div
        className="flex flex-col items-center w-full"
        style={{ paddingTop: '3.5rem', paddingBottom: '3rem', overflowY: 'auto' }}
      >
        <div className="w-full" style={{ maxWidth: '420px', padding: '0 1.25rem' }}>
          {/* ── Wordmark ── */}
          <div className="flex flex-col items-center mb-8 animate-fade-up">
            {/* Gold M monogram */}
            <div
              className="flex items-center justify-center rounded-2xl mb-4"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(232,163,61,0.18) 0%, rgba(200,135,42,0.1) 100%)',
                border: '1px solid rgba(232,163,61,0.3)',
                boxShadow: '0 0 24px rgba(232,163,61,0.12)',
              }}
            >
              <span
                style={{
                  fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '1.875rem',
                  color: '#E8A33D',
                  lineHeight: 1,
                  textShadow: '0 0 16px rgba(232,163,61,0.5)',
                }}
              >
                M
              </span>
            </div>

            <h1
              className="uppercase tracking-widest"
              style={{
                fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
                fontSize: '1.5rem',
                color: '#E8A33D',
                letterSpacing: '0.2em',
                lineHeight: 1,
                marginBottom: '0.375rem',
              }}
            >
              MindMuscle
            </h1>
            <p
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: '0.8125rem',
                color: 'rgba(139,139,146,1)',
                letterSpacing: '0.04em',
              }}
            >
              {activeTab === 'signup'
                ? 'Create your free account'
                : 'Welcome back'}
            </p>
          </div>

          {/* ── Tab switcher ── */}
          <div
            className="flex mb-6 animate-fade-up delay-100"
            style={{ borderBottom: '1px solid rgba(42,42,46,0.8)' }}
            role="tablist"
            aria-label="Authentication options"
          >
            {(['signup', 'login'] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 pb-3 transition-all duration-200"
                style={{
                  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '0.9375rem',
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? '#E8A33D' : 'rgba(139,139,146,0.8)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab
                    ? '2px solid #E8A33D'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  letterSpacing: '0.02em',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'signup' ? 'Sign Up' : 'Log In'}
              </button>
            ))}
          </div>

          {/* ── Forms ── */}
          <div className="animate-fade-up delay-200">
            {activeTab === 'signup' ? (
              <SignUpForm
                pendingResult={pendingAssessment}
                onSuccess={handleSuccess}
              />
            ) : (
              <LogInForm onSuccess={handleSuccess} />
            )}
          </div>

          {/* ── Cross-tab link ── */}
          <div className="mt-6 text-center animate-fade-up delay-300">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'signup' ? 'login' : 'signup')}
              style={{
                fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                fontSize: '0.875rem',
                color: 'rgba(139,139,146,1)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              {activeTab === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <span style={{ color: '#E8A33D', textDecoration: 'underline' }}>
                    Sign in
                  </span>
                </>
              ) : (
                <>
                  New here?{' '}
                  <span style={{ color: '#E8A33D', textDecoration: 'underline' }}>
                    Create an account
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ── Back to profile reveal (if has assessment) ── */}
          {pendingAssessment && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => navigate('/reveal')}
                style={{
                  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '0.8125rem',
                  color: 'rgba(139,139,146,0.6)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                ← Back to my profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
