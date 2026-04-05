<template>
  <div class="rsvp-design fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">🎨 עיצוב עמוד RSVP</h1>
        <p class="page-sub">כך ייראה הדף שהאורחים פותחים כשמגיע להם הלינק</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="openPreview">👁 צפה בלינק האמיתי</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving">שומר...</span>
          <span v-else>💾 שמור</span>
        </button>
      </div>
    </div>

    <!-- Save feedback -->
    <div v-if="saveSuccess" class="toast-success">✅ נשמר בהצלחה!</div>

    <!-- Main layout -->
    <div class="design-layout">

      <!-- ── Controls panel ───────────────────────── -->
      <div class="controls-panel">

        <!-- Greeting -->
        <section class="ctrl-section card">
          <div class="card-body">
            <div class="ctrl-section-header">
              <span class="ctrl-icon">💬</span>
              <div>
                <h3 class="ctrl-title">הודעת פתיחה לאורחים</h3>
                <p class="ctrl-sub">טקסט אישי שמופיע מעל טופס האישור</p>
              </div>
            </div>
            <textarea
              v-model="form.rsvpGreeting"
              class="ctrl-textarea"
              placeholder="לדוגמה: שמחים להזמין אתכם לאירוע המיוחד שלנו! 🎉&#10;נשמח לראות אתכם."
              rows="3"
              maxlength="300"
            />
            <div class="char-count">{{ form.rsvpGreeting?.length || 0 }} / 300</div>
          </div>
        </section>

        <!-- Background color -->
        <section class="ctrl-section card">
          <div class="card-body">
            <div class="ctrl-section-header">
              <span class="ctrl-icon">🎨</span>
              <div>
                <h3 class="ctrl-title">צבע רקע</h3>
                <p class="ctrl-sub">צבע הרקע של עמוד ה-RSVP</p>
              </div>
            </div>
            <div class="color-presets">
              <button
                v-for="c in bgPresets"
                :key="c.value"
                class="color-swatch"
                :class="{ active: form.rsvpBgColor === c.value }"
                :style="{ background: c.value }"
                :title="c.label"
                @click="form.rsvpBgColor = c.value; form.rsvpBgImage = ''"
              />
            </div>
            <div class="custom-color-row">
              <label class="ctrl-label-sm">צבע מותאם אישית</label>
              <div class="color-input-wrap">
                <input type="color" v-model="form.rsvpBgColor" class="color-native" @input="form.rsvpBgImage = ''" />
                <input type="text" v-model="form.rsvpBgColor" class="color-text" placeholder="#F7F5F2" @input="form.rsvpBgImage = ''" />
              </div>
            </div>
          </div>
        </section>

        <!-- Accent color -->
        <section class="ctrl-section card">
          <div class="card-body">
            <div class="ctrl-section-header">
              <span class="ctrl-icon">✨</span>
              <div>
                <h3 class="ctrl-title">צבע הדגשה</h3>
                <p class="ctrl-sub">צבע החץ וגבולות הפוקוס</p>
              </div>
            </div>
            <div class="color-presets">
              <button
                v-for="c in accentPresets"
                :key="c.value"
                class="color-swatch"
                :class="{ active: form.rsvpAccentColor === c.value }"
                :style="{ background: c.value }"
                :title="c.label"
                @click="form.rsvpAccentColor = c.value"
              />
            </div>
            <div class="custom-color-row">
              <label class="ctrl-label-sm">צבע מותאם אישית</label>
              <div class="color-input-wrap">
                <input type="color" v-model="form.rsvpAccentColor" class="color-native" />
                <input type="text" v-model="form.rsvpAccentColor" class="color-text" placeholder="#E91E8C" />
              </div>
            </div>
          </div>
        </section>

        <!-- Background image -->
        <section class="ctrl-section card">
          <div class="card-body">
            <div class="ctrl-section-header">
              <span class="ctrl-icon">🖼</span>
              <div>
                <h3 class="ctrl-title">תמונת רקע</h3>
                <p class="ctrl-sub">העלו תמונה מהמחשב או הדביקו קישור</p>
              </div>
            </div>

            <!-- Upload area -->
            <div class="upload-area" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="handleDrop">
              <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="handleFileSelect" />
              <div v-if="uploading" class="upload-status">
                <div class="upload-spinner"></div>
                <span>מעלה תמונה...</span>
              </div>
              <div v-else-if="form.rsvpBgImage" class="upload-preview">
                <img :src="form.rsvpBgImage" class="upload-thumb" alt="תמונת רקע" />
                <button class="remove-img-btn" @click.stop="form.rsvpBgImage = ''">✕ הסר</button>
              </div>
              <div v-else class="upload-placeholder">
                <span class="upload-icon">📤</span>
                <span>לחצו להעלאת תמונה או גררו לכאן</span>
                <span class="upload-formats">JPG, PNG, WEBP, GIF (עד 5MB)</span>
              </div>
            </div>

            <!-- Or URL -->
            <div class="url-divider">
              <span>או הדביקו קישור</span>
            </div>
            <input
              v-model="form.rsvpBgImage"
              type="url"
              class="ctrl-input"
              placeholder="https://..."
              dir="ltr"
            />
            <p class="ctrl-hint">אם הוגדרה תמונת רקע, צבע הרקע יוסתר</p>
          </div>
        </section>

      </div>

      <!-- ── Live preview ──────────────────────────── -->
      <div class="preview-panel">
        <div class="preview-label">תצוגה מקדימה</div>
        <div class="phone-frame">
          <div class="phone-screen" :style="previewBgStyle">

            <!-- Invitation image placeholder -->
            <div class="prev-inv-card">
              <div class="prev-inv-placeholder" v-if="!couplePhoto">
                <div class="prev-couple-icon">💍</div>
                <div class="prev-couple-names">{{ coupleName }}</div>
                <div class="prev-date" v-if="weddingDateFormatted">{{ weddingDateFormatted }}</div>
              </div>
              <img v-else :src="couplePhoto" class="prev-inv-img" alt="תמונה" />
            </div>

            <!-- Names & date -->
            <div class="prev-event-title" v-if="coupleName">
              <strong>{{ coupleName }}</strong>
              <span v-if="weddingDateFormatted" class="prev-date-row">{{ weddingDateFormatted }}</span>
            </div>

            <!-- Greeting -->
            <div v-if="form.rsvpGreeting" class="prev-greeting">
              <p>{{ form.rsvpGreeting }}</p>
            </div>

            <!-- Arrow -->
            <div class="prev-arrow" :style="{ background: form.rsvpAccentColor || '#E91E8C' }">⌄</div>

            <!-- RSVP Form mock -->
            <div class="prev-form">
              <div class="prev-field">
                <div class="prev-label">שם האורחים</div>
                <div class="prev-input-mock" />
              </div>
              <div class="prev-field">
                <div class="prev-label">כמה אנשים?</div>
                <div class="prev-counter-mock">
                  <div class="prev-counter-btn">+</div>
                  <div class="prev-counter-num">1</div>
                  <div class="prev-counter-btn">−</div>
                </div>
              </div>
              <div class="prev-buttons">
                <div class="prev-btn prev-btn-no" :style="{ background: '#DC2626' }">לא מגיע/ה</div>
                <div class="prev-btn prev-btn-yes">מגיע/ה ✓</div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const saving = ref(false)
const uploading = ref(false)
const saveSuccess = ref(false)
const loading = ref(true)

const form = reactive({
  rsvpGreeting: '',
  rsvpBgColor: '#F7F5F2',
  rsvpBgImage: '',
  rsvpAccentColor: '#E91E8C'
})

// ── Presets ────────────────────────────────────────────────────────────────────
const bgPresets = [
  { value: '#F7F5F2', label: 'שמנת' },
  { value: '#FFF0F5', label: 'ורוד בהיר' },
  { value: '#F0F4FF', label: 'כחול בהיר' },
  { value: '#F0FFF4', label: 'ירוק בהיר' },
  { value: '#FFFBEB', label: 'שמנת-צהוב' },
  { value: '#F5F0FF', label: 'סגול בהיר' },
  { value: '#1A1F36', label: 'כהה' },
  { value: '#FFFFFF', label: 'לבן' }
]

const accentPresets = [
  { value: '#E91E8C', label: 'ורוד' },
  { value: '#FF407D', label: 'פוקסיה' },
  { value: '#1B3C73', label: 'נייבי' },
  { value: '#3B82F6', label: 'כחול' },
  { value: '#22C55E', label: 'ירוק' },
  { value: '#F59E0B', label: 'זהב' },
  { value: '#8B5CF6', label: 'סגול' },
  { value: '#EF4444', label: 'אדום' }
]

// ── Couple info for preview ────────────────────────────────────────────────────
const couplePhoto = computed(() => auth.user?.profileImageUrl || null)
const coupleName = computed(() => {
  const n1 = auth.user?.name1 || ''
  const n2 = auth.user?.name2 || ''
  if (n1 && n2) return `${n1} ❤️ ${n2}`
  return n1 || n2 || 'שם החתן ❤️ שם הכלה'
})
const weddingDateFormatted = computed(() => {
  if (!auth.user?.weddingDate) return ''
  try {
    return new Date(auth.user.weddingDate).toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch { return '' }
})

// ── Preview background style ──────────────────────────────────────────────────
const previewBgStyle = computed(() => {
  if (form.rsvpBgImage) {
    return {
      backgroundImage: `url(${form.rsvpBgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return { background: form.rsvpBgColor || '#F7F5F2' }
})

// ── API ───────────────────────────────────────────────────────────────────────
async function load() {
  try {
    const res = await api.get('/users/rsvp-design')
    if (res.data) {
      form.rsvpGreeting = res.data.rsvpGreeting || ''
      form.rsvpBgColor = res.data.rsvpBgColor || '#F7F5F2'
      form.rsvpBgImage = res.data.rsvpBgImage || ''
      form.rsvpAccentColor = res.data.rsvpAccentColor || '#E91E8C'
    }
  } catch (e) {
    console.warn('rsvp-design load error', e)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await api.put('/users/rsvp-design', {
      rsvpGreeting: form.rsvpGreeting || null,
      rsvpBgColor: form.rsvpBgColor || null,
      rsvpBgImage: form.rsvpBgImage || null,
      rsvpAccentColor: form.rsvpAccentColor || null
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e) {
    console.error('rsvp-design save error', e)
  } finally {
    saving.value = false
  }
}

async function openPreview() {
  let token = auth.user?.rsvpToken
  // Fallback: refetch user if the token isn't loaded yet
  if (!token) {
    try {
      const res = await api.get('/auth/me')
      token = res.data?.rsvpToken
      if (auth.user && token) auth.user.rsvpToken = token
    } catch (e) {
      console.error('openPreview: failed to fetch user', e)
    }
  }
  if (!token) {
    alert('לא הצלחנו למצוא את הלינק שלך. נסה לרענן את הדף.')
    return
  }
  const url = `${window.location.origin}/rsvp/${token}`
  const win = window.open(url, '_blank', 'noopener,noreferrer')
  if (!win) {
    // Popup blocked — fall back to same-tab navigation
    window.location.href = url
  }
}

async function uploadFile(file) {
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('הקובץ גדול מדי. מקסימום 5MB')
    return
  }
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/users/upload-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.rsvpBgImage = res.data.url
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בהעלאת התמונה')
  } finally {
    uploading.value = false
  }
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) uploadFile(file)
  e.target.value = ''
}

function handleDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) uploadFile(file)
}

onMounted(load)
</script>

<style scoped>
.rsvp-design {
  padding: var(--space-6);
}

/* ── Header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
}
.page-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: 4px;
}
.header-actions {
  display: flex;
  gap: var(--space-3);
  flex-shrink: 0;
  align-items: center;
}

/* ── Toast ──────────────────────────────────────────── */
.toast-success {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #22C55E;
  color: #fff;
  padding: 10px 24px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(34, 197, 94, 0.35);
  animation: slideDown 0.3s ease;
}
@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0);     opacity: 1; }
}

/* ── Layout ─────────────────────────────────────────── */
.design-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-6);
  align-items: start;
}

/* ── Controls ───────────────────────────────────────── */
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ctrl-section-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.ctrl-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}
.ctrl-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-navy);
}
.ctrl-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.ctrl-textarea {
  width: 100%;
  padding: 12px var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  resize: vertical;
  outline: none;
  direction: rtl;
  line-height: 1.6;
  transition: border-color var(--transition-fast);
}
.ctrl-textarea:focus {
  border-color: var(--color-primary);
  background: #fff;
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: left;
  margin-top: 4px;
}

.ctrl-label-sm {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  display: block;
  margin-bottom: var(--space-2);
}

.color-presets {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}
.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  outline: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.active { border-color: var(--color-navy); transform: scale(1.1); }

.custom-color-row { margin-top: var(--space-2); }
.color-input-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.color-native {
  width: 44px;
  height: 36px;
  padding: 2px;
  border: 1.5px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}
.color-text {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: var(--color-bg);
  direction: ltr;
  outline: none;
  transition: border-color var(--transition-fast);
}
.color-text:focus { border-color: var(--color-primary); }

.ctrl-input {
  width: 100%;
  padding: 11px var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  direction: ltr;
  transition: border-color var(--transition-fast);
}
.ctrl-input:focus { border-color: var(--color-primary); background: #fff; }

/* Upload area */
.hidden-input { display: none; }
.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg, 12px);
  padding: var(--space-5);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: var(--space-3);
}
.upload-area:hover { border-color: var(--color-primary); background: var(--color-primary-light, #FFF0F5); }
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.upload-icon { font-size: 2rem; }
.upload-formats { font-size: var(--font-size-xs); opacity: 0.7; }
.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.upload-thumb {
  max-width: 200px;
  max-height: 120px;
  object-fit: cover;
  border-radius: var(--radius);
}
.remove-img-btn {
  background: none;
  border: 1px solid var(--color-error, #EF4444);
  color: var(--color-error, #EF4444);
  border-radius: var(--radius-full);
  padding: 4px 14px;
  font-size: var(--font-size-xs);
  font-family: var(--font);
  cursor: pointer;
  font-weight: 600;
}
.remove-img-btn:hover { background: var(--color-error, #EF4444); color: #fff; }
.upload-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  color: var(--color-primary);
  font-weight: 600;
}
.upload-spinner {
  width: 20px; height: 20px;
  border: 2.5px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.url-divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-3) 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.url-divider::before, .url-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.ctrl-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

/* ── Preview panel ──────────────────────────────────── */
.preview-panel {
  position: sticky;
  top: 24px;
}
.preview-label {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

/* Phone frame */
.phone-frame {
  width: 280px;
  margin: 0 auto;
  background: #1A1F36;
  border-radius: 36px;
  padding: 12px 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.08);
}
.phone-screen {
  border-radius: 28px;
  overflow: hidden;
  max-height: 580px;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 12px 10px 20px;
  direction: rtl;
  font-family: 'Heebo', sans-serif;
  transition: background 0.3s;
}
.phone-screen::-webkit-scrollbar { display: none; }

/* Preview elements */
.prev-inv-card {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #fff;
  aspect-ratio: 3/4;
  max-height: 160px;
}
.prev-inv-placeholder {
  height: 100%;
  background: linear-gradient(145deg, #1A1F36 0%, #2D3561 55%, #E91E8C 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  gap: 4px;
  text-align: center;
  color: #fff;
}
.prev-couple-icon { font-size: 22px; }
.prev-couple-names { font-size: 11px; font-weight: 700; line-height: 1.3; }
.prev-date { font-size: 9px; opacity: 0.8; }
.prev-inv-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.prev-event-title {
  text-align: center;
  margin-bottom: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.prev-event-title strong { font-size: 11px; font-weight: 800; color: #1A1F36; }
.prev-date-row { font-size: 9px; color: #666; }

.prev-greeting {
  text-align: center;
  background: rgba(255,255,255,0.7);
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 6px;
  backdrop-filter: blur(4px);
}
.prev-greeting p {
  font-size: 9px;
  line-height: 1.5;
  color: #1A1F36;
  white-space: pre-line;
}

.prev-arrow {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  margin: 0 auto 8px;
  transition: background 0.3s;
}

.prev-form {
  background: #fff;
  border-radius: 10px;
  padding: 12px 10px;
}
.prev-field { margin-bottom: 8px; }
.prev-label { font-size: 8px; font-weight: 700; color: #1A1F36; margin-bottom: 4px; }
.prev-input-mock {
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid #E5E7EB;
  background: #F9FAFB;
}
.prev-counter-mock {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.prev-counter-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #1A1F36;
}
.prev-counter-num {
  font-size: 12px;
  font-weight: 700;
  color: #1A1F36;
  min-width: 16px;
  text-align: center;
}
.prev-buttons {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}
.prev-btn {
  flex: 1;
  padding: 7px 4px;
  border-radius: 6px;
  font-size: 7.5px;
  font-weight: 700;
  color: #fff;
  text-align: center;
}
.prev-btn-no { order: 1; }
.prev-btn-yes { order: 2; background: #22C55E; }

/* ── Buttons ─────────────────────────────────────────── */
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
.btn-primary {
  background: var(--color-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline {
  background: transparent;
  color: var(--color-navy);
  border: 1.5px solid var(--color-border);
}
.btn-outline:hover { border-color: var(--color-navy); background: var(--color-bg); }
.btn-sm { padding: 8px var(--space-4); font-size: var(--font-size-xs); }

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 900px) {
  .design-layout {
    grid-template-columns: 1fr;
  }
  .preview-panel {
    position: static;
    order: -1;
  }
}
@media (max-width: 600px) {
  .rsvp-design { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .header-actions { width: 100%; }
  .btn { flex: 1; justify-content: center; }
}
</style>
