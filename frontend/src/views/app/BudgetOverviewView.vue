<template>
  <div class="budget-overview fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">ניהול תקציב</h1>
        <p class="page-subtitle">עקוב אחרי ההוצאות שלך לחתונה</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" @click="showTotalModal = true">
          ✏️ עדכן תקציב כולל
        </button>
        <button class="btn btn-primary btn-sm" @click="showAddModal = true">
          + הוסף קטגוריה
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="summary-grid">
        <div v-for="i in 4" :key="i" class="stat-card card">
          <div class="card-body">
            <div class="skeleton" style="height:14px;width:60%;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:28px;width:40%;"></div>
          </div>
        </div>
      </div>
      <div class="section-card card" style="margin-top:var(--space-6)">
        <div class="card-body">
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton" style="height:80px;border-radius:var(--radius-lg);margin-bottom:12px;"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הנתונים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="fetchBudget">נסה שוב</button>
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="stat-card card">
          <div class="card-body">
            <span class="stat-label">תקציב כולל</span>
            <span class="stat-number">{{ formatCurrency(data.budgetTotal) }}</span>
            <div class="stat-sub" v-if="data.budgetTotal > 0">
              <span class="pct-text">{{ totalUsedPct }}% בשימוש</span>
            </div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="card-body">
            <span class="stat-label">סה"כ מוקצה</span>
            <span class="stat-number">{{ formatCurrency(data.totalAllocated) }}</span>
          </div>
        </div>
        <div class="stat-card card">
          <div class="card-body">
            <span class="stat-label">סה"כ הוצאות</span>
            <span class="stat-number spent">{{ formatCurrency(data.totalSpent) }}</span>
          </div>
        </div>
        <div class="stat-card card" :class="{ 'stat-danger': remainingNegative }">
          <div class="card-body">
            <span class="stat-label">{{ remainingNegative ? 'חריגה מהתקציב' : 'יתרה' }}</span>
            <span class="stat-number" :class="remainingNegative ? 'text-danger' : 'text-success'">
              {{ formatCurrency(Math.abs(data.totalRemaining)) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Total Progress Bar -->
      <div class="progress-section card" v-if="data.totalAllocated > 0 || data.budgetTotal > 0">
        <div class="card-body">
          <div class="progress-header">
            <span class="progress-label">התקדמות תקציב כוללת</span>
            <span class="progress-pct" :class="{ 'text-danger': data.totalPct >= 100 }">
              {{ data.totalPct }}%
            </span>
          </div>
          <div class="progress-bar-wrap">
            <div
              class="progress-bar-fill"
              :style="{ width: Math.min(data.totalPct, 100) + '%' }"
              :class="{
                'fill-danger': data.totalPct >= 100,
                'fill-warning': data.totalPct >= 80 && data.totalPct < 100
              }"
            ></div>
          </div>
          <div class="progress-legend">
            <span class="legend-item">
              <span class="legend-dot dot-pink"></span>
              הוצאות: {{ formatCurrency(data.totalSpent) }}
            </span>
            <span class="legend-item">
              <span class="legend-dot dot-light"></span>
              מוקצה: {{ formatCurrency(data.totalAllocated) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="data.categories.length === 0" class="empty-state card">
        <div class="card-body">
          <div class="empty-state-icon">💰</div>
          <p class="empty-state-title">עדיין אין קטגוריות תקציב</p>
          <p class="empty-state-text">הוסף קטגוריות כדי לעקוב אחרי הוצאות החתונה שלך</p>
          <button class="btn btn-primary" @click="showAddModal = true">+ הוסף קטגוריה ראשונה</button>
        </div>
      </div>

      <!-- Categories Grid -->
      <div v-else class="categories-section">
        <div class="section-header">
          <h2 class="section-title">קטגוריות</h2>
          <span class="category-count">{{ data.categories.length }} קטגוריות</span>
        </div>
        <div class="categories-grid">
          <RouterLink
            v-for="cat in data.categories"
            :key="cat.id"
            :to="`/app/budget/${cat.id}`"
            class="category-card card card-hover"
            :class="{ 'over-budget': cat.overBudget }"
          >
            <div class="card-body">
              <div class="cat-top">
                <span class="cat-icon" :style="{ background: cat.color + '33' }">{{ cat.icon }}</span>
                <div class="cat-info">
                  <span class="cat-name">{{ cat.name }}</span>
                  <span v-if="cat.overBudget" class="badge badge-error">חריגה!</span>
                  <span v-else-if="cat.pct >= 80" class="badge badge-warning">קרוב לגבול</span>
                </div>
                <span class="cat-arrow">←</span>
              </div>

              <div class="cat-amounts">
                <div class="amount-row">
                  <span class="amount-label">הוצאות</span>
                  <span class="amount-val" :class="{ 'text-danger': cat.overBudget }">
                    {{ formatCurrency(cat.spent) }}
                  </span>
                </div>
                <div class="amount-row">
                  <span class="amount-label">מוקצה</span>
                  <span class="amount-val">{{ formatCurrency(cat.allocatedAmount) }}</span>
                </div>
              </div>

              <div class="cat-progress">
                <div class="progress-bar-wrap slim">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width: Math.min(cat.pct, 100) + '%',
                      background: cat.overBudget ? 'var(--color-error)' : (cat.pct >= 80 ? 'var(--color-warning)' : undefined)
                    }"
                  ></div>
                </div>
                <span class="pct-badge" :class="{
                  'pct-danger': cat.overBudget,
                  'pct-warning': cat.pct >= 80 && !cat.overBudget
                }">{{ cat.pct }}%</span>
              </div>

              <div class="cat-footer">
                <span class="expense-count">{{ cat.expenseCount }} הוצאות</span>
                <span class="remaining" :class="{ 'text-danger': cat.overBudget, 'text-success': !cat.overBudget && cat.allocatedAmount > 0 }">
                  {{ cat.overBudget ? 'חריגה של' : 'יתרה:' }}
                  {{ formatCurrency(Math.abs(cat.remaining)) }}
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </template>

    <!-- Add Category Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-backdrop" @click.self="closeAddModal">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>הוסף קטגוריה</h3>
            <button class="btn btn-ghost btn-icon" @click="closeAddModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="label">שם הקטגוריה *</label>
              <input v-model="addForm.name" class="input" placeholder="לדוגמה: אולם, קייטרינג..." />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="label">אייקון</label>
                <input v-model="addForm.icon" class="input" placeholder="💍" maxlength="2" />
              </div>
              <div class="form-group">
                <label class="label">צבע</label>
                <input v-model="addForm.color" type="color" class="input color-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">סכום מוקצה (₪)</label>
              <input v-model.number="addForm.allocatedAmount" type="number" class="input" placeholder="0" min="0" />
            </div>
            <p v-if="addError" class="form-error">{{ addError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeAddModal">ביטול</button>
            <button class="btn btn-primary" @click="submitAddCategory" :disabled="addLoading">
              {{ addLoading ? 'שומר...' : 'הוסף קטגוריה' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Total Budget Modal -->
    <Teleport to="body">
      <div v-if="showTotalModal" class="modal-backdrop" @click.self="showTotalModal = false">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>עדכן תקציב כולל</h3>
            <button class="btn btn-ghost btn-icon" @click="showTotalModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="label">תקציב כולל לחתונה (₪)</label>
              <input v-model.number="totalForm.budgetTotal" type="number" class="input" placeholder="0" min="0" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showTotalModal = false">ביטול</button>
            <button class="btn btn-primary" @click="submitUpdateTotal" :disabled="totalLoading">
              {{ totalLoading ? 'שומר...' : 'שמור' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref(null)
const data = ref({
  budgetTotal: 0,
  totalAllocated: 0,
  totalSpent: 0,
  totalRemaining: 0,
  totalPct: 0,
  categories: []
})

const showAddModal = ref(false)
const addError = ref(null)
const addLoading = ref(false)
const addForm = ref({ name: '', icon: '📋', color: '#E91E8C', allocatedAmount: 0 })

const showTotalModal = ref(false)
const totalLoading = ref(false)
const totalForm = ref({ budgetTotal: 0 })

const remainingNegative = computed(() => data.value.totalRemaining < 0)
const totalUsedPct = computed(() => {
  const bt = data.value.budgetTotal
  if (bt <= 0) return 0
  return Math.min(Math.round((data.value.totalSpent / bt) * 100), 100)
})

function formatCurrency(val) {
  if (!val && val !== 0) return '₪0'
  return '₪' + Math.round(val).toLocaleString('he-IL')
}

async function fetchBudget() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/budget')
    data.value = res.data
    totalForm.value.budgetTotal = res.data.budgetTotal
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

function closeAddModal() {
  showAddModal.value = false
  addForm.value = { name: '', icon: '📋', color: '#E91E8C', allocatedAmount: 0 }
  addError.value = null
}

async function submitAddCategory() {
  if (!addForm.value.name.trim()) {
    addError.value = 'נא להזין שם קטגוריה'
    return
  }
  addLoading.value = true
  addError.value = null
  try {
    const res = await api.post('/budget', addForm.value)
    data.value.categories.push(res.data)
    closeAddModal()
  } catch (e) {
    addError.value = e?.response?.data?.message || 'שגיאה בהוספת קטגוריה'
  } finally {
    addLoading.value = false
  }
}

async function submitUpdateTotal() {
  totalLoading.value = true
  try {
    await api.put('/budget/total', totalForm.value)
    data.value.budgetTotal = totalForm.value.budgetTotal
    showTotalModal.value = false
  } catch {
    // silent fail
  } finally {
    totalLoading.value = false
  }
}

onMounted(fetchBudget)
</script>

<style scoped>
.budget-overview { padding: var(--space-4) 0; }

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1.2; }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.page-actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }

/* Summary Stats */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.stat-card { transition: box-shadow var(--transition); }
.stat-card:hover { box-shadow: var(--shadow); }
.stat-card .stat-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-2);
}
.stat-card .stat-number {
  display: block;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
}
.stat-card .stat-number.spent { color: var(--color-primary); }
.stat-sub { margin-top: var(--space-2); }
.pct-text { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.text-danger { color: var(--color-error) !important; }
.text-success { color: var(--color-success) !important; }
.stat-danger { border-color: var(--color-error-bg); background: var(--color-error-bg); }

/* Progress */
.progress-section { margin-bottom: var(--space-6); }
.progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
.progress-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.progress-pct { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); }
.progress-bar-wrap {
  height: 12px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-3);
}
.progress-bar-wrap.slim { height: 6px; margin-bottom: 0; }
.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary) 0%, #ff6bc8 100%);
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}
.fill-danger { background: var(--color-error) !important; }
.fill-warning { background: var(--color-warning) !important; }
.progress-legend { display: flex; gap: var(--space-6); }
.legend-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-muted); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-pink { background: var(--color-primary); }
.dot-light { background: var(--color-border); }

/* Section */
.categories-section { margin-top: var(--space-2); }
.section-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.section-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.category-count { font-size: var(--font-size-sm); color: var(--color-text-muted); background: var(--color-bg-subtle); padding: 2px 10px; border-radius: var(--radius-full); }

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
.category-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: box-shadow var(--transition), transform var(--transition);
}
.category-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.category-card.over-budget { border-color: var(--color-error-bg); }

.cat-top { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.cat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.cat-info { flex: 1; min-width: 0; }
.cat-name { display: block; font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin-bottom: 4px; }
.cat-arrow { color: var(--color-text-muted); font-size: 1.1rem; flex-shrink: 0; }

.cat-amounts { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-3); }
.amount-row { display: flex; justify-content: space-between; align-items: center; }
.amount-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.amount-val { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }

.cat-progress { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3); }
.cat-progress .progress-bar-wrap { flex: 1; }
.pct-badge { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-primary); flex-shrink: 0; min-width: 36px; text-align: left; }
.pct-danger { color: var(--color-error); }
.pct-warning { color: var(--color-warning); }

.cat-footer { display: flex; justify-content: space-between; align-items: center; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }
.expense-count { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.remaining { font-size: var(--font-size-xs); font-weight: 600; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,31,54,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  width: 100%; max-width: 440px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-body { padding: var(--space-6); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.color-input { height: 44px; padding: 4px 8px; cursor: pointer; }

@media (max-width: 640px) {
  .page-header { flex-direction: column; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .categories-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
