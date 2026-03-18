import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import SetReminder from './pages/SetReminder'
import NotificationHistory from './pages/NotificationHistory'
import Settings from './pages/Settings'
import Navbar from './components/Navbar'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading"><div className="spinner" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

function App() {
  const { user } = useAuth()
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reminders" element={<ProtectedRoute><SetReminder /></ProtectedRoute>} />
        <Route path="/reminders/new" element={<ProtectedRoute><SetReminder /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><NotificationHistory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
      </Routes>
    </>
  )
}

export default App
