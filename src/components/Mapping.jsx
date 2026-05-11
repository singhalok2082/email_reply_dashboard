import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './Mapping.css'

const CAMP_COLORS   = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const AVATAR_COLORS = ['#C96442','#7A8C99','#A98556','#6B8E5A','#9A6B8E','#5A7F8C','#C49250','#5A7F8C']
const SLA_OPTIONS   = ['30m','1h','2h','4h','8h','24h']

function avatarColor(name, list) {
  const i = list.indexOf(name)
  return AVATAR_COLORS[i >= 0 ? i % AVATAR_COLORS.length : 0]
}

// ── Assignee chip with proper dropdown ──────────────────────────────
function AssigneeChip({ value, options, onChange, placeholder, allNames }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const color = value ? avatarColor(value, allNames) : null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = (v) => { onChange(v); setOpen(false) }

  return (
    <div className="chip-wrap" ref={ref}>
      <button className={`chip-btn ${value ? 'has-value' : ''}`}
        style={value ? { borderColor: color+'55', background: color+'14' } : {}}
        onClick={() => setOpen(o => !o)}
      >
        {value ? (
          <>
            <div className="chip-av" style={{ background: color }}>
              {value[0].toUpperCase()}
            </div>
            <span className="chip-name">{value}</span>
          </>
        ) : (
          <span className="chip-empty">{placeholder || '— assign —'}</span>
        )}
        <span className="chip-caret">▾</span>
      </button>

      {open && (
        <div className="chip-menu">
          <button className="chip-opt none-opt" onClick={() => select('')}>
            — none —
          </button>
          {options.map(o => (
            <button key={o} className={`chip-opt ${value===o?'active':''}`}
              onClick={() => select(o)}>
              <div className="chip-av sm" style={{ background: avatarColor(o, allNames) }}>
                {o[0].toUpperCase()}
              </div>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Mapping({ campaigns, pocs, replies }) {
  const [team,      setTeam]      = useState([])
  const [rules,     setRules]     = useState({})
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newMember, setNewMember] = useState({ name:'', email:'', role:'SDR' })
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => { loadData() }, [campaigns.join(',')])

  const loadData = async () => {
    // Load team — deduplicate by name
    const { data: teamData } = await supabase
      .from('team_members').select('*').order('created_at')
    if (teamData) {
      const seen = new Set()
      setTeam(teamData.filter(m => {
        if (seen.has(m.name)) return false
        seen.add(m.name); return true
      }))
    }

    // Load routing rules
    const { data: routingData } = await supabase.from('campaign_routing').select('*')
    const r = {}
    campaigns.forEach(c => {
      const found = routingData?.find(row => row.campaign_name === c)
      const defPoc = replies.find(rep => rep.campaign_name === c)?.poc || ''
      r[c] = {
        primary_poc:  found?.primary_poc  || defPoc,
        fallback_poc: found?.fallback_poc || '',
        escalate_to:  found?.escalate_to  || '',
        sla_hours:    found?.sla_hours    || '2h',
      }
    })
    setRules(r)
  }

  const updateRule = (camp, key, val) => {
    setRules(r => ({ ...r, [camp]: { ...r[camp], [key]: val } }))
    setSaved(false)
  }

  const saveRules = async () => {
    setSaving(true)
    for (const [campaign_name, rule] of Object.entries(rules)) {
      await supabase.from('campaign_routing').upsert({
        campaign_name,
        primary_poc:  rule.primary_poc,
        fallback_poc: rule.fallback_poc,
        escalate_to:  rule.escalate_to,
        sla_hours:    rule.sla_hours,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'campaign_name' })
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const addMember = async () => {
    if (!newMember.name.trim()) return
    setAddingMember(true)
    // Check for duplicate
    const exists = team.some(m => m.name.toLowerCase() === newMember.name.trim().toLowerCase())
    if (exists) { alert('Team member already exists'); setAddingMember(false); return }

    const { data } = await supabase.from('team_members')
      .insert({ name: newMember.name.trim(), email: newMember.email.trim(), role: newMember.role })
      .select().single()
    if (data) setTeam(prev => [...prev, data])
    setNewMember({ name:'', email:'', role:'SDR' })
    setShowAdd(false)
    setAddingMember(false)
  }

  const deleteMember = async (id, name) => {
    if (!window.confirm(`Remove ${name} from team?`)) return
    await supabase.from('team_members').delete().eq('id', id)
    setTeam(prev => prev.filter(m => m.id !== id))
  }

  // All unique member names (team + any poc from replies not yet in team)
  const teamNames = team.map(t => t.name)
  const extraPocs = pocs.filter(p => !teamNames.includes(p))
  const allMembers = [...new Set([...teamNames, ...extraPocs])]

  return (
    <div className="map-wrap">
      {/* Topbar */}
      <div className="map-topbar">
        <div className="map-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span style={{ fontSize:12, color:'var(--ink3)' }}>Search replies, people, campaigns…</span>
        </div>
        <div style={{ flex:1 }}/>
        <button className="map-pill dashed">+ Add campaign</button>
        <button className="map-pill">Help</button>
      </div>

      <div className="map-body">
        {/* Page heading */}
        <div className="map-ph">
          <div>
            <div className="map-ph-title">Routing rules</div>
            <div className="map-ph-sub">Who handles replies from each campaign</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button className="map-pill dashed" onClick={() => setShowAdd(true)}>+ Add member</button>
            <button className={`map-save-btn ${saved?'saved':''}`} onClick={saveRules} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Routing table */}
        <div className="map-table">
          <div className="map-thead">
            <div style={{flex:3}}>Campaign</div>
            <div style={{flex:2}}>Primary owner</div>
            <div style={{flex:2}}>Fallback (if OOO)</div>
            <div style={{flex:2}}>Interested → escalate to</div>
            <div style={{width:80,textAlign:'right'}}>SLA</div>
          </div>

          {campaigns.length === 0 ? (
            <div className="map-empty">No campaigns yet — they appear when Instantly sends replies.</div>
          ) : campaigns.map((c, i) => {
            const rule  = rules[c] || { primary_poc:'', fallback_poc:'', escalate_to:'', sla_hours:'2h' }
            const count = replies.filter(r => r.campaign_name === c).length
            return (
              <div key={c} className="map-row">
                <div style={{flex:3, display:'flex', alignItems:'center', gap:10}}>
                  <div className="map-camp-dot" style={{background: CAMP_COLORS[i%CAMP_COLORS.length]}}/>
                  <div>
                    <div style={{fontSize:13, fontWeight:500}}>{c}</div>
                    <div style={{fontSize:11, color:'var(--ink3)'}}>{count} replies waiting</div>
                  </div>
                </div>
                <div style={{flex:2}}>
                  <AssigneeChip value={rule.primary_poc} options={allMembers}
                    onChange={v => updateRule(c,'primary_poc',v)}
                    placeholder="— assign —" allNames={allMembers}/>
                </div>
                <div style={{flex:2}}>
                  <AssigneeChip value={rule.fallback_poc} options={allMembers}
                    onChange={v => updateRule(c,'fallback_poc',v)}
                    placeholder="none" allNames={allMembers}/>
                </div>
                <div style={{flex:2}}>
                  <AssigneeChip value={rule.escalate_to} options={allMembers}
                    onChange={v => updateRule(c,'escalate_to',v)}
                    placeholder="same owner" allNames={allMembers}/>
                </div>
                <div style={{width:80, display:'flex', justifyContent:'flex-end'}}>
                  <select className="map-sla-sel" value={rule.sla_hours}
                    onChange={e => updateRule(c,'sla_hours',e.target.value)}>
                    {SLA_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {/* Default row */}
        <div className="map-default-row">
          <span className="map-default-label">Default</span>
          <span style={{fontSize:13, color:'var(--ink2)'}}>
            Anything not matched above routes to{' '}
            <strong style={{color:'var(--ink)'}}>{allMembers[0] || 'Unassigned'}</strong>
          </span>
        </div>

        {/* Add member form */}
        {showAdd && (
          <div className="map-team-box">
            <div style={{fontSize:13, fontWeight:600, marginBottom:12}}>Add team member</div>
            <div className="map-add-form">
              <input className="map-input" placeholder="Full name *"
                value={newMember.name}
                onChange={e => setNewMember(m => ({...m, name:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && addMember()}
              />
              <input className="map-input" placeholder="Email (optional)"
                value={newMember.email}
                onChange={e => setNewMember(m => ({...m, email:e.target.value}))}
              />
              <select className="map-sla-sel" style={{height:34, padding:'0 8px', width:'auto'}}
                value={newMember.role}
                onChange={e => setNewMember(m => ({...m, role:e.target.value}))}>
                <option>SDR</option><option>AE</option><option>Manager</option><option>POC</option>
              </select>
              <button className="map-save-btn" onClick={addMember} disabled={addingMember||!newMember.name.trim()}>
                {addingMember ? 'Adding…' : 'Add'}
              </button>
              <button className="map-pill" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Team members list */}
        {team.length > 0 && (
          <div className="map-team-box">
            <div className="map-team-header">
              <div style={{fontSize:13, fontWeight:600}}>Team members</div>
              <button className="map-pill dashed" onClick={() => setShowAdd(true)}>+ Add</button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {team.map((m, i) => (
                <div key={m.id} style={{display:'flex', alignItems:'center', gap:10}}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%',
                    background: AVATAR_COLORS[i%AVATAR_COLORS.length],
                    color:'#fff', fontSize:13, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                  }}>
                    {m.name[0].toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:500}}>{m.name}</div>
                    <div style={{fontSize:11, color:'var(--ink3)'}}>
                      {m.role}{m.email ? ` · ${m.email}` : ''}
                      {' · '}{replies.filter(r=>r.poc===m.name).length} assigned replies
                    </div>
                  </div>
                  <button className="map-del-btn" onClick={() => deleteMember(m.id, m.name)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
