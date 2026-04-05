<template>
  <div class="timeline-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">לוח יום האירוע 💍</h1>
        <p class="page-sub">סדר יום מסודר לחתונה שלכם</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        + הוסף אירוע
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="timeline-skeleton">
      <div v-for="n in 5" :key="n" class="skeleton-event">
        <div class="skeleton skel-time"></div>
        <div class="skel-content">
          <div class="skeleton skel-title"></div>
          <div class="skeleton skel-desc"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="events.length === 0" class="empty-state">
      <div class="empty-icon">🕐</div>
      <h3>טרם נוצרו אירועים</h3>
      <p>בנו את סדר היום המושלם לחתונה שלכם — מהגעת אורחים ועד הריקוד האחרון</p>
      <button class="btn btn-primary" @click="openAddModal">+ הוסף אירוע ראשון</button>
    </div>

    <!-- Wedding Date Banner -->
    <div v-if="weddingDateFormatted && !loading && !error" class="wedding-date-banner">
      <div class="wedding-date-dot">💍</div>
      <div class="wedding-date-info">
        <div class="wedding-date-title">יום החתונה</div>
        <div class="wedding-date-text">{{ weddingDateFormatted }} · {{ weddingTimeFormatted }}</div>
      </div>
    </div>

    <!-- Timeline -->
    <div v-if="!loading && !error && events.length > 0" class="timeline-container">
      <div class="timeline-line"></div>
      <div
        v-for="(event, idx) in events"
        :key="event.id"
        class="timeline-event fade-in-up"
        :style="{ animationDelay: `${idx * 60}ms` }"
      >
        <div class="event-time-col">
          <div class="event-time">{{ formatTime(event.time) }}</div>
        </div>
        <div class="event-dot"></div>
        <div class="event-card card">
          <div class="card-body event-card-body">
            <div class="event-top">
              <h3 class="event-title">{{ event.title }}</h3>
              <div class="event-actions">
                <button class="icon-btn" @click="openEditModal(event)" title="ערוך">✏️</button>
                <button class="icon-btn icon-btn-del" @click="confirmDelete(event)" title="מחק">🗑️</button>
              </div>
            </div>
            <p v-if="event.description" class="event-desc">{{ event.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <teleport to="body">

      <!-- Add / Edit Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>{{ editEvent ? 'עריכת אירוע' : 'הוסף אירוע' }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">שעה *</label>
              <input
                v-model="form.time"
                type="time"
                class="form-input"
                dir="ltr"
              />
              <span v-if="errors.time" class="form-error">{{ errors.time }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">כותרת *</label>
              <input
                v-model="form.title"
                type="text"
                class="form-input"
                placeholder="לדוגמה: קבלת פנים, חופה, ארוחה..."
                maxlength="80"
              />
              <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">תיאור (אופציונלי)</label>
              <textarea
                v-model="form.description"
                class="form-input form-textarea"
                rows="3"
                placeholder="פרטים נוספים על האירוע..."
                maxlength="300"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveEvent">
              <span v-if="saving">שומר...</span>
              <span v-else>{{ editEvent ? 'שמור שינויים' : 'הוסף אירוע' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm Delete -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal modal-sm pop-in" dir="rtl">
          <div class="modal-header">
            <h3>מחיקת אירוע</h3>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <div class="modal-body">
            <p>האם למחוק את האירוע <strong>{{ deleteTarget.title }}</strong>?</p>
            <p class="muted-text">פעולה זו אינה ניתנת לביטול.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="deleteTarget = null">ביטול</button>
            <button class="btn btn-danger" :disabled="saving" @click="deleteEvent">
              {{ saving ? 'מוחק...' : 'מחק' }}
            </button>
          </div>
        </div>
      </div>

    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const events = ref([])
const showModal = ref(false)
const editEvent = ref(null)
const deleteTarget = ref(null)

const emptyForm = () => ({ time: '', title: '', description: '' })
const form = ref(emptyForm())
const errors = ref({})

// ── API ───────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/timeline')
    events.value = res.data.events
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת הלוח'
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editEvent.value = null
  form.value = emptyForm()
  errors.value = {}
  showModal.value = true
}

function openEditModal(evt) {
  editEvent.value = evt
  form.value = { time: evt.time, title: evt.title, description: evt.description || '' }
  errors.value = {}
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editEvent.value = null
}

function validate() {
  errors.value = {}
  if (!form.value.time) errors.value.time = 'שדה חובה'
  if (!form.value.title.trim()) errors.value.title = 'שדה חובה'
  return Object.keys(errors.value).length === 0
}

async function saveEvent() {
  if (!validate()) return
  saving.value = true
  try {
    if (editEvent.value) {
      const res = await api.put(`/timeline/${editEvent.value.id}`, form.value)
      const idx = events.value.findIndex(e => e.id === editEvent.value.id)
      if (idx !== -1) events.value[idx] = res.data
    } else {
      const res = await api.post('/timeline', form.value)
      events.value.push(res.data)
      // Re-sort
      events.value.sort((a, b) => a.time.localeCompare(b.time))
    }
    closeModal()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

function confirmDelete(evt) {
  deleteTarget.value = evt
}

async function deleteEvent() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await api.delete(`/timeline/${deleteTarget.value.id}`)
    events.value = events.value.filter(e => e.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה במחיקה')
  } finally {
    saving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(t) {
  if (!t) return ''
  // t is HH:MM
  return t
}

// Wedding date banner
const weddingDateFormatted = ref(null)
const weddingTimeFormatted = ref(null)

function initWeddingDate() {
  if (auth.user?.weddingDate) {
    const d = new Date(auth.user.weddingDate)
    weddingDateFormatted.value = d.toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
    weddingTimeFormatted.value = auth.user.weddingTime || '19:00'
  }
}

onMounted(() => {
  load()
  initWeddingDate()
})
</script>

<style scoped>
.timeline-view {
  padding: var(--space-6);
  max-width: 800px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-8);
  gap: var(--space-4);
  flex-wrap: wrap;
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

/* Wedding Date Banner */
.wedding-date-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: linear-gradient(135deg, #FFF0F5, #FFE4F0);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-pink);
}
.wedding-date-dot {
  font-size: 2rem;
  flex-shrink: 0;
}
.wedding-date-title {
  font-size: var(--font-size-base);
  font-weight: 800;
  color: var(--color-primary);
}
.wedding-date-text {
  font-size: var(--font-size-sm);
  color: var(--color-navy);
  font-weight: 600;
}

/* Timeline layout */
.timeline-container {
  position: relative;
  padding-right: 80px;
}

.timeline-line {
  position: absolute;
  right: 68px;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: linear-gradient(to bottom, var(--color-primary), var(--color-navy));
  border-radius: var(--radius-full);
  opacity: 0.2;
}

.timeline-event {
  display: grid;
  grid-template-columns: 72px 16px 1fr;
  align-items: flex-start;
  gap: 0 var(--space-4);
  margin-bottom: var(--space-5);
}

.event-time-col {
  text-align: left;
  padding-top: 14px;
}

.event-time {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  direction: ltr;
  display: inline-block;
}

.event-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px var(--color-primary), var(--shadow-pink);
  margin-top: 14px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.event-card {
  transition: transform var(--transition);
}
.event-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.event-card-body {
  padding: var(--space-4) var(--space-5);
}

.event-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.event-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1.4;
}

.event-desc {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-top: var(--space-2);
  line-height: 1.6;
}

.event-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  padding: 5px 7px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
  display: inline-flex;
  align-items: center;
}
.icon-btn:hover { background: var(--color-bg-subtle); }
.icon-btn-del:hover { background: var(--color-error-bg); }

/* Skeleton */
.timeline-skeleton { padding-right: 80px; }
.skeleton-event {
  display: grid;
  grid-template-columns: 72px 16px 1fr;
  gap: 0 var(--space-4);
  margin-bottom: var(--space-5);
  align-items: flex-start;
}
.skel-time { width: 50px; height: 18px; margin-top: 14px; }
.skel-content { padding: var(--space-4) var(--space-5); background: var(--color-bg-card); border-radius: var(--radius-xl); border: 1px solid var(--color-border); }
.skel-title { height: 18px; width: 60%; margin-bottom: var(--space-2); }
.skel-desc { height: 14px; width: 85%; }

/* Empty */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-8);
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}
.empty-state h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}
.empty-state p {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  max-width: 380px;
  margin: 0 auto var(--space-6);
  line-height: 1.7;
}

/* Error */
.error-state {
  text-align: center;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-5);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  font-family: var(--font);
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--color-text-muted); }
.btn-ghost:hover { background: var(--color-bg-subtle); }
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
}
.modal-sm { max-width: 380px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}
.modal-header h3 {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-navy);
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.modal-close:hover { background: var(--color-bg-subtle); }
.modal-body { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.form-group { display: flex; flex-direction: column; gap: var(--space-1); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-sm);
  background: var(--color-bg);
  color: var(--color-navy);
  outline: none;
  transition: border-color var(--transition-fast);
  text-align: right;
}
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-textarea { resize: vertical; min-height: 70px; }
.form-error { font-size: var(--font-size-xs); color: var(--color-error); }

.muted-text { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: var(--space-2); }

@media (max-width: 600px) {
  .timeline-view { padding: var(--space-4); }
  .timeline-container { padding-right: 60px; }
  .timeline-line { right: 50px; }
  .timeline-event { grid-template-columns: 52px 14px 1fr; }
  .event-time { font-size: var(--font-size-xs); }
  .page-header { flex-direction: column; }
}
</style>
