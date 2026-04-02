import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,  // שולח cookies (refresh token)
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - מוסיף access token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor - refresh token אוטומטי
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

      try {
        const res = await api.post('/auth/refresh')
        const token = res.data.accessToken
        localStorage.setItem('access_token', token)
        queue.forEach(p => p.resolve(token))
        queue = []
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (refreshErr) {
        queue.forEach(p => p.reject(refreshErr))
        queue = []
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
