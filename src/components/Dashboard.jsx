import { useState } from 'react'
import './Dashboard.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']

function Donut({ pct=70, s=64, c='#C96442' }) {
  const r = s/2 - 6
  const C = 2 * Math.PI * r
  const dash = (pct / 100) * C
  return (
    <svg width={s} height={s}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="#E6DFD2" strokeWidth="5"/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={c} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform={`rotate(-90 ${s/2} ${s/2})`}/>
      <text x={s/2} y={s/2+5} textAnchor="middle"
        fontSize="13" fontWeight="700" fill="#2D2A26">{pct}%</text>
    </svg>
  )
}

function CampaignCard({ camp, color, replies, poc, pocColor, i, onViewInbox }) {
  const campReplies  = replies.filter(r => r.campaign_name === camp)
  const newCount     = campReplies.filter(r => r.status === 'New').length
  const interested   = campReplies.filter(r => r.status === 'Interested').length
  const meetings     = campReplies.filter(r => r.status === 'Meeting').length
  const total        = campReplies.length
  const replied      = campReplies.filter(r => r.status === 'Replied').length
  const pct          = total > 0 ? Math.round((replied / total) * 100) : Math.round(70 + i * 4)

  return (
    <div className="camp-card">
      <div className="cc-header">
        <div className="cc-name-row">
          <div className="cc-dot" style={{ background: color }}/>
          <div className="cc-name">{camp}</div>
          <span className="cc-active-pill">active</span>
        </div>
      </div>

      <div className="cc-body">
        <div className="cc-donut">
          <Donut pct={pct} s={72} c={color}/>
        </div>
        <div className="cc-stats">
          <div className="cc-stat">
            <div className="cc-stat-val">{newCount}</div>
            <div className="cc-stat-label">new replies</div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat-val" style={{ color:'var(--ok)' }}>{interested}</div>
            <div className="cc-stat-label">interested</div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat-val" style={{ color:'var(--accent)' }}>{meetings}</div>
            <div className="cc-stat-label">meetings</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="cc-progress-track">
        <div className="cc-progress-bar" style={{ width: `${pct}%`, background: color }}/>
      </div>

      <div className="cc-footer">
        <div className="cc-owner">
          <span style={{ fontSize:11, color:'var(--ink3)' }}>Owner</span>
          <div className="cc-owner-av" style={{ background: pocColor }}>
            {poc ? poc[0].toUpperCase() : '?'}
          </div>
          <span style={{ fontSize:12, fontWeight:500 }}>{poc || 'Unassigned'}</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="cc-btn" onClick={() => onViewInbox(camp)}>View inbox</button>
          <button className="cc-btn">Settings</button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ replies, metrics, campaigns, pocs, onViewInbox }) {
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  const total = replies.length

  // Build POC map from replies
  const pocMap = {}
  campaigns.forEach(c => {
    const r = replies.find(rep => rep.campaign_name === c)
    if (r?.poc) pocMap[c] = r.poc
  })

  return (
    <div className="dash">
      {/* Topbar */}
      <div className="dash-topbar">
        <div className="dash-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize:12, color:'var(--ink3)' }}>Search replies, people, campaigns…</span>
        </div>
        <div style={{ flex:1 }}/>
        <button className="dash-pill dashed">+ Add campaign</button>
        <button className="dash-pill">Help</button>
      </div>

      <div className="dash-body">
        {/* Page heading */}
        <div className="dash-ph">
          <div>
            <div className="dash-ph-title">Campaigns</div>
            <div className="dash-ph-sub">
              {campaigns.length} active · {total} replies routed today
            </div>
          </div>
          <button className="dash-pill" style={{ fontSize:13, padding:'7px 16px' }}>
            + New campaign
          </button>
        </div>

        {/* Campaign cards grid */}
        {campaigns.length === 0 ? (
          <div className="dash-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <div>No campaigns yet</div>
            <div style={{ fontSize:12, color:'var(--ink3)', marginTop:4 }}>
              Replies will appear here once received from Instantly
            </div>
          </div>
        ) : (
          <div className="camp-grid">
            {campaigns.map((c, i) => (
              <CampaignCard
                key={c}
                camp={c}
                color={CAMP_COLORS[i % CAMP_COLORS.length]}
                replies={replies}
                poc={pocMap[c] || pocs[i % pocs.length] || ''}
                pocColor={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                i={i}
                onViewInbox={onViewInbox || (() => {})}
              />
            ))}
            {/* Add campaign placeholder */}
            <div className="camp-card-add">
              <div style={{ color:'var(--ink3)', fontSize:13 }}>
                + Connect another campaign from Instantly
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
