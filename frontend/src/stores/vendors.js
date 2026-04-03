import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/composables/useApi'

export const useVendorsStore = defineStore('vendors', () => {
  const vendors       = ref([])
  const myVendors     = ref([])
  const categories    = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  const totalBudget = computed(() =>
    myVendors.value.reduce((sum, uv) => sum + (uv.priceAgreed || 0), 0)
  )

  const bookedVendors = computed(() => myVendors.value.filter(uv => uv.status === 'booked'))

  async function fetchVendors(category = '') {
    loading.value = true
    error.value   = null
    try {
      const params = category ? { category } : {}
      const res = await api.get('/vendors', { params })
      vendors.value = res.data
    } catch (e) {
      error.value = e.response?.data?.error || 'שגיאה בטעינת ספקים'
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      const res = await api.get('/vendors/categories')
      categories.value = res.data
    } catch {
      // silent
    }
  }

  async function fetchMyVendors() {
    loading.value = true
    error.value   = null
    try {
      const res = await api.get('/vendors/mine')
      myVendors.value = res.data
    } catch (e) {
      error.value = e.response?.data?.error || 'שגיאה בטעינת הספקים שלי'
    } finally {
      loading.value = false
    }
  }

  async function addToMyList(vendorId, status = 'considering') {
    const res = await api.post('/vendors/user', { vendorId, status })
    const v = vendors.value.find(x => x.id === vendorId)
    if (v) v.myStatus = status
    return res.data
  }

  async function updateMyVendor(id, data) {
    const res = await api.patch(`/vendors/user/${id}`, data)
    const idx = myVendors.value.findIndex(x => x.id === id)
    if (idx !== -1) myVendors.value[idx] = { ...myVendors.value[idx], ...res.data }
    return res.data
  }

  async function removeFromMyList(id, vendorId) {
    await api.delete(`/vendors/user/${id}`)
    myVendors.value = myVendors.value.filter(x => x.id !== id)
    const v = vendors.value.find(x => x.id === vendorId)
    if (v) v.myStatus = null
  }

  return {
    vendors, myVendors, categories, loading, error,
    totalBudget, bookedVendors,
    fetchVendors, fetchCategories, fetchMyVendors,
    addToMyList, updateMyVendor, removeFromMyList,
  }
})
