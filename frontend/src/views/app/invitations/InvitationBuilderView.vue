<template>
  <div class="builder-view fade-in" dir="rtl">
    <!-- Header -->
    <div class="builder-header">
      <RouterLink :to="invitationId ? '/app/invitations' : '/app/invitations/new'" class="btn btn-outline btn-sm">
        ← חזור
      </RouterLink>
      <h1 class="builder-title">{{ invitationId ? 'עריכת הזמנה' : 'עיצוב הזמנה' }}</h1>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="saveInvitation" :disabled="saving">
          {{ saving ? '⏳ שומר...' : '💾 שמור' }}
        </button>
      </div>
    </div>

    <div v-if="loadingTemplate" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="loadError" class="error-card card card-body">
      <p>{{ loadError }}</p>
      <RouterLink to="/app/invitations/new" class="btn btn-primary">בחר תבנית</RouterLink>
    </div>

    <div v-else class="builder-layout">
      <!-- Sidebar -->
      <aside class="builder-sidebar card card-body">
        <div class="sidebar-scroll">
          <section class="form-section">
            <h3 class="section-title">פרטי החתן והכלה</h3>

            <div class="form-group">
              <label>שם החתן</label>
              <input v-model="fields.groomName" type="text" class="form-input" placeholder="ישראל" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>שם הכלה</label>
              <input v-model="fields.brideName" type="text" class="form-input" placeholder="ישראלה" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>הורי החתן</label>
              <input v-model="fields.groomParents" type="text" class="form-input" placeholder="משפחת כהן" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>הורי הכלה</label>
              <input v-model="fields.brideParents" type="text" class="form-input" placeholder="משפחת לוי" @input="scheduleRedraw" />
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">פרטי האירוע</h3>
            <div class="form-group">
              <label>תאריך</label>
              <input v-model="fields.date" type="date" class="form-input" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>שעה</label>
              <input v-model="fields.time" type="time" class="form-input" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>מקום</label>
              <input v-model="fields.venue" type="text" class="form-input" placeholder="אולם האגם" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>כתובת</label>
              <input v-model="fields.address" type="text" class="form-input" placeholder="רחוב הורדים 5, תל אביב" @input="scheduleRedraw" />
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">טקסטים</h3>
            <div class="form-group">
              <label>ברכה</label>
              <textarea v-model="fields.blessing" class="form-input" rows="2" placeholder="בשעה טובה ומוצלחת" @input="scheduleRedraw" />
            </div>
            <div class="form-group">
              <label>טקסט נוסף</label>
              <textarea v-model="fields.extraText" class="form-input" rows="2" placeholder="אנא אשר הגעתך..." @input="scheduleRedraw" />
            </div>
          </section>

          <section class="form-section">
            <h3 class="section-title">עיצוב</h3>
            <div class="form-group">
              <label>פונט</label>
              <select v-model="selectedFont" class="form-input" @change="scheduleRedraw">
                <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>גודל בסיס: {{ baseFontSize }}px</label>
              <input v-model.number="baseFontSize" type="range" min="12" max="48" step="1" class="range-input" @input="scheduleRedraw" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>צבע ראשי</label>
                <input v-model="primaryColor" type="color" class="color-input" @input="scheduleRedraw" />
              </div>
              <div class="form-group">
                <label>צבע משני</label>
                <input v-model="secondaryColor" type="color" class="color-input" @input="scheduleRedraw" />
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar footer actions -->
        <div class="sidebar-actions">
          <button class="btn btn-primary" @click="saveInvitation" :disabled="saving">
            {{ saving ? '⏳ שומר...' : '💾 שמור' }}
          </button>
          <button
            v-if="invitationId"
            class="btn btn-outline"
            @click="downloadPdf"
            :disabled="downloading"
          >
            {{ downloading ? '⏳' : '📥 הורד' }}
          </button>
          <button
            v-if="invitationId"
            class="btn btn-outline"
            @click="copyShareLink"
          >
            🔗 שתף
          </button>
        </div>
      </aside>

      <!-- Canvas area -->
      <div class="canvas-area">
        <div class="canvas-wrapper invitation-canvas-container" ref="canvasWrapper">
          <div class="canvas-stage-wrap" :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }">
            <v-stage ref="stageRef" :config="stageConfig">
              <v-layer>
                <!-- Background image -->
                <v-image v-if="bgImage" :config="bgImageConfig" />
                <!-- Text zones -->
                <v-text
                  v-for="(zone, idx) in computedTextNodes"
                  :key="idx"
                  :config="zone"
                />
              </v-layer>
            </v-stage>
          </div>
        </div>
        <p class="canvas-hint">👆 זה הצפה חיה של ההזמנה שלך</p>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const router = useRouter()

// Canvas dimensions
const CANVAS_W = 600
const CANVAS_H = 850

const stageRef = ref(null)
const canvasWrapper = ref(null)
const bgImage = ref(null)
const loadingTemplate = ref(true)
const loadError = ref(null)
const saving = ref(false)
const downloading = ref(false)
const toast = ref(null)

// Scale for responsive display
const scale = ref(1)
const displayWidth = computed(() => Math.round(CANVAS_W * scale.value))
const displayHeight = computed(() => Math.round(CANVAS_H * scale.value))

const stageConfig = computed(() => ({
  width: displayWidth.value,
  height: displayHeight.value,
  scaleX: scale.value,
  scaleY: scale.value,
}))

const bgImageConfig = computed(() => ({
  image: bgImage.value,
  x: 0, y: 0,
  width: CANVAS_W,
  height: CANVAS_H,
}))

// Template + invitation data
const template = ref(null)
const invitationId = computed(() => route.params.id ? parseInt(route.params.id) : null)
const templateId = computed(() => route.params.templateId ? parseInt(route.params.templateId) : null)

// Form fields
const fields = ref({
  groomName: '',
  brideName: '',
  groomParents: '',
  brideParents: '',
  date: '',
  time: '',
  venue: '',
  address: '',
  blessing: 'בשעה טובה ומוצלחת',
  extraText: '',
})

const selectedFont = ref('Heebo')
const baseFontSize = ref(20)
const primaryColor = ref('#E91E8C')
const secondaryColor = ref('#333333')

const fonts = [
  { value: 'Heebo',              label: 'Heebo' },
  { value: 'Assistant',          label: 'Assistant' },
  { value: 'Frank Ruhl Libre',   label: 'Frank Ruhl Libre' },
  { value: 'Noto Serif Hebrew',  label: 'Noto Serif Hebrew' },
  { value: 'David Libre',        label: 'David Libre' },
]

// Map field name → display text
function getFieldText(field) {
  const map = {
    groomName:    fields.value.groomName,
    brideName:    fields.value.brideName,
    groomParents: fields.value.groomParents,
    brideParents: fields.value.brideParents,
    date:         fields.value.date ? formatDate(fields.value.date) : '',
    time:         fields.value.time ? formatTime(fields.value.time) : '',
    venue:        fields.value.venue,
    address:      fields.value.address,
    blessing:     fields.value.blessing,
    extraText:    fields.value.extraText,
    andSign:      '&',
  }
  return map[field] ?? ''
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return d }
}

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

// Compute Konva text node configs from template zones
const computedTextNodes = computed(() => {
  if (!template.value?.textZones) return []
  const zones = Array.isArray(template.value.textZones)
    ? template.value.textZones
    : JSON.parse(template.value.textZones)

  return zones.map(zone => {
    const text = getFieldText(zone.field)
    if (!text) return null

    const fontScaled = Math.round(zone.fontSize * (baseFontSize.value / 20))
    const maxW = Math.round(zone.maxWidth * CANVAS_W)

    // Use primary/secondary color based on zone
    let color = zone.color
    if (zone.field === 'andSign' || zone.field === 'blessing') {
      color = primaryColor.value
    } else if (zone.field === 'groomName' || zone.field === 'brideName') {
      color = secondaryColor.value
    }

    return {
      text,
      x: zone.x * CANVAS_W - maxW / 2,
      y: zone.y * CANVAS_H,
      width: maxW,
      fontSize: fontScaled,
      fontFamily: selectedFont.value || zone.fontFamily || 'Heebo',
      fill: color,
      align: 'center',
      listening: false,
    }
  }).filter(Boolean)
})

// Redraw scheduler (debounce)
let redrawTimer = null
function scheduleRedraw() {
  clearTimeout(redrawTimer)
  redrawTimer = setTimeout(() => {
    stageRef.value?.getNode()?.batchDraw?.()
  }, 50)
}

// Load bg image
function loadBgImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

// Compute scale based on container width
function computeScale() {
  if (!canvasWrapper.value) return
  const maxW = canvasWrapper.value.clientWidth - 32
  scale.value = Math.min(1, maxW / CANVAS_W)
}

// Load template + invitation data
async function loadData() {
  loadingTemplate.value = true
  loadError.value = null

  try {
    if (invitationId.value) {
      // Edit mode: load existing invitation
      const res = await api.get(`/invitations/${invitationId.value}`)
      const inv = res.data
      template.value = inv.template
      fields.value = { ...fields.value, ...inv.fields }
      selectedFont.value = inv.font || 'Heebo'
    } else if (templateId.value) {
      // New mode: load template
      const res = await api.get(`/invitations/templates/${templateId.value}`)
      template.value = res.data
    } else {
      loadError.value = 'לא נבחרה תבנית'
      return
    }

    // Load background image
    if (template.value?.imageUrl) {
      bgImage.value = await loadBgImage(template.value.imageUrl)
    }
  } catch (e) {
    loadError.value = 'שגיאה בטעינת הנתונים'
  } finally {
    loadingTemplate.value = false
    await nextTick()
    computeScale()
  }
}

async function saveInvitation() {
  if (!template.value) return
  saving.value = true
  try {
    const payload = {
      templateId: template.value.id,
      fields: fields.value,
      font: selectedFont.value,
    }

    if (invitationId.value) {
      await api.put(`/invitations/${invitationId.value}`, payload)
      showToast('ההזמנה נשמרה! ✅')
    } else {
      const res = await api.post('/invitations', payload)
      const newId = res.data.id
      showToast('ההזמנה נוצרה! 🎉')
      router.replace(`/app/invitations/edit/${newId}`)
    }
  } catch {
    showToast('שגיאה בשמירה', 'error')
  } finally {
    saving.value = false
  }
}

async function downloadPdf() {
  if (!invitationId.value) {
    showToast('שמור את ההזמנה תחילה', 'error')
    return
  }
  downloading.value = true
  try {
    const res = await api.get(`/invitations/${invitationId.value}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `invitation-${invitationId.value}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('הורד בהצלחה! 📥')
  } catch {
    showToast('שגיאה בהורדה', 'error')
  } finally {
    downloading.value = false
  }
}

function copyShareLink() {
  if (!invitationId.value) {
    showToast('שמור את ההזמנה תחילה', 'error')
    return
  }
  const url = `${window.location.origin}/invitation/${invitationId.value}`
  navigator.clipboard.writeText(url).then(() => {
    showToast('הקישור הועתק! 🔗')
  }).catch(() => {
    showToast('שגיאה בהעתקה', 'error')
  })
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

// Resize handler
function onResize() {
  computeScale()
}

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', onResize)
})

import { onUnmounted } from 'vue'
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.builder-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--topbar-height));
  padding-bottom: var(--space-4);
}

.builder-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.builder-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  flex: 1;
}

.header-actions { display: flex; gap: var(--space-3); }

.builder-layout {
  display: flex;
  gap: var(--space-6);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Sidebar */
.builder-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  scrollbar-width: thin;
}

.form-section {
  margin-bottom: var(--space-5);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: var(--space-3);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.form-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-family: inherit;
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color var(--transition-fast);
  direction: rtl;
  text-align: right;
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

textarea.form-input { resize: vertical; min-height: 60px; }

.range-input {
  width: 100%;
  accent-color: var(--color-primary);
  cursor: pointer;
  margin-top: var(--space-1);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}
.form-row .form-group { flex: 1; }

.color-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  padding: 2px;
  background: var(--color-bg);
}

.sidebar-actions {
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Canvas */
.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
  min-width: 0;
}

.canvas-wrapper {
  width: 100%;
  max-width: 640px;
  padding: var(--space-4);
  box-sizing: border-box;
}

.canvas-stage-wrap {
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  margin: 0 auto;
}

.canvas-hint {
  margin-top: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-align: center;
}

/* Loaders */
.loading-center { display: flex; justify-content: center; padding: var(--space-12); }
.error-card { text-align: center; padding: var(--space-8); }

/* Toast */
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  z-index: 9999;
  box-shadow: var(--shadow-lg);
  animation: slide-up 0.3s ease;
}
.toast.error { background: #e55; }
@keyframes slide-up {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Responsive */
@media (max-width: 900px) {
  .builder-layout {
    flex-direction: column;
    overflow: visible;
    height: auto;
  }
  .builder-sidebar {
    width: 100%;
  }
  .builder-view { height: auto; }
}
</style>
