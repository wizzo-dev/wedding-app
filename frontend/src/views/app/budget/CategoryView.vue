<template>
  <div class="category-page fade-in" dir="rtl">

    <div v-if="loading" class="cat-loading">
      <div class="skeleton" style="height:100px;border-radius:16px;"></div>
      <div class="skeleton" style="height:60px;border-radius:12px;margin-top:1rem;"></div>
      <div class="skeleton" style="height:300px;border-radius:16px;margin-top:1rem;"></div>
    </div>

    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">{{ error }}</p>
      <router-link to="/app/budget" class="btn btn-primary">חזור לתקציב</router-link>
    </div>

    <template v-else-if="category">
      <!-- Back + header -->
      <div class="cat-page-header">
        <button class="btn btn-ghost btn-sm" @click="$router.push('/app/budget')">← חזור לתקציב</button>
        <div class="cat-heading">
          <div class="cat-heading-icon" :style="{ background: (category.color || '#E91E8C') + '22', color: category.color || '#E91E8C' }">
            {{ category.icon || '💰' }}
          </div>
          <div>
            <h1 class="cat-heading-name">{{ category.name }}</h1>
            <p class="cat-heading-sub">{{ formatCurrency(category.allocatedAmount) }} הוקצה</p>
          </div>
        </div>
        <router-link :to="`/app/vendors?category=${encodeURIComponent(category.name)}`" class="btn btn-outline">
          🏪 הצע ספקים
        </router-link>
      </div>

      <!-- Stats -->
      <div class="cat-stats">
        <div class="cat-stat-card card">
          <div class="csc-body">
            <div class="csc-num" style="color: var(--color-navy)">{{ formatCurrency(category.allocatedAmount) }}</div>
            <div class="csc-label">תקציב מוקצה</div>
          </div>
        </div>
        <div class="cat-stat-card card">
          <div class="csc-body">
            <div class="csc-num" style="color: var(--color-primary)">{{ formatCurrency(totalSpent) }}</div>
            <div class="csc-label">הוצא</div>
          </div>
        </div>
        <div class="cat-stat-card card">
          <div class="csc-body">
            <div class="csc-num" :style="{ color: remaining < 0 ? 'var(--color-error)' : 'var(--color-success)' }">
              {{ remaining < 0 ? '-' : '' }}{{ formatCurrency(Math.abs(remaining)) }}
            </div>
            <div class="csc-label">{{ remaining < 0 ? '⚠️ חריגה' : 'נשאר' }}</div>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="cat-progress-section card">
        <div class="card-body">
          <div class="cat-progress-label-row">
            <span class="cat-progress-label">התקדמות</span>
            <span class="cat-progress-pct" :class="{ danger: spentPct > 90 }">{{ spentPct }}%</span>
          </div>
          <div class="cat-full-progress">
            <div class="cat-full-fill"
              :style="{
                width: Math.min(100, spentPct) + '%',
                background: spentPct > 90 ? 'var(--color-error)' : (category.color || '#E91E8C')
              }"></div>
          </div>
          <div class="cat-progress-sublabel">{{ formatCurrency(totalSpent) }} מתוך {{ formatCurrency(category.allocatedAmount) }}</div>
        </div>
      </div>

      <!-- Add expense inline -->
      <div class="add-expense-section card">
        <div class="card-body">
          <h2 class="section-title" style="margin-bottom: var(--space-4);">+ הוסף הוצאה</h2>
          <div class="add-exp-form">
            <input v-model="newExp.vendorName" class="input" placeholder="שם ספק *" />
            <input v-model.number="newExp.amount" type="number" class="input" placeholder="סכום ₪ *" min="0" />
            <input v-model="newExp.date" type="date" class="input" />
            <input v-model="newExp.note" class="input" placeholder="הערה" />
            <button class="btn btn-primary" :disabled="savingExp" @click="addExpense">
              {{ savingExp ? '...' : 'הוסף' }}
            </button>
          </div>
          <p v-if="expError" class="form-error" style="margin-top: var(--space-2);">{{ expError }}</p>
        </div>
      </div>

      <!-- Expenses table -->
      <div class="section-header" style="margin-top: var(--space-6);">
        <h2 class="section-title">הוצאות בקטגוריה</h2>
        <span class="section-count">{{ expenses.length }} הוצאות</span>
      </div>

      <div v-if="expenses.length === 0" class="empty-state" style="padding: var(--space-8);">
        <div class="empty-state-icon">🧾</div>
        <p class="empty-state-title">אין הוצאות בקטגוריה זו</p>
      </div>

      <div v-else class="expenses-table card">
        <div class="exp-table-header">
          <span>ספק</span>
          <span>סכום</span>
          <span>תאריך</span>
          <span>הערה</span>
          <span></span>
        </div>
        <div v-for="exp in expenses" :key="exp.id" class="exp-table-row">
          <span class="exp-vendor-cell">{{ exp.vendorName }}</span>
          <span class="exp-amount-cell">{{ formatCurrency(exp.amount) }}</span>
          <span class="exp-date-cell">{{ formatDate(exp.date) }}</span>
          <span class="exp-note-cell text-muted text-sm">{{ exp.note || '—' }}</span>
          <button class="btn btn-ghost btn-icon btn-sm" @click="deleteExpense(exp.id)">🗑️</button>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/composables/useApi'

const route    = useRoute()
const loading  = ref(true)
const error    = ref('')
const category = ref(null)
const expenses = ref([])
const newExp   = ref({ vendorName: '', amount: null, date: '', note: '' })
const expError  = ref('')
const savingExp = ref(false)

const totalSpent = computed(() => expenses.value.reduce((s, e) => s + e.amount, 0))
const remaining  = computed(() => (category.value?.allocatedAmount || 0) - totalSpent.value)
const spentPct   = computed(() => {
  if (!category.value?.allocatedAmount) return 0
  return Math.min(100, Math.round((totalSpent.value / category.value.allocatedAmount) * 100))
})

onMounted(load)

async function load() {
  loading.value = true
  error.value   = ''
  const id = route.params.id
  try {
    const [budgetRes, expRes] = await Promise.all([
      api.get('/budget'),
      api.get('/budget/expenses', { params: { categoryId: id, limit: 200 } })
    ])
    category.value = budgetRes.data.categories.find(c => c.id === parseInt(id)) || null
    if (!category.value) { error.value = 'קטגוריה לא נמצאה'; return }
    expenses.value = expRes.data.expenses
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

async function addExpense() {
  expError.value = ''
  if (!newExp.value.vendorName || !newExp.value.amount) {
    expError.value = 'אנא מלא שם ספק וסכום'
    return
  }
  savingExp.value = true
  try {
    await api.post('/budget/expenses', {
      vendorName: newExp.value.vendorName,
      categoryId: parseInt(route.params.id),
      amount:     newExp.value.amount,
      note:       newExp.value.note || undefined,
      date:       newExp.value.date || undefined
    })
    newExp.value = { vendorName: '', amount: null, date: '', note: '' }
    await load()
  } catch (e) {
    expError.value = e?.response?.data?.message || 'שגיאה'
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
.category-page { padding: var(--space-6) var(--space-8); max-width: var(--content-max); margin: 0 auto; }
.cat-loading { display: flex; flex-direction: column; gap: var(--space-4); }
.cat-page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.cat-heading { display: flex; align-items: center; gap: var(--space-4); flex: 1; }
.cat-heading-icon { width: 56px; height: 56px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; }
.cat-heading-name { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.cat-heading-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.cat-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
.csc-body { padding: var(--space-5) var(--space-6); }
.csc-num { font-size: var(--font-size-2xl); font-weight: 900; line-height: 1; }
.csc-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; margin-top: var(--space-1); }
.cat-progress-section { margin-bottom: var(--space-5); }
.cat-progress-label-row { display: flex; justify-content: space-between; margin-bottom: var(--space-2); }
.cat-progress-label { font-weight: 700; font-size: var(--font-size-sm); }
.cat-progress-pct { font-weight: 800; font-size: var(--font-size-sm); color: var(--color-primary); }
.cat-progress-pct.danger { color: var(--color-error); }
.cat-full-progress { height: 12px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.cat-full-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.6s ease; }
.cat-progress-sublabel { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2); }
.add-expense-section { margin-bottom: var(--space-5); }
.add-exp-form { display: flex; gap: var(--space-3); flex-wrap: wrap; align-items: flex-end; }
.add-exp-form .input { flex: 1; min-width: 130px; }
.add-exp-form .btn { flex-shrink: 0; white-space: nowrap; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.section-count { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.expenses-table { overflow: hidden; }
.exp-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr 40px;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  background: var(--color-bg-subtle);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
}
.exp-table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 2fr 40px;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}
.exp-table-row:last-child { border-bottom: none; }
.exp-table-row:hover { background: var(--color-bg-subtle); }
.exp-vendor-cell { font-weight: 700; font-size: var(--font-size-sm); }
.exp-amount-cell { font-weight: 800; color: var(--color-primary); }
.exp-date-cell { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.exp-note-cell { font-size: var(--font-size-xs); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 700px) {
  .category-page { padding: var(--space-4); }
  .cat-stats { grid-template-columns: 1fr 1fr; }
  .exp-table-header, .exp-table-row { grid-template-columns: 2fr 1fr 1fr 40px; }
  .exp-note-cell { display: none; }
}
</style>