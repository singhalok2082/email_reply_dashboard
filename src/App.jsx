import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import ReplyDetail from './components/ReplyDetail.jsx'
import './App.css'

const STATUS_OPTIONS = ['New', 'Follow Up', 'Hot Lead', 'Replied', 'Not Interested']

export default function App() {
  const [replies, setReplies]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [filters, setFilters]     = useState({ campaign: '', status: '', poc: '', search: '' })
  const [campaigns, setCampaigns] = useState([])
  const [pocs, setPocs]           = useState([])

  const fetchReplies = useCallback(async () => {
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
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReplies()
    const channel = supabase.channel('replies-rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'instantly_replies' }, p => {
        setReplies(prev => [p.new, ...prev])
        setCampaigns(prev => [...new Set([...prev, p.new.campaign_name].filter(Boolean))])
        setPocs(prev => [...new Set([...prev, p.new.poc].filter(Boolean))])
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'instantly_replies' }, p => {
        setReplies(prev => prev.map(r => r.id === p.new.id ? p.new : r))
        if (selected?.id === p.new.id) setSelected(p.new)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReplies])

  const updateStatus = async (id, status) => {
    await supabase.from('instantly_replies').update({ status }).eq('id', id)
    setReplies(prev => prev.map(r => r.id === id ? {...r, status} : r))
    if (selected?.id === id) setSelected(p => ({...p, status}))
  }

  const updateNotes = async (id, sdr_notes) => {
    await supabase.from('instantly_replies').update({ sdr_notes }).eq('id', id)
    setReplies(prev => prev.map(r => r.id === id ? {...r, sdr_notes} : r))
    if (selected?.id === id) setSelected(p => ({...p, sdr_notes}))
  }

  const filtered = replies.filter(r => {
    if (filters.campaign && r.campaign_name !== filters.campaign) return false
    if (filters.status  && r.status !== filters.status)           return false
    if (filters.poc     && r.poc !== filters.poc)                 return false
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
    total:   filtered.length,
    new:     filtered.filter(r=>r.status==='New').length,
    hot:     filtered.filter(r=>r.status==='Hot Lead').length,
    followup:filtered.filter(r=>r.status==='Follow Up').length,
    replied: filtered.filter(r=>r.status==='Replied').length,
    notint:  filtered.filter(r=>r.status==='Not Interested').length,
  }

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o=>!o)}
        filters={filters}
        setFilters={setFilters}
        campaigns={campaigns}
        pocs={pocs}
        metrics={metrics}
        statusOptions={STATUS_OPTIONS}
        totalReplies={replies.length}
      />
      <div className="main-area">
        <Dashboard
          replies={filtered}
          loading={loading}
          error={error}
          metrics={metrics}
          selected={selected}
          onSelect={setSelected}
          onRefresh={fetchReplies}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o=>!o)}
          filters={filters}
        />
      </div>
      {selected && (
        <ReplyDetail
          reply={selected}
          onClose={() => setSelected(null)}
          onStatusChange={updateStatus}
          onNotesChange={updateNotes}
          statusOptions={STATUS_OPTIONS}
        />
      )}
    </div>
  )
}
