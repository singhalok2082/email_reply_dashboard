import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
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

const STATUS_OPTIONS = ['New','Interested','Meeting','OOO','Nurture','Unsubscribe','Follow Up','Replied']

function fmt(ts) {
  try { return format(parseISO(ts), 'MMM d · h:mm a') } catch { return ts||'—' }
}

function initials(name, email) {
  if (name) return name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
  return (email||'?')[0].toUpperCase()
}

export default function ConversationDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions, campaigns }) {
  const [notes,  setNotes]  = useState(reply?.sdr_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setNotes(reply?.sdr_notes || '')
    setSaved(false)
  }, [reply?.id])

  const save = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const im = INTENT_META[reply?.status] || INTENT_META['New']
  const firstName = reply?.lead_name?.split(' ')[0] || reply?.lead_email?.split('@')[0] || 'there'

  return (
    <div className="conv">
      {/* Top actions bar */}
      <div className="conv-actions">
        <button className="conv-back-btn" onClick={onClose}>← Inbox</button>
        <div style={{flex:1}}/>
        {reply.poc && <span style={{fontSize:12,color:'var(--ink3)'}}>Handler: {reply.poc}</span>}
        <button className="conv-action-btn">Reassign</button>
        <button className="conv-action-btn">Snooze</button>
        <button className="conv-action-btn primary" onClick={()=>onStatusChange(reply.id,'Replied')}>
          Mark done
        </button>
      </div>

      {/* Status pills bar - matches wireframe top */}
      <div className="conv-statusbar">
        {/* Current status as active pill */}
        {STATUS_OPTIONS.map(s => {
          const sm = INTENT_META[s] || INTENT_META['New']
          const active = reply.status === s
          return (
            <button
              key={s}
              className={`conv-status-pill ${active?'active':''}`}
              style={active
                ? { color:sm.c, borderColor:sm.c, background:sm.b }
                : { color:'var(--ink3)', borderColor:'var(--line)' }
              }
              onClick={() => onStatusChange(reply.id, s)}
            >
              {s}
            </button>
          )
        })}
        {reply.campaign_name && (
          <span className="conv-meta-pill">◆ {reply.campaign_name}</span>
        )}
        <span className="conv-ai-tag">← AI tagged</span>
      </div>

      {/* Scrollable thread */}
      <div className="conv-body">
        {/* Subject + sender */}
        <div>
          <div className="conv-heading">{reply.reply_subject || '(no subject)'}</div>
          <div className="conv-sender" style={{marginTop:8}}>
            <div className="conv-sender-av" style={{background:'var(--ink3)'}}>
              {initials(reply.lead_name, reply.lead_email)}
            </div>
            <div>
              <div className="conv-sender-name">{reply.lead_name || reply.lead_email}</div>
              <div className="conv-sender-email">{reply.lead_email}</div>
            </div>
            <div className="conv-sender-time">{fmt(reply.created_at)}</div>
          </div>
        </div>

        {/* Lead reply body */}
        <div className="conv-email-box">
          {reply.reply_body || '—'}
        </div>

        {/* Sent email (outbound) */}
        {reply.sent_email_body && (
          <div className="conv-sent-box">
            <div className="conv-sent-label">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>
              </svg>
              Outbound · sent by {reply.sending_email || 'you'}
            </div>
            <div className="conv-sent-body">{reply.sent_email_body}</div>
          </div>
        )}

        {/* AI suggested reply */}
        <div className="conv-ai-box">
          <div className="conv-ai-header">
            <span className="conv-ai-label-pill">AI draft</span>
            <span className="conv-ai-edit">edit before send</span>
          </div>
          <div className="conv-ai-text">
            {`Hi ${firstName} — thanks for getting back to me! Happy to connect and share more. Would you have 15 minutes this week for a quick call?\n\n— Alok`}
          </div>
          <div className="conv-ai-actions">
            <button className="conv-ai-send">Send</button>
            <button className="conv-ai-ghost">Edit</button>
            <button className="conv-ai-ghost">Regenerate</button>
            <button className="conv-ai-ghost">Try other tone ▾</button>
          </div>
        </div>
      </div>

      {/* Notes at bottom */}
      <div className="conv-notes-section">
        <div className="conv-notes-label">Notes</div>
        <textarea
          className="conv-notes-ta"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add context, next steps, follow-up date…"
        />
        <button
          className={`conv-save-btn ${saved?'saved':''}`}
          onClick={save} disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}
