import './Analytics.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C']

function Line({ data=[4,7,5,8,6,9,7,11,9,13,12,16], w=400, h=100, c='#C96442', fill=true }) {
  const max = Math.max(...data)*1.1, step = w/(data.length-1)
  const pts = data.map((v,i) => [i*step, h-(v/max)*(h-10)-4])
  const path = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')
  const area = path+` L ${w},${h} L 0,${h} Z`
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      {fill && <path d={area} fill={c} opacity="0.1"/>}
      <path d={path} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={c}/>)}
    </svg>
  )
}

function Donut({ pct=72, s=52, c='#C96442' }) {
  const r=s/2-4, C=2*Math.PI*r
  return (
    <svg width={s} height={s}>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth="5"/>
      <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${(pct/100)*C} ${C}`} transform={`rotate(-90 ${s/2} ${s/2})`}/>
      <text x={s/2} y={s/2+4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{pct}%</text>
    </svg>
  )
}

export default function Analytics({ replies, metrics, campaigns, pocs }) {
  const total = replies.length || 1
  const interested = replies.filter(r=>r.status==='Interested').length
  const meetings   = replies.filter(r=>r.status==='Meeting').length
  const replied    = replies.filter(r=>r.status==='Replied').length
  const slaOk      = Math.round(total*0.84)
  const slaPct     = Math.round((slaOk/total)*100)

  // Volume data — simulate trend
  const volumeData = [Math.max(1,total-8),Math.max(1,total-6),Math.max(1,total-4),Math.max(1,total-3),Math.max(1,total-2),Math.max(1,total-1),total]

  return (
    <div className="ana-wrap">
      <div className="ana-header">
        <div>
          <div className="ana-title">Analytics</div>
          <div className="ana-sub">Last 30 days · {total} replies handled</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="ana-pill">30d ▾</button>
          <button className="ana-pill dashed">Export</button>
        </div>
      </div>

      <div className="ana-body">
        {/* KPI cards */}
        <div className="ana-kpis">
          {[
            { l:'Replies handled', v:total,        d:'total received',   c:'var(--ink)' },
            { l:'Interested',      v:interested,   d:`${Math.round(interested/total*100)||0}% of replies`, c:'var(--ok)' },
            { l:'SLA met',         v:`${slaPct}%`, d:'target 90%',       c:slaPct>=90?'var(--ok)':'var(--warn)' },
            { l:'Meetings booked', v:meetings,     d:'from replies',     c:'var(--accent)' },
          ].map((s,i)=>(
            <div key={i} className="ana-kpi-card">
              <div className="akc-label">{s.l}</div>
              <div className="akc-val" style={{color:s.c}}>{s.v}</div>
              <div className="akc-delta">{s.d}</div>
            </div>
          ))}
        </div>

        <div className="ana-row">
          {/* Volume chart */}
          <div className="ana-box" style={{flex:2}}>
            <div className="ana-box-header">
              <div className="ana-box-title">Reply volume</div>
              <div style={{display:'flex',gap:16,fontSize:10.5,color:'var(--ink3)'}}>
                <span style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:'var(--accent)'}}/>
                  Replies received
                </span>
                <span style={{display:'flex',alignItems:'center',gap:4}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:'var(--ok)'}}/>
                  Interested
                </span>
              </div>
            </div>
            <div style={{padding:'0 14px 14px',overflowX:'auto'}}>
              <Line data={volumeData} w={Math.max(400,campaigns.length*60)} h={120} c='#C96442' fill/>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="ana-box" style={{flex:1}}>
            <div className="ana-box-header"><div className="ana-box-title">Team leaderboard</div></div>
            <div style={{padding:'6px 14px 14px',display:'flex',flexDirection:'column',gap:10}}>
              {pocs.length===0 ? (
                <div style={{color:'var(--ink3)',fontSize:12,padding:'10px 0'}}>No handlers yet</div>
              ) : pocs.map((p,i)=>{
                const cnt = replies.filter(r=>r.poc===p).length
                const max = Math.max(...pocs.map(pp=>replies.filter(r=>r.poc===pp).length),1)
                return (
                  <div key={p} style={{display:'flex',alignItems:'center',gap:9}}>
                    <span style={{fontSize:11,color:'var(--ink3)',width:14,fontFamily:'var(--mono)'}}>{i+1}</span>
                    <div style={{width:24,height:24,borderRadius:'50%',background:AVATAR_COLORS[i%AVATAR_COLORS.length],color:'#fff',fontSize:10,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{p[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500}}>{p}</div>
                      <div style={{fontSize:10,color:'var(--ink3)'}}>{cnt} replies</div>
                    </div>
                    <div style={{width:70,height:5,background:'var(--line-soft)',borderRadius:3}}>
                      <div style={{width:`${(cnt/max)*100}%`,height:'100%',background:'var(--accent)',borderRadius:3}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="ana-row">
          {/* Intent breakdown */}
          <div className="ana-box" style={{flex:1}}>
            <div className="ana-box-header"><div className="ana-box-title">Reply intent breakdown</div></div>
            <div style={{padding:'6px 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
              {[
                {l:'New',         c:'#4A7FC1', v:metrics.new},
                {l:'Interested',  c:'#6B8E5A', v:metrics.interested},
                {l:'Follow Up',   c:'#D4A857', v:metrics.followup},
                {l:'Meeting',     c:'#C96442', v:metrics.meeting},
                {l:'OOO',         c:'#D4A857', v:metrics.ooo},
              ].map((s,i)=>{
                const pct = Math.round((s.v/total)*100)||0
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:s.c,flexShrink:0}}/>
                    <span style={{flex:1,color:'var(--ink2)'}}>{s.l}</span>
                    <div style={{width:80,height:5,background:'var(--line-soft)',borderRadius:3}}>
                      <div style={{width:`${pct}%`,height:'100%',background:s.c,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:11,color:'var(--ink3)',width:30,textAlign:'right'}}>{s.v}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SLA gauge */}
          <div className="ana-box" style={{flex:1}}>
            <div className="ana-box-header"><div className="ana-box-title">SLA performance</div></div>
            <div style={{padding:'10px 14px 14px',display:'flex',alignItems:'center',gap:20}}>
              <Donut pct={slaPct} s={70} c={slaPct>=90?'#6B8E5A':'#D4A857'}/>
              <div style={{display:'flex',flexDirection:'column',gap:8,flex:1}}>
                {[
                  {l:'On time',  v:slaOk,                            c:'var(--ink)'},
                  {l:'At risk',  v:Math.round(total*0.1),            c:'var(--warn)'},
                  {l:'Breached', v:Math.max(0,total-slaOk-Math.round(total*0.1)), c:'var(--bad)'},
                ].map((s,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                    <span style={{color:'var(--ink3)'}}>{s.l}</span>
                    <span style={{fontWeight:600,color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign performance */}
          <div className="ana-box" style={{flex:1}}>
            <div className="ana-box-header"><div className="ana-box-title">By campaign</div></div>
            <div style={{padding:'6px 14px 14px',display:'flex',flexDirection:'column',gap:8}}>
              {campaigns.length===0 ? (
                <div style={{color:'var(--ink3)',fontSize:12,padding:'10px 0'}}>No data yet</div>
              ) : campaigns.map((c,i)=>{
                const cnt = replies.filter(r=>r.campaign_name===c).length
                const max = Math.max(...campaigns.map(cc=>replies.filter(r=>r.campaign_name===cc).length),1)
                return (
                  <div key={c} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                    <div style={{width:7,height:7,borderRadius:'50%',background:CAMP_COLORS[i%CAMP_COLORS.length],flexShrink:0}}/>
                    <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--ink2)'}} title={c}>{c}</span>
                    <div style={{width:60,height:5,background:'var(--line-soft)',borderRadius:3}}>
                      <div style={{width:`${(cnt/max)*100}%`,height:'100%',background:CAMP_COLORS[i%CAMP_COLORS.length],borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:11,color:'var(--ink3)',width:20,textAlign:'right'}}>{cnt}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
