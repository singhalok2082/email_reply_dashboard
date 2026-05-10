import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import './Dashboard.css'

const STATUS_COLORS = {
  'New': 'var(--new)',
  'Hot Lead': 'var(--hot)',
  'Follow Up': 'var(--followup)',
  'Replied': 'var(--replied)',
  'Not Interested': 'var(--notint)',
}

const STATUS_BG = {
  'New': 'var(--new-bg)',
  'Hot Lead': 'var(--hot-bg)',
  'Follow Up': 'var(--followup-bg)',
  'Replied': 'var(--replied-bg)',
  'Not Interested': 'var(--notint-bg)',
}

function fmt(ts) {
  if (!ts) return '—'
  try { return format(parseISO(ts), 'MMM d, h:mm a') } catch { return ts }
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div className="metric-card">
      <div className="metric-val" style={{ color }}>{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  )
}

export default function Dashboard({ replies, loading, error, metrics, selected, onSelect, onRefresh, sidebarOpen, onToggleSidebar }) {
  const [sortBy, setSortBy] = useState('created_at')

  const sorted = [...replies].sort((a, b) => {
    if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at)
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '')
    if (sortBy === 'campaign') return (a.campaign_name || '').localeCompare(b.campaign_name || '')
    return 0
  })

  return (
    <div className="dashboard">
      <div className="topbar">
        <div className="topbar-left">
          {!sidebarOpen && (
            <button className="icon-btn" onClick={onToggleSidebar} title="Open sidebar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
          )}
          <div>
            <h1 className="page-title">Inbox replies</h1>
            <div className="page-sub">{metrics.total} result{metrics.total !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="topbar-right">
          <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="created_at">Latest first</option>
            <option value="status">By status</option>
            <option value="campaign">By campaign</option>
          </select>
          <button className="icon-btn" onClick={onRefresh} title="Refresh">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="metrics-row">
        <MetricCard label="Total" value={metrics.total} color="var(--text-primary)" />
        <MetricCard label="New" value={metrics.new} color="var(--new)" />
        <MetricCard label="Hot leads" value={metrics.hot} color="var(--hot)" />
        <MetricCard label="Follow up" value={metrics.followup} color="var(--followup)" />
        <MetricCard label="Replied" value={metrics.replied} color="var(--replied)" />
        <MetricCard label="Not interested" value={metrics.notint} color="var(--notint)" />
      </div>

      <div className="reply-list-wrap">
        {loading && (
          <div className="state-msg">
            <div className="loading-dots">
              <span /><span /><span />
            </div>
            <div>Loading replies...</div>
          </div>
        )}

        {error && !loading && (
          <div className="state-msg error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <div>
              <div style={{fontWeight:500}}>Connection error</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="state-msg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>No replies match your filters</div>
          </div>
        )}

        {!loading && sorted.map(r => (
          <div
            key={r.id}
            className={`reply-row ${selected?.id === r.id ? 'active' : ''}`}
            onClick={() => onSelect(r)}
          >
            <div className="reply-row-left">
              <div className="reply-avatar">{(r.lead_name || r.lead_email || '?').charAt(0).toUpperCase()}</div>
              <div className="reply-meta">
                <div className="reply-name">{r.lead_name || r.lead_email}</div>
                <div className="reply-email">{r.lead_email}</div>
              </div>
            </div>

            <div className="reply-row-center">
              <div className="reply-subject">{r.reply_subject || '(no subject)'}</div>
              <div className="reply-snippet">{r.reply_body?.slice(0, 100) || '—'}</div>
            </div>

            <div className="reply-row-right">
              <div className="reply-time">{fmt(r.created_at)}</div>
              <div className="reply-badges">
                <span className="badge" style={{ color: STATUS_COLORS[r.status], background: STATUS_BG[r.status] }}>
                  {r.status || 'New'}
                </span>
                {r.poc && <span className="poc-badge">{r.poc}</span>}
              </div>
              <div className="reply-campaign">{r.campaign_name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
