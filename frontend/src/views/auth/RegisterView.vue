<template>
  <div class="auth-page">
    <!-- ── Right: Form ──────────────────────────────────────────────── -->
    <div class="auth-form-side fade-in">
      <div class="auth-form-wrap">
        <!-- Logo -->
        <div class="auth-logo">
          <span class="auth-logo-icon">💍</span>
          <span class="auth-logo-text">יאללה</span>
        </div>

        <h1 class="auth-title">מתחילים את המסע</h1>
        <p class="auth-subtitle">צרו חשבון וניהלו את החתונה שלכם בקלות</p>

        <!-- Error banner -->
        <transition name="slide-down">
          <div v-if="error" class="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>
        </transition>

        <!-- Success banner -->
        <transition name="slide-down">
          <div v-if="successMsg" class="auth-success-banner" role="status">
            <span>🎉</span>
            <span>{{ successMsg }}</span>
          </div>
        </transition>

        <form class="auth-form" @submit.prevent="handleRegister" novalidate>
          <!-- Names row -->
          <div class="form-row">
            <div class="form-group">
              <label for="name1" class="label">שם החתן</label>
              <input
                id="name1"
                v-model="form.name1"
                type="text"
                class="input"
                :class="{ 'input-error': fieldErrors.name1 }"
                placeholder="יוסי"
                autocomplete="given-name"
              />
              <span v-if="fieldErrors.name1" class="form-error">{{ fieldErrors.name1 }}</span>
            </div>
            <div class="form-group">
              <label for="name2" class="label">שם הכלה</label>
              <input
                id="name2"
                v-model="form.name2"
                type="text"
                class="input"
                :class="{ 'input-error': fieldErrors.name2 }"
                placeholder="מיכל"
                autocomplete="family-name"
              />
              <span v-if="fieldErrors.name2" class="form-error">{{ fieldErrors.name2 }}</span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email" class="label">אימייל</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="input"
              :class="{ 'input-error': fieldErrors.email }"
              placeholder="your@email.com"
              autocomplete="email"
              dir="ltr"
            />
            <span v-if="fieldErrors.email" class="form-error">{{ fieldErrors.email }}</span>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password" class="label">סיסמה</label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': fieldErrors.password }"
                placeholder="לפחות 8 תווים"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="fieldErrors.password" class="form-error">{{ fieldErrors.password }}</span>
            <div v-if="form.password" class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrength.cls" :style="{ width: passwordStrength.pct + '%' }"></div>
              </div>
              <span class="strength-label" :class="passwordStrength.cls">{{ passwordStrength.label }}</span>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label for="confirmPassword" class="label">אישור סיסמה</label>
            <div class="input-wrap">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': fieldErrors.confirmPassword }"
                placeholder="חזרו על הסיסמה"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showConfirm = !showConfirm"
                :aria-label="showConfirm ? 'הסתר' : 'הצג'"
              >
                {{ showConfirm ? '🙈' : '👁️' }}
              </button>
            </div>
            <span v-if="fieldErrors.confirmPassword" class="form-error">{{ fieldErrors.confirmPassword }}</span>
          </div>

          <!-- Wedding Date (optional) -->
          <div class="form-group">
            <label for="weddingDate" class="label">
              תאריך החתונה
              <span class="optional-badge">אופציונלי</span>
            </label>
            <input
              id="weddingDate"
              v-model="form.weddingDate"
              type="date"
              class="input date-input"
              :min="minDate"
            />
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'יוצר חשבון...' : 'צור חשבון' }}</span>
          </button>
        </form>

        <p class="auth-footer-text">
          יש לך חשבון?
          <router-link to="/login" class="auth-link">התחבר</router-link>
        </p>
      </div>
    </div>

    <!-- ── Left: Decorative ─────────────────────────────────────────── -->
    <div class="auth-deco-side" aria-hidden="true">
      <div class="auth-deco-content">
        <div class="deco-rings">🌹</div>
        <h2 class="deco-headline">הצטרפו ל-5,000+<br/>זוגות מאושרים</h2>
        <p class="deco-sub">שתכננו את החתונה המושלמת שלהם עם יאללה</p>
        <div class="deco-stats">
          <div class="deco-stat">
            <span class="deco-stat-num">5,000+</span>
            <span class="deco-stat-lbl">זוגות</span>
          </div>
          <div class="deco-divider"></div>
          <div class="deco-stat">
            <span class="deco-stat-num">500K+</span>
            <span class="deco-stat-lbl">אורחים</span>
          </div>
          <div class="deco-divider"></div>
          <div class="deco-stat">
            <span class="deco-stat-num">98%</span>
            <span class="deco-stat-lbl">שביעות רצון</span>
          </div>
        </div>
        <div class="deco-testimonial">
          <p class="deco-testimonial-text">"יאללה הפכה את התכנון לפשוט ומהנה. לא ידענו מה עשינו בלעדיו!"</p>
          <span class="deco-testimonial-author">— נועה ואלון, חתונה 2025</span>
        </div>
        <div class="deco-flowers deco-flowers-1">💍</div>
        <div class="deco-flowers deco-flowers-2">🎊</div>
        <div class="deco-flowers deco-flowers-3">🌸</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  name1: '',
  name2: '',
  email: '',
  password: '',
  confirmPassword: '',
  weddingDate: ''
})

const fieldErrors = reactive({
  name1: '',
  name2: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const successMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)

// Auto-redirect if already logged in
onMounted(() => {
  if (auth.isLoggedIn) {
    router.push('/app/dashboard')
  }
})

// Min date = today
const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Password strength meter
const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return { pct: 0, cls: '', label: '' }
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  if (score <= 1) return { pct: 25, cls: 'strength-weak', label: 'חלשה' }
  if (score <= 2) return { pct: 50, cls: 'strength-fair', label: 'בינונית' }
  if (score <= 3) return { pct: 75, cls: 'strength-good', label: 'טובה' }
  return { pct: 100, cls: 'strength-strong', label: 'חזקה' }
})

function validateForm() {
  Object.keys(fieldErrors).forEach(k => (fieldErrors[k] = ''))
  let valid = true

  if (!form.name1.trim()) {
    fieldErrors.name1 = 'נא להזין שם החתן'
    valid = false
  }
  if (!form.name2.trim()) {
    fieldErrors.name2 = 'נא להזין שם הכלה'
    valid = false
  }
  if (!form.email.trim()) {
    fieldErrors.email = 'נא להזין אימייל'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = 'כתובת אימייל לא תקינה'
    valid = false
  }
  if (!form.password) {
    fieldErrors.password = 'נא להזין סיסמה'
    valid = false
  } else if (form.password.length < 8) {
    fieldErrors.password = 'הסיסמה חייבת להכיל לפחות 8 תווים'
    valid = false
  }
  if (!form.confirmPassword) {
    fieldErrors.confirmPassword = 'נא לאשר את הסיסמה'
    valid = false
  } else if (form.password !== form.confirmPassword) {
    fieldErrors.confirmPassword = 'הסיסמאות אינן תואמות'
    valid = false
  }

  return valid
}

async function handleRegister() {
  error.value = ''
  successMsg.value = ''
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      name1: form.name1.trim(),
      name2: form.name2.trim(),
      email: form.email.trim(),
      password: form.password
    }
    if (form.weddingDate) payload.weddingDate = form.weddingDate

    await auth.register(payload)
    successMsg.value = `ברוכים הבאים ${form.name1} ו${form.name2}! 🎉 מעבירים אתכם...`
    setTimeout(() => {
      router.push('/app/dashboard')
    }, 1200)
  } catch (err) {
    const msg = err?.response?.data?.message
    error.value = msg || 'שגיאה ביצירת החשבון, נא לנסות שוב'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Page layout ──────────────────────────────────────────── */
.auth-page {
  display: flex;
  min-height: 100vh;
  direction: rtl;
  background: var(--color-bg);
}

/* ── Form side ───────────────────────────────────────────── */
.auth-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background: var(--color-bg-card);
  min-height: 100vh;
  overflow-y: auto;
}

.auth-form-wrap {
  width: 100%;
  max-width: 460px;
  padding: var(--space-4) 0;
}

/* ── Logo ──────────────────────────────────────────────────── */
.auth-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}
.auth-logo-icon { font-size: 2rem; }
.auth-logo-text {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-navy);
}

/* ── Headings ────────────────────────────────────────────── */
.auth-title {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-2);
  line-height: 1.2;
}
.auth-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

/* ── Banners ─────────────────────────────────────────────── */
.auth-error-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-error-bg);
  color: var(--color-error);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--space-5);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.auth-success-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-success-bg);
  color: #16A34A;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--space-5);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* ── Form ────────────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

/* Password wrap */
.input-wrap {
  position: relative;
}
.input-wrap .input {
  padding-left: var(--space-10);
}
.toggle-password {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  opacity: 0.6;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  line-height: 1;
  transition: opacity var(--transition-fast);
}
.toggle-password:hover { opacity: 1; }

/* Password strength */
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--transition), background-color var(--transition);
}
.strength-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.strength-weak  .strength-fill,
.strength-weak  { color: var(--color-error); background: var(--color-error); }
.strength-fair  .strength-fill,
.strength-fair  { color: var(--color-warning); background: var(--color-warning); }
.strength-good  .strength-fill,
.strength-good  { color: var(--color-info); background: var(--color-info); }
.strength-strong .strength-fill,
.strength-strong { color: var(--color-success); background: var(--color-success); }

/* Optional badge */
.optional-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-full);
  margin-right: var(--space-2);
}

/* Date input */
.date-input {
  direction: ltr;
  text-align: right;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Footer link */
.auth-footer-text {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-6);
}
.auth-link {
  color: var(--color-primary);
  font-weight: 700;
  margin-right: var(--space-1);
  transition: opacity var(--transition-fast);
}
.auth-link:hover { opacity: 0.75; }

/* ── Decorative side ─────────────────────────────────────── */
.auth-deco-side {
  flex: 1;
  background: linear-gradient(145deg, var(--color-navy) 0%, #2a1060 50%, var(--color-primary) 140%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-10);
  position: relative;
  overflow: hidden;
}

.auth-deco-content {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
}

.deco-rings {
  font-size: 4rem;
  margin-bottom: var(--space-6);
  animation: float 4s ease-in-out infinite;
  display: block;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-12px); }
}

.deco-headline {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  line-height: 1.2;
  margin-bottom: var(--space-3);
}

.deco-sub {
  font-size: var(--font-size-base);
  opacity: 0.75;
  margin-bottom: var(--space-8);
}

/* Stats row */
.deco-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}
.deco-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.deco-stat-num {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-primary);
  background: rgba(255,255,255,0.15);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius);
}
.deco-stat-lbl {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  margin-top: var(--space-1);
}
.deco-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.2);
}

/* Testimonial */
.deco-testimonial {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  max-width: 320px;
  margin: 0 auto;
  backdrop-filter: blur(10px);
}
.deco-testimonial-text {
  font-size: var(--font-size-sm);
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: var(--space-2);
  font-style: italic;
}
.deco-testimonial-author {
  font-size: var(--font-size-xs);
  opacity: 0.6;
  font-weight: 600;
}

/* Floating decorations */
.deco-flowers {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}
.deco-flowers-1 { top: 10%; left: 8%; animation-delay: 0s; }
.deco-flowers-2 { top: 60%; right: 6%; animation-delay: 2s; font-size: 3rem; }
.deco-flowers-3 { bottom: 15%; left: 12%; animation-delay: 1s; }

/* Pink glow blob */
.auth-deco-side::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: var(--color-primary);
  border-radius: 50%;
  opacity: 0.15;
  top: -60px;
  right: -60px;
  filter: blur(60px);
}

/* ── Transitions ─────────────────────────────────────────── */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all var(--transition);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Mobile responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .auth-page { flex-direction: column-reverse; }
  .auth-deco-side {
    min-height: 200px;
    flex: 0 0 200px;
    padding: var(--space-6);
  }
  .deco-rings { font-size: 2rem; margin-bottom: var(--space-2); }
  .deco-headline { font-size: var(--font-size-xl); }
  .deco-sub, .deco-stats, .deco-testimonial { display: none; }
  .auth-form-side { flex: 1; padding: var(--space-6) var(--space-4); }
  .auth-title { font-size: var(--font-size-2xl); }
  .form-row { grid-template-columns: 1fr; }
}
</style>
