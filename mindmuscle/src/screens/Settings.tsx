import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CreditCard, LogOut, RotateCcw, ChevronRight, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { openCustomerPortal } from '../lib/stripe'
import { getProfile } from '../lib/motivatorProfiles'
import { requestPushPermission, hasPushPermission } from '../lib/notifications'
import GoldButton from '../components/GoldButton'

const HOURS = Array.from({ length: 19 }, (_, i) => {
  const h = i + 5
  const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`
  return { label, value: `${String(h).padStart(2, '0')}:00` }
})

export default function Settings() {
  const navigate = useNavigate()
  const { user, setUser, logout, refreshUser } = useApp()
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [preferredTime, setPreferredTime] = useState(user?.preferred_time ?? '07:00')
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [savingTime, setSavingTime] = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)
  const [requestingNotif, setRequestingNotif] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false)

  useEffect(() => {
    hasPushPermission().then(setNotifGranted)
  }, [])

  useEffect(() => {
    setFirstName(user?.first_name ?? '')
    setPreferredTime(user?.preferred_time ?? '07:00')
  }, [user])

  const saveName = async () => {
    if (!user || !firstName.trim()) return
    setSavingName(true)
    await supabase.from('profiles').update({ first_name: firstName.trim() }).eq('id', user.id)
    await refreshUser()
    setSavingName(false)
    setEditingName(false)
  }

  const saveTime = async () => {
    if (!user) return
    setSavingTime(true)
    await supabase.from('profiles').update({ preferred_time: preferredTime }).eq('id', user.id)
    await refreshUser()
    setSavingTime(false)
  }

  const requestNotifications = async () => {
    if (!user) return
    setRequestingNotif(true)
    await requestPushPermission(user.id)
    setNotifGranted(await hasPushPermission())
    setRequestingNotif(false)
  }

  const handleManageSubscription = async () => {
    if (!user) return
    if (user.subscription_status === 'free' || user.subscription_status === 'canceled') {
      navigate('/paywall')
      return
    }
    if (!user.stripe_customer_id) { navigate('/paywall'); return }
    setOpeningPortal(true)
    try {
      await openCustomerPortal(user.stripe_customer_id)
    } catch {
      navigate('/paywall')
    } finally {
      setOpeningPortal(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/welcome')
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    await supabase.auth.signOut()
    setUser(null)
    navigate('/welcome')
  }

  const handleRetakeAssessment = () => {
    navigate('/assessment')
  }

  const isPro = user?.subscription_status === 'active' || user?.subscription_status === 'trialing'
  const profile = user?.primary_motivator ? getProfile(user.primary_motivator) : null

  const cardStyle: React.CSSProperties = {
    background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 20, padding: '20px', marginBottom: 12,
  }
  const labelStyle: React.CSSProperties = {
    color: '#8B8B92', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#222226', border: '1px solid #2A2A2E', borderRadius: 12, padding: '12px 14px', color: '#F4F2EE', fontSize: 16, fontFamily: '"Inter",sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #2A2A2E',
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#0A0A0B', paddingBottom: 96 }}>
      <div style={{ padding: '20px 20px 16px', background: 'linear-gradient(180deg,#121214,#0A0A0B)' }}>
        <h1 style={{ fontFamily: '"Anton",sans-serif', fontSize: 32, color: '#F4F2EE', margin: 0 }}>SETTINGS</h1>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── Profile ── */}
        <div style={cardStyle}>
          <div style={{ fontFamily: '"Anton",sans-serif', fontSize: 16, color: '#8B8B92', marginBottom: 16, letterSpacing: '0.06em' }}>PROFILE</div>
          <div style={{ ...rowStyle, borderBottom: 'none', paddingBottom: 12 }}>
            <div>
              <span style={labelStyle}>Name</span>
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, width: 160 }} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveName()} />
                  <button onClick={saveName} disabled={savingName} style={{ background: '#E8A33D', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', color: '#0A0A0B', fontWeight: 700, fontSize: 14 }}>
                    {savingName ? '…' : <Check size={16} />}
                  </button>
                </div>
              ) : (
                <div style={{ color: '#F4F2EE', fontSize: 17, fontWeight: 600 }}>{user?.first_name || '—'}</div>
              )}
            </div>
            {!editingName && (
              <button onClick={() => setEditingName(true)} style={{ background: '#222226', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#8B8B92', fontSize: 13 }}>Edit</button>
            )}
          </div>
          <div style={rowStyle}>
            <div>
              <span style={labelStyle}>Email</span>
              <div style={{ color: '#8B8B92', fontSize: 15 }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: 14 }}>
            <div>
              <span style={labelStyle}>Subscription</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: '"Anton",sans-serif', fontSize: 15, color: isPro ? '#E8A33D' : '#8B8B92', background: isPro ? '#E8A33D22' : '#2A2A2E', padding: '3px 10px', borderRadius: 8, letterSpacing: '0.06em' }}>
                  {isPro ? 'PRO ✦' : 'FREE'}
                </span>
                {user?.subscription_status === 'trialing' && (
                  <span style={{ color: '#8B8B92', fontSize: 12 }}>Trial active</span>
                )}
                {user?.subscription_status === 'past_due' && (
                  <span style={{ color: '#D8412F', fontSize: 12 }}>Payment issue</span>
                )}
              </div>
            </div>
            <button onClick={handleManageSubscription} disabled={openingPortal} style={{ background: isPro ? '#222226' : 'linear-gradient(135deg,#E8A33D,#C8872A)', border: isPro ? '1px solid #2A2A2E' : 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: isPro ? '#F4F2EE' : '#0A0A0B', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CreditCard size={14} />
              {openingPortal ? '…' : isPro ? 'Manage' : 'Go PRO'}
            </button>
          </div>
        </div>

        {/* ── Motivator ── */}
        <div style={cardStyle}>
          <div style={{ fontFamily: '"Anton",sans-serif', fontSize: 16, color: '#8B8B92', marginBottom: 16, letterSpacing: '0.06em' }}>MOTIVATOR</div>
          <div style={rowStyle}>
            <div>
              <span style={labelStyle}>Current Profile</span>
              {profile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: profile.accentColor, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: '#F4F2EE', fontSize: 16, fontFamily: '"Anton",sans-serif' }}>{profile.name}</span>
                </div>
              ) : (
                <span style={{ color: '#8B8B92' }}>Not set</span>
              )}
            </div>
            <button onClick={() => navigate('/motivators')} style={{ background: '#222226', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#8B8B92', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              Change <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: 14 }}>
            <div>
              <span style={labelStyle}>Assessment</span>
              <div style={{ color: '#8B8B92', fontSize: 13 }}>Retake to update your profile</div>
            </div>
            <button onClick={() => setShowRetakeConfirm(true)} style={{ background: '#222226', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: '#8B8B92', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <RotateCcw size={14} /> Retake
            </button>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div style={cardStyle}>
          <div style={{ fontFamily: '"Anton",sans-serif', fontSize: 16, color: '#8B8B92', marginBottom: 16, letterSpacing: '0.06em' }}>NOTIFICATIONS</div>
          <div style={rowStyle}>
            <div>
              <span style={labelStyle}>Permission</span>
              <div style={{ color: notifGranted ? '#E8A33D' : '#8B8B92', fontSize: 14, fontWeight: 600 }}>
                {notifGranted ? '✓ Enabled' : 'Not enabled'}
              </div>
            </div>
            {!notifGranted && (
              <button onClick={requestNotifications} disabled={requestingNotif} style={{ background: 'linear-gradient(135deg,#E8A33D,#C8872A)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#0A0A0B', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Bell size={14} /> {requestingNotif ? 'Enabling…' : 'Enable'}
              </button>
            )}
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none', paddingTop: 14 }}>
            <label style={{ flex: 1 }}>
              <span style={labelStyle}>Daily Motivation Time</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} style={{ ...inputStyle, width: 160 }}>
                  {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                </select>
                <button onClick={saveTime} disabled={savingTime} style={{ background: '#E8A33D', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', color: '#0A0A0B', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {savingTime ? '…' : 'Save'}
                </button>
              </div>
            </label>
          </div>
        </div>

        {/* ── Account ── */}
        <div style={cardStyle}>
          <div style={{ fontFamily: '"Anton",sans-serif', fontSize: 16, color: '#8B8B92', marginBottom: 16, letterSpacing: '0.06em' }}>ACCOUNT</div>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ width: '100%', background: '#222226', border: '1px solid #2A2A2E', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', color: '#F4F2EE', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <LogOut size={18} color="#D8412F" /> Log Out
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '8px 0', cursor: 'pointer', color: '#8B8B92', fontSize: 13, textAlign: 'center' }}>
            Delete Account
          </button>
        </div>

        {/* ── App Info ── */}
        <div style={{ textAlign: 'center', padding: '8px 0 20px', color: '#8B8B92', fontSize: 12 }}>
          <p style={{ margin: '0 0 6px' }}>MindMuscle v1.0</p>
          <p style={{ margin: 0 }}>
            <a href="/privacy" style={{ color: '#8B8B92' }}>Privacy Policy</a>
            {' · '}
            <a href="/terms" style={{ color: '#8B8B92' }}>Terms of Service</a>
          </p>
        </div>
      </div>

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,11,0.85)' }} />
          <div className="animate-fade-up" style={{ position: 'relative', background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 360, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👋</div>
            <h3 style={{ fontFamily: '"Anton",sans-serif', fontSize: 22, color: '#F4F2EE', margin: '0 0 8px' }}>Log Out?</h3>
            <p style={{ color: '#8B8B92', fontSize: 14, marginBottom: 24 }}>Your streak and progress are safely saved.</p>
            <GoldButton onClick={handleLogout} className="mb-3">Log Out</GoldButton>
            <button onClick={() => setShowLogoutConfirm(false)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B8B92', fontSize: 14, padding: '8px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,11,0.85)' }} />
          <div className="animate-fade-up" style={{ position: 'relative', background: '#1A1A1D', border: '1px solid #D8412F44', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 360, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: '"Anton",sans-serif', fontSize: 22, color: '#F4F2EE', margin: '0 0 8px' }}>Delete Account?</h3>
            <p style={{ color: '#8B8B92', fontSize: 14, marginBottom: 24 }}>This will permanently delete your account, goals, and all progress. This cannot be undone.</p>
            <button onClick={handleDeleteAccount} style={{ width: '100%', background: '#D8412F', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
              Yes, Delete Everything
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B8B92', fontSize: 14, padding: '8px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Retake Confirm */}
      {showRetakeConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRetakeConfirm(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,11,0.85)' }} />
          <div className="animate-fade-up" style={{ position: 'relative', background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 360, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
            <h3 style={{ fontFamily: '"Anton",sans-serif', fontSize: 22, color: '#F4F2EE', margin: '0 0 8px' }}>Retake Assessment?</h3>
            <p style={{ color: '#8B8B92', fontSize: 14, marginBottom: 24 }}>Your motivator profile will be updated. Your goals and streaks are not affected.</p>
            <GoldButton onClick={() => { setShowRetakeConfirm(false); handleRetakeAssessment() }} className="mb-3">Retake Assessment</GoldButton>
            <button onClick={() => setShowRetakeConfirm(false)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B8B92', fontSize: 14, padding: '8px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
