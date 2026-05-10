import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import './Dashboard.css'

const STATUS_COLOR = {
  'New':            { color:'var(--new)',      bg:'var(--new-bg)' },
  'Hot Lead':       { color:'var(--hot)',      bg:'var(--hot-bg)' },
  'Follow Up':      { color:'var(--followup)', bg:'var(--followup-bg)' },
  'Replied':        { color:'var(--replied)',  bg:'var(--replied-bg)' },
  'Not Interested': { color:'var(--notint)',   bg:'var(--notint-bg)' },
}

function smartTime(ts) {
  if (!ts) return '—'
  try {
    const d = parseISO(ts)
    if (isToday(d))     return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  } catch { return ts }
}

export default function Dashboard({ replies, loading, error, metrics, selected, onSelect, onRefresh, sidebarOpen, onToggleSidebar, filters }) {
  const [sort, setSort] = useState('created_at')

  const sorted = [...replies].sort((a,b) => {
    if (sort==='created_at') return new Date(b.created_at) - new Date(a.created_at)
    if (sort==='status')     return (a.status||'').localeCompare(b.status||'')
    if (sort==='campaign')   return (a.campaign_name||'').localeCompare(b.campaign_name||'')
    return 0
  })

  const activePills = [
    filters.campaign && { key:'campaign', label:`Campaign: ${filters.campaign}` },
    filters.status   && { key:'status',   label:`Status: ${filters.status}` },
    filters.poc      && { key:'poc',      label:`Handler: ${filters.poc}` },
  ].filter(Boolean)

  const clearFilter = key => { /* trigger parent via setFilters */ }

  const metricCells = [
    { label:'Total',        val:metrics.total,   color:'var(--text-primary)', skey:'' },
    { label:'New',          val:metrics.new,     color:'var(--new)',      skey:'New' },
    { label:'Hot Leads',    val:metrics.hot,     color:'var(--hot)',      skey:'Hot Lead' },
    { label:'Follow Up',    val:metrics.followup,color:'var(--followup)', skey:'Follow Up' },
    { label:'Replied',      val:metrics.replied, color:'var(--replied)',  skey:'Replied' },
    { label:'Not Interested',val:metrics.notint, color:'var(--notint)',   skey:'Not Interested' },
  ]

  return (
    <div className="dashboard">
      <div className="topbar">
        <div className="topbar-left">
          {!sidebarOpen && (
            <button className="icon-btn" onClick={onToggleSidebar}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div>
            <div className="page-title">Inbox replies</div>
            <div className="page-sub">{replies.length} result{replies.length!==1?'s':''}</div>
          </div>
        </div>
        <div className="topbar-right">
          <select className="sort-select" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="created_at">Latest first</option>
            <option value="status">By status</option>
            <option value="campaign">By campaign</option>
          </select>
          <button className="icon-btn" onClick={onRefresh} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </div>
      </div>

      {activePills.length > 0 && (
        <div className="filter-pills">
          {activePills.map(p => (
            <span key={p.key} className="filter-pill">{p.label}</span>
          ))}
        </div>
      )}

      <div className="metrics-strip">
        {metricCells.map(m => (
          <div key={m.label} className="metric-cell">
            <div className="metric-num" style={{ color:m.color }}>{m.val}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="reply-list">
        {loading && (
          <div className="state-wrap">
            <div className="dots"><span/><span/><span/></div>
            <div>Loading replies...</div>
          </div>
        )}

        {error && !loading && (
          <div className="state-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--hot)" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <div style={{color:'var(--hot)',fontWeight:500}}>Connection error</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{error}</div>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <div className="state-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div>No replies yet</div>
            <div style={{fontSize:11}}>Replies will appear here when Instantly sends them</div>
          </div>
        )}

        {!loading && sorted.map((r, i) => {
          const sc = STATUS_COLOR[r.status] || STATUS_COLOR['New']
          const initials = (r.lead_name || r.lead_email || '?').charAt(0).toUpperCase()
          return (
            <div
              key={r.id}
              className={`reply-row ${selected?.id===r.id?'active':''}`}
              onClick={() => onSelect(r)}
              style={{ animationDelay: `${Math.min(i*0.03,0.3)}s` }}
            >
              <div className="row-avatar">{initials}</div>
              <div className="row-body">
                <div className="row-top">
                  <span className="row-name">{r.lead_name || r.lead_email}</span>
                  <span className="row-time">{smartTime(r.created_at)}</span>
                </div>
                <div className="row-mid">
                  <span className="row-subject">{r.reply_subject || '(no subject)'}</span>
                </div>
                <div className="row-bottom">
                  <span className="row-snippet">{r.reply_body?.slice(0,100) || '—'}</span>
                  <span className="status-badge" style={{color:sc.color,background:sc.bg}}>{r.status||'New'}</span>
                  {r.poc && <span className="poc-tag">{r.poc}</span>}
                </div>
                {r.campaign_name && (
                  <div className="campaign-tag" style={{marginTop:4}}>📣 {r.campaign_name}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
