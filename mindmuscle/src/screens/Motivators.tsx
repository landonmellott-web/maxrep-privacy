import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/motivatorProfiles'
import GoldButton from '../components/GoldButton'
import type { MotivatorSetting, MotivatorProfile } from '../lib/types'

const PROFILE_IDS: MotivatorProfile[] = ['enforcer', 'igniter', 'visionary']

const HOURS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 5
  const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
  const value = `${String(h).padStart(2, '0')}:00`
  return { label, value }
})

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_VALUES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ backgroundColor: '#222226' }}
    />
  )
}

interface MotivatorFormState {
  name: string
  profile_type: MotivatorProfile
  intensity: 1 | 2 | 3 | 4 | 5
  time: string
  days: string[]
}

const DEFAULT_FORM: MotivatorFormState = {
  name: '',
  profile_type: 'enforcer',
  intensity: 3,
  time: '07:00',
  days: ['daily'],
}

export default function Motivators() {
  const { user } = useApp()
  const [motivators, setMotivators] = useState<MotivatorSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MotivatorFormState>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMotivators = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('motivators')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    setMotivators((data ?? []) as MotivatorSetting[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchMotivators() }, [fetchMotivators])

  const openCreate = (profileType?: MotivatorProfile) => {
    if (user?.subscription_status === 'free' && motivators.length >= 1) {
      window.location.href = '/paywall'
      return
    }
    setEditingId(null)
    setForm({ ...DEFAULT_FORM, profile_type: profileType ?? 'enforcer' })
    setShowSheet(true)
  }

  const openEdit = (m: MotivatorSetting) => {
    setEditingId(m.id)
    setForm({
      name: m.name,
      profile_type: m.profile_type,
      intensity: m.intensity,
      time: m.schedule?.time ?? '07:00',
      days: m.schedule?.days ?? ['daily'],
    })
    setShowSheet(true)
  }

  const closeSheet = () => {
    setShowSheet(false)
    setEditingId(null)
    setError(null)
  }

  const toggleDay = (day: string) => {
    setForm((f) => {
      if (day === 'daily') return { ...f, days: ['daily'] }
      const withoutDaily = f.days.filter((d) => d !== 'daily')
      const has = withoutDaily.includes(day)
      const next = has ? withoutDaily.filter((d) => d !== day) : [...withoutDaily, day]
      return { ...f, days: next.length === 0 ? ['daily'] : next }
    })
  }

  const save = async () => {
    if (!user) return
    if (!form.name.trim()) { setError('Please enter a name.'); return }
    setSaving(true)
    setError(null)

    const schedule = { days: form.days, time: form.time }
    const blend = { enforcer: 34, igniter: 33, visionary: 33 }

    if (editingId) {
      const { error: err } = await supabase
        .from('motivators')
        .update({ name: form.name, profile_type: form.profile_type, intensity: form.intensity, schedule, blend, updated_at: new Date().toISOString() })
        .eq('id', editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('motivators').insert({
        user_id: user.id,
        name: form.name,
        profile_type: form.profile_type,
        intensity: form.intensity,
        schedule,
        blend,
        is_active: motivators.length === 0,
      })
      if (err) { setError(err.message); setSaving(false); return }
    }

    await fetchMotivators()
    setSaving(false)
    closeSheet()
  }

  const setActive = async (id: string) => {
    if (!user) return
    await supabase.from('motivators').update({ is_active: false }).eq('user_id', user.id)
    await supabase.from('motivators').update({ is_active: true }).eq('id', id)
    setMotivators((prev) => prev.map((m) => ({ ...m, is_active: m.id === id })))
  }

  const deleteMotivator = async (id: string) => {
    if (!confirm('Delete this motivator?')) return
    await supabase.from('motivators').delete().eq('id', id)
    setMotivators((prev) => prev.filter((m) => m.id !== id))
  }

  const isAllDays = form.days.includes('daily') || form.days.length === 7

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#0A0A0B', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: 'linear-gradient(180deg, #121214 0%, #0A0A0B 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontFamily: '"Anton", sans-serif', fontSize: 32, color: '#F4F2EE', margin: 0 }}>
            MY MOTIVATORS
          </h1>
          <button
            onClick={() => openCreate()}
            style={{ background: 'linear-gradient(135deg, #E8A33D, #C8872A)', border: 'none', borderRadius: 12, padding: '8px 16px', color: '#0A0A0B', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <p style={{ color: '#8B8B92', fontSize: 14, margin: 0 }}>
          {user?.subscription_status === 'free' ? 'Free plan · 1 motivator' : 'PRO · Unlimited motivators'}
        </p>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : motivators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#8B8B92', fontSize: 16, marginBottom: 20 }}>
              No motivators yet. Create one to get started.
            </p>
            <GoldButton onClick={() => openCreate()} className="max-w-xs mx-auto">
              Create Your First Motivator
            </GoldButton>
          </div>
        ) : (
          motivators.map((m) => {
            const profile = getProfile(m.profile_type)
            const scheduleText = m.schedule?.days?.includes('daily')
              ? `Daily · ${m.schedule?.time ?? '07:00'}`
              : `${(m.schedule?.days ?? []).map((d) => d.slice(0, 3)).join(', ')} · ${m.schedule?.time ?? '07:00'}`
            return (
              <div
                key={m.id}
                onClick={() => setActive(m.id)}
                style={{ background: '#1A1A1D', border: `1px solid ${m.is_active ? profile.accentColor : '#2A2A2E'}`, borderLeftWidth: 4, borderLeftColor: profile.accentColor, borderRadius: 16, padding: '16px 16px 16px 18px', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: profile.accentColor, background: `${profile.accentColor}22`, padding: '2px 8px', borderRadius: 6 }}>
                        {profile.name}
                      </span>
                      {m.is_active && (
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#E8A33D', background: '#E8A33D22', padding: '2px 8px', borderRadius: 6 }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#F4F2EE', fontSize: 17, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </div>
                    <div style={{ color: '#8B8B92', fontSize: 13 }}>
                      {scheduleText} · Intensity {m.intensity}/5
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 12, flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(m) }}
                      style={{ background: '#222226', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#8B8B92' }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMotivator(m.id) }}
                      style={{ background: '#222226', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#D8412F' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Profile Explorer */}
      <div style={{ padding: '8px 20px 0' }}>
        <p style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Explore Profiles
        </p>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {PROFILE_IDS.map((id) => {
            const p = getProfile(id)
            return (
              <button
                key={id}
                onClick={() => openCreate(id)}
                style={{ flex: '0 0 200px', background: '#1A1A1D', border: `1px solid #2A2A2E`, borderLeftWidth: 4, borderLeftColor: p.accentColor, borderRadius: 14, padding: '14px 14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 16, color: '#F4F2EE', marginBottom: 6 }}>
                  {p.name}
                </div>
                <div style={{ color: '#8B8B92', fontSize: 12, lineHeight: 1.4 }}>
                  {p.tagline}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Sheet */}
      {showSheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet() }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,11,0.7)' }} />
          <div
            className="animate-fade-up"
            style={{ position: 'relative', background: '#1A1A1D', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '85dvh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: 24, color: '#F4F2EE', margin: 0 }}>
                {editingId ? 'EDIT MOTIVATOR' : 'NEW MOTIVATOR'}
              </h2>
              <button onClick={closeSheet} style={{ background: '#222226', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#8B8B92' }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#D8412F22', border: '1px solid #D8412F44', borderRadius: 10, padding: '10px 14px', color: '#E85540', marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Name */}
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Morning Beast Mode"
                style={{ width: '100%', background: '#222226', border: '1px solid #2A2A2E', borderRadius: 12, padding: '12px 14px', color: '#F4F2EE', fontSize: 16, fontFamily: '"Inter", sans-serif', outline: 'none', boxSizing: 'border-box' }}
              />
            </label>

            {/* Profile type */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Profile</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PROFILE_IDS.map((id) => {
                  const p = getProfile(id)
                  const selected = form.profile_type === id
                  return (
                    <button
                      key={id}
                      onClick={() => setForm((f) => ({ ...f, profile_type: id }))}
                      style={{ background: selected ? `${p.accentColor}18` : '#222226', border: `1px solid ${selected ? p.accentColor : '#2A2A2E'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div>
                        <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 15, color: '#F4F2EE' }}>{p.name}</div>
                        <div style={{ color: '#8B8B92', fontSize: 12, marginTop: 2 }}>{p.tagline.slice(0, 48)}…</div>
                      </div>
                      {selected && <Check size={16} color={p.accentColor} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Intensity */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Intensity — {['Gentle', 'Moderate', 'Balanced', 'Intense', 'Extreme'][form.intensity - 1]}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm((f) => ({ ...f, intensity: n }))}
                    style={{ flex: 1, height: 44, borderRadius: 10, border: `1px solid ${form.intensity >= n ? '#E8A33D' : '#2A2A2E'}`, background: form.intensity >= n ? '#E8A33D22' : '#222226', cursor: 'pointer', fontFamily: '"Anton", sans-serif', fontSize: 18, color: form.intensity >= n ? '#E8A33D' : '#8B8B92' }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Days</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setForm((f) => ({ ...f, days: ['daily'] }))}
                  style={{ padding: '8px 14px', borderRadius: 20, border: `1px solid ${isAllDays ? '#E8A33D' : '#2A2A2E'}`, background: isAllDays ? '#E8A33D22' : '#222226', color: isAllDays ? '#E8A33D' : '#8B8B92', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Every Day
                </button>
                {DAYS.map((d, i) => {
                  const val = DAY_VALUES[i]
                  const sel = form.days.includes(val)
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(val)}
                      style={{ padding: '8px 12px', borderRadius: 20, border: `1px solid ${sel && !isAllDays ? '#E8A33D' : '#2A2A2E'}`, background: sel && !isAllDays ? '#E8A33D22' : '#222226', color: sel && !isAllDays ? '#E8A33D' : '#8B8B92', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time */}
            <label style={{ display: 'block', marginBottom: 24 }}>
              <span style={{ color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Delivery Time</span>
              <select
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                style={{ width: '100%', background: '#222226', border: '1px solid #2A2A2E', borderRadius: 12, padding: '12px 14px', color: '#F4F2EE', fontSize: 16, fontFamily: '"Inter", sans-serif', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
              >
                {HOURS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </label>

            <GoldButton onClick={save} loading={saving}>
              {editingId ? 'Save Changes' : 'Create Motivator'}
            </GoldButton>
          </div>
        </div>
      )}
    </div>
  )
}
