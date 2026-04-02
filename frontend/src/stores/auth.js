import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/composables/useApi'
import { tokenRegistry } from '@/lib/tokenRegistry'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const accessToken  = ref(null)   // memory-only — synced with tokenRegistry
  const authReady    = ref(false)  // true after init() completes

  const isLoggedIn   = computed(() => !!accessToken.value && !!user.value)
  const isPremium    = computed(() => user.value?.plan === 'premium')

  /** Keep the reactive ref and the registry in sync */
  function _setToken(token) {
    accessToken.value = token
    if (token) tokenRegistry.set(token)
    else tokenRegistry.clear()
  }

  /**
   * Called once on app mount.
   * Attempts silent refresh (via httpOnly refresh-token cookie), then fetches user profile.
   * Sets authReady = true when done (regardless of success/failure).
   */
  async function init() {
    try {
      const res = await api.post('/auth/refresh')
      _setToken(res.data.accessToken)
      const me = await api.get('/auth/me')
      user.value = me.data
    } catch {
      user.value = null
      _setToken(null)
    } finally {
      authReady.value = true
    }
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    _setToken(res.data.accessToken)
    user.value = res.data.user
    return res.data
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    _setToken(res.data.accessToken)
    user.value = res.data.user
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
      _setToken(res.data.accessToken)
      return res.data.accessToken
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    api.post('/auth/logout').catch(() => {})
    user.value = null
    _setToken(null)
  }

  return {
    user,
    accessToken,
    authReady,
    isLoggedIn,
    isPremium,
    init,
    login,
    register,
    fetchMe,
    refresh,
    logout
  }
})
