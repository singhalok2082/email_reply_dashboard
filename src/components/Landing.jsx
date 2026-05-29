import { useState } from 'react'
import Login from './Login.jsx'
import './Landing.css'

export default function Landing({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false)

  if (showLogin) {
    return <Login onLogin={onLogin} />
  }

  return (
    <div className="landing-wrap">
      <iframe
        src="/landing.html"
        className="landing-frame"
        title="Replyloop"
      />
      <div className="landing-login-btn" onClick={() => setShowLogin(true)}>
        Sign in →
      </div>
    </div>
  )
}
