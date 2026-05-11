import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Mapping.css'

const CAMP_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const SLA_OPTIONS = ['30m','1h','2h','4h','8h','24h']

export default function Mapping({ campaigns, pocs, replies }) {
  const [team, setTeam]         = useState([])
  const [rules, setRules]       = useState({})
  const [saving, setSaving]     = useState(false)
  const [saved,  setSaved]      = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember]         = useState({ name:'', email:'', role:'SDR' })
  const [addingMember, setAddingMember]   = useState(false)

  // Load team members + routing rules from Supabase
  useEffect(() => {
    loadData()
  }, [campaigns])

  const loadData = async () => {
    // Load team
    const { data: teamData } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at')
    if (teamData) setTeam(teamData)

    // Load routing rules
    const { data: routingData } = await supabase
      .from('campaign_routing')
      .select('*')
    if (routingData) {
      const r = {}
      routingData.forEach(row => {
        r[row.campaign_name] = {
          primary_poc:  row.primary_poc  || '',
          fallback_poc: row.fallback_poc || '',
          escalate_to:  row.escalate_to  || '',
          sla_hours:    row.sla_hours    || '2h',
        }
      })
      // Fill in defaults for campaigns not yet in rules
      campaigns.forEach(c => {
        if (!r[c]) {
          const defaultPoc = replies.find(rep=>rep.campaign_name===c)?.poc || ''
          r[c] = { primary_poc:defaultPoc, fallback_poc:'', escalate_to:'', sla_hours:'2h' }
        }
      })
      setRules(r)
    } else {
      // No rules yet — set defaults
      const r = {}
      campaigns.forEach(c => {
        const defaultPoc = replies.find(rep=>rep.campaign_name===c)?.poc || ''
        r[c] = { primary_poc:defaultPoc, fallback_poc:'', escalate_to:'', sla_hours:'2h' }
      })
      setRules(r)
    }
  }

  const updateRule = (camp, key, val) => {
    setRules(r => ({...r, [camp]: {...r[camp], [key]:val}}))
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
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const addMember = async () => {
    if (!newMember.name.trim()) return
    setAddingMember(true)
    const { data } = await supabase
      .from('team_members')
      .insert({ name:newMember.name.trim(), email:newMember.email.trim(), role:newMember.role })
      .select()
      .single()
    if (data) setTeam(prev => [...prev, data])
    setNewMember({ name:'', email:'', role:'SDR' })
    setShowAddMember(false)
    setAddingMember(false)
  }

  const deleteMember = async (id) => {
    if (!window.confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    setTeam(prev => prev.filter(m => m.id !== id))
  }

  const allMembers = [...new Set([...team.map(t=>t.name), ...pocs])]

  return (
    <div className="map-wrap">
      {/* Header */}
      <div className="map-header">
        <div>
          <div className="map-title">Routing rules</div>
          <div className="map-sub">Who handles replies from each campaign</div>
        </div>
        <button
          className={`map-save-btn ${saved?'saved':''}`}
          onClick={saveRules}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>

      <div className="map-body">
        {/* Routing table */}
        <div className="map-table">
          <div className="map-thead">
            <div style={{flex:3}}>Campaign</div>
            <div style={{flex:2}}>Primary owner</div>
            <div style={{flex:2}}>Fallback (if OOO)</div>
            <div style={{flex:2}}>Interested → escalate to</div>
            <div style={{width:90,textAlign:'right'}}>SLA</div>
            <div style={{width:32}}/>
          </div>

          {campaigns.length === 0 ? (
            <div className="map-empty">
              No campaigns yet — they appear automatically when Instantly sends replies.
            </div>
          ) : campaigns.map((c,i) => {
            const rule = rules[c] || { primary_poc:'', fallback_poc:'', escalate_to:'', sla_hours:'2h' }
            const count = replies.filter(r=>r.campaign_name===c).length
            return (
              <div key={c} className="map-row">
                <div style={{flex:3,display:'flex',alignItems:'center',gap:9}}>
                  <div style={{width:9,height:9,borderRadius:'50%',background:CAMP_COLORS[i%CAMP_COLORS.length],flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:500}}>{c}</div>
                    <div style={{fontSize:10.5,color:'var(--ink3)'}}>{count} replies waiting</div>
                  </div>
                </div>
                <div style={{flex:2}}>
                  <select
                    className="map-sel"
                    value={rule.primary_poc}
                    onChange={e=>updateRule(c,'primary_poc',e.target.value)}
                  >
                    <option value="">— assign —</option>
                    {allMembers.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{flex:2}}>
                  <select
                    className="map-sel dashed"
                    value={rule.fallback_poc}
                    onChange={e=>updateRule(c,'fallback_poc',e.target.value)}
                  >
                    <option value="">— none —</option>
                    {allMembers.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{flex:2}}>
                  <select
                    className="map-sel"
                    value={rule.escalate_to}
                    onChange={e=>updateRule(c,'escalate_to',e.target.value)}
                  >
                    <option value="">— same owner —</option>
                    {allMembers.map(m=><option key={m} value={m}>{m} (escalate)</option>)}
                  </select>
                </div>
                <div style={{width:90,display:'flex',justifyContent:'flex-end'}}>
                  <select
                    className="map-sel"
                    style={{width:72}}
                    value={rule.sla_hours}
                    onChange={e=>updateRule(c,'sla_hours',e.target.value)}
                  >
                    {SLA_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{width:32,display:'flex',justifyContent:'center'}}>
                  {/* placeholder for future per-row actions */}
                </div>
              </div>
            )
          })}
        </div>

        {/* Default rule */}
        <div className="map-default">
          <span className="map-default-label">Default</span>
          <span style={{fontSize:12,color:'var(--ink2)'}}>
            Anything not matched above routes to{' '}
          </span>
          <select className="map-sel-inline">
            <option value="">— none —</option>
            {allMembers.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Team members section */}
        <div className="map-team-section">
          <div className="map-team-header">
            <div className="map-team-title">Team members</div>
            <button className="map-add-btn" onClick={()=>setShowAddMember(true)}>
              + Add member
            </button>
          </div>

          {/* Add member form */}
          {showAddMember && (
            <div className="map-add-form">
              <input
                className="map-input"
                placeholder="Full name *"
                value={newMember.name}
                onChange={e=>setNewMember(m=>({...m,name:e.target.value}))}
              />
              <input
                className="map-input"
                placeholder="Email (optional)"
                value={newMember.email}
                onChange={e=>setNewMember(m=>({...m,email:e.target.value}))}
              />
              <select
                className="map-sel"
                value={newMember.role}
                onChange={e=>setNewMember(m=>({...m,role:e.target.value}))}
                style={{height:34}}
              >
                <option value="SDR">SDR</option>
                <option value="AE">AE</option>
                <option value="Manager">Manager</option>
                <option value="POC">POC</option>
              </select>
              <div style={{display:'flex',gap:8}}>
                <button
                  className="map-save-btn"
                  onClick={addMember}
                  disabled={addingMember||!newMember.name.trim()}
                >
                  {addingMember ? 'Adding…' : 'Add'}
                </button>
                <button className="map-cancel-btn" onClick={()=>setShowAddMember(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="map-members">
            {team.length === 0 ? (
              <div style={{color:'var(--ink3)',fontSize:12,padding:'10px 0'}}>
                No team members yet. Add members above to assign them to campaigns.
              </div>
            ) : team.map(m => (
              <div key={m.id} className="map-member-row">
                <div className="map-member-av">
                  {m.name[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{m.name}</div>
                  <div style={{fontSize:11,color:'var(--ink3)'}}>
                    {m.role}
                    {m.email && ` · ${m.email}`}
                    {' · '}
                    {replies.filter(r=>r.poc===m.name).length} assigned replies
                  </div>
                </div>
                <button
                  className="map-delete-btn"
                  onClick={()=>deleteMember(m.id)}
                  title="Remove member"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
