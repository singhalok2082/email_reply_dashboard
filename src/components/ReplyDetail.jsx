import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import './ReplyDetail.css'

const STATUS_COLOR = {
  'New':            { color:'var(--new)',      bg:'var(--new-bg)' },
  'Hot Lead':       { color:'var(--hot)',      bg:'var(--hot-bg)' },
  'Follow Up':      { color:'var(--followup)', bg:'var(--followup-bg)' },
  'Replied':        { color:'var(--replied)',  bg:'var(--replied-bg)' },
  'Not Interested': { color:'var(--notint)',   bg:'var(--notint-bg)' },
}

function fmt(ts) {
  if (!ts) return '—'
  try { return format(parseISO(ts), 'MMM d, yyyy · h:mm a') } catch { return ts }
}

export default function ReplyDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions }) {
  const [notes,  setNotes]  = useState(reply?.sdr_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setNotes(reply?.sdr_notes || '')
    setSaved(false)
  }, [reply?.id])

  const handleSave = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const sc = STATUS_COLOR[reply?.status] || STATUS_COLOR['New']

  return (
    <div className="detail-panel">
      <div className="detail-topbar">
        <div className="detail-lead">
          <div className="detail-avatar">
            {(reply.lead_name || reply.lead_email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="detail-name">{reply.lead_name || '—'}</div>
            <div className="detail-email">{reply.lead_email}</div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="detail-body">

        {/* Campaign */}
        {reply.campaign_name && (
          <div>
            <span className="campaign-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              {reply.campaign_name}
            </span>
          </div>
        )}

        {/* Meta */}
        <div className="detail-section">
          <div className="ds-title">Details</div>
          <div className="meta-grid">
            <div className="meta-row">
              <span className="meta-key">Received</span>
              <span className="meta-val mono">{fmt(reply.created_at)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Sent from</span>
              <span className="meta-val mono">{reply.sending_email || '—'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Handler (POC)</span>
              <span className="meta-val">{reply.poc || '—'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Subject</span>
              <span className="meta-val" title={reply.reply_subject}>{reply.reply_subject || '—'}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="detail-section">
          <div className="ds-title">Status</div>
          <div className="status-grid">
            {statusOptions.map(s => {
              const st = STATUS_COLOR[s] || {}
              const active = reply.status === s
              return (
                <button
                  key={s}
                  className={`status-btn ${active?'active':''}`}
                  style={active ? {color:st.color, background:st.bg, borderColor:st.color} : {}}
                  onClick={() => onStatusChange(reply.id, s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lead's reply */}
        <div className="detail-section">
          <div className="ds-title">Lead's reply</div>
          <div className="bubble bubble-lead">
            <div className="bubble-from">{reply.lead_email} · {fmt(reply.created_at)}</div>
            <div className="bubble-text">{reply.reply_body || '—'}</div>
          </div>
        </div>

        {/* Your sent email */}
        {reply.sent_email_body && (
          <div className="detail-section">
            <div className="ds-title">Your outbound email</div>
            <div className="bubble bubble-sent">
              <div className="bubble-from">{reply.sending_email} · outbound</div>
              <div className="bubble-text">{reply.sent_email_body}</div>
            </div>
          </div>
        )}

        {/* SDR Notes */}
        <div className="detail-section">
          <div className="ds-title">Notes</div>
          <textarea
            className="notes-area"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context, next steps, follow-up date..."
          />
          <div className="save-row">
            <button
              className={`save-btn ${saved?'saved':''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
