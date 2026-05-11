import { useState } from 'react'
import './Mapping.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']

export default function Mapping({ campaigns, pocs, replies }) {
  const [mappings, setMappings] = useState(() => {
    const m = {}
    campaigns.forEach(c => {
      const r = replies.find(r=>r.campaign_name===c)
      m[c] = { primary: r?.poc||'Unassigned', fallback:'', sla:'2h' }
    })
    return m
  })
  const [saved, setSaved] = useState(false)

  const update = (camp, key, val) => {
    setMappings(m => ({...m, [camp]: {...m[camp], [key]:val}}))
    setSaved(false)
  }

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2500) }

  return (
    <div className="map-wrap">
      <div className="map-header">
        <div>
          <div className="map-title">Routing rules</div>
          <div className="map-sub">Who handles replies from each campaign</div>
        </div>
        <button className={`map-save ${saved?'saved':''}`} onClick={save}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div className="map-body">
        {campaigns.length === 0 ? (
          <div className="map-empty">
            <div>No campaigns yet</div>
            <div style={{fontSize:12,color:'var(--ink3)',marginTop:4}}>Campaigns will appear here once replies are received from Instantly</div>
          </div>
        ) : (
          <div className="map-table">
            <div className="map-thead">
              <div className="map-th" style={{flex:3}}>Campaign</div>
              <div className="map-th" style={{flex:2}}>Primary owner</div>
              <div className="map-th" style={{flex:2}}>Fallback (if OOO)</div>
              <div className="map-th" style={{flex:2}}>Interested → escalate to</div>
              <div className="map-th" style={{width:80,textAlign:'right'}}>SLA</div>
            </div>

            {campaigns.map((c,i) => {
              const count = replies.filter(r=>r.campaign_name===c).length
              const m = mappings[c] || {primary:'',fallback:'',sla:'2h'}
              return (
                <div key={c} className="map-row">
                  <div style={{flex:3,display:'flex',alignItems:'center',gap:9}}>
                    <div className="map-dot" style={{background:CAMP_COLORS[i%CAMP_COLORS.length]}}/>
                    <div>
                      <div style={{fontSize:12.5,fontWeight:500}}>{c}</div>
                      <div style={{fontSize:10.5,color:'var(--ink3)'}}>{count} replies waiting</div>
                    </div>
                  </div>
                  <div style={{flex:2}}>
                    <select className="map-select" value={m.primary} onChange={e=>update(c,'primary',e.target.value)}>
                      <option value="">— assign —</option>
                      {pocs.map(p=><option key={p} value={p}>{p}</option>)}
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>
                  <div style={{flex:2}}>
                    <select className="map-select dashed" value={m.fallback} onChange={e=>update(c,'fallback',e.target.value)}>
                      <option value="">— none —</option>
                      {pocs.map(p=><option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{flex:2}}>
                    <select className="map-select" value="" onChange={()=>{}}>
                      <option value="">— same owner —</option>
                      {pocs.map(p=><option key={p} value={p}>{p} (manager)</option>)}
                    </select>
                  </div>
                  <div style={{width:80,textAlign:'right'}}>
                    <select className="map-select" value={m.sla} onChange={e=>update(c,'sla',e.target.value)} style={{width:60,textAlign:'right'}}>
                      {['1h','2h','4h','8h','24h'].map(v=><option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="map-default">
          <span className="map-default-pill">Default</span>
          <span style={{fontSize:12,color:'var(--ink2)'}}>
            Anything not matched above routes to{' '}
            <select className="map-select-inline">
              {pocs.map(p=><option key={p}>{p}</option>)}
              <option>Unassigned</option>
            </select>
          </span>
        </div>
      </div>
    </div>
  )
}
