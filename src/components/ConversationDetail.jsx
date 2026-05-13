import { useState, useEffect, useRef } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import './ConversationDetail.css'

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

const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']
const CAMP_COLORS   = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const STATUS_OPTIONS = ['New','Interested','Meeting','OOO','Nurture','Unsubscribe','Follow Up','Replied']

function fmt(ts) {
  try { return format(parseISO(ts), 'MMM d · h:mma') } catch { return ts||'—' }
}
function ago(ts) {
  try { return formatDistanceToNow(parseISO(ts), { addSuffix:true }) } catch { return '' }
}
function initials(name, email) {
  if (name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
}
function getDomain(email) {
  if (!email) return ''
  const p = email.split('@')[1] || ''
  return p.replace(/\.(com|org|net|io|ai)$/,'')
}


function ReassignBtn({ reply, pocs, onReassign, isAdmin }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  if (!isAdmin) return null
  return (
    <div style={{position:'relative'}} ref={ref}>
      <button className="conv-top-btn" onClick={() => setOpen(o=>!o)}>Reassign ▾</button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100%+4px)', right:0, zIndex:200,
          background:'var(--paper2)', border:'1px solid var(--line)',
          borderRadius:9, boxShadow:'0 6px 20px rgba(0,0,0,0.12)',
          minWidth:160, overflow:'hidden'
        }}>
          {(pocs||[]).map(p => (
            <button key={p} style={{
              width:'100%', padding:'9px 14px', border:'none', background:'none',
              fontSize:13, color: p===reply.poc?'var(--accent)':'var(--ink)',
              cursor:'pointer', textAlign:'left', fontFamily:'var(--font)',
              fontWeight: p===reply.poc?600:400,
              transition:'background 0.1s'
            }}
            onMouseEnter={e=>e.target.style.background='var(--line-soft)'}
            onMouseLeave={e=>e.target.style.background='none'}
            onClick={() => { onReassign && onReassign(reply.id, p); setOpen(false) }}>
              {p} {p===reply.poc && '(current)'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ConversationDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions, campaigns, pocs, onReassign, isAdmin }) {
  const [notes,  setNotes]  = useState(reply?.sdr_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setNotes(reply?.sdr_notes || '')
    setSaved(false)
  }, [reply?.id])

  const saveNotes = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const im = INTENT_META[reply?.status] || INTENT_META['New']
  const firstName = reply?.lead_name?.split(' ')[0] || 'there'
  const campIdx   = (campaigns||[]).indexOf(reply?.campaign_name)
  const campColor = CAMP_COLORS[campIdx >= 0 ? campIdx % CAMP_COLORS.length : 0]
  const leadColor = AVATAR_COLORS[0]
  const pocColor  = AVATAR_COLORS[1]

  const activity = [
    { dot: im.c,         text: `AI tagged "${(reply.status||'New').toLowerCase()}"`, time: ago(reply.created_at) },
    { dot: '#7A8C99',    text: `Routed to ${reply.poc || 'handler'}`,               time: ago(reply.created_at) },
    { dot: '#6B8E5A',    text: 'Reply received',                                    time: ago(reply.created_at) },
    { dot: '#B8AFA0',    text: 'Sequence sent',                                     time: fmt(reply.created_at) },
  ]

  return (
    <div className="conv">
      {/* ── Main thread ── */}
      <div className="conv-main">

        {/* Top bar */}
        <div className="conv-topbar">
          <button className="conv-back" onClick={onClose}>← Inbox</button>
          {reply.status && (
            <span className="conv-topbar-pill"
              style={{ color:im.c, borderColor:im.c+'60', background:im.b }}>
              {reply.status.toLowerCase()}
            </span>
          )}
          {reply.campaign_name && (
            <span className="conv-topbar-pill"
              style={{ color:campColor, borderColor:campColor+'60', background:campColor+'12' }}>
              <span style={{width:7,height:7,borderRadius:'50%',background:campColor,display:'inline-block',marginRight:3}}/>
              {reply.campaign_name}
            </span>
          )}
          <div className="conv-spacer"/>
          <ReassignBtn reply={reply} pocs={pocs||[]} onReassign={onReassign} isAdmin={isAdmin}/>
          <button className="conv-top-btn">Snooze</button>
          <button className="conv-top-btn primary"
            onClick={() => onStatusChange(reply.id, 'Replied')}>
            Mark done
          </button>
        </div>

        {/* Thread */}
        <div className="conv-thread">
          <div>
            <div className="conv-subject">{reply.reply_subject || '(no subject)'}</div>
            <div className="conv-thread-meta">2 messages · started {fmt(reply.created_at)}</div>
          </div>

          {/* Our sent email — RIGHT side */}
          {reply.sent_email_body && (
            <div className="conv-msg ours">
              <div className="conv-msg-av" style={{ background: pocColor }}>
                {reply.poc ? reply.poc[0].toUpperCase() : 'A'}
              </div>
              <div className="conv-msg-body">
                <div className="conv-msg-from">{reply.poc || 'You'}</div>
                <div className="conv-msg-time">{fmt(reply.created_at)}</div>
                <div className="conv-msg-text">{reply.sent_email_body}</div>
              </div>
            </div>
          )}

          {/* Lead reply — LEFT side */}
          <div className="conv-msg theirs">
            <div className="conv-msg-av" style={{ background: leadColor }}>
              {initials(reply.lead_name, reply.lead_email)}
            </div>
            <div className="conv-msg-body">
              <div className="conv-msg-from">{reply.lead_name || reply.lead_email}</div>
              <div className="conv-msg-time">{fmt(reply.created_at)}</div>
              <div className="conv-msg-text">{reply.reply_body || '—'}</div>
            </div>
          </div>

          {/* AI draft */}
          <div className="conv-ai-wrap">
            <div className="conv-ai-hdr">
              <span className="conv-ai-pill">AI suggested reply</span>
              <span className="conv-ai-note">matches your last 5 tones</span>
            </div>
            <div className="conv-ai-text">
              {`Hi ${firstName} — thanks for getting back to me!\n\nHappy to connect and share more about how we can help. Would you have 15 minutes this week for a quick call?\n\n— ${reply.poc || 'Alok'}`}
            </div>
            <div className="conv-ai-acts">
              <button className="conv-ai-use">Use draft</button>
              <button className="conv-ai-ghost">Edit</button>
              <button className="conv-ai-ghost">Regenerate</button>
              <button className="conv-ai-ghost">Try other tone ▾</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right rail ── */}
      <div className="conv-rail">

        {/* Lead info */}
        <div>
          <div className="rail-lead-av" style={{ background: leadColor }}>
            {initials(reply.lead_name, reply.lead_email)}
          </div>
          <div className="rail-lead-name">{reply.lead_name || reply.lead_email}</div>
          {getDomain(reply.lead_email) && (
            <div className="rail-lead-title">{getDomain(reply.lead_email)}</div>
          )}
        </div>

        {/* Contact info */}
        <div>
          {reply.lead_email && (
            <div className="rail-info-row">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <path d="m22 6-10 7L2 6"/>
              </svg>
              {reply.lead_email}
            </div>
          )}
          {reply.company && (
            <div className="rail-info-row">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {reply.company}
            </div>
          )}
          {reply.lead_title && (
            <div className="rail-info-row">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              {reply.lead_title}
            </div>
          )}
        </div>

        {/* Job URL */}
        {reply.job_url && (
          <>
            <div className="rail-divider"/>
            <div>
              <div className="rail-section-label">Job posting</div>
              <a href={reply.job_url} target="_blank" rel="noopener noreferrer"
                className="rail-job-link">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View job posting
              </a>
              <div style={{fontSize:10.5,color:'var(--ink3)',marginTop:4,wordBreak:'break-all',lineHeight:1.4}}>
                {reply.job_url.replace(/^https?:\/\//, '').slice(0,60)}{reply.job_url.length>60?'…':''}
              </div>
            </div>
          </>
        )}

        <div className="rail-divider"/>

        {/* Campaign */}
        <div>
          <div className="rail-section-label">Campaign</div>
          {reply.campaign_name && (
            <div className="rail-camp-name">
              <div className="rail-camp-dot" style={{ background: campColor }}/>
              {reply.campaign_name}
            </div>
          )}
          {reply.poc && (
            <div className="rail-owner-row">
              <span style={{ fontSize:11, color:'var(--ink3)' }}>Owner</span>
              <div className="rail-mini-av" style={{ background: pocColor }}>
                {reply.poc[0].toUpperCase()}
              </div>
              <span style={{ fontSize:12 }}>{reply.poc}</span>
            </div>
          )}
          {reply.sending_email && (
            <div style={{ fontSize:11, color:'var(--ink3)', marginTop:2 }}>
              Sent from {reply.sending_email}
            </div>
          )}
        </div>

        <div className="rail-divider"/>

        {/* Status */}
        <div>
          <div className="rail-section-label">Status</div>
          <div className="status-pills-row">
            {STATUS_OPTIONS.map(s => {
              const sm = INTENT_META[s] || {}
              const active = reply.status === s
              return (
                <button key={s}
                  className={`status-micro-pill ${active?'active':''}`}
                  style={active ? { color:sm.c, borderColor:sm.c, background:sm.b } : {}}
                  onClick={() => onStatusChange(reply.id, s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rail-divider"/>

        {/* Notes */}
        <div>
          <div className="rail-section-label">Notes</div>
          <textarea
            className="rail-notes-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="+ Add note"
          />
          <button className={`rail-save-btn ${saved?'saved':''}`} onClick={saveNotes} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        <div className="rail-divider"/>

        {/* Activity */}
        <div>
          <div className="rail-section-label">Activity</div>
          {activity.map((a, i) => (
            <div key={i} className="rail-activity-item">
              <div className="rail-act-dot" style={{ background: a.dot }}/>
              <span>{a.text} · <span style={{ color:'var(--ink3)' }}>{a.time}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
