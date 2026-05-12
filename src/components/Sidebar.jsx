import { useState, useRef, useEffect } from 'react'
import './Sidebar.css'

const CAMP_COLORS   = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']

export default function Sidebar({ view, setView, filters, setFilters, campaigns, pocs,
  metrics, totalReplies, session, onLogout, isAdmin }) {

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const toggle = (key, val) => setFilters(f => ({ ...f, [key]: f[key]===val ? '' : val }))

  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const navItems = [
    { id:'inbox',     label:'Inbox',     badge: totalReplies },
    { id:'mine',      label:'My Replies',badge: metrics.new || null },
    { id:'dashboard', label:'Team',      badge: null },
    ...(isAdmin ? [{ id:'routing', label:'Campaigns', badge: campaigns.length || null }] : []),
    { id:'analytics', label:'Analytics', badge: null },
  ]

  const name     = session?.name || 'You'
  const role     = session?.is_admin ? '👑 Admin' : (session?.role || 'POC')
  const color    = session?.color || '#C96442'
  const initials = name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-mark">R</div>
        <div className="sb-logo-name">Replyloop</div>
      </div>

      {/* Search */}
      <div className="sb-search">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input placeholder="Search replies…" value={filters.search}
          onChange={e => setFilters(f => ({...f, search:e.target.value}))}/>
      </div>

      {/* Scrollable nav */}
      <div className="sb-nav-scroll">
        {/* Main nav */}
        {navItems.map(n => (
          <button key={n.id}
            className={`sb-nav-item ${view===n.id?'active':''}`}
            onClick={() => setView(n.id)}>
            <div className="sb-nav-item-left">
              <NavIcon id={n.id} active={view===n.id}/>
              <span>{n.label}</span>
            </div>
            {n.badge != null && <span className="sb-nav-badge">{n.badge}</span>}
          </button>
        ))}

        {/* Campaigns */}
        {campaigns.length > 0 && <>
          <div className="sb-section">Campaigns</div>
          {campaigns.map((c,i) => (
            <button key={c}
              className={`sb-camp-item ${filters.campaign===c?'active':''}`}
              onClick={() => toggle('campaign',c)} title={c}>
              <div className="sb-dot" style={{background:CAMP_COLORS[i%CAMP_COLORS.length]}}/>
              <span className="sb-camp-label">{c}</span>
            </button>
          ))}
        </>}

        {/* Handlers — admin only */}
        {isAdmin && pocs.length > 0 && <>
          <div className="sb-section">Handlers</div>
          {pocs.map((p,i) => (
            <button key={p}
              className={`sb-camp-item ${filters.poc===p?'active':''}`}
              onClick={() => toggle('poc',p)}>
              <div style={{
                width:16, height:16, borderRadius:'50%',
                background:AVATAR_COLORS[i%AVATAR_COLORS.length],
                color:'#fff', fontSize:9, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
              }}>{p[0].toUpperCase()}</div>
              <span className="sb-camp-label">{p}</span>
            </button>
          ))}
        </>}
      </div>

      {/* Profile — fixed bottom */}
      <div className="sb-profile-wrap" ref={menuRef}>
        {menuOpen && (
          <div className="sb-profile-menu">
            <div className="spm-info">
              <div className="spm-name">{name}</div>
              <div className="spm-role">{role}</div>
              {session?.email && <div className="spm-email">{session.email}</div>}
              {session?.company && <div className="spm-email">{session.company}</div>}
            </div>
            <div className="spm-divider"/>
            {isAdmin && (
              <button className="spm-item" onClick={() => { setView('routing'); setMenuOpen(false) }}>
                ⚙️  Settings
              </button>
            )}
            <button className="spm-item logout" onClick={() => { setMenuOpen(false); onLogout() }}>
              ← Log out
            </button>
          </div>
        )}

        <button className="sb-profile-btn" onClick={() => setMenuOpen(o=>!o)}>
          <div className="sb-pf-av" style={{background: color}}>{initials}</div>
          <div className="sb-pf-info">
            <div className="sb-pf-name">{name}</div>
            <div className="sb-pf-role">{role}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}

function NavIcon({ id, active }) {
  const c = active ? 'var(--accent)' : 'var(--ink3)'
  const icons = {
    inbox:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/><path d="m22 6-10 7L2 6"/></svg>,
    mine:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    dashboard: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    routing:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
    analytics: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  }
  return icons[id] || null
}
