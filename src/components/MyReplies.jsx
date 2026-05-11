import { useState } from 'react'
import './MyReplies.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']

const STATUS_META = {
  'New':        { c:'#4A7FC1' }, 'Interested': { c:'#6B8E5A' },
  'Meeting':    { c:'#C96442' }, 'OOO':        { c:'#D4A857' },
  'Nurture':    { c:'#8B8378' }, 'Unsubscribe':{ c:'#B85450' },
  'Follow Up':  { c:'#D4A857' }, 'Replied':    { c:'#8B8378' },
}

function initials(name, email) {
  if(name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
}

// V1 — Simple list with SLA urgency
function ListView({ replies, pocs, onStatusChange }) {
  const [subview, setSubview] = useState('all')

  const filtered = subview === 'all' ? replies :
    subview === 'urgent' ? replies.filter(r=>r.status==='New') :
    subview === 'done'   ? replies.filter(r=>r.status==='Replied') : replies

  return (
    <div className="mr-wrap">
      <div className="mr-header">
        <div>
          <div className="mr-title">My replies</div>
          <div className="mr-sub">{replies.length} in queue · {replies.filter(r=>r.status==='New').length} new</div>
        </div>
        <div className="mr-tabs">
          {[['all','All',replies.length],['urgent','Urgent',replies.filter(r=>r.status==='New').length],['done','Done',replies.filter(r=>r.status==='Replied').length]].map(([k,l,n])=>(
            <button key={k} className={`mr-tab ${subview===k?'active':''}`} onClick={()=>setSubview(k)}>
              {l} <span>{n}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mr-list">
        {filtered.length === 0 && (
          <div className="mr-empty">No replies in this view</div>
        )}
        {filtered.map((r,i) => {
          const sm = STATUS_META[r.status] || STATUS_META['New']
          const isUrgent = r.status === 'New'
          const isDone   = r.status === 'Replied'
          return (
            <div key={r.id} className="mr-row" style={{
              borderLeft: `3px solid ${isDone ? 'var(--line)' : isUrgent ? '#D4A857' : 'var(--line-soft)'}`,
            }}>
              <div className="mr-av" style={{background:AVATAR_COLORS[i%AVATAR_COLORS.length]}}>
                {initials(r.lead_name, r.lead_email)}
              </div>
              <div className="mr-body">
                <div className="mr-row-top">
                  <span className="mr-name">{r.lead_name || r.lead_email}</span>
                  {r.lead_name && <span className="mr-co">· {r.lead_email?.split('@')[1]}</span>}
                  <span className="mr-pill" style={{color:sm.c, borderColor:sm.c+'40'}}>{r.status||'New'}</span>
                  {r.campaign_name && <span className="mr-camp">◆ {r.campaign_name}</span>}
                </div>
                <div className="mr-subj">{r.reply_subject || '(no subject)'}</div>
                <div className="mr-prev">{r.reply_body?.slice(0,100) || '—'}</div>
              </div>
              <div className="mr-actions">
                <button className="mr-btn primary" onClick={()=>onStatusChange(r.id,'Replied')}>Reply</button>
                <button className="mr-btn" onClick={()=>onStatusChange(r.id,'OOO')}>Snooze</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// V2 — Kanban board
function KanbanView({ replies, onStatusChange }) {
  const cols = [
    { id:'New',      label:'New',          color:'#C96442' },
    { id:'Interested',label:'Interested',  color:'#6B8E5A' },
    { id:'Follow Up', label:'Follow Up',   color:'#D4A857' },
    { id:'Replied',   label:'Done',        color:'#7A8C99' },
  ]
  return (
    <div className="kanban-wrap">
      <div className="kanban-header">
        <div className="mr-title">My replies</div>
        <div className="mr-sub">drag cards to update status</div>
      </div>
      <div className="kanban-board">
        {cols.map(col => {
          const items = replies.filter(r=>r.status===col.id)
          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-dot" style={{background:col.color}}/>
                <span className="kanban-col-title">{col.label}</span>
                <span className="kanban-col-count">{items.length}</span>
              </div>
              <div className="kanban-cards">
                {items.map((r,i) => (
                  <div key={r.id} className="kanban-card">
                    <div className="kc-top">
                      <div className="kc-av" style={{background:AVATAR_COLORS[i%AVATAR_COLORS.length]}}>
                        {initials(r.lead_name,r.lead_email)}
                      </div>
                      <span className="kc-name">{r.lead_name||r.lead_email}</span>
                    </div>
                    <div className="kc-co">{r.lead_email?.split('@')[1]}</div>
                    {r.campaign_name && <div className="kc-camp">◆ {r.campaign_name}</div>}
                    <div className="kc-foot">
                      <div className="kc-actions">
                        {cols.filter(c=>c.id!==col.id).slice(0,2).map(c=>(
                          <button key={c.id} className="kc-move" onClick={()=>onStatusChange(r.id,c.id)}>→ {c.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {items.length===0 && <div className="kanban-empty">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MyReplies({ replies, pocs, metrics, onStatusChange }) {
  const [mode, setMode] = useState('list')
  return (
    <div className="mr-container">
      <div className="mr-mode-bar">
        <button className={`mr-mode-btn ${mode==='list'?'active':''}`} onClick={()=>setMode('list')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          List
        </button>
        <button className={`mr-mode-btn ${mode==='kanban'?'active':''}`} onClick={()=>setMode('kanban')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Kanban
        </button>
      </div>
      {mode==='list'
        ? <ListView replies={replies} pocs={pocs} onStatusChange={onStatusChange}/>
        : <KanbanView replies={replies} onStatusChange={onStatusChange}/>
      }
    </div>
  )
}
