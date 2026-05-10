import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import './ReplyDetail.css'

const STATUS_OPTIONS_MAP = {
  'New':            { color: 'var(--new)',      bg: 'var(--new-bg)' },
  'Hot Lead':       { color: 'var(--hot)',      bg: 'var(--hot-bg)' },
  'Follow Up':      { color: 'var(--followup)', bg: 'var(--followup-bg)' },
  'Replied':        { color: 'var(--replied)',  bg: 'var(--replied-bg)' },
  'Not Interested': { color: 'var(--notint)',   bg: 'var(--notint-bg)' },
}

function fmt(ts) {
  if (!ts) return '—'
  try { return format(parseISO(ts), 'MMM d, yyyy · h:mm a') } catch { return ts }
}

export default function ReplyDetail({ reply, onClose, onStatusChange, onNotesChange, statusOptions }) {
  const [notes, setNotes] = useState(reply?.sdr_notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setNotes(reply?.sdr_notes || '')
    setSaved(false)
  }, [reply?.id])

  const handleNoteSave = async () => {
    setSaving(true)
    await onNotesChange(reply.id, notes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const style = STATUS_OPTIONS_MAP[reply?.status] || STATUS_OPTIONS_MAP['New']

  if (!reply) return null

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-lead">
          <div className="detail-avatar">{(reply.lead_name || reply.lead_email || '?').charAt(0).toUpperCase()}</div>
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

        <div className="detail-section">
          <div className="detail-row">
            <span className="detail-key">Campaign</span>
            <span className="detail-val">{reply.campaign_name || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Received</span>
            <span className="detail-val mono">{fmt(reply.created_at)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Sent from</span>
            <span className="detail-val mono">{reply.sending_email || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">POC</span>
            <span className="detail-val">{reply.poc || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Subject</span>
            <span className="detail-val">{reply.reply_subject || '—'}</span>
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title">Status</div>
          <div className="status-grid">
            {statusOptions.map(s => {
              const st = STATUS_OPTIONS_MAP[s] || {}
              const active = reply.status === s
              return (
                <button
                  key={s}
                  className={`status-btn ${active ? 'active' : ''}`}
                  style={active ? { color: st.color, background: st.bg, borderColor: st.color } : {}}
                  onClick={() => onStatusChange(reply.id, s)}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title">Reply from lead</div>
          <div className="message-bubble reply-bubble">
            <div className="bubble-meta">{reply.lead_name || reply.lead_email} · {fmt(reply.created_at)}</div>
            <div className="bubble-body">{reply.reply_body || '—'}</div>
          </div>
        </div>

        {reply.sent_email_body && (
          <div className="detail-section">
            <div className="section-title">Your outbound email</div>
            <div className="message-bubble sent-bubble">
              <div className="bubble-meta">{reply.sending_email} · outbound</div>
              <div className="bubble-body">{reply.sent_email_body}</div>
            </div>
          </div>
        )}

        <div className="detail-section">
          <div className="section-title">SDR notes</div>
          <textarea
            className="notes-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes, next steps, context..."
            rows={4}
          />
          <button
            className={`save-btn ${saved ? 'saved' : ''}`}
            onClick={handleNoteSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save notes'}
          </button>
        </div>

      </div>
    </div>
  )
}
