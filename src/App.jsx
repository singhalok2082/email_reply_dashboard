import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import ReplyDetail from './components/ReplyDetail.jsx'
import './App.css'

const STATUS_OPTIONS = ['New', 'Follow Up', 'Replied', 'Not Interested', 'Hot Lead']

export default function App() {
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ campaign: '', status: '', poc: '', search: '' })
  const [campaigns, setCampaigns] = useState([])
  const [pocs, setPocs] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
      setCampaigns([...new Set((data || []).map(r => r.campaign_name).filter(Boolean))])
      setPocs([...new Set((data || []).map(r => r.poc).filter(Boolean))])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReplies()

    const channel = supabase
      .channel('replies-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'instantly_replies' }, payload => {
        setReplies(prev => [payload.new, ...prev])
        setCampaigns(prev => [...new Set([...prev, payload.new.campaign_name].filter(Boolean))])
        setPocs(prev => [...new Set([...prev, payload.new.poc].filter(Boolean))])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instantly_replies' }, payload => {
        setReplies(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
        if (selected?.id === payload.new.id) setSelected(payload.new)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchReplies])

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('instantly_replies')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setReplies(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }))
    }
  }

  const updateNotes = async (id, sdr_notes) => {
    const { error } = await supabase
      .from('instantly_replies')
      .update({ sdr_notes })
      .eq('id', id)
    if (!error) {
      setReplies(prev => prev.map(r => r.id === id ? { ...r, sdr_notes } : r))
      if (selected?.id === id) setSelected(prev => ({ ...prev, sdr_notes }))
    }
  }

  const filtered = replies.filter(r => {
    if (filters.campaign && r.campaign_name !== filters.campaign) return false
    if (filters.status && r.status !== filters.status) return false
    if (filters.poc && r.poc !== filters.poc) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!r.lead_email?.toLowerCase().includes(q) &&
          !r.lead_name?.toLowerCase().includes(q) &&
          !r.reply_body?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const metrics = {
    total: filtered.length,
    new: filtered.filter(r => r.status === 'New').length,
    hot: filtered.filter(r => r.status === 'Hot Lead').length,
    followup: filtered.filter(r => r.status === 'Follow Up').length,
    replied: filtered.filter(r => r.status === 'Replied').length,
    notint: filtered.filter(r => r.status === 'Not Interested').length,
  }

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        filters={filters}
        setFilters={setFilters}
        campaigns={campaigns}
        pocs={pocs}
        metrics={metrics}
        statusOptions={STATUS_OPTIONS}
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
          onToggleSidebar={() => setSidebarOpen(o => !o)}
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
