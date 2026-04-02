<template>
  <div class="budget-category fade-in" dir="rtl">

    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="skeleton" style="height:40px;width:120px;margin-bottom:var(--space-6);"></div>
      <div class="skeleton" style="height:140px;border-radius:var(--radius-xl);margin-bottom:var(--space-6);"></div>
      <div v-for="i in 4" :key="i" class="skeleton" style="height:72px;border-radius:var(--radius-lg);margin-bottom:12px;"></div>
    </template>

    <!-- Error State -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הנתונים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="fetchCategory">נסה שוב</button>
    </div>

    <!-- Content -->
    <template v-else-if="cat">

      <!-- Back Button -->
      <RouterLink to="/app/budget" class="back-btn">
        ← חזור לתקציב
      </RouterLink>

      <!-- Category Header -->
      <div class="cat-header card">
        <div class="card-body">
          <div class="cat-header-top">
            <div class="cat-identity">
              <span class="cat-icon" :style="{ background: (cat.color || '#E91E8C') + '22' }">{{ cat.icon || '📋' }}</span>
              <div>
                <div class="cat-name-wrap">
                  <h1 v-if="!editingName" class="cat-title">{{ cat.name }}</h1>
                  <input
                    v-else
                    v-model="nameEditVal"
                    class="input cat-name-input"
                    @keydown.enter="saveName"
                    @keydown.esc="editingName = false"
                    ref="nameInputRef"
                  />
                  <button v-if="!editingName" class="btn btn-ghost btn-icon btn-sm edit-name-btn" @click="startEditName" title="ערוך שם">✏️</button>
                  <template v-else>
                    <button class="btn btn-primary btn-sm" @click="saveName" :disabled="savingName">✓</button>
                    <button class="btn btn-ghost btn-sm" @click="editingName = false">✕</button>
                  </template>
                </div>
              </div>
            </div>
            <div class="allocated-edit">
              <span class="allocated-label">מוקצה:</span>
              <template v-if="!editingAllocated">
                <span class="allocated-val">{{ formatCurrency(cat.allocatedAmount) }}</span>
                <button class="btn btn-ghost btn-icon btn-sm" @click="startEditAllocated" title="ערוך סכום מוקצה">✏️</button>
              </template>
              <template v-else>
                <input
                  v-model.number="allocatedEditVal"
                  type="number"
                  class="input allocated-input"
                  @keydown.enter="saveAllocated"
                  @keydown.esc="editingAllocated = false"
                  ref="allocatedInputRef"
                  min="0"
                />
                <button class="btn btn-primary btn-sm" @click="saveAllocated" :disabled="savingAllocated">✓</button>
                <button class="btn btn-ghost btn-sm" @click="editingAllocated = false">✕</button>
              </template>
            </div>
          </div>

          <!-- Stats Bar -->
          <div class="stats-row">
            <div class="stat-pill">
              <span class="stat-pill-label">הוצאות</span>
              <span class="stat-pill-val spent">{{ formatCurrency(cat.spent) }}</span>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">{{ cat.remaining < 0 ? 'חריגה' : 'יתרה' }}</span>
              <span class="stat-pill-val" :class="cat.remaining < 0 ? 'text-danger' : 'text-success'">
                {{ formatCurrency(Math.abs(cat.remaining)) }}
              </span>
            </div>
            <div class="stat-pill wide">
              <span class="stat-pill-label">{{ cat.pct }}% מהתקציב</span>
              <div class="mini-progress">
                <div
                  class="mini-fill"
                  :style="{
                    width: Math.min(cat.pct, 100) + '%',
                    background: cat.overBudget ? 'var(--color-error)' : (cat.pct >= 80 ? 'var(--color-warning)' : undefined)
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Expense Form -->
      <div class="add-expense-card card">
        <div class="card-body">
          <h2 class="section-title">הוסף הוצאה</h2>
          <div class="expense-form">
            <div class="form-group">
              <label class="label">שם ספק *</label>
              <input v-model="newExpense.vendorName" class="input" placeholder="לדוגמה: כרמל אולמות" />
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="label">סכום (₪) *</label>
                <input v-model.number="newExpense.amount" type="number" class="input" placeholder="0" min="0" />
              </div>
              <div class="form-group">
                <label class="label">תאריך</label>
                <input v-model="newExpense.date" type="date" class="input" />
              </div>
              <div class="form-group paid-group">
                <label class="label">שולם?</label>
                <label class="toggle-label">
                  <input type="checkbox" v-model="newExpense.isPaid" class="toggle-check" />
                  <span class="toggle-btn" :class="{ active: newExpense.isPaid }">
                    {{ newExpense.isPaid ? '✓ שולם' : 'ממתין' }}
                  </span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label class="label">הערות</label>
              <input v-model="newExpense.note" class="input" placeholder="פרטים נוספים..." />
            </div>
            <p v-if="addExpenseError" class="form-error">{{ addExpenseError }}</p>
            <button class="btn btn-primary" @click="submitAddExpense" :disabled="addExpenseLoading">
              {{ addExpenseLoading ? 'שומר...' : '+ הוסף הוצאה' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Expenses List -->
      <div class="expenses-section">
        <div class="section-header">
          <h2 class="section-title">הוצאות ({{ cat.expenses.length }})</h2>
          <span v-if="cat.expenses.length" class="section-total">
            סה"כ: {{ formatCurrency(cat.spent) }}
          </span>
        </div>

        <!-- Empty state -->
        <div v-if="cat.expenses.length === 0" class="empty-expenses card">
          <div class="card-body">
            <div class="empty-state-icon">🧾</div>
            <p class="empty-state-title">אין הוצאות עדיין</p>
            <p class="empty-state-text">הוסף הוצאה ראשונה לקטגוריה זו</p>
          </div>
        </div>

        <!-- List -->
        <div v-else class="expenses-list">
          <div
            v-for="expense in cat.expenses"
            :key="expense.id"
            class="expense-row card"
            :class="{ 'editing-row': editingExpenseId === expense.id }"
          >
            <!-- View mode -->
            <template v-if="editingExpenseId !== expense.id">
              <div class="card-body expense-body">
                <div class="expense-main">
                  <div class="expense-left">
                    <span class="paid-dot" :class="expense.isPaid ? 'paid' : 'unpaid'" :title="expense.isPaid ? 'שולם' : 'ממתין לתשלום'"></span>
                    <div>
                      <span class="vendor-name">{{ expense.vendorName }}</span>
                      <div class="expense-meta">
                        <span v-if="expense.note" class="expense-note">{{ expense.note }}</span>
                        <span class="expense-date">{{ formatDate(expense.date) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="expense-right">
                    <span class="expense-amount">{{ formatCurrency(expense.amount) }}</span>
                    <span class="paid-badge" :class="expense.isPaid ? 'badge-success' : 'badge-warning'">
                      {{ expense.isPaid ? 'שולם' : 'ממתין' }}
                    </span>
                  </div>
                </div>
                <div class="expense-actions">
                  <button class="btn btn-ghost btn-sm" @click="startEditExpense(expense)">✏️ ערוך</button>
                  <button class="btn btn-ghost btn-sm text-danger" @click="deleteExpense(expense.id)" :disabled="deletingId === expense.id">
                    {{ deletingId === expense.id ? '...' : '🗑️ מחק' }}
                  </button>
                </div>
              </div>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <div class="card-body">
                <h4 style="font-weight:700;color:var(--color-navy);margin-bottom:var(--space-3);">עריכת הוצאה</h4>
                <div class="form-group">
                  <label class="label">שם ספק *</label>
                  <input v-model="editForm.vendorName" class="input" />
                </div>
                <div class="form-row-3">
                  <div class="form-group">
                    <label class="label">סכום (₪)</label>
                    <input v-model.number="editForm.amount" type="number" class="input" />
                  </div>
                  <div class="form-group">
                    <label class="label">תאריך</label>
                    <input v-model="editForm.date" type="date" class="input" />
                  </div>
                  <div class="form-group paid-group">
                    <label class="label">שולם?</label>
                    <label class="toggle-label">
                      <input type="checkbox" v-model="editForm.isPaid" class="toggle-check" />
                      <span class="toggle-btn" :class="{ active: editForm.isPaid }">
                        {{ editForm.isPaid ? '✓ שולם' : 'ממתין' }}
                      </span>
                    </label>
                  </div>
                </div>
                <div class="form-group">
                  <label class="label">הערות</label>
                  <input v-model="editForm.note" class="input" />
                </div>
                <div class="edit-actions">
                  <button class="btn btn-ghost" @click="editingExpenseId = null">ביטול</button>
                  <button class="btn btn-primary" @click="saveEditExpense" :disabled="savingExpense">
                    {{ savingExpense ? 'שומר...' : 'שמור שינויים' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const loading = ref(true)
const error = ref(null)
const cat = ref(null)

// Inline edit - name
const editingName = ref(false)
const nameEditVal = ref('')
const savingName = ref(false)
const nameInputRef = ref(null)

// Inline edit - allocated
const editingAllocated = ref(false)
const allocatedEditVal = ref(0)
const savingAllocated = ref(false)
const allocatedInputRef = ref(null)

// New expense form
const newExpense = ref({ vendorName: '', amount: null, note: '', isPaid: false, date: todayDate() })
const addExpenseLoading = ref(false)
const addExpenseError = ref(null)

// Edit expense
const editingExpenseId = ref(null)
const editForm = ref({})
const savingExpense = ref(false)
const deletingId = ref(null)

function todayDate() {
  return new Date().toISOString().split('T')[0]
}

function formatCurrency(val) {
  if (!val && val !== 0) return '₪0'
  return '₪' + Math.round(val).toLocaleString('he-IL')
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function fetchCategory() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/budget/${route.params.categoryId}`)
    cat.value = res.data
    allocatedEditVal.value = res.data.allocatedAmount
    nameEditVal.value = res.data.name
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

// ── Name edit ──────────────────────────────────────────────────────────────────
function startEditName() {
  nameEditVal.value = cat.value.name
  editingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

async function saveName() {
  if (!nameEditVal.value.trim()) return
  savingName.value = true
  try {
    await api.put(`/budget/${cat.value.id}`, { name: nameEditVal.value })
    cat.value.name = nameEditVal.value
    editingName.value = false
  } finally {
    savingName.value = false
  }
}

// ── Allocated edit ────────────────────────────────────────────────────────────
function startEditAllocated() {
  allocatedEditVal.value = cat.value.allocatedAmount
  editingAllocated.value = true
  nextTick(() => allocatedInputRef.value?.focus())
}

async function saveAllocated() {
  savingAllocated.value = true
  try {
    await api.put(`/budget/${cat.value.id}`, { allocatedAmount: allocatedEditVal.value })
    cat.value.allocatedAmount = allocatedEditVal.value
    cat.value.remaining = allocatedEditVal.value - cat.value.spent
    cat.value.pct = allocatedEditVal.value > 0
      ? Math.min(Math.round((cat.value.spent / allocatedEditVal.value) * 100), 999) : 0
    cat.value.overBudget = cat.value.spent > allocatedEditVal.value && allocatedEditVal.value > 0
    editingAllocated.value = false
  } finally {
    savingAllocated.value = false
  }
}

// ── Add expense ───────────────────────────────────────────────────────────────
async function submitAddExpense() {
  addExpenseError.value = null
  if (!newExpense.value.vendorName.trim()) {
    addExpenseError.value = 'נא להזין שם ספק'
    return
  }
  if (!newExpense.value.amount || newExpense.value.amount <= 0) {
    addExpenseError.value = 'נא להזין סכום תקין'
    return
  }
  addExpenseLoading.value = true
  try {
    const res = await api.post(`/budget/${cat.value.id}/expenses`, newExpense.value)
    cat.value.expenses.unshift(res.data)
    cat.value.spent += res.data.amount
    cat.value.remaining = cat.value.allocatedAmount - cat.value.spent
    cat.value.pct = cat.value.allocatedAmount > 0
      ? Math.min(Math.round((cat.value.spent / cat.value.allocatedAmount) * 100), 999) : 0
    cat.value.overBudget = cat.value.spent > cat.value.allocatedAmount && cat.value.allocatedAmount > 0
    // Reset form
    newExpense.value = { vendorName: '', amount: null, note: '', isPaid: false, date: todayDate() }
  } catch (e) {
    addExpenseError.value = e?.response?.data?.message || 'שגיאה בהוספת הוצאה'
  } finally {
    addExpenseLoading.value = false
  }
}

// ── Edit expense ──────────────────────────────────────────────────────────────
function startEditExpense(expense) {
  editingExpenseId.value = expense.id
  editForm.value = {
    vendorName: expense.vendorName,
    amount: expense.amount,
    note: expense.note || '',
    isPaid: expense.isPaid,
    date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : todayDate()
  }
}

async function saveEditExpense() {
  savingExpense.value = true
  try {
    const res = await api.put(`/budget/${cat.value.id}/expenses/${editingExpenseId.value}`, editForm.value)
    const idx = cat.value.expenses.findIndex(e => e.id === editingExpenseId.value)
    if (idx !== -1) {
      const oldAmount = cat.value.expenses[idx].amount
      cat.value.expenses[idx] = res.data
      cat.value.spent = cat.value.spent - oldAmount + res.data.amount
      cat.value.remaining = cat.value.allocatedAmount - cat.value.spent
      cat.value.pct = cat.value.allocatedAmount > 0
        ? Math.min(Math.round((cat.value.spent / cat.value.allocatedAmount) * 100), 999) : 0
      cat.value.overBudget = cat.value.spent > cat.value.allocatedAmount && cat.value.allocatedAmount > 0
    }
    editingExpenseId.value = null
  } finally {
    savingExpense.value = false
  }
}

// ── Delete expense ────────────────────────────────────────────────────────────
async function deleteExpense(id) {
  if (!confirm('למחוק הוצאה זו?')) return
  deletingId.value = id
  try {
    await api.delete(`/budget/${cat.value.id}/expenses/${id}`)
    const idx = cat.value.expenses.findIndex(e => e.id === id)
    if (idx !== -1) {
      cat.value.spent -= cat.value.expenses[idx].amount
      cat.value.expenses.splice(idx, 1)
      cat.value.remaining = cat.value.allocatedAmount - cat.value.spent
      cat.value.pct = cat.value.allocatedAmount > 0
        ? Math.min(Math.round((cat.value.spent / cat.value.allocatedAmount) * 100), 999) : 0
      cat.value.overBudget = cat.value.spent > cat.value.allocatedAmount && cat.value.allocatedAmount > 0
    }
  } finally {
    deletingId.value = null
  }
}

onMounted(fetchCategory)
</script>

<style scoped>
.budget-category { padding: var(--space-4) 0; }

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: var(--space-5);
  transition: color var(--transition);
}
.back-btn:hover { color: var(--color-primary); }

/* Header */
.cat-header { margin-bottom: var(--space-5); }
.cat-header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.cat-identity { display: flex; align-items: center; gap: var(--space-3); }
.cat-icon {
  width: 52px; height: 52px;
  border-radius: var(--radius-xl);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.cat-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.cat-name-wrap { display: flex; align-items: center; gap: var(--space-2); }
.cat-name-input { font-size: var(--font-size-xl); font-weight: 700; height: 42px; width: 220px; }
.edit-name-btn { opacity: 0.5; }
.edit-name-btn:hover { opacity: 1; }

.allocated-edit { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.allocated-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 600; }
.allocated-val { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.allocated-input { width: 140px; height: 40px; font-size: var(--font-size-base); font-weight: 700; }

.stats-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.stat-pill {
  display: flex; flex-direction: column; gap: 4px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  min-width: 120px;
}
.stat-pill.wide { flex: 1; min-width: 180px; }
.stat-pill-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }
.stat-pill-val { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.stat-pill-val.spent { color: var(--color-primary); }
.text-danger { color: var(--color-error) !important; }
.text-success { color: var(--color-success) !important; }

.mini-progress { height: 6px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; margin-top: 4px; }
.mini-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #ff6bc8);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}

/* Add Expense */
.add-expense-card { margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-4); }
.expense-form { display: flex; flex-direction: column; gap: 0; }
.expense-form .form-group { margin-bottom: var(--space-4); }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 120px; gap: var(--space-3); }

.paid-group { display: flex; flex-direction: column; }
.toggle-label { display: flex; align-items: center; cursor: pointer; }
.toggle-check { display: none; }
.toggle-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-xs);
  font-weight: 700;
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  border: 1.5px solid var(--color-border);
  transition: all var(--transition);
  white-space: nowrap;
}
.toggle-btn.active {
  background: var(--color-success-bg);
  color: #16A34A;
  border-color: var(--color-success);
}

/* Section header */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.section-total { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); }

/* Expenses */
.expenses-list { display: flex; flex-direction: column; gap: var(--space-3); }
.expense-row { transition: box-shadow var(--transition); }
.expense-row:hover { box-shadow: var(--shadow); }
.expense-row.editing-row { border-color: var(--color-primary); }

.expense-body { padding: var(--space-4) var(--space-5) !important; }
.expense-main { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-2); }
.expense-left { display: flex; align-items: flex-start; gap: var(--space-3); }
.expense-right { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-1); flex-shrink: 0; }

.paid-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
.paid-dot.paid { background: var(--color-success); }
.paid-dot.unpaid { background: var(--color-warning); }

.vendor-name { display: block; font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.expense-meta { display: flex; gap: var(--space-3); margin-top: 2px; }
.expense-note { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.expense-date { font-size: var(--font-size-xs); color: var(--color-text-light); }
.expense-amount { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.paid-badge {
  display: inline-flex; align-items: center; padding: 2px 8px;
  border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;
}
.badge-success { background: var(--color-success-bg); color: #16A34A; }
.badge-warning { background: var(--color-warning-bg); color: #D97706; }

.expense-actions { display: flex; gap: var(--space-1); }
.edit-actions { display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-2); }

.empty-expenses { text-align: center; }

@media (max-width: 640px) {
  .cat-header-top { flex-direction: column; }
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
