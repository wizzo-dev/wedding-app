<template>
  <div class="settings-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">הגדרות החתונה ⚙️</h1>
        <p class="page-sub">עדכנו את פרטי האירוע שלכם</p>
      </div>
    </div>

    <!-- Sub-nav -->
    <div class="subnav">
      <router-link to="/app/settings" class="subnav-link" active-class="active" exact>🎉 פרטי החתונה</router-link>
      <router-link to="/app/settings/account" class="subnav-link" active-class="active">🔐 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="subnav-link" active-class="active">👑 מנוי</router-link>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="skeleton-section">
      <div class="skeleton" style="height:24px; width:200px; margin-bottom:32px;"></div>
      <div v-for="n in 5" :key="n" class="skeleton" style="height:48px; margin-bottom:16px; border-radius:10px;"></div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="error-card card card-body">
      <span>⚠️</span>
      <p>{{ loadError }}</p>
      <button class="btn btn-primary" @click="loadProfile">נסה שוב</button>
    </div>

    <!-- Form -->
    <div v-else class="settings-content">

      <!-- Couple Names Section -->
      <section class="settings-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">💑</div>
            <div>
              <h2 class="section-title">שמות הזוג</h2>
              <p class="section-sub">השמות שיופיעו בכרטיסיות ובהזמנות</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">שם החתן / בן זוג ראשון *</label>
              <input v-model="form.name1" type="text" class="form-input" placeholder="לדוגמה: יוסי" maxlength="50" />
              <span v-if="errors.name1" class="form-error">{{ errors.name1 }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">שם הכלה / בן זוג שני *</label>
              <input v-model="form.name2" type="text" class="form-input" placeholder="לדוגמה: שירה" maxlength="50" />
              <span v-if="errors.name2" class="form-error">{{ errors.name2 }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Wedding Date Section -->
      <section class="settings-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">📅</div>
            <div>
              <h2 class="section-title">תאריך החתונה</h2>
              <p class="section-sub">{{ daysUntil }}</p>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">תאריך האירוע</label>
            <input v-model="form.weddingDate" type="date" class="form-input" dir="ltr" style="text-align:left" />
          </div>
        </div>
      </section>

      <!-- Venue Section -->
      <section class="settings-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">🏛️</div>
            <div>
              <h2 class="section-title">מקום האירוע</h2>
              <p class="section-sub">פרטי האולם / הגן</p>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">שם המקום</label>
              <input v-model="form.venue" type="text" class="form-input" placeholder="לדוגמה: גן הוורדים, אולם יוקרה..." maxlength="100" />
            </div>
            <div class="form-group">
              <label class="form-label">כתובת</label>
              <input v-model="form.venueAddress" type="text" class="form-input" placeholder="רחוב, עיר..." maxlength="200" />
            </div>
          </div>
        </div>
      </section>

      <!-- Save button -->
      <div class="save-row">
        <div v-if="saveSuccess" class="success-msg">
          <span>✅</span> הפרטים עודכנו בהצלחה!
        </div>
        <div v-if="saveError" class="error-msg">
          <span>⚠️</span> {{ saveError }}
        </div>
        <button class="btn btn-primary btn-save" :disabled="saving" @click="save">
          <span v-if="saving">שומר...</span>
          <span v-else>💾 שמור שינויים</span>
        </button>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const saving = ref(false)
const loadError = ref(null)
const saveError = ref(null)
const saveSuccess = ref(false)
const errors = ref({})

const form = ref({
  name1: '',
  name2: '',
  weddingDate: '',
  venue: '',
  venueAddress: ''
})

// ── Computed ──────────────────────────────────────────────────────────────────
const daysUntil = computed(() => {
  if (!form.value.weddingDate) return 'טרם נקבע תאריך'
  const target = new Date(form.value.weddingDate)
  const now = new Date()
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `החתונה הייתה לפני ${Math.abs(diff)} ימים`
  if (diff === 0) return '🎊 היום זה קורה!'
  if (diff === 1) return 'מחר!'
  return `עוד ${diff} ימים לחתונה 🎊`
})

// ── API ───────────────────────────────────────────────────────────────────────
async function loadProfile() {
  loading.value = true
  loadError.value = null
  try {
    const res = await api.get('/users/profile')
    const u = res.data
    form.value = {
      name1: u.name1 || '',
      name2: u.name2 || '',
      weddingDate: u.weddingDate ? u.weddingDate.slice(0, 10) : '',
      venue: u.venue || '',
      venueAddress: u.venueAddress || ''
    }
  } catch (e) {
    loadError.value = e.response?.data?.message || 'שגיאה בטעינת הפרטים'
  } finally {
    loading.value = false
  }
}

function validate() {
  errors.value = {}
  if (!form.value.name1.trim()) errors.value.name1 = 'שם חובה'
  if (!form.value.name2.trim()) errors.value.name2 = 'שם חובה'
  return Object.keys(errors.value).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  try {
    await api.put('/users/profile', {
      name1: form.value.name1.trim(),
      name2: form.value.name2.trim(),
      weddingDate: form.value.weddingDate || null,
      venue: form.value.venue.trim() || null,
      venueAddress: form.value.venueAddress.trim() || null
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 4000)
  } catch (e) {
    saveError.value = e.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    saving.value = false
  }
}

onMounted(loadProfile)
</script>
<style scoped>
.settings-view {
  padding: var(--space-6);
  max-width: 700px;
}

/* Header */
.page-header {
  margin-bottom: var(--space-5);
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
}
.page-sub {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-top: 4px;
}

/* Sub-nav */
.subnav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-6);
  overflow-x: auto;
}
.subnav-link {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  text-decoration: none;
}
.subnav-link:hover { color: var(--color-navy); }
.subnav-link.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

/* Settings sections */
.settings-content { display: flex; flex-direction: column; gap: var(--space-5); }

.settings-section {
  transition: box-shadow var(--transition);
}
.settings-section:hover {
  box-shadow: var(--shadow);
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.section-icon {
  font-size: 1.8rem;
  line-height: 1;
  flex-shrink: 0;
}
.section-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-navy);
}
.section-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-navy);
}
.form-input {
  width: 100%;
  padding: 11px var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  text-align: right;
  direction: rtl;
}
.form-input:focus {
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 3px var(--color-primary-light);
}
.form-error {
  font-size: var(--font-size-xs);
  color: var(--color-error);
}

/* Save row */
.save-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-4) 0;
}
.success-msg {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-success);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.error-msg {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 11px var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  font-family: var(--font);
}
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-pink);
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-save { min-width: 160px; justify-content: center; }

/* Skeleton */
.skeleton-section { display: flex; flex-direction: column; gap: var(--space-4); }

/* Error card */
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-muted);
}

@media (max-width: 600px) {
  .settings-view { padding: var(--space-4); }
  .form-grid { grid-template-columns: 1fr; }
  .save-row { flex-direction: column; align-items: stretch; }
  .btn-save { width: 100%; }
}
</style>
