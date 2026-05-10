import './Sidebar.css'

const STATUS_COLORS = {
  'New': 'var(--new)',
  'Hot Lead': 'var(--hot)',
  'Follow Up': 'var(--followup)',
  'Replied': 'var(--replied)',
  'Not Interested': 'var(--notint)',
}

const STATUS_ICONS = {
  'New': '●',
  'Hot Lead': '🔥',
  'Follow Up': '↩',
  'Replied': '✓',
  'Not Interested': '✕',
}

export default function Sidebar({ open, onToggle, filters, setFilters, campaigns, pocs, metrics, statusOptions }) {
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val }))

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v2H4V4zm0 6h10v2H4v-2zm0 6h16v2H4v-2z" fill="currentColor" opacity=".4"/>
              <circle cx="18" cy="10" r="4" fill="var(--accent)"/>
            </svg>
          </div>
          {open && <span className="brand-name">Reply Monitor</span>}
        </div>
        <button className="toggle-btn" onClick={onToggle} title={open ? 'Collapse' : 'Expand'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <path d="M15 18l-6-6 6-6"/>
              : <path d="M9 18l6-6-6-6"/>}
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div className="sidebar-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>

          <div className="sidebar-section">
            <div className="section-label">Status</div>
            {statusOptions.map(s => (
              <button
                key={s}
                className={`nav-item ${filters.status === s ? 'active' : ''}`}
                onClick={() => setFilter('status', s)}
              >
                <span className="nav-dot" style={{ color: STATUS_COLORS[s] }}>{STATUS_ICONS[s]}</span>
                <span className="nav-label">{s}</span>
                <span className="nav-count">{
                  s === 'New' ? metrics.new :
                  s === 'Hot Lead' ? metrics.hot :
                  s === 'Follow Up' ? metrics.followup :
                  s === 'Replied' ? metrics.replied :
                  s === 'Not Interested' ? metrics.notint : 0
                }</span>
              </button>
            ))}
          </div>

          {campaigns.length > 0 && (
            <div className="sidebar-section">
              <div className="section-label">Campaigns</div>
              <button
                className={`nav-item ${filters.campaign === '' ? 'active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, campaign: '' }))}
              >
                <span className="nav-dot" style={{ color: 'var(--text-muted)' }}>≡</span>
                <span className="nav-label">All campaigns</span>
                <span className="nav-count">{metrics.total}</span>
              </button>
              {campaigns.map(c => (
                <button
                  key={c}
                  className={`nav-item ${filters.campaign === c ? 'active' : ''}`}
                  onClick={() => setFilter('campaign', c)}
                  title={c}
                >
                  <span className="nav-dot" style={{ color: 'var(--accent)' }}>◆</span>
                  <span className="nav-label">{c}</span>
                </button>
              ))}
            </div>
          )}

          {pocs.length > 0 && (
            <div className="sidebar-section">
              <div className="section-label">POC</div>
              {pocs.map(p => (
                <button
                  key={p}
                  className={`nav-item ${filters.poc === p ? 'active' : ''}`}
                  onClick={() => setFilter('poc', p)}
                >
                  <span className="nav-avatar">{p.charAt(0).toUpperCase()}</span>
                  <span className="nav-label">{p}</span>
                </button>
              ))}
            </div>
          )}

          <div className="sidebar-footer">
            <div className="footer-tag">ConsultAdd GTM</div>
          </div>
        </>
      )}
    </aside>
  )
}
