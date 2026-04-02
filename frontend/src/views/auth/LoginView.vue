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

        <h1 class="auth-title">ברוכים השבים</h1>
        <p class="auth-subtitle">התחברו לניהול החתונה שלכם</p>

        <!-- Error banner -->
        <transition name="slide-down">
          <div v-if="error" class="auth-error-banner" role="alert">
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>
        </transition>

        <form class="auth-form" @submit.prevent="handleLogin" novalidate>
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
            <div class="label-row">
              <label for="password" class="label">סיסמה</label>
              <router-link to="/forgot-password" class="forgot-link">שכחתי סיסמה</router-link>
            </div>
            <div class="input-wrap">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input"
                :class="{ 'input-error': fieldErrors.password }"
                placeholder="••••••••"
                autocomplete="current-password"
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
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span>{{ loading ? 'מתחבר...' : 'התחבר' }}</span>
          </button>
        </form>

        <p class="auth-footer-text">
          אין לך חשבון?
          <router-link to="/register" class="auth-link">הירשם עכשיו</router-link>
        </p>
      </div>
    </div>

    <!-- ── Left: Decorative ─────────────────────────────────────────── -->
    <div class="auth-deco-side" aria-hidden="true">
      <div class="auth-deco-content">
        <div class="deco-rings">💍</div>
        <h2 class="deco-headline">יום החתונה שלכם<br/>מתחיל כאן</h2>
        <p class="deco-sub">ניהול מושלם של אורחים, תקציב, הושבה ועוד —<br/>הכל במקום אחד, בקלות ובשמחה.</p>
        <div class="deco-features">
          <div class="deco-feat"><span class="deco-feat-icon">✅</span><span>ניהול רשימת אורחים</span></div>
          <div class="deco-feat"><span class="deco-feat-icon">✅</span><span>תקציב חכם</span></div>
          <div class="deco-feat"><span class="deco-feat-icon">✅</span><span>הושבה דינמית</span></div>
          <div class="deco-feat"><span class="deco-feat-icon">✅</span><span>שליחה בוואטסאפ</span></div>
        </div>
        <div class="deco-flowers deco-flowers-1">🌸</div>
        <div class="deco-flowers deco-flowers-2">🌹</div>
        <div class="deco-flowers deco-flowers-3">💐</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const fieldErrors = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

// Auto-redirect if already logged in
onMounted(() => {
  if (auth.isLoggedIn) {
    router.push('/app/dashboard')
  }
})

function validateForm() {
  fieldErrors.email = ''
  fieldErrors.password = ''
  let valid = true

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
  }

  return valid
}

async function handleLogin() {
  error.value = ''
  if (!validateForm()) return

  loading.value = true
  try {
    await auth.login(form.email, form.password)
    router.push('/app/dashboard')
  } catch (err) {
    const msg = err?.response?.data?.message
    error.value = msg || 'שגיאה בהתחברות, נא לנסות שוב'
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

/* ── Form side (right in RTL = start) ───────────────────── */
.auth-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);
  background: var(--color-bg-card);
  min-height: 100vh;
}

.auth-form-wrap {
  width: 100%;
  max-width: 420px;
}

/* ── Logo ──────────────────────────────────────────────────── */
.auth-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.auth-logo-icon {
  font-size: 2rem;
}

.auth-logo-text {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-navy);
  letter-spacing: -0.5px;
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
  margin-bottom: var(--space-8);
}

/* ── Error banner ────────────────────────────────────────── */
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

/* ── Form ────────────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* label with forgot-link row */
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}
.label-row .label {
  margin-bottom: 0;
}

.forgot-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 600;
  transition: opacity var(--transition-fast);
}
.forgot-link:hover {
  opacity: 0.75;
}

/* Password wrapper with toggle button */
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
.toggle-password:hover {
  opacity: 1;
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

/* ── Footer ──────────────────────────────────────────────── */
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
.auth-link:hover {
  opacity: 0.75;
}

/* ── Decorative side (left in RTL = end) ──────────────────── */
.auth-deco-side {
  flex: 1;
  background: linear-gradient(145deg, var(--color-navy) 0%, var(--color-navy-mid) 40%, #3d1060 100%);
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
  margin-bottom: var(--space-4);
  letter-spacing: -0.5px;
}

.deco-sub {
  font-size: var(--font-size-base);
  opacity: 0.75;
  line-height: 1.7;
  margin-bottom: var(--space-8);
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}

.deco-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  display: inline-flex;
}
.deco-feat {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.deco-feat-icon {
  font-size: 1rem;
}

/* Floating decorative emojis */
.deco-flowers {
  position: absolute;
  font-size: 2.5rem;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}
.deco-flowers-1 { top: 10%; left: 8%; animation-delay: 0s; }
.deco-flowers-2 { top: 65%; right: 6%; animation-delay: 2s; font-size: 3rem; }
.deco-flowers-3 { bottom: 12%; left: 15%; animation-delay: 1s; }

/* Pink glow blob */
.auth-deco-side::before {
  content: '';
  position: absolute;
  width: 350px;
  height: 350px;
  background: var(--color-primary);
  border-radius: 50%;
  opacity: 0.12;
  top: -80px;
  right: -80px;
  filter: blur(60px);
}

/* ── Transitions ─────────────────────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition);
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Mobile responsive ───────────────────────────────────── */
@media (max-width: 768px) {
  .auth-page {
    flex-direction: column-reverse;
  }

  .auth-deco-side {
    min-height: 220px;
    flex: 0 0 220px;
    padding: var(--space-8) var(--space-6);
  }

  .deco-rings { font-size: 2.5rem; margin-bottom: var(--space-3); }
  .deco-headline { font-size: var(--font-size-2xl); }
  .deco-sub { display: none; }
  .deco-features { display: none; }

  .auth-form-side {
    flex: 1;
    padding: var(--space-8) var(--space-5);
  }

  .auth-title { font-size: var(--font-size-2xl); }
}
</style>
