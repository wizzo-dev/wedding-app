<template>
  <div class="budget-page fade-in" dir="rtl">

    <!-- Loading -->
    <div v-if="loading" class="budget-loading">
      <div class="skeleton" style="height:80px;border-radius:16px;"></div>
      <div class="skeleton" style="height:260px;border-radius:16px;margin-top:1.5rem;"></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.5rem;">
        <div class="skeleton" style="height:120px;border-radius:16px;" v-for="i in 6" :key="i"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינה</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">💰 ניהול תקציב</h1>
          <p class="page-sub">עקוב אחר ההוצאות ותכנן את התקציב</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" @click="showCategoryModal = true">+ קטגוריה</button>
          <button class="btn btn-primary" @click="showExpenseModal = true">+ הוצאה</button>
        </div>
      </div>

      <!-- Total Budget Banner -->
      <div class="budget-banner card">
        <div class="budget-banner-body">
          <div class="budget-total-section">
            <label class="budget-total-label">תקציב כולל</label>
            <div v-if="!editingTotal" class="budget-total-display" @click="startEditTotal">
              <span class="budget-total-amount">{{ formatCurrency(budget.totalBudget) }}</span>
              <span class="budget-total-edit-hint">✏️ לחץ לעריכה</span>
            </div>
            <div v-else class="budget-total-edit-row">
              <input
                v-model.number="totalInput"
                type="number"
                class="input budget-total-input"
                placeholder="סכום התקציב"
                @keyup.enter="saveTotal"
                @keyup.escape="editingTotal = false"
                ref="totalInputRef"
              />
              <button class="btn btn-primary btn-sm" @click="saveTotal" :disabled="savingTotal">שמור</button>
              <button class="btn btn-ghost btn-sm" @click="editingTotal = false">ביטול</button>
            </div>
          </div>

          <!-- SVG Donut -->
          <div class="donut-wrapper">
            <svg width="180" height="180" viewBox="0 0 180 180" class="donut-svg">
              <circle cx="90" cy="90" r="72" fill="none" stroke="#F0F0F5" stroke-width="20"/>
              <circle
                v-if="budget.totalBudget > 0"
                cx="90" cy="90" r="72"
                fill="none"
                :stroke="spentPercent > 90 ? '#EF4444' : '#E91E8C'"
                stroke-width="20"
                stroke-linecap="round"
                :stroke-dasharray="`${spentArc} ${circumference}`"
                stroke-dashoffset="0"
                transform="rotate(-90 90 90)"
                style="transition: stroke-dasharray 0.7s ease;"
              />
              <text x="90" y="84" text-anchor="middle" font-family="Heebo,sans-serif" font-size="22" font-weight="800" fill="#1A1F36">
                {{ spentPercent }}%
              </text>
              <text x="90" y="103" text-anchor="middle" font-family="Heebo,sans-serif" font-size="11" fill="#6B7280">הוצא</text>
            </svg>
          </div>

          <!-- Budget summary -->
          <div class="budget-summary">
            <div class="budget-summary-item">
              <span class="bsi-amount bsi-spent">{{ formatCurrency(budget.totalSpent) }}</span>
              <span class="bsi-label">הוצא עד כה</span>
            </div>
            <div class="budget-summary-divider"></div>
            <div class="budget-summary-item">
              <span class="bsi-amount" :class="budget.remaining < 0 ? 'bsi-danger' : 'bsi-remaining'">
                {{ formatCurrency(Math.abs(budget.remaining)) }}
              </span>
              <span class="bsi-label">{{ budget.remaining < 0 ? 'חריגה!' : 'נשאר' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Grid -->
      <div class="section-header">
        <h2 class="section-title">קטגוריות תקציב</h2>
        <span class="section-count">{{ budget.categories.length }} קטגוריות</span>
      </div>

      <div v-if="budget.categories.length === 0" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <p class="empty-state-title">אין קטגוריות עדיין</p>
        <p class="empty-state-text">הוסף קטגוריות לניהול התקציב שלך</p>
        <button class="btn btn-primary" @click="showCategoryModal = true">+ הוסף קטגוריה</button>
      </div>

      <div v-else class="categories-grid">
        <div
          v-for="cat in budget.categories"
          :key="cat.id"
          class="cat-card card card-hover"
          @click="$router.push(`/app/budget/category/${cat.id}`)"
        >
          <div class="cat-card-body">
            <div class="cat-header">
              <div class="cat-icon" :style="{ background: (cat.color || '#E91E8C') + '22', color: cat.color || '#E91E8C' }">
                {{ cat.icon || '💰' }}
              </div>
              <div class="cat-info">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-allocated">{{ formatCurrency(cat.allocatedAmount) }}</span>
              </div>
              <button class="btn btn-ghost btn-icon btn-sm cat-delete-btn"
                @click.stop="deleteCategory(cat.id)" title="מחק קטגוריה">🗑️</button>
            </div>
            <div class="cat-progress-row">
              <div class="cat-progress-bar">
                <div class="cat-progress-fill"
                  :style="{
                    width: Math.min(100, cat.allocatedAmount > 0 ? (cat.spent / cat.allocatedAmount) * 100 : 0) + '%',
                    background: cat.color || '#E91E8C'
                  }"></div>
              </div>
              <span class="cat-progress-pct">
                {{ cat.allocatedAmount > 0 ? Math.round((cat.spent / cat.allocatedAmount) * 100) : 0 }}%
              </span>
            </div>
            <div class="cat-amounts">
              <span class="cat-spent">הוצא: {{ formatCurrency(cat.spent) }}</span>
              <span class="cat-remaining" :class="{ 'cat-remaining-danger': cat.remaining < 0 }">
                {{ cat.remaining < 0 ? 'חריגה: ' + formatCurrency(Math.abs(cat.remaining)) : 'נשאר: ' + formatCurrency(cat.remaining) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Expenses -->
      <div class="section-header" style="margin-top: var(--space-8);">
        <h2 class="section-title">הוצאות אחרונות</h2>
        <span class="section-count">{{ expenses.total }} סה"כ</span>
      </div>

      <div v-if="expenses.expenses.length === 0" class="empty-state" style="padding: var(--space-8);">
        <div class="empty-state-icon">🧾</div>
        <p class="empty-state-title">אין הוצאות עדיין</p>
        <p class="empty-state-text">הוסף הוצאה ראשונה</p>
        <button class="btn btn-primary" @click="showExpenseModal = true">+ הוסף הוצאה</button>
      </div>

      <div v-else class="expenses-list card">
        <div v-for="exp in expenses.expenses" :key="exp.id" class="expense-row">
          <div class="exp-cat-dot" :style="{ background: (exp.category?.color || '#E91E8C') + '33' }">
            {{ exp.category?.icon || '💰' }}
          </div>
          <div class="exp-info">
            <span class="exp-vendor">{{ exp.vendorName }}</span>
            <span class="exp-cat-name">{{ exp.category?.name }}</span>
          </div>
          <div class="exp-right">
            <span class="exp-amount">{{ formatCurrency(exp.amount) }}</span>
            <span class="exp-date">{{ formatDate(exp.date) }}</span>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" @click="deleteExpense(exp.id)" title="מחק">🗑️</button>
        </div>
      </div>
    </template>

    <!-- Add Expense Modal -->
    <div v-if="showExpenseModal" class="modal-overlay" @click.self="showExpenseModal = false">
      <div class="modal-box card pop-in">
        <div class="modal-header">
          <h3 class="modal-title">הוסף הוצאה</h3>
          <button class="btn btn-ghost btn-icon" @click="showExpenseModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="label">שם ספק *</label>
            <input v-model="expForm.vendorName" class="input" placeholder="לדוגמה: מאפייה כהן" />
          </div>
          <div class="form-group">
            <label class="label">קטגוריה *</label>
            <select v-model="expForm.categoryId" class="input">
              <option value="" disabled>בחר קטגוריה</option>
              <option v-for="c in budget.categories" :key="c.id" :value="c.id">{{ c.icon }} {{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">סכום (₪) *</label>
            <input v-model.number="expForm.amount" type="number" class="input" placeholder="0" min="0" />
          </div>
          <div class="form-group">
            <label class="label">תאריך</label>
            <input v-model="expForm.date" type="date" class="input" />
          </div>
          <div class="form-group">
            <label class="label">הערה</label>
            <input v-model="expForm.note" class="input" placeholder="הערה אופציונלית..." />
          </div>
          <p v-if="expError" class="form-error">{{ expError }}</p>
          <button class="btn btn-primary w-full" :disabled="savingExp" @click="addExpense">
            {{ savingExp ? 'שומר...' : 'הוסף הוצאה' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal-box card pop-in">
        <div class="modal-header">
          <h3 class="modal-title">הוסף קטגוריה</h3>
          <button class="btn btn-ghost btn-icon" @click="showCategoryModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="label">שם קטגוריה *</label>
            <input v-model="catForm.name" class="input" placeholder="לדוגמה: קייטרינג" />
          </div>
          <div class="form-group">
            <label class="label">סכום מוקצה (₪)</label>
            <input v-model.number="catForm.allocatedAmount" type="number" class="input" placeholder="0" min="0" />
          </div>
          <div class="color-icon-row">
            <div class="form-group" style="flex:1;">
              <label class="label">אייקון</label>
              <input v-model="catForm.icon" class="input" placeholder="🎂" maxlength="4" />
            </div>
            <div class="form-group" style="flex:1;">
              <label class="label">צבע</label>
              <div class="color-picker-row">
                <input v-model="catForm.color" type="color" class="color-input" />
                <input v-model="catForm.color" class="input" placeholder="#E91E8C" />
              </div>
            </div>
          </div>
          <p v-if="catError" class="form-error">{{ catError }}</p>
          <button class="btn btn-primary w-full" :disabled="savingCat" @click="addCategory">
            {{ savingCat ? 'שומר...' : 'הוסף קטגוריה' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error   = ref('')
const budget  = ref({ totalBudget: 0, totalSpent: 0, remaining: 0, categories: [] })
const expenses = ref({ expenses: [], total: 0 })
const editingTotal  = ref(false)
const totalInput    = ref(0)
const savingTotal   = ref(false)
const totalInputRef = ref(null)
const showExpenseModal  = ref(false)
const showCategoryModal = ref(false)
const expForm  = ref({ vendorName: '', categoryId: '', amount: null, date: '', note: '' })
const expError = ref('')
const savingExp = ref(false)
const catForm  = ref({ name: '', allocatedAmount: 0, icon: '💰', color: '#E91E8C' })
const catError = ref('')
const savingCat = ref(false)

const circumference = 2 * Math.PI * 72
const spentPercent  = computed(() => {
  if (!budget.value.totalBudget) return 0
  return Math.min(100, Math.round((budget.value.totalSpent / budget.value.totalBudget) * 100))
})
const spentArc = computed(() => (spentPercent.value / 100) * circumference)

onMounted(load)

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const [bRes, eRes] = await Promise.all([
      api.get('/budget'),
      api.get('/budget/expenses', { params: { limit: 20 } })
    ])
    budget.value   = bRes.data
    expenses.value = eRes.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

function startEditTotal() {
  totalInput.value = budget.value.totalBudget
  editingTotal.value = true
  nextTick(() => totalInputRef.value?.focus())
}

async function saveTotal() {
  savingTotal.value = true
  try {
    const res = await api.put('/budget/total', { totalBudget: totalInput.value })
    budget.value.totalBudget = res.data.totalBudget
    budget.value.remaining   = res.data.totalBudget - budget.value.totalSpent
    editingTotal.value = false
  } catch (e) {
    alert(e?.response?.data?.message || 'שגיאה')
  } finally {
    savingTotal.value = false
  }
}

async function addExpense() {
  expError.value = ''
  if (!expForm.value.vendorName || !expForm.value.categoryId || !expForm.value.amount) {
    expError.value = 'אנא מלא את כל שדות החובה'
    return
  }
  savingExp.value = true
  try {
    await api.post('/budget/expenses', {
      vendorName: expForm.value.vendorName,
      categoryId: expForm.value.categoryId,
      amount:     expForm.value.amount,
      note:       expForm.value.note || undefined,
      date:       expForm.value.date || undefined
    })
    showExpenseModal.value = false
    expForm.value = { vendorName: '', categoryId: '', amount: null, date: '', note: '' }
    await load()
  } catch (e) {
    expError.value = e?.response?.data?.message || 'שגיאה'
  } finally {
    savingExp.value = false
  }
}

async function addCategory() {
  catError.value = ''
  if (!catForm.value.name) {
    catError.value = 'אנא הזן שם קטגוריה'
    return
  }
  savingCat.value = true
  try {
    await api.post('/budget/categories', {
      name:            catForm.value.name,
      allocatedAmount: catForm.value.allocatedAmount || 0,
      allocatedPercent: budget.value.totalBudget > 0
        ? ((catForm.value.allocatedAmount || 0) / budget.value.totalBudget) * 100
        : 0,
      icon:  catForm.value.icon  || '💰',
      color: catForm.value.color || '#E91E8C'
    })
    showCategoryModal.value = false
    catForm.value = { name: '', allocatedAmount: 0, icon: '💰', color: '#E91E8C' }
    await load()
  } catch (e) {
    catError.value = e?.response?.data?.message || 'שגיאה'
  } finally {
    savingCat.value = false
  }
}

async function deleteCategory(id) {
  if (!confirm('למחוק קטגוריה זו וכל הוצאותיה?')) return
  try {
    await api.delete(`/budget/categories/${id}`)
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || 'שגיאה')
  }
}

async function deleteExpense(id) {
  if (!confirm('למחוק הוצאה זו?')) return
  try {
    await api.delete(`/budget/expenses/${id}`)
    await load()
  } catch (e) {
    alert(e?.response?.data?.message || 'שגיאה')
  }
}

function formatCurrency(n) {
  if (!n && n !== 0) return '₪0'
  return '₪' + Math.round(n).toLocaleString('he-IL')
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL')
}
</script>

<style scoped>
.budget-page {
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
}
.budget-loading { display: flex; flex-direction: column; gap: var(--space-4); }
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.budget-banner { margin-bottom: var(--space-6); }
.budget-banner-body {
  padding: var(--space-6) var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-10);
  flex-wrap: wrap;
}
.budget-total-section { min-width: 200px; }
.budget-total-label { display: block; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); margin-bottom: var(--space-2); }
.budget-total-display { cursor: pointer; display: inline-flex; align-items: baseline; gap: var(--space-3); }
.budget-total-amount { font-size: var(--font-size-4xl); font-weight: 900; color: var(--color-navy); line-height: 1; }
.budget-total-edit-hint { font-size: var(--font-size-xs); color: var(--color-primary); opacity: 0.7; }
.budget-total-edit-row { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
.budget-total-input { max-width: 180px; }
.donut-wrapper { flex-shrink: 0; }
.donut-svg { display: block; }
.budget-summary { display: flex; gap: var(--space-8); align-items: center; }
.budget-summary-item { display: flex; flex-direction: column; gap: var(--space-1); }
.bsi-amount { font-size: var(--font-size-2xl); font-weight: 800; line-height: 1; }
.bsi-spent     { color: var(--color-primary); }
.bsi-remaining { color: var(--color-success); }
.bsi-danger    { color: var(--color-error); }
.bsi-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }
.budget-summary-divider { width: 1px; height: 48px; background: var(--color-border); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.section-count { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.cat-card { cursor: pointer; }
.cat-card-body { padding: var(--space-5); }
.cat-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.cat-icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
.cat-info { flex: 1; min-width: 0; }
.cat-name { display: block; font-weight: 700; font-size: var(--font-size-base); }
.cat-allocated { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.cat-delete-btn { opacity: 0; transition: opacity var(--transition-fast); }
.cat-card:hover .cat-delete-btn { opacity: 1; }
.cat-progress-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.cat-progress-bar { flex: 1; height: 8px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.cat-progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; }
.cat-progress-pct { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); min-width: 3ch; }
.cat-amounts { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--color-text-muted); }
.cat-remaining { font-weight: 600; }
.cat-remaining-danger { color: var(--color-error); }
.expenses-list { overflow: hidden; }
.expense-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}
.expense-row:last-child { border-bottom: none; }
.expense-row:hover { background: var(--color-bg-subtle); }
.exp-cat-dot { width: 38px; height: 38px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.exp-info { flex: 1; min-width: 0; }
.exp-vendor { display: block; font-weight: 700; font-size: var(--font-size-sm); }
.exp-cat-name { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.exp-right { text-align: left; }
.exp-amount { display: block; font-weight: 800; font-size: var(--font-size-base); color: var(--color-navy); }
.exp-date { font-size: var(--font-size-xs); color: var(--color-text-light); }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26,31,54,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal-box { width: 100%; max-width: 480px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.modal-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-body { padding: var(--space-6); }
.color-icon-row { display: flex; gap: var(--space-4); }
.color-picker-row { display: flex; gap: var(--space-2); align-items: center; }
.color-input { width: 44px; height: 44px; border: none; padding: 0; cursor: pointer; border-radius: var(--radius); }
@media (max-width: 700px) {
  .budget-page { padding: var(--space-4); }
  .budget-banner-body { flex-direction: column; gap: var(--space-4); }
  .categories-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 500px) {
  .categories-grid { grid-template-columns: 1fr; }
}
</style>