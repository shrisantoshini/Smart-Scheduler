import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await import('../api/axiosInstance').then(m => m.default.post('/auth/logout').catch(() => {}))
    logout()
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>⏰</span> Smart Notifier
      </div>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span>📊</span> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/reminders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span>🗓️</span> <span>Reminders</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span>📋</span> <span>History</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <span>⚙️</span> <span>Settings</span>
        </NavLink>
        <button className="nav-logout" onClick={handleLogout} aria-label="Logout">Logout</button>
      </div>
    </nav>
  )
}
