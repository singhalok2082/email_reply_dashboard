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

export default function Dashboard({ replies, metrics, campaigns, pocs, onViewInbox, mode='campaigns' }) {
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  const total = replies.length


  // ── Team mode ──────────────────────────────────────────────────
  if (mode === 'team') {
    const handlerStats = pocs.filter(p=>p&&p!=='Unassigned').map((p,i) => ({
      name: p, color: AVATAR_COLORS[i%AVATAR_COLORS.length],
      total:      replies.filter(r=>r.poc===p).length,
      new:        replies.filter(r=>r.poc===p&&r.status==='New').length,
      interested: replies.filter(r=>r.poc===p&&r.status==='Interested').length,
      meeting:    replies.filter(r=>r.poc===p&&r.status==='Meeting').length,
      ooo:        replies.filter(r=>r.poc===p&&r.status==='OOO').length,
    }))
    const maxCount = Math.max(...handlerStats.map(h=>h.total), 1)
    const slaOk  = Math.max(0, Math.round(total*0.84))
    const slaRisk= Math.max(0, Math.round(total*0.10))
    const slaBad = Math.max(0, total-slaOk-slaRisk)
    const slaPct = total > 0 ? Math.round((slaOk/total)*100) : 84

    const activity = [
      ...handlerStats.filter(h=>h.new>0).map(h=>({ init:h.name[0], color:h.color, text:`${h.name} has ${h.new} new repl${h.new===1?'y':'ies'} waiting` })),
      ...handlerStats.filter(h=>h.interested>0).map(h=>({ init:h.name[0], color:h.color, text:`${h.interested} interested lead${h.interested===1?'':'s'} for ${h.name}` })),
      ...campaigns.slice(0,2).map((c,i)=>({ init:'◆', color:CAMP_COLORS[i], text:`${replies.filter(r=>r.campaign_name===c).length} replies in ${c}` })),
    ].slice(0,5)

    return (
      <div className="dash">
        <div className="dash-topbar">
          <div className="dash-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style={{fontSize:12,color:'var(--ink3)'}}>Search replies, people, campaigns…</span>
          </div>
        </div>

        <div className="dash-body">
          <div className="dash-ph">
            <div>
              <div className="dash-ph-title">Team overview</div>
              <div className="dash-ph-sub">{today} · {total} replies in queue · <span style={{color:'var(--accent)',fontWeight:500}}>{metrics.new||0} new</span></div>
            </div>
          </div>

          {/* KPI row */}
          <div className="dash-kpis">
            {[
              {l:'AWAITING REPLY', v:metrics.new||0,        sub:'+12 since 9am',   c:'var(--accent)'},
              {l:'INTERESTED',     v:metrics.interested||0, sub:'↑ high intent',   c:'var(--ok)'},
              {l:'SLA MET',        v:`${slaPct}%`,          sub:'target 90%',      c:slaPct>=90?'var(--ok)':'var(--warn)'},
              {l:'MEETINGS',       v:metrics.meeting||0,    sub:'booked this week', c:'var(--ink)'},
            ].map((k,i)=>(
              <div key={i} className="dash-kpi">
                <div className="dkpi-label">{k.l}</div>
                <div className="dkpi-val" style={{color:k.c}}>{k.v}</div>
                <div className="dkpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Main row */}
          <div className="dash-main-row">
            {/* Workload table */}
            <div className="dash-box" style={{flex:2}}>
              <div className="db-head">
                <div className="db-head-title">Workload</div>
                <span style={{fontSize:11,color:'var(--ink3)'}}>{handlerStats.length} handlers active</span>
              </div>
              {handlerStats.length === 0 ? (
                <div style={{padding:'20px 16px',color:'var(--ink3)',fontSize:13,textAlign:'center'}}>
                  No handlers assigned yet. Go to Admin Panel to add handlers.
                </div>
              ) : handlerStats.map((h,i) => {
                const pct = Math.round((h.total/maxCount)*100)
                return (
                  <div key={h.name} className="db-row" style={{flexDirection:'column',alignItems:'stretch',gap:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:'50%',background:h.color,color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {h.name[0].toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600}}>{h.name}</div>
                        <div style={{fontSize:11,color:'var(--ink3)'}}>
                          <span style={{color:'var(--accent)',fontWeight:500}}>{h.new} new</span>
                          {' · '}
                          <span style={{color:'var(--ok)',fontWeight:500}}>{h.interested} interested</span>
                          {' · '}
                          {h.meeting} meetings
                          {h.ooo > 0 && <span style={{color:'var(--warn)'}}> · {h.ooo} OOO</span>}
                        </div>
                      </div>
                      <div style={{fontWeight:700,fontSize:18,color:h.total>0?h.color:'var(--line)'}}>{h.total}</div>
                    </div>
                    <div style={{height:5,background:'var(--line-soft)',borderRadius:3,marginLeft:44}}>
                      <div style={{width:`${pct}%`,height:'100%',background:h.color,borderRadius:3,transition:'width 0.4s ease'}}/>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right column */}
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:14,minWidth:240}}>

              {/* SLA */}
              <div className="dash-box">
                <div className="db-head" style={{borderBottom:'1px solid var(--line-soft)'}}>
                  <div className="db-head-title">SLA today</div>
                  <span style={{fontSize:11,fontWeight:600,color:slaPct>=90?'var(--ok)':'var(--warn)'}}>{slaPct}%</span>
                </div>
                <div style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:16}}>
                  <Donut pct={slaPct} s={72} c={slaPct>=85?'var(--accent)':'var(--warn)'}/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:8}}>
                    {[
                      {l:'On time',  v:slaOk,   c:'var(--ink)',  fw:500, dot:'var(--ok)'},
                      {l:'At risk',  v:slaRisk,  c:'var(--warn)', fw:700, dot:'var(--warn)'},
                      {l:'Breached', v:slaBad,   c:'var(--bad)',  fw:700, dot:'var(--bad)'},
                    ].map((s,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:s.dot,flexShrink:0}}/>
                        <span style={{flex:1,color:'var(--ink3)'}}>{s.l}</span>
                        <span style={{fontWeight:s.fw,color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="dash-box" style={{flex:1}}>
                <div className="db-head" style={{borderBottom:'1px solid var(--line-soft)'}}>
                  <div className="db-head-title">Recent activity</div>
                </div>
                <div style={{padding:'10px 16px 14px',display:'flex',flexDirection:'column',gap:10}}>
                  {activity.length === 0 ? (
                    <div style={{color:'var(--ink3)',fontSize:12}}>No recent activity</div>
                  ) : activity.map((a,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:24,height:24,borderRadius:'50%',background:a.color,color:'#fff',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {a.init}
                      </div>
                      <span style={{fontSize:11.5,color:'var(--ink2)',flex:1,lineHeight:1.4}}>{a.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaign breakdown */}
              <div className="dash-box">
                <div className="db-head" style={{borderBottom:'1px solid var(--line-soft)'}}>
                  <div className="db-head-title">By campaign</div>
                </div>
                <div style={{padding:'10px 16px 14px',display:'flex',flexDirection:'column',gap:8}}>
                  {campaigns.map((c,i)=>{
                    const cnt = replies.filter(r=>r.campaign_name===c).length
                    const max = Math.max(...campaigns.map(cc=>replies.filter(r=>r.campaign_name===cc).length),1)
                    return (
                      <div key={c} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:CAMP_COLORS[i%CAMP_COLORS.length],flexShrink:0}}/>
                        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--ink2)'}} title={c}>{c}</span>
                        <div style={{width:50,height:4,background:'var(--line-soft)',borderRadius:2}}>
                          <div style={{width:`${(cnt/max)*100}%`,height:'100%',background:CAMP_COLORS[i%CAMP_COLORS.length],borderRadius:2}}/>
                        </div>
                        <span style={{fontSize:11,color:'var(--ink3)',fontWeight:500,width:20,textAlign:'right'}}>{cnt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

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
