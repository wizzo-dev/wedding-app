<template>
  <div class="category-view fade-in" dir="rtl">

    <!-- Back button -->
    <button class="btn-back" @click="router.back()">← חזרה</button>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary btn-sm" @click="loadData">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Category Header -->
      <div class="cat-header">
        <div class="cat-icon" :style="{ background: category?.color || '#e0e7ff' }">
          {{ category?.icon || '💰' }}
        </div>
        <div class="cat-header-info">
          <h1 class="page-title">{{ category?.name || 'קטגוריה' }}</h1>
          <div class="cat-amounts-row">
            <span class="badge spent-badge">הוצא: {{ formatMoney(totalSpent) }}</span>
            <span class="badge alloc-badge">מוקצה: {{ formatMoney(category?.allocatedAmount || 0) }}</span>
            <span class="badge remaining-badge" :class="{ over: remaining < 0 }">
              {{ remaining >= 0 ? 'נותר' : 'חריגה' }}: {{ formatMoney(Math.abs(remaining)) }}
            </span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAddExpense">+ הוצאה</button>
      </div>

      <!-- Progress Bar -->
      <div v-if="category?.allocatedAmount > 0" class="progress-section">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: Math.min(100, (totalSpent / category.allocatedAmount) * 100) + '%',
              background: category?.color || '#3b82f6'
            }"
          ></div>
        </div>
        <span class="progress-pct">{{ spentPercent }}%</span>
      </div>

      <!-- Expenses List -->
      <div class="expenses-section">
        <div class="section-header">
          <h2 class="section-title">הוצאות ({{ expenses.length }})</h2>
        </div>

        <div v-if="expenses.length === 0" class="empty-state-small">
          <p>אין הוצאות עדיין — הוסף הוצאה ראשונה</p>
        </div>

        <div v-else class="expense-list">
          <div v-for="exp in expenses" :key="exp.id" class="expense-card card">
            <div class="card-body expense-body">
              <div class="expense-main">
                <div class="expense-vendor">{{ exp.vendorName }}</div>
                <div v-if="exp.note" class="expense-note">{{ exp.note }}</div>
                <div class="expense-date">{{ formatDate(exp.date) }}</div>
              </div>
              <div class="expense-right">
                <div class="expense-amount">{{ formatMoney(exp.amount) }}</div>
                <button class="btn-icon danger" @click="deleteExpense(exp.id)" title="מחיקה">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Add Expense Modal -->
    <div v-if="showAddExpense" class="modal-overlay" @click.self="closeAddExpense">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">הוספת הוצאה</h3>
          <div class="form-group">
            <label class="form-label">שם ספק / תשלום *</label>
            <input v-model="expForm.vendorName" class="input" placeholder="לדוגמה: קייטרינג ישי" />
          </div>
          <div class="form-group">
            <label class="form-label">סכום (₪) *</label>
            <input v-model.number="expForm.amount" type="number" min="0" class="input" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">תאריך</label>
            <input v-model="expForm.date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label class="form-label">הערה</label>
            <input v-model="expForm.note" class="input" placeholder="אופציונלי" />
          </div>
          <p v-if="modalError" class="form-error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn btn-primary" :disabled="savingExp" @click="saveExpense">
              {{ savingExp ? 'שומר...' : 'שמור' }}
            </button>
            <button class="btn btn-outline" @click="closeAddExpense">ביטול</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route  = useRoute()
const router = useRouter()
const categoryId = Number(route.params.id)

// ── State ─────────────────────────────────────────────────────────────────────
const loading   = ref(true)
const error     = ref(null)
const category  = ref(null)
const expenses  = ref([])

// Add expense modal
const showAddExpense = ref(false)
const savingExp      = ref(false)
const modalError     = ref(null)
const expForm = ref({ vendorName: '', amount: 0, note: '', date: todayStr() })

// ── Computed ──────────────────────────────────────────────────────────────────
const totalSpent = computed(() =>
  expenses.value.reduce((sum, e) => sum + e.amount, 0)
)
const remaining = computed(() =>
  (category.value?.allocatedAmount || 0) - totalSpent.value
)
const spentPercent = computed(() => {
  const alloc = category.value?.allocatedAmount || 0
  if (alloc === 0) return 0
  return Math.min(100, Math.round((totalSpent.value / alloc) * 100))
})

// ── Methods ───────────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  error.value   = null
  try {
    // Load both budget summary (for category info) and expenses filtered by categoryId
    const [budgetRes, expensesRes] = await Promise.all([
      api.get('/budget'),
      api.get('/budget/expenses', { params: { categoryId } })
    ])
    const cats = budgetRes.data.categories || []
    category.value = cats.find(c => c.id === categoryId) || null
    if (!category.value) {
      error.value = 'קטגוריה לא נמצאה'
      return
    }
    expenses.value = expensesRes.data.expenses || []
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

function formatMoney(val) {
  if (val === null || val === undefined) return '₪0'
  return '₪' + Number(val).toLocaleString('he-IL')
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function openAddExpense() {
  expForm.value = { vendorName: '', amount: 0, note: '', date: todayStr() }
  modalError.value = null
  showAddExpense.value = true
}

function closeAddExpense() {
  showAddExpense.value = false
  modalError.value = null
}

async function saveExpense() {
  modalError.value = null
  if (!expForm.value.vendorName?.trim()) {
    modalError.value = 'שם ספק נדרש'
    return
  }
  const amt = Number(expForm.value.amount)
  if (isNaN(amt) || amt < 0) {
    modalError.value = 'סכום לא תקין'
    return
  }
  savingExp.value = true
  try {
    const res = await api.post('/budget/expenses', {
      categoryId,
      vendorName: expForm.value.vendorName.trim(),
      amount: amt,
      note: expForm.value.note || null,
      date: expForm.value.date || null
    })
    expenses.value.unshift(res.data)
    closeAddExpense()
  } catch (e) {
    modalError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    savingExp.value = false
  }
}

async function deleteExpense(id) {
  if (!confirm('למחוק הוצאה זו?')) return
  try {
    await api.delete(`/budget/expenses/${id}`)
    expenses.value = expenses.value.filter(e => e.id !== id)
  } catch (e) {
    alert(e?.response?.data?.message || 'שגיאה במחיקת הוצאה')
  }
}

onMounted(loadData)
</script>

<style scoped>
.category-view { padding: var(--space-6, 1.5rem); max-width: 800px; margin: 0 auto; }
.btn-back { background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 0.9rem; padding: 0 0 1rem; display: block; }

/* Header */
.cat-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.cat-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
.cat-header-info { flex: 1; }
.page-title { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
.cat-amounts-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 600; }
.spent-badge { background: #fef3c7; color: #92400e; }
.alloc-badge { background: #dbeafe; color: #1e40af; }
.remaining-badge { background: #d1fae5; color: #065f46; }
.remaining-badge.over { background: #fee2e2; color: #991b1b; }

/* Progress */
.progress-section { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
.progress-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width .4s; }
.progress-pct { font-size: 0.85rem; font-weight: 600; color: #374151; white-space: nowrap; }

/* Expenses */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
.expense-list { display: flex; flex-direction: column; gap: 0.6rem; }
.expense-body { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.9rem 1.25rem; }
.expense-main { flex: 1; min-width: 0; }
.expense-vendor { font-weight: 600; font-size: 0.95rem; }
.expense-note { font-size: 0.8rem; color: #64748b; margin-top: 0.1rem; }
.expense-date { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
.expense-right { display: flex; align-items: center; gap: 0.5rem; }
.expense-amount { font-size: 1rem; font-weight: 700; color: #1e293b; }

/* Empty */
.empty-state-small { text-align: center; padding: 2.5rem; color: #64748b; background: #f8fafc; border-radius: 1rem; }

/* Loading */
.loading-center { text-align: center; padding: 4rem; }
.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { width: 100%; max-width: 420px; border-radius: 1rem; }
.modal-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 1.25rem; }
.form-group { margin-bottom: 1rem; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; color: #374151; }
.form-error { color: #dc2626; font-size: 0.85rem; margin-bottom: 0.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }

.empty-state { text-align: center; padding: 3rem; }
.empty-state-text { color: #64748b; margin-bottom: 1rem; }

.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.3rem; border-radius: 6px; transition: background .15s; }
.btn-icon.danger:hover { background: #fee2e2; }
</style>
