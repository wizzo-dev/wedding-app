<template>
  <div class="rsvp-page" dir="rtl">

    <!-- Invitation image card -->
    <div class="inv-card">
      <button class="zoom-btn" @click="zoomOpen = true" v-if="imageUrl" aria-label="הגדל תמונה">⊕</button>

      <!-- Real image (invitation template or couple photo) -->
      <img v-if="imageUrl" :src="imageUrl" class="inv-img" alt="הזמנה" />

      <!-- Gradient placeholder when no image -->
      <div v-else class="inv-placeholder">
        <div class="placeholder-inner">
          <div class="placeholder-icon">💍</div>
          <h2 class="placeholder-names" v-if="couple.name1 || couple.name2">
            {{ couple.name1 }}<span v-if="couple.name1 && couple.name2"> ❤️ </span>{{ couple.name2 }}
          </h2>
          <h2 class="placeholder-names" v-else>אישור הגעה</h2>
          <p class="placeholder-date" v-if="formattedDate">{{ formattedDate }}</p>
          <p class="placeholder-venue" v-if="couple.venue">📍 {{ couple.venue }}</p>
        </div>
      </div>
    </div>

    <!-- Fullscreen zoom overlay -->
    <Teleport to="body">
      <div v-if="zoomOpen" class="zoom-overlay" @click="zoomOpen = false">
        <img :src="imageUrl" alt="הזמנה מוגדלת" @click.stop />
        <button class="zoom-close" @click="zoomOpen = false" aria-label="סגור">✕</button>
      </div>
    </Teleport>

    <!-- Event title -->
    <div class="event-title" v-if="couple.name1 || couple.name2">
      <h1>{{ couple.name1 }}<span v-if="couple.name1 && couple.name2"> ❤️ </span>{{ couple.name2 }}</h1>
      <p class="event-details">
        <span v-if="formattedDate">{{ formattedDate }}</span>
        <span v-if="couple.weddingTime"> | {{ couple.weddingTime }}</span>
        <span v-if="couple.venue"> | {{ couple.venue }}</span>
      </p>
    </div>

    <!-- Scroll-down arrow -->
    <button class="scroll-arrow" @click="scrollToForm" aria-label="גלול לטופס">⌄</button>

    <!-- RSVP Form -->
    <div class="rsvp-form" ref="formRef">

      <!-- Load error -->
      <div v-if="loadError" class="state-box error-box">
        <div class="state-icon">💔</div>
        <h2>הקישור לא תקין</h2>
        <p>לא מצאנו הזמנה עם הקוד שסופק.</p>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="loading" class="skeleton-wrap">
        <div class="skel skel-line" />
        <div class="skel skel-line short" />
        <div class="skel skel-line" />
      </div>

      <!-- Success state -->
      <div v-else-if="submitted" class="state-box success-box">
        <div class="state-icon">✅</div>
        <h2>תודה {{ form.name }}!</h2>
        <p>{{ successMessage }}</p>
      </div>

      <!-- Form fields -->
      <template v-else>
        <div class="form-group">
          <label>שם האורחים</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="לדוגמה: אור ועדי כהן"
            class="form-input"
            autocomplete="name"
          />
        </div>

        <div class="form-group people-group">
          <label>כמה אנשים?</label>
          <div class="people-counter">
            <button class="counter-btn" @click="form.numPeople = Math.min(20, form.numPeople + 1)" aria-label="הוסף">+</button>
            <span class="counter-num">{{ form.numPeople }}</span>
            <button class="counter-btn" @click="form.numPeople = Math.max(1, form.numPeople - 1)" aria-label="הפחת">−</button>
          </div>
        </div>

        <div class="form-group">
          <label>מספר טלפון</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="050-000-0000"
            class="form-input"
            dir="ltr"
            autocomplete="tel"
          />
        </div>

        <div class="rsvp-buttons">
          <button class="rsvp-btn btn-no"    :disabled="sending" @click="submit('declined')">לא מגיע/ה</button>
          <button class="rsvp-btn btn-yes"   :disabled="sending" @click="submit('confirmed')">מגיע/ה</button>
          <button class="rsvp-btn btn-maybe" :disabled="sending" @click="submit('maybe')">אולי מגיע/ה</button>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// State
const couple      = ref({})
const invitation  = ref(null)
const loading     = ref(false)
const loadError   = ref(false)
const zoomOpen    = ref(false)
const submitted   = ref(false)
const sending     = ref(false)
const error       = ref('')
const lastStatus  = ref('')
const formRef     = ref(null)

const form = reactive({
  name:       '',
  phone:      '',
  numPeople:  1,
})

// Computed

/**
 * Only use images that come from our own server:
 * 1. invitation.templateImageUrl  (from DB)
 * 2. couple.couplePhoto           (from DB)
 * No external fallbacks.
 */
const imageUrl = computed(() => {
  return invitation.value?.templateImageUrl || couple.value?.couplePhoto || null
})

const formattedDate = computed(() => {
  if (!couple.value?.weddingDate) return ''
  return new Date(couple.value.weddingDate).toLocaleDateString('he-IL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
})

const successMessage = computed(() => {
  if (lastStatus.value === 'confirmed') return 'נרשמת! נתראה בחתונה 🎉'
  if (lastStatus.value === 'declined')  return 'תודה שעדכנת. יהיה חסר לנו! 💙'
  return 'תודה! נחכה לעדכון סופי 🙏'
})

// Methods
function scrollToForm() {
  formRef.value?.scrollIntoView({ behavior: 'smooth' })
}

async function loadEvent() {
  const code = route.params.code
  if (!code) return
  loading.value = true
  try {
    const res = await fetch(`/api/rsvp/${encodeURIComponent(code)}`)
    if (!res.ok) { loadError.value = true; return }
    const data = await res.json()
    couple.value     = data.couple     || {}
    invitation.value = data.invitation || null

    if (data.prefilledGuest) {
      form.name       = data.prefilledGuest.name       || ''
      form.phone      = data.prefilledGuest.phone      || ''
      form.numPeople  = data.prefilledGuest.numPeople  || 1
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function submit(rsvpStatus) {
  if (!form.name.trim()) { error.value = 'נא להזין שם'; return }
  sending.value = true
  error.value   = ''
  try {
    const urlCode = route.params.code
    // Use the actual rsvpToken from the loaded couple data for submit
    // (important when urlCode is a numeric group link ID, not the rsvpToken)
    const coupleToken = couple.value?.coupleToken || urlCode
    const body = {
      name:       form.name,
      phone:      form.phone      || undefined,
      numPeople:  form.numPeople,
      rsvpStatus,
      // If personal guestToken link → send code for direct guest update
      code:        prefilledGuest.value ? urlCode : undefined,
      coupleToken: !prefilledGuest.value ? coupleToken : undefined,
    }
    const res = await fetch('/api/rsvp/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      error.value = 'שגיאה בשמירה, אנא נסה שוב או צרו קשר עם הזוג'
      return
    }
    lastStatus.value = rsvpStatus
    submitted.value  = true
  } catch {
    error.value = 'שגיאת רשת, אנא נסה שוב'
  } finally {
    sending.value = false
  }
}

onMounted(loadEvent)
</script>

<style scoped>
/* ── Reset ────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page shell ───────────────────────────────────── */
.rsvp-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px 48px;
  font-family: 'Heebo', sans-serif;
  direction: rtl;
  min-height: 100vh;
  background: #F7F5F2;  /* warm almost-white, close to iv.matana.app */
  color: #1A1F36;
}

/* ── Invitation card ──────────────────────────────── */
.inv-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10);
  margin-bottom: 16px;
  background: #fff;
  /* square-ish: let the image determine height but cap it */
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: stretch;
}

.inv-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

/* ── Gradient placeholder (no image) ─────────────── */
.inv-placeholder {
  flex: 1;
  background: linear-gradient(145deg, #1A1F36 0%, #2D3561 55%, #E91E8C 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}
.placeholder-inner {
  text-align: center;
  color: #fff;
}
.placeholder-icon {
  font-size: 56px;
  margin-bottom: 16px;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}
.placeholder-names {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.placeholder-date {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 6px;
}
.placeholder-venue {
  font-size: 14px;
  opacity: 0.75;
}

/* ── Zoom button (top-left in RTL = visual left) ─── */
.zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;        /* RTL: right = visual right */
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  border: none;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 2;
  transition: transform 0.15s;
}
.zoom-btn:hover { transform: scale(1.1); }

/* ── Fullscreen zoom overlay ──────────────────────── */
.zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.93);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zoom-overlay img {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.zoom-close {
  position: fixed;
  top: 16px;
  left: 16px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: opacity 0.15s;
}
.zoom-close:hover { opacity: 0.8; }

/* ── Event title ──────────────────────────────────── */
.event-title {
  text-align: center;
  margin-bottom: 12px;
  padding: 0 8px;
}
.event-title h1 {
  font-size: 22px;
  font-weight: 800;
  color: #1A1F36;
  margin-bottom: 6px;
  line-height: 1.3;
}
.event-details {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* ── Scroll arrow ─────────────────────────────────── */
.scroll-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #3B82F6;
  color: #fff;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(59, 130, 246, 0.45);
  animation: bounce 1.6s ease-in-out infinite;
  line-height: 1;
  padding-top: 2px;  /* optical adjustment for ⌄ glyph */
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(5px); }
}

/* ── Form card ────────────────────────────────────── */
.rsvp-form {
  background: #fff;
  border-radius: 16px;
  padding: 22px 20px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.07);
}

/* ── Form groups ──────────────────────────────────── */
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #1A1F36;
  margin-bottom: 7px;
}
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #E5E7EB;
  border-radius: 10px;
  font-family: 'Heebo', sans-serif;
  font-size: 15px;
  background: #F9FAFB;
  color: #1A1F36;
  transition: border-color 0.15s, background 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #E91E8C;
  background: #fff;
}
.form-input::placeholder { color: #B0B4BE; }

/* ── People counter ───────────────────────────────── */
.people-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.counter-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #E5E7EB;
  background: #fff;
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A1F36;
  line-height: 1;
  transition: border-color 0.15s, color 0.15s;
  font-family: 'Heebo', sans-serif;
}
.counter-btn:hover {
  border-color: #E91E8C;
  color: #E91E8C;
}
.counter-num {
  font-size: 22px;
  font-weight: 700;
  color: #1A1F36;
  min-width: 28px;
  text-align: center;
}

/* ── RSVP action buttons ──────────────────────────── */
.rsvp-buttons {
  display: flex;
  gap: 8px;
  margin-top: 22px;
}
.rsvp-btn {
  flex: 1;
  padding: 13px 6px;
  border: none;
  border-radius: 10px;
  font-family: 'Heebo', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.01em;
}
.rsvp-btn:hover  { opacity: 0.92; }
.rsvp-btn:active { transform: scale(0.97); }
.rsvp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* order: RTL — right = first visually */
.btn-no    { background: #E91E8C; order: 1; }   /* declined — pink/red */
.btn-yes   { background: #22C55E; order: 2; }   /* confirmed — green  */
.btn-maybe { background: #1A1F36; order: 3; }   /* maybe — dark navy  */

/* ── State boxes (success / error / loading) ──────── */
.state-box {
  text-align: center;
  padding: 28px 16px;
}
.state-icon {
  font-size: 54px;
  margin-bottom: 14px;
  line-height: 1;
}
.state-box h2 {
  font-size: 22px;
  font-weight: 800;
  color: #1A1F36;
  margin-bottom: 8px;
}
.state-box p {
  font-size: 15px;
  color: #555;
}

.error-msg {
  color: #DC2626;
  text-align: center;
  font-size: 14px;
  margin-top: 14px;
}

/* ── Skeleton loading ─────────────────────────────── */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}
.skel {
  height: 18px;
  border-radius: 8px;
  background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
.skel-line       { width: 100%; }
.skel-line.short { width: 55%; }
@keyframes shimmer {
  0%   { background-position:  200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ───────────────────────────────────── */
@media (max-width: 360px) {
  .rsvp-btn { font-size: 12px; padding: 11px 4px; }
  .event-title h1 { font-size: 19px; }
}
</style>
