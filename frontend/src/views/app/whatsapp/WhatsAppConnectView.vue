<template>
  <div class="wa-connect fade-in" dir="rtl">
    <!-- ── Loading skeleton ─────────────────────────────────────────── -->
    <div v-if="loading" class="wa-connect-loading">
      <div class="skeleton sk-title"></div>
      <div class="wa-grid-skeleton">
        <div class="skeleton sk-panel"></div>
        <div class="skeleton sk-panel"></div>
      </div>
      <div class="skeleton sk-stats"></div>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הנתונים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadStatus">נסה שוב</button>
    </div>

    <!-- ── Main content ──────────────────────────────────────────────── -->
    <template v-else>
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">💬 חיבור WhatsApp Business</h1>
          <p class="page-sub">חבר את חשבון WhatsApp Business שלך לשלוח הודעות לאורחים</p>
        </div>
        <div class="status-badge" :class="status.connected ? 'status-connected' : 'status-disconnected'">
          <span class="status-dot"></span>
          {{ status.connected ? 'מחובר' : 'מנותק' }}
        </div>
      </div>

      <!-- ── Grid ──────────────────────────────────────────────────── -->
      <div class="wa-grid">
        <!-- Left panel: QR / Connected state -->
        <div class="card wa-main-panel">
          <!-- Disconnected: show QR -->
          <div v-if="!status.connected" class="panel-body">
            <h2 class="panel-title">סרוק קוד QR לחיבור</h2>
            <p class="panel-sub">פתח את WhatsApp בטלפון שלך וסרוק את הקוד</p>

            <div class="qr-container" :class="{ 'qr-scanning': scanning }">
              <img v-if="status.qr" :src="status.qr" alt="QR Code" class="qr-image" />
              <div v-else class="qr-placeholder">
                <div class="qr-spinner">⟳</div>
                <p>טוען קוד QR...</p>
              </div>
              <div class="qr-timer" v-if="qrTimer > 0">
                <span class="qr-timer-text">פג תוקף עוד {{ qrTimer }} שניות</span>
                <button class="btn btn-outline btn-sm" @click="refreshQr">רענן QR</button>
              </div>
            </div>

            <!-- Instruction steps -->
            <div class="steps-section">
              <h3 class="steps-title">כיצד לחבר?</h3>
              <div class="steps-list">
                <div class="step">
                  <div class="step-num">1</div>
                  <div class="step-text">פתח את WhatsApp בטלפון שלך</div>
                </div>
                <div class="step">
                  <div class="step-num">2</div>
                  <div class="step-text">לחץ על ⋮ (שלוש נקודות) ← מכשירים מקושרים</div>
                </div>
                <div class="step">
                  <div class="step-num">3</div>
                  <div class="step-text">לחץ "קישור מכשיר" וסרוק את הקוד למעלה</div>
                </div>
              </div>
            </div>

            <!-- Mock connect button for demo -->
            <button
              class="btn btn-primary btn-connect"
              @click="mockConnect"
              :disabled="connecting"
            >
              <span v-if="connecting" class="spinner">⟳</span>
              <span v-else>🔗 סרוק עם WhatsApp (הדגמה)</span>
            </button>
          </div>

          <!-- Connected: show phone & status -->
          <div v-else class="panel-body connected-panel">
            <div class="connected-icon">✅</div>
            <h2 class="connected-title">WhatsApp מחובר!</h2>
            <p class="connected-phone">{{ status.phone }}</p>
            <p class="connected-sub">חשבון WhatsApp Business פעיל ומוכן לשליחה</p>

            <div class="connected-meta">
              <div class="meta-item">
                <span class="meta-label">סטטוס</span>
                <span class="badge badge-success">פעיל</span>
              </div>
              <div class="meta-item" v-if="status.lastActive">
                <span class="meta-label">פעילות אחרונה</span>
                <span class="meta-val">{{ formatRelativeTime(status.lastActive) }}</span>
              </div>
            </div>

            <button
              class="btn btn-outline btn-danger-outline"
              @click="disconnectWa"
              :disabled="disconnecting"
            >
              <span v-if="disconnecting" class="spinner">⟳</span>
              <span v-else>🔌 נתק חשבון</span>
            </button>
          </div>
        </div>

        <!-- Right panel: Quick actions -->
        <div class="wa-side">
          <!-- Quick links card -->
          <div class="card quick-links-card">
            <div class="card-pad">
              <h3 class="card-title-sm">⚡ פעולות מהירות</h3>
              <div class="quick-links">
                <router-link to="/app/whatsapp/templates" class="quick-link-btn">
                  <span class="ql-icon">📝</span>
                  <div>
                    <div class="ql-title">תבניות הודעות</div>
                    <div class="ql-sub">נהל תבניות לשליחה</div>
                  </div>
                  <span class="ql-arrow">←</span>
                </router-link>
                <router-link to="/app/whatsapp/send" class="quick-link-btn">
                  <span class="ql-icon">🚀</span>
                  <div>
                    <div class="ql-title">שלח הודעות</div>
                    <div class="ql-sub">שלח לאורחים שנבחרו</div>
                  </div>
                  <span class="ql-arrow">←</span>
                </router-link>
                <router-link to="/app/whatsapp/history" class="quick-link-btn">
                  <span class="ql-icon">📋</span>
                  <div>
                    <div class="ql-title">היסטוריית שליחות</div>
                    <div class="ql-sub">מעקב אחר שליחות קודמות</div>
                  </div>
                  <span class="ql-arrow">←</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Tips card -->
          <div class="card tips-card">
            <div class="card-pad">
              <h3 class="card-title-sm">💡 טיפים</h3>
              <ul class="tips-list">
                <li>השתמש בתבניות לחסוך זמן בשליחה</li>
                <li>ניתן לשלוח הודעות מותאמות אישית עם שם האורח</li>
                <li>מומלץ לשלוח תזכורת שבוע לפני האירוע</li>
                <li>הודעות נשלחות ממספר WhatsApp Business שלך</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Stats row ──────────────────────────────────────────────── -->
      <div class="stats-row" v-if="status.stats">
        <div class="stat-card card">
          <div class="stat-body">
            <div class="stat-icon stat-icon-primary">📤</div>
            <div>
              <div class="stat-num">{{ status.stats.sent }}</div>
              <div class="stat-lbl">נשלחו</div>
            </div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-body">
            <div class="stat-icon stat-icon-success">✅</div>
            <div>
              <div class="stat-num">{{ status.stats.delivered }}</div>
              <div class="stat-lbl">נמסרו</div>
            </div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-body">
            <div class="stat-icon stat-icon-error">❌</div>
            <div>
              <div class="stat-num">{{ status.stats.failed }}</div>
              <div class="stat-lbl">נכשלו</div>
            </div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-body">
            <div class="stat-icon stat-icon-warning">📊</div>
            <div>
              <div class="stat-num">{{ deliveryRate }}%</div>
              <div class="stat-lbl">אחוז מסירה</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref('')
const connecting = ref(false)
const disconnecting = ref(false)
const scanning = ref(false)
const qrTimer = ref(0)

const status = ref({
  connected: false,
  phone: null,
  qr: null,
  stats: { sent: 0, delivered: 0, failed: 0 }
})

const deliveryRate = computed(() => {
  const s = status.value.stats
  if (!s || s.sent === 0) return 0
  return Math.round((s.delivered / s.sent) * 100)
})

onMounted(() => {
  loadStatus()
})

async function loadStatus() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/whatsapp/status')
    status.value = res.data
  } catch (err) {
    error.value = err?.response?.data?.error || 'שגיאה בטעינת סטטוס WhatsApp'
  } finally {
    loading.value = false
  }
}

async function mockConnect() {
  connecting.value = true
  scanning.value = true
  // Simulate scan delay
  await new Promise(r => setTimeout(r, 2000))
  try {
    const res = await api.post('/whatsapp/connect', { phone: '050-' + Math.floor(Math.random() * 9000000 + 1000000) })
    status.value.connected = true
    status.value.phone = res.data.phone
    status.value.qr = null
  } catch (err) {
    error.value = err?.response?.data?.error || 'שגיאה בחיבור'
  } finally {
    connecting.value = false
    scanning.value = false
  }
}

async function disconnectWa() {
  if (!confirm('האם אתה בטוח שברצונך לנתק את חשבון WhatsApp?')) return
  disconnecting.value = true
  try {
    await api.post('/whatsapp/disconnect')
    status.value.connected = false
    status.value.phone = null
    await loadStatus()
  } catch (err) {
    error.value = err?.response?.data?.error || 'שגיאה בניתוק'
  } finally {
    disconnecting.value = false
  }
}

async function refreshQr() {
  await loadStatus()
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffMin < 1) return 'עכשיו'
  if (diffMin < 60) return `לפני ${diffMin} דק'`
  if (diffHr < 24) return `לפני ${diffHr} שע'`
  return `לפני ${diffDay} ימים`
}
</script>

<style scoped>
.wa-connect {
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
}

/* ── Skeletons ───────────────────────────────────────────── */
.wa-connect-loading { display: flex; flex-direction: column; gap: var(--space-5); }
.sk-title  { height: 60px; border-radius: var(--radius-lg); }
.wa-grid-skeleton { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
.sk-panel  { height: 340px; border-radius: var(--radius-xl); }
.sk-stats  { height: 100px; border-radius: var(--radius-xl); }

/* ── Page header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-1);
}
.page-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

/* Status badge */
.status-badge {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--font-size-sm);
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-connected {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.status-connected .status-dot {
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
  50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
}
.status-disconnected {
  background: var(--color-error-bg);
  color: var(--color-error);
}
.status-disconnected .status-dot { background: var(--color-error); }

/* ── Grid ────────────────────────────────────────────────── */
.wa-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-5);
  margin-bottom: var(--space-5);
}

/* ── Main panel ──────────────────────────────────────────── */
.wa-main-panel { overflow: hidden; }
.panel-body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}
.panel-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
}
.panel-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: calc(-1 * var(--space-3));
}

/* QR */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-bg-subtle);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  transition: border-color var(--transition);
}
.qr-container.qr-scanning {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-light);
}
.qr-image {
  width: 200px;
  height: 200px;
  border-radius: var(--radius);
}
.qr-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.qr-spinner {
  font-size: 2rem;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
.qr-timer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.qr-timer-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Steps */
.steps-section {
  width: 100%;
  text-align: right;
}
.steps-title {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}
.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: right;
}
.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: 800;
  flex-shrink: 0;
}
.step-text {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 500;
}

/* Connect button */
.btn-connect {
  width: 100%;
  padding: var(--space-4);
  font-size: var(--font-size-base);
  gap: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

/* Connected state */
.connected-panel { gap: var(--space-4); }
.connected-icon  { font-size: 3rem; }
.connected-title {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-success);
}
.connected-phone {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-navy);
}
.connected-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.connected-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  text-align: right;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.meta-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 600;
}
.meta-val {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.btn-danger-outline {
  border-color: var(--color-error);
  color: var(--color-error);
}
.btn-danger-outline:hover {
  background: var(--color-error-bg);
}

/* ── Side panel ──────────────────────────────────────────── */
.wa-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.card-pad { padding: var(--space-5); }
.card-title-sm {
  font-size: var(--font-size-base);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}

/* Quick links */
.quick-links { display: flex; flex-direction: column; gap: var(--space-2); }
.quick-link-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text);
  transition: all var(--transition);
  cursor: pointer;
}
.quick-link-btn:hover {
  background: var(--color-primary-bg);
  transform: translateX(-3px);
}
.ql-icon { font-size: 1.4rem; flex-shrink: 0; }
.ql-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.ql-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.ql-arrow {
  margin-right: auto;
  color: var(--color-primary);
  font-weight: 700;
  transition: transform var(--transition);
}
.quick-link-btn:hover .ql-arrow { transform: translateX(-3px); }

/* Tips */
.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.tips-list li {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  padding-right: var(--space-4);
  position: relative;
}
.tips-list li::before {
  content: '•';
  color: var(--color-primary);
  position: absolute;
  right: 0;
  font-weight: 700;
}

/* ── Stats row ───────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.stat-card { }
.stat-body {
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.stat-icon-primary { background: var(--color-primary-light); }
.stat-icon-success { background: var(--color-success-bg); }
.stat-icon-error   { background: var(--color-error-bg); }
.stat-icon-warning { background: var(--color-warning-bg); }
.stat-num {
  font-size: var(--font-size-2xl);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1;
}
.stat-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .wa-grid { grid-template-columns: 1fr; }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .wa-connect { padding: var(--space-4); }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .page-header { flex-direction: column; align-items: flex-start; }
}
</style>
