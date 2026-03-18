import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
export default function ReminderCard({ reminder, onEdit, onDelete }) {
  const recurrenceClass = {
    none: 'badge-none',
    daily: 'badge-daily',
    weekly: 'badge-weekly',
    monthly: 'badge-monthly',
  }[reminder.recurrence] || 'badge-none'

  const statusClass = {
    pending: 'badge-pending',
    sent: 'badge-sent',
    failed: 'badge-failed',
    cancelled: 'badge-cancelled',
  }[reminder.status] || 'badge-pending'

  return (
    <div className="reminder-card">
      <div className="reminder-card-body">
        <div className="reminder-card-title">{reminder.title}</div>
        {reminder.description && (
          <div className="reminder-card-desc">{reminder.description}</div>
        )}
        <div className="reminder-card-time">
          📅 {dayjs.utc(reminder.remind_at).local().format('MMM D, YYYY [at] h:mm A')}
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-3)' }}>
            ({dayjs.utc(reminder.remind_at).local().fromNow()})
          </span>
        </div>
        <div className="reminder-card-meta">
          <span className={`badge ${statusClass}`}>{reminder.status}</span>
          <span className={`badge ${recurrenceClass}`}>{reminder.recurrence}</span>
          {reminder.tags?.map(tag => (
            <span key={tag} className="badge badge-personal">{tag}</span>
          ))}
        </div>
      </div>
      <div className="reminder-card-actions">
        {onEdit && (
          <button className="btn-icon" onClick={() => onEdit(reminder)} aria-label="Edit reminder">✏️</button>
        )}
        {onDelete && (
          <button className="btn-icon danger" onClick={() => onDelete(reminder)} aria-label="Delete reminder">🗑️</button>
        )}
      </div>
    </div>
  )
}
