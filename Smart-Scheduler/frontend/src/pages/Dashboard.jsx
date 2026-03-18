import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'
import UpcomingList from '../components/UpcomingList'
import ReminderCard from '../components/ReminderCard'

function MiniDonut({ sent, failed }) {
  const total = sent + failed || 1
  const sentPct = (sent / total) * 100
  const r = 36
  const circ = 2 * Math.PI * r
  const sentDash = (sentPct / 100) * circ
  return (
    <div className="donut-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="12"
          strokeDasharray={`${sentDash} ${circ - sentDash}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {failed > 0 && (
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--danger)" strokeWidth="12"
            strokeDasharray={`${circ - sentDash} ${sentDash}`}
            strokeDashoffset={circ / 4 - sentDash}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}
        <text x="50" y="54" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700">
          {sent + failed}
        </text>
      </svg>
      <div className="donut-legend">
        <div className="donut-legend-item">
          <div className="donut-dot" style={{ background: 'var(--accent)' }} />
          Delivered ({sent})
        </div>
        <div className="donut-legend-item">
          <div className="donut-dot" style={{ background: 'var(--danger)' }} />
          Failed ({failed})
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [notifStatus, setNotifStatus] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Dashboard — Smart Notifier'
    Promise.all([
      api.get('/reminders/stats/summary'),
      api.get('/notifications/status'),
    ]).then(([s, n]) => {
      setStats(s.data)
      setNotifStatus(n.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/reminders/${deleteTarget.id}`)
    setDeleteTarget(null)
    window.location.reload()
  }

  return (
    <main className="page page-with-nav">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <h2>{getGreeting()}, {user?.full_name?.split(' ')[0]} 👋</h2>
          <p>
            {user?.account_type === 'organization'
              ? `Organization: ${user.org_name}`
              : 'Personal Account'}
          </p>
        </div>
        <span className={`badge ${user?.account_type === 'organization' ? 'badge-org' : 'badge-personal'}`}>
          {user?.account_type === 'organization' ? '🏢 Organization' : '👤 Personal'}
        </span>
      </div>

      {/* Stats Row */}
      <div className="stats-row" style={{ marginBottom: '1.75rem' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 88 }} />)
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-label">Total Reminders</div>
              <div className="stat-value">{stats?.total ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">This Week</div>
              <div className="stat-value">{stats?.this_week ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Notifications Sent</div>
              <div className="stat-value">{notifStatus?.total_sent ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Failed Notifications</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>{notifStatus?.total_failed ?? 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Upcoming Reminders */}
        <div>
          <div className="section-header">
            <div className="section-title">⏰ Upcoming Reminders</div>
            <Link to="/reminders/new" className="btn btn-primary btn-sm">+ New Reminder</Link>
          </div>
          <UpcomingList onEdit={(r) => navigate(`/reminders?edit=${r.id}`)} onDelete={setDeleteTarget} />
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <Link to="/reminders" style={{ fontSize: '0.875rem', color: 'var(--primary-light)' }}>
              View all reminders →
            </Link>
          </div>
        </div>

        {/* Notification Status Panel */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '1rem' }}>📊 Notification Status</div>
          {notifStatus ? (
            <>
              <MiniDonut sent={notifStatus.total_sent} failed={notifStatus.total_failed} />
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="status-item">
                  <span className="status-item-label">Pending</span>
                  <span className="status-item-value">{notifStatus.pending_count}</span>
                </div>
                {notifStatus.last_sent_at && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Last sent: {new Date(notifStatus.last_sent_at).toLocaleString()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="skeleton" style={{ height: 200 }} />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ Delete Reminder?</div>
            <div className="modal-body">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This will cancel any scheduled notifications.
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
