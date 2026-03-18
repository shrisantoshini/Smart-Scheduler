import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'
import ReminderCard from '../components/ReminderCard'
import dayjs from 'dayjs'

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')
  const addTag = (tag) => {
    const t = tag.trim()
    if (t && !tags.includes(t) && tags.length < 5) onChange([...tags, t])
    setInput('')
  }
  const removeTag = (t) => onChange(tags.filter(x => x !== t))
  return (
    <div className="tag-input-wrap" onClick={e => e.currentTarget.querySelector('input')?.focus()}>
      {tags.map(t => (
        <span key={t} className="tag-pill">
          {t}
          <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
        </span>
      ))}
      {tags.length < 5 && (
        <input
          className="tag-inner-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
            if (e.key === 'Backspace' && !input) onChange(tags.slice(0, -1))
          }}
          placeholder={tags.length === 0 ? 'Add tags (press Enter)...' : ''}
        />
      )}
    </div>
  )
}

function ReminderForm({ initial, onSuccess, onCancel }) {
  const { showToast } = useAuth()
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    remind_at: initial?.remind_at ? dayjs(initial.remind_at).format('YYYY-MM-DDTHH:mm') : '',
    recurrence: initial?.recurrence || 'none',
    tags: initial?.tags || [],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (form.title.length > 100) errs.title = 'Max 100 chars.'
    if (!form.remind_at) errs.remind_at = 'Date and time are required.'
    else if (new Date(form.remind_at) <= new Date()) errs.remind_at = 'Must be in the future.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const payload = { ...form, remind_at: new Date(form.remind_at).toISOString() }
      if (initial?.id) {
        await api.put(`/reminders/${initial.id}`, payload)
        showToast('Reminder updated!', 'success')
      } else {
        await api.post('/reminders', payload)
        showToast('Reminder created and scheduled!', 'success')
      }
      onSuccess()
    } catch (err) {
      const errData = err.response?.data?.errors || {}
      if (Object.keys(errData).length) setErrors(errData)
      else showToast(err.response?.data?.error || 'Failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const recurrenceOptions = ['none', 'daily', 'weekly', 'monthly']

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label className="form-label" htmlFor="r_title">Title *</label>
        <input id="r_title" type="text" value={form.title}
          onChange={e => setF('title', e.target.value)} placeholder="E.g. Take medication" maxLength={100} />
        <div className="form-char-count">{form.title.length}/100</div>
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="r_desc">Description</label>
        <textarea id="r_desc" rows={3} value={form.description}
          onChange={e => setF('description', e.target.value)} placeholder="Optional details..." maxLength={500} />
        <div className="form-char-count">{form.description.length}/500</div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="r_time">Date & Time *</label>
        <input id="r_time" type="datetime-local" value={form.remind_at}
          onChange={e => setF('remind_at', e.target.value)}
          min={dayjs().format('YYYY-MM-DDTHH:mm')} />
        {errors.remind_at && <span className="form-error">{errors.remind_at}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Recurrence</label>
        <div className="segmented">
          {recurrenceOptions.map(opt => (
            <button key={opt} type="button"
              className={`seg-btn${form.recurrence === opt ? ' active' : ''}`}
              onClick={() => setF('recurrence', opt)}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Tags (max 5)</label>
        <TagInput tags={form.tags} onChange={tags => setF('tags', tags)} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : (initial?.id ? 'Update Reminder' : '+ Create Reminder')}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  )
}

export default function SetReminder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [reminders, setReminders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const limit = 10

  useEffect(() => {
    document.title = 'Reminders — Smart Notifier'
  }, [])

  const loadReminders = () => {
    setLoading(true)
    api.get('/reminders', { params: { status: statusFilter, limit, offset: (page - 1) * limit } })
      .then(r => { setReminders(r.data.reminders || []); setTotal(r.data.total || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadReminders() }, [page, statusFilter])

  useEffect(() => {
    if (editId) {
      api.get(`/reminders/${editId}`).then(r => { setEditing(r.data); setShowForm(true) }).catch(console.error)
    }
  }, [editId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/reminders/${deleteTarget.id}`)
    setDeleteTarget(null)
    loadReminders()
  }

  const statusFilters = ['all', 'pending', 'sent', 'failed', 'cancelled']
  const totalPages = Math.ceil(total / limit)

  return (
    <main className="page page-with-nav">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🗓️ Reminders</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
          + New Reminder
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title" style={{ marginBottom: '1rem' }}>
            {editing ? 'Edit Reminder' : 'New Reminder'}
          </div>
          <ReminderForm
            initial={editing}
            onSuccess={() => { setShowForm(false); setEditing(null); navigate('/reminders'); loadReminders() }}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        {statusFilters.map(f => (
          <button key={f} className={`filter-btn${statusFilter === f ? ' active' : ''}`}
            onClick={() => { setStatusFilter(f); setPage(1) }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-3)' }}>
          {total} reminder{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : !reminders.length ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No reminders found</h3>
          <p>Try changing the filter or create a new one.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create Reminder</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reminders.map(r => (
            <ReminderCard key={r.id} reminder={r}
              onEdit={rem => { setEditing(rem); setShowForm(true); window.scrollTo(0, 0) }}
              onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Delete Reminder?</div>
            <div className="modal-body">Delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone.</div>
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
