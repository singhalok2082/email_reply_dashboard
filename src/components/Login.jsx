import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setSession } from '../lib/auth'
import './Login.css'

const AVATAR_COLORS = ['#C96442','#7A8C99','#6B8E5A','#A98556','#9A6B8E','#5A7F8C','#C49250','#4A7FC1']

export default function Login({ onLogin }) {
  const [step,    setStep]    = useState('select') // select | pin
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [selected,setSelected]= useState(null)
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')

  const loadUsers = async () => {
    setLoading(true)
    // Load admin profile
    const { data: admin } = await supabase.from('user_profile').select('*').eq('id', 1).single()
    // Load POC profiles
    const { data: pocs } = await supabase.from('poc_profiles').select('*').order('name')

    const all = []
    if (admin) all.push({ ...admin, type:'admin', is_admin:true })
    if (pocs)  pocs.forEach(p => all.push({ ...p, type:'poc', is_admin:false }))
    setUsers(all)
    setLoading(false)
    setStep('select')
  }

  useState(() => { loadUsers() }, [])

  const selectUser = (user) => {
    setSelected(user)
    setPin('')
    setError('')
    setStep('pin')
  }

  const submitPin = async () => {
    setError('')
    if (selected.is_admin) {
      // Admin — any pin or no pin (just click)
      const session = { ...selected, loginTime: Date.now() }
      setSession(session)
      onLogin(session)
      return
    }
    // POC — verify pin
    if (pin === selected.pin || pin === '0000') {
      const session = { ...selected, loginTime: Date.now() }
      setSession(session)
      onLogin(session)
    } else {
      setError('Wrong PIN. Try again.')
      setPin('')
    }
  }

  const initials = (name) => name ? name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase() : '?'

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">R</div>
          <div className="login-brand-name">Replyloop</div>
        </div>

        {step === 'select' && (
          <>
            <div className="login-title">Who's logging in?</div>
            <div className="login-subtitle">Select your profile to continue</div>

            {loading ? (
              <div className="login-loading">
                <div className="login-dots"><span/><span/><span/></div>
              </div>
            ) : (
              <div className="login-users">
                {users.map((u, i) => (
                  <button key={u.id || i} className="login-user-btn" onClick={() => selectUser(u)}>
                    <div className="lub-av"
                      style={{ background: u.color || AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {initials(u.name)}
                    </div>
                    <div className="lub-info">
                      <div className="lub-name">{u.name}</div>
                      <div className="lub-role">
                        {u.is_admin ? '👑 Admin' : u.role || 'POC'}
                        {u.company ? ` · ${u.company}` : ''}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink3)" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'pin' && selected && (
          <>
            <button className="login-back" onClick={() => setStep('select')}>← Back</button>

            <div className="login-av-large"
              style={{ background: selected.color || '#C96442' }}>
              {initials(selected.name)}
            </div>
            <div className="login-title">{selected.name}</div>
            <div className="login-subtitle">
              {selected.is_admin ? 'Admin · tap Continue to log in' : `Enter your PIN to continue`}
            </div>

            {selected.is_admin ? (
              <button className="login-continue" onClick={submitPin}>
                Continue as Admin →
              </button>
            ) : (
              <>
                <div className="pin-dots">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}/>
                  ))}
                </div>

                {error && <div className="login-error">{error}</div>}

                <div className="pin-grid">
                  {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                    <button key={i} className={`pin-key ${k===''?'invisible':''}`}
                      disabled={k === ''}
                      onClick={() => {
                        if (k === '⌫') { setPin(p => p.slice(0,-1)); setError('') }
                        else if (typeof k === 'number' && pin.length < 4) {
                          const next = pin + k
                          setPin(next)
                          if (next.length === 4) {
                            // Auto-submit when 4 digits entered
                            setTimeout(() => {
                              if (next === selected.pin || next === '0000') {
                                const session = { ...selected, loginTime: Date.now() }
                                setSession(session)
                                onLogin(session)
                              } else {
                                setError('Wrong PIN. Try again.')
                                setPin('')
                              }
                            }, 200)
                          }
                        }
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'var(--ink3)', textAlign:'center', marginTop:8 }}>
                  Default PIN is 0000
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
