<template>
  <div class="budget-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ניהול תקציב 💸</h1>
        <p class="page-sub">עקוב אחר ההוצאות שלך לחתונה</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="showEditTotal = true">
          <span>✏️</span> עדכן תקציב כולל
        </button>
        <button class="btn btn-primary" @click="showAddCategory = true">
          <span>+</span> קטגוריה חדשה
        </button>
      </div>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <div class="skeleton-grid">
        <div class="skeleton skeleton-card" v-for="n in 4" :key="n"></div>
      </div>
      <div class="skeleton skeleton-full" style="height:300px;margin-top:24px;border-radius:16px;"></div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card total">
          <div class="stat-label">תקציב כולל</div>
          <div class="stat-value">{{ fmt(budget.total) }}</div>
          <div class="stat-sub">סה"כ מתוכנן</div>
        </div>
        <div class="stat-card allocated">
          <div class="stat-label">מוקצה</div>
          <div class="stat-value">{{ fmt(budget.allocated) }}</div>
          <div class="stat-sub">{{ budget.total > 0 ? Math.round(budget.allocated/budget.total*100) : 0 }}% מהתקציב</div>
        </div>
        <div class="stat-card spent">
          <div class="stat-label">הוצא</div>
          <div class="stat-value">{{ fmt(budget.spent) }}</div>
          <div class="stat-sub">{{ budget.pct }}% בוצע</div>
        </div>
        <div class="stat-card" :class="budget.remaining < 0 ? 'over-budget' : 'remaining'">
          <div class="stat-label">{{ budget.remaining < 0 ? '⚠️ חריגה' : 'נותר' }}</div>
          <div class="stat-value">{{ fmt(Math.abs(budget.remaining)) }}</div>
          <div class="stat-sub">{{ budget.remaining < 0 ? 'מעבר לתקציב' : 'יתרה' }}</div>
        </div>
      </div>

      <!-- Donut chart + overview -->
      <div class="overview-row">
        <!-- SVG Donut chart -->
        <div class="donut-card">
          <h2 class="card-title">פיזור תקציב</h2>
          <div class="donut-wrapper">
            <svg class="donut-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="75" fill="none" stroke="#f0f0f5" stroke-width="28" />
              <template v-if="donutSegments.length">
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.id"
                  cx="100" cy="100" r="75"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="28"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                  stroke-linecap="butt"
                  style="transform:rotate(-90deg);transform-origin:center"
                />
              </template>
              <circle v-else cx="100" cy="100" r="75" fill="none" stroke="#e8e8ef" stroke-width="28" />
              <!-- Center text -->
              <text x="100" y="94" text-anchor="middle" font-size="24" font-weight="800" fill="#1A1F36" font-family="Heebo,sans-serif">{{ budget.pct }}%</text>
              <text x="100" y="116" text-anchor="middle" font-size="11" fill="#6B7280" font-family="Heebo,sans-serif">הוצא</text>
            </svg>
            <!-- Legend -->
            <div class="donut-legend">
              <div v-for="cat in categories" :key="cat.id" class="legend-item" @click="goCategory(cat.id)">
                <span class="legend-dot" :style="{ background: cat.color || '#E91E8C' }"></span>
                <span class="legend-name">{{ cat.icon }} {{ cat.name }}</span>
                <span class="legend-pct">{{ cat.allocatedAmount > 0 && budget.allocated > 0 ? Math.round(cat.allocatedAmount/budget.allocated*100) : 0 }}%</span>
              </div>
              <div v-if="categories.length === 0" class="legend-empty">אין קטגוריות עדיין</div>
            </div>
          </div>
          <!-- Progress bar -->
          <div class="global-progress">
            <div class="progress-label">
              <span>{{ fmt(budget.spent) }} הוצא</span>
              <span>{{ fmt(budget.total) }} סה"כ</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: budget.pct + '%', background: budget.pct > 90 ? 'var(--color-error)' : budget.pct > 70 ? 'var(--color-warning)' : 'var(--color-primary)' }"></div>
            </div>
          </div>
        </div>

        <!-- Recent expenses -->
        <div class="recent-card">
          <div class="card-header-row">
            <h2 class="card-title">הוצאות אחרונות</h2>
          </div>
          <div v-if="recentExpenses.length === 0" class="empty-list">
            <span>💳</span>
            <p>אין הוצאות עדיין</p>
          </div>
          <div class="expense-list" v-else>
            <div
              v-for="exp in recentExpenses"
              :key="exp.id"
              class="expense-item"
              @click="goCategory(exp.category.id)"
            >
              <div class="exp-icon">{{ exp.category.icon || '💰' }}</div>
              <div class="exp-info">
                <div class="exp-vendor">{{ exp.vendorName }}</div>
                <div class="exp-cat">{{ exp.category.name }} · {{ fmtDate(exp.date) }}</div>
              </div>
              <div class="exp-right">
                <div class="exp-amount">{{ fmt(exp.amount) }}</div>
                <span class="paid-badge" :class="exp.isPaid ? 'paid' : 'unpaid'">
                  {{ exp.isPaid ? '✓ שולם' : 'ממתין' }}
                </span>
              </div>
            </div>
          </div>
          <button v-if="recentExpenses.length > 0" class="btn-add-expense" @click="showAddExpense = true">
            + הוסף הוצאה
          </button>
        </div>
      </div>

      <!-- Categories grid -->
      <div class="categories-section">
        <div class="section-header">
          <h2 class="section-title">קטגוריות תקציב</h2>
          <button class="btn btn-outline btn-sm" @click="showAddCategory = true">+ הוסף קטגוריה</button>
        </div>

        <div v-if="categories.length === 0" class="empty-cats">
          <div class="empty-icon">📂</div>
          <h3>אין קטגוריות עדיין</h3>
          <p>הוסף קטגוריות לניהול התקציב שלך</p>
          <button class="btn btn-primary" @click="showAddCategory = true">+ הוסף קטגוריה ראשונה</button>
        </div>

        <div class="cats-grid" v-else>
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="cat-card"
            :class="{ 'over-budget-card': cat.spent > cat.allocatedAmount && cat.allocatedAmount > 0 }"
            @click="goCategory(cat.id)"
          >
            <div class="cat-card-header">
              <div class="cat-icon" :style="{ background: cat.color + '20' }">{{ cat.icon || '💰' }}</div>
              <div class="cat-meta">
                <div class="cat-name">{{ cat.name }}</div>
                <div class="cat-count">{{ cat.expenseCount }} הוצאות</div>
              </div>
              <button class="cat-delete" @click.stop="confirmDelete(cat)" title="מחק קטגוריה">🗑️</button>
            </div>
            <div class="cat-amounts">
              <div class="amount-row">
                <span class="amount-label">הוצא</span>
                <span class="amount-val spent-val">{{ fmt(cat.spent) }}</span>
              </div>
              <div class="amount-row">
                <span class="amount-label">הוקצה</span>
                <span class="amount-val">{{ fmt(cat.allocatedAmount) }}</span>
              </div>
            </div>
            <div class="cat-progress-track">
              <div
                class="cat-progress-fill"
                :style="{
                  width: cat.pct + '%',
                  background: cat.pct >= 100 ? 'var(--color-error)' : cat.pct >= 80 ? 'var(--color-warning)' : cat.color || 'var(--color-primary)'
                }"
              ></div>
            </div>
            <div class="cat-pct-row">
              <span :class="{ 'pct-over': cat.pct >= 100, 'pct-warn': cat.pct >= 80 && cat.pct < 100 }">{{ cat.pct }}%</span>
              <span class="pct-sub" v-if="cat.spent > cat.allocatedAmount && cat.allocatedAmount > 0">⚠️ חריגה</span>
              <span class="pct-sub" v-else>נותר {{ fmt(Math.max(0, cat.allocatedAmount - cat.spent)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Modal: Edit Total Budget ─────────────────────────────────────────── -->
    <teleport to="body">
      <div v-if="showEditTotal" class="modal-overlay" @click.self="showEditTotal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>עדכן תקציב כולל</h3>
            <button class="modal-close" @click="showEditTotal = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-label">תקציב כולל לחתונה (₪)</label>
            <input
              v-model.number="editTotalVal"
              type="number"
              class="form-input"
              min="0"
              step="1000"
              placeholder="לדוגמה: 80000"
            />
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showEditTotal = false">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveTotal">
              {{ saving ? 'שומר...' : 'שמור' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Modal: Add Category ──────────────────────────────────────────────── -->
      <div v-if="showAddCategory" class="modal-overlay" @click.self="showAddCategory = false">
        <div class="modal">
          <div class="modal-header">
            <h3>קטגוריה חדשה</h3>
            <button class="modal-close" @click="showAddCategory = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-label">אייקון</label>
            <div class="icon-picker">
              <button
                v-for="ic in ICONS"
                :key="ic"
                class="icon-btn"
                :class="{ active: newCat.icon === ic }"
                @click="newCat.icon = ic"
              >{{ ic }}</button>
            </div>
            <label class="form-label">שם קטגוריה *</label>
            <input v-model="newCat.name" type="text" class="form-input" placeholder="לדוגמה: צלם, קייטרינג..." />
            <label class="form-label">סכום מוקצה (₪)</label>
            <input v-model.number="newCat.allocatedAmount" type="number" class="form-input" min="0" step="100" placeholder="0" />
            <label class="form-label">צבע</label>
            <div class="color-picker">
              <button
                v-for="cl in COLORS"
                :key="cl"
                class="color-btn"
                :class="{ active: newCat.color === cl }"
                :style="{ background: cl }"
                @click="newCat.color = cl"
              ></button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddCategory = false">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="addCategory">
              {{ saving ? 'שומר...' : 'הוסף קטגוריה' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Modal: Add Expense ──────────────────────────────────────────────── -->
      <div v-if="showAddExpense" class="modal-overlay" @click.self="showAddExpense = false">
        <div class="modal">
          <div class="modal-header">
            <h3>הוסף הוצאה</h3>
            <button class="modal-close" @click="showAddExpense = false">✕</button>
          </div>
          <div class="modal-body">
            <label class="form-label">קטגוריה *</label>
            <select v-model="newExp.categoryId" class="form-input">
              <option value="" disabled>בחר קטגוריה</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
            </select>
            <label class="form-label">שם ספק *</label>
            <input v-model="newExp.vendorName" type="text" class="form-input" placeholder="לדוגמה: סטודיו XYZ" />
            <label class="form-label">סכום (₪) *</label>
            <input v-model.number="newExp.amount" type="number" class="form-input" min="0" placeholder="0" />
            <label class="form-label">תאריך</label>
            <input v-model="newExp.date" type="date" class="form-input" />
            <label class="form-label">הערות</label>
            <input v-model="newExp.note" type="text" class="form-input" placeholder="הערות אופציונלי" />
            <label class="form-check">
              <input v-model="newExp.isPaid" type="checkbox" /> שולם
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddExpense = false">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="addExpense">
              {{ saving ? 'שומר...' : 'הוסף הוצאה' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Confirm Delete Category ─────────────────────────────────────────── -->
      <div v-if="deleteCat" class="modal-overlay" @click.self="deleteCat = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3>מחיקת קטגוריה</h3>
            <button class="modal-close" @click="deleteCat = null">✕</button>
          </div>
          <div class="modal-body">
            <p>האם למחוק את הקטגוריה <strong>{{ deleteCat.name }}</strong>?<br>כל ההוצאות בקטגוריה זו יימחקו.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deleteCat = null">ביטול</button>
            <button class="btn btn-danger" :disabled="saving" @click="deleteCategory">
              {{ saving ? 'מוחק...' : 'מחק' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/composables/useApi'

const router = useRouter()

const ICONS = ['💰','🎂','📸','🎵','💐','👗','💍','🚗','🏨','🍽️','💄','🎪','📋','✈️','🏠','🎁']
const COLORS = ['#E91E8C','#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2','#EA580C','#9333EA','#16A34A']

const loading = ref(true)
const saving = ref(false)
const error = ref(null)

const budget = ref({ total: 0, allocated: 0, spent: 0, paid: 0, remaining: 0, pct: 0 })
const categories = ref([])
const recentExpenses = ref([])

const showEditTotal = ref(false)
const showAddCategory = ref(false)
const showAddExpense = ref(false)
const deleteCat = ref(null)

const editTotalVal = ref(0)
const newCat = ref({ name: '', allocatedAmount: 0, icon: '💰', color: '#E91E8C' })
const newExp = ref({ categoryId: '', vendorName: '', amount: 0, isPaid: false, note: '', date: new Date().toISOString().split('T')[0] })

// Computed: donut segments
const CIRCUMFERENCE = 2 * Math.PI * 75 // ≈ 471.24

const donutSegments = computed(() => {
  if (!budget.value.allocated || categories.value.length === 0) return []
  let offset = 0
  return categories.value.map(cat => {
    const frac = cat.allocatedAmount / budget.value.allocated
    const dash = frac * CIRCUMFERENCE
    const seg = {
      id: cat.id,
      color: cat.color || '#E91E8C',
      dashArray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashOffset: -offset
    }
    offset += dash
    return seg
  })
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const [overview, recent] = await Promise.all([
      api.get('/budget'),
      api.get('/budget/expenses/recent?limit=8')
    ])
    budget.value = overview.data.budget
    categories.value = overview.data.categories
    recentExpenses.value = recent.data
    editTotalVal.value = budget.value.total
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת נתונים'
  } finally {
    loading.value = false
  }
}

async function saveTotal() {
  saving.value = true
  try {
    await api.put('/budget/total', { total: editTotalVal.value })
    showEditTotal.value = false
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

async function addCategory() {
  if (!newCat.value.name.trim()) { alert('שם קטגוריה נדרש'); return }
  saving.value = true
  try {
    await api.post('/budget/categories', {
      name: newCat.value.name,
      allocatedAmount: newCat.value.allocatedAmount || 0,
      allocatedPercent: budget.value.total > 0 ? (newCat.value.allocatedAmount / budget.value.total) * 100 : 0,
      icon: newCat.value.icon,
      color: newCat.value.color
    })
    showAddCategory.value = false
    newCat.value = { name: '', allocatedAmount: 0, icon: '💰', color: '#E91E8C' }
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בהוספה')
  } finally {
    saving.value = false
  }
}

async function addExpense() {
  if (!newExp.value.categoryId) { alert('בחר קטגוריה'); return }
  if (!newExp.value.vendorName.trim()) { alert('שם ספק נדרש'); return }
  if (!newExp.value.amount || newExp.value.amount <= 0) { alert('הזן סכום תקין'); return }
  saving.value = true
  try {
    await api.post(`/budget/categories/${newExp.value.categoryId}/expenses`, {
      vendorName: newExp.value.vendorName,
      amount: newExp.value.amount,
      isPaid: newExp.value.isPaid,
      note: newExp.value.note || null,
      date: newExp.value.date || null
    })
    showAddExpense.value = false
    newExp.value = { categoryId: '', vendorName: '', amount: 0, isPaid: false, note: '', date: new Date().toISOString().split('T')[0] }
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בהוספה')
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat) { deleteCat.value = cat }

async function deleteCategory() {
  if (!deleteCat.value) return
  saving.value = true
  try {
    await api.delete(`/budget/categories/${deleteCat.value.id}`)
    deleteCat.value = null
    await load()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה במחיקה')
  } finally {
    saving.value = false
  }
}

function goCategory(id) { router.push(`/app/budget/category/${id}`) }

function fmt(n) {
  if (!n && n !== 0) return '—'
  return '₪' + Number(n).toLocaleString('he-IL')
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

onMounted(load)
</script>

<style scoped>
.budget-view { padding: var(--space-6); max-width: 1200px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); transition: var(--transition); }
.stat-card:hover { box-shadow: var(--shadow); }
.stat-card.total { border-color: var(--color-primary); }
.stat-card.total .stat-value { color: var(--color-primary); }
.stat-card.spent .stat-value { color: var(--color-warning); }
.stat-card.remaining .stat-value { color: var(--color-success); }
.stat-card.over-budget { border-color: var(--color-error); }
.stat-card.over-budget .stat-value { color: var(--color-error); }
.stat-label { font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); font-weight: 600; margin-bottom: var(--space-1); }
.stat-value { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.stat-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px; }

/* Overview row */
.overview-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-bottom: var(--space-6); }

/* Donut card */
.donut-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.donut-wrapper { display: flex; gap: var(--space-6); align-items: center; }
.donut-svg { width: 180px; height: 180px; flex-shrink: 0; }
.donut-legend { flex: 1; }
.legend-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) 0; cursor: pointer; border-radius: var(--radius-sm); transition: var(--transition-fast); }
.legend-item:hover { background: var(--color-bg-subtle); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; font-size: var(--font-size-sm); color: var(--color-text); }
.legend-pct { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.legend-empty { font-size: var(--font-size-sm); color: var(--color-text-muted); padding: var(--space-4) 0; }
.global-progress { margin-top: var(--space-5); }
.progress-label { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-2); }
.progress-track { height: 10px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; border-radius: var(--radius-full); transition: width .5s ease; }

/* Recent expenses */
.recent-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); display: flex; flex-direction: column; }
.expense-list { flex: 1; overflow-y: auto; max-height: 260px; }
.expense-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: var(--transition-fast); }
.expense-item:hover { background: var(--color-bg-subtle); border-radius: var(--radius-sm); }
.expense-item:last-child { border-bottom: none; }
.exp-icon { width: 36px; height: 36px; border-radius: var(--radius); background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.exp-info { flex: 1; min-width: 0; }
.exp-vendor { font-weight: 600; font-size: var(--font-size-sm); color: var(--color-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exp-cat { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.exp-right { text-align: left; flex-shrink: 0; }
.exp-amount { font-weight: 700; font-size: var(--font-size-sm); color: var(--color-navy); }
.paid-badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: 10px; font-weight: 600; margin-top: 2px; }
.paid-badge.paid { background: var(--color-success-bg); color: var(--color-success); }
.paid-badge.unpaid { background: var(--color-warning-bg); color: var(--color-warning); }
.empty-list { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-8) 0; color: var(--color-text-muted); }
.btn-add-expense { margin-top: var(--space-4); padding: var(--space-2) var(--space-4); border: 1.5px dashed var(--color-primary); border-radius: var(--radius); color: var(--color-primary); background: transparent; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; width: 100%; transition: var(--transition-fast); }
.btn-add-expense:hover { background: var(--color-primary-bg); }

/* Categories section */
.categories-section { margin-top: var(--space-6); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
.section-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.cats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-4); }
.cat-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); cursor: pointer; transition: var(--transition); }
.cat-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.cat-card.over-budget-card { border-color: var(--color-error); }
.cat-card-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.cat-icon { width: 40px; height: 40px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.cat-meta { flex: 1; min-width: 0; }
.cat-name { font-weight: 700; font-size: var(--font-size-base); color: var(--color-navy); }
.cat-count { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.cat-delete { background: none; border: none; cursor: pointer; opacity: 0; font-size: 16px; transition: var(--transition-fast); padding: 4px; border-radius: var(--radius-sm); }
.cat-card:hover .cat-delete { opacity: 1; }
.cat-delete:hover { background: var(--color-error-bg); }
.cat-amounts { display: flex; justify-content: space-between; margin-bottom: var(--space-3); }
.amount-row { display: flex; flex-direction: column; gap: 2px; }
.amount-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.amount-val { font-weight: 700; font-size: var(--font-size-sm); color: var(--color-navy); }
.spent-val { color: var(--color-primary); }
.cat-progress-track { height: 8px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-2); }
.cat-progress-fill { height: 100%; border-radius: var(--radius-full); transition: width .5s ease; }
.cat-pct-row { display: flex; justify-content: space-between; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.pct-over { color: var(--color-error); }
.pct-warn { color: var(--color-warning); }
.pct-sub { font-weight: 400; }

/* Empty states */
.empty-cats { text-align: center; padding: var(--space-12) var(--space-8); background: var(--color-bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--color-border); }
.empty-icon { font-size: 48px; margin-bottom: var(--space-3); }
.empty-cats h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-cats p { color: var(--color-text-muted); margin-bottom: var(--space-5); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--color-navy); border: 1.5px solid var(--color-border); }
.btn-outline:hover { border-color: var(--color-navy); }
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }
.btn-sm { padding: 6px 14px; font-size: var(--font-size-xs); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: #fff; border-radius: var(--radius-xl); padding: var(--space-6); width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); }
.modal-sm { max-width: 360px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-sm); }
.modal-close:hover { background: var(--color-bg-subtle); }
.modal-body { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); display: block; margin-bottom: var(--space-1); }
.form-input { width: 100%; padding: var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; }
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; }
.icon-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-1); }
.icon-btn { width: 36px; height: 36px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: var(--transition-fast); }
.icon-btn.active { border-color: var(--color-primary); background: var(--color-primary-bg); }
.color-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.color-btn { width: 30px; height: 30px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: var(--transition-fast); }
.color-btn.active { border-color: var(--color-navy); transform: scale(1.15); }

/* Skeleton */
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.skeleton-card { height: 100px; border-radius: var(--radius-lg); }
.skeleton-full { width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Error */
.error-state { text-align: center; padding: var(--space-12); }
.error-icon { font-size: 40px; }

/* Responsive */
@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .overview-row { grid-template-columns: 1fr; }
  .donut-wrapper { flex-direction: column; }
}
@media (max-width: 600px) {
  .budget-view { padding: var(--space-4); }
  .stats-row { grid-template-columns: 1fr 1fr; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { justify-content: flex-end; }
}
</style>
