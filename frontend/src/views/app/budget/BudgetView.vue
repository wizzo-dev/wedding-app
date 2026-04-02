<template>
  <div class="budget-view fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">ניהול תקציב</h1>
        <p class="page-subtitle">עקוב אחר ההוצאות שלך לחתונה</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" @click="openAddCategory">
          + קטגוריה חדשה
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary btn-sm" @click="loadBudget">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-row">
        <div class="summary-card total">
          <div class="summary-label">תקציב כולל</div>
          <div class="summary-amount">{{ formatMoney(totalBudget) }}</div>
          <button class="btn-inline" @click="openEditTotal">✏️ עריכה</button>
        </div>
        <div class="summary-card spent">
          <div class="summary-label">הוצא עד כה</div>
          <div class="summary-amount">{{ formatMoney(totalSpent) }}</div>
          <div class="summary-pct">{{ spentPercent }}%</div>
        </div>
        <div class="summary-card remaining" :class="{ overage: remaining < 0 }">
          <div class="summary-label">{{ remaining >= 0 ? 'נותר' : 'חריגה' }}</div>
          <div class="summary-amount">{{ formatMoney(Math.abs(remaining)) }}</div>
        </div>
      </div>

      <!-- Donut Chart -->
      <div v-if="totalBudget > 0" class="donut-wrap card">
        <div class="card-body donut-body">
          <svg class="donut-svg" viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="18" />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              :stroke="donutColor"
              stroke-width="18"
              stroke-linecap="round"
              :stroke-dasharray="`${donutProgress} ${314 - donutProgress}`"
              stroke-dashoffset="78.5"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">{{ spentPercent }}%</text>
            <text x="60" y="70" text-anchor="middle" font-size="8" fill="#64748b">הוצא</text>
          </svg>
          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:#3b82f6"></span>
              <span>הוצא: {{ formatMoney(totalSpent) }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#e5e7eb"></span>
              <span>נותר: {{ formatMoney(Math.max(0, remaining)) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="categories-section">
        <h2 class="section-title">קטגוריות</h2>
        <div v-if="categories.length === 0" class="empty-state-small">
          <p>אין קטגוריות עדיין — הוסף קטגוריה ראשונה</p>
        </div>
        <div v-else class="category-cards">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-card card"
            @click="goToCategory(cat.id)"
          >
            <div class="card-body cat-body">
              <div class="cat-icon" :style="{ background: cat.color || '#e0e7ff' }">
                {{ cat.icon || '💰' }}
              </div>
              <div class="cat-info">
                <div class="cat-name">{{ cat.name }}</div>
                <div class="cat-amounts">
                  <span class="spent-lbl">הוצא: {{ formatMoney(cat.spent) }}</span>
                  <span class="divider"> / </span>
                  <span class="alloc-lbl">מוקצה: {{ formatMoney(cat.allocatedAmount) }}</span>
                </div>
                <div class="cat-progress-bar">
                  <div
                    class="cat-progress-fill"
                    :style="{
                      width: cat.allocatedAmount > 0
                        ? Math.min(100, (cat.spent / cat.allocatedAmount) * 100) + '%'
                        : '0%',
                      background: cat.color || '#3b82f6'
                    }"
                  ></div>
                </div>
              </div>
              <div class="cat-actions" @click.stop>
                <button class="btn-icon" title="עריכה" @click="openEditCategory(cat)">✏️</button>
                <button class="btn-icon danger" title="מחיקה" @click="deleteCategory(cat.id)">🗑</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Total Budget Modal -->
    <div v-if="showEditTotal" class="modal-overlay" @click.self="showEditTotal = false">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">עריכת תקציב כולל</h3>
          <div class="form-group">
            <label class="form-label">תקציב כולל (₪)</label>
            <input
              v-model.number="editTotalVal"
              type="number"
              min="0"
              class="input"
              placeholder="לדוגמה: 80000"
              @keyup.enter="saveTotal"
            />
          </div>
          <p v-if="modalError" class="form-error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn btn-primary" :disabled="savingTotal" @click="saveTotal">
              {{ savingTotal ? 'שומר...' : 'שמור' }}
            </button>
            <button class="btn btn-outline" @click="showEditTotal = false">ביטול</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="closeCategoryModal">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">{{ editingCategory ? 'עריכת קטגוריה' : 'קטגוריה חדשה' }}</h3>
          <div class="form-group">
            <label class="form-label">שם קטגוריה *</label>
            <input v-model="catForm.name" class="input" placeholder="לדוגמה: קייטרינג" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">סכום מוקצה (₪)</label>
              <input v-model.number="catForm.allocatedAmount" type="number" min="0" class="input" />
            </div>
            <div class="form-group">
              <label class="form-label">אחוז מהתקציב</label>
              <input v-model.number="catForm.allocatedPercent" type="number" min="0" max="100" class="input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">אייקון</label>
              <input v-model="catForm.icon" class="input" placeholder="🎂" maxlength="4" />
            </div>
            <div class="form-group">
              <label class="form-label">צבע</label>
              <input v-model="catForm.color" type="color" class="input input-color" />
            </div>
          </div>
          <p v-if="modalError" class="form-error">{{ modalError }}</p>
          <div class="modal-actions">
            <button class="btn btn-primary" :disabled="savingCat" @click="saveCategory">
              {{ savingCat ? 'שומר...' : 'שמור' }}
            </button>
            <button class="btn btn-outline" @click="closeCategoryModal">ביטול</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/composables/useApi'

const router = useRouter()

// ── State ─────────────────────────────────────────────────────────────────────
const loading    = ref(true)
const error      = ref(null)
const totalBudget = ref(0)
const totalSpent  = ref(0)
const remaining   = ref(0)
const categories  = ref([])

// Edit total
const showEditTotal = ref(false)
const editTotalVal  = ref(0)
const savingTotal   = ref(false)
const modalError    = ref(null)

// Category modal
const showCategoryModal = ref(false)
const editingCategory   = ref(null)
const savingCat         = ref(false)
const catForm = ref({ name: '', allocatedAmount: 0, allocatedPercent: 0, icon: '', color: '#3b82f6' })

// ── Computed ──────────────────────────────────────────────────────────────────
const spentPercent = computed(() => {
  if (!totalBudget.value || totalBudget.value === 0) return 0
  return Math.min(100, Math.round((totalSpent.value / totalBudget.value) * 100))
})

// SVG circle circumference for r=50 is ~314.16
const donutProgress = computed(() => {
  return Math.min(314, (spentPercent.value / 100) * 314)
})

const donutColor = computed(() => {
  if (spentPercent.value >= 100) return '#ef4444'
  if (spentPercent.value >= 80)  return '#f59e0b'
  return '#3b82f6'
})

// ── Methods ───────────────────────────────────────────────────────────────────
async function loadBudget() {
  loading.value = true
  error.value   = null
  try {
    const res = await api.get('/budget')
    totalBudget.value = res.data.totalBudget ?? 0
    totalSpent.value  = res.data.totalSpent  ?? 0
    remaining.value   = res.data.remaining   ?? 0
    categories.value  = res.data.categories  ?? []
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת התקציב'
  } finally {
    loading.value = false
  }
}

function formatMoney(val) {
  if (val === null || val === undefined) return '₪0'
  return '₪' + Number(val).toLocaleString('he-IL')
}

function openEditTotal() {
  editTotalVal.value = totalBudget.value
  modalError.value = null
  showEditTotal.value = true
}

async function saveTotal() {
  modalError.value = null
  const val = Number(editTotalVal.value)
  if (isNaN(val) || val < 0) {
    modalError.value = 'נא להזין סכום תקין'
    return
  }
  savingTotal.value = true
  try {
    await api.put('/budget/total', { totalBudget: val })
    totalBudget.value = val
    remaining.value = val - totalSpent.value
    showEditTotal.value = false
  } catch (e) {
    modalError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    savingTotal.value = false
  }
}

function openAddCategory() {
  editingCategory.value = null
  catForm.value = { name: '', allocatedAmount: 0, allocatedPercent: 0, icon: '', color: '#3b82f6' }
  modalError.value = null
  showCategoryModal.value = true
}

function openEditCategory(cat) {
  editingCategory.value = cat
  catForm.value = {
    name: cat.name,
    allocatedAmount: cat.allocatedAmount,
    allocatedPercent: cat.allocatedPercent,
    icon: cat.icon || '',
    color: cat.color || '#3b82f6'
  }
  modalError.value = null
  showCategoryModal.value = true
}

function closeCategoryModal() {
  showCategoryModal.value = false
  editingCategory.value = null
  modalError.value = null
}

async function saveCategory() {
  modalError.value = null
  if (!catForm.value.name || catForm.value.name.trim().length === 0) {
    modalError.value = 'שם קטגוריה נדרש'
    return
  }
  savingCat.value = true
  try {
    const payload = {
      name: catForm.value.name.trim(),
      allocatedAmount: Number(catForm.value.allocatedAmount) || 0,
      allocatedPercent: Number(catForm.value.allocatedPercent) || 0,
      icon: catForm.value.icon || null,
      color: catForm.value.color || null
    }
    if (editingCategory.value) {
      const res = await api.put(`/budget/categories/${editingCategory.value.id}`, payload)
      const idx = categories.value.findIndex(c => c.id === editingCategory.value.id)
      if (idx !== -1) categories.value[idx] = res.data
    } else {
      const res = await api.post('/budget/categories', payload)
      categories.value.push(res.data)
    }
    closeCategoryModal()
  } catch (e) {
    modalError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    savingCat.value = false
  }
}

async function deleteCategory(id) {
  if (!confirm('למחוק קטגוריה זו? כל ההוצאות שלה יימחקו גם כן.')) return
  try {
    await api.delete(`/budget/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
    await loadBudget()
  } catch (e) {
    alert(e?.response?.data?.message || 'שגיאה במחיקת קטגוריה')
  }
}

function goToCategory(id) {
  router.push(`/app/budget/category/${id}`)
}

onMounted(loadBudget)
</script>

<style scoped>
.budget-view { padding: var(--space-6, 1.5rem); max-width: 900px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6, 1.5rem); gap: 1rem; flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl, 1.5rem); font-weight: 800; color: var(--color-navy, #1e293b); margin: 0; }
.page-subtitle { color: var(--color-text-muted, #64748b); margin: 0.25rem 0 0; font-size: 0.9rem; }
.page-actions { display: flex; gap: 0.5rem; }

/* Summary */
.summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.summary-card { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); text-align: center; }
.summary-card.total { border-top: 3px solid #3b82f6; }
.summary-card.spent { border-top: 3px solid #f59e0b; }
.summary-card.remaining { border-top: 3px solid #10b981; }
.summary-card.remaining.overage { border-top-color: #ef4444; }
.summary-label { font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem; }
.summary-amount { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.summary-pct { font-size: 0.85rem; color: #64748b; margin-top: 0.2rem; }
.btn-inline { background: none; border: none; cursor: pointer; font-size: 0.75rem; color: #3b82f6; padding: 0; margin-top: 0.3rem; }

/* Donut */
.donut-wrap { margin-bottom: 1.5rem; }
.donut-body { display: flex; align-items: center; gap: 2rem; padding: 1.5rem; }
.donut-legend { display: flex; flex-direction: column; gap: 0.5rem; }
.legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }

/* Categories */
.section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: #1e293b; }
.category-cards { display: flex; flex-direction: column; gap: 0.75rem; }
.category-card { cursor: pointer; transition: box-shadow .2s; }
.category-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.cat-body { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; }
.cat-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
.cat-info { flex: 1; min-width: 0; }
.cat-name { font-weight: 700; font-size: 1rem; margin-bottom: 0.2rem; }
.cat-amounts { font-size: 0.8rem; color: #64748b; margin-bottom: 0.4rem; }
.cat-progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.cat-progress-fill { height: 100%; border-radius: 3px; transition: width .4s; }
.cat-actions { display: flex; gap: 0.3rem; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.3rem; border-radius: 6px; transition: background .15s; }
.btn-icon:hover { background: #f1f5f9; }
.btn-icon.danger:hover { background: #fee2e2; }

/* Empty */
.empty-state-small { text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 1rem; }

/* Loading */
.loading-center { text-align: center; padding: 4rem; }
.spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { width: 100%; max-width: 420px; border-radius: 1rem; }
.modal-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 1.25rem; }
.form-group { margin-bottom: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; color: #374151; }
.input-color { height: 42px; padding: 2px; cursor: pointer; }
.form-error { color: #dc2626; font-size: 0.85rem; margin-bottom: 0.5rem; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }

.empty-state { text-align: center; padding: 3rem; }
.empty-state-text { color: #64748b; margin-bottom: 1rem; }
</style>
