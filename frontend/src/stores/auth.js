import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const accessToken  = ref(localStorage.getItem('access_token') || null)

  const isLoggedIn   = computed(() => !!accessToken.value && !!user.value)
  const isPremium    = computed(() => user.value?.plan === 'premium')

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    accessToken.value = res.data.accessToken
    user.value        = res.data.user
    localStorage.setItem('access_token', res.data.accessToken)
    return res.data
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    accessToken.value = res.data.accessToken
    user.value        = res.data.user
    localStorage.setItem('access_token', res.data.accessToken)
    return res.data
  }

  async function fetchMe() {
    try {
      const res = await api.get('/auth/me')
      user.value = res.data
    } catch {
      logout()
    }
  }

  async function refresh() {
    try {
      const res = await api.post('/auth/refresh')
      accessToken.value = res.data.accessToken
      localStorage.setItem('access_token', res.data.accessToken)
      return res.data.accessToken
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    api.post('/auth/logout').catch(() => {})
    user.value        = null
    accessToken.value = null
    localStorage.removeItem('access_token')
  }

  return { user, accessToken, isLoggedIn, isPremium, login, register, fetchMe, refresh, logout }
})
