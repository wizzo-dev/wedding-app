<template>
  <div class="account-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ניהול חשבון 🔐</h1>
        <p class="page-sub">אבטחה, סיסמה ומחיקת חשבון</p>
      </div>
    </div>

    <!-- Sub-nav -->
    <div class="subnav">
      <router-link to="/app/settings" class="subnav-link" active-class="active" exact>🎉 פרטי החתונה</router-link>
      <router-link to="/app/settings/account" class="subnav-link" active-class="active">🔐 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="subnav-link" active-class="active">👑 מנוי</router-link>
    </div>

    <div class="account-content">

      <!-- Email info -->
      <section class="settings-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">📧</div>
            <div>
              <h2 class="section-title">כתובת אימייל</h2>
              <p class="section-sub">האימייל שלכם לכניסה למערכת</p>
            </div>
          </div>
          <div class="email-display">
            <span class="email-value" dir="ltr">{{ userEmail }}</span>
            <span class="badge badge-success">מאומת ✓</span>
          </div>
        </div>
      </section>

      <!-- Change Password -->
      <section class="settings-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">🔑</div>
            <div>
              <h2 class="section-title">שינוי סיסמה</h2>
              <p class="section-sub">מומלץ להשתמש בסיסמה חזקה ייחודית</p>
            </div>
          </div>

          <div class="form-stack">
            <div class="form-group">
              <label class="form-label">סיסמה נוכחית</label>
              <div class="password-wrap">
                <input
                  v-model="pwForm.currentPassword"
                  :type="showCurrent ? 'text' : 'password'"
                  class="form-input"
                  placeholder="הסיסמה הנוכחית שלך"
                  autocomplete="current-password"
                  dir="ltr"
                />
                <button class="eye-btn" @click="showCurrent = !showCurrent" type="button">
                  {{ showCurrent ? '🙈' : '👁️' }}
                </button>
              </div>
              <span v-if="pwErrors.currentPassword" class="form-error">{{ pwErrors.currentPassword }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">סיסמה חדשה</label>
              <div class="password-wrap">
                <input
                  v-model="pwForm.newPassword"
                  :type="showNew ? 'text' : 'password'"
                  class="form-input"
                  placeholder="לפחות 8 תווים"
                  autocomplete="new-password"
                  dir="ltr"
                />
                <button class="eye-btn" @click="showNew = !showNew" type="button">
                  {{ showNew ? '🙈' : '👁️' }}
                </button>
              </div>
              <div v-if="pwForm.newPassword" class="strength-bar">
                <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPct + '%' }"></div>
              </div>
              <span v-if="pwErrors.newPassword" class="form-error">{{ pwErrors.newPassword }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">אימות סיסמה חדשה</label>
              <div class="password-wrap">
                <input
                  v-model="pwForm.confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  class="form-input"
                  placeholder="הקלד שוב את הסיסמה החדשה"
                  autocomplete="new-password"
                  dir="ltr"
                />
                <button class="eye-btn" @click="showConfirm = !showConfirm" type="button">
                  {{ showConfirm ? '🙈' : '👁️' }}
                </button>
              </div>
              <span v-if="pwErrors.confirmPassword" class="form-error">{{ pwErrors.confirmPassword }}</span>
            </div>

            <div v-if="pwSuccess" class="success-alert">
              ✅ הסיסמה שונתה בהצלחה!
            </div>
            <div v-if="pwError" class="error-alert">
              ⚠️ {{ pwError }}
            </div>

            <button class="btn btn-primary" :disabled="pwSaving" @click="changePassword">
              <span v-if="pwSaving">מעדכן...</span>
              <span v-else>🔐 עדכן סיסמה</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Danger Zone -->
      <section class="settings-section danger-section card">
        <div class="card-body">
          <div class="section-header">
            <div class="section-icon">⚠️</div>
            <div>
              <h2 class="section-title danger-title">אזור מסוכן</h2>
              <p class="section-sub">פעולות בלתי הפיכות — יש לנקוט משנה זהירות</p>
            </div>
          </div>

          <div class="danger-card">
            <div class="danger-info">
              <h3 class="danger-item-title">מחיקת חשבון</h3>
              <p class="danger-item-desc">
                פעולה זו תמחק לצמיתות את החשבון שלכם, כולל רשימת האורחים, התקציב, הספקים וכל הנתונים האחרים.
                <strong>אין דרך לשחזר את הנתונים לאחר המחיקה.</strong>
              </p>
            </div>
            <button class="btn btn-danger" @click="showDeleteModal = true">
              🗑️ מחק חשבון
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- Delete Account Modal -->
    <teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal modal-sm pop-in" dir="rtl">
          <div class="modal-header">
            <h3 class="danger-title">⚠️ מחיקת חשבון</h3>
            <button class="modal-close" @click="showDeleteModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <p>פעולה זו <strong>תמחק לצמיתות</strong> את כל הנתונים שלכם:</p>
              <ul class="delete-list">
                <li>✗ רשימת אורחים מלאה</li>
                <li>✗ תקציב ותשלומים</li>
                <li>✗ ספקים ופגישות</li>
                <li>✗ עיצוב הזמנות</li>
                <li>✗ לוח היום ומשימות</li>
              </ul>
              <p class="delete-confirm-label">לאישור, הכניסו את הסיסמה שלכם:</p>
              <input
                v-model="deletePassword"
                type="password"
                class="form-input"
                placeholder="הסיסמה שלך"
                dir="ltr"
                autocomplete="current-password"
              />
              <span v-if="deleteError" class="form-error">{{ deleteError }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showDeleteModal = false">ביטול</button>
            <button class="btn btn-danger" :disabled="deleting" @click="deleteAccount">
              <span v-if="deleting">מוחק...</span>
              <span v-else">מחק לצמיתות</span>
            </button>
          </div>
        </div>
      </div>
    </teleport>

  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/composables/useApi'

const router = useRouter()
const auth = useAuthStore()

const userEmail = ref('')

// ── Change Password ───────────────────────────────────────────────────────────
const pwForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const pwErrors = ref({})
const pwSaving = ref(false)
const pwSuccess = ref(false)
const pwError = ref(null)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)

// ── Delete Account ────────────────────────────────────────────────────────────
const showDeleteModal = ref(false)
const deletePassword = ref('')
const deleteError = ref(null)
const deleting = ref(false)

// ── Password Strength ─────────────────────────────────────────────────────────
const strengthPct = computed(() => {
  const pw = pwForm.value.newPassword
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score += 25
  if (pw.length >= 12) score += 15
  if (/[A-Z]/.test(pw)) score += 20
  if (/[0-9]/.test(pw)) score += 20
  if (/[^A-Za-z0-9]/.test(pw)) score += 20
  return Math.min(score, 100)
})

const strengthClass = computed(() => {
  const p = strengthPct.value
  if (p < 40) return 'weak'
  if (p < 70) return 'medium'
  return 'strong'
})

// ── API ───────────────────────────────────────────────────────────────────────
async function loadProfile() {
  try {
    const res = await api.get('/users/profile')
    userEmail.value = res.data.email || ''
  } catch {}
}

function validatePw() {
  pwErrors.value = {}
  if (!pwForm.value.currentPassword) pwErrors.value.currentPassword = 'שדה חובה'
  if (!pwForm.value.newPassword) {
    pwErrors.value.newPassword = 'שדה חובה'
  } else if (pwForm.value.newPassword.length < 8) {
    pwErrors.value.newPassword = 'סיסמה חייבת להכיל לפחות 8 תווים'
  }
  if (pwForm.value.newPassword !== pwForm.value.confirmPassword) {
    pwErrors.value.confirmPassword = 'הסיסמאות אינן תואמות'
  }
  return Object.keys(pwErrors.value).length === 0
}

async function changePassword() {
  if (!validatePw()) return
  pwSaving.value = true
  pwError.value = null
  pwSuccess.value = false
  try {
    await api.post('/users/change-password', {
      currentPassword: pwForm.value.currentPassword,
      newPassword: pwForm.value.newPassword
    })
    pwSuccess.value = true
    pwForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    setTimeout(() => { pwSuccess.value = false }, 5000)
  } catch (e) {
    pwError.value = e.response?.data?.message || 'שגיאה בשינוי הסיסמה'
  } finally {
    pwSaving.value = false
  }
}

async function deleteAccount() {
  deleteError.value = null
  if (!deletePassword.value) {
    deleteError.value = 'יש להזין סיסמה לאישור'
    return
  }
  deleting.value = true
  try {
    await api.delete('/users/account', { data: { password: deletePassword.value } })
    // Clear auth state and redirect to landing
    auth.logout?.()
    router.push('/')
  } catch (e) {
    deleteError.value = e.response?.data?.message || 'שגיאה במחיקת החשבון'
  } finally {
    deleting.value = false
  }
}

onMounted(loadProfile)
</script>
<style scoped>
.account-view {
  padding: var(--space-6);
  max-width: 700px;
}

/* Header */
.page-header { margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Sub-nav */
.subnav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-6);
  overflow-x: auto;
}
.subnav-link {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  text-decoration: none;
}
.subnav-link:hover { color: var(--color-navy); }
.subnav-link.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

/* Content */
.account-content { display: flex; flex-direction: column; gap: var(--space-5); }

/* Section */
.settings-section { transition: box-shadow var(--transition); }
.settings-section:hover { box-shadow: var(--shadow); }

.section-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}
.section-icon { font-size: 1.8rem; flex-shrink: 0; line-height: 1; }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }
.section-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 2px; }

/* Email */
.email-display { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.email-value { font-size: var(--font-size-base); font-weight: 600; color: var(--color-navy); }
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.badge-success { background: var(--color-success-bg); color: #16a34a; }

/* Form */
.form-stack { display: flex; flex-direction: column; gap: var(--space-4); }
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input {
  width: 100%;
  padding: 11px var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
  text-align: right;
}
.form-input:focus {
  border-color: var(--color-primary);
  background: #fff;
  border: 2px solid var(--color-primary);
}
.form-error { font-size: var(--font-size-xs); color: var(--color-error); }

/* Password input */
.password-wrap { position: relative; }
.password-wrap .form-input { padding-left: 44px; }
.eye-btn {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: var(--radius-sm);
}

/* Strength bar */
.strength-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  margin-top: 4px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.4s ease, background var(--transition);
}
.strength-fill.weak { background: var(--color-error); }
.strength-fill.medium { background: var(--color-warning); }
.strength-fill.strong { background: var(--color-success); }

/* Alerts */
.success-alert {
  padding: var(--space-3) var(--space-4);
  background: var(--color-success-bg);
  border: 1px solid var(--color-success);
  border-radius: var(--radius);
  color: #16a34a;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.error-alert {
  padding: var(--space-3) var(--space-4);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

/* Danger section */
.danger-section { border-color: #fecaca !important; }
.danger-section:hover { border: 2px solid var(--color-error) !important; }
.danger-title { color: var(--color-error) !important; }

.danger-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-error-bg);
  border-radius: var(--radius-lg);
  border: 1px solid #fecaca;
  flex-wrap: wrap;
}
.danger-info { flex: 1; }
.danger-item-title { font-size: var(--font-size-base); font-weight: 700; color: var(--color-error); margin-bottom: var(--space-2); }
.danger-item-desc { font-size: var(--font-size-sm); color: #7f1d1d; line-height: 1.6; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 11px var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  font-family: var(--font);
  white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:hover:not(:disabled) { background: #dc2626; transform: translateY(-1px); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--color-text-muted); }
.btn-ghost:hover { background: var(--color-bg-subtle); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 460px;
  box-shadow: var(--shadow-xl);
}
.modal-sm { max-width: 440px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close {
  background: none; border: none; font-size: 18px; cursor: pointer;
  color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--color-bg-subtle); }
.modal-body { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }

/* Delete modal */
.delete-warning { display: flex; flex-direction: column; gap: var(--space-3); }
.delete-warning p { font-size: var(--font-size-sm); color: var(--color-text); line-height: 1.6; }
.delete-list { padding-right: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1); }
.delete-list li { font-size: var(--font-size-sm); color: var(--color-error); font-weight: 600; }
.delete-confirm-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); margin-top: var(--space-2) !important; }

@media (max-width: 600px) {
  .account-view { padding: var(--space-4); }
  .danger-card { flex-direction: column; }
}
</style>
