import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar.jsx'
import Inbox from './components/Inbox.jsx'
import Dashboard from './components/Dashboard.jsx'
import './App.css'

const STATUS_OPTIONS = ['New', 'Interested', 'Meeting', 'OOO', 'Nurture', 'Unsubscribe', 'Follow Up', 'Replied']

export default function App() {
  const [view, setView]           = useState('inbox')
  const [replies, setReplies]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [filters, setFilters]     = useState({ campaign:'', status:'', poc:'', search:'' })
  const [campaigns, setCampaigns] = useState([])
  const [pocs, setPocs]           = useState([])

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('instantly_replies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      setReplies(data || [])
      setCampaigns([...new Set((data||[]).map(r=>r.campaign_name).filter(Boolean))])
      setPocs([...new Set((data||[]).map(r=>r.poc).filter(Boolean))])
      setError(null)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch()
    const ch = supabase.channel('rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'instantly_replies' }, p => {
        setReplies(prev => [p.new, ...prev])
        setCampaigns(prev => [...new Set([...prev, p.new.campaign_name].filter(Boolean))])
        setPocs(prev => [...new Set([...prev, p.new.poc].filter(Boolean))])
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'instantly_replies' }, p => {
        setReplies(prev => prev.map(r => r.id===p.new.id ? p.new : r))
        if (selected?.id===p.new.id) setSelected(p.new)
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [fetch])

  const updateStatus = async (id, status) => {
    await supabase.from('instantly_replies').update({ status }).eq('id', id)
    setReplies(prev => prev.map(r => r.id===id ? {...r, status} : r))
    if (selected?.id===id) setSelected(p => ({...p, status}))
  }
  const updateNotes = async (id, sdr_notes) => {
    await supabase.from('instantly_replies').update({ sdr_notes }).eq('id', id)
    setReplies(prev => prev.map(r => r.id===id ? {...r, sdr_notes} : r))
    if (selected?.id===id) setSelected(p => ({...p, sdr_notes}))
  }

  const filtered = replies.filter(r => {
    if (filters.campaign && r.campaign_name !== filters.campaign) return false
    if (filters.status   && r.status !== filters.status)          return false
    if (filters.poc      && r.poc !== filters.poc)                return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!r.lead_email?.toLowerCase().includes(q) &&
          !r.lead_name?.toLowerCase().includes(q)  &&
          !r.reply_body?.toLowerCase().includes(q) &&
          !r.campaign_name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const metrics = {
    total:   replies.length,
    new:     replies.filter(r=>r.status==='New').length,
    interested: replies.filter(r=>r.status==='Interested').length,
    meeting: replies.filter(r=>r.status==='Meeting').length,
    ooo:     replies.filter(r=>r.status==='OOO').length,
  }

  return (
    <div className="app">
      <Sidebar
        view={view} setView={setView}
        filters={filters} setFilters={setFilters}
        campaigns={campaigns} pocs={pocs}
        metrics={metrics} totalReplies={replies.length}
      />
      <div className="main">
        {view === 'inbox' ? (
          <Inbox
            replies={filtered} loading={loading} error={error}
            selected={selected} onSelect={setSelected}
            onRefresh={fetch} filters={filters} setFilters={setFilters}
            campaigns={campaigns} statusOptions={STATUS_OPTIONS}
            onStatusChange={updateStatus} onNotesChange={updateNotes}
            metrics={metrics}
          />
        ) : (
          <Dashboard replies={replies} metrics={metrics} campaigns={campaigns} pocs={pocs} />
        )}
      </div>
    </div>
  )
}
