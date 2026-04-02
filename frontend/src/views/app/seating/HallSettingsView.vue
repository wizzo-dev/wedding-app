<template>
  <div class="hall-settings-view" dir="rtl">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/app/seating" class="back-link">← חזור לסידורי הושבה</router-link>
        <h1 class="page-title">⚙️ הגדרות אולם</h1>
        <p class="page-subtitle">הגדר את שם האולם, קיבולת ועיצוב</p>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען הגדרות...</p>
    </div>

    <div v-else-if="loadError" class="error-state">
      <span>⚠️ {{ loadError }}</span>
      <button @click="loadSettings" class="btn btn-outline">נסה שוב</button>
    </div>

    <div v-else class="settings-content">
      <div class="settings-card">
        <h2 class="card-title">🏛️ פרטי האולם</h2>
        <form @submit.prevent="saveSettings" class="settings-form">
          <label class="form-label">
            שם האולם
            <input v-model="form.hallName" required placeholder="לדוגמה: אולם נצח" class="form-input" />
          </label>
          <div class="two-col">
            <label class="form-label">
              קיבולת כוללת (מקומות)
              <input v-model.number="form.totalCapacity" type="number" min="1" max="5000" class="form-input" />
            </label>
            <label class="form-label">
              שולחנות קיימים
              <input :value="settings?.numTables ?? 0" class="form-input" disabled />
            </label>
          </div>
          <label class="form-label">
            צבע רקע
            <div class="color-row">
              <input v-model="form.bgColor" type="color" class="color-input" />
              <div class="presets">
                <button v-for="c in presets" :key="c" type="button"
                  class="preset-dot" :style="{background:c}"
                  :class="{active:form.bgColor===c}" @click="form.bgColor=c"></button>
              </div>
            </div>
          </label>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'שומר...' : '💾 שמור שינויים' }}
            </button>
          </div>
          <p v-if="saveError" class="form-error">{{ saveError }}</p>
          <p v-if="saveSuccess" class="form-success">✅ ההגדרות נשמרו בהצלחה!</p>
        </form>
      </div>

      <div class="settings-card">
        <h2 class="card-title">✨ יצירת שולחנות אוטומטית</h2>
        <div class="warning-box">
          ⚠️ פעולה זו תמחק את כל השולחנות הקיימים ותיצור חדשים. אורחים ישוחררו אך לא יימחקו.
        </div>
        <form @submit.prevent="generateTables" class="settings-form">
          <div class="two-col">
            <label class="form-label">
              מספר שולחנות
              <input v-model.number="genForm.count" type="number" min="1" max="100" class="form-input" required />
            </label>
            <label class="form-label">
              מקומות לשולחן
              <input v-model.number="genForm.seatsPerTable" type="number" min="1" max="50" class="form-input" required />
            </label>
          </div>
          <label class="form-label">
            שיטת שמות
            <select v-model="genForm.namingStyle" class="form-input">
              <option value="numbers">מספרים (1, 2, 3...)</option>
              <option value="hebrew">עברית (א, ב, ג...)</option>
              <option value="custom">תחילית מותאמת</option>
            </select>
          </label>
          <label v-if="genForm.namingStyle === 'custom'" class="form-label">
            תחילית
            <input v-model="genForm.prefix" class="form-input" placeholder="שולחן" />
          </label>
          <p class="preview-info">סה"כ קיבולת: {{ genForm.count * genForm.seatsPerTable }} מקומות</p>
          <div class="form-actions">
            <button type="submit" class="btn btn-warning" :disabled="generating">
              {{ generating ? 'יוצר...' : '✨ צור שולחנות' }}
            </button>
          </div>
          <p v-if="genError" class="form-error">{{ genError }}</p>
          <p v-if="genSuccess" class="form-success">✅ {{ genSuccess }}</p>
        </form>
      </div>

      <div v-if="stats" class="settings-card">
        <h2 class="card-title">📊 סטטיסטיקות</h2>
        <div class="stats-row">
          <div class="stat-box"><span class="sn">{{ settings.numTables }}</span><span class="sl">שולחנות</span></div>
          <div class="stat-box"><span class="sn">{{ settings.totalCapacity }}</span><span class="sl">מקומות</span></div>
          <div class="stat-box success"><span class="sn">{{ stats.assignedGuests }}</span><span class="sl">משובצים</span></div>
          <div class="stat-box warning"><span class="sn">{{ stats.unassignedGuests }}</span><span class="sl">ממתינים</span></div>
          <div class="stat-box"><span class="sn">{{ stats.occupancyRate }}%</span><span class="sl">תפוסה</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const settings = ref(null)
const stats = ref(null)
const loading = ref(false)
const loadError = ref(null)
const form = ref({ hallName: '', totalCapacity: 300, bgColor: '#f9f5f0' })
const genForm = ref({ count: 10, seatsPerTable: 8, namingStyle: 'numbers', prefix: 'שולחן' })
const saving = ref(false)
const generating = ref(false)
const saveError = ref(null)
const saveSuccess = ref(false)
const genError = ref(null)
const genSuccess = ref(null)
const presets = ['#f9f5f0', '#f0f4ff', '#f5fff5', '#fff9f0', '#fdf0f9', '#f0fbff', '#ffffff']

async function api(path, opts = {}) {
  const res = await fetch('/api/seating' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token, ...opts.headers }
  })
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'שגיאה') }
  return res.json()
}

async function loadSettings() {
  loading.value = true; loadError.value = null
  try {
    const [s, st] = await Promise.all([api('/settings'), api('/stats').catch(() => null)])
    settings.value = s; stats.value = st
    form.value = { hallName: s.hallName, totalCapacity: s.totalCapacity, bgColor: s.bgColor || '#f9f5f0' }
  } catch (e) { loadError.value = e.message } finally { loading.value = false }
}

async function saveSettings() {
  saving.value = true; saveError.value = null; saveSuccess.value = false
  try {
    await api('/settings', { method: 'PUT', body: JSON.stringify(form.value) })
    saveSuccess.value = true; setTimeout(() => saveSuccess.value = false, 3000)
    await loadSettings()
  } catch (e) { saveError.value = e.message } finally { saving.value = false }
}

async function generateTables() {
  generating.value = true; genError.value = null; genSuccess.value = null
  try {
    const r = await api('/generate-tables', { method: 'POST', body: JSON.stringify(genForm.value) })
    genSuccess.value = 'נוצרו ' + r.count + ' שולחנות!'
    setTimeout(() => genSuccess.value = null, 4000)
    await loadSettings()
  } catch (e) { genError.value = e.message } finally { generating.value = false }
}

onMounted(loadSettings)
</script>

<style scoped>
.hall-settings-view { max-width: 700px; margin: 0 auto; padding: var(--space-6); }
.page-header { margin-bottom: var(--space-6); }
.back-link { display: inline-flex; align-items: center; color: var(--color-primary); text-decoration: none; font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-3); }
.back-link:hover { text-decoration: underline; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.loading-state, .error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.settings-content { display: flex; flex-direction: column; gap: var(--space-6); }
.settings-card { background: var(--color-surface); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); }
.card-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-4); }
.settings-form { display: flex; flex-direction: column; gap: var(--space-4); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); color: var(--color-navy); direction: rtl; }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-input:disabled { background: #f9fafb; color: var(--color-text-muted); }
.color-row { display: flex; align-items: center; gap: var(--space-3); }
.color-input { width: 48px; height: 40px; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 2px; cursor: pointer; }
.presets { display: flex; gap: var(--space-2); }
.preset-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; box-shadow: 0 0 0 1px var(--color-border); transition: all 0.15s; }
.preset-dot:hover { transform: scale(1.15); }
.preset-dot.active { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary); }
.warning-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: var(--radius-lg); padding: var(--space-3); font-size: var(--font-size-xs); color: #92400e; margin-bottom: var(--space-4); }
.preview-info { background: var(--color-primary-bg); padding: var(--space-3); border-radius: var(--radius-lg); font-size: var(--font-size-sm); color: var(--color-navy); }
.form-actions { display: flex; gap: var(--space-3); }
.form-error { color: #ef4444; font-size: var(--font-size-xs); }
.form-success { color: #10b981; font-size: var(--font-size-sm); font-weight: 600; }
.stats-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.stat-box { display: flex; flex-direction: column; align-items: center; gap: 4px; background: #f9fafb; border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4); min-width: 80px; }
.sn { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1; }
.stat-box.success .sn { color: #10b981; }
.stat-box.warning .sn { color: #f59e0b; }
.sl { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-5); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-light); }
.btn-warning { background: #f59e0b; color: white; }
.btn-warning:hover { background: #d97706; }
.btn-warning:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 600px) { .hall-settings-view { padding: var(--space-4); } .two-col { grid-template-columns: 1fr; } }
</style>
