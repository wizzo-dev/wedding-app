<template>
  <div class="wa-send-page" dir="rtl">
    <div class="page-header">
      <h1>📤 שליחת הודעות</h1>
    </div>

    <!-- Step 1: Choose template -->
    <div class="step-card" :class="{ active: step >= 1 }">
      <h3>שלב 1 — בחר תבנית</h3>

      <!-- Category filter -->
      <div class="category-tabs">
        <button v-for="cat in categories" :key="cat.key"
          :class="['tab-btn', { active: selectedCategory === cat.key }]"
          @click="selectedCategory = cat.key">
          {{ cat.label }}
        </button>
      </div>

      <!-- Template grid -->
      <div class="template-grid">
        <div v-for="tmpl in filteredTemplates" :key="tmpl.id"
          :class="['template-card', { selected: selectedTemplate?.id === tmpl.id }]"
          @click="selectTemplate(tmpl)">
          <div class="tmpl-emoji">{{ tmpl.emoji }}</div>
          <div class="tmpl-name">{{ tmpl.name }}</div>
          <div class="tmpl-style">
            <span :class="'style-badge style-' + tmpl.style">{{ styleLabel(tmpl.style) }}</span>
          </div>
          <div class="tmpl-preview">{{ tmpl.body?.slice(0, 80) }}...</div>
        </div>
      </div>
    </div>

    <!-- Step 2: Choose recipients -->
    <div v-if="selectedTemplate" class="step-card">
      <h3>שלב 2 — בחר נמענים</h3>

      <div class="filter-row">
        <button v-for="f in rsvpFilters" :key="f.key"
          :class="['filter-btn', { active: rsvpFilter === f.key }]"
          @click="rsvpFilter = f.key">
          {{ f.label }} ({{ countByStatus(f.key) }})
        </button>
      </div>

      <div class="select-all-row">
        <label>
          <input type="checkbox" @change="toggleAll" :checked="allSelected" /> בחר הכל
        </label>
        <span class="selected-count">{{ selectedGuests.length }} נבחרו</span>
      </div>

      <div class="guest-list">
        <label v-for="guest in filteredGuests" :key="guest.id" class="guest-row">
          <input type="checkbox" :value="guest.id" v-model="selectedGuests" :disabled="!guest.phone" />
          <span class="guest-name">{{ guest.name }}</span>
          <span class="guest-phone">{{ guest.phone || 'אין טלפון' }}</span>
          <span :class="'badge badge-' + rsvpColor(guest.rsvpStatus)">{{ rsvpLabel(guest.rsvpStatus) }}</span>
        </label>
      </div>
    </div>

    <!-- Step 3: Schedule & preview -->
    <div v-if="selectedTemplate && selectedGuests.length > 0" class="step-card">
      <h3>שלב 3 — תזמון ואישור</h3>

      <!-- Preview of first message -->
      <div class="preview-box">
        <div class="preview-label">תצוגה מקדימה ({{ previewGuest?.name || 'דוגמה' }}):</div>
        <div class="preview-message">{{ previewMessage }}</div>
      </div>

      <!-- Schedule time -->
      <div class="schedule-section">
        <label>
          <input type="radio" v-model="sendMode" value="now" /> שלח עכשיו
        </label>
        <label>
          <input type="radio" v-model="sendMode" value="scheduled" /> תזמן שליחה
        </label>

        <div v-if="sendMode === 'scheduled'" class="schedule-picker">
          <input type="datetime-local" v-model="scheduledAt" class="form-input"
            :min="minScheduleTime" :max="maxScheduleTime" />
          <p class="schedule-note">⚠️ הודעות ישלחו רק בין 9:00 ל-22:00</p>
        </div>
      </div>

      <button class="btn btn-primary send-btn"
        @click="sendMessages" :disabled="sending">
        {{ sending ? 'שולח...' : `📤 שלח ל-${selectedGuests.length} אורחים` }}
      </button>

      <div v-if="sendResult" :class="['send-result', sendResult.ok ? 'success' : 'error']">
        {{ sendResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const templates = ref([])
const guests = ref([])
const selectedTemplate = ref(null)
const selectedGuests = ref([])
const rsvpFilter = ref('all')
const selectedCategory = ref('all')
const sendMode = ref('now')
const scheduledAt = ref('')
const sending = ref(false)
const sendResult = ref(null)
const step = ref(1)

const categories = [
  { key: 'all', label: 'הכל' },
  { key: 'invite', label: '💌 הזמנה' },
  { key: 'rsvp_reminder', label: '⏰ תזכורת RSVP' },
  { key: 'reminder', label: '📅 תזכורת יום לפני' }
]

const rsvpFilters = [
  { key: 'all', label: 'כולם' },
  { key: 'pending', label: 'ממתינים' },
  { key: 'confirmed', label: 'אישרו' },
  { key: 'declined', label: 'לא מגיעים' }
]

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'all') return templates.value
  return templates.value.filter(t => t.category === selectedCategory.value)
})

const filteredGuests = computed(() => {
  let list = guests.value.filter(g => g.phone)
  if (rsvpFilter.value !== 'all') list = list.filter(g => g.rsvpStatus === rsvpFilter.value)
  return list
})

const allSelected = computed(() =>
  filteredGuests.value.length > 0 && filteredGuests.value.every(g => selectedGuests.value.includes(g.id))
)

const previewGuest = computed(() => guests.value.find(g => selectedGuests.value.includes(g.id)))

const previewMessage = computed(() => {
  if (!selectedTemplate.value || !previewGuest.value) return ''
  const user = auth.user
  return (selectedTemplate.value.body || selectedTemplate.value.content)
    ?.replace(/{{name}}/g, previewGuest.value.name)
    ?.replace(/{{name1}}/g, user?.name1 || 'החתן')
    ?.replace(/{{name2}}/g, user?.name2 || 'הכלה')
    ?.replace(/{{date}}/g, user?.weddingDate ? new Date(user.weddingDate).toLocaleDateString('he-IL') : 'תאריך החתונה')
    ?.replace(/{{time}}/g, '19:00')
    ?.replace(/{{venue}}/g, user?.venue || 'האולם')
    ?.replace(/{{rsvp_link}}/g, `https://aware-carries-protecting-bay.trycloudflare.com/rsvp/${user?.rsvpToken || 'xxx'}`)
})

const minScheduleTime = computed(() => {
  const now = new Date()
  now.setHours(9, 0, 0, 0)
  if (now < new Date()) now.setDate(now.getDate() + 1)
  return now.toISOString().slice(0, 16)
})

const maxScheduleTime = computed(() => {
  const d = new Date(); d.setDate(d.getDate() + 30)
  d.setHours(22, 0, 0, 0)
  return d.toISOString().slice(0, 16)
})

function styleLabel(style) {
  return { formal: 'רשמי', casual: 'קליל', personal: 'אישי' }[style] || style
}
function rsvpLabel(s) { return { confirmed: 'אישר', pending: 'ממתין', declined: 'לא מגיע', maybe: 'מתלבט' }[s] || s }
function rsvpColor(s) { return { confirmed: 'success', pending: 'warning', declined: 'error', maybe: 'info' }[s] || 'info' }
function countByStatus(k) { return k === 'all' ? guests.value.filter(g => g.phone).length : guests.value.filter(g => g.rsvpStatus === k && g.phone).length }

function selectTemplate(tmpl) {
  selectedTemplate.value = tmpl
  step.value = 2
}

function toggleAll() {
  if (allSelected.value) selectedGuests.value = []
  else selectedGuests.value = filteredGuests.value.map(g => g.id)
}

async function sendMessages() {
  if (!selectedTemplate.value || selectedGuests.value.length === 0) return

  // Validate schedule time if scheduled
  if (sendMode.value === 'scheduled' && scheduledAt.value) {
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
    await api.post('/whatsapp/send-bulk', {
      templateId: selectedTemplate.value.id,
      guestIds: selectedGuests.value,
      scheduledAt: sendMode.value === 'scheduled' ? scheduledAt.value : null
    })
    sendResult.value = { ok: true, message: `✅ נשלח ל-${selectedGuests.value.length} אורחים בהצלחה!` }
    selectedGuests.value = []
  } catch (e) {
    sendResult.value = { ok: false, message: '❌ שגיאה בשליחה: ' + (e.response?.data?.error || e.message) }
  }
  sending.value = false
}

onMounted(async () => {
  const [tmplRes, guestRes] = await Promise.all([
    api.get('/whatsapp/templates'),
    api.get('/guests')
  ])
  templates.value = tmplRes.data
  guests.value = guestRes.data.guests || guestRes.data
})
</script>

<style scoped>
.wa-send-page { padding: 24px; max-width: 900px; margin: 0 auto; }
.page-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.step-card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.step-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.category-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.tab-btn { padding: 6px 14px; border-radius: 20px; border: 1.5px solid #e5e7eb; background: white; cursor: pointer; font-family: Heebo; font-size: 13px; transition: all 200ms; }
.tab-btn.active { background: #E91E8C; color: white; border-color: #E91E8C; }
.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.template-card { border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 200ms; }
.template-card:hover { border-color: #E91E8C; background: #fde8f4; }
.template-card.selected { border-color: #E91E8C; background: #fde8f4; box-shadow: 0 0 0 3px rgba(233,30,140,0.15); }
.tmpl-emoji { font-size: 24px; margin-bottom: 8px; }
.tmpl-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
.style-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.style-formal { background: #dbeafe; color: #1e40af; }
.style-casual { background: #d1fae5; color: #065f46; }
.style-personal { background: #fde8f4; color: #E91E8C; }
.tmpl-preview { font-size: 12px; color: #6b7280; margin-top: 8px; line-height: 1.4; }
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.filter-btn { padding: 5px 12px; border-radius: 16px; border: 1px solid #e5e7eb; background: white; cursor: pointer; font-size: 13px; font-family: Heebo; }
.filter-btn.active { background: #1A1F36; color: white; }
.select-all-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; margin-bottom: 8px; }
.selected-count { font-size: 13px; color: #6b7280; }
.guest-list { max-height: 300px; overflow-y: auto; }
.guest-row { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 8px; cursor: pointer; }
.guest-row:hover { background: #f9fafb; }
.guest-name { font-weight: 600; flex: 1; }
.guest-phone { color: #6b7280; font-size: 13px; }
.preview-box { background: #f0fff4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-bottom: 16px; white-space: pre-line; direction: rtl; }
.preview-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
.preview-message { font-size: 14px; line-height: 1.6; }
.schedule-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.schedule-picker { margin-top: 8px; }
.schedule-note { font-size: 12px; color: #f59e0b; margin-top: 4px; }
.send-btn { width: 100%; padding: 14px; font-size: 16px; }
.send-result { padding: 12px; border-radius: 8px; margin-top: 12px; text-align: center; font-weight: 600; }
.send-result.success { background: #d1fae5; color: #065f46; }
.send-result.error { background: #fee2e2; color: #991b1b; }
</style>
