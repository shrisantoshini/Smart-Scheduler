import { useState, useEffect } from 'react'
import api from '../api/axiosInstance'
import ReminderCard from './ReminderCard'

export default function UpcomingList({ onEdit, onDelete }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reminders/upcoming')
      .then(r => setReminders(r.data.reminders?.slice(0, 5) || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
    </div>
  )

  if (!reminders.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">⏰</div>
      <h3>No Upcoming Reminders</h3>
      <p>You have no pending reminders. Set one now!</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {reminders.map(r => (
        <ReminderCard key={r.id} reminder={r} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
