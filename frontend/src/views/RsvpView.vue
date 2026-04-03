<template>
  <div class="rsvp-page" dir="rtl">
    <div class="rsvp-bg" aria-hidden="true">
      <div v-for="i in 12" :key="i" class="petal" :style="petalStyle(i)">🌸</div>
    </div>

    <div class="rsvp-container">
      <!-- Loading -->
      <div v-if="loading" class="rsvp-card skeleton-wrap">
        <div class="skel skel-h2" />
        <div class="skel skel-line" />
        <div class="skel skel-line short" />
      </div>

      <!-- Confirmation screen -->
      <div v-else-if="submitted" class="rsvp-card confirm-card pop-in">
        <div class="confirm-emoji">{{ statusEmoji }}</div>
        <h2 class="confirm-title">{{ confirmTitle }}</h2>
        <p class="confirm-sub">{{ confirmSub }}</p>
        <div v-if="coupleData" class="confirm-couple">
          <span class="couple-name">{{ coupleData.name1 }} &amp; {{ coupleData.name2 }}</span>
          <span v-if="coupleData.weddingDate" class="couple-date">📅 {{ formatDate(coupleData.weddingDate) }}</span>
          <span v-if="coupleData.venue" class="couple-venue">📍 {{ coupleData.venue }}</span>
        </div>
        <button class="btn btn-outline" @click="reset">שלח תגובה חדשה</button>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="rsvp-card error-card">
        <div class="err-icon">💔</div>
        <h2>הקישור לא תקין</h2>
        <p>לא מצאנו הזמנה עם הקוד שסופק.</p>
      </div>

      <!-- RSVP Form -->
      <div v-else class="rsvp-card fade-in">

        <!-- Hero section -->
        <div class="rsvp-hero">
          <!-- Has invitation template -->
          <div v-if="eventData?.invitation" class="invitation-hero">
            <img :src="eventData.invitation.templateImageUrl" class="invitation-bg" alt="הזמנה" />
            <div class="invitation-overlay">
              <p class="inv-names">{{ coupleData?.name1 }} ❤️ {{ coupleData?.name2 }}</p>
              <p class="inv-date" v-if="coupleData?.weddingDate">
                {{ new Date(coupleData.weddingDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
              </p>
            </div>
          </div>

          <!-- Has couple photo, no invitation -->
          <div v-else-if="coupleData?.couplePhoto" class="couple-photo-hero">
            <img :src="coupleData.couplePhoto" alt="החתן והכלה" />
          </div>

          <!-- Default header with decor -->
          <div v-else class="default-hero">
            <div class="hero-emoji">💒</div>
            <h1 class="hero-names" v-if="coupleData">{{ coupleData.name1 }} ❤️ {{ coupleData.name2 }}</h1>
            <h1 class="hero-names" v-else>אישור הגעה</h1>
            <p class="hero-date" v-if="coupleData?.weddingDate">
              {{ new Date(coupleData.weddingDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
            </p>
            <p class="hero-venue" v-if="coupleData?.venue">📍 {{ coupleData.venue }}</p>
          </div>
        </div>

        <!-- Invitation Banner link (if has invitation) -->
        <div v-if="coupleData?.invitationId" class="invitation-banner">
          <a :href="`/invitation/${coupleData.invitationId}`" target="_blank" class="invitation-banner-inner">
            <span class="inv-banner-icon">💌</span>
            <span class="inv-banner-text">צפה בהזמנה הדיגיטלית</span>
            <span class="inv-banner-arrow">›</span>
          </a>
        </div>

        <div class="rsvp-sub-header">
          <p class="rsvp-invite">נשמח לדעת האם תוכלו להצטרף לשמחה שלנו ✨</p>
        </div>

        <form @submit.prevent="handleSubmit" class="rsvp-form">
          <!-- Guest lookup -->
          <div v-if="!guestPreFilled" class="form-section">
            <h3 class="section-title">פרטים אישיים</h3>
            <div class="form-group">
              <label class="label" for="rsvp-name">שם מלא *</label>
              <input id="rsvp-name" v-model="form.name" type="text" class="input"
                :class="{ 'input-error': errors.name }" placeholder="הכנס/י את שמך המלא" autocomplete="name" />
              <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
            </div>
            <div class="form-group">
              <label class="label" for="rsvp-phone">מספר טלפון</label>
              <input id="rsvp-phone" v-model="form.phone" type="tel" class="input"
                placeholder="05X-XXXXXXX" dir="ltr" autocomplete="tel" />
            </div>
            <div class="form-group">
              <label class="label" for="rsvp-code">קוד RSVP אישי (אם קיבלת)</label>
              <input id="rsvp-code" v-model="form.code" type="text" class="input"
                placeholder="קוד אישי (אופציונלי)" dir="ltr" @input="onCodeInput" />
              <span class="form-hint">קיבלת קוד אישי בהזמנה? הזן כאן לאישור מהיר</span>
            </div>
          </div>

          <!-- Pre-filled guest greeting -->
          <div v-else class="prefilled-banner">
            <div class="pf-icon">👋</div>
            <div>
              <p class="pf-name">שלום, {{ guestData.name }}!</p>
              <p class="pf-hint">אנא אשר/י את הגעתך</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click="clearPrefill">שנה</button>
          </div>

          <!-- Attendance -->
          <div class="form-section">
            <h3 class="section-title">אישור הגעה *</h3>
            <div class="attendance-options">
              <button v-for="opt in attendanceOptions" :key="opt.value" type="button"
                class="attend-btn" :class="{ active: form.rsvpStatus === opt.value }"
                @click="form.rsvpStatus = opt.value">
                <span class="attend-emoji">{{ opt.emoji }}</span>
                <span class="attend-label">{{ opt.label }}</span>
              </button>
            </div>
            <span v-if="errors.rsvpStatus" class="form-error">{{ errors.rsvpStatus }}</span>
          </div>

          <!-- Seats (only if coming/maybe) -->
          <Transition name="slide-down">
            <div v-if="form.rsvpStatus === 'confirmed' || form.rsvpStatus === 'maybe'" class="form-section">
              <h3 class="section-title">מספר מגיעים</h3>
              <div class="seats-row">
                <button v-for="n in [1,2,3,4,5,6,7,8]" :key="n" type="button"
                  class="seat-btn" :class="{ active: form.numPeople === n }" @click="form.numPeople = n">{{ n }}</button>
                <span class="seats-hint">אנשים</span>
              </div>
            </div>
          </Transition>

          <!-- Meal preference -->
          <Transition name="slide-down">
            <div v-if="form.rsvpStatus === 'confirmed' || form.rsvpStatus === 'maybe'" class="form-section">
              <h3 class="section-title">העדפת מנה</h3>
              <div class="meal-options">
                <button v-for="meal in mealOptions" :key="meal.value" type="button"
                  class="meal-btn" :class="{ active: form.mealPref === meal.value }"
                  @click="form.mealPref = meal.value">
                  <span class="meal-emoji">{{ meal.emoji }}</span>
                  {{ meal.label }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Message -->
          <div class="form-section">
            <h3 class="section-title">ברכה לזוג (אופציונלי)</h3>
            <textarea v-model="form.message" class="input" rows="3"
              placeholder="כתוב/י מילה טובה לזוג המאושר..." />
          </div>

          <div v-if="submitError" class="submit-error">{{ submitError }}</div>

          <button type="submit" class="btn btn-primary btn-lg w-full" :disabled="submitting">
            <span v-if="submitting">שולח...</span>
            <span v-else>שלח אישור הגעה 💌</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const loading     = ref(false)
const loadError   = ref(false)
const submitting  = ref(false)
const submitted   = ref(false)
const submitError = ref('')
const coupleData  = ref(null)
const guestData   = ref(null)
const eventData   = ref(null)

const form = ref({ name: '', phone: '', code: '', rsvpStatus: '', numPeople: 1, mealPref: '', message: '' })
const errors = ref({})

const guestPreFilled = computed(() => !!guestData.value)

const attendanceOptions = [
  { value: 'confirmed', label: 'מגיע/ה 🎉', emoji: '✅' },
  { value: 'maybe',     label: 'אולי',        emoji: '🤔' },
  { value: 'declined',  label: 'לא מגיע/ה',  emoji: '❌' }
]

const mealOptions = [
  { value: 'regular',    label: 'רגילה',     emoji: '🍽️' },
  { value: 'vegetarian', label: 'צמחונית',   emoji: '🥗' },
  { value: 'vegan',      label: 'טבעונית',   emoji: '🌱' },
  { value: 'kosher',     label: 'כשרה',      emoji: '✡️' },
  { value: 'glutenfree', label: 'ללא גלוטן', emoji: '🌾' }
]

const statusEmoji  = computed(() => ({ confirmed: '🎊', declined: '💙' }[form.value.rsvpStatus] || '💌'))
const confirmTitle = computed(() => ({ confirmed: 'נהדר! מחכים לכם בשמחה', declined: 'תודה שעדכנת/ת!' }[form.value.rsvpStatus] || 'תודה! נציר את מקומך'))
const confirmSub   = computed(() => {
  if (form.value.rsvpStatus === 'confirmed') return `אישרנו את הגעת ${form.value.name || 'האורח/ת'} לחתונה 💕`
  if (form.value.rsvpStatus === 'declined')  return 'חבל שלא תוכלו להגיע, אבל מעריכים את העדכון 💙'
  return 'נשמח לדעת מוקדם יותר אם ניתן ✨'
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function petalStyle(i) {
  return {
    top: `${5 + (i * 7) % 80}%`,
    right: `${(i * 13) % 95}%`,
    fontSize: `${14 + (i % 4) * 6}px`,
    animationDelay: `${(i * 0.4).toFixed(1)}s`,
    animationDuration: `${6 + (i % 4) * 2}s`,
    opacity: 0.15 + (i % 5) * 0.04
  }
}

onMounted(async () => {
  const code = route.params.code || route.query.code
  if (code) await loadByCode(code)
})

async function loadByCode(code) {
  loading.value = true
  try {
    const res = await fetch(`/api/rsvp/${encodeURIComponent(code)}`)
    if (!res.ok) { loadError.value = true; return }
    const data = await res.json()
    eventData.value  = data
    coupleData.value = data.couple

    // Handle prefilledGuest (new format) or guest (old format backward compat)
    const pf = data.prefilledGuest || (data.type === 'guest' ? data.guest : null)
    if (pf) {
      guestData.value       = pf
      form.value.code       = code
      form.value.name       = pf.name || ''
      form.value.phone      = pf.phone || ''
      form.value.numPeople  = pf.numPeople || 1
      form.value.mealPref   = pf.mealPref || ''
      form.value.rsvpStatus = pf.rsvpStatus === 'pending' ? '' : (pf.rsvpStatus || '')
    }
  } catch { loadError.value = true }
  finally  { loading.value = false }
}

async function onCodeInput() {
  const code = form.value.code.trim()
  if (code.length >= 5) await loadByCode(code)
}

function clearPrefill() {
  guestData.value = null
  form.value.code = ''
  form.value.name = ''
  form.value.phone = ''
}

function validate() {
  errors.value = {}
  if (!guestPreFilled.value && !form.value.name.trim()) errors.value.name = 'שם נדרש'
  if (!form.value.rsvpStatus) errors.value.rsvpStatus = 'אנא בחר/י אישור הגעה'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitError.value = ''
  submitting.value  = true
  const coupleToken = route.params.code || route.query.code
  try {
    const payload = {
      rsvpStatus: form.value.rsvpStatus,
      numPeople:  form.value.numPeople,
      mealPref:   form.value.mealPref  || undefined,
      message:    form.value.message   || undefined
    }
    if (form.value.code) {
      payload.code = form.value.code
    } else {
      payload.name = form.value.name.trim()
      payload.phone = form.value.phone.trim() || undefined
      payload.coupleToken = coupleToken
    }
    const res = await fetch('/api/rsvp/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) { submitError.value = data.message || 'שגיאה בשליחה, אנא נסה/י שוב'; return }
    if (data.couple) coupleData.value = data.couple
    submitted.value = true
  } catch { submitError.value = 'שגיאה בחיבור לשרת, אנא נסה/י שוב' }
  finally  { submitting.value = false }
}

function reset() { submitted.value = false; submitError.value = ''; form.value.rsvpStatus = ''; form.value.message = '' }
</script>

<style scoped>
.rsvp-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, #FFF0FA 50%, #F5F5F7 100%);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-8) var(--space-4); position: relative; overflow: hidden;
}
.rsvp-bg { position: absolute; inset: 0; pointer-events: none; }
.petal { position: absolute; animation: floatPetal linear infinite; user-select: none; }
@keyframes floatPetal {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.15; }
  90%  { opacity: 0.15; }
  100% { transform: translateY(-60px) rotate(20deg); opacity: 0; }
}
.rsvp-container { width: 100%; max-width: 520px; position: relative; z-index: 1; }
.rsvp-card { background: var(--color-bg-card); border-radius: var(--radius-2xl); border: 1px solid var(--color-border); box-shadow: var(--shadow-xl); overflow: hidden; }
.rsvp-header { background: linear-gradient(135deg, var(--color-primary) 0%, #C9177A 100%); color: #fff; padding: var(--space-8) var(--space-6) var(--space-6); text-align: center; }
.header-decor { font-size: 2.5rem; margin-bottom: var(--space-3); animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
.rsvp-couple { font-size: var(--font-size-3xl); font-weight: 900; line-height: 1.2; margin-bottom: var(--space-3); }
.rsvp-meta { display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap; margin-bottom: var(--space-3); }
.meta-item { font-size: var(--font-size-sm); opacity: 0.9; }
.rsvp-invite { font-size: var(--font-size-sm); opacity: 0.85; }
.rsvp-form { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-1); }
.form-section { padding: var(--space-4) 0; border-bottom: 1px solid var(--color-border); }
.form-section:last-of-type { border-bottom: none; }
.section-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-3); }
.prefilled-banner { display: flex; align-items: center; gap: var(--space-3); background: var(--color-primary-light); border-radius: var(--radius-lg); padding: var(--space-4); margin: var(--space-4) var(--space-6) 0; }
.pf-icon { font-size: 2rem; }
.pf-name { font-weight: 700; color: var(--color-navy); }
.pf-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.attendance-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.attend-btn { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-4) var(--space-2); border: 2px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-subtle); cursor: pointer; transition: all var(--transition); font-family: var(--font); }
.attend-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.attend-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); box-shadow: 0 0 0 3px var(--color-primary-light); }
.attend-emoji { font-size: 1.5rem; }
.attend-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.seats-row { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; }
.seat-btn { width: 40px; height: 40px; border-radius: var(--radius-full); border: 2px solid var(--color-border); background: var(--color-bg-subtle); font-size: var(--font-size-base); font-weight: 700; cursor: pointer; transition: all var(--transition); font-family: var(--font); }
.seat-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.seat-btn.active { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
.seats-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.meal-options { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.meal-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border: 2px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-bg-subtle); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition); font-family: var(--font); }
.meal-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.meal-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); color: var(--color-primary); }
.meal-emoji { font-size: 1rem; }
.submit-error { background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--font-size-sm); text-align: center; }
.confirm-card { padding: var(--space-12) var(--space-6); text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.confirm-emoji { font-size: 4rem; line-height: 1; }
.confirm-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.confirm-sub { color: var(--color-text-muted); max-width: 320px; }
.confirm-couple { display: flex; flex-direction: column; gap: var(--space-1); align-items: center; }
.couple-name { font-weight: 700; font-size: var(--font-size-lg); color: var(--color-primary); }
.couple-date, .couple-venue { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.error-card { padding: var(--space-12) var(--space-6); text-align: center; }
.err-icon { font-size: 3rem; margin-bottom: var(--space-4); }
.skeleton-wrap { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.skel { height: 20px; border-radius: var(--radius); background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skel-h2 { height: 32px; width: 70%; }
.skel-line { width: 100%; }
.skel-line.short { width: 55%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.slide-down-enter-active, .slide-down-leave-active { transition: all var(--transition); overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; transform: translateY(-8px); }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; max-height: 300px; }
@media (max-width: 480px) {
  .rsvp-page { padding: var(--space-4) var(--space-3); align-items: flex-start; }
  .rsvp-couple { font-size: var(--font-size-2xl); }
  .attendance-options { grid-template-columns: 1fr; }
}
/* Hero section */
.rsvp-hero { margin-bottom: 0; overflow: hidden; }
.invitation-hero { position: relative; max-height: 300px; overflow: hidden; }
.invitation-hero img.invitation-bg { width: 100%; object-fit: cover; display: block; }
.invitation-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.65));
  padding: 20px 16px 16px; color: white; text-align: center;
}
.inv-names { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
.inv-date  { font-size: 14px; opacity: 0.9; margin: 0; }
.couple-photo-hero img {
  width: 100%; max-height: 280px; object-fit: cover; display: block;
}
.default-hero {
  background: linear-gradient(135deg, #FFF0F7 0%, #F0F4FF 100%);
  text-align: center;
  padding: 32px 16px;
}
.hero-emoji  { font-size: 48px; }
.hero-names  { font-size: 24px; font-weight: 700; color: var(--color-navy); margin: 8px 0; }
.hero-date   { color: var(--color-primary); font-size: 15px; margin: 0; }
.hero-venue  { color: #666; font-size: 14px; margin-top: 4px; }
.rsvp-sub-header { padding: var(--space-3) var(--space-6); text-align: center; background: var(--color-bg-card); }
.rsvp-sub-header .rsvp-invite { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

/* Invitation banner */
.invitation-banner {
  margin-bottom: var(--space-4);
}
.invitation-banner-inner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, #fff0f8 0%, #ffe6f4 100%);
  border: 1.5px solid rgba(233,30,140,0.25);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-primary);
  font-weight: 700;
  font-size: var(--font-size-sm);
  transition: background 0.2s, transform 0.2s;
}
.invitation-banner-inner:hover {
  background: linear-gradient(135deg, #ffe6f4 0%, #ffcce9 100%);
  transform: translateY(-1px);
}
.inv-banner-icon { font-size: 1.3rem; }
.inv-banner-text { flex: 1; }
.inv-banner-arrow { font-size: 1.2rem; }
</style>
