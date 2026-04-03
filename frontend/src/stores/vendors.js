import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/useApi'

export const useVendorsStore = defineStore('vendors', () => {
  const vendors       = ref([])
  const categories    = ref([])
  const loading       = ref(false)
  const error         = ref(null)

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

  async function addToMyList(vendorId, status = 'considering') {
    const res = await api.post('/vendors/user', { vendorId, status })
    const v = vendors.value.find(x => x.id === vendorId)
    if (v) v.myStatus = status
    return res.data
  }

  async function removeFromMyList(userVendorId, vendorId) {
    await api.delete(`/vendors/user/${userVendorId}`)
    const v = vendors.value.find(x => x.id === vendorId)
    if (v) v.myStatus = null
  }

  return { vendors, categories, loading, error, fetchVendors, fetchCategories, addToMyList, removeFromMyList }
})
