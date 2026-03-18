import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axiosInstance'

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo']
const ADVANCE_OPTIONS = [
  { value: 0, label: 'At time of reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
]

function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <div className="toggle-track" />
      <div className="toggle-thumb" />
    </label>
  )
}

function DeleteAccountModal({ onClose, onConfirm }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title" style={{ color: 'var(--danger)' }}>⚠️ Delete Account</div>
        <div className="modal-body">
          <p>This action is <strong>irreversible</strong>. All your reminders and data will be permanently deleted.</p>
          <br />
          <p>Type <strong>DELETE</strong> to confirm:</p>
          <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
            placeholder="DELETE" style={{ marginTop: '0.75rem' }} />
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={typed !== 'DELETE'} onClick={() => onConfirm()}>
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, showToast, logout } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Change password form
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})

  useEffect(() => {
    document.title = 'Settings — Smart Notifier'
    api.get('/settings')
      .then(r => setSettings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const [tzSearch, setTzSearch] = useState('')
  const filteredTz = TIMEZONES.filter(tz =>
    tz.toLowerCase().includes(tzSearch.toLowerCase())
  )

  const saveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await api.put('/settings', {
        timezone: settings.timezone,
        notification_prefs: settings.notification_prefs
      })
      showToast('Settings saved!', 'success')
    } catch (e) {
      showToast('Failed to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.current) errs.current = 'Required.'
    if (pwForm.new.length < 8) errs.new = 'Min. 8 characters.'
    if (pwForm.new !== pwForm.confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setPwErrors(errs); return }

    try {
      await api.put('/auth/change-password', { current_password: pwForm.current, new_password: pwForm.new })
      showToast('Password changed successfully!', 'success')
      setPwForm({ current: '', new: '', confirm: '' })
    } catch (err) {
      showToast(err.response?.data?.error || 'Password change failed.', 'error')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Export data first
      const [reminders, history] = await Promise.all([
        api.get('/reminders?limit=1000'),
        api.get('/notifications/history?limit=1000')
      ])
      const data = { reminders: reminders.data.reminders, history: history.data.history }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'smart-notifier-data.json'; a.click()
      URL.revokeObjectURL(url)
      // Delete account
      await api.delete('/auth/me').catch(() => {})
      logout()
    } catch (e) {
      showToast('Account deletion failed.', 'error')
    }
  }

  const setPrefs = (k, v) => setSettings(s => ({
    ...s, notification_prefs: { ...s.notification_prefs, [k]: v }
  }))

  if (loading) return (
    <main className="page page-with-nav">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </main>
  )

  return (
    <main className="page page-with-nav">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.75rem' }}>⚙️ Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 700 }}>

        {/* Account Info */}
        <div className="card settings-section">
          <div className="settings-section-title">Account Information</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Full Name</div>
              <div className="settings-row-desc">{user?.full_name}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Email</div>
              <div className="settings-row-desc">{user?.email}</div>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Account Type</div>
              <div className="settings-row-desc">
                <span className={`badge ${user?.account_type === 'organization' ? 'badge-org' : 'badge-personal'}`}>
                  {user?.account_type === 'organization' ? `🏢 ${user.org_name}` : '👤 Personal'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <div className="settings-section-title" style={{ marginBottom: '0.75rem' }}>Change Password</div>
            <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="pw_cur">Current Password</label>
                <input id="pw_cur" type="password" value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
                {pwErrors.current && <span className="form-error">{pwErrors.current}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pw_new">New Password</label>
                <input id="pw_new" type="password" value={pwForm.new}
                  onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))} />
                {pwErrors.new && <span className="form-error">{pwErrors.new}</span>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pw_conf">Confirm New Password</label>
                <input id="pw_conf" type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                {pwErrors.confirm && <span className="form-error">{pwErrors.confirm}</span>}
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card settings-section">
          <div className="settings-section-title">Notification Preferences</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Push Notifications</div>
              <div className="settings-row-desc">Receive browser push notifications for reminders</div>
            </div>
            <ToggleSwitch id="push_toggle"
              checked={settings?.notification_prefs?.push_enabled ?? true}
              onChange={v => setPrefs('push_enabled', v)} />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Default Advance Notice</div>
              <div className="settings-row-desc">How early to send the notification</div>
            </div>
            <select
              value={settings?.notification_prefs?.default_advance_minutes ?? 0}
              onChange={e => setPrefs('default_advance_minutes', Number(e.target.value))}
              style={{ width: 'auto', minWidth: 200 }}>
              {ADVANCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div className="card settings-section">
          <div className="settings-section-title">Timezone</div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" htmlFor="tz_search">Search Timezone</label>
            <input id="tz_search" type="text" placeholder="e.g. Kolkata, London..."
              value={tzSearch} onChange={e => setTzSearch(e.target.value)} />
          </div>
          <div className="form-group">
            <select
              value={settings?.timezone || 'UTC'}
              onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}>
              {Array.from(new Set(
                (settings?.timezone || 'UTC').toLowerCase().includes(tzSearch.toLowerCase()) 
                  ? [settings?.timezone || 'UTC', ...filteredTz] 
                  : filteredTz
              )).map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
            🕐 Current local time: {new Date().toLocaleString('en-US', { timeZone: settings?.timezone || 'UTC', hour12: true })} ({settings?.timezone || 'UTC'})
          </div>
        </div>

        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>

        {/* Danger Zone */}
        <div className="danger-zone">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.75rem' }}>
            ⚠️ Danger Zone
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
            Permanently delete your account. Your data will be exported first, then deleted. This cannot be undone.
          </p>
          <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
            Delete My Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteAccount} />
      )}
    </main>
  )
}
