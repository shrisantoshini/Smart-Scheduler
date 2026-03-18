import { useState, useEffect } from 'react'
import api from '../api/axiosInstance'
import HistoryTable from '../components/HistoryTable'

export default function NotificationHistory() {
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const limit = 20

  useEffect(() => { document.title = 'Notification History — Smart Notifier' }, [])

  useEffect(() => {
    setLoading(true)
    api.get('/notifications/history', {
      params: { status: statusFilter, limit, offset: (page - 1) * limit }
    }).then(r => { setRecords(r.data.history || []); setTotal(r.data.total || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const exportCSV = () => {
    const rows = [
      ['Title', 'Sent At', 'Status', 'Reminder ID'],
      ...records.map(r => [
        `"${r.title}"`,
        new Date(r.sent_at).toLocaleString(),
        r.status,
        r.reminder_id || ''
      ])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'notification_history.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / limit)
  const statusFilters = ['all', 'delivered', 'failed']

  return (
    <main className="page page-with-nav">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📋 Notification History</h1>
        <button className="btn btn-outline btn-sm" onClick={exportCSV} disabled={!records.length}>
          ⬇ Export CSV
        </button>
      </div>

      <div className="card">
        <div className="filters" style={{ marginBottom: '1rem' }}>
          {statusFilters.map(f => (
            <button key={f} className={`filter-btn${statusFilter === f ? ' active' : ''}`}
              onClick={() => { setStatusFilter(f); setPage(1) }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-3)' }}>
            {total} record{total !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : (
          <HistoryTable records={records} />
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>
    </main>
  )
}
