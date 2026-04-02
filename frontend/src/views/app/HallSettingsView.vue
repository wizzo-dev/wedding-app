<template>
  <div class="hall-settings fade-in" dir="rtl">

    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <template v-if="loading">
      <div class="page-header">
        <div class="skeleton" style="width:240px;height:32px;border-radius:8px;"></div>
      </div>
      <div class="settings-grid skeleton-grid">
        <div class="skeleton card-skeleton" style="height:320px;"></div>
        <div class="skeleton card-skeleton" style="height:260px;"></div>
      </div>
    </template>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3 class="empty-title">שגיאה בטעינת ההגדרות</h3>
      <p class="empty-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadSettings">נסה שוב</button>
    </div>

    <!-- ── Main Content ────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ הגדרות אולם</h1>
          <p class="page-sub">הגדר את פרטי האולם ויצירת שולחנות</p>
        </div>
        <router-link to="/app/seating" class="btn btn-outline btn-sm">
          🪑 חזור לסידורי הושבה
        </router-link>
      </div>

      <div class="settings-grid">
        <!-- Card 1: Hall config -->
        <div class="settings-card card">
          <div class="card-header">
            <span class="card-icon">🏛️</span>
            <h2 class="card-title">פרטי האולם</h2>
          </div>

          <div class="card-body">
            <div class="form-group">
              <label class="form-label">שם האולם</label>
              <input
                v-model="form.hallName"
                class="form-input"
                placeholder="לדוגמה: אולם הדקל, גן החופה..."
                maxlength="80"
              />
            </div>

            <div class="form-group">
              <label class="form-label">קיבולת כוללת (מספר אורחים)</label>
              <input
                v-model.number="form.totalCapacity"
                type="number"
                class="form-input"
                placeholder="250"
                min="1"
                max="5000"
              />
            </div>

            <p v-if="settingsError" class="form-error">{{ settingsError }}</p>
          </div>

          <div class="card-footer">
            <button
              class="btn btn-primary"
              :disabled="savingSettings"
              @click="saveSettings"
            >
              <span v-if="savingSettings">⏳ שומר...</span>
              <span v-else>💾 שמור הגדרות</span>
            </button>
          </div>
        </div>

        <!-- Card 2: Auto-generate tables -->
        <div class="settings-card card">
          <div class="card-header">
            <span class="card-icon">🪄</span>
            <h2 class="card-title">ייצר שולחנות אוטומטית</h2>
          </div>

          <div class="card-body">
            <div class="alert alert-warning" v-if="existingTablesCount > 0">
              ⚠️ פעולה זו תמחק את <strong>{{ existingTablesCount }}</strong> השולחנות הקיימים
              ותיצור שולחנות חדשים. אורחים שהוקצו יוסרו מהשולחנות.
            </div>

            <div class="form-group">
              <label class="form-label">מספר שולחנות לייצר</label>
              <div class="input-with-stepper">
                <button class="stepper-btn" @click="genForm.count = Math.max(1, genForm.count - 1)">−</button>
                <input
                  v-model.number="genForm.count"
                  type="number"
                  class="form-input stepper-input"
                  min="1"
                  max="100"
                />
                <button class="stepper-btn" @click="genForm.count = Math.min(100, genForm.count + 1)">+</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">מקומות לשולחן</label>
              <div class="input-with-stepper">
                <button class="stepper-btn" @click="genForm.seatsPerTable = Math.max(1, genForm.seatsPerTable - 1)">−</button>
                <input
                  v-model.number="genForm.seatsPerTable"
                  type="number"
                  class="form-input stepper-input"
                  min="1"
                  max="50"
                />
                <button class="stepper-btn" @click="genForm.seatsPerTable = Math.min(50, genForm.seatsPerTable + 1)">+</button>
              </div>
              <p class="field-hint">סך קיבולת: {{ genForm.count * genForm.seatsPerTable }} מקומות</p>
            </div>

            <div class="form-group">
              <label class="form-label">סגנון מספור שולחנות</label>
              <div class="naming-options">
                <label
                  v-for="opt in namingOptions"
                  :key="opt.value"
                  class="naming-option"
                  :class="{ active: genForm.namingStyle === opt.value }"
                >
                  <input
                    type="radio"
                    :value="opt.value"
                    v-model="genForm.namingStyle"
                    class="sr-only"
                  />
                  <span class="naming-icon">{{ opt.icon }}</span>
                  <span class="naming-label">{{ opt.label }}</span>
                  <span class="naming-example">{{ opt.example }}</span>
                </label>
              </div>
            </div>

            <div class="form-group" v-if="genForm.namingStyle === 'custom'">
              <label class="form-label">תחילית שם שולחן</label>
              <input
                v-model="genForm.prefix"
                class="form-input"
                placeholder="לדוגמה: שולחן, T, Table"
                maxlength="20"
              />
              <p class="field-hint">שמות יהיו: {{ genForm.prefix }} 1, {{ genForm.prefix }} 2, ...</p>
            </div>

            <p v-if="genError" class="form-error">{{ genError }}</p>
          </div>

          <div class="card-footer">
            <button
              class="btn btn-primary"
              :disabled="generatingTables"
              @click="generateTables"
            >
              <span v-if="generatingTables">⏳ מייצר...</span>
              <span v-else>🪄 ייצר {{ genForm.count }} שולחנות</span>
            </button>
          </div>
        </div>

        <!-- Card 3: Summary -->
        <div class="settings-card card summary-card" v-if="summary">
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h2 class="card-title">סיכום מצב</h2>
          </div>
          <div class="card-body">
            <div class="summary-stats">
              <div class="summary-stat">
                <span class="stat-num">{{ summary.totalTables }}</span>
                <span class="stat-lbl">שולחנות</span>
              </div>
              <div class="summary-stat">
                <span class="stat-num">{{ summary.totalSeats }}</span>
                <span class="stat-lbl">מקומות</span>
              </div>
              <div class="summary-stat">
                <span class="stat-num">{{ summary.assigned }}</span>
                <span class="stat-lbl">מוקצים</span>
              </div>
              <div class="summary-stat">
                <span class="stat-num stat-num-muted">{{ summary.unassigned }}</span>
                <span class="stat-lbl">ללא שולחן</span>
              </div>
            </div>

            <!-- Occupancy chart -->
            <div class="occupancy-bar-wrap" v-if="summary.totalSeats > 0">
              <div class="occupancy-label">
                <span>תפוסה: {{ Math.round(summary.assigned / summary.totalSeats * 100) }}%</span>
              </div>
              <div class="occupancy-bar">
                <div
                  class="occupancy-fill"
                  :style="{ width: Math.min(100, summary.assigned / summary.totalSeats * 100) + '%' }"
                ></div>
              </div>
            </div>

            <router-link to="/app/seating" class="btn btn-outline btn-sm" style="margin-top:var(--space-4);">
              🪑 פתח מפת הושבה
            </router-link>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Success modal after generate ───────────────────────────────────── -->
    <transition name="modal">
      <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
        <div class="modal-box card" dir="rtl">
          <div class="success-content">
            <div class="success-icon">🎉</div>
            <h3 class="success-title">השולחנות נוצרו בהצלחה!</h3>
            <p class="success-text">{{ lastGenResult?.count }} שולחנות נוצרו ומוכנים לשיוך אורחים</p>
            <div class="success-actions">
              <button class="btn btn-outline" @click="showSuccessModal = false">הישאר כאן</button>
              <router-link to="/app/seating" class="btn btn-primary" @click="showSuccessModal = false">
                🪑 עבור למפת הושבה
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Toast ───────────────────────────────────────────────────────────── -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import axios from 'axios'

// ── State ──────────────────────────────────────────────────────────────────────
const loading  = ref(true)
const error    = ref(null)
const toast    = ref(null)

// Settings form
const form = reactive({ hallName: '', totalCapacity: 250 })
const savingSettings = ref(false)
const settingsError  = ref('')

// Generate form
const genForm = reactive({ count: 10, seatsPerTable: 8, namingStyle: 'numbers', prefix: 'שולחן' })
const generatingTables  = ref(false)
const genError          = ref('')
const showSuccessModal  = ref(false)
const lastGenResult     = ref(null)
const existingTablesCount = ref(0)

// Summary
const summary = ref(null)

const namingOptions = [
  { value: 'numbers', icon: '1️⃣', label: 'מספרים', example: 'שולחן 1, שולחן 2...' },
  { value: 'hebrew',  icon: 'א', label: 'אותיות עבריות', example: 'שולחן א, שולחן ב...' },
  { value: 'custom',  icon: '✏️', label: 'תחילית מותאמת', example: 'T 1, T 2...' }
]

// ── Methods ────────────────────────────────────────────────────────────────────
async function loadSettings() {
  loading.value = true
  error.value   = null

  try {
    const [settingsRes, tablesRes] = await Promise.all([
      axios.get('/api/seating/settings'),
      axios.get('/api/seating/tables')
    ])

    const s = settingsRes.data
    form.hallName      = s.hallName || ''
    form.totalCapacity = s.totalCapacity || 250

    const tables     = tablesRes.data.tables || []
    const unassigned = tablesRes.data.unassigned || []
    existingTablesCount.value = tables.length
    genForm.count = tables.length || 10

    const totalSeats = tables.reduce((sum, t) => sum + (t.seats || 0), 0)
    const assigned   = tables.reduce((sum, t) => sum + (t.guests?.length || 0), 0)

    summary.value = {
      totalTables: tables.length,
      totalSeats,
      assigned,
      unassigned: unassigned.length
    }
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'שגיאה בטעינת ההגדרות'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  settingsError.value = ''
  if (!form.hallName.trim()) {
    settingsError.value = 'שם האולם הוא שדה חובה'
    return
  }

  savingSettings.value = true
  try {
    await axios.put('/api/seating/settings', {
      hallName:      form.hallName,
      totalCapacity: form.totalCapacity
    })
    showToast('הגדרות האולם נשמרו בהצלחה', 'success')
  } catch (e) {
    settingsError.value = e.response?.data?.error || 'שגיאה בשמירה'
    showToast('שגיאה בשמירת ההגדרות', 'error')
  } finally {
    savingSettings.value = false
  }
}

async function generateTables() {
  genError.value = ''

  if (genForm.count < 1) {
    genError.value = 'יש להזין לפחות שולחן אחד'
    return
  }

  if (existingTablesCount.value > 0) {
    const confirmed = confirm(
      `פעולה זו תמחק ${existingTablesCount.value} שולחנות קיימים ותיצור ${genForm.count} שולחנות חדשים. להמשיך?`
    )
    if (!confirmed) return
  }

  generatingTables.value = true
  try {
    const { data } = await axios.post('/api/seating/generate-tables', {
      count:        genForm.count,
      seatsPerTable: genForm.seatsPerTable,
      namingStyle:  genForm.namingStyle,
      prefix:       genForm.prefix
    })

    lastGenResult.value = data
    existingTablesCount.value = data.count
    showSuccessModal.value = true

    // Update summary
    if (summary.value) {
      summary.value.totalTables = data.count
      summary.value.totalSeats  = data.count * genForm.seatsPerTable
      summary.value.assigned    = 0
    }
  } catch (e) {
    genError.value = e.response?.data?.error || 'שגיאה בייצור שולחנות'
    showToast('שגיאה בייצור שולחנות', 'error')
  } finally {
    generatingTables.value = false
  }
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3500)
}

onMounted(loadSettings)
</script>

<style scoped>
.hall-settings { padding: var(--space-8); max-width: 900px; margin: 0 auto; direction: rtl; }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.page-title  { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub    { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Grid */
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
.skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
.card-skeleton { border-radius: var(--radius-lg); }

/* Settings card */
.settings-card { overflow: hidden; }
.summary-card  { grid-column: 1 / -1; }

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}
.card-icon  { font-size: 22px; }
.card-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }

.card-body { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
.card-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; background: var(--color-bg-subtle); }

/* Form elements */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.form-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border-radius: var(--radius);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-subtle);
  font-size: var(--font-size-sm);
  font-family: var(--font);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
  text-align: right;
}
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-error { font-size: var(--font-size-sm); color: var(--color-error); font-weight: 500; }
.field-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px; }

/* Stepper */
.input-with-stepper { display: flex; align-items: center; gap: var(--space-2); }
.stepper-input { flex: 1; text-align: center; }
.stepper-btn {
  width: 36px;
  height: 44px;
  border-radius: var(--radius);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg-subtle);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-navy);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.stepper-btn:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }

/* Naming style */
.naming-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.naming-option {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-3);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-fast);
  text-align: center;
}
.naming-option:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.naming-option.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.naming-icon  { font-size: 22px; }
.naming-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.naming-example { font-size: 11px; color: var(--color-text-muted); }
.sr-only { display: none; }

/* Alert */
.alert { border-radius: var(--radius); padding: var(--space-4); font-size: var(--font-size-sm); line-height: 1.6; }
.alert-warning { background: var(--color-warning-bg); border: 1px solid var(--color-warning); color: #92400e; }

/* Summary stats */
.summary-stats { display: flex; gap: var(--space-8); flex-wrap: wrap; }
.summary-stat  { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num      { font-size: var(--font-size-3xl); font-weight: 900; color: var(--color-primary); line-height: 1; }
.stat-num-muted { color: var(--color-navy-light); }
.stat-lbl      { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 600; }

.occupancy-bar-wrap { margin-top: var(--space-4); }
.occupancy-label    { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); margin-bottom: var(--space-2); }
.occupancy-bar      { height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.occupancy-fill     { height: 100%; background: linear-gradient(90deg, var(--color-primary), #c9177a); border-radius: 4px; transition: width 0.6s ease; }

/* Success modal */
.modal-overlay  { position: fixed; inset: 0; background: var(--color-overlay); z-index: 200; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal-box { width: 100%; max-width: 400px; border-radius: var(--radius-xl); overflow: hidden; }
.success-content { padding: var(--space-8); text-align: center; }
.success-icon   { font-size: 56px; margin-bottom: var(--space-4); }
.success-title  { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-3); }
.success-text   { color: var(--color-text-muted); margin-bottom: var(--space-6); }
.success-actions { display: flex; justify-content: center; gap: var(--space-3); flex-wrap: wrap; }

/* Toast */
.toast { position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; z-index: 1000; box-shadow: var(--shadow-lg); color: #fff; white-space: nowrap; }
.toast.success { background: var(--color-success); }
.toast.error   { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 10px var(--space-5); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none; transition: all var(--transition); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-sm { padding: 6px var(--space-4); font-size: var(--font-size-xs); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

/* Card */
.card { background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); }

/* Skeleton */
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e0e0ea 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius); }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Empty state */
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }
.empty-icon  { font-size: 56px; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-3); }
.empty-text  { color: var(--color-text-muted); margin-bottom: var(--space-6); }

/* Fade-in */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Responsive */
@media (max-width: 768px) {
  .settings-grid { grid-template-columns: 1fr; }
  .summary-card  { grid-column: 1; }
  .naming-options { grid-template-columns: 1fr; }
  .hall-settings { padding: var(--space-4); }
  .summary-stats { gap: var(--space-6); }
}
@media (max-width: 480px) {
  .input-with-stepper .form-input { text-align: center; }
}
</style>
