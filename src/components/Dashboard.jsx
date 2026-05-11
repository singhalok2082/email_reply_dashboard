import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import ReplyDetail from './ReplyDetail.jsx'
import './Dashboard.css'

const SC = {
  'New':           { c:'var(--new)',      b:'var(--new-bg)' },
  'Hot Lead':      { c:'var(--hot)',      b:'var(--hot-bg)' },
  'Follow Up':     { c:'var(--followup)', b:'var(--followup-bg)' },
  'Replied':       { c:'var(--replied)',  b:'var(--replied-bg)' },
  'Not Interested':{ c:'var(--notint)',   b:'var(--notint-bg)' },
}

function smartTime(ts) {
  if (!ts) return '—'
  try {
    const d = parseISO(ts)
    if (isToday(d))     return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  } catch { return '' }
}

export default function Dashboard({ replies, loading, error, metrics, selected, onSelect, onRefresh, sidebarOpen, onToggleSidebar, onStatusChange, onNotesChange, statusOptions }) {
  const [sort, setSort] = useState('created_at')

  const sorted = [...replies].sort((a, b) => {
    if (sort === 'created_at') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'status')     return (a.status||'').localeCompare(b.status||'')
    if (sort === 'campaign')   return (a.campaign_name||'').localeCompare(b.campaign_name||'')
    return 0
  })

  return (
    <div className="dashboard">
      {/* LEFT — reply list */}
      <div className="reply-panel">
        <div className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && (
              <button className="icon-btn" onClick={onToggleSidebar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            <span className="page-title">Inbox</span>
            <span className="page-count">{replies.length}</span>
          </div>
          <div className="topbar-right">
            <select className="sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="created_at">Latest</option>
              <option value="status">Status</option>
              <option value="campaign">Campaign</option>
            </select>
            <button className="icon-btn" onClick={onRefresh}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="stats-row">
          {[
            { l:'Total',   v:metrics.total,    c:'var(--text-primary)' },
            { l:'New',     v:metrics.new,      c:'var(--new)' },
            { l:'Hot',     v:metrics.hot,      c:'var(--hot)' },
            { l:'Follow',  v:metrics.followup, c:'var(--followup)' },
            { l:'Replied', v:metrics.replied,  c:'var(--replied)' },
          ].map(m => (
            <div key={m.l} className="stat">
              <div className="stat-num" style={{ color:m.c }}>{m.v}</div>
              <div className="stat-label">{m.l}</div>
            </div>
          ))}
        </div>

        <div className="reply-list">
          {loading && (
            <div className="empty-state">
              <div className="loading-dots"><span/><span/><span/></div>
              <div>Loading...</div>
            </div>
          )}
          {error && !loading && (
            <div className="empty-state" style={{ color:'var(--hot)' }}>
              <div>Connection error</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>{error}</div>
            </div>
          )}
          {!loading && !error && sorted.length === 0 && (
            <div className="empty-state">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                <path d="m22 6-10 7L2 6"/>
              </svg>
              <p>No replies yet.<br/>They'll appear here when Instantly receives them.</p>
            </div>
          )}
          {!loading && sorted.map((r, i) => {
            const sc = SC[r.status] || SC['New']
            return (
              <div
                key={r.id}
                className={`rrow ${selected?.id === r.id ? 'active' : ''}`}
                onClick={() => onSelect(r)}
                style={{ animationDelay:`${Math.min(i*0.025,0.25)}s` }}
              >
                <div className="rrow-avatar">
                  {(r.lead_name || r.lead_email || '?')[0].toUpperCase()}
                </div>
                <div className="rrow-body">
                  <div className="rrow-top">
                    <span className="rrow-name">{r.lead_name || r.lead_email}</span>
                    <span className="rrow-time">{smartTime(r.created_at)}</span>
                  </div>
                  <div className="rrow-subj">{r.reply_subject || '(no subject)'}</div>
                  <div className="rrow-foot">
                    <span className="rrow-snip">{r.reply_body?.slice(0,80) || '—'}</span>
                    <span className="badge" style={{color:sc.c, background:sc.b}}>{r.status||'New'}</span>
                    {r.poc && <span className="tag">{r.poc}</span>}
                  </div>
                  {r.campaign_name && <div className="camp-tag">◆ {r.campaign_name}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT — detail or empty */}
      {selected ? (
        <ReplyDetail
          reply={selected}
          onClose={() => onSelect(null)}
          onStatusChange={onStatusChange}
          onNotesChange={onNotesChange}
          statusOptions={statusOptions}
        />
      ) : (
        <div className="detail-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
            <path d="m22 6-10 7L2 6"/>
          </svg>
          <p>Select a reply to<br/>view details</p>
        </div>
      )}
    </div>
  )
}
