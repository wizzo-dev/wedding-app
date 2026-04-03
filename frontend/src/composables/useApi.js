import axios from 'axios'
import { tokenRegistry } from '@/lib/tokenRegistry'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // שולח cookies (refresh token)
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — מוסיף access token מהזיכרון (לא מ-localStorage)
api.interceptors.request.use(config => {
  const token = tokenRegistry.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — automatic token refresh on 401
let refreshing = false
let queue = []

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      refreshing = true

      // If the failing request is itself /auth/refresh, don't retry — logout directly
      if (original.url?.includes('/auth/refresh')) {
        queue.forEach(p => p.reject(err))
        queue = []
        refreshing = false
        tokenRegistry.clear()
        if (window.location.pathname !== "/login") window.location.href = "/login"
        return Promise.reject(err)
      }

      try {
        const res = await api.post('/auth/refresh')
        const token = res.data.accessToken

        // Store in memory only (no localStorage)
        tokenRegistry.set(token)

        queue.forEach(p => p.resolve(token))
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (refreshErr) {
        queue.forEach(p => p.reject(refreshErr))
        queue = []
        tokenRegistry.clear()
        if (window.location.pathname !== "/login") window.location.href = "/login"
        return Promise.reject(refreshErr)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
