<template>
  <div class="calendar-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">📅 יומן החתונה</h1>
        <p class="page-sub">תכנון פגישות וציוני דרך עד ליום הגדול</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="exportIcs" :disabled="!events.length" title="הורד קובץ .ics לייבוא ביומן">
          ⬇️ ייצא ליומן
        </button>
        <button class="btn btn-primary" @click="openAddModal()">+ הוסף אירוע</button>
      </div>
    </div>

    <!-- Wedding Date Banner -->
    <div v-if="weddingDateFormatted" class="wedding-date-banner">
      <div class="wedding-date-dot">💍</div>
      <div class="wedding-date-info">
        <div class="wedding-date-title">יום החתונה</div>
        <div class="wedding-date-text">{{ weddingDateFormatted }} · {{ weddingTimeFormatted }}</div>
      </div>
      <button class="btn btn-outline btn-sm" @click="jumpToWedding" v-if="weddingDateKey !== '9999-12-31'">
        קפוץ לתאריך
      </button>
    </div>

    <!-- Month navigation -->
    <div class="month-nav">
      <button class="nav-btn" @click="shiftMonth(-1)" title="חודש קודם">›</button>
      <div class="month-title">{{ monthTitle }}</div>
      <button class="nav-btn" @click="shiftMonth(1)" title="חודש הבא">‹</button>
      <button class="btn btn-outline btn-sm today-btn" @click="goToday">היום</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️ {{ error }}</span>
      <button class="btn btn-outline btn-sm" @click="load">נסה שוב</button>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="calendar-grid">
      <div class="weekday-row">
        <div v-for="w in weekdayLabels" :key="w" class="weekday-cell">{{ w }}</div>
      </div>
      <div class="days-grid">
        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="day-cell"
          :class="{
            'other-month': !cell.inMonth,
            'today': cell.isToday,
            'wedding-day': cell.isWedding,
            'has-events': cell.events.length > 0,
            'selected': cell.dateKey === selectedDateKey
          }"
          @click="selectDate(cell)"
        >
          <div class="day-number">{{ cell.day }}</div>
          <div v-if="cell.isWedding" class="day-badge">💍</div>
          <div v-if="cell.events.length" class="day-events">
            <div
              v-for="(e, i) in cell.events.slice(0, 2)"
              :key="e.id"
              class="day-event-dot"
              :title="`${e.time} ${e.title}`"
            >
              <span class="dot-time">{{ e.time }}</span>
              <span class="dot-title">{{ e.title }}</span>
            </div>
            <div v-if="cell.events.length > 2" class="more-events">+{{ cell.events.length - 2 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Detail Panel -->
    <div v-if="selectedDateKey && !loading && !error" class="day-panel card">
      <div class="day-panel-header">
        <div>
          <h3 class="day-panel-title">{{ selectedDayTitle }}</h3>
          <p class="day-panel-sub" v-if="selectedDayEvents.length">{{ selectedDayEvents.length }} אירועים</p>
          <p class="day-panel-sub" v-else>אין אירועים ליום זה</p>
        </div>
        <button class="btn btn-primary btn-sm" @click="openAddModal(selectedDateKey)">+ הוסף</button>
      </div>
      <div v-if="selectedDayEvents.length" class="day-events-list">
        <div
          v-for="event in selectedDayEvents"
          :key="event.id"
          class="day-event-item"
        >
          <div class="event-time-badge">{{ event.time }}</div>
          <div class="event-content">
            <div class="event-title-row">
              <h4 class="event-title">{{ event.title }}</h4>
              <div class="event-actions">
                <a
                  :href="googleCalUrl(event)"
                  target="_blank"
                  rel="noopener"
                  class="icon-btn"
                  title="הוסף ליומן Google"
                >📅</a>
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
            <h3>{{ editEvent ? 'עריכת אירוע' : 'הוספת אירוע' }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">תאריך</label>
              <input v-model="form.date" type="date" class="form-input" dir="ltr" />
              <span class="form-hint">אם לא נבחר, ייחשב כיום החתונה</span>
            </div>
            <div class="form-group">
              <label class="form-label">שעה *</label>
              <input v-model="form.time" type="time" class="form-input" dir="ltr" />
              <span v-if="errors.time" class="form-error">{{ errors.time }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">כותרת *</label>
              <input v-model="form.title" type="text" class="form-input"
                placeholder="לדוגמה: פגישה עם הקייטרינג, חופה, ארוחה..." maxlength="80" />
              <span v-if="errors.title" class="form-error">{{ errors.title }}</span>
            </div>
            <div class="form-group">
              <label class="form-label">תיאור (אופציונלי)</label>
              <textarea v-model="form.description" class="form-input form-textarea" rows="3"
                placeholder="פרטים נוספים..." maxlength="300" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeModal">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveEvent">
              {{ saving ? 'שומר...' : (editEvent ? 'שמור שינויים' : 'הוסף אירוע') }}
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
import { ref, computed, onMounted } from 'vue'
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
const selectedDateKey = ref(null)

// Current month cursor
const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-11

const emptyForm = () => ({ date: '', time: '', title: '', description: '' })
const form = ref(emptyForm())
const errors = ref({})

const weekdayLabels = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']

// Wedding date helpers
const weddingDateKey = computed(() => {
  const wd = auth.user?.weddingDate
  if (!wd) return '9999-12-31'
  try {
    const d = new Date(wd)
    return toKey(d)
  } catch { return '9999-12-31' }
})
const weddingDateFormatted = computed(() => {
  if (!auth.user?.weddingDate) return null
  return new Date(auth.user.weddingDate).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
})
const weddingTimeFormatted = computed(() => auth.user?.weddingTime || '19:00')

// Format yyyy-mm-dd
function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayKey = toKey(new Date())

const monthTitle = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
})

// Events grouped by date key (fallback to wedding date)
const eventsByDate = computed(() => {
  const map = {}
  const fallback = weddingDateKey.value
  for (const e of events.value) {
    const key = e.date || fallback
    if (!map[key]) map[key] = []
    map[key].push(e)
  }
  // Sort each day by time
  Object.values(map).forEach(arr => arr.sort((a, b) => (a.time || '').localeCompare(b.time || '')))
  return map
})

// Build calendar grid: 6 weeks × 7 days
const calendarCells = computed(() => {
  const cells = []
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const firstDow = first.getDay() // 0=Sunday
  // Start from the Sunday on/before the 1st
  const start = new Date(viewYear.value, viewMonth.value, 1 - firstDow)
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = toKey(d)
    cells.push({
      date: d,
      day: d.getDate(),
      dateKey: key,
      inMonth: d.getMonth() === viewMonth.value,
      isToday: key === todayKey,
      isWedding: key === weddingDateKey.value,
      events: eventsByDate.value[key] || []
    })
  }
  return cells
})

const selectedDayEvents = computed(() => {
  if (!selectedDateKey.value) return []
  return eventsByDate.value[selectedDateKey.value] || []
})

const selectedDayTitle = computed(() => {
  if (!selectedDateKey.value) return ''
  try {
    return new Date(selectedDateKey.value + 'T00:00:00').toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return selectedDateKey.value }
})

// ── Navigation ───────────────────────────────────────────────────────────────
function shiftMonth(delta) {
  let m = viewMonth.value + delta
  let y = viewYear.value
  while (m < 0) { m += 12; y -= 1 }
  while (m > 11) { m -= 12; y += 1 }
  viewMonth.value = m
  viewYear.value = y
}
function goToday() {
  const t = new Date()
  viewYear.value = t.getFullYear()
  viewMonth.value = t.getMonth()
  selectedDateKey.value = todayKey
}
function jumpToWedding() {
  if (weddingDateKey.value === '9999-12-31') return
  const [y, m] = weddingDateKey.value.split('-').map(Number)
  viewYear.value = y
  viewMonth.value = m - 1
  selectedDateKey.value = weddingDateKey.value
}
function selectDate(cell) {
  selectedDateKey.value = cell.dateKey
  if (!cell.inMonth) {
    viewYear.value = cell.date.getFullYear()
    viewMonth.value = cell.date.getMonth()
  }
}

// ── API ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/timeline')
    events.value = res.data.events
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת היומן'
  } finally {
    loading.value = false
  }
}

function openAddModal(dateKey = null) {
  editEvent.value = null
  form.value = { ...emptyForm(), date: dateKey || selectedDateKey.value || '' }
  errors.value = {}
  showModal.value = true
}
function openEditModal(evt) {
  editEvent.value = evt
  form.value = {
    date: evt.date || '',
    time: evt.time,
    title: evt.title,
    description: evt.description || ''
  }
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
    }
    closeModal()
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}
function confirmDelete(evt) { deleteTarget.value = evt }
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

// ── Google Calendar / ICS export ─────────────────────────────────────────────
function eventDateKey(e) { return e.date || weddingDateKey.value }

// Build a "YYYYMMDDTHHMMSS" local-time string
function formatIcsLocal(dateKey, time, addMinutes = 0) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = (time || '00:00').split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm, 0)
  dt.setMinutes(dt.getMinutes() + addMinutes)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`
}

function googleCalUrl(event) {
  const key = eventDateKey(event)
  if (key === '9999-12-31') return '#'
  const start = formatIcsLocal(key, event.time, 0)
  const end = formatIcsLocal(key, event.time, 60) // default 1-hour duration
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'אירוע חתונה',
    dates: `${start}/${end}`,
    details: event.description || '',
    ctz: 'Asia/Jerusalem'
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function exportIcs() {
  if (!events.value.length) return
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Yalla Wedding//Calendar//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  for (const e of events.value) {
    const key = eventDateKey(e)
    if (key === '9999-12-31') continue
    const dtstart = formatIcsLocal(key, e.time, 0)
    const dtend = formatIcsLocal(key, e.time, 60)
    lines.push(
      'BEGIN:VEVENT',
      `UID:timeline-${e.id}@yalla-wedding`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=Asia/Jerusalem:${dtstart}`,
      `DTEND;TZID=Asia/Jerusalem:${dtend}`,
      `SUMMARY:${icsEscape(e.title)}`,
      e.description ? `DESCRIPTION:${icsEscape(e.description)}` : null,
      'END:VEVENT'
    )
  }
  lines.push('END:VCALENDAR')

  const content = lines.filter(Boolean).join('\r\n')
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wedding-calendar.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  load()
  selectedDateKey.value = todayKey
})
</script>

<style scoped>
.calendar-view {
  padding: var(--space-6);
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }
.header-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* Wedding date banner */
.wedding-date-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: linear-gradient(135deg, #FFF0F5, #FFE4F0);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
}
.wedding-date-dot { font-size: 2rem; flex-shrink: 0; }
.wedding-date-info { flex: 1; }
.wedding-date-title { font-weight: 800; color: var(--color-primary); font-size: var(--font-size-sm); }
.wedding-date-text { color: var(--color-navy); font-weight: 600; font-size: var(--font-size-base); }

/* Month navigation */
.month-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.nav-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border);
  background: #fff;
  font-size: 20px; font-weight: 700;
  color: var(--color-navy);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.nav-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.month-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); min-width: 180px; text-align: center; }
.today-btn { margin-inline-start: auto; }

/* Calendar grid */
.calendar-grid {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
  margin-bottom: var(--space-5);
}
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
.weekday-cell {
  padding: var(--space-3);
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
}
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.day-cell {
  min-height: 96px;
  padding: 6px;
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  position: relative;
  transition: background var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: var(--color-primary-light, #FFF0F5); }
.day-cell.other-month { background: #fafafa; color: #bbb; }
.day-cell.other-month .day-number { color: #bbb; }
.day-cell.today .day-number { background: var(--color-primary); color: #fff; }
.day-cell.wedding-day { background: linear-gradient(135deg, #FFF0F5, #FFE4F0); }
.day-cell.selected { box-shadow: inset 0 0 0 2px var(--color-primary); }
.day-number {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-navy);
  width: 26px; height: 26px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  align-self: flex-end;
}
.day-badge { position: absolute; top: 4px; left: 6px; font-size: 14px; }
.day-events { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.day-event-dot {
  font-size: 10px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 4px;
  padding: 2px 4px;
  display: flex;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
}
.dot-time { font-weight: 700; flex-shrink: 0; }
.dot-title { overflow: hidden; text-overflow: ellipsis; }
.more-events { font-size: 10px; color: var(--color-text-muted); font-weight: 600; padding: 0 4px; }

/* Day panel */
.day-panel { padding: var(--space-5); margin-bottom: var(--space-5); }
.day-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.day-panel-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.day-panel-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 2px; }
.day-events-list { display: flex; flex-direction: column; gap: var(--space-3); }
.day-event-item {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  background: var(--color-bg);
  border-radius: var(--radius);
}
.event-time-badge {
  flex-shrink: 0;
  background: var(--color-primary);
  color: #fff;
  padding: 6px 12px;
  border-radius: var(--radius);
  font-weight: 800;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  height: fit-content;
}
.event-content { flex: 1; min-width: 0; }
.event-title-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); margin-bottom: 4px; }
.event-title { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.event-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.event-actions { display: flex; gap: 4px; flex-shrink: 0; }
.icon-btn {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background var(--transition-fast);
}
.icon-btn:hover { background: var(--color-border); }
.icon-btn-del:hover { background: #FEE2E2; color: #DC2626; }

/* Loading / Error */
.loading-state { display: flex; justify-content: center; padding: var(--space-8); }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-state { text-align: center; padding: var(--space-6); color: var(--color-error); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(27, 60, 115, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4); backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}
.modal-sm { max-width: 400px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-close {
  background: none; border: none; font-size: 20px;
  cursor: pointer; color: var(--color-text-muted);
  width: 32px; height: 32px; border-radius: 50%;
}
.modal-close:hover { background: var(--color-border); }
.modal-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex; justify-content: flex-end; gap: var(--space-3);
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.form-input {
  padding: 10px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-family: 'Heebo', sans-serif;
  background: var(--color-bg-card);
  color: var(--color-text);
  direction: rtl;
}
.form-input:focus { outline: none; border-color: var(--color-primary); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.form-error { font-size: var(--font-size-xs); color: var(--color-error); }
.muted-text { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: var(--space-2); }

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
  font-family: 'Heebo', sans-serif;
  text-decoration: none;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-ghost { background: transparent; color: var(--color-text-muted); }
.btn-ghost:hover { background: var(--color-bg); }
.btn-danger { background: #DC2626; color: #fff; }
.btn-danger:hover:not(:disabled) { background: #B91C1C; }
.btn-sm { padding: 7px var(--space-4); font-size: var(--font-size-xs); }

.pop-in { animation: popIn 0.2s ease both; }
@keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.fade-in { animation: fadeIn 0.3s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Responsive */
@media (max-width: 640px) {
  .calendar-view { padding: var(--space-4); }
  .day-cell { min-height: 70px; padding: 4px; }
  .day-number { width: 22px; height: 22px; font-size: 11px; }
  .day-event-dot { font-size: 8px; padding: 1px 3px; }
  .dot-time { display: none; }
  .weekday-cell { padding: var(--space-2); font-size: 10px; }
  .month-title { min-width: auto; font-size: var(--font-size-base); }
  .today-btn { margin-inline-start: 0; }
}
</style>
