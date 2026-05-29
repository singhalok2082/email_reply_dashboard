import './Landing.css'

export default function Landing({ onLogin }) {
  return (
    <div className="landing-wrap">
      <iframe
        src="/landing.html"
        className="landing-frame"
        title="Replyloop"
      />
      <div className="landing-login-btn" onClick={onLogin}>
        Sign in →
      </div>
    </div>
  )
}
