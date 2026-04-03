<template>
  <div class="hall-settings-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">הגדרות אולם 🏛️</h1>
        <p class="page-sub">הגדירו את פרטי האולם ומספר השולחנות</p>
      </div>
      <button class="back-btn" @click="$router.push('/app/seating')">← חזרה לסידורי הושבה</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadSettings">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Settings Form -->
      <div class="settings-card card card-body">
        <h2 class="section-title">פרטי האולם</h2>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">שם האולם</label>
            <input v-model="form.hallName" type="text" class="form-input" placeholder="לדוגמה: אולם הדקל" />
          </div>
          <div class="form-group">
            <label class="form-label">קיבולת כוללת</label>
            <input v-model="form.totalCapacity" type="number" class="form-input" placeholder="0" min="0" />
          </div>
        </div>
        <div v-if="saveError" class="form-error-msg">{{ saveError }}</div>
        <div class="form-actions">
          <button class="btn btn-primary" :disabled="saving" @click="saveSettings">
            {{ saving ? 'שומר...' : 'שמור הגדרות' }}
          </button>
          <span v-if="savedOk" class="saved-msg">✓ נשמר!</span>
        </div>
      </div>

      <!-- Current State -->
      <div class="stats-row">
        <div class="stat-card card card-body">
          <div class="stat-icon">🪑</div>
          <div class="stat-value">{{ hall.tableCount || 0 }}</div>
          <div class="stat-label">שולחנות קיימים</div>
        </div>
        <div class="stat-card card card-body">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ hall.totalCapacity || 0 }}</div>
          <div class="stat-label">מקומות כולל</div>
        </div>
      </div>

      <!-- Generate Tables -->
      <div class="generate-card card card-body">
        <h2 class="section-title">יצירת שולחנות אוטומטית</h2>
        <p class="section-desc">יצרו מספר שולחנות בבת אחת. שולחנות קיימים לא יימחקו.</p>
        <div class="gen-form">
          <div class="form-group">
            <label class="form-label">מספר שולחנות</label>
            <input v-model="genForm.count" type="number" class="form-input" min="1" max="50" />
          </div>
          <div class="form-group">
            <label class="form-label">מקומות לשולחן</label>
            <input v-model="genForm.seatsPerTable" type="number" class="form-input" min="1" max="30" />
          </div>
        </div>
        <div v-if="genError" class="form-error-msg">{{ genError }}</div>
        <div class="form-actions">
          <button class="btn btn-primary" :disabled="generating" @click="generateTables">
            {{ generating ? 'יוצר...' : `✨ צור ${genForm.count} שולחנות` }}
          </button>
          <span v-if="genOk" class="saved-msg">✓ {{ genOk }}</span>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref(null)
const hall = ref({})
const saving = ref(false)
const savedOk = ref(false)
const saveError = ref(null)
const generating = ref(false)
const genOk = ref('')
const genError = ref(null)

const form = ref({ hallName: '', totalCapacity: 0 })
const genForm = ref({ count: 10, seatsPerTable: 8 })

async function loadSettings() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/seating/settings')
    hall.value = res.data
    form.value.hallName = res.data.hallName || ''
    form.value.totalCapacity = res.data.totalCapacity || 0
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saveError.value = null
  savedOk.value = false
  saving.value = true
  try {
    await api.put('/seating/settings', {
      hallName: form.value.hallName,
      totalCapacity: parseInt(form.value.totalCapacity) || 0
    })
    savedOk.value = true
    setTimeout(() => { savedOk.value = false }, 3000)
    await loadSettings()
  } catch (e) {
    saveError.value = e.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    saving.value = false
  }
}

async function generateTables() {
  genError.value = null
  genOk.value = ''
  generating.value = true
  try {
    const res = await api.post('/seating/generate-tables', {
      count: parseInt(genForm.value.count) || 10,
      seatsPerTable: parseInt(genForm.value.seatsPerTable) || 8
    })
    genOk.value = `נוצרו ${res.data.created || genForm.value.count} שולחנות!`
    await loadSettings()
  } catch (e) {
    genError.value = e.response?.data?.message || 'שגיאה ביצירת שולחנות'
  } finally {
    generating.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.hall-settings-view { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }
.back-btn { background: none; border: none; color: var(--color-primary); font-size: var(--font-size-sm); cursor: pointer; font-weight: 600; }
.back-btn:hover { text-decoration: underline; }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.settings-card { margin-bottom: var(--space-4); }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.section-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-base); outline: none; transition: border-color var(--transition-fast); }
.form-input:focus { border-color: var(--color-primary); }
.form-error-msg { color: var(--color-error); font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
.form-actions { display: flex; align-items: center; gap: var(--space-3); }
.saved-msg { font-size: var(--font-size-sm); color: var(--color-success); font-weight: 600; }

.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4); }
.stat-card { text-align: center; }
.stat-icon { font-size: 1.5rem; margin-bottom: var(--space-2); }
.stat-value { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); }

.generate-card { }
.gen-form { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-grid, .gen-form, .stats-row { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: var(--space-3); }
}
</style>
