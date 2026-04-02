<template>
  <div class="category-view fade-in" dir="rtl">

    <!-- Loading -->
    <template v-if="loading">
      <div class="skeleton skeleton-header"></div>
      <div class="skeleton skeleton-table" style="margin-top:24px;"></div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <template v-else-if="category">
      <!-- Back + Header -->
      <div class="back-row">
        <button class="btn-back" @click="$router.push('/app/budget')">← חזרה לתקציב</button>
      </div>

      <!-- Category header -->
      <div class="cat-header">
        <div class="cat-icon-big" :style="{ background: (category.color || '#E91E8C') + '20' }">
          {{ category.icon || '💰' }}
        </div>
        <div class="cat-header-info">
          <!-- Inline name edit -->
          <div class="inline-edit-row">
            <template v-if="editingName">
              <input
                ref="nameInput"
                v-model="editName"
                class="inline-input"
                @blur="saveName"
                @keyup.enter="saveName"
                @keyup.escape="editingName = false"
              />
            </template>
            <template v-else>
              <h1 class="cat-name-heading" @click="startEditName">{{ category.name }}</h1>
              <button class="edit-icon-btn" @click="startEditName" title="ערוך שם">✏️</button>
            </template>
          </div>
          <!-- Inline allocated amount edit -->
          <div class="inline-edit-row">
            <span class="allocated-label">תקציב מוקצה:</span>
            <template v-if="editingAmount">
              <input
                ref="amountInput"
                v-model.number="editAmount"
                type="number"
                class="inline-input inline-input-sm"
                @blur="saveAmount"
                @keyup.enter="saveAmount"
                @keyup.escape="editingAmount = false"
              />
            </template>
            <template v-else>
              <span class="allocated-val" @click="startEditAmount">{{ fmt(category.allocatedAmount) }}</span>
              <button class="edit-icon-btn" @click="startEditAmount" title="ערוך סכום">✏️</button>
            </template>
          </div>
        </div>
        <!-- Stats pills -->
        <div class="cat-stats">
          <div class="stat-pill">
            <span class="pill-label">הוצא</span>
            <span class="pill-val spent">{{ fmt(category.spent) }}</span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">נותר</span>
            <span class="pill-val" :class="category.spent > category.allocatedAmount ? 'over' : 'ok'">
              {{ category.spent > category.allocatedAmount ? '⚠️ ' : '' }}{{ fmt(Math.abs(category.allocatedAmount - category.spent)) }}
            </span>
          </div>
          <div class="stat-pill">
            <span class="pill-label">שולם</span>
            <span class="pill-val paid">{{ fmt(category.paid) }}</span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-section">
        <div class="progress-meta">
          <span class="pct-label" :class="{ 'pct-over': category.pct >= 100, 'pct-warn': category.pct >= 80 && category.pct < 100 }">
            {{ category.pct }}% מהתקציב
          </span>
          <span class="progress-detail">{{ fmt(category.spent) }} / {{ fmt(category.allocatedAmount) }}</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{
              width: category.pct + '%',
              background: category.pct >= 100 ? 'var(--color-error)' : category.pct >= 80 ? 'var(--color-warning)' : category.color || 'var(--color-primary)'
            }"
          ></div>
        </div>
        <div v-if="category.pct >= 100" class="over-budget-alert">
          ⚠️ חרגת מהתקציב ב-{{ fmt(category.spent - category.allocatedAmount) }}
        </div>
      </div>

      <!-- Expenses table -->
      <div class="expenses-section">
        <div class="section-header">
          <h2 class="section-title">הוצאות</h2>
          <button class="btn btn-primary btn-sm" @click="showAdd = true">+ הוצאה חדשה</button>
        </div>

        <!-- Empty state -->
        <div v-if="category.expenses.length === 0" class="empty-state">
          <span class="empty-icon">💳</span>
          <h3>אין הוצאות עדיין</h3>
          <p>הוסף הוצאות לקטגוריה זו</p>
          <button class="btn btn-primary" @click="showAdd = true">+ הוסף הוצאה ראשונה</button>
        </div>

        <!-- Table -->
        <div v-else class="expenses-table-wrap">
          <table class="expenses-table">
            <thead>
              <tr>
                <th>ספק</th>
                <th>סכום</th>
                <th>תאריך</th>
                <th>סטטוס</th>
                <th>הערות</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="exp in category.expenses" :key="exp.id">
                <!-- Normal row -->
                <tr v-if="editingExpId !== exp.id" class="expense-row">
                  <td>
                    <div class="vendor-cell">
                      <span class="paid-dot" :class="exp.isPaid ? 'green' : 'amber'"></span>
                      {{ exp.vendorName }}
                    </div>
                  </td>
                  <td><strong>{{ fmt(exp.amount) }}</strong></td>
                  <td class="date-cell">{{ fmtDate(exp.date) }}</td>
                  <td>
                    <span class="paid-badge" :class="exp.isPaid ? 'paid' : 'unpaid'">{{ exp.isPaid ? '✓ שולם' : 'ממתין' }}</span>
                  </td>
                  <td class="notes-cell">{{ exp.note || '—' }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn" @click="startEditExp(exp)" title="ערוך">✏️</button>
                      <button class="icon-btn danger" @click="deleteExp(exp.id)" title="מחק">🗑️</button>
                    </div>
                  </td>
                </tr>
                <!-- Edit row -->
                <tr v-else class="expense-row edit-row">
                  <td>
                    <input v-model="editExp.vendorName" class="table-input" placeholder="שם ספק" />
                  </td>
                  <td>
                    <input v-model.number="editExp.amount" type="number" class="table-input table-input-sm" min="0" />
                  </td>
                  <td>
                    <input v-model="editExp.date" type="date" class="table-input" />
                  </td>
                  <td>
                    <label class="toggle-label">
                      <input v-model="editExp.isPaid" type="checkbox" />
                      <span>{{ editExp.isPaid ? 'שולם' : 'ממתין' }}</span>
                    </label>
                  </td>
                  <td>
                    <input v-model="editExp.note" class="table-input" placeholder="הערות" />
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="icon-btn success" @click="saveEditExp(exp.id)" title="שמור">✓</button>
                      <button class="icon-btn" @click="editingExpId = null" title="ביטול">✕</button>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="totals-row">
                <td>סה"כ</td>
                <td><strong>{{ fmt(category.spent) }}</strong></td>
                <td></td>
                <td><span class="paid-badge paid">{{ fmt(category.paid) }} שולם</span></td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Modal: Add Expense ──────────────────────────────────────────────────── -->
    <teleport to="body">
      <div v-if="showAdd" class="modal-overlay" @click.self="showAdd = false">
        <div class="modal">
          <div class="modal-header">
            <h3>הוסף הוצאה לקטגוריה <em>{{ category?.name }}</em></h3>
            <button class="modal-close" @click="showAdd = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-label">שם ספק *</label>
            <input v-model="newExp.vendorName" type="text" class="form-input" placeholder="לדוגמה: צלם דוד לוי" />
            <label class="form-label">סכום (₪) *</label>
            <input v-model.number="newExp.amount" type="number" class="form-input" min="0" step="100" placeholder="0" />
            <label class="form-label">תאריך</label>
            <input v-model="newExp.date" type="date" class="form-input" />
            <label class="form-label">הערות</label>
            <input v-model="newExp.note" type="text" class="form-input" placeholder="הערות אופציונלי" />
            <label class="form-check">
              <input v-model="newExp.isPaid" type="checkbox" /> שולם
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAdd = false">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="addExpense">
              {{ saving ? 'שומר...' : 'הוסף הוצאה' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const catId = Number(route.params.id)

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const category = ref(null)

// Inline editing
const editingName = ref(false)
const editName = ref('')
const nameInput = ref(null)
const editingAmount = ref(false)
const editAmount = ref(0)
const amountInput = ref(null)

// Table row editing
const editingExpId = ref(null)
const editExp = ref({})

// Add expense modal
const showAdd = ref(false)
const newExp = ref({ vendorName: '', amount: 0, isPaid: false, note: '', date: new Date().toISOString().split('T')[0] })

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/budget/categories/${catId}`)
    category.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת קטגוריה'
  } finally {
    loading.value = false
  }
}

async function startEditName() {
  editName.value = category.value.name
  editingName.value = true
  await nextTick()
  nameInput.value?.focus()
}

async function saveName() {
  if (!editName.value.trim() || editName.value === category.value.name) {
    editingName.value = false
    return
  }
  saving.value = true
  try {
    await api.put(`/budget/categories/${catId}`, { name: editName.value })
    category.value.name = editName.value.trim()
    editingName.value = false
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

async function startEditAmount() {
  editAmount.value = category.value.allocatedAmount
  editingAmount.value = true
  await nextTick()
  amountInput.value?.focus()
}

async function saveAmount() {
  saving.value = true
  try {
    await api.put(`/budget/categories/${catId}`, { allocatedAmount: editAmount.value })
    category.value.allocatedAmount = editAmount.value
    editingAmount.value = false
    // Recalculate pct
    category.value.pct = category.value.allocatedAmount > 0 ? Math.min(100, Math.round((category.value.spent / category.value.allocatedAmount) * 100)) : 0
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

function startEditExp(exp) {
  editingExpId.value = exp.id
  editExp.value = {
    vendorName: exp.vendorName,
    amount: exp.amount,
    isPaid: exp.isPaid,
    note: exp.note || '',
    date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : ''
  }
}

async function saveEditExp(id) {
  saving.value = true
  try {
    await api.put(`/budget/categories/${catId}/expenses/${id}`, {
      vendorName: editExp.value.vendorName,
      amount: editExp.value.amount,
      isPaid: editExp.value.isPaid,
      note: editExp.value.note || null,
      date: editExp.value.date || null
    })
    editingExpId.value = null
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

async function deleteExp(id) {
  if (!confirm('למחוק הוצאה זו?')) return
  saving.value = true
  try {
    await api.delete(`/budget/categories/${catId}/expenses/${id}`)
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה במחיקה')
  } finally {
    saving.value = false
  }
}

async function addExpense() {
  if (!newExp.value.vendorName.trim()) { alert('שם ספק נדרש'); return }
  if (!newExp.value.amount || newExp.value.amount <= 0) { alert('הזן סכום תקין'); return }
  saving.value = true
  try {
    await api.post(`/budget/categories/${catId}/expenses`, {
      vendorName: newExp.value.vendorName,
      amount: newExp.value.amount,
      isPaid: newExp.value.isPaid,
      note: newExp.value.note || null,
      date: newExp.value.date || null
    })
    showAdd.value = false
    newExp.value = { vendorName: '', amount: 0, isPaid: false, note: '', date: new Date().toISOString().split('T')[0] }
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בהוספה')
  } finally {
    saving.value = false
  }
}

function fmt(n) {
  if (!n && n !== 0) return '—'
  return '₪' + Number(n).toLocaleString('he-IL')
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(load)
</script>

<style scoped>
.category-view { padding: var(--space-6); max-width: 1000px; }

.back-row { margin-bottom: var(--space-4); }
.btn-back { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); padding: var(--space-1) 0; display: flex; align-items: center; gap: var(--space-2); }
.btn-back:hover { text-decoration: underline; }

/* Category header */
.cat-header { display: flex; align-items: flex-start; gap: var(--space-5); background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); margin-bottom: var(--space-5); flex-wrap: wrap; }
.cat-icon-big { width: 64px; height: 64px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
.cat-header-info { flex: 1; min-width: 0; }
.inline-edit-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.cat-name-heading { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); cursor: pointer; }
.cat-name-heading:hover { text-decoration: underline dotted; }
.allocated-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.allocated-val { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-primary); cursor: pointer; }
.allocated-val:hover { text-decoration: underline dotted; }
.edit-icon-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; padding: 2px 4px; border-radius: var(--radius-sm); }
.edit-icon-btn:hover { opacity: 1; background: var(--color-bg-subtle); }
.inline-input { border: 1.5px solid var(--color-primary); border-radius: var(--radius); padding: var(--space-1) var(--space-3); font-family: var(--font); font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); background: #fff; outline: none; width: 260px; text-align: right; }
.inline-input-sm { font-size: var(--font-size-base); width: 140px; }

.cat-stats { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.stat-pill { background: var(--color-bg-subtle); border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4); text-align: center; min-width: 90px; }
.pill-label { display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; font-weight: 600; margin-bottom: var(--space-1); }
.pill-val { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.pill-val.spent { color: var(--color-primary); }
.pill-val.paid { color: var(--color-success); }
.pill-val.ok { color: var(--color-success); }
.pill-val.over { color: var(--color-error); }

/* Progress */
.progress-section { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); margin-bottom: var(--space-6); }
.progress-meta { display: flex; justify-content: space-between; margin-bottom: var(--space-2); }
.pct-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.pct-over { color: var(--color-error); }
.pct-warn { color: var(--color-warning); }
.progress-detail { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.progress-track { height: 14px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; border-radius: var(--radius-full); transition: width .5s ease; }
.over-budget-alert { margin-top: var(--space-2); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-error); padding: var(--space-2) var(--space-3); background: var(--color-error-bg); border-radius: var(--radius); }

/* Expenses section */
.expenses-section { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }

.expenses-table-wrap { overflow-x: auto; }
.expenses-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.expenses-table th { text-align: right; padding: var(--space-3) var(--space-4); border-bottom: 2px solid var(--color-border); font-weight: 600; color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .04em; }
.expenses-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); color: var(--color-navy); vertical-align: middle; }
.expense-row:hover td { background: var(--color-bg-subtle); }
.edit-row td { background: var(--color-primary-bg); }
.totals-row td { font-weight: 700; border-top: 2px solid var(--color-border); border-bottom: none; padding-top: var(--space-4); }

.vendor-cell { display: flex; align-items: center; gap: var(--space-2); }
.paid-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.paid-dot.green { background: var(--color-success); }
.paid-dot.amber { background: var(--color-warning); }
.date-cell { white-space: nowrap; color: var(--color-text-muted); }
.notes-cell { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-muted); }
.paid-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.paid-badge.paid { background: var(--color-success-bg); color: var(--color-success); }
.paid-badge.unpaid { background: var(--color-warning-bg); color: var(--color-warning); }

.row-actions { display: flex; gap: var(--space-1); }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: var(--radius-sm); transition: var(--transition-fast); }
.icon-btn:hover { background: var(--color-bg-subtle); }
.icon-btn.danger:hover { background: var(--color-error-bg); }
.icon-btn.success { color: var(--color-success); font-weight: 900; font-size: 18px; }
.icon-btn.success:hover { background: var(--color-success-bg); }

.table-input { width: 100%; padding: 6px 10px; border: 1.5px solid var(--color-primary); border-radius: var(--radius-sm); font-family: var(--font); font-size: var(--font-size-sm); background: #fff; outline: none; text-align: right; min-width: 100px; }
.table-input-sm { min-width: 70px; width: 80px; }
.toggle-label { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-xs); cursor: pointer; }

/* Empty state */
.empty-state { text-align: center; padding: var(--space-12) var(--space-8); }
.empty-icon { font-size: 48px; display: block; margin-bottom: var(--space-3); }
.empty-state h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-state p { color: var(--color-text-muted); margin-bottom: var(--space-5); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-5); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--color-navy); border: 1.5px solid var(--color-border); }
.btn-outline:hover { border-color: var(--color-navy); }
.btn-sm { padding: 6px 14px; font-size: var(--font-size-xs); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: #fff; border-radius: var(--radius-xl); padding: var(--space-6); width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); gap: var(--space-3); }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); padding: 4px; flex-shrink: 0; }
.modal-body { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); display: block; margin-bottom: var(--space-1); }
.form-input { width: 100%; padding: var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; }
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; }

/* Skeleton */
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: var(--radius-lg); }
.skeleton-header { height: 140px; }
.skeleton-table { height: 300px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

@media (max-width: 700px) {
  .category-view { padding: var(--space-4); }
  .cat-header { flex-direction: column; }
  .cat-stats { width: 100%; }
  .expenses-table th:nth-child(5),
  .expenses-table td:nth-child(5) { display: none; }
}
</style>
