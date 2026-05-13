import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './AdminPanel.css'

const AVATAR_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C','#C49250','#4A7FC1']
const CAMP_COLORS   = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C']
const SLA_OPTIONS   = ['30m','1h','2h','4h','8h','24h']

function av(name, list) {
  const i = (list||[]).indexOf(name)
  return AVATAR_COLORS[i >= 0 ? i % AVATAR_COLORS.length : Math.abs(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function initials(name) {
  return (name||'?').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()
}

// ── Multi-select chip for assigning multiple POCs ──
function MultiAssign({ campName, allHandlers, assignments, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const assigned = assignments[campName] || []

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const toggle = (name) => {
    const cur = assignments[campName] || []
    const next = cur.includes(name) ? cur.filter(n=>n!==name) : [...cur, name]
    onChange(campName, next)
  }

  return (
    <div className="ma-wrap" ref={ref}>
      <button className="ma-btn" onClick={() => setOpen(o=>!o)}>
        {assigned.length === 0 ? (
          <span className="ma-empty">+ Assign handlers</span>
        ) : (
          <div className="ma-chips">
            {assigned.map(n => (
              <span key={n} className="ma-chip" style={{ background: av(n, allHandlers)+'20', borderColor: av(n, allHandlers)+'40' }}>
                <div className="ma-chip-av" style={{ background: av(n, allHandlers) }}>{initials(n)}</div>
                {n}
              </span>
            ))}
          </div>
        )}
        <span className="ma-caret">▾</span>
      </button>

      {open && (
        <div className="ma-menu">
          {allHandlers.length === 0 ? (
            <div className="ma-no-handlers">No handlers yet. Add handlers below.</div>
          ) : allHandlers.map(h => (
            <button key={h} className={`ma-opt ${assigned.includes(h)?'active':''}`}
              onClick={() => toggle(h)}>
              <div className="ma-opt-av" style={{ background: av(h, allHandlers) }}>{initials(h)}</div>
              <span>{h}</span>
              {assigned.includes(h) && <span className="ma-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PIN editor ──
function PinEditor({ handler, currentPin, onSave }) {
  const [editing, setEditing] = useState(false)
  const [pin, setPin]         = useState(currentPin || '0000')
  const [saved, setSaved]     = useState(false)

  const save = async () => {
    await onSave(handler.id, pin)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!editing) return (
    <div className="pin-display">
      <span className="pin-dots">{'●●●●'.slice(0, (currentPin||'0000').length)}</span>
      <button className="pin-edit-btn" onClick={() => { setPin(currentPin||'0000'); setEditing(true) }}>
        Edit PIN
      </button>
      {saved && <span className="pin-saved">✓</span>}
    </div>
  )

  return (
    <div className="pin-edit-row">
      <input
        className="pin-input"
        value={pin}
        onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
        maxLength={4}
        placeholder="4-digit PIN"
        type="password"
      />
      <button className="pin-save-btn" onClick={save} disabled={pin.length !== 4}>Save</button>
      <button className="pin-cancel-btn" onClick={() => setEditing(false)}>✕</button>
    </div>
  )
}

// ── Main Admin Panel ──
export default function AdminPanel({ campaigns, replies, isAdmin }) {
  const [tab,          setTab]          = useState('campaigns')
  const [handlers,     setHandlers]     = useState([])
  const [assignments,  setAssignments]  = useState({}) // campName → [pocName]
  const [slaMap,       setSlaMap]       = useState({})
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [newHandler,   setNewHandler]   = useState({ name:'', email:'', role:'POC', pin:'0000', color:'#7A8C99' })
  const [adding,       setAdding]       = useState(false)
  const [colorPick,    setColorPick]    = useState(false)

  useEffect(() => { if (isAdmin) loadData() }, [campaigns.join(',')])

  const loadData = async () => {
    // Load handlers from poc_profiles
    const { data: pocData } = await supabase.from('poc_profiles').select('*').order('name')
    if (pocData) setHandlers(pocData)

    // Load campaign assignments
    const { data: assignData } = await supabase.from('campaign_routing').select('*')
    const aMap = {}, sMap = {}
    campaigns.forEach(c => {
      const found = assignData?.find(r => r.campaign_name === c)
      // Support multiple POCs stored as comma-separated
      const pocs = found?.primary_poc
        ? found.primary_poc.split(',').map(s=>s.trim()).filter(Boolean)
        : []
      aMap[c]  = pocs
      sMap[c]  = found?.sla_hours || '2h'
    })
    setAssignments(aMap)
    setSlaMap(sMap)
  }

  const saveAssignments = async () => {
    setSaving(true)
    for (const campName of campaigns) {
      const pocs    = assignments[campName] || []
      const primary = pocs.join(', ')
      await supabase.from('campaign_routing').upsert({
        campaign_name: campName,
        primary_poc:   primary,
        sla_hours:     slaMap[campName] || '2h',
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'campaign_name' })
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const updateAssignment = (camp, pocs) => {
    setAssignments(a => ({...a, [camp]: pocs}))
    setSaved(false)
  }

  const addHandler = async () => {
    if (!newHandler.name.trim()) return
    const exists = handlers.some(h => h.name.toLowerCase() === newHandler.name.trim().toLowerCase())
    if (exists) { alert('Handler already exists'); return }
    setAdding(true)
    const { data } = await supabase.from('poc_profiles')
      .insert({ name:newHandler.name.trim(), email:newHandler.email.trim(), role:newHandler.role, pin:newHandler.pin, color:newHandler.color })
      .select().single()
    if (data) setHandlers(prev => [...prev, data])
    setNewHandler({ name:'', email:'', role:'POC', pin:'0000', color:'#7A8C99' })
    setShowAddForm(false)
    setAdding(false)
  }

  const removeHandler = async (id, name) => {
    if (!window.confirm(`Remove ${name}? They will lose access to the dashboard.`)) return
    await supabase.from('poc_profiles').delete().eq('id', id)
    setHandlers(prev => prev.filter(h => h.id !== id))
  }

  const updatePin = async (id, pin) => {
    await supabase.from('poc_profiles').update({ pin }).eq('id', id)
    setHandlers(prev => prev.map(h => h.id===id ? {...h, pin} : h))
  }

  const updateHandlerColor = async (id, color) => {
    await supabase.from('poc_profiles').update({ color }).eq('id', id)
    setHandlers(prev => prev.map(h => h.id===id ? {...h, color} : h))
  }

  const handlerNames = handlers.map(h => h.name)

  if (!isAdmin) return (
    <div className="ap-no-access">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div>Admin access only</div>
      <div style={{fontSize:12,color:'var(--ink3)'}}>Only Alok Singh (Admin) can access this panel.</div>
    </div>
  )

  return (
    <div className="ap-wrap">
      {/* Header */}
      <div className="ap-header">
        <div>
          <div className="ap-title">Admin Panel</div>
          <div className="ap-sub">Manage handlers, campaign assignments, and access control</div>
        </div>
        {tab === 'campaigns' && (
          <button className={`ap-save ${saved?'saved':''}`} onClick={saveAssignments} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="ap-tabs">
        {[
          { id:'campaigns', label:'Campaign assignments' },
          { id:'handlers',  label:'Handlers & access' },
        ].map(t => (
          <button key={t.id}
            className={`ap-tab ${tab===t.id?'active':''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="ap-body">

        {/* ── Campaign assignments tab ── */}
        {tab === 'campaigns' && (
          <div className="ap-section">
            <div className="ap-section-desc">
              Assign one or multiple handlers to each campaign. Handlers only see replies from their assigned campaigns.
            </div>

            {campaigns.length === 0 ? (
              <div className="ap-empty">No campaigns yet. Replies will appear here once received from Instantly.</div>
            ) : (
              <div className="ap-camp-table">
                <div className="ap-camp-thead">
                  <div style={{flex:3}}>Campaign</div>
                  <div style={{flex:4}}>Assigned handlers</div>
                  <div style={{width:80,textAlign:'right'}}>SLA target</div>
                </div>

                {campaigns.map((c, i) => {
                  const count = replies.filter(r=>r.campaign_name===c).length
                  return (
                    <div key={c} className="ap-camp-row">
                      <div style={{flex:3, display:'flex', alignItems:'center', gap:10}}>
                        <div style={{width:10, height:10, borderRadius:'50%', background:CAMP_COLORS[i%CAMP_COLORS.length], flexShrink:0}}/>
                        <div>
                          <div style={{fontSize:13, fontWeight:500}}>{c}</div>
                          <div style={{fontSize:11, color:'var(--ink3)'}}>{count} replies</div>
                        </div>
                      </div>
                      <div style={{flex:4}}>
                        <MultiAssign
                          campName={c}
                          allHandlers={handlerNames}
                          assignments={assignments}
                          onChange={updateAssignment}
                        />
                      </div>
                      <div style={{width:80, display:'flex', justifyContent:'flex-end'}}>
                        <select className="ap-sla"
                          value={slaMap[c]||'2h'}
                          onChange={e => { setSlaMap(m=>({...m,[c]:e.target.value})); setSaved(false) }}>
                          {SLA_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Note about data isolation */}
            <div className="ap-info-box">
              <span>ℹ️</span>
              <span>Each handler only sees replies from their assigned campaigns when they log in. Admin sees everything.</span>
            </div>
          </div>
        )}

        {/* ── Handlers & access tab ── */}
        {tab === 'handlers' && (
          <div className="ap-section">
            <div className="ap-section-header">
              <div className="ap-section-desc">
                Manage who can log in, their PIN codes, and their roles.
              </div>
              <button className="ap-add-btn" onClick={() => setShowAddForm(true)}>
                + Add handler
              </button>
            </div>

            {/* Add handler form */}
            {showAddForm && (
              <div className="ap-add-form">
                <div className="ap-add-form-title">New handler</div>
                <div className="ap-add-fields">
                  <div className="ap-field">
                    <label className="ap-label">Full name *</label>
                    <input className="ap-input" placeholder="e.g. Arpit Mehta"
                      value={newHandler.name}
                      onChange={e => setNewHandler(h=>({...h,name:e.target.value}))}/>
                  </div>
                  <div className="ap-field">
                    <label className="ap-label">Email</label>
                    <input className="ap-input" placeholder="arpit@consultadd.org" type="email"
                      value={newHandler.email}
                      onChange={e => setNewHandler(h=>({...h,email:e.target.value}))}/>
                  </div>
                  <div className="ap-field">
                    <label className="ap-label">Role</label>
                    <select className="ap-input" value={newHandler.role}
                      onChange={e => setNewHandler(h=>({...h,role:e.target.value}))}>
                      <option>POC</option><option>SDR</option><option>AE</option><option>Manager</option>
                    </select>
                  </div>
                  <div className="ap-field">
                    <label className="ap-label">Login PIN (4 digits)</label>
                    <input className="ap-input" placeholder="0000" maxLength={4}
                      value={newHandler.pin} type="password"
                      onChange={e => setNewHandler(h=>({...h,pin:e.target.value.replace(/\D/g,'').slice(0,4)}))}/>
                  </div>
                  <div className="ap-field">
                    <label className="ap-label">Avatar color</label>
                    <div className="ap-color-row">
                      {AVATAR_COLORS.map(c => (
                        <button key={c} className={`ap-color-dot ${newHandler.color===c?'active':''}`}
                          style={{background:c}}
                          onClick={() => setNewHandler(h=>({...h,color:c}))}/>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8,marginTop:14}}>
                  <button className="ap-save" onClick={addHandler}
                    disabled={adding||!newHandler.name.trim()||newHandler.pin.length!==4}>
                    {adding ? 'Adding…' : 'Add handler'}
                  </button>
                  <button className="ap-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Handlers list */}
            {handlers.length === 0 ? (
              <div className="ap-empty">No handlers yet. Add your first handler above.</div>
            ) : handlers.map((h, i) => (
              <div key={h.id} className="ap-handler-row">
                <div className="ap-handler-left">
                  <div className="ap-handler-av" style={{background: h.color||AVATAR_COLORS[i%AVATAR_COLORS.length]}}>
                    {initials(h.name)}
                  </div>
                  <div>
                    <div className="ap-handler-name">{h.name}</div>
                    <div className="ap-handler-meta">
                      {h.role}
                      {h.email ? ` · ${h.email}` : ''}
                      {' · '}
                      {replies.filter(r=>
                        (assignments[r.campaign_name]||[]).includes(h.name)
                      ).length} assigned replies
                    </div>
                    {/* Show assigned campaigns */}
                    <div className="ap-handler-camps">
                      {campaigns.filter(c=>(assignments[c]||[]).includes(h.name)).map(c=>(
                        <span key={c} className="ap-camp-tag">{c}</span>
                      ))}
                      {campaigns.filter(c=>(assignments[c]||[]).includes(h.name)).length === 0 && (
                        <span style={{fontSize:11,color:'var(--ink3)',fontStyle:'italic'}}>No campaigns assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ap-handler-right">
                  {/* Color picker */}
                  <div className="ap-color-picker-wrap">
                    <div style={{display:'flex',gap:4,flexWrap:'wrap',maxWidth:140}}>
                      {AVATAR_COLORS.map(c=>(
                        <button key={c}
                          className={`ap-color-dot sm ${h.color===c?'active':''}`}
                          style={{background:c}}
                          onClick={() => updateHandlerColor(h.id, c)}/>
                      ))}
                    </div>
                  </div>

                  {/* PIN editor */}
                  <PinEditor handler={h} currentPin={h.pin} onSave={updatePin}/>

                  {/* Remove */}
                  <button className="ap-remove-btn" onClick={() => removeHandler(h.id, h.name)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
