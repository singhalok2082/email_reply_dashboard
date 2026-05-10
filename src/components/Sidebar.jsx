import './Sidebar.css'

const STATUS_META = {
  'New':           { icon: '●', cls: 'new' },
  'Hot Lead':      { icon: '🔥', cls: 'hot' },
  'Follow Up':     { icon: '↩', cls: '' },
  'Replied':       { icon: '✓', cls: 'replied' },
  'Not Interested':{ icon: '✕', cls: '' },
}

const STATUS_COLOR = {
  'New':            'var(--new)',
  'Hot Lead':       'var(--hot)',
  'Follow Up':      'var(--followup)',
  'Replied':        'var(--replied)',
  'Not Interested': 'var(--notint)',
}

export default function Sidebar({ open, onToggle, filters, setFilters, campaigns, pocs, metrics, statusOptions, totalReplies }) {
  const setF = (key, val) => setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val }))
  const clearAll = () => setFilters({ campaign:'', status:'', poc:'', search:'' })
  const hasFilter = filters.campaign || filters.status || filters.poc

  const countForStatus = s => {
    if (s==='New')           return metrics.new
    if (s==='Hot Lead')      return metrics.hot
    if (s==='Follow Up')     return metrics.followup
    if (s==='Replied')       return metrics.replied
    if (s==='Not Interested')return metrics.notint
    return 0
  }

  return (
    <aside className={`sidebar ${open?'open':'closed'}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          {open && (
            <div className="brand-text">
              <span className="brand-name">Reply Monitor</span>
              <span className="brand-sub">ConsultAdd GTM</span>
            </div>
          )}
        </div>
        <button className="toggle-btn" onClick={onToggle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
          </svg>
        </button>
      </div>

      {open && <>
        <div className="sidebar-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search replies..."
            value={filters.search}
            onChange={e => setFilters(f=>({...f, search:e.target.value}))}
          />
        </div>

        <div className="sidebar-nav">

          {/* All replies */}
          <div className="nav-section">
            <button
              className={`nav-btn ${!hasFilter ? 'active' : ''}`}
              onClick={clearAll}
            >
              <span className="nav-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <span className="nav-label">All replies</span>
              <span className="nav-count">{totalReplies}</span>
            </button>
          </div>

          <div className="divider"/>

          {/* Status filters */}
          <div className="nav-section">
            <div className="nav-section-label">Status</div>
            {statusOptions.map(s => {
              const meta = STATUS_META[s] || {}
              const cnt  = countForStatus(s)
              return (
                <button
                  key={s}
                  className={`nav-btn ${filters.status===s ? 'active' : ''}`}
                  onClick={() => setF('status', s)}
                >
                  <span className="nav-icon" style={{ color: STATUS_COLOR[s] }}>{meta.icon}</span>
                  <span className="nav-label">{s}</span>
                  {cnt > 0 && <span className={`nav-count ${meta.cls}`}>{cnt}</span>}
                </button>
              )
            })}
          </div>

          {/* Campaigns */}
          {campaigns.length > 0 && <>
            <div className="divider"/>
            <div className="nav-section">
              <div className="nav-section-label">Campaigns ({campaigns.length})</div>
              {campaigns.map(c => (
                <button
                  key={c}
                  className={`nav-btn ${filters.campaign===c ? 'active' : ''}`}
                  onClick={() => setF('campaign', c)}
                  title={c}
                >
                  <span className="nav-campaign-dot"/>
                  <span className="nav-label">{c}</span>
                </button>
              ))}
            </div>
          </>}

          {/* POCs */}
          {pocs.length > 0 && <>
            <div className="divider"/>
            <div className="nav-section">
              <div className="nav-section-label">Handlers ({pocs.length})</div>
              {pocs.map(p => (
                <button
                  key={p}
                  className={`nav-btn ${filters.poc===p ? 'active' : ''}`}
                  onClick={() => setF('poc', p)}
                >
                  <span className="nav-avatar">{p.charAt(0).toUpperCase()}</span>
                  <span className="nav-label">{p}</span>
                </button>
              ))}
            </div>
          </>}

        </div>

        <div className="sidebar-footer">
          <div className="footer-info">ConsultAdd · Reply Monitor</div>
          <div className="footer-count">{totalReplies} total replies</div>
        </div>
      </>}
    </aside>
  )
}
