import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import './ConversationDetail.css'

const STATUS_META = {
  'New':         { c:'#4A7FC1', bg:'rgba(74,127,193,0.1)' },
  'Interested':  { c:'#6B8E5A', bg:'rgba(107,142,90,0.1)' },
  'Meeting':     { c:'#C96442', bg:'rgba(201,100,66,0.1)' },
  'OOO':         { c:'#D4A857', bg:'rgba(212,168,87,0.1)' },
  'Nurture':     { c:'#8B8378', bg:'rgba(139,131,120,0.1)' },
  'Unsubscribe': { c:'#B85450', bg:'rgba(184,84,80,0.1)' },
  'Follow Up':   { c:'#D4A857', bg:'rgba(212,168,87,0.1)' },
  'Replied':     { c:'#8B8378', bg:'rgba(139,131,120,0.1)' },
}

function fmt(ts) {
  try { return format(parseISO(ts), 'MMM d · h:mm a') } catch { return ts||'—' }
}

export default function ConversationDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions }) {
  const [notes, setNotes]   = useState(reply?.sdr_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => { setNotes(reply?.sdr_notes || ''); setSaved(false) }, [reply?.id])

  const save = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sm = STATUS_META[reply?.status] || STATUS_META['New']

  return (
    <div className="conv">
      {/* Topbar */}
      <div className="conv-topbar">
        <button className="conv-back" onClick={onClose}>← Inbox</button>
        {reply.status && (
          <span className="conv-pill" style={{ color:sm.c, borderColor:sm.c, background:sm.bg }}>
            {reply.status}
          </span>
        )}
        {reply.campaign_name && (
          <span className="conv-pill" style={{ color:'var(--ink2)', borderColor:'var(--line)' }}>
            ◆ {reply.campaign_name}
          </span>
        )}
        <div className="conv-spacer"/>
        {reply.poc && <span style={{ fontSize:12, color:'var(--ink3)' }}>Handler: {reply.poc}</span>}
        <button className="conv-action">Reassign</button>
        <button className="conv-action">Snooze</button>
        <button className="conv-action primary">Mark done</button>
      </div>

      {/* Scrollable thread */}
      <div className="conv-body">
        <div>
          <div className="conv-heading">{reply.reply_subject || '(no subject)'}</div>
          <div className="conv-meta">2 messages · {fmt(reply.created_at)}</div>
        </div>

        {/* Outbound email (sent) */}
        {reply.sent_email_body && (
          <div className="conv-bubble mine">
            <div className="cb-av" style={{ background:'#C96442' }}>A</div>
            <div className="cb-body">
              <div className="cb-from">{reply.sending_email || 'You'}</div>
              <div className="cb-date">Outbound · sent</div>
              <div className="cb-text">{reply.sent_email_body}</div>
            </div>
          </div>
        )}

        {/* Lead reply */}
        <div className="conv-bubble them">
          <div className="cb-av" style={{ background:'#7A8C99' }}>
            {(reply.lead_name||reply.lead_email||'?')[0].toUpperCase()}
          </div>
          <div className="cb-body">
            <div className="cb-from">{reply.lead_name || reply.lead_email}</div>
            <div className="cb-date">{reply.lead_email} · {fmt(reply.created_at)}</div>
            <div className="cb-text">{reply.reply_body || '—'}</div>
          </div>
        </div>

        {/* AI draft */}
        <div className="conv-ai">
          <div className="conv-ai-header">
            <span className="conv-ai-label">AI suggested reply</span>
            <span className="conv-ai-note">edit before send</span>
          </div>
          <div className="conv-ai-text">
            Hi {reply.lead_name?.split(' ')[0] || 'there'} — thanks for getting back to me!
            {'\n\n'}Happy to connect and share more. Would you have 15 minutes this week for a quick call?
            {'\n\n'}— Alok
          </div>
          <div className="conv-ai-actions">
            <button className="conv-ai-btn primary">Use draft</button>
            <button className="conv-ai-btn secondary">Edit</button>
            <button className="conv-ai-btn ghost">Regenerate</button>
            <button className="conv-ai-btn ghost">Try other tone ▾</button>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="conv-section">
        <div className="conv-section-label">Status</div>
        <div className="status-pills">
          {statusOptions.map(s => {
            const st = STATUS_META[s] || {}
            const active = reply.status === s
            return (
              <button
                key={s}
                className={`status-pill ${active ? 'active' : ''}`}
                style={active ? { color:st.c, borderColor:st.c, background:st.bg } : {}}
                onClick={() => onStatusChange(reply.id, s)}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="conv-notes">
        <div className="conv-section-label">Notes</div>
        <textarea
          className="conv-notes-ta"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add context, next steps, follow-up date…"
        />
        <button
          className={`conv-save-btn ${saved ? 'saved' : ''}`}
          onClick={save} disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}
