import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { getSession, setSession, clearSession, isAdmin } from './lib/auth'
import Login from './components/Login.jsx'
import Sidebar from './components/Sidebar.jsx'
import Inbox from './components/Inbox.jsx'
import Dashboard from './components/Dashboard.jsx'
import MyReplies from './components/MyReplies.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import Mapping from './components/Mapping.jsx'
import Analytics from './components/Analytics.jsx'
import './App.css'
import Landing from './components/Landing.jsx'
import Landing from './components/Landing.jsx'

const STATUS_OPTIONS = ['New','Interested','Meeting','OOO','Nurture','Unsubscribe','Follow Up','Replied']

export default function App() {
  const [session,   setSessionState] = useState(null)
  const [authReady, setAuthReady]    = useState(false)
  const [view,      setView]         = useState('inbox')
  const [replies,   setReplies]      = useState([])
  const [loading,   setLoading]      = useState(true)
  const [error,     setError]        = useState(null)
  const [selected,  setSelected]     = useState(null)
  const [filters,   setFilters]      = useState({ campaign:'', status:'', poc:'', search:'' })
  const [campaigns,    setCampaigns]    = useState([])
  const [pocs,         setPocs]         = useState([])
  const [allHandlers,  setAllHandlers]  = useState([])

  useEffect(() => {
    const s = getSession()
    if (s) setSessionState(s)
    setAuthReady(true)
  }, [])

  const handleLogin  = (user) => { setSession(user); setSessionState(user) }
  const handleLogout = () => {
    clearSession(); setSessionState(null)
    setReplies([]); setSelected(null); setCampaigns([]); setPocs([])
  }

  const admin   = isAdmin(session)
  const pocName = session?.name

  // Load all handlers from poc_profiles (for reassign dropdown + sidebar)
  const fetchHandlers = useCallback(async () => {
    const { data } = await supabase.from('poc_profiles').select('name, color').order('name')
    if (data) setAllHandlers(data.map(h => h.name).filter(Boolean))
  }, [])

  const fetchReplies = useCallback(async () => {
    if (!session) return
    try {
      setLoading(true)
      let query = supabase.from('instantly_replies').select('*')
        .order('created_at', { ascending: false }).limit(500)

      // POC — fetch only their campaign replies
      // We check campaign_routing to find their campaigns
      if (!admin) {
        const { data: routes } = await supabase
          .from('campaign_routing').select('campaign_name, primary_poc')
        const myCampaigns = (routes||[])
          .filter(r => r.primary_poc && r.primary_poc.split(',').map(s=>s.trim()).includes(pocName))
          .map(r => r.campaign_name)
        if (myCampaigns.length > 0) {
          query = query.in('campaign_name', myCampaigns)
        } else {
          // Fallback: filter by poc field
          query = query.eq('poc', pocName)
        }
      }

      const { data, error } = await query
      if (error) throw error
      setReplies(data || [])
      setCampaigns([...new Set((data||[]).map(r=>r.campaign_name).filter(Boolean))])
      setPocs([...new Set((data||[]).map(r=>r.poc).filter(Boolean))])
      setError(null)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [session, admin, pocName, fetchHandlers])

  useEffect(() => {
    if (!session) return
    fetchReplies()
    fetchHandlers()
    const ch = supabase.channel('rt_main')
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'instantly_replies'}, p => {
        if (!admin && p.new.poc !== pocName) return
        setReplies(prev=>[p.new,...prev])
        setCampaigns(prev=>[...new Set([...prev,p.new.campaign_name].filter(Boolean))])
        setPocs(prev=>[...new Set([...prev,p.new.poc].filter(Boolean))])
      })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'instantly_replies'}, p => {
        setReplies(prev=>prev.map(r=>r.id===p.new.id?p.new:r))
        if(selected?.id===p.new.id) setSelected(p.new)
      })
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'instantly_replies'}, p => {
        setReplies(prev=>prev.filter(r=>r.id!==p.old.id))
        if(selected?.id===p.old.id) setSelected(null)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [session])

  const updateStatus = async (id, status) => {
    await supabase.from('instantly_replies').update({status}).eq('id',id)
    setReplies(prev=>prev.map(r=>r.id===id?{...r,status}:r))
    if(selected?.id===id) setSelected(p=>({...p,status}))
  }
  const updateNotes = async (id, sdr_notes) => {
    await supabase.from('instantly_replies').update({sdr_notes}).eq('id',id)
    setReplies(prev=>prev.map(r=>r.id===id?{...r,sdr_notes}:r))
    if(selected?.id===id) setSelected(p=>({...p,sdr_notes}))
  }

  // Reassign handler
  const reassignReply = async (id, newPoc) => {
    await supabase.from('instantly_replies').update({poc: newPoc}).eq('id',id)
    setReplies(prev=>prev.map(r=>r.id===id?{...r,poc:newPoc}:r))
    if(selected?.id===id) setSelected(p=>({...p,poc:newPoc}))
  }

  const filtered = replies.filter(r => {
    if(filters.campaign && r.campaign_name!==filters.campaign) return false
    if(filters.status   && r.status!==filters.status)          return false
    if(filters.poc      && r.poc!==filters.poc)                return false
    if(filters.search){
      const q=filters.search.toLowerCase()
      if(!r.lead_email?.toLowerCase().includes(q)&&
         !r.lead_name?.toLowerCase().includes(q)&&
         !r.reply_body?.toLowerCase().includes(q)&&
         !r.campaign_name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const metrics = {
    total:      filtered.length,
    new:        filtered.filter(r=>r.status==='New').length,
    interested: filtered.filter(r=>r.status==='Interested').length,
    meeting:    filtered.filter(r=>r.status==='Meeting').length,
    ooo:        filtered.filter(r=>r.status==='OOO').length,
    followup:   filtered.filter(r=>r.status==='Follow Up').length,
  }

if (!authReady) return null
if (!session)   return <Landing onLogin={handleLogin}/>

  const renderView = () => {
    switch(view) {
      case 'inbox': return (
        <Inbox replies={filtered} loading={loading} error={error}
          selected={selected} onSelect={setSelected}
          onRefresh={fetchReplies} filters={filters} setFilters={setFilters}
          campaigns={campaigns} statusOptions={STATUS_OPTIONS}
          onStatusChange={updateStatus} onNotesChange={updateNotes}
          onReassign={reassignReply}
          metrics={metrics} pocs={allHandlers.length>0?allHandlers:pocs} isAdmin={admin}
        />
      )
      case 'mine': return (
        <MyReplies replies={replies} pocs={pocs} metrics={metrics} onStatusChange={updateStatus}/>
      )
      case 'dashboard': return (
        <Dashboard mode="team" replies={replies} metrics={metrics} campaigns={campaigns}
          pocs={allHandlers.length>0?allHandlers:pocs} isAdmin={admin}
          onViewInbox={c=>{setFilters(f=>({...f,campaign:c}));setView('inbox')}}
        />
      )
      case 'campaigns': return (
        <Dashboard mode="campaigns" replies={replies} metrics={metrics} campaigns={campaigns}
          pocs={pocs}
          onViewInbox={c=>{setFilters(f=>({...f,campaign:c}));setView('inbox')}}
          isAdmin={admin}
        />
      )
      case 'admin': return admin ? (
        <AdminPanel campaigns={campaigns} replies={replies} isAdmin={admin} allHandlers={allHandlers}/>
      ) : (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:10,color:'var(--ink3)'}}>
          <span style={{fontSize:28}}>🔒</span>
          <div style={{fontSize:14,fontWeight:500}}>Admin access only</div>
          <div style={{fontSize:12}}>Only the admin can access this panel.</div>
        </div>
      )
      case 'routing': return admin ? (
        <Mapping campaigns={campaigns} pocs={allHandlers.length>0?allHandlers:pocs} replies={replies}/>
      ) : null
      case 'analytics': return (
        <Analytics replies={replies} metrics={metrics} campaigns={campaigns} pocs={pocs}/>
      )
      default: return null
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        view={view} setView={v=>{setView(v);setSelected(null)}}
        filters={filters} setFilters={setFilters}
        campaigns={campaigns} pocs={admin?(allHandlers.length>0?allHandlers:pocs):[]}
        metrics={metrics} totalReplies={replies.length}
        session={session} onLogout={handleLogout} isAdmin={admin}
      />
      <div className="main-area">{renderView()}</div>
    </div>
  )
}
