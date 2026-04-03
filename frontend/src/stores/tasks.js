import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/composables/useApi'

export const useTasksStore = defineStore('tasks', () => {
  const tasks      = ref([])
  const stats      = ref(null)
  const categories = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  const todoTasks       = computed(() => tasks.value.filter(t => t.status === 'todo'))
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress'))
  const doneTasks       = computed(() => tasks.value.filter(t => t.status === 'done'))

  async function fetchTasks(filters = {}) {
    loading.value = true
    error.value   = null
    try {
      const res = await api.get('/tasks', { params: filters })
      tasks.value = res.data
    } catch (e) {
      error.value = e.response?.data?.error || 'שגיאה בטעינת המשימות'
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    try {
      const res = await api.get('/tasks/stats')
      stats.value = res.data
    } catch {}
  }

  async function fetchCategories() {
    try {
      const res = await api.get('/tasks/categories')
      categories.value = res.data
    } catch {}
  }

  async function createTask(data) {
    const res = await api.post('/tasks', data)
    tasks.value.unshift(res.data)
    await fetchStats()
    return res.data
  }

  async function updateTask(id, data) {
    const res = await api.patch(`/tasks/${id}`, data)
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx !== -1) tasks.value[idx] = res.data
    await fetchStats()
    return res.data
  }

  async function toggleDone(id) {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    return updateTask(id, { status: newStatus })
  }

  async function deleteTask(id) {
    await api.delete(`/tasks/${id}`)
    tasks.value = tasks.value.filter(t => t.id !== id)
    await fetchStats()
  }

  return {
    tasks, stats, categories, loading, error,
    todoTasks, inProgressTasks, doneTasks,
    fetchTasks, fetchStats, fetchCategories,
    createTask, updateTask, toggleDone, deleteTask,
  }
})
