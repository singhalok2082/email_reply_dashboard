import { useState, useEffect, useRef } from 'react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'
import './ConversationDetail.css'

const INTENT_META = {
  'New':         { c:'#4A7FC1', b:'rgba(74,127,193,0.12)' },
  'Interested':  { c:'#6B8E5A', b:'rgba(107,142,90,0.12)' },
  'Meeting':     { c:'#C96442', b:'rgba(201,100,66,0.12)' },
  'OOO':         { c:'#D4A857', b:'rgba(212,168,87,0.12)' },
  'Nurture':     { c:'#8B8378', b:'rgba(139,131,120,0.12)' },
  'Unsubscribe': { c:'#B85450', b:'rgba(184,84,80,0.12)' },
  'Follow Up':   { c:'#D4A857', b:'rgba(212,168,87,0.12)' },
  'Replied':     { c:'#8B8378', b:'rgba(139,131,120,0.12)' },
}
const AVATAR_COLORS  = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']
const CAMP_COLORS    = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const STATUS_OPTIONS = ['New','Interested','Meeting','OOO','Nurture','Unsubscribe','Follow Up','Replied']

function fmt(ts)  { try { return format(parseISO(ts), 'EEE, MMM d, h:mm a') } catch { return ts||'—' } }
function fmtShort(ts) { try { return format(parseISO(ts), 'MMM d, h:mm a') } catch { return '' } }
function ago(ts)  { try { return formatDistanceToNow(parseISO(ts), { addSuffix:true }) } catch { return '' } }
function initials(name, email) {
  if (name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
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
      <button className="g-action-btn" onClick={() => setOpen(o=>!o)}>
        Reassign ▾
      </button>
      {open && (
        <div className="g-dropdown">
          {(pocs||[]).map(p => (
            <button key={p} className="g-dropdown-item"
              style={{fontWeight: p===reply.poc?600:400, color: p===reply.poc?'var(--accent)':'var(--ink)'}}
              onClick={() => { onReassign?.(reply.id, p); setOpen(false) }}>
              {p} {p===reply.poc && '✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Single email in thread — exactly like Gmail
function EmailMessage({ msg, isOurs, reply, pocColor, leadColor, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const [showDetails, setShowDetails] = useState(false)

  const name    = isOurs ? (reply.poc || 'You') : (reply.lead_name || reply.lead_email)
  const email   = isOurs ? reply.sending_email : reply.lead_email
  const toEmail = isOurs ? reply.lead_email : reply.sending_email
  const color   = isOurs ? pocColor : leadColor
  const ts      = msg.timestamp || reply.created_at

  return (
    <div className={`g-message ${open ? 'open' : 'collapsed'}`}>
      {/* Header — always visible */}
      <div className="g-msg-header" onClick={() => !open && setOpen(true)}>
        <div className="g-msg-av" style={{background: color}}>
          {isOurs ? (reply.poc||'Y')[0].toUpperCase() : initials(reply.lead_name, reply.lead_email)}
        </div>
        <div className="g-msg-meta">
          {open ? (
            <>
              <div className="g-msg-from-row">
                <span className="g-msg-name">{name}</span>
                <span className="g-msg-addr">&lt;{email}&gt;</span>
              </div>
              <div className="g-msg-to-row" onClick={() => setShowDetails(d=>!d)}>
                <span>to {toEmail}</span>
                <span className="g-msg-chevron">{showDetails ? '▲' : '▼'}</span>
              </div>
              {showDetails && (
                <div className="g-msg-details">
                  <div><span>from:</span> {email}</div>
                  <div><span>to:</span> {toEmail}</div>
                  <div><span>date:</span> {fmt(ts)}</div>
                  <div><span>subject:</span> {reply.reply_subject}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <span className="g-msg-name">{name}</span>
              <span className="g-msg-preview">{(msg.body||'').slice(0,80)}…</span>
            </>
          )}
        </div>
        <div className="g-msg-time-row">
          <span className="g-msg-time">{fmtShort(ts)}</span>
          {open && (
            <button className="g-msg-collapse" onClick={e => { e.stopPropagation(); setOpen(false) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body — only when open */}
      {open && (
        <div className="g-msg-body">
          <div className="g-msg-text">{msg.body || reply.reply_body || '—'}</div>
        </div>
      )}
    </div>
  )
}

export default function ConversationDetail({ reply, onClose, onStatusChange, onNotesChange,
  statusOptions, campaigns, pocs, onReassign, isAdmin }) {

  const [notes,   setNotes]   = useState(reply?.sdr_notes || '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [aiDraft, setAiDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    setNotes(reply?.sdr_notes || '')
    setSaved(false); setEditing(false)
    const firstName = reply?.lead_name?.split(' ')[0] || 'there'
    const poc = reply?.poc || 'Alok'
    setAiDraft(`Hi ${firstName},\n\nThanks for getting back to me!\n\nHappy to share more details. Would you have 15 minutes this week for a quick call?\n\nBest,\n${poc}`)
  }, [reply?.id])

  const saveNotes = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Build thread messages
  const buildMsgs = () => {
    if (reply.thread_messages) {
      try {
        const p = JSON.parse(reply.thread_messages)
        if (Array.isArray(p) && p.length > 0) return [...p].reverse()
      } catch (_) {}
    }
    const msgs = []
    if (reply.sent_email_body) {
      msgs.push({ direction:'outbound', body: reply.sent_email_body, timestamp: reply.created_at })
    }
    msgs.push({ direction:'inbound', body: reply.reply_body || '—', timestamp: reply.created_at })
    return msgs
  }

  const msgs = buildMsgs()
  const im       = INTENT_META[reply?.status] || INTENT_META['New']
  const campIdx  = (campaigns||[]).indexOf(reply?.campaign_name)
  const campColor= CAMP_COLORS[campIdx >= 0 ? campIdx % CAMP_COLORS.length : 0]
  const leadColor= AVATAR_COLORS[0]
  const pocColor = AVATAR_COLORS[1]
  const firstName = reply?.lead_name?.split(' ')[0] || 'there'

  return (
    <div className="g-conv">
      {/* ── Top action bar ── */}
      <div className="g-topbar">
        <button className="g-back-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Inbox
        </button>

        <div style={{flex:1}}/>

        <div className="g-topbar-actions">
          <ReassignBtn reply={reply} pocs={pocs||[]} onReassign={onReassign} isAdmin={isAdmin}/>
          <button className="g-action-btn" onClick={() => onStatusChange(reply.id,'Replied')}>
            Mark done
          </button>
          {/* Status quick-set */}
          <div className="g-status-chips">
            {['New','Interested','Meeting','OOO','Unsubscribe'].map(s => {
              const sm = INTENT_META[s] || {}
              const active = reply.status === s
              return (
                <button key={s}
                  className={`g-status-chip ${active?'active':''}`}
                  style={active ? {color:sm.c, borderColor:sm.c, background:sm.b} : {}}
                  onClick={() => onStatusChange(reply.id, s)}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="g-content">
        {/* Subject + campaign pill */}
        <div className="g-subject-row">
          <h2 className="g-subject">{reply.reply_subject || '(no subject)'}</h2>
          <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
            {reply.campaign_name && (
              <span className="g-camp-pill" style={{borderColor:campColor+'60', color:campColor, background:campColor+'12'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:campColor,display:'inline-block'}}/>
                {reply.campaign_name}
              </span>
            )}
            {reply.status && (
              <span className="g-camp-pill" style={{borderColor:im.c+'60', color:im.c, background:im.b}}>
                {reply.status}
              </span>
            )}
          </div>
        </div>

        {/* Email thread */}
        <div className="g-thread">
          {msgs.map((msg, i) => (
            <EmailMessage
              key={i}
              msg={msg}
              isOurs={msg.direction === 'outbound'}
              reply={reply}
              pocColor={pocColor}
              leadColor={leadColor}
              defaultOpen={i === msgs.length - 1}
            />
          ))}
        </div>

        {/* Reply compose — Gmail style */}
        <div className="g-compose">
          <div className="g-compose-header">
            <div className="g-compose-av" style={{background: pocColor}}>
              {(reply.poc||'A')[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div className="g-compose-to">
                Reply to <strong>{reply.lead_name || reply.lead_email}</strong>
                <span className="g-compose-addr">&lt;{reply.lead_email}&gt;</span>
              </div>
            </div>
            <span className="g-ai-badge">AI draft</span>
          </div>

          <div className="g-compose-body">
            {editing ? (
              <textarea
                className="g-compose-textarea"
                value={aiDraft}
                onChange={e => setAiDraft(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="g-compose-preview" onClick={() => setEditing(true)}>
                {aiDraft}
              </div>
            )}
          </div>

          <div className="g-compose-footer">
            <button className="g-send-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send
            </button>
            <button className="g-compose-ghost" onClick={() => setEditing(e=>!e)}>
              {editing ? 'Preview' : 'Edit'}
            </button>
            <button className="g-compose-ghost" onClick={() => {
              setAiDraft(`Hi ${firstName},\n\nThanks for getting back to me!\n\nHappy to share more details. Would you have 15 minutes this week for a quick call?\n\nBest,\n${reply.poc||'Alok'}`)
            }}>Regenerate</button>
            <button className="g-compose-ghost">Tone ▾</button>

            {/* Right side info */}
            <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8}}>
              {reply.sending_email && (
                <span style={{fontSize:11, color:'var(--ink3)'}}>from {reply.sending_email}</span>
              )}
              <button className="g-compose-ghost" onClick={() => setShowInfo(s=>!s)}>
                {showInfo ? 'Hide info' : 'Lead info'}
              </button>
            </div>
          </div>
        </div>

        {/* Lead info panel — shown below compose when toggled */}
        {showInfo && (
          <div className="g-info-panel">
            <div className="g-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span>{reply.lead_name || '—'}</span>
            </div>
            <div className="g-info-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <path d="m22 6-10 7L2 6"/>
              </svg>
              <span>{reply.lead_email}</span>
            </div>
            {reply.company && (
              <div className="g-info-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                <span>{reply.company}</span>
              </div>
            )}
            {reply.poc && (
              <div className="g-info-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
                <span>Handler: {reply.poc}</span>
              </div>
            )}
            {reply.job_url && (
              <div className="g-info-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                <a href={reply.job_url} target="_blank" rel="noopener noreferrer"
                  style={{color:'var(--accent)'}}>View job posting</a>
              </div>
            )}

            <div style={{borderTop:'1px solid var(--line-soft)', marginTop:10, paddingTop:10}}>
              <div style={{fontSize:10.5, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:6}}>Notes</div>
              <textarea className="g-notes-input" value={notes}
                onChange={e => setNotes(e.target.value)} placeholder="Add notes…"/>
              <button className={`g-notes-save ${saved?'saved':''}`} onClick={saveNotes} disabled={saving}>
                {saving?'Saving…':saved?'✓ Saved':'Save'}
              </button>
            </div>

            <div style={{borderTop:'1px solid var(--line-soft)', marginTop:10, paddingTop:10}}>
              <div style={{fontSize:10.5, fontWeight:600, color:'var(--ink3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:8}}>Status</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                {STATUS_OPTIONS.map(s => {
                  const sm = INTENT_META[s]||{}
                  const active = reply.status===s
                  return (
                    <button key={s}
                      style={{padding:'3px 10px', borderRadius:99, border:'1px solid', fontSize:11,
                        cursor:'pointer', fontFamily:'var(--font)',
                        color: active?sm.c:'var(--ink3)',
                        borderColor: active?sm.c:'var(--line)',
                        background: active?sm.b:'none'}}
                      onClick={() => onStatusChange(reply.id, s)}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
