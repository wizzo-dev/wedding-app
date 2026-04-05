<template>
  <div class="profile-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">הפרופיל שלנו 💍</h1>
      <p class="page-sub">פרטי הזוג, יום החתונה, והמקום</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען פרופיל...</p>
    </div>

    <template v-else>
      <!-- Profile Card -->
      <div class="profile-card card">
        <div class="card-body">
          <!-- Avatar -->
          <div class="avatar-section">
            <div class="avatar-wrap">
              <img
                v-if="form.profileImageUrl"
                :src="form.profileImageUrl"
                class="avatar-img"
                :alt="`${form.name1} & ${form.name2}`"
                @error="form.profileImageUrl = ''"
              />
              <div v-else class="avatar-placeholder">
                {{ initials }}
              </div>
            </div>
            <div class="couple-names">
              {{ form.name1 || '...' }} &amp; {{ form.name2 || '...' }}
            </div>
            <div class="wedding-badge" v-if="form.weddingDate">
              💕 {{ daysUntilWedding }} ימים לחתונה
            </div>
          </div>

          <!-- Info grid -->
          <div class="info-grid" v-if="!editMode">
            <div class="info-item">
              <span class="info-label">👤 שם החתן</span>
              <span class="info-value">{{ form.name1 || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">👰 שם הכלה</span>
              <span class="info-value">{{ form.name2 || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 תאריך החתונה</span>
              <span class="info-value">{{ weddingDateFormatted || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">🏛️ אולם</span>
              <span class="info-value">{{ form.venue || '—' }}</span>
            </div>
            <div class="info-item info-item-wide">
              <span class="info-label">📍 כתובת</span>
              <span class="info-value">{{ form.venueAddress || '—' }}</span>
            </div>
          </div>

          <!-- Edit button -->
          <div class="card-actions" v-if="!editMode">
            <button class="btn btn-primary" @click="startEdit">
              ✏️ עריכת פרופיל
            </button>
          </div>

          <!-- Edit Form -->
          <form v-if="editMode" @submit.prevent="saveProfile" class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">שם החתן</label>
                <input v-model="editForm.name1" class="form-input" placeholder="שם החתן" required />
              </div>
              <div class="form-group">
                <label class="form-label">שם הכלה</label>
                <input v-model="editForm.name2" class="form-input" placeholder="שם הכלה" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">תאריך החתונה</label>
              <input
                v-model="editForm.weddingDate"
                class="form-input"
                type="date"
                dir="ltr"
              />
            </div>

            <div class="form-group">
              <label class="form-label">שם האולם</label>
              <input v-model="editForm.venue" class="form-input" placeholder="שם האולם" />
            </div>

            <div class="form-group">
              <label class="form-label">כתובת האולם</label>
              <input v-model="editForm.venueAddress" class="form-input" placeholder="רחוב, עיר" />
            </div>

            <div class="form-group">
              <label class="form-label">תמונת פרופיל (URL)</label>
              <input
                v-model="editForm.profileImageUrl"
                class="form-input"
                dir="ltr"
                placeholder="https://..."
                type="url"
              />
              <p class="form-hint">הכניסו קישור לתמונה מהאינטרנט</p>
            </div>

            <!-- Preview -->
            <div v-if="editForm.profileImageUrl" class="img-preview-wrap">
              <img
                :src="editForm.profileImageUrl"
                class="img-preview"
                alt="תצוגה מקדימה"
                @error="imgError = true"
                @load="imgError = false"
              />
              <p v-if="imgError" class="form-error">⚠️ לא ניתן לטעון את התמונה</p>
            </div>

            <div v-if="saveSuccess" class="success-alert">✅ הפרופיל עודכן בהצלחה!</div>
            <div v-if="saveError" class="error-alert">⚠️ {{ saveError }}</div>

            <div class="form-actions">
              <button class="btn btn-ghost" type="button" @click="cancelEdit">ביטול</button>
              <button class="btn btn-primary" type="submit" :disabled="saving">
                <span v-if="saving">שומר...</span>
                <span v-else>💾 שמור שינויים</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Logout -->
      <div class="logout-section">
        <button class="btn btn-logout" @click="handleLogout">
          🚪 התנתקות מהמערכת
        </button>
      </div>

      <!-- Wedding countdown -->
      <div class="countdown-card card" v-if="form.weddingDate && daysUntilWedding >= 0">
        <div class="card-body countdown-body">
          <div class="countdown-number">{{ daysUntilWedding }}</div>
          <div class="countdown-label">ימים לחתונה</div>
          <div class="countdown-date">{{ weddingDateFormatted }}</div>
          <div v-if="form.venue" class="countdown-venue">🏛️ {{ form.venue }}</div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/composables/useApi'

const router = useRouter()

const auth = useAuthStore()
const loading = ref(true)
const editMode = ref(false)
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(null)
const imgError = ref(false)

const form = ref({
  name1: '',
  name2: '',
  weddingDate: '',
  venue: '',
  venueAddress: '',
  profileImageUrl: '',
  plan: 'free'
})

const editForm = ref({ ...form.value })

const initials = computed(() => {
  const n1 = form.value.name1?.[0] || ''
  const n2 = form.value.name2?.[0] || ''
  return (n1 + n2).toUpperCase() || '💍'
})

const weddingDateFormatted = computed(() => {
  if (!form.value.weddingDate) return ''
  const d = new Date(form.value.weddingDate)
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
})

const daysUntilWedding = computed(() => {
  if (!form.value.weddingDate) return null
  const diff = new Date(form.value.weddingDate) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

async function loadProfile() {
  loading.value = true
  try {
    const res = await api.get('/users/profile')
    const d = res.data
    form.value = {
      name1: d.name1 || '',
      name2: d.name2 || '',
      weddingDate: d.weddingDate ? d.weddingDate.split('T')[0] : '',
      venue: d.venue || '',
      venueAddress: d.venueAddress || '',
      profileImageUrl: d.profileImageUrl || '',
      plan: d.plan || 'free'
    }
  } catch {
    // fallback to auth store
    if (auth.user) {
      form.value = {
        name1: auth.user.name1 || '',
        name2: auth.user.name2 || '',
        weddingDate: auth.user.weddingDate ? auth.user.weddingDate.split('T')[0] : '',
        venue: auth.user.venue || '',
        venueAddress: auth.user.venueAddress || '',
        profileImageUrl: auth.user.profileImageUrl || '',
        plan: auth.user.plan || 'free'
      }
    }
  } finally {
    loading.value = false
  }
}

function startEdit() {
  editForm.value = { ...form.value }
  imgError.value = false
  saveSuccess.value = false
  saveError.value = null
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
}

async function saveProfile() {
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  try {
    const res = await api.patch('/users/profile', {
      name1: editForm.value.name1,
      name2: editForm.value.name2,
      weddingDate: editForm.value.weddingDate || null,
      venue: editForm.value.venue,
      venueAddress: editForm.value.venueAddress,
      profileImageUrl: editForm.value.profileImageUrl
    })
    form.value = { ...form.value, ...res.data }
    // Sync auth store
    if (auth.user) {
      auth.user.name1 = res.data.name1
      auth.user.name2 = res.data.name2
      auth.user.weddingDate = res.data.weddingDate
      auth.user.venue = res.data.venue
      auth.user.venueAddress = res.data.venueAddress
      auth.user.profileImageUrl = res.data.profileImageUrl
    }
    saveSuccess.value = true
    editMode.value = false
    setTimeout(() => { saveSuccess.value = false }, 4000)
  } catch (e) {
    saveError.value = e.response?.data?.message || 'שגיאה בשמירת הפרופיל'
  } finally {
    saving.value = false
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(loadProfile)
</script>

<style scoped>
.profile-view {
  padding: var(--space-6);
  max-width: 700px;
}

.page-header { margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Loading */
.loading-state {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  padding: var(--space-12); color: var(--color-text-muted);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Profile Card */
.profile-card { margin-bottom: var(--space-5); }

/* Avatar */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.avatar-wrap {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary), #ff6b9d);
  border: 3px solid var(--color-primary-light);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
}
.couple-names {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  text-align: center;
}
.wedding-badge {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 4px 14px;
  border-radius: var(--radius-full);
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
}
.info-item-wide { grid-column: 1 / -1; }
.info-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.info-value {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-navy);
}

.card-actions { display: flex; justify-content: center; }

/* Edit Form */
.edit-form { display: flex; flex-direction: column; gap: var(--space-4); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
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
  transition: border-color var(--transition-fast);
  text-align: right;
}
.form-input:focus {
  border-color: var(--color-primary);
  border: 2px solid var(--color-primary);
}
.form-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }
.form-error { font-size: var(--font-size-xs); color: var(--color-error); }

.img-preview-wrap { margin-top: var(--space-2); }
.img-preview {
  max-width: 200px;
  max-height: 200px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

/* Alerts */
.success-alert {
  padding: var(--space-3) var(--space-4);
  background: var(--color-success-bg);
  border: 1px solid var(--color-success);
  border-radius: var(--radius);
  color: #16a34a;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.error-alert {
  padding: var(--space-3) var(--space-4);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

/* Countdown */
.countdown-card { text-align: center; }
.countdown-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-8) !important;
}
.countdown-number {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--color-primary), #ff6b9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}
.countdown-label {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-navy);
}
.countdown-date {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
}
.countdown-venue {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 11px var(--space-6); border-radius: var(--radius-full);
  font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none;
  transition: all var(--transition); font-family: var(--font); white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--color-text-muted); border: 1.5px solid var(--color-border); }
.btn-ghost:hover { background: var(--color-bg-subtle); }

/* Logout */
.logout-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-5);
}
.btn-logout {
  background: transparent;
  color: var(--color-error, #EF4444);
  border: 1.5px solid var(--color-error, #EF4444);
  padding: 11px var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font);
  transition: all var(--transition);
}
.btn-logout:hover {
  background: var(--color-error, #EF4444);
  color: #fff;
}

@media (max-width: 600px) {
  .profile-view { padding: var(--space-4); }
  .info-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
