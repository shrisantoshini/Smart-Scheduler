import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axiosInstance'
import { messaging } from '../firebase'
import { getToken, onMessage } from 'firebase/messaging'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [logout])

  // Listen for forced logout events from axios interceptor
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  // Set up FCM foreground message listener
  useEffect(() => {
    if (!user || !messaging) return
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'Reminder'
      const body = payload.notification?.body || ''
      showToast(`🔔 ${title}: ${body}`, 'info')
    })
    return unsubscribe
  }, [user, showToast])

  const registerFcm = useCallback(async () => {
    if (!messaging) return
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const swUrl = `/firebase-messaging-sw.js?apiKey=${import.meta.env.VITE_FIREBASE_API_KEY}&authDomain=${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}&projectId=${import.meta.env.VITE_FIREBASE_PROJECT_ID}&messagingSenderId=${import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID}&appId=${import.meta.env.VITE_FIREBASE_APP_ID}`
      const registration = await navigator.serviceWorker.register(swUrl)

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      })
      if (token) {
        await api.put('/auth/fcm-token', { fcm_token: token })
      }
    } catch (e) {
      console.warn('FCM registration failed:', e.message)
    }
  }, [])

  const login = async (email, password, remember) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token, user: loggedInUser } = res.data
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('access_token', access_token)
    storage.setItem('refresh_token', refresh_token)
    setUser(loggedInUser)
    // Request FCM permission after login
    registerFcm()
    return loggedInUser
  }

  const signup = async (payload) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const res = await api.post('/auth/signup', { ...payload, timezone: tz })
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, showToast, toast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`} key={toast.id}>
          {toast.message}
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
