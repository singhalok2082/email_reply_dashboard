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

function fmtShort(ts) { try { return format(parseISO(ts), 'MMM d, h:mm a') } catch { return '' } }
function fmt(ts)      { try { return format(parseISO(ts), 'EEE, MMM d, yyyy h:mm a') } catch { return ts||'—' } }
function ago(ts)      { try { return formatDistanceToNow(parseISO(ts), { addSuffix:true }) } catch { return '' } }
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
      <button className="g-action-btn" onClick={() => setOpen(o=>!o)}>Reassign ▾</button>
      {open && (
        <div className="g-dropdown">
          {(pocs||[]).map(p => (
            <button key={p} className="g-dropdown-item"
              style={{fontWeight:p===reply.poc?600:400, color:p===reply.poc?'var(--accent)':'var(--ink)'}}
              onClick={() => { onReassign?.(reply.id, p); setOpen(false) }}>
              {p} {p===reply.poc && '✓'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// One email card — Gmail style
function EmailCard({ isOurs, name, email, toEmail, body, timestamp, color, defaultOpen }) {
  const [open, setOpen]           = useState(defaultOpen)
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={`g-message ${open ? 'open' : 'collapsed'}`}>
      <div className="g-msg-header" onClick={() => setOpen(o => !o)}>
        <div className="g-msg-av" style={{background: color}}>
          {initials(name, email)}
        </div>
        <div className="g-msg-meta">
          {open ? (
            <>
              <div className="g-msg-from-row">
                <span className="g-msg-name">{name}</span>
                <span className="g-msg-addr">&lt;{email}&gt;</span>
              </div>
              <div className="g-msg-to-row" onClick={e => { e.stopPropagation(); setShowDetails(d=>!d) }}>
                <span>to {toEmail}</span>
                <span className="g-msg-chevron">{showDetails ? '▲' : '▼'}</span>
              </div>
              {showDetails && (
                <div className="g-msg-details">
                  <div><span>from:</span> {email}</div>
                  <div><span>to:</span> {toEmail}</div>
                  <div><span>date:</span> {fmt(timestamp)}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0}}>
              <span className="g-msg-name">{name}</span>
              <span className="g-msg-preview">{(body||'').slice(0,100)}…</span>
            </div>
          )}
        </div>
        <div className="g-msg-time-row">
          <span className="g-msg-time">{fmtShort(timestamp)}</span>
        </div>
      </div>

      {open && (
        <div className="g-msg-body">
          <div className="g-msg-text">{body || '—'}</div>
        </div>
      )}
    </div>
  )
}

export default function ConversationDetail({ reply, onClose, onStatusChange, onNotesChange,
  statusOptions, campaigns, pocs, onReassign, isAdmin }) {

  const [notes,    setNotes]    = useState(reply?.sdr_notes || '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [showInfo, setShowInfo] = useState(false)

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

  const im       = INTENT_META[reply?.status] || INTENT_META['New']
  const campIdx  = (campaigns||[]).indexOf(reply?.campaign_name)
  const campColor= CAMP_COLORS[campIdx >= 0 ? campIdx % CAMP_COLORS.length : 0]
  const leadColor= AVATAR_COLORS[0]
  const pocColor = AVATAR_COLORS[1]

  // Build thread: sent email first (if available), then lead reply
  const hasSent = !!reply.sent_email_body

  return (
    <div className="g-conv">

      {/* ── Top bar ── */}
      <div className="g-topbar">
        <button className="g-back-btn" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Inbox
        </button>
        <div style={{flex:1}}/>
        <div className="g-topbar-actions">
          <ReassignBtn reply={reply} pocs={pocs||[]} onReassign={onReassign} isAdmin={isAdmin}/>
          <button className="g-action-btn primary" onClick={() => onStatusChange(reply.id,'Replied')}>
            Mark done
          </button>
          <div className="g-status-chips">
            {['New','Interested','Meeting','OOO','Unsubscribe'].map(s => {
              const sm = INTENT_META[s]||{}
              const active = reply.status === s
              return (
                <button key={s}
                  className={`g-status-chip ${active?'active':''}`}
                  style={active?{color:sm.c,borderColor:sm.c,background:sm.b}:{}}
                  onClick={() => onStatusChange(reply.id, s)}>
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="g-content">

        {/* Subject + pills */}
        <div className="g-subject-row">
          <h2 className="g-subject">{reply.reply_subject || '(no subject)'}</h2>
          <div style={{display:'flex', gap:6, flexShrink:0, flexWrap:'wrap'}}>
            {reply.campaign_name && (
              <span className="g-pill" style={{color:campColor,borderColor:campColor+'50',background:campColor+'12'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:campColor,display:'inline-block'}}/>
                {reply.campaign_name}
              </span>
            )}
            {reply.status && (
              <span className="g-pill" style={{color:im.c,borderColor:im.c+'50',background:im.b}}>
                {reply.status}
              </span>
            )}
          </div>
        </div>

        {/* Thread count */}
        <div style={{fontSize:12, color:'var(--ink3)', marginTop:-8}}>
          {hasSent ? 2 : 1} message{hasSent ? 's' : ''} · {ago(reply.created_at)}
        </div>

        {/* ── Email thread ── */}
        <div className="g-thread">

          {/* Card 1: Our outbound email */}
          {hasSent ? (
            <EmailCard
              isOurs={true}
              name={reply.poc || 'You'}
              email={reply.sending_email || ''}
              toEmail={reply.lead_email}
              body={reply.sent_email_body}
              timestamp={reply.created_at}
              color={pocColor}
              defaultOpen={false}
            />
          ) : (
            /* No sent email stored — show a muted placeholder */
            <div className="g-message-placeholder">
              <div className="g-msg-av" style={{background:'var(--line)',color:'var(--ink3)',fontSize:11}}>
                {(reply.poc||'A')[0].toUpperCase()}
              </div>
              <div>
                <div style={{fontSize:13,color:'var(--ink3)'}}>
                  <strong style={{color:'var(--ink2)'}}>{reply.poc || 'You'}</strong>
                  {' — outbound email (not captured)'}
                </div>
                <div style={{fontSize:11,color:'var(--ink3)',marginTop:2}}>
                  Sent via Instantly · {fmtShort(reply.created_at)}
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Lead reply — always expanded */}
          <EmailCard
            isOurs={false}
            name={reply.lead_name || reply.lead_email}
            email={reply.lead_email}
            toEmail={reply.sending_email || reply.poc || 'you'}
            body={reply.reply_body || '—'}
            timestamp={reply.created_at}
            color={leadColor}
            defaultOpen={true}
          />
        </div>

        {/* ── Info + Notes panel (replaces compose) ── */}
        <div className="g-info-card">
          <div className="g-info-card-header">
            <div className="g-info-card-title">Lead details</div>
            <button className="g-action-btn" onClick={() => setShowInfo(s=>!s)}>
              {showInfo ? 'Hide' : 'Show all'}
            </button>
          </div>

          <div className="g-info-grid">
            <div className="g-info-item">
              <div className="g-info-label">Lead</div>
              <div className="g-info-val">{reply.lead_name || '—'}</div>
            </div>
            <div className="g-info-item">
              <div className="g-info-label">Email</div>
              <div className="g-info-val">{reply.lead_email}</div>
            </div>
            {reply.company && (
              <div className="g-info-item">
                <div className="g-info-label">Company</div>
                <div className="g-info-val">{reply.company}</div>
              </div>
            )}
            <div className="g-info-item">
              <div className="g-info-label">Handler</div>
              <div className="g-info-val">{reply.poc || '—'}</div>
            </div>
            {reply.sending_email && (
              <div className="g-info-item">
                <div className="g-info-label">Sent from</div>
                <div className="g-info-val">{reply.sending_email}</div>
              </div>
            )}
            {reply.job_url && (
              <div className="g-info-item" style={{gridColumn:'1/-1'}}>
                <div className="g-info-label">Job posting</div>
                <a href={reply.job_url} target="_blank" rel="noopener noreferrer"
                  style={{color:'var(--accent)',fontSize:13,textDecoration:'underline'}}>
                  View on LinkedIn →
                </a>
              </div>
            )}
          </div>

          {showInfo && (
            <>
              {/* Status */}
              <div style={{borderTop:'1px solid var(--line-soft)', paddingTop:14, marginTop:4}}>
                <div className="g-info-label" style={{marginBottom:8}}>Status</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {STATUS_OPTIONS.map(s => {
                    const sm = INTENT_META[s]||{}
                    const active = reply.status===s
                    return (
                      <button key={s}
                        style={{padding:'4px 12px', borderRadius:99, border:'1px solid',
                          fontSize:12, cursor:'pointer', fontFamily:'var(--font)',
                          color:active?sm.c:'var(--ink3)',
                          borderColor:active?sm.c:'var(--line)',
                          background:active?sm.b:'none',
                          fontWeight:active?600:400}}
                        onClick={() => onStatusChange(reply.id, s)}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div style={{borderTop:'1px solid var(--line-soft)', paddingTop:14, marginTop:4}}>
                <div className="g-info-label" style={{marginBottom:8}}>Notes</div>
                <textarea className="g-notes-input" value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add context, next steps, follow-up date…"/>
                <button className={`g-notes-save ${saved?'saved':''}`}
                  onClick={saveNotes} disabled={saving}>
                  {saving?'Saving…':saved?'✓ Saved':'Save notes'}
                </button>
              </div>

              {/* Activity */}
              <div style={{borderTop:'1px solid var(--line-soft)', paddingTop:14, marginTop:4}}>
                <div className="g-info-label" style={{marginBottom:8}}>Activity</div>
                {[
                  {c:im.c,     t:`AI tagged "${(reply.status||'New').toLowerCase()}"`, d:ago(reply.created_at)},
                  {c:'#7A8C99',t:`Routed to ${reply.poc||'handler'}`,                  d:ago(reply.created_at)},
                  {c:'#6B8E5A',t:'Reply received',                                     d:ago(reply.created_at)},
                  {c:'#B8AFA0',t:'Sequence sent',                                      d:fmtShort(reply.created_at)},
                ].map((a,i) => (
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:a.c,flexShrink:0,marginTop:5}}/>
                    <span style={{fontSize:12,color:'var(--ink2)',lineHeight:1.5}}>
                      {a.t} · <span style={{color:'var(--ink3)'}}>{a.d}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
