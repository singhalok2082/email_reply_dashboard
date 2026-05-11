import './Sidebar.css'

const STATUS_ICONS = {
  'New': '●', 'Hot Lead': '🔥', 'Follow Up': '↩', 'Replied': '✓', 'Not Interested': '—'
}
const STATUS_COLORS = {
  'New': 'var(--new)', 'Hot Lead': 'var(--hot)', 'Follow Up': 'var(--followup)',
  'Replied': 'var(--replied)', 'Not Interested': 'var(--notint)'
}

export default function Sidebar({ open, onToggle, filters, setFilters, campaigns, pocs, metrics, statusOptions, totalReplies }) {
  const toggle = (key, val) => setFilters(f => ({ ...f, [key]: f[key] === val ? '' : val }))
  const hasFilter = filters.campaign || filters.status || filters.poc

  const cnt = s => ({
    'New': metrics.new, 'Hot Lead': metrics.hot, 'Follow Up': metrics.followup,
    'Replied': metrics.replied, 'Not Interested': metrics.notint
  }[s] || 0)

  return (
    <aside className={`sidebar ${open ? '' : 'closed'}`}>
      <div className="sb-header">
        <div className="sb-brand">
          <div className="sb-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
          </div>
          <div>
            <div className="sb-title">Reply Monitor</div>
            <div className="sb-sub">ConsultAdd GTM</div>
          </div>
        </div>
        <button className="sb-toggle" onClick={onToggle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <div className="sb-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          placeholder="Search..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
      </div>

      <nav className="sb-nav">
        <div className="sb-group">
          <button
            className={`sb-item ${!hasFilter ? 'active' : ''}`}
            onClick={() => setFilters({ campaign:'', status:'', poc:'', search:'' })}
          >
            <span className="sb-item-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span className="sb-item-label">All replies</span>
            <span className="sb-item-count">{totalReplies}</span>
          </button>
        </div>

        <div className="sb-hr"/>

        <div className="sb-group">
          <div className="sb-group-label">Status</div>
          {statusOptions.map(s => (
            <button
              key={s}
              className={`sb-item ${filters.status === s ? 'active' : ''}`}
              onClick={() => toggle('status', s)}
            >
              <span className="sb-item-icon" style={{ color: STATUS_COLORS[s] }}>
                {STATUS_ICONS[s]}
              </span>
              <span className="sb-item-label">{s}</span>
              {cnt(s) > 0 && <span className="sb-item-count">{cnt(s)}</span>}
            </button>
          ))}
        </div>

        {campaigns.length > 0 && <>
          <div className="sb-hr"/>
          <div className="sb-group">
            <div className="sb-group-label">Campaigns</div>
            {campaigns.map(c => (
              <button
                key={c}
                className={`sb-item ${filters.campaign === c ? 'active' : ''}`}
                onClick={() => toggle('campaign', c)}
                title={c}
              >
                <span className="sb-dot"/>
                <span className="sb-item-label">{c}</span>
              </button>
            ))}
          </div>
        </>}

        {pocs.length > 0 && <>
          <div className="sb-hr"/>
          <div className="sb-group">
            <div className="sb-group-label">Handlers</div>
            {pocs.map(p => (
              <button
                key={p}
                className={`sb-item ${filters.poc === p ? 'active' : ''}`}
                onClick={() => toggle('poc', p)}
              >
                <span className="sb-avatar">{p[0].toUpperCase()}</span>
                <span className="sb-item-label">{p}</span>
              </button>
            ))}
          </div>
        </>}
      </nav>

      <div className="sb-footer">{totalReplies} total replies</div>
    </aside>
  )
}
