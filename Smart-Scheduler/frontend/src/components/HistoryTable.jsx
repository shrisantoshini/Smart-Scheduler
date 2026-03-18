import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import NotifStatusBadge from './NotifStatusBadge'
import { useNavigate } from 'react-router-dom'

export default function HistoryTable({ records }) {
  const navigate = useNavigate()

  if (!records.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📭</div>
      <h3>No Notifications Yet</h3>
      <p>Notifications you receive will appear here.</p>
    </div>
  )

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Reminder Title</th>
            <th>Time Sent</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map(rec => (
            <tr key={rec.id} className={rec.status === 'failed' ? 'row-failed' : ''}>
              <td style={{ fontWeight: 600, color: 'var(--text)' }}>{rec.title}</td>
              <td>{dayjs.utc(rec.sent_at).local().format('MMM D, YYYY [at] h:mm A')}</td>
              <td><NotifStatusBadge status={rec.status} /></td>
              <td>
                {rec.reminder_id && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/reminders?id=${rec.reminder_id}`)}
                  >
                    View Reminder
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
