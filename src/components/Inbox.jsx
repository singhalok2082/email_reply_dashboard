import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import ConversationDetail from './ConversationDetail.jsx'
import './Inbox.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']

const STATUS_META = {
  'New':         { c:'#4A7FC1', border:'rgba(74,127,193,0.3)' },
  'Interested':  { c:'#6B8E5A', border:'rgba(107,142,90,0.3)' },
  'Meeting':     { c:'#C96442', border:'rgba(201,100,66,0.3)' },
  'OOO':         { c:'#D4A857', border:'rgba(212,168,87,0.3)' },
  'Nurture':     { c:'#8B8378', border:'rgba(139,131,120,0.3)' },
  'Unsubscribe': { c:'#B85450', border:'rgba(184,84,80,0.3)' },
  'Follow Up':   { c:'#D4A857', border:'rgba(212,168,87,0.3)' },
  'Replied':     { c:'#8B8378', border:'rgba(139,131,120,0.3)' },
}

function smartTime(ts) {
  if (!ts) return ''
  try {
    const d = parseISO(ts)
    if (isToday(d))     return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  } catch { return '' }
}

function initials(name, email) {
  if (name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
}

const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C','#C49250']

export default function Inbox({ replies, loading, error, selected, onSelect, onRefresh, filters, setFilters, campaigns, statusOptions, onStatusChange, onNotesChange, metrics }) {
  const [sort, setSort] = useState('created_at')

  const sorted = [...replies].sort((a,b) => {
    if (sort==='created_at') return new Date(b.created_at) - new Date(a.created_at)
    if (sort==='status')     return (a.status||'').localeCompare(b.status||'')
    return 0
  })

  const filterViews = [
    { label:'All replies', key:'', badge: replies.length },
    { label:'New',         key:'New',       badge: metrics.new },
    { label:'Interested',  key:'Interested', badge: metrics.interested },
    { label:'Meeting',     key:'Meeting',   badge: metrics.meeting },
    { label:'OOO',         key:'OOO',       badge: metrics.ooo },
  ]

  const campCount = (c) => replies.filter(r=>r.campaign_name===c).length

  return (
    <div className="inbox">
      {/* Left filter pane */}
      <div className="inbox-filters">
        <div className="if-title">Views</div>
        {filterViews.map(v => (
          <button
            key={v.label}
            className={`if-item ${filters.status===(v.key) && !filters.campaign ? 'active' : ''}`}
            onClick={() => setFilters(f => ({...f, status:v.key, campaign:''}))}
          >
            <div className="if-item-left">
              <span>{v.label}</span>
            </div>
            <span className="if-badge">{v.badge}</span>
          </button>
        ))}

        {campaigns.length > 0 && <>
          <div className="if-section">Campaigns</div>
          {campaigns.map((c, i) => (
            <button
              key={c}
              className={`if-item ${filters.campaign===c ? 'active' : ''}`}
              onClick={() => setFilters(f => ({...f, campaign: f.campaign===c ? '' : c, status:''}))}
              title={c}
            >
              <div className="if-item-left">
                <div className="il-camp-dot" style={{ background: CAMP_COLORS[i%CAMP_COLORS.length] }}/>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{c}</span>
              </div>
              <span className="if-badge">{campCount(c)}</span>
            </button>
          ))}
        </>}

        <div style={{ flex:1 }}/>
        <button className="if-item" onClick={onRefresh} style={{ marginTop:8 }}>
          <div className="if-item-left">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            <span>Refresh</span>
          </div>
        </button>
      </div>

      {/* Reply list */}
      <div className="inbox-list">
        <div className="il-header">
          <div className="il-title">
            {filters.campaign || (filters.status || 'All replies')}
            {' '}<span className="il-count">· {sorted.length}</span>
          </div>
          <select className="il-sort" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="created_at">Newest</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="il-scroll">
          {loading && (
            <div className="il-empty">
              <div className="il-dots"><span/><span/><span/></div>
              <div>Loading replies…</div>
            </div>
          )}
          {error && !loading && (
            <div className="il-empty" style={{color:'var(--bad)'}}>
              <div>Connection error</div>
              <div style={{fontSize:11,color:'var(--ink3)'}}>{error}</div>
            </div>
          )}
          {!loading && !error && sorted.length===0 && (
            <div className="il-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                <path d="m22 6-10 7L2 6"/>
              </svg>
              <div>No replies here yet</div>
            </div>
          )}
          {!loading && sorted.map((r, i) => {
            const sm = STATUS_META[r.status] || STATUS_META['New']
            const ci = campaigns.indexOf(r.campaign_name)
            const campColor = CAMP_COLORS[ci>=0 ? ci%CAMP_COLORS.length : 0]
            const isUnread = r.status === 'New'
            return (
              <div
                key={r.id}
                className={`il-row ${selected?.id===r.id?'active':''} ${isUnread?'unread':''}`}
                onClick={() => onSelect(r)}
                style={{ animationDelay:`${Math.min(i*0.02,0.2)}s` }}
              >
                {isUnread ? <div className="il-unread-dot"/> : <div className="il-no-dot"/>}
                <div
                  className="il-avatar"
                  style={{ background: AVATAR_COLORS[i%AVATAR_COLORS.length] }}
                >
                  {initials(r.lead_name, r.lead_email)}
                </div>
                <div className="il-body">
                  <div className="il-top">
                    <span className="il-name">{r.lead_name || r.lead_email}</span>
                    {r.lead_name && <span className="il-co">· {r.lead_email?.split('@')[1]}</span>}
                    <span className="il-time">{smartTime(r.created_at)}</span>
                  </div>
                  <div className="il-subj">{r.reply_subject || '(no subject)'}</div>
                  <div className="il-prev">{r.reply_body?.slice(0,80) || '—'}</div>
                  <div className="il-foot">
                    {r.status && (
                      <span className="il-pill" style={{ color:sm.c, borderColor:sm.border }}>
                        {r.status}
                      </span>
                    )}
                    {r.campaign_name && (
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, color:'var(--ink3)' }}>
                        <div className="il-camp-dot" style={{ background:campColor }}/>
                        {r.campaign_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail pane */}
      <div className="inbox-detail">
        {selected ? (
          <ConversationDetail
            reply={selected}
            onClose={() => onSelect(null)}
            onStatusChange={onStatusChange}
            onNotesChange={onNotesChange}
            statusOptions={statusOptions}
          />
        ) : (
          <div className="id-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.5">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
            <div>Select a reply to read</div>
          </div>
        )}
      </div>
    </div>
  )
}
