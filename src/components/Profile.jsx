import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './Profile.css'

const AVATAR_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C','#C49250','#4A7FC1']

const DEFAULT_PROFILE = {
  name:     'Alok Singh',
  role:     'Manager',
  email:    'alok.s@consultadd.org',
  company:  'ConsultAdd',
  phone:    '',
  color:    '#C96442',
}

export default function Profile() {
  const [profile, setProfile]   = useState(DEFAULT_PROFILE)
  const [open,    setOpen]      = useState(false)
  const [draft,   setDraft]     = useState(DEFAULT_PROFILE)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const panelRef = useRef(null)

  // Load from Supabase on mount
  useEffect(() => {
    loadProfile()
  }, [])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', 1)
        .single()
      if (data) {
        setProfile(data)
        setDraft(data)
      }
    } catch (_) {
      // Table doesn't exist yet — use defaults
    }
  }

  const openEdit = () => { setDraft({ ...profile }); setOpen(true); setSaved(false) }

  const save = async () => {
    setSaving(true)
    try {
      await supabase.from('user_profile').upsert({ id:1, ...draft })
      setProfile({ ...draft })
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
    } catch (_) {
      // If table missing, just save locally
      setProfile({ ...draft })
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1200)
    }
    setSaving(false)
  }

  const initials = profile.name
    ? profile.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
    : 'A'

  return (
    <div className="profile-wrap" ref={panelRef}>
      {/* Footer trigger */}
      <button className="profile-footer" onClick={openEdit}>
        <div className="pf-av" style={{ background: profile.color }}>
          {initials}
        </div>
        <div className="pf-info">
          <div className="pf-name">{profile.name}</div>
          <div className="pf-role">{profile.role}{profile.company ? ` · ${profile.company}` : ''}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      {/* Edit panel — slides up above footer */}
      {open && (
        <div className="profile-panel">
          <div className="pp-header">
            <div className="pp-title">Your profile</div>
            <button className="pp-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Avatar color picker */}
          <div className="pp-avatar-row">
            <div className="pp-av-preview" style={{ background: draft.color }}>
              {draft.name ? draft.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() : 'A'}
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--ink3)', marginBottom:6 }}>Avatar color</div>
              <div className="pp-colors">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c}
                    className={`pp-color-swatch ${draft.color===c?'active':''}`}
                    style={{ background:c }}
                    onClick={() => setDraft(d => ({...d, color:c}))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="pp-fields">
            <div className="pp-field">
              <label className="pp-label">Full name</label>
              <input className="pp-input" value={draft.name}
                onChange={e => setDraft(d => ({...d, name:e.target.value}))}
                placeholder="Your full name"/>
            </div>
            <div className="pp-field">
              <label className="pp-label">Role / Title</label>
              <input className="pp-input" value={draft.role}
                onChange={e => setDraft(d => ({...d, role:e.target.value}))}
                placeholder="e.g. GTM Manager"/>
            </div>
            <div className="pp-field">
              <label className="pp-label">Company</label>
              <input className="pp-input" value={draft.company||''}
                onChange={e => setDraft(d => ({...d, company:e.target.value}))}
                placeholder="e.g. ConsultAdd"/>
            </div>
            <div className="pp-field">
              <label className="pp-label">Email</label>
              <input className="pp-input" value={draft.email||''}
                onChange={e => setDraft(d => ({...d, email:e.target.value}))}
                placeholder="you@company.com" type="email"/>
            </div>
            <div className="pp-field">
              <label className="pp-label">Phone</label>
              <input className="pp-input" value={draft.phone||''}
                onChange={e => setDraft(d => ({...d, phone:e.target.value}))}
                placeholder="+1 (555) 000-0000"/>
            </div>
          </div>

          <button
            className={`pp-save ${saved?'saved':''}`}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save profile'}
          </button>
        </div>
      )}
    </div>
  )
}
