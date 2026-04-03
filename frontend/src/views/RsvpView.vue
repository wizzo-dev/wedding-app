<template>
  <div class="rsvp-page" dir="rtl">
    <!-- Confetti layer -->
    <div v-if="submitted" class="confetti-container" aria-hidden="true">
      <div v-for="i in 40" :key="i" class="confetti-piece" :style="confettiStyle(i)" />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="rsvp-card skeleton-wrap">
      <div class="skel skel-title" />
      <div class="skel skel-sub" />
      <div class="skel skel-hero" />
      <div class="skel skel-line" />
      <div class="skel skel-line short" />
    </div>

    <!-- 404 state -->
    <div v-else-if="notFound" class="rsvp-card error-box">
      <div class="error-emoji">💔</div>
      <h2>ההזמנה לא נמצאה</h2>
      <p>הקישור שקיבלת אינו תקין או פג תוקפו.</p>
      <router-link to="/" class="btn-pill btn-navy">חזרה לדף הבית</router-link>
    </div>

    <!-- Thank you state -->
    <div v-else-if="submitted" class="rsvp-card thanks-box">
      <div class="thanks-emoji">🎉</div>
      <h2 class="thanks-title">תודה!</h2>
      <p class="thanks-sub">נתראה בחתונה של {{ data.name1 }} ו{{ data.name2 }} 💍</p>
      <div class="thanks-details">
        <span>📅 {{ formatDate(data.weddingDate) }}</span>
        <span>📍 {{ data.venue }}</span>
      </div>
    </div>

    <!-- Main card -->
    <div v-else-if="data" class="rsvp-card">
      <!-- Hero header -->
      <div class="couple-header">
        <div class="couple-names">{{ data.name1 }} &amp; {{ data.name2 }}</div>
        <div class="couple-sub">מתחתנים! 💍</div>
      </div>

      <!-- Event info -->
      <div class="event-info">
        <div class="info-item">
          <span class="info-icon">📅</span>
          <span>{{ formatDate(data.weddingDate) }}</span>
        </div>
        <div class="info-item" v-if="data.venue">
          <span class="info-icon">📍</span>
          <a
            v-if="data.venueAddress"
            :href="`https://maps.google.com/?q=${encodeURIComponent(data.venueAddress)}`"
            target="_blank"
            rel="noopener"
            class="venue-link"
          >{{ data.venue }}</a>
          <span v-else>{{ data.venue }}</span>
        </div>
      </div>

      <!-- Invitation card visual -->
      <div class="invitation-card">
        <div class="inv-rings">💍</div>
        <div class="inv-text">
          <div class="inv-title">הזמנה לחתונה</div>
          <div class="inv-names">{{ data.name1 }} &amp; {{ data.name2 }}</div>
          <div class="inv-date">{{ formatDate(data.weddingDate) }}</div>
        </div>
      </div>

      <!-- Guest token mode: greeting + RSVP buttons only -->
      <div v-if="guestData" class="guest-greeting">
        <h3>שלום {{ guestData.name }}! 👋</h3>
        <p>נשמח לדעת — האם תוכל/י להגיע?</p>
      </div>

      <!-- New guest form -->
      <form v-if="!guestData" class="rsvp-form" @submit.prevent="handleNewGuest">
        <div class="field">
          <label class="field-label">שם מלא <span class="required">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="field-input"
            placeholder="הזן/י את שמך"
            required
          />
        </div>
        <div class="field">
          <label class="field-label">טלפון</label>
          <input
            v-model="form.phone"
            type="tel"
            class="field-input"
            placeholder="05X-XXXXXXX"
            dir="ltr"
          />
        </div>
        <div class="field">
          <label class="field-label">מספר מגיעים</label>
          <div class="stepper">
            <button type="button" class="stepper-btn" @click="decrement">−</button>
            <span class="stepper-val">{{ form.numPeople }}</span>
            <button type="button" class="stepper-btn" @click="increment">+</button>
          </div>
        </div>

        <!-- RSVP buttons -->
        <div class="rsvp-actions">
          <button
            type="button"
            class="pill-btn pill-confirm"
            :class="{ active: form.rsvpStatus === 'confirmed' }"
            @click="setStatus('confirmed')"
          >✅ מגיעים</button>
          <button
            type="button"
            class="pill-btn pill-maybe"
            :class="{ active: form.rsvpStatus === 'pending' }"
            @click="setStatus('pending')"
          >🤔 מתלבטים</button>
          <button
            type="button"
            class="pill-btn pill-decline"
            :class="{ active: form.rsvpStatus === 'declined' }"
            @click="setStatus('declined')"
          >❌ לא מגיע</button>
        </div>

        <div v-if="formError" class="form-error">{{ formError }}</div>

        <button type="submit" class="submit-btn" :disabled="submitting || !form.rsvpStatus">
          <span v-if="submitting">שולח...</span>
          <span v-else>שלח תשובה</span>
        </button>
      </form>

      <!-- Guest token: just RSVP buttons -->
      <div v-else class="rsvp-actions standalone">
        <button
          class="pill-btn pill-confirm"
          :class="{ active: selectedStatus === 'confirmed' }"
          @click="respondWithToken('confirmed')"
          :disabled="submitting"
        >✅ מגיעים</button>
        <button
          class="pill-btn pill-maybe"
          :class="{ active: selectedStatus === 'pending' }"
          @click="respondWithToken('pending')"
          :disabled="submitting"
        >🤔 מתלבטים</button>
        <button
          class="pill-btn pill-decline"
          :class="{ active: selectedStatus === 'declined' }"
          @click="respondWithToken('declined')"
          :disabled="submitting"
        >❌ לא מגיע</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const loading = ref(true)
const notFound = ref(false)
const submitted = ref(false)
const submitting = ref(false)
const formError = ref('')
const selectedStatus = ref('')

const data = ref(null)
const guestData = ref(null)

const form = ref({
  name: '',
  phone: '',
  numPeople: 1,
  rsvpStatus: ''
})

const token = computed(() => route.params.token)
const guestToken = computed(() => route.params.guestToken)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function confettiStyle(i) {
  const colors = ['#E91E8C', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF']
  const size = Math.random() * 10 + 6
  const left = Math.random() * 100
  const delay = Math.random() * 3
  const duration = Math.random() * 3 + 2
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: colors[i % colors.length],
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

function increment() { if (form.value.numPeople < 10) form.value.numPeople++ }
function decrement() { if (form.value.numPeople > 1) form.value.numPeople-- }
function setStatus(s) { form.value.rsvpStatus = s }

async function load() {
  loading.value = true
  try {
    const url = guestToken.value
      ? `/api/rsvp/${token.value}/${guestToken.value}`
      : `/api/rsvp/${token.value}`
    const res = await fetch(url)
    if (res.status === 404) { notFound.value = true; return }
    const json = await res.json()
    data.value = json
    if (json.guest) {
      guestData.value = json.guest
      selectedStatus.value = json.guest.rsvpStatus || ''
    }

    // OG / title
    document.title = `הזמנה לחתונה של ${json.name1} ו${json.name2} 💍`
    setMeta('og:title', document.title)
    setMeta('og:description', `החתונה של ${json.name1} ו${json.name2} — ${formatDate(json.weddingDate)} ב${json.venue || ''}`)
  } catch (e) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

async function handleNewGuest() {
  if (!form.value.rsvpStatus) { formError.value = 'יש לבחור אחת מהאפשרויות'; return }
  if (!form.value.name.trim()) { formError.value = 'יש להזין שם'; return }
  formError.value = ''
  submitting.value = true
  try {
    const res = await fetch(`/api/rsvp/${token.value}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.value.name,
        phone: form.value.phone,
        numPeople: form.value.numPeople,
        rsvpStatus: form.value.rsvpStatus
      })
    })
    if (res.ok) submitted.value = true
    else formError.value = 'שגיאה בשליחה, נסה שוב'
  } catch {
    formError.value = 'שגיאת רשת, נסה שוב'
  } finally {
    submitting.value = false
  }
}

async function respondWithToken(status) {
  selectedStatus.value = status
  submitting.value = true
  try {
    const res = await fetch(`/api/rsvp/${token.value}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestToken: guestToken.value,
        numPeople: guestData.value?.numPeople || 1,
        rsvpStatus: status
      })
    })
    if (res.ok) submitted.value = true
  } catch { /* silent */ } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* ── Page layout ── */
.rsvp-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-primary-bg) 0%, #fff 60%, var(--color-primary-light) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  font-family: var(--font);
}

/* ── Card ── */
.rsvp-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-8) var(--space-6);
  max-width: 560px;
  width: 100%;
  text-align: center;
  position: relative;
}

/* ── Loading skeleton ── */
.skeleton-wrap { display: flex; flex-direction: column; gap: var(--space-4); align-items: center; }
.skel { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200%; animation: shimmer 1.4s infinite; border-radius: var(--radius); }
.skel-title  { width: 70%; height: 36px; }
.skel-sub    { width: 50%; height: 20px; }
.skel-hero   { width: 100%; height: 160px; border-radius: var(--radius-lg); }
.skel-line   { width: 80%; height: 16px; }
.skel-line.short { width: 55%; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Couple header ── */
.couple-header { margin-bottom: var(--space-4); }
.couple-names {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1.1;
  letter-spacing: -0.5px;
}
.couple-sub {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-top: var(--space-1);
}

/* ── Event info ── */
.event-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}
.info-item { display: flex; align-items: center; justify-content: center; gap: var(--space-2); }
.info-icon { font-size: 1.1em; }
.venue-link { color: var(--color-primary); text-decoration: none; font-weight: 600; }
.venue-link:hover { text-decoration: underline; }

/* ── Invitation card visual ── */
.invitation-card {
  background: linear-gradient(135deg, #fff5fb 0%, #ffeef9 100%);
  border: 2px solid var(--color-primary-light);
  border-radius: var(--radius-xl);
  padding: var(--space-6) var(--space-4);
  margin-bottom: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.inv-rings { font-size: 3rem; }
.inv-title { font-size: var(--font-size-sm); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 2px; }
.inv-names { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.inv-date  { font-size: var(--font-size-base); color: var(--color-primary); font-weight: 600; }

/* ── Guest greeting ── */
.guest-greeting { margin-bottom: var(--space-4); }
.guest-greeting h3 { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.guest-greeting p  { color: var(--color-text-muted); margin-top: var(--space-1); }

/* ── Form ── */
.rsvp-form { text-align: right; }
.field { margin-bottom: var(--space-4); }
.field-label { display: block; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-2); }
.required { color: var(--color-error); }
.field-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-size-base);
  font-family: var(--font);
  color: var(--color-text);
  background: var(--color-bg-subtle);
  transition: border-color var(--transition-fast);
  outline: none;
}
.field-input:focus { border-color: var(--color-primary); background: #fff; }

/* ── Stepper ── */
.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  direction: ltr;
  width: fit-content;
}
.stepper-btn {
  width: 36px; height: 36px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-primary);
  background: #fff;
  color: var(--color-primary);
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.stepper-btn:hover { background: var(--color-primary); color: #fff; }
.stepper-val { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); min-width: 2ch; text-align: center; }

/* ── RSVP pill buttons ── */
.rsvp-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
  margin: var(--space-6) 0 var(--space-4);
}
.rsvp-actions.standalone { margin-top: var(--space-4); }

.pill-btn {
  flex: 1; min-width: 120px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  font-size: var(--font-size-base);
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}
.pill-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.pill-confirm {
  background: var(--color-success-bg);
  color: #16a34a;
  border-color: #bbf7d0;
}
.pill-confirm:hover, .pill-confirm.active {
  background: var(--color-success);
  color: #fff;
  border-color: var(--color-success);
  box-shadow: 0 4px 14px rgba(34,197,94,0.35);
}

.pill-maybe {
  background: #f3f4f6;
  color: #4b5563;
  border-color: #e5e7eb;
}
.pill-maybe:hover, .pill-maybe.active {
  background: #6b7280;
  color: #fff;
  border-color: #6b7280;
}

.pill-decline {
  background: var(--color-error-bg);
  color: var(--color-error);
  border-color: #fecaca;
}
.pill-decline:hover, .pill-decline.active {
  background: var(--color-error);
  color: #fff;
  border-color: var(--color-error);
  box-shadow: 0 4px 14px rgba(239,68,68,0.35);
}

/* ── Form error ── */
.form-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-3);
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: var(--space-4);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-lg);
  font-weight: 800;
  font-family: var(--font);
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition);
  box-shadow: var(--shadow-pink);
}
.submit-btn:hover:not(:disabled) { background: var(--color-primary-hover); box-shadow: 0 6px 24px rgba(233,30,140,0.4); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Thank you state ── */
.thanks-box { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.thanks-emoji { font-size: 4rem; }
.thanks-title { font-size: var(--font-size-4xl); font-weight: 900; color: var(--color-navy); }
.thanks-sub { font-size: var(--font-size-lg); color: var(--color-text-muted); }
.thanks-details { display: flex; flex-direction: column; gap: var(--space-2); color: var(--color-primary); font-weight: 600; }

/* ── Error box ── */
.error-box { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.error-emoji { font-size: 4rem; }
.error-box h2 { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.error-box p { color: var(--color-text-muted); }

/* ── Buttons ── */
.btn-pill {
  display: inline-block;
  padding: var(--space-3) var(--space-8);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: 700;
  font-family: var(--font);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-navy {
  background: var(--color-navy);
  color: #fff;
}
.btn-navy:hover { background: var(--color-navy-mid); }

/* ── Confetti ── */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 100;
}
.confetti-piece {
  position: absolute;
  top: -20px;
  border-radius: 3px;
  animation: confettiFall linear infinite;
}
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
</style>
