<template>
  <div class="budget-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ניהול תקציב 💰</h1>
        <p class="page-sub">עקבו אחרי ההוצאות שלכם לחתונה</p>
      </div>
      <button class="btn btn-primary" @click="showAddModal = true">+ קטגוריה חדשה</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadBudget">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card card card-body">
          <div class="stat-icon">📊</div>
          <div class="stat-label">תקציב כולל</div>
          <div class="stat-value">{{ formatCurrency(budget.total) }}</div>
        </div>
        <div class="stat-card card card-body">
          <div class="stat-icon">💸</div>
          <div class="stat-label">הוצא עד כה</div>
          <div class="stat-value spent">{{ formatCurrency(budget.spent) }}</div>
        </div>
        <div class="stat-card card card-body">
          <div class="stat-icon">✅</div>
          <div class="stat-label">נותר</div>
          <div class="stat-value remain" :class="{ negative: budget.remaining < 0 }">
            {{ formatCurrency(budget.remaining) }}
          </div>
        </div>
      </div>

      <!-- Donut Chart + Summary -->
      <div class="chart-section card card-body">
        <div class="donut-wrap">
          <div
            class="donut"
            :style="`background: conic-gradient(var(--color-primary) ${spentPct}%, var(--color-border) 0)`"
          >
            <div class="donut-inner">
              <div class="donut-pct">{{ spentPct }}%</div>
              <div class="donut-label">הוצא</div>
            </div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--color-primary)"></span>
            <span>הוצא: {{ formatCurrency(budget.spent) }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: var(--color-border)"></span>
            <span>נותר: {{ formatCurrency(Math.max(0, budget.remaining)) }}</span>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="categories-section">
        <h2 class="section-title">קטגוריות</h2>
        <div v-if="budget.categories.length === 0" class="empty-state card card-body">
          <div style="font-size: 2rem">💰</div>
          <p>אין קטגוריות עדיין. הוסיפו קטגוריה ראשונה!</p>
        </div>
        <div class="categories-list">
          <router-link
            v-for="cat in budget.categories"
            :key="cat.id"
            :to="`/app/budget/category/${cat.id}`"
            class="category-card card"
          >
            <div class="card-body">
              <div class="cat-header">
                <div class="cat-icon-wrap" :style="`background: ${cat.color}33`">
                  <span class="cat-icon">{{ cat.icon }}</span>
                </div>
                <div class="cat-info">
                  <div class="cat-name">{{ cat.name }}</div>
                  <div class="cat-amounts">
                    <span class="cat-spent">הוצא: {{ formatCurrency(catSpent(cat)) }}</span>
                    <span class="cat-sep">·</span>
                    <span class="cat-allocated">מוקצה: {{ formatCurrency(cat.allocatedAmount) }}</span>
                  </div>
                </div>
                <div class="cat-arrow">←</div>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="`width: ${catPct(cat)}%; background: ${cat.color}`"
                ></div>
              </div>
              <div class="cat-footer">
                <span class="cat-pct">{{ catPct(cat) }}% מנוצל</span>
                <span class="cat-count">{{ cat.expenses?.length || 0 }} הוצאות</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </template>

    <!-- Add Category Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal card" dir="rtl">
          <div class="modal-header">
            <h3>קטגוריה חדשה</h3>
            <button class="modal-close" @click="showAddModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">שם הקטגוריה *</label>
              <input v-model="newCat.name" type="text" class="form-input" placeholder="לדוגמה: צילום" />
            </div>
            <div class="form-group">
              <label class="form-label">סכום מוקצה (₪)</label>
              <input v-model="newCat.allocatedAmount" type="number" class="form-input" placeholder="0" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">אייקון</label>
              <div class="icon-picker">
                <button
                  v-for="icon in ICONS"
                  :key="icon"
                  class="icon-btn"
                  :class="{ active: newCat.icon === icon }"
                  @click="newCat.icon = icon"
                >{{ icon }}</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">צבע</label>
              <div class="color-picker">
                <button
                  v-for="color in COLORS"
                  :key="color"
                  class="color-btn"
                  :class="{ active: newCat.color === color }"
                  :style="`background: ${color}`"
                  @click="newCat.color = color"
                ></button>
              </div>
            </div>
            <div v-if="addError" class="form-error-msg">{{ addError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddModal = false">ביטול</button>
            <button class="btn btn-primary" :disabled="adding" @click="addCategory">
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
import api from '@/composables/useApi'

const ICONS = ['💰','🏛️','🍽️','📸','🎵','👗','💐','✉️','📋','🎂','💍','✈️','🚗','🎁','💡']
const COLORS = ['#E91E8C','#e8d5b7','#f8b4b4','#b4d4f8','#d4b4f8','#f8d4e8','#b4f8d4','#f8f4b4','#d4d4d4','#fbbf24','#34d399','#60a5fa']

const loading = ref(true)
const error = ref(null)
const budget = ref({ categories: [], total: 0, spent: 0, remaining: 0 })
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref(null)
const newCat = ref({ name: '', allocatedAmount: '', icon: '💰', color: '#E91E8C' })

const spentPct = computed(() => {
  if (!budget.value.total) return 0
  return Math.min(100, Math.round((budget.value.spent / budget.value.total) * 100))
})

function catSpent(cat) {
  return (cat.expenses || []).reduce((s, e) => s + (e.amount || 0), 0)
}

function catPct(cat) {
  if (!cat.allocatedAmount) return 0
  return Math.min(100, Math.round((catSpent(cat) / cat.allocatedAmount) * 100))
}

function formatCurrency(n) {
  return `₪${Math.round(n || 0).toLocaleString('he-IL')}`
}

async function loadBudget() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/budget')
    budget.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת התקציב'
  } finally {
    loading.value = false
  }
}

async function addCategory() {
  addError.value = null
  if (!newCat.value.name.trim()) { addError.value = 'שם קטגוריה נדרש'; return }
  adding.value = true
  try {
    await api.post('/budget/categories', {
      name: newCat.value.name.trim(),
      allocatedAmount: parseFloat(newCat.value.allocatedAmount) || 0,
      icon: newCat.value.icon,
      color: newCat.value.color
    })
    showAddModal.value = false
    newCat.value = { name: '', allocatedAmount: '', icon: '💰', color: '#E91E8C' }
    await loadBudget()
  } catch (e) {
    addError.value = e.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    adding.value = false
  }
}

onMounted(loadBudget)
</script>

<style scoped>
.budget-view { padding: var(--space-6); max-width: 900px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-card { text-align: center; gap: var(--space-4); display: flex; flex-direction: column; align-items: center; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { text-align: center; }
.stat-icon { font-size: 1.5rem; margin-bottom: var(--space-2); }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-1); }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.stat-value.spent { color: var(--color-primary); }
.stat-value.remain { color: var(--color-success); }
.stat-value.remain.negative { color: var(--color-error); }

.chart-section { display: flex; align-items: center; gap: var(--space-8); margin-bottom: var(--space-6); }
.donut-wrap { flex-shrink: 0; }
.donut {
  width: 140px; height: 140px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.donut-inner {
  width: 90px; height: 90px;
  background: white;
  border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.donut-pct { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.donut-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.chart-legend { display: flex; flex-direction: column; gap: var(--space-3); }
.legend-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); }
.legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.empty-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }

.categories-list { display: flex; flex-direction: column; gap: var(--space-3); }
.category-card { display: block; text-decoration: none; color: inherit; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
.category-card:hover { transform: translateY(-2px); border-color: var(--color-primary); }

.cat-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.cat-icon-wrap { width: 44px; height: 44px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cat-icon { font-size: 1.3rem; }
.cat-info { flex: 1; }
.cat-name { font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-1); }
.cat-amounts { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.cat-sep { margin: 0 var(--space-2); }
.cat-arrow { color: var(--color-text-muted); font-size: 1.2rem; }

.progress-bar { height: 8px; background: var(--color-bg); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-2); }
.progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; }

.cat-footer { display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-5) 0; }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); padding: var(--space-1); }
.modal-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: 0 var(--space-5) var(--space-5); }

.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-base); outline: none; transition: border-color var(--transition-fast); }
.form-input:focus { border-color: var(--color-primary); }
.form-error-msg { color: var(--color-error); font-size: var(--font-size-sm); }

.icon-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.icon-btn { width: 40px; height: 40px; border-radius: var(--radius-xl); border: 2px solid var(--color-border); background: white; font-size: 1.2rem; cursor: pointer; transition: border-color var(--transition-fast); display: flex; align-items: center; justify-content: center; }
.icon-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.icon-btn:hover { border-color: var(--color-primary); }

.color-picker { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.color-btn { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: border-color var(--transition-fast); }
.color-btn.active { border-color: var(--color-navy); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: 1fr; }
  .chart-section { flex-direction: column; }
  .page-header { flex-direction: column; gap: var(--space-3); }
}
</style>
