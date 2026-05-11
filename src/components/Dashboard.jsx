import './Dashboard.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']

function Donut({ pct=72, s=52, c='#C96442' }) {
  const r = s/2-4, C = 2*Math.PI*r
  return (
    <svg width={s} height={s}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth="5"/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(pct/100)*C} ${C}`} transform={`rotate(-90 ${s/2} ${s/2})`}/>
      <text x={s/2} y={s/2+4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{pct}%</text>
    </svg>
  )
}

function Spark({ data=[4,7,5,8,6,9,11], w=80, h=20, c='#C96442' }) {
  const max = Math.max(...data), step = w/(data.length-1)
  const pts = data.map((v,i) => `${i*step},${h-(v/max)*(h-4)-2}`).join(' ')
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export default function Dashboard({ replies, metrics, campaigns, pocs }) {
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  const slaOk = Math.round(metrics.total * 0.84)
  const slaBreached = Math.max(0, Math.round(metrics.total * 0.06))

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <div className="dash-date">{today}</div>
          <div className="dash-title">Team overview</div>
          <div className="dash-sub">
            {metrics.total} replies in queue ·{' '}
            {slaBreached > 0 ? <span style={{ color:'var(--bad)' }}>{slaBreached} past SLA</span> : <span style={{ color:'var(--ok)' }}>All within SLA</span>}
          </div>
        </div>
      </div>

      <div className="dash-body">
        {/* Stat cards */}
        <div className="dash-stats">
          {[
            { l:'Awaiting reply', v:metrics.total,      s:'in queue',        c:'var(--accent)' },
            { l:'Interested',     v:metrics.interested, s:'high intent',     c:'var(--ok)' },
            { l:'Avg response',   v:'—',                s:'response time',   c:'var(--ink)' },
            { l:'Meetings booked',v:metrics.meeting,    s:'this week',       c:'var(--ink)' },
          ].map((s, i) => (
            <div key={i} className="dash-stat-card">
              <div className="dsc-label">{s.l}</div>
              <div className="dsc-val" style={{ color:s.c }}>{s.v}</div>
              <div className="dsc-sub">{s.s}</div>
            </div>
          ))}
        </div>

        <div className="dash-row">
          {/* Campaign table */}
          <div className="dash-box" style={{ flex:2 }}>
            <div className="db-header">
              <div className="db-title">Campaigns</div>
              <span style={{ fontSize:11, color:'var(--ink3)', fontStyle:'italic' }}>owner per campaign</span>
            </div>
            {campaigns.length === 0 ? (
              <div style={{ padding:'20px 14px', color:'var(--ink3)', fontSize:13 }}>No campaigns yet. Replies will appear once received.</div>
            ) : campaigns.map((c, i) => {
              const count = replies.filter(r=>r.campaign_name===c).length
              const poc = replies.find(r=>r.campaign_name===c)?.poc || '—'
              return (
                <div key={c} className="db-row">
                  <div style={{ width:8, height:8, borderRadius:'50%', background:CAMP_COLORS[i%CAMP_COLORS.length], flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c}</div>
                    <div style={{ fontSize:11, color:'var(--ink3)' }}>{count} replies</div>
                  </div>
                  <Spark data={[2,4,3,5,7,6,count||1]} w={60} h={16} c={CAMP_COLORS[i%CAMP_COLORS.length]}/>
                  <div className="db-av" style={{ background:AVATAR_COLORS[i%AVATAR_COLORS.length] }}>{poc[0]?.toUpperCase()}</div>
                </div>
              )
            })}
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, minWidth:240 }}>
            {/* SLA */}
            <div className="dash-box">
              <div className="db-header"><div className="db-title">SLA today</div></div>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'4px 0' }}>
                <Donut pct={metrics.total > 0 ? Math.round((slaOk/metrics.total)*100) : 100}/>
                <div style={{ display:'flex', flexDirection:'column', gap:5, flex:1 }}>
                  {[
                    { l:'On time',  v:slaOk,        c:'var(--ink)' },
                    { l:'At risk',  v:Math.round(metrics.total*0.1), c:'var(--warn)' },
                    { l:'Breached', v:slaBreached,   c:'var(--bad)' },
                  ].map((s,i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                      <span style={{ color:'var(--ink3)' }}>{s.l}</span>
                      <span style={{ fontWeight:600, color:s.c }}>{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Handlers workload */}
            {pocs.length > 0 && (
              <div className="dash-box" style={{ flex:1 }}>
                <div className="db-header"><div className="db-title">Workload</div></div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {pocs.map((p, i) => {
                    const cnt = replies.filter(r=>r.poc===p).length
                    const max = Math.max(...pocs.map(pp => replies.filter(r=>r.poc===pp).length), 1)
                    return (
                      <div key={p} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                        <div className="db-av" style={{ background:AVATAR_COLORS[i%AVATAR_COLORS.length] }}>{p[0].toUpperCase()}</div>
                        <span style={{ flex:1 }}>{p}</span>
                        <div style={{ width:70, height:5, background:'var(--line-soft)', borderRadius:3 }}>
                          <div style={{ width:`${(cnt/max)*100}%`, height:'100%', background:'var(--accent)', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:11, width:18, textAlign:'right', color:'var(--ink2)' }}>{cnt}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
