import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import './ReplyDetail.css'

const SC = {
  'New':           { c:'var(--new)',      b:'var(--new-bg)' },
  'Hot Lead':      { c:'var(--hot)',      b:'var(--hot-bg)' },
  'Follow Up':     { c:'var(--followup)', b:'var(--followup-bg)' },
  'Replied':       { c:'var(--replied)',  b:'var(--replied-bg)' },
  'Not Interested':{ c:'var(--notint)',   b:'var(--notint-bg)' },
}

function fmt(ts) {
  try { return format(parseISO(ts), 'MMM d, yyyy · h:mm a') } catch { return ts || '—' }
}

export default function ReplyDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions }) {
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

  const sc = SC[reply?.status] || SC['New']

  return (
    <div className="detail-panel">
      <div className="dp-header">
        <div className="dp-lead">
          <div className="dp-avatar">{(reply.lead_name||reply.lead_email||'?')[0].toUpperCase()}</div>
          <div>
            <div className="dp-name">{reply.lead_name || reply.lead_email}</div>
            <div className="dp-email">{reply.lead_email}</div>
          </div>
        </div>
        <div className="dp-actions">
          <button className="dp-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="dp-body">
        {/* Meta chips */}
        <div className="dp-meta">
          {reply.campaign_name && (
            <span className="dp-meta-chip campaign">◆ {reply.campaign_name}</span>
          )}
          <span className="dp-meta-chip">{fmt(reply.created_at)}</span>
          {reply.sending_email && <span className="dp-meta-chip">From: {reply.sending_email}</span>}
          {reply.poc && <span className="dp-meta-chip">Handler: {reply.poc}</span>}
        </div>

        {/* Subject */}
        {reply.reply_subject && (
          <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)', lineHeight:1.4 }}>
            {reply.reply_subject}
          </div>
        )}

        {/* Status */}
        <div className="dp-section">
          <div className="dp-section-label">Status</div>
          <div className="status-pills">
            {statusOptions.map(s => {
              const st = SC[s] || {}
              const active = reply.status === s
              return (
                <button
                  key={s}
                  className={`status-pill ${active ? 'active' : ''}`}
                  style={active ? { color:st.c, background:st.b, borderColor:st.c } : {}}
                  onClick={() => onStatusChange(reply.id, s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lead reply */}
        <div className="dp-section">
          <div className="dp-section-label">Reply from lead</div>
          <div className="dp-msg">
            <div className="dp-msg-from">{reply.lead_email} · {fmt(reply.created_at)}</div>
            <div className="dp-msg-body">{reply.reply_body || '—'}</div>
          </div>
        </div>

        {/* Sent email */}
        {reply.sent_email_body && (
          <div className="dp-section">
            <div className="dp-section-label">Your outbound email</div>
            <div className="dp-msg sent">
              <div className="dp-msg-from">{reply.sending_email} · outbound</div>
              <div className="dp-msg-body">{reply.sent_email_body}</div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="dp-section">
          <div className="dp-section-label">Notes</div>
          <textarea
            className="dp-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context, next steps, follow-up date..."
          />
          <button
            className={`dp-save ${saved ? 'saved' : ''}`}
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
