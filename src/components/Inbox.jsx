import { useState } from 'react'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { supabase } from '../lib/supabase'
import ConversationDetail from './ConversationDetail.jsx'
import './Inbox.css'

const CAMP_COLORS   = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C','#C49250']

const INTENT_META = {
  'New':          { c:'#4A7FC1', b:'rgba(74,127,193,0.12)' },
  'Interested':   { c:'#6B8E5A', b:'rgba(107,142,90,0.12)' },
  'Meeting':      { c:'#C96442', b:'rgba(201,100,66,0.12)' },
  'OOO':          { c:'#D4A857', b:'rgba(212,168,87,0.12)' },
  'Nurture':      { c:'#8B8378', b:'rgba(139,131,120,0.12)' },
  'Unsubscribe':  { c:'#B85450', b:'rgba(184,84,80,0.12)' },
  'Follow Up':    { c:'#D4A857', b:'rgba(212,168,87,0.12)' },
  'Replied':      { c:'#8B8378', b:'rgba(139,131,120,0.12)' },
}

const INTENT_DOT = {
  'Interested': '#6B8E5A', 'Meeting': '#C96442',
  'OOO': '#D4A857', 'Nurture': '#8B8378', 'Unsubscribe': '#B85450',
}

function smartTime(ts) {
  if (!ts) return ''
  try {
    const d = parseISO(ts)
    const mins = Math.round((Date.now() - d.getTime()) / 60000)
    if (isToday(d)) {
      if (mins < 60) return `${mins}m`
      return `${Math.round(mins/60)}h`
    }
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  } catch { return '' }
}

function initials(name, email) {
  if (name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
}

function getDomain(email) {
  if (!email) return ''
  return (email.split('@')[1]||'').replace(/\.(com|org|net|io|ai|co)$/, '')
}

export default function Inbox({ replies, loading, error, selected, onSelect, onRefresh,
  filters, setFilters, campaigns, statusOptions, onStatusChange, onNotesChange, metrics, pocs, onReassign, isAdmin }) {

  const [sort, setSort] = useState('newest')

  const sorted = [...replies].sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at)
    if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
    if (sort === 'status') return (a.status||'').localeCompare(b.status||'')
    return 0
  })

  const setStatusFilter = s => setFilters(f => ({ ...f, status: f.status===s ? '' : s, campaign:'' }))
  const setCampFilter   = c => setFilters(f => ({ ...f, campaign: f.campaign===c ? '' : c, status:'' }))
  const clearAll        = () => setFilters({ campaign:'', status:'', poc:'', search:'' })

  const deleteReply = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this reply? This cannot be undone.')) return
    await supabase.from('instantly_replies').delete().eq('id', id)
    if (selected?.id === id) onSelect(null)
    onRefresh()
  }

  const campCount = c => replies.filter(r => r.campaign_name === c).length

  const viewFilters = [
    { label:'All replies', badge: replies.length, action: clearAll,         active: !filters.status && !filters.campaign },
    { label:'New',         badge: metrics.new,    action: ()=>setStatusFilter('New'),   active: filters.status==='New' },
    { label:'Unassigned',  badge: replies.filter(r=>!r.poc||r.poc==='Unassigned').length, action:()=>{}, active:false },
    { label:'Past SLA',    badge: 0,              action: ()=>{},           active: false },
    { label:'Snoozed',     badge: 0,              action: ()=>{},           active: false },
  ]

  return (
    <div className="inbox">
      {/* ── Left filter pane ── */}
      <div className="inbox-filters">
        <div className="if-section-label">Views</div>
        {viewFilters.map(v => (
          <button key={v.label}
            className={`if-item ${v.active ? 'active' : ''}`}
            onClick={v.action}>
            <div className="if-item-left"><span>{v.label}</span></div>
            <span className="if-badge">{v.badge}</span>
          </button>
        ))}

        {campaigns.length > 0 && <>
          <div className="if-section-label">Campaigns</div>
          {campaigns.map((c, i) => (
            <button key={c}
              className={`if-item ${filters.campaign===c ? 'active' : ''}`}
              onClick={() => setCampFilter(c)} title={c}>
              <div className="if-item-left">
                <div className="if-camp-dot" style={{ background: CAMP_COLORS[i%CAMP_COLORS.length] }}/>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>{c}</span>
              </div>
              <span className="if-badge">{campCount(c)}</span>
            </button>
          ))}
        </>}

        <div className="if-section-label">Intent</div>
        {Object.entries(INTENT_DOT).map(([intent, color]) => (
          <button key={intent}
            className={`if-item ${filters.status===intent ? 'active' : ''}`}
            onClick={() => setStatusFilter(intent)}>
            <div className="if-item-left">
              <div className="if-intent-dot" style={{ background: color }}/>
              <span style={{ fontSize:13 }}>{intent.toLowerCase()}</span>
            </div>
            <span className="if-badge">{replies.filter(r=>r.status===intent).length}</span>
          </button>
        ))}

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

      {/* ── Middle reply list ── */}
      <div className="inbox-list">
        <div className="il-header">
          <div className="il-title-row">
            <span className="il-title">
              {filters.campaign || filters.status || 'All replies'}
            </span>
            <span className="il-count">· {sorted.length}</span>
          </div>
          <select className="il-sort-sel" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Sort: newest</option>
            <option value="oldest">Sort: oldest</option>
            <option value="status">Sort: status</option>
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
            <div className="il-empty" style={{ color:'var(--bad)' }}>
              <div style={{ fontWeight:500 }}>Connection error</div>
              <div style={{ fontSize:11 }}>{error}</div>
            </div>
          )}
          {!loading && !error && sorted.length === 0 && (
            <div className="il-empty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                <path d="m22 6-10 7L2 6"/>
              </svg>
              <div>No replies here</div>
            </div>
          )}

          {!loading && sorted.map((r, i) => {
            const im     = INTENT_META[r.status] || INTENT_META['New']
            const ci     = campaigns.indexOf(r.campaign_name)
            const isNew  = r.status === 'New'
            const domain = getDomain(r.lead_email)

            return (
              <div
                key={r.id}
                className={`il-row ${selected?.id === r.id ? 'active' : ''}`}
                onClick={() => onSelect(r)}
                style={{ animationDelay:`${Math.min(i*0.02,0.2)}s` }}
              >
                {/* Col 1: unread dot */}
                <div className="il-unread-col">
                  {isNew && <div className="il-unread-dot"/>}
                </div>

                {/* Col 2: avatar */}
                <div className="il-avatar"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {initials(r.lead_name, r.lead_email)}
                </div>

                {/* Col 3: content */}
                <div className="il-body">
                  <div className="il-top-row">
                    <span className="il-name">{r.lead_name || r.lead_email}</span>
                    {domain && <span className="il-co">· {domain}</span>}
                    {r.status && r.status !== 'New' && (
                      <span className="il-intent-pill"
                        style={{ color:im.c, borderColor:im.c+'50', background:im.b }}>
                        {r.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="il-subj">{r.reply_subject || '(no subject)'}</div>
                  <div className="il-prev">{r.reply_body?.slice(0,80) || '—'}</div>
                  {r.campaign_name && (
                    <div className="il-camp-row">
                      <div className="if-camp-dot"
                        style={{ background: CAMP_COLORS[ci >= 0 ? ci % CAMP_COLORS.length : 0] }}/>
                      {r.campaign_name}
                    </div>
                  )}
                </div>

                {/* Col 4: time + delete */}
                <div className="il-right">
                  <span className="il-time">{smartTime(r.created_at)}</span>
                  <button
                    className="il-delete"
                    onClick={e => deleteReply(e, r.id)}
                    title="Delete reply"
                  >✕</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right detail pane ── */}
      <div className="inbox-detail">
        {selected ? (
          <ConversationDetail
            reply={selected}
            onClose={() => onSelect(null)}
            onStatusChange={onStatusChange}
            onNotesChange={onNotesChange}
            statusOptions={statusOptions}
            campaigns={campaigns}
            pocs={pocs}
            onReassign={onReassign}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="id-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--line)" strokeWidth="1.5">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
              <path d="m22 6-10 7L2 6"/>
            </svg>
            <div style={{ fontWeight:500 }}>Select a reply to read</div>
            <div style={{ fontSize:11, color:'var(--ink3)' }}>Click any reply on the left</div>
          </div>
        )}
      </div>
    </div>
  )
}
