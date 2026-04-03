<template>
  <div class="category-view fade-in" dir="rtl">

    <!-- Back -->
    <button class="back-btn" @click="$router.push('/app/budget')">← חזרה לתקציב</button>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadData">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="cat-header card card-body">
        <div class="cat-icon-wrap" :style="`background: ${category?.color || '#eee'}33`">
          <span class="cat-icon">{{ category?.icon || '💰' }}</span>
        </div>
        <div class="cat-info">
          <h1 class="cat-name">{{ category?.name }}</h1>
          <div class="cat-amounts">
            <span class="amount-badge allocated">מוקצה: {{ formatCurrency(category?.allocatedAmount) }}</span>
            <span class="amount-badge spent">הוצא: {{ formatCurrency(totalSpent) }}</span>
            <span class="amount-badge remain" :class="{ negative: remaining < 0 }">נותר: {{ formatCurrency(remaining) }}</span>
          </div>
        </div>
      </div>

      <!-- Progress -->
      <div class="progress-section card card-body">
        <div class="progress-header">
          <span>{{ pct }}% מהתקציב נוצל</span>
          <span>{{ formatCurrency(totalSpent) }} / {{ formatCurrency(category?.allocatedAmount) }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="`width: ${pct}%; background: ${category?.color || 'var(--color-primary)'}`"></div>
        </div>
      </div>

      <!-- Expenses -->
      <div class="expenses-section">
        <div class="expenses-header">
          <h2>הוצאות ({{ expenses.length }})</h2>
          <button class="btn btn-primary" @click="showAddModal = true">+ הוסף הוצאה</button>
        </div>

        <div v-if="expenses.length === 0" class="empty-state card card-body">
          <div style="font-size:2rem">📝</div>
          <p>אין הוצאות עדיין. הוסיפו את ההוצאה הראשונה!</p>
        </div>

        <div v-else class="expenses-list">
          <div v-for="exp in expenses" :key="exp.id" class="expense-card card card-body">
            <div class="exp-main">
              <div class="exp-info">
                <div class="exp-vendor">{{ exp.vendor || '—' }}</div>
                <div class="exp-desc">{{ exp.description || '—' }}</div>
              </div>
              <div class="exp-right">
                <div class="exp-amount">{{ formatCurrency(exp.amount) }}</div>
                <div class="exp-badge" :class="exp.isPaid ? 'paid' : 'unpaid'">
                  {{ exp.isPaid ? 'שולם ✓' : 'לא שולם' }}
                </div>
              </div>
            </div>
            <button class="delete-btn" @click="deleteExpense(exp.id)" title="מחק">🗑️</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Add Expense Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal card" dir="rtl">
          <div class="modal-header">
            <h3>הוצאה חדשה</h3>
            <button class="modal-close" @click="showAddModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">ספק</label>
              <input v-model="newExp.vendor" type="text" class="form-input" placeholder="לדוגמה: פוטוגרפיה אבן" />
            </div>
            <div class="form-group">
              <label class="form-label">תיאור</label>
              <input v-model="newExp.description" type="text" class="form-input" placeholder="לדוגמה: מקדמה לחבילה בסיסית" />
            </div>
            <div class="form-group">
              <label class="form-label">סכום (₪) *</label>
              <input v-model="newExp.amount" type="number" class="form-input" placeholder="0" min="0" />
            </div>
            <div class="form-group form-toggle">
              <label class="form-label">שולם?</label>
              <label class="toggle-switch">
                <input type="checkbox" v-model="newExp.isPaid" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="addError" class="form-error-msg">{{ addError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddModal = false">ביטול</button>
            <button class="btn btn-primary" :disabled="adding" @click="addExpense">
              {{ adding ? 'שומר...' : 'שמור' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const id = route.params.id

const loading = ref(true)
const error = ref(null)
const category = ref(null)
const expenses = ref([])
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref(null)
const newExp = ref({ vendor: '', description: '', amount: '', isPaid: false })

const totalSpent = computed(() => expenses.value.reduce((s, e) => s + (e.amount || 0), 0))
const remaining = computed(() => (category.value?.allocatedAmount || 0) - totalSpent.value)
const pct = computed(() => {
  if (!category.value?.allocatedAmount) return 0
  return Math.min(100, Math.round((totalSpent.value / category.value.allocatedAmount) * 100))
})

function formatCurrency(n) {
  return `₪${Math.round(n || 0).toLocaleString('he-IL')}`
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    // Get category info from budget overview
    const budgetRes = await api.get('/budget')
    category.value = budgetRes.data.categories.find(c => c.id === parseInt(id))
    if (!category.value) { error.value = 'קטגוריה לא נמצאה'; return }

    const expRes = await api.get(`/budget/categories/${id}/expenses`)
    expenses.value = expRes.data
    // update category expenses for correct count
    category.value.expenses = expenses.value
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

async function addExpense() {
  addError.value = null
  if (!newExp.value.amount || isNaN(newExp.value.amount)) { addError.value = 'סכום נדרש'; return }
  adding.value = true
  try {
    await api.post(`/budget/categories/${id}/expenses`, {
      vendor: newExp.value.vendor,
      description: newExp.value.description,
      amount: parseFloat(newExp.value.amount),
      isPaid: newExp.value.isPaid
    })
    showAddModal.value = false
    newExp.value = { vendor: '', description: '', amount: '', isPaid: false }
    await loadData()
  } catch (e) {
    addError.value = e.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    adding.value = false
  }
}

async function deleteExpense(expId) {
  if (!confirm('למחוק את ההוצאה הזו?')) return
  try {
    await api.delete(`/budget/expenses/${expId}`)
    expenses.value = expenses.value.filter(e => e.id !== expId)
  } catch (e) {
    alert('שגיאה במחיקה')
  }
}

onMounted(loadData)
</script>

<style scoped>
.category-view { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

.back-btn { background: none; border: none; color: var(--color-primary); font-size: var(--font-size-sm); cursor: pointer; margin-bottom: var(--space-5); padding: 0; font-weight: 600; }
.back-btn:hover { text-decoration: underline; }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.cat-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); }
.cat-icon-wrap { width: 56px; height: 56px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cat-icon { font-size: 1.8rem; }
.cat-name { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-2); }
.cat-amounts { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.amount-badge { padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; }
.amount-badge.allocated { background: var(--color-bg); color: var(--color-navy); }
.amount-badge.spent { background: var(--color-primary-light); color: var(--color-primary); }
.amount-badge.remain { background: var(--color-success-bg); color: var(--color-success); }
.amount-badge.remain.negative { background: var(--color-error-bg); color: var(--color-error); }

.progress-section { margin-bottom: var(--space-6); }
.progress-header { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); }
.progress-bar { height: 10px; background: var(--color-bg); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; }

.expenses-section { }
.expenses-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.expenses-header h2 { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }
.empty-state { text-align: center; padding: var(--space-10); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }

.expenses-list { display: flex; flex-direction: column; gap: var(--space-3); }
.expense-card { position: relative; }
.exp-main { display: flex; justify-content: space-between; align-items: flex-start; }
.exp-vendor { font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-1); }
.exp-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.exp-right { text-align: left; display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
.exp-amount { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.exp-badge { padding: 3px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.exp-badge.paid { background: var(--color-success-bg); color: var(--color-success); }
.exp-badge.unpaid { background: var(--color-warning-bg); color: var(--color-warning); }
.delete-btn { position: absolute; top: var(--space-3); left: var(--space-3); background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.4; transition: opacity var(--transition-fast); }
.delete-btn:hover { opacity: 1; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-5) 0; }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
.modal-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: 0 var(--space-5) var(--space-5); }

.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-toggle { flex-direction: row; align-items: center; justify-content: space-between; }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-base); outline: none; transition: border-color var(--transition-fast); }
.form-input:focus { border-color: var(--color-primary); }
.form-error-msg { color: var(--color-error); font-size: var(--font-size-sm); }

.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; background: var(--color-border); border-radius: var(--radius-full); cursor: pointer; transition: background var(--transition-fast); }
.toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: transform var(--transition-fast); }
.toggle-switch input:checked + .toggle-slider { background: var(--color-primary); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
</style>
