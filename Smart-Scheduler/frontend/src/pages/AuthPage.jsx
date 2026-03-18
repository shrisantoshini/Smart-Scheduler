import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }
  const score = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#ff4d6d', '#ffb347', '#6c63ff', '#00d4aa']
  if (!password) return null
  return (
    <div>
      <div className="password-strength">
        <div className="strength-bar" style={{ width: `${score * 25}%`, background: colors[score] }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: colors[score], marginTop: '0.25rem' }}>
        {labels[score]}
      </div>
    </div>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, signup, showToast } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [mode, setMode] = useState('login')  // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    email: '', password: '', full_name: '', org_name: '',
    confirm_password: '', remember: false
  })

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password, form.remember)
      navigate('/dashboard')
    } catch (err) {
      const errData = err.response?.data?.errors || {}
      if (Object.keys(errData).length) setErrors(errData)
      else showToast(err.response?.data?.message || 'Login failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required.'
    if (activeTab === 'organization' && !form.org_name.trim()) errs.org_name = 'Org name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await signup({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        account_type: activeTab,
        org_name: activeTab === 'organization' ? form.org_name : undefined,
      })
      showToast('Account created! Please log in.', 'success')
      setMode('login')
      setForm(f => ({ ...f, password: '', confirm_password: '' }))
    } catch (err) {
      const errData = err.response?.data?.errors || {}
      if (Object.keys(errData).length) setErrors(errData)
      else showToast(err.response?.data?.message || 'Signup failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>⏰ Smart Notifier</h1>
          <p>Intelligent reminders, delivered on time</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${activeTab === 'personal' ? ' active' : ''}`}
            onClick={() => { setActiveTab('personal'); setErrors({}) }}
          >Personal</button>
          <button
            className={`auth-tab${activeTab === 'organization' ? ' active' : ''}`}
            onClick={() => { setActiveTab('organization'); setErrors({}) }}
          >Organization</button>
        </div>

        {mode === 'signup' ? (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            {activeTab === 'organization' && (
              <div className="form-group">
                <label className="form-label" htmlFor="org_name">Organization Name</label>
                <input id="org_name" type="text" placeholder="Acme Corp"
                  value={form.org_name} onChange={e => setField('org_name', e.target.value)} />
                {errors.org_name && <span className="form-error">{errors.org_name}</span>}
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">
                {activeTab === 'organization' ? 'Admin Full Name' : 'Full Name'}
              </label>
              <input id="full_name" type="text" placeholder="John Doe"
                value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
              {errors.full_name && <span className="form-error">{errors.full_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup_email">Email</label>
              <input id="signup_email" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setField('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="signup_password">Password</label>
              <input id="signup_password" type="password" placeholder="Min. 8 characters"
                value={form.password} onChange={e => setField('password', e.target.value)} />
              <PasswordStrength password={form.password} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
              <input id="confirm_password" type="password" placeholder="Repeat password"
                value={form.confirm_password} onChange={e => setField('confirm_password', e.target.value)} />
              {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <div className="auth-toggle">
              <span>Already have an account?</span>
              <button type="button" style={{ background:'none',border:'none',color:'var(--primary-light)',fontWeight:600,cursor:'pointer' }}
                onClick={() => { setMode('login'); setErrors({}) }}>Sign in</button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login_email">Email</label>
              <input id="login_email" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setField('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login_password">Password</label>
              <input id="login_password" type="password" placeholder="Your password"
                value={form.password} onChange={e => setField('password', e.target.value)} />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <label className="remember-row">
              <input type="checkbox" checked={form.remember}
                onChange={e => setField('remember', e.target.checked)} />
              Remember me
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="auth-toggle">
              <span>Don't have an account?</span>
              <button type="button" style={{ background:'none',border:'none',color:'var(--primary-light)',fontWeight:600,cursor:'pointer' }}
                onClick={() => { setMode('signup'); setErrors({}) }}>Create one</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
