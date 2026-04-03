<template>
  <div class="wizard-page" dir="rtl">
    <!-- ── Step Indicator ─────────────────────────────── -->
    <div class="step-indicator">
      <div
        v-for="(s, i) in steps"
        :key="i"
        :class="['step-dot-wrapper', { done: currentStep > i + 1, active: currentStep === i + 1 }]"
      >
        <div class="step-dot">
          <span v-if="currentStep > i + 1">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="step-label">{{ s }}</div>
        <div v-if="i < steps.length - 1" class="step-line"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         STEP 1 — Choose Template
    ════════════════════════════════════════════════════ -->
    <div v-if="currentStep === 1" class="step-screen">
      <h2 class="step-title">📋 בחר תבנית הודעה</h2>

      <!-- Category tabs -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['tab-btn', { active: selectedCategory === cat.key }]"
          @click="selectedCategory = cat.key"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <span>טוען תבניות...</span>
      </div>

      <!-- Template grid -->
      <div v-else class="template-grid">
        <div
          v-for="tmpl in filteredTemplates"
          :key="tmpl.id"
          :class="['template-card', { selected: selectedTemplate?.id === tmpl.id }]"
          @click="selectTemplate(tmpl)"
        >
          <div class="tmpl-emoji">{{ tmpl.emoji || '💬' }}</div>
          <div class="tmpl-name">{{ tmpl.name }}</div>
          <span :class="'style-badge style-' + tmpl.style">{{ styleLabel(tmpl.style) }}</span>
          <div class="tmpl-snippet">{{ bodySnippet(tmpl.body) }}</div>
        </div>

        <div v-if="filteredTemplates.length === 0" class="empty-state">
          אין תבניות בקטגוריה זו
        </div>
      </div>

      <!-- Live preview -->
      <div v-if="selectedTemplate" class="preview-section">
        <div class="preview-header">
          <span class="preview-icon">👁️</span>
          <span>תצוגה מקדימה — {{ selectedTemplate.name }}</span>
        </div>
        <div class="preview-bubble">
          <pre class="preview-text">{{ renderBody(selectedTemplate.body, null, userData) }}</pre>
        </div>

        <!-- Variable warnings -->
        <div v-if="missingVars.length > 0" class="warning-box">
          <div class="warning-title">⚠️ חסרים פרטים בהודעה:</div>
          <div v-for="v in missingVars" :key="v.key" class="warning-row">
            <span class="warning-key" v-text="varKey(v.key)"></span>
            — {{ v.label }}
            <router-link to="/app/settings" class="warning-link">← לחץ לעדכון</router-link>
          </div>
        </div>

        <!-- Explicit confirmation required when vars are missing -->
        <label v-if="missingVars.length > 0" class="confirm-missing-label">
          <input type="checkbox" v-model="confirmMissingVars" />
          <span>אני מודע/ת לפרטים החסרים ורוצה להמשיך בכל זאת</span>
        </label>

        <button
          class="btn btn-primary next-btn"
          :disabled="missingVars.length > 0 && !confirmMissingVars"
          @click="goToStep(2)"
        >
          המשך לבחירת נמענים ←
        </button>
        <p v-if="missingVars.length > 0 && !confirmMissingVars" class="block-hint">
          ✋ יש להשלים פרטים חסרים או לאשר המשך בכל זאת
        </p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         STEP 2 — Choose Recipients
    ════════════════════════════════════════════════════ -->
    <div v-if="currentStep === 2" class="step-screen">
      <div class="step-top-nav">
        <button class="back-btn" @click="goToStep(1)">← חזור</button>
        <h2 class="step-title inline">👥 בחר נמענים</h2>
      </div>

      <!-- Search -->
      <div class="search-row">
        <input
          v-model="guestSearch"
          type="text"
          placeholder="🔍 חפש לפי שם..."
          class="search-input"
        />
      </div>

      <!-- RSVP filter toggles -->
      <div class="filter-row">
        <button
          v-for="f in rsvpFilters"
          :key="f.key"
          :class="['filter-btn', { active: rsvpFilter === f.key }]"
          @click="rsvpFilter = f.key"
        >
          {{ f.label }}
          <span class="filter-count">{{ countByStatus(f.key) }}</span>
        </button>
      </div>

      <!-- Select all / deselect all + counter -->
      <div class="select-actions-row">
        <div class="select-btns">
          <button class="text-btn" @click="selectAll">בחר הכל</button>
          <span class="divider">|</span>
          <button class="text-btn" @click="deselectAll">נקה בחירה</button>
        </div>
        <span class="selected-counter">
          נבחרו <strong>{{ selectedGuests.length }}</strong> נמענים
        </span>
      </div>

      <!-- Smart warnings -->
      <div class="warnings-area">
        <div v-if="reminderWithConfirmedWarning" class="warning-box">
          ⚠️ {{ selectedConfirmedCount }} מהנמענים כבר אישרו הגעה — האם בכל זאת לשלוח תזכורת?
        </div>
        <div v-if="guestsWithoutPhoneCount > 0" class="warning-box">
          ⚠️ ל-{{ guestsWithoutPhoneCount }} אורחים אין מספר טלפון — לא יקבלו הודעה
        </div>
        <div v-if="missingVars.length > 0" class="warning-box">
          ⚠️ ההודעה מכילה פרטים חסרים שיופיעו ריקים
        </div>
      </div>

      <!-- Guest list -->
      <div class="guest-list">
        <div
          v-for="guest in visibleGuests"
          :key="guest.id"
          :class="['guest-row', { 'guest-row--selected': isSelected(guest.id), 'guest-row--nophone': !guest.phone }]"
          @click="toggleGuest(guest)"
        >
          <input
            type="checkbox"
            :checked="isSelected(guest.id)"
            @click.stop="toggleGuest(guest)"
            class="guest-checkbox"
          />
          <div class="guest-info">
            <span class="guest-name">{{ guest.name }}</span>
            <span class="guest-phone">{{ guest.phone || '⚠️ אין טלפון' }}</span>
          </div>
          <span :class="'rsvp-badge rsvp-' + guest.rsvpStatus">
            {{ rsvpLabel(guest.rsvpStatus) }}
          </span>
        </div>

        <div v-if="visibleGuests.length === 0" class="empty-state">
          לא נמצאו אורחים
        </div>
      </div>

      <button
        class="btn btn-primary next-btn"
        :disabled="selectedGuests.length === 0"
        @click="goToStep(3)"
      >
        המשך לאישור ושליחה ← ({{ selectedGuests.length }})
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════
         STEP 3 — Confirm & Send
    ════════════════════════════════════════════════════ -->
    <div v-if="currentStep === 3" class="step-screen">
      <div class="step-top-nav">
        <button class="back-btn" @click="goToStep(2)">← חזור</button>
        <h2 class="step-title inline">✅ אישור ושליחה</h2>
      </div>

      <!-- Summary card -->
      <div class="summary-card">
        <div class="summary-row">
          <span class="summary-label">תבנית</span>
          <span class="summary-value">{{ selectedTemplate?.emoji }} {{ selectedTemplate?.name }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">קטגוריה</span>
          <span class="summary-value">{{ categoryLabel(selectedTemplate?.category) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">נמענים</span>
          <span class="summary-value"><strong>{{ selectedGuests.length }}</strong> אורחים</span>
        </div>
      </div>

      <!-- Message preview for first recipient -->
      <div class="preview-section">
        <div class="preview-header">
          <span class="preview-icon">💬</span>
          <span>דוגמת הודעה — {{ firstSelectedGuest?.name || 'אורח ראשון' }}</span>
        </div>
        <div class="preview-bubble">
          <pre class="preview-text">{{ previewForFirstGuest }}</pre>
        </div>
      </div>

      <!-- Schedule toggle -->
      <div class="schedule-section">
        <div class="schedule-toggle-row">
          <button
            :class="['schedule-btn', { active: scheduleMode === 'now' }]"
            @click="scheduleMode = 'now'"
          >
            ⚡ שלח עכשיו
          </button>
          <button
            :class="['schedule-btn', { active: scheduleMode === 'scheduled' }]"
            @click="scheduleMode = 'scheduled'"
          >
            🕐 תזמן שליחה
          </button>
        </div>

        <div v-if="scheduleMode === 'scheduled'" class="schedule-picker">
          <label class="schedule-label">תאריך ושעת שליחה (9:00–22:00)</label>
          <input
            type="datetime-local"
            v-model="scheduledAt"
            class="form-input"
            :min="minScheduleTime"
            :max="maxScheduleTime"
          />
        </div>
      </div>

      <!-- Send result -->
      <div v-if="sendResult" :class="['send-result', sendResult.ok ? 'result-success' : 'result-error']">
        {{ sendResult.message }}
      </div>

      <!-- Send button -->
      <button
        v-if="!sendResult || !sendResult.ok"
        class="btn btn-primary send-btn"
        @click="sendMessages"
        :disabled="sending"
      >
        <span v-if="sending" class="sending-spinner"></span>
        {{ sending ? 'שולח הודעות...' : `📤 שלח ל-${selectedGuests.length} אורחים` }}
      </button>

      <!-- Disconnect recommendation after success -->
      <div v-if="sendResult?.ok" class="disconnect-recommendation">
        <div class="disconnect-icon">🔒</div>
        <div class="disconnect-text">
          <strong>ההודעות נשלחו בהצלחה!</strong>
          <span>אנו ממליצים להתנתק מ-WhatsApp עד לשליחה הבאה</span>
        </div>
        <button class="btn-disconnect" @click="disconnectWA" :disabled="disconnecting">
          {{ disconnecting ? 'מתנתק...' : 'התנתק' }}
        </button>
      </div>

      <!-- Start over after success -->
      <button v-if="sendResult?.ok" class="btn btn-secondary reset-btn" @click="resetWizard">
        📋 שליחה חדשה
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/composables/useApi'

const router = useRouter()

// ── State ────────────────────────────────────────────────────────────────────
const currentStep = ref(1)
const loading = ref(true)

const templates = ref([])
const guests = ref([])
const userData = ref({})

const selectedTemplate = ref(null)
const selectedCategory = ref('all')

const guestSearch = ref('')
const rsvpFilter = ref('all')
const selectedGuestIds = ref(new Set())

const scheduleMode = ref('now')
const scheduledAt = ref('')
const sending = ref(false)
const sendResult = ref(null)
const disconnecting = ref(false)
const confirmMissingVars = ref(false)

// ── Constants ────────────────────────────────────────────────────────────────
const steps = ['בחר תבנית', 'בחר נמענים', 'אישור ושליחה']

const categories = [
  { key: 'all',          label: 'הכל' },
  { key: 'invite',       label: '💌 הזמנה' },
  { key: 'reminder',     label: '⏰ תזכורת' },
  { key: 'general',      label: '📢 כללי' },
]

const rsvpFilters = [
  { key: 'all',       label: 'כולם' },
  { key: 'pending',   label: 'לא ענו' },
  { key: 'confirmed', label: 'מאשרים' },
  { key: 'declined',  label: 'מסרבים' },
]

// ── Computed ─────────────────────────────────────────────────────────────────
const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') return templates.value
  return templates.value.filter(t => t.category === selectedCategory.value)
})

const missingVars = computed(() => {
  if (!selectedTemplate.value || !userData.value) return []
  return getMissingVars(selectedTemplate.value.body || '', userData.value)
})

const visibleGuests = computed(() => {
  let list = guests.value
  if (rsvpFilter.value !== 'all') {
    list = list.filter(g => g.rsvpStatus === rsvpFilter.value)
  }
  if (guestSearch.value.trim()) {
    const q = guestSearch.value.trim().toLowerCase()
    list = list.filter(g => g.name?.toLowerCase().includes(q))
  }
  return list
})

const selectedGuests = computed(() =>
  guests.value.filter(g => selectedGuestIds.value.has(g.id))
)

const firstSelectedGuest = computed(() =>
  guests.value.find(g => selectedGuestIds.value.has(g.id))
)

const previewForFirstGuest = computed(() => {
  if (!selectedTemplate.value) return ''
  return renderBody(selectedTemplate.value.body, firstSelectedGuest.value, userData.value)
})

const guestsWithoutPhoneCount = computed(() =>
  selectedGuests.value.filter(g => !g.phone).length
)

const selectedConfirmedCount = computed(() =>
  selectedGuests.value.filter(g => g.rsvpStatus === 'confirmed').length
)

const reminderWithConfirmedWarning = computed(() =>
  selectedTemplate.value?.category === 'reminder' && selectedConfirmedCount.value > 0
)

const minScheduleTime = computed(() => {
  const now = new Date()
  now.setHours(9, 0, 0, 0)
  if (now < new Date()) now.setDate(now.getDate() + 1)
  return now.toISOString().slice(0, 16)
})

const maxScheduleTime = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  d.setHours(22, 0, 0, 0)
  return d.toISOString().slice(0, 16)
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function getMissingVars(body, user) {
  const missing = []
  if (body.includes('{{time}}') && !user.weddingTime) missing.push({ key: 'time', label: 'שעת האירוע' })
  if (body.includes('{{venue}}') && !user.venue) missing.push({ key: 'venue', label: 'מקום האירוע' })
  if (body.includes('{{date}}') && !user.weddingDate) missing.push({ key: 'date', label: 'תאריך החתונה' })
  return missing
}

function renderBody(body, guest, user) {
  if (!body) return ''
  return body
    .replace(/{{name}}/g, guest?.name || 'שם האורח')
    .replace(/{{name1}}/g, user?.name1 || '[שם חתן]')
    .replace(/{{name2}}/g, user?.name2 || '[שם כלה]')
    .replace(/{{venue}}/g, user?.venue || '⚠️ [מקום חסר]')
    .replace(/{{date}}/g, user?.weddingDate ? new Date(user.weddingDate).toLocaleDateString('he-IL') : '⚠️ [תאריך חסר]')
    .replace(/{{time}}/g, user?.weddingTime || '⚠️ [שעה חסרה]')
    .replace(/{{rsvp_link}}/g, `https://aware-carries-protecting-bay.trycloudflare.com/rsvp/${user?.rsvpToken || ''}`)
}

function varKey(key) { return '{{' + key + '}}' }

function bodySnippet(body) {
  if (!body) return ''
  const lines = body.split('\n').filter(l => l.trim()).slice(0, 2)
  const snippet = lines.join(' | ')
  return snippet.length > 90 ? snippet.slice(0, 87) + '...' : snippet
}

function styleLabel(style) {
  return { formal: 'רשמי', casual: 'קליל', personal: 'אישי' }[style] || style || ''
}

function categoryLabel(cat) {
  return { invite: '💌 הזמנה', reminder: '⏰ תזכורת', general: '📢 כללי', rsvp_reminder: '⏰ תזכורת RSVP' }[cat] || cat || ''
}

function rsvpLabel(s) {
  return { confirmed: '✅ אישר', pending: '⏳ ממתין', declined: '❌ לא מגיע', maybe: '🤔 מתלבט' }[s] || s || ''
}

function countByStatus(key) {
  if (key === 'all') return guests.value.length
  return guests.value.filter(g => g.rsvpStatus === key).length
}

function isSelected(id) {
  return selectedGuestIds.value.has(id)
}

function toggleGuest(guest) {
  const ids = new Set(selectedGuestIds.value)
  if (ids.has(guest.id)) ids.delete(guest.id)
  else ids.add(guest.id)
  selectedGuestIds.value = ids
}

function selectAll() {
  selectedGuestIds.value = new Set(visibleGuests.value.map(g => g.id))
}

function deselectAll() {
  selectedGuestIds.value = new Set()
}

function selectTemplate(tmpl) {
  selectedTemplate.value = tmpl
  confirmMissingVars.value = false  // reset confirmation on template change
  // Don't auto-advance — let user review preview + warnings before clicking "המשך"
}

function goToStep(n) {
  currentStep.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function disconnectWA() {
  disconnecting.value = true
  try {
    await api.post('/whatsapp/disconnect')
    waStatus.value = 'disconnected'
    sendResult.value = { ok: true, message: '✅ התנתקת מ-WhatsApp בהצלחה' }
  } catch(e) {
    console.error('disconnect error', e)
  } finally {
    disconnecting.value = false
  }
}

function resetWizard() {
  selectedTemplate.value = null
  selectedGuestIds.value = new Set()
  scheduleMode.value = 'now'
  scheduledAt.value = ''
  sendResult.value = null
  sending.value = false
  confirmMissingVars.value = false
  goToStep(1)
}

async function sendMessages() {
  if (!selectedTemplate.value || selectedGuests.value.length === 0) return

  if (scheduleMode.value === 'scheduled' && scheduledAt.value) {
    const dt = new Date(scheduledAt.value)
    const hour = dt.getHours()
    if (hour < 9 || hour >= 22) {
      alert('ניתן לשלוח הודעות רק בין 9:00 ל-22:00')
      return
    }
  }

  sending.value = true
  sendResult.value = null

  try {
    const res = await api.post('/whatsapp/send-bulk', {
      templateId: selectedTemplate.value.id,
      guestIds: [...selectedGuestIds.value],
      scheduledAt: scheduleMode.value === 'scheduled' ? scheduledAt.value : null
    })

    const sent = res.data?.sent ?? selectedGuests.value.length
    const failed = res.data?.failed ?? 0
    sendResult.value = {
      ok: true,
      message: `✅ נשלחו ${sent} הודעות${failed > 0 ? ` | ❌ נכשלו ${failed}` : ''}`
    }
  } catch (e) {
    const errCode = e.response?.data?.error
    const errMsg = errCode === 'WA_NOT_CONNECTED'
      ? '❌ WhatsApp לא מחובר — אנא עבור לדף חיבור WhatsApp וסרוק QR מחדש'
      : '❌ שגיאה בשליחה: ' + (e.response?.data?.message || e.response?.data?.error || e.message)
    sendResult.value = { ok: false, message: errMsg }
  } finally {
    sending.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [tmplRes, guestRes, meRes] = await Promise.all([
      api.get('/whatsapp/templates'),
      api.get('/guests'),
      api.get('/auth/me'),
    ])
    templates.value = tmplRes.data
    guests.value = guestRes.data.guests || guestRes.data
    userData.value = meRes.data
  } catch (e) {
    console.error('SendView load error', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────────────────────── */
.wizard-page {
  padding: 16px;
  max-width: 680px;
  margin: 0 auto;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
}

/* ── Step Indicator ──────────────────────────────────────────────────────── */
.step-indicator {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
  position: relative;
}

.step-dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  background: #e5e7eb;
  color: #9ca3af;
  transition: all 0.3s;
  z-index: 1;
}

.step-dot-wrapper.active .step-dot {
  background: var(--color-primary, #E91E8C);
  color: white;
  box-shadow: 0 0 0 4px rgba(233, 30, 140, 0.18);
}

.step-dot-wrapper.done .step-dot {
  background: var(--color-primary, #E91E8C);
  color: white;
}

.step-label {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: center;
  white-space: nowrap;
}

.step-dot-wrapper.active .step-label,
.step-dot-wrapper.done .step-label {
  color: var(--color-primary, #E91E8C);
  font-weight: 600;
}

.step-line {
  position: absolute;
  top: 18px;
  right: 50%;
  width: 100%;
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step-dot-wrapper.done .step-line {
  background: var(--color-primary, #E91E8C);
}

/* ── Step Screen ─────────────────────────────────────────────────────────── */
.step-screen {
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.step-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-navy, #1A1F36);
  margin-bottom: 16px;
}

.step-title.inline {
  display: inline;
  font-size: 16px;
  margin-bottom: 0;
}

.step-top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

/* ── Category Tabs ───────────────────────────────────────────────────────── */
.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  transition: all 200ms;
  color: #374151;
}

.tab-btn.active {
  background: var(--color-primary, #E91E8C);
  color: white;
  border-color: var(--color-primary, #E91E8C);
}

/* ── Template Grid ───────────────────────────────────────────────────────── */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.template-card {
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 200ms;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.template-card:hover {
  border-color: var(--color-primary, #E91E8C);
  box-shadow: 0 4px 12px rgba(233,30,140,0.12);
  transform: translateY(-2px);
}

.template-card.selected {
  border-color: var(--color-primary, #E91E8C);
  background: #FDF0F8;
  box-shadow: 0 0 0 3px rgba(233,30,140,0.18);
}

.tmpl-emoji { font-size: 26px; margin-bottom: 8px; }
.tmpl-name  { font-weight: 700; font-size: 14px; margin-bottom: 6px; color: var(--color-navy, #1A1F36); }

.style-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
}

.style-formal   { background: #dbeafe; color: #1e40af; }
.style-casual   { background: #d1fae5; color: #065f46; }
.style-personal { background: #fde8f4; color: #E91E8C; }

.tmpl-snippet {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  direction: rtl;
}

/* ── Loading / Empty ─────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: #9ca3af;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: var(--color-primary, #E91E8C);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.sending-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-left: 6px;
  vertical-align: middle;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  color: #9ca3af;
  padding: 24px;
  text-align: center;
  grid-column: 1 / -1;
}

/* ── Preview Section ─────────────────────────────────────────────────────── */
.preview-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.preview-icon { font-size: 16px; }

.preview-bubble {
  background: #f0fff4;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.preview-text {
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  direction: rtl;
  margin: 0;
  color: #1A1F36;
}

/* ── Warning Box ─────────────────────────────────────────────────────────── */
.warning-box {
  background: #FFF9E6;
  border-right: 4px solid #F59E0B;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #92400e;
  margin-bottom: 10px;
  line-height: 1.6;
}

.warning-title { font-weight: 700; margin-bottom: 6px; }

.warning-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.warning-key {
  font-family: monospace;
  background: #fef3c7;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}

.warning-link {
  color: var(--color-primary, #E91E8C);
  text-decoration: none;
  font-weight: 600;
  font-size: 12px;
}

.warning-link:hover { text-decoration: underline; }

.warnings-area { margin-bottom: 12px; }

/* ── Guest Search & Filters ──────────────────────────────────────────────── */
.search-row { margin-bottom: 12px; }

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  background: white;
  box-sizing: border-box;
  direction: rtl;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #E91E8C);
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.filter-btn {
  padding: 5px 12px;
  border-radius: 16px;
  border: 1.5px solid #e5e7eb;
  background: white;
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  transition: all 180ms;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn.active {
  background: var(--color-navy, #1A1F36);
  color: white;
  border-color: var(--color-navy, #1A1F36);
}

.filter-count {
  font-size: 11px;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  padding: 0 5px;
}

.filter-btn.active .filter-count {
  background: rgba(255,255,255,0.25);
}

/* ── Select Actions ──────────────────────────────────────────────────────── */
.select-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 8px;
  font-size: 13px;
}

.select-btns { display: flex; align-items: center; gap: 8px; }

.text-btn {
  background: none;
  border: none;
  color: var(--color-primary, #E91E8C);
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  padding: 2px 4px;
  font-weight: 600;
}

.text-btn:hover { text-decoration: underline; }

.divider { color: #d1d5db; }

.selected-counter { color: #6b7280; }
.selected-counter strong { color: var(--color-navy, #1A1F36); }

/* ── Guest List ──────────────────────────────────────────────────────────── */
.guest-list {
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
}

.guest-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 150ms;
  border-bottom: 1px solid #f9fafb;
}

.guest-row:last-child { border-bottom: none; }

.guest-row:hover { background: #f9fafb; }

.guest-row--selected {
  background: #FDF0F8;
  border-right: 2px solid var(--color-primary, #E91E8C);
}

.guest-row--nophone { opacity: 0.6; }

.guest-checkbox { accent-color: var(--color-primary, #E91E8C); flex-shrink: 0; }

.guest-info { display: flex; flex-direction: column; flex: 1; }
.guest-name { font-weight: 600; font-size: 14px; }
.guest-phone { font-size: 12px; color: #9ca3af; margin-top: 1px; }

.rsvp-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.rsvp-confirmed { background: #d1fae5; color: #065f46; }
.rsvp-pending   { background: #f3f4f6; color: #6b7280; }
.rsvp-declined  { background: #fee2e2; color: #991b1b; }
.rsvp-maybe     { background: #fef9c3; color: #78350f; }

/* ── Summary Card ────────────────────────────────────────────────────────── */
.summary-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.summary-row:last-child { border-bottom: none; }

.summary-label { color: #6b7280; font-weight: 500; }
.summary-value { font-weight: 600; color: var(--color-navy, #1A1F36); }

/* ── Schedule ────────────────────────────────────────────────────────────── */
.schedule-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}

.schedule-toggle-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.schedule-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  font-weight: 600;
  transition: all 200ms;
  color: #6b7280;
}

.schedule-btn.active {
  border-color: var(--color-primary, #E91E8C);
  background: #FDF0F8;
  color: var(--color-primary, #E91E8C);
}

.schedule-picker { display: flex; flex-direction: column; gap: 6px; }
.schedule-label { font-size: 13px; color: #6b7280; }

.form-input {
  padding: 10px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  direction: ltr;
  text-align: right;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, #E91E8C);
}

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.btn {
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 15px;
  font-weight: 700;
  transition: all 200ms;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary, #E91E8C);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c4177a;
  box-shadow: 0 4px 12px rgba(233,30,140,0.35);
}

.btn-secondary {
  background: white;
  color: var(--color-navy, #1A1F36);
  border: 1.5px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.next-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  font-size: 15px;
}
.next-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.confirm-missing-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
  padding: 12px;
  background: #FFF9E6;
  border: 1.5px solid #F59E0B;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #92400E;
  line-height: 1.4;
}
.confirm-missing-label input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}
.block-hint {
  text-align: center;
  color: #92400E;
  font-size: 13px;
  margin-top: 8px;
}

.send-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  letter-spacing: 0.3px;
}

.disconnect-recommendation {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fffbeb;
  border: 1.5px solid #fcd34d;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.disconnect-icon { font-size: 22px; flex-shrink: 0; }
.disconnect-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #92400e;
}
.disconnect-text strong { font-size: 14px; color: #78350f; }
.btn-disconnect {
  flex-shrink: 0;
  padding: 8px 14px;
  background: #1A1F36;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: Heebo, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s;
}
.btn-disconnect:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-disconnect:hover:not(:disabled) { opacity: 0.85; }

.reset-btn {
  width: 100%;
  margin-top: 12px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--color-navy, #1A1F36);
  cursor: pointer;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.back-btn:hover { color: var(--color-primary, #E91E8C); }

/* ── Send Result ─────────────────────────────────────────────────────────── */
.send-result {
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
}

.result-success { background: #d1fae5; color: #065f46; }
.result-error   { background: #fee2e2; color: #991b1b; }

/* ── Mobile ──────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .wizard-page { padding: 12px; }
  .template-grid { grid-template-columns: 1fr 1fr; }
  .step-label { font-size: 10px; }
  .schedule-toggle-row { flex-direction: column; }
}
</style>
