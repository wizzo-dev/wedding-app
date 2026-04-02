<template>
  <div class="wa-send fade-in" dir="rtl">
    <!-- ── Loading skeleton ─────────────────────────────────────────── -->
    <div v-if="loading" class="send-loading">
      <div class="skeleton sk-header"></div>
      <div class="skeleton-row">
        <div class="skeleton sk-form"></div>
        <div class="skeleton sk-side"></div>
      </div>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הנתונים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadData">נסה שוב</button>
    </div>

    <!-- ── Main content ──────────────────────────────────────────────── -->
    <template v-else>
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🚀 שליחת הודעות WhatsApp</h1>
          <p class="page-sub">בחר אורחים, תבנית והודעה — שלח בלחיצה אחת</p>
        </div>
        <router-link to="/app/whatsapp/connect" class="btn btn-outline btn-sm">
          💬 סטטוס חיבור
        </router-link>
      </div>

      <!-- ── Send form + preview ───────────────────────────────────── -->
      <div class="send-layout">

        <!-- Left: form -->
        <div class="send-form">

          <!-- Step 1: Filters + Guest selector -->
          <div class="card form-section">
            <div class="section-header">
              <span class="step-badge">1</span>
              <h2 class="section-title">בחר אורחים</h2>
              <span class="selected-count" v-if="selectedGuests.length">
                {{ selectedGuests.length }} נבחרו
              </span>
            </div>

            <!-- Filters -->
            <div class="filters-row">
              <input
                v-model="guestSearch"
                class="form-input filter-input"
                placeholder="🔍 חיפוש לפי שם / טלפון"
                @input="filterGuests"
              />
              <select v-model="filterStatus" class="form-input filter-select" @change="filterGuests">
                <option value="">כל הסטטוסים</option>
                <option value="pending">ממתים ⏳</option>
                <option value="confirmed">מאושרים ✅</option>
                <option value="declined">לא מגיעים ❌</option>
              </select>
              <select v-model="filterSide" class="form-input filter-select" @change="filterGuests">
                <option value="">כל הצדדים</option>
                <option value="חתן">חתן</option>
                <option value="כלה">כלה</option>
                <option value="משותף">משותף</option>
              </select>
            </div>

            <!-- Guest list -->
            <div class="guest-list-wrap">
              <div class="guest-list-toolbar">
                <button class="link-btn" @click="selectAll" :disabled="filteredGuests.length === 0">
                  בחר הכל ({{ filteredGuests.length }})
                </button>
                <button class="link-btn link-btn-danger" @click="clearSelection" v-if="selectedGuests.length">
                  נקה בחירה
                </button>
              </div>

              <!-- Empty -->
              <div v-if="filteredGuests.length === 0" class="guest-empty">
                <p v-if="guests.length === 0">
                  אין אורחים עדיין —
                  <router-link to="/app/guests" class="link-primary">הוסף אורחים</router-link>
                </p>
                <p v-else>לא נמצאו תוצאות לחיפוש</p>
              </div>

              <div v-else class="guest-list">
                <div
                  v-for="g in filteredGuests"
                  :key="g.id"
                  class="guest-item"
                  :class="{ 'guest-selected': isSelected(g.id), 'no-phone': !g.phone }"
                  @click="toggleGuest(g)"
                >
                  <div class="guest-checkbox">
                    <span v-if="isSelected(g.id)">☑️</span>
                    <span v-else>☐</span>
                  </div>
                  <div class="guest-info">
                    <span class="guest-name">{{ g.name }}</span>
                    <span class="guest-phone" v-if="g.phone">{{ g.phone }}</span>
                    <span class="guest-no-phone" v-else>אין טלפון</span>
                  </div>
                  <div class="guest-meta">
                    <span class="badge badge-sm" :class="rsvpBadgeClass(g.rsvpStatus)">{{ rsvpLabel(g.rsvpStatus) }}</span>
                    <span class="guest-side">{{ g.side }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Template -->
          <div class="card form-section">
            <div class="section-header">
              <span class="step-badge">2</span>
              <h2 class="section-title">בחר תבנית</h2>
            </div>

            <div v-if="templates.length === 0" class="template-empty">
              <p>אין תבניות עדיין.</p>
              <router-link to="/app/whatsapp/templates" class="btn btn-outline btn-sm">צור תבנית</router-link>
            </div>

            <div v-else>
              <select v-model="selectedTemplateId" class="form-input" @change="onTemplateChange">
                <option value="">-- הודעה מותאמת אישית --</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ typeLabel(t.type) }})
                </option>
              </select>

              <!-- Custom message when no template -->
              <div v-if="!selectedTemplateId" class="custom-msg-wrap">
                <label class="form-label" style="margin-top: var(--space-3);">הודעה מותאמת:</label>
                <textarea
                  v-model="customMessage"
                  class="form-textarea"
                  rows="4"
                  placeholder="הקלד את ההודעה שלך... (ניתן להשתמש ב-{שם_אורח})"
                  maxlength="1000"
                ></textarea>
                <div class="char-counter">{{ customMessage.length }} / 1000</div>
              </div>
            </div>
          </div>

          <!-- Send button -->
          <button
            class="btn btn-primary btn-send"
            @click="sendMessages"
            :disabled="sending || selectedGuests.length === 0 || (!selectedTemplateId && !customMessage.trim())"
          >
            <span v-if="sending">שולח... {{ sendProgress }}%</span>
            <span v-else>שלח ל-{{ selectedGuests.length }} אורחים 📤</span>
          </button>

          <!-- Progress bar -->
          <div v-if="sending" class="progress-wrap">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: sendProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ sendProgress }}% הושלם</span>
          </div>
        </div>

        <!-- Right: preview + history -->
        <div class="send-side">
          <!-- Message preview -->
          <div class="card preview-card">
            <div class="preview-head">
              <h3 class="preview-title">👁️ תצוגה מקדימה</h3>
              <span class="preview-sub" v-if="firstSelectedGuest">
                עבור {{ firstSelectedGuest.name }}
              </span>
            </div>

            <div v-if="!previewMessage" class="preview-empty">
              <p>בחר תבנית או הקלד הודעה לצפייה</p>
            </div>

            <div v-else class="wa-phone-mock">
              <div class="wa-header">
                <div class="wa-avatar">💍</div>
                <div class="wa-contact">
                  <div class="wa-name">{{ firstSelectedGuest?.name || 'אורח' }}</div>
                  <div class="wa-sub">WhatsApp Business</div>
                </div>
              </div>
              <div class="wa-messages">
                <div class="wa-bubble">
                  <p class="wa-text">{{ previewMessage }}</p>
                  <span class="wa-time">{{ nowTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Send results (shown after send) -->
          <div v-if="sendResults" class="card results-card">
            <div class="results-head">
              <h3 class="results-title">📊 תוצאות שליחה</h3>
              <div class="results-summary">
                <span class="res-stat res-sent">✅ {{ sendResults.sent }} נשלחו</span>
                <span class="res-stat res-failed" v-if="sendResults.failed > 0">❌ {{ sendResults.failed }} נכשלו</span>
              </div>
            </div>
            <div class="results-table-wrap">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in sendResults.results" :key="r.guestId">
                    <td>{{ r.guestName }}</td>
                    <td>{{ r.phone }}</td>
                    <td>
                      <span class="badge badge-sm" :class="r.status === 'sent' ? 'badge-success' : 'badge-error'">
                        {{ r.status === 'sent' ? '✅ נשלח' : '❌ נכשל' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── History ────────────────────────────────────────────────── -->
      <div class="history-section">
        <div class="history-header">
          <h2 class="history-title">📋 שליחות אחרונות</h2>
          <button class="link-btn" @click="loadHistory">רענן</button>
        </div>

        <div v-if="historyLoading" class="skeleton sk-history"></div>

        <div v-else-if="history.length === 0" class="history-empty card">
          <p class="text-muted">עדיין לא בוצעו שליחות. שלח הודעות לאורחים שלך!</p>
        </div>

        <div v-else class="history-list">
          <div
            v-for="batch in history"
            :key="batch.id"
            class="history-item card"
            @click="toggleHistoryItem(batch.id)"
          >
            <div class="history-item-header">
              <div class="history-item-meta">
                <span class="history-template">{{ batch.templateName }}</span>
                <span class="badge badge-sm" :class="typeBadgeClass(batch.templateType)">{{ typeLabel(batch.templateType) }}</span>
                <span class="history-time">{{ formatDate(batch.sentAt) }}</span>
              </div>
              <div class="history-stats">
                <span class="hs-stat hs-total">{{ batch.total }} אורחים</span>
                <span class="hs-stat hs-sent">✅ {{ batch.sent }}</span>
                <span class="hs-stat hs-fail" v-if="batch.failed > 0">❌ {{ batch.failed }}</span>
                <span class="history-chevron">{{ expandedBatch === batch.id ? '▲' : '▼' }}</span>
              </div>
            </div>

            <!-- Expanded results -->
            <div v-if="expandedBatch === batch.id && batch.results?.length" class="history-details">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in batch.results" :key="r.guestId">
                    <td>{{ r.guestName }}</td>
                    <td>{{ r.phone }}</td>
                    <td>
                      <span class="badge badge-sm" :class="r.status === 'sent' ? 'badge-success' : 'badge-error'">
                        {{ r.status === 'sent' ? '✅ נשלח' : '❌ נכשל' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref('')
const guests = ref([])
const filteredGuests = ref([])
const templates = ref([])
const history = ref([])
const historyLoading = ref(false)
const sending = ref(false)
const sendProgress = ref(0)
const sendResults = ref(null)
const expandedBatch = ref(null)

// Filters
const guestSearch = ref('')
const filterStatus = ref('')
const filterSide = ref('')

// Selection
const selectedGuests = ref([]) // array of guest ids

// Template / message
const selectedTemplateId = ref('')
const customMessage = ref('')

const nowTime = computed(() => {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
})

const firstSelectedGuest = computed(() => {
  if (selectedGuests.value.length === 0) return null
  return guests.value.find(g => g.id === selectedGuests.value[0]) || null
})

const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  return templates.value.find(t => t.id === Number(selectedTemplateId.value)) || null
})

const previewMessage = computed(() => {
  const tmpl = selectedTemplate.value?.content || customMessage.value
  if (!tmpl) return ''
  const g = firstSelectedGuest.value
  if (!g) return tmpl
  return tmpl
    .replace(/\{שם_אורח\}/g, g.name)
    .replace(/\{תאריך_חתונה\}/g, '12/06/2026')
    .replace(/\{קישור_RSVP\}/g, `https://yalla.wedding/rsvp/${g.id}`)
    .replace(/\{שם_מקום\}/g, 'אולם הרקפות')
    .replace(/\{שם_זוג\}/g, 'דנה ויוסי')
})

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [guestsRes, templatesRes] = await Promise.all([
      api.get('/guests'),
      api.get('/whatsapp/templates')
    ])
    guests.value = guestsRes.data.guests || guestsRes.data || []
    templates.value = templatesRes.data || []
    filteredGuests.value = guests.value
    await loadHistory()
  } catch (err) {
    error.value = err?.response?.data?.error || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const res = await api.get('/whatsapp/history')
    history.value = (res.data || []).slice(0, 5)
  } catch {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

function filterGuests() {
  const search = guestSearch.value.toLowerCase()
  filteredGuests.value = guests.value.filter(g => {
    const matchSearch = !search ||
      g.name.toLowerCase().includes(search) ||
      (g.phone || '').includes(search)
    const matchStatus = !filterStatus.value || g.rsvpStatus === filterStatus.value
    const matchSide = !filterSide.value || g.side === filterSide.value
    return matchSearch && matchStatus && matchSide
  })
}

function isSelected(id) { return selectedGuests.value.includes(id) }

function toggleGuest(g) {
  if (isSelected(g.id)) {
    selectedGuests.value = selectedGuests.value.filter(id => id !== g.id)
  } else {
    selectedGuests.value.push(g.id)
  }
}

function selectAll() {
  const ids = filteredGuests.value.map(g => g.id)
  const newIds = ids.filter(id => !selectedGuests.value.includes(id))
  selectedGuests.value.push(...newIds)
}

function clearSelection() { selectedGuests.value = [] }

function onTemplateChange() {
  customMessage.value = ''
}

async function sendMessages() {
  if (selectedGuests.value.length === 0) return
  if (!selectedTemplateId.value && !customMessage.value.trim()) return

  sending.value = true
  sendProgress.value = 0
  sendResults.value = null

  // Simulate progress
  const progressInterval = setInterval(() => {
    if (sendProgress.value < 90) sendProgress.value += 10
  }, 200)

  try {
    const payload = {
      guestIds: selectedGuests.value,
      templateId: selectedTemplateId.value ? Number(selectedTemplateId.value) : null,
      message: customMessage.value || selectedTemplate.value?.content || ''
    }
    const res = await api.post('/whatsapp/send', payload)
    sendProgress.value = 100
    sendResults.value = res.data
    await loadHistory()
    // Clear selection after send
    selectedGuests.value = []
  } catch (err) {
    alert(err?.response?.data?.error || 'שגיאה בשליחת ההודעות')
  } finally {
    clearInterval(progressInterval)
    sending.value = false
    setTimeout(() => { sendProgress.value = 0 }, 2000)
  }
}

function toggleHistoryItem(id) {
  expandedBatch.value = expandedBatch.value === id ? null : id
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function rsvpBadgeClass(status) {
  const map = { confirmed: 'badge-success', declined: 'badge-error', pending: 'badge-neutral' }
  return map[status] || 'badge-neutral'
}

function rsvpLabel(status) {
  const map = { confirmed: 'מגיע', declined: 'לא מגיע', pending: 'ממתין' }
  return map[status] || status
}

function typeLabel(type) {
  const map = { rsvp_invite: 'RSVP', reminder: 'תזכורת', thank_you: 'תודה', custom: 'מותאם' }
  return map[type] || type
}

function typeBadgeClass(type) {
  const map = { rsvp_invite: 'badge-primary', reminder: 'badge-warning', thank_you: 'badge-success', custom: 'badge-neutral' }
  return map[type] || 'badge-neutral'
}
</script>

<style scoped>
.wa-send {
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
}

/* ── Loading ─────────────────────────────────────────────── */
.send-loading { display: flex; flex-direction: column; gap: var(--space-5); }
.sk-header { height: 60px; border-radius: var(--radius-lg); }
.skeleton-row { display: grid; grid-template-columns: 1fr 380px; gap: var(--space-5); }
.sk-form  { height: 500px; border-radius: var(--radius-xl); }
.sk-side  { height: 400px; border-radius: var(--radius-xl); }
.sk-history { height: 120px; border-radius: var(--radius-xl); margin-top: var(--space-3); }

/* ── Page header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub   { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.page-header .btn { text-decoration: none; }

/* ── Send layout ─────────────────────────────────────────── */
.send-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-5);
  align-items: start;
  margin-bottom: var(--space-6);
}

/* ── Form sections ───────────────────────────────────────── */
.send-form { display: flex; flex-direction: column; gap: var(--space-4); }
.form-section { padding: var(--space-5); }

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.step-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); flex: 1; }
.selected-count {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px var(--space-3);
  border-radius: var(--radius-full);
}

/* Filters */
.filters-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.filter-input, .filter-select { font-size: var(--font-size-sm); }

/* Guest list */
.guest-list-wrap {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.guest-list-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 1;
}
.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
}
.link-btn:disabled { opacity: 0.4; cursor: default; }
.link-btn-danger { color: var(--color-error); }
.link-primary { color: var(--color-primary); font-weight: 600; }

.guest-empty { padding: var(--space-6); text-align: center; color: var(--color-text-muted); font-size: var(--font-size-sm); }

.guest-list { }
.guest-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background var(--transition-fast);
  border-bottom: 1px solid var(--color-border);
}
.guest-item:last-child { border-bottom: none; }
.guest-item:hover { background: var(--color-bg-subtle); }
.guest-selected { background: var(--color-primary-bg) !important; }
.no-phone { opacity: 0.6; }
.guest-checkbox { font-size: 1.1rem; width: 20px; }
.guest-info { flex: 1; }
.guest-name   { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); display: block; }
.guest-phone  { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; }
.guest-no-phone { font-size: var(--font-size-xs); color: var(--color-error); display: block; }
.guest-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.guest-side { font-size: var(--font-size-xs); color: var(--color-text-light); }

/* Template section */
.template-empty { display: flex; align-items: center; gap: var(--space-3); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.custom-msg-wrap { margin-top: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
.char-counter { font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: left; }

/* Send button */
.btn-send {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-lg);
  font-weight: 800;
}

/* Progress */
.progress-wrap { display: flex; align-items: center; gap: var(--space-4); }
.progress-bar {
  flex: 1;
  height: 10px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-full);
  transition: width 0.2s ease;
}
.progress-text { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); min-width: 4ch; }

/* ── Side panel ──────────────────────────────────────────── */
.send-side { display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: var(--space-4); }

/* Preview card */
.preview-card { overflow: hidden; }
.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.preview-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); }
.preview-sub   { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.preview-empty { padding: var(--space-8); text-align: center; color: var(--color-text-muted); font-size: var(--font-size-sm); }

/* WA mock */
.wa-phone-mock { background: #e5ddd5; border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden; }
.wa-header { background: #075e54; padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3); }
.wa-avatar { width: 32px; height: 32px; background: #128c7e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
.wa-name { font-size: var(--font-size-sm); font-weight: 700; color: #fff; }
.wa-sub  { font-size: var(--font-size-xs); color: rgba(255,255,255,0.7); }
.wa-messages { padding: var(--space-4); }
.wa-bubble {
  background: #fff;
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  max-width: 90%;
  box-shadow: var(--shadow-xs);
}
.wa-text { font-size: var(--font-size-sm); color: #1A1A1A; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.wa-time { font-size: 10px; color: #999; display: block; text-align: left; margin-top: var(--space-1); }

/* Results card */
.results-card { overflow: hidden; }
.results-head { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border); }
.results-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-2); }
.results-summary { display: flex; gap: var(--space-4); }
.res-stat { font-size: var(--font-size-sm); font-weight: 700; }
.res-sent { color: var(--color-success); }
.res-failed { color: var(--color-error); }
.results-table-wrap { padding: 0 var(--space-3) var(--space-3); overflow-x: auto; }

/* ── Results table ───────────────────────────────────────── */
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.results-table th {
  text-align: right;
  padding: var(--space-2) var(--space-3);
  font-weight: 700;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}
.results-table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}
.results-table tr:last-child td { border-bottom: none; }

/* ── History ─────────────────────────────────────────────── */
.history-section { margin-top: var(--space-2); }
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.history-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.history-empty { padding: var(--space-6); text-align: center; }
.history-list  { display: flex; flex-direction: column; gap: var(--space-3); }

.history-item { padding: var(--space-4) var(--space-5); cursor: pointer; }
.history-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.history-item-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.history-template { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.history-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.history-stats {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.hs-stat { font-size: var(--font-size-sm); font-weight: 600; }
.hs-total { color: var(--color-text-muted); }
.hs-sent  { color: var(--color-success); }
.hs-fail  { color: var(--color-error); }
.history-chevron { color: var(--color-text-muted); font-size: var(--font-size-xs); }

.history-details { margin-top: var(--space-4); border-top: 1px solid var(--color-border); padding-top: var(--space-4); }

/* ── Badge sizes ─────────────────────────────────────────── */
.badge-sm { font-size: var(--font-size-xs); padding: 1px var(--space-2); }

/* ── Form elements ───────────────────────────────────────── */
.form-input, .form-textarea {
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font);
  outline: none;
  transition: border-color var(--transition);
  background: var(--color-bg-card);
  color: var(--color-text);
  text-align: right;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus, .form-textarea:focus { border-color: var(--color-primary); }
.form-textarea { resize: vertical; direction: rtl; line-height: 1.6; }
.form-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 1000px) {
  .send-layout { grid-template-columns: 1fr; }
  .send-side { position: static; }
  .skeleton-row { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .filters-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .wa-send { padding: var(--space-4); }
}
</style>
