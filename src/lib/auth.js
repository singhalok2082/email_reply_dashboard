// Simple session-based auth stored in localStorage
// Admin = Alok Singh (is_admin: true)
// POC = other team members (limited view)

export const getSession = () => {
  try {
    const s = localStorage.getItem('rl_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export const setSession = (user) => {
  localStorage.setItem('rl_session', JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem('rl_session')
}

export const isAdmin = (session) => {
  return session?.is_admin === true
}
