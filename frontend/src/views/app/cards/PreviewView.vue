<template>
  <div class="preview-view" dir="rtl">

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>

    <!-- Toolbar -->
    <div class="preview-toolbar">
      <router-link to="/app/cards" class="back-btn">← חזור לגלריה</router-link>
      <div v-if="template" class="toolbar-title">
        <span class="template-chip">{{ template.name }}</span>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-outline btn-sm" @click="downloadPDF">📄 הורד PDF</button>
        <button class="btn btn-outline btn-sm" @click="shareLink">🔗 שתף קישור</button>
        <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
          {{ saving ? 'שומר...' : '💾 שמור שינויים' }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-layout">
      <div class="skel-panel">
        <div class="skel-line skel-pulse" style="width:40%;height:20px;margin-bottom:20px"></div>
        <div v-for="i in 5" :key="i" class="skel-field skel-pulse"></div>
      </div>
      <div class="skel-card skel-pulse"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box">
      <div class="state-icon">⚠️</div>
      <h3>שגיאה בטעינת התבנית</h3>
      <p>{{ error }}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button @click="load" class="btn btn-outline">נסה שוב</button>
        <router-link to="/app/cards" class="btn btn-primary">חזור לגלריה</router-link>
      </div>
    </div>

    <!-- Main editor -->
    <div v-else-if="template" class="editor-layout">

      <!-- Left panel: form fields -->
      <aside class="form-panel">
        <h2 class="panel-title">✏️ ערוך פרטים</h2>

        <div class="form-section">
          <h3 class="section-label">💑 שמות הזוג</h3>
          <div class="field-group">
            <label class="field-label">שם החתן</label>
            <input v-model="form.name1" class="field-input" type="text" placeholder="שם החתן" @input="debouncedPreview" />
          </div>
          <div class="field-group">
            <label class="field-label">שם הכלה</label>
            <input v-model="form.name2" class="field-input" type="text" placeholder="שם הכלה" @input="debouncedPreview" />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-label">📅 תאריך ומקום</h3>
          <div class="field-group">
            <label class="field-label">תאריך החתונה</label>
            <input v-model="form.weddingDate" class="field-input" type="date" @input="debouncedPreview" />
          </div>
          <div class="field-group">
            <label class="field-label">שם האולם</label>
            <input v-model="form.venue" class="field-input" type="text" placeholder="שם האולם / המקום" @input="debouncedPreview" />
          </div>
          <div class="field-group">
            <label class="field-label">כתובת</label>
            <input v-model="form.venueAddress" class="field-input" type="text" placeholder="כתובת מלאה" @input="debouncedPreview" />
          </div>
        </div>

        <div class="form-section" v-if="template.fields?.includes('phone')">
          <h3 class="section-label">📱 צור קשר</h3>
          <div class="field-group">
            <label class="field-label">מספר טלפון לאישור</label>
            <input v-model="form.phone" class="field-input" type="tel" placeholder="05X-XXXXXXX" @input="debouncedPreview" dir="ltr" />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-label">🔗 קישור RSVP</h3>
          <div class="rsvp-toggle">
            <label class="toggle-label">
              <input type="checkbox" v-model="form.showRsvp" class="toggle-input" @change="debouncedPreview" />
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span>הצג כפתור אישור הגעה</span>
            </label>
          </div>
          <div v-if="rsvpUrl" class="rsvp-url-box">
            <span class="rsvp-url-text">{{ rsvpUrl }}</span>
            <button class="copy-btn" @click="copyRsvpLink">העתק</button>
          </div>
        </div>

        <div class="form-section" v-if="template.fields?.includes('dresscode')">
          <h3 class="section-label">👔 קוד לבוש</h3>
          <div class="field-group">
            <input v-model="form.dresscode" class="field-input" type="text" placeholder="לבוש מסיבתי / שמרני..." @input="debouncedPreview" />
          </div>
        </div>

        <div class="save-row">
          <button class="btn btn-primary save-btn" :disabled="saving" @click="save">
            {{ saving ? '...' : '💾 שמור שינויים' }}
          </button>
          <span v-if="savedAt" class="saved-hint">נשמר {{ savedAt }}</span>
        </div>
      </aside>

      <!-- Right panel: live card mockup -->
      <main class="card-canvas-wrap">
        <div class="canvas-label">תצוגה מקדימה</div>
        <div
          class="card-canvas"
          :class="{ 'landscape': template.layout === 'landscape' }"
          :style="{ background: template.bgColor, fontFamily: template.fontFamily + ', sans-serif' }"
        >
          <!-- Decorative border accent -->
          <div class="canvas-accent" :style="{ background: template.accentColor }"></div>

          <div class="canvas-body">
            <!-- Couple names -->
            <div class="canvas-couple" :style="{ color: template.primaryColor }">
              {{ form.name1 || 'שם החתן' }}
              <span class="heart-sep" :style="{ color: template.accentColor }">❤</span>
              {{ form.name2 || 'שם הכלה' }}
            </div>

            <!-- Invitation text -->
            <div class="canvas-invite" :style="{ color: template.accentColor }">
              מתכבדים להזמינכם לחתונתנו
            </div>

            <div class="canvas-divider" :style="{ background: template.accentColor }"></div>

            <!-- Date -->
            <div v-if="form.weddingDate" class="canvas-date" :style="{ color: template.primaryColor }">
              {{ formatDateHe(form.weddingDate) }}
              <br>
              <span style="font-size:0.85em;opacity:0.8">{{ formatDateEn(form.weddingDate) }}</span>
            </div>
            <div v-else class="canvas-date" :style="{ color: template.primaryColor, opacity: 0.45 }">
              תאריך החתונה
            </div>

            <!-- Venue -->
            <div class="canvas-venue" :style="{ color: template.primaryColor, opacity: 0.75 }">
              {{ form.venue || 'שם האולם' }}
              <span v-if="form.venueAddress"> | {{ form.venueAddress }}</span>
            </div>

            <!-- Phone -->
            <div v-if="form.phone && template.fields?.includes('phone')" class="canvas-phone" :style="{ color: template.primaryColor, opacity: 0.65 }">
              לאישור הגעה: {{ form.phone }}
            </div>

            <!-- Dresscode -->
            <div v-if="form.dresscode" class="canvas-dresscode" :style="{ color: template.accentColor }">
              👔 {{ form.dresscode }}
            </div>

            <!-- RSVP Button -->
            <div v-if="form.showRsvp" class="canvas-rsvp-btn" :style="{ background: template.primaryColor }">
              ✅ אישור הגעה
            </div>
          </div>

          <div class="canvas-accent-bottom" :style="{ background: template.accentColor }"></div>
        </div>

        <!-- Template info chips -->
        <div class="canvas-chips">
          <span v-if="template.premium" class="chip premium">👑 פרמיום</span>
          <span v-if="template.popular" class="chip popular">⭐ פופולרי</span>
          <span class="chip">{{ template.layout === 'portrait' ? '📄 לאורך' : '📋 לרוחב' }}</span>
          <button class="change-template-btn" @click="$router.push('/app/cards')">החלף תבנית</button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const template = ref(null)
const loading = ref(false)
const error = ref(null)
const saving = ref(false)
const savedAt = ref(null)
const toast = ref(null)

const form = ref({
  name1: '',
  name2: '',
  weddingDate: '',
  venue: '',
  venueAddress: '',
  phone: '',
  showRsvp: true,
  dresscode: '',
  rsvpToken: ''
})

const rsvpUrl = computed(() => {
  if (!form.value.rsvpToken) return ''
  return `${window.location.origin}/rsvp/${form.value.rsvpToken}`
})

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3200)
}

// Debounce helper for live preview updates
let debounceTimer = null
function debouncedPreview() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { /* reactive form already drives the mockup */ }, 200)
}

function formatDateEn(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

function formatDateHe(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return dateStr }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/cards/preview/' + route.params.id, {
      headers: { Authorization: 'Bearer ' + auth.token }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה בטעינת התבנית')
    }
    const data = await res.json()
    template.value = data.template
    const s = data.settings
    form.value = {
      name1: s.name1 || '',
      name2: s.name2 || '',
      weddingDate: s.weddingDate ? new Date(s.weddingDate).toISOString().split('T')[0] : '',
      venue: s.venue || '',
      venueAddress: s.venueAddress || '',
      phone: '',
      showRsvp: true,
      dresscode: '',
      rsvpToken: s.rsvpToken || ''
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const res = await fetch('/api/cards/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
      body: JSON.stringify({
        name1: form.value.name1,
        name2: form.value.name2,
        weddingDate: form.value.weddingDate || null,
        venue: form.value.venue,
        venueAddress: form.value.venueAddress
      })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה בשמירה')
    }
    const now = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    savedAt.value = `בשעה ${now}`
    showToast('✅ השינויים נשמרו בהצלחה')
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

function downloadPDF() {
  showToast('בקרוב 🎉 — ייצוא PDF מגיע בגרסה הבאה')
}

async function shareLink() {
  if (!rsvpUrl.value) {
    showToast('אין קישור RSVP — ודא שנשמרת', 'error')
    return
  }
  await copyRsvpLink()
}

async function copyRsvpLink() {
  try {
    await navigator.clipboard.writeText(rsvpUrl.value)
    showToast('📋 הקישור הועתק ללוח')
  } catch {
    showToast('לא ניתן להעתיק — נסה ידנית', 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.preview-view { max-width: 1200px; margin: 0 auto; padding: var(--space-6); }

/* Toast */
.toast { position: fixed; top: var(--space-4); left: 50%; transform: translateX(-50%); z-index: 999; background: #22C55E; color: white; padding: var(--space-3) var(--space-6); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; box-shadow: var(--shadow-lg); pointer-events: none; white-space: nowrap; }
.toast.error { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-10px); }

/* Toolbar */
.preview-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3); background: white; padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); }
.back-btn { color: var(--color-primary); text-decoration: none; font-weight: 700; font-size: var(--font-size-sm); display: flex; align-items: center; gap: var(--space-1); }
.back-btn:hover { text-decoration: underline; }
.toolbar-title { flex: 1; text-align: center; }
.template-chip { background: var(--color-primary-light); color: var(--color-primary); font-size: var(--font-size-xs); font-weight: 700; padding: 4px 12px; border-radius: var(--radius-full); }
.toolbar-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* Loading skeletons */
.loading-layout { display: grid; grid-template-columns: 340px 1fr; gap: var(--space-8); }
.skel-panel { display: flex; flex-direction: column; gap: var(--space-3); }
.skel-field { height: 44px; border-radius: var(--radius); }
.skel-card { border-radius: var(--radius-2xl); min-height: 500px; }
.skel-line { border-radius: 6px; }
.skel-pulse { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { background-position: 200%; } 100% { background-position: -200%; } }

/* State box */
.state-box { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.state-icon { font-size: 2.5rem; }
.state-box h3 { color: var(--color-navy); font-weight: 700; margin: 0; }
.state-box p { color: var(--color-text-muted); margin: 0; }

/* Editor layout */
.editor-layout { display: grid; grid-template-columns: 340px 1fr; gap: var(--space-8); align-items: start; }

/* Form panel */
.form-panel { background: white; border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); position: sticky; top: var(--space-4); }
.panel-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-5); }
.form-section { margin-bottom: var(--space-5); padding-bottom: var(--space-5); border-bottom: 1px solid var(--color-border); }
.form-section:last-of-type { border-bottom: none; }
.section-label { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 var(--space-3); }
.field-group { margin-bottom: var(--space-3); }
.field-label { display: block; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-navy); margin-bottom: 6px; }
.field-input { width: 100%; padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: var(--font-size-sm); color: var(--color-navy); background: var(--color-bg-subtle, #f9f9fb); transition: border-color 0.15s; box-sizing: border-box; }
.field-input:focus { outline: none; border-color: var(--color-primary); background: white; }

/* RSVP Toggle */
.rsvp-toggle { margin-bottom: var(--space-3); }
.toggle-label { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-navy); }
.toggle-input { display: none; }
.toggle-track { position: relative; width: 44px; height: 24px; background: var(--color-border); border-radius: 12px; transition: background 0.2s; flex-shrink: 0; }
.toggle-input:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: var(--shadow-xs); }
.toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(-20px); }
.rsvp-url-box { display: flex; align-items: center; gap: var(--space-2); background: var(--color-bg-subtle, #f9f9fb); border-radius: var(--radius); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); }
.rsvp-url-text { font-size: var(--font-size-xs); color: var(--color-text-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; text-align: left; }
.copy-btn { font-size: var(--font-size-xs); font-weight: 700; font-family: inherit; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); padding: 3px 10px; cursor: pointer; flex-shrink: 0; }

/* Save row */
.save-row { display: flex; align-items: center; gap: var(--space-3); padding-top: var(--space-4); flex-wrap: wrap; }
.save-btn { flex: 1; justify-content: center; }
.saved-hint { font-size: var(--font-size-xs); color: #22C55E; font-weight: 600; }

/* Card canvas */
.card-canvas-wrap { display: flex; flex-direction: column; align-items: center; }
.canvas-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); margin-bottom: var(--space-3); text-transform: uppercase; letter-spacing: 1px; }

.card-canvas {
  width: 100%;
  max-width: 420px;
  min-height: 560px;
  border-radius: var(--radius-2xl);
  box-shadow: 0 24px 60px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.card-canvas.landscape {
  max-width: 600px;
  min-height: 380px;
}

.canvas-accent { height: 8px; width: 100%; flex-shrink: 0; }
.canvas-accent-bottom { height: 8px; width: 100%; flex-shrink: 0; margin-top: auto; }

.canvas-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-10) var(--space-8);
  gap: var(--space-3);
}

.canvas-couple { font-size: 1.75rem; font-weight: 900; line-height: 1.2; }
.heart-sep { margin: 0 var(--space-2); }
.canvas-invite { font-size: 0.82rem; letter-spacing: 0.5px; opacity: 0.85; }
.canvas-divider { height: 1.5px; width: 70px; border-radius: 1px; }
.canvas-date { font-size: 1rem; font-weight: 700; line-height: 1.5; }
.canvas-venue { font-size: 0.82rem; }
.canvas-phone { font-size: 0.78rem; direction: ltr; }
.canvas-dresscode { font-size: 0.78rem; font-weight: 600; }
.canvas-rsvp-btn {
  color: white;
  padding: 10px 28px;
  border-radius: 100px;
  font-size: 0.88rem;
  font-weight: 700;
  margin-top: var(--space-2);
  cursor: default;
}

/* Canvas chips */
.canvas-chips { display: flex; gap: var(--space-2); margin-top: var(--space-4); flex-wrap: wrap; align-items: center; }
.chip { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
.chip.premium { background: #fef3c7; color: #92400e; }
.chip.popular { background: var(--color-primary-light); color: var(--color-primary); }
.chip:not(.premium):not(.popular) { background: #f3f4f6; color: #6b7280; }
.change-template-btn { font-size: var(--font-size-xs); font-weight: 600; font-family: inherit; background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); border-radius: var(--radius-full); padding: 3px 12px; cursor: pointer; transition: all 0.15s; }
.change-template-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 900px) {
  .editor-layout { grid-template-columns: 1fr; }
  .form-panel { position: static; }
  .card-canvas-wrap { margin-top: var(--space-4); }
  .loading-layout { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .preview-view { padding: var(--space-4); }
  .preview-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-actions { width: 100%; justify-content: flex-end; }
}
</style>
