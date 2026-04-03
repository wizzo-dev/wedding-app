<template>
  <div class="wa-connect-page" dir="rtl">
    <div class="wa-card">
      <div v-if="status === 'connected'" class="connected-state">
        <div class="wa-check">✅</div>
        <h2>מחובר לוואטסאפ</h2>
        <p class="connected-phone">{{ phone }}</p>
        <div class="quick-links">
          <router-link to="/app/whatsapp/send" class="btn btn-primary">🚀 שלח הודעות</router-link>
          <router-link to="/app/whatsapp/templates" class="btn btn-outline">📝 תבניות</router-link>
        </div>
        <button class="btn btn-danger-outline" @click="disconnect">🔌 נתק</button>
      </div>

      <div v-else-if="status === 'qr'" class="qr-state">
        <h2>סרוק עם הוואטסאפ שלך</h2>
        <p>פתח וואטסאפ ← תפריט ← מכשירים מקושרים ← קשר מכשיר</p>
        <div class="qr-container">
          <img v-if="qrImage" :src="qrImage" class="qr-image" alt="QR Code" />
          <div v-else class="qr-spinner">⏳</div>
        </div>
        <p class="polling-hint">ממתין לסריקה...</p>
      </div>

      <div v-else-if="status === 'loading'" class="loading-state">
        <div class="spinner"></div>
        <h2>מאתחל חיבור...</h2>
        <p>זה עלול לקחת כ-30 שניות</p>
      </div>

      <div v-else class="disconnected-state">
        <div class="wa-logo">💬</div>
        <h2>חבר את הוואטסאפ שלך</h2>
        <p>שלח הודעות לאורחים ישירות מהמערכת</p>
        <button class="btn btn-primary btn-connect" @click="connect" :disabled="connecting">
          {{ connecting ? 'מתחבר...' : 'התחבר לוואטסאפ' }}
        </button>
      </div>
    </div>

    <!-- Quick actions sidebar -->
    <div class="wa-side">
      <div class="card">
        <div class="card-pad">
          <h3>⚡ פעולות מהירות</h3>
          <div class="quick-links-list">
            <router-link to="/app/whatsapp/templates" class="quick-link-btn">
              <span>📝</span>
              <div><div class="ql-title">תבניות הודעות</div><div class="ql-sub">נהל תבניות לשליחה</div></div>
              <span class="ql-arrow">←</span>
            </router-link>
            <router-link to="/app/whatsapp/send" class="quick-link-btn">
              <span>🚀</span>
              <div><div class="ql-title">שלח הודעות</div><div class="ql-sub">שלח לאורחים שנבחרו</div></div>
              <span class="ql-arrow">←</span>
            </router-link>
            <router-link to="/app/whatsapp/history" class="quick-link-btn">
              <span>📋</span>
              <div><div class="ql-title">היסטוריית שליחות</div><div class="ql-sub">מעקב אחר שליחות קודמות</div></div>
              <span class="ql-arrow">←</span>
            </router-link>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-pad">
          <h3>💡 טיפים</h3>
          <ul class="tips-list">
            <li>השתמש בתבניות לחסוך זמן בשליחה</li>
            <li>ניתן לשלוח הודעות מותאמות אישית עם שם האורח</li>
            <li>מומלץ לשלוח תזכורת שבוע לפני האירוע</li>
            <li>הודעות נשלחות ממספר WhatsApp שלך</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/composables/useApi'

const status = ref('disconnected')
const qrImage = ref(null)
const phone = ref(null)
const connecting = ref(false)
let pollInterval = null

async function loadStatus() {
  try {
    const res = await api.get('/whatsapp/status')
    status.value = res.data.status || 'disconnected'
    phone.value = res.data.phone
    if (res.data.status === 'qr') {
      const qrRes = await api.get('/whatsapp/qr').catch(() => null)
      if (qrRes && qrRes.status === 200 && qrRes.data?.qr) {
        qrImage.value = qrRes.data.qr
      }
    }
  } catch (e) {
    console.error('loadStatus error', e)
  }
}

async function connect() {
  connecting.value = true
  status.value = 'loading'
  try {
    const res = await api.post('/whatsapp/connect')
    status.value = res.data.status || 'loading'
    if (res.data.status === 'qr') {
      const qrRes = await api.get('/whatsapp/qr').catch(() => null)
      if (qrRes && qrRes.status === 200 && qrRes.data?.qr) {
        qrImage.value = qrRes.data.qr
      }
    }
  } catch (e) {
    console.error('connect error', e)
    status.value = 'disconnected'
  }
  connecting.value = false
  startPolling()
}

async function disconnect() {
  try {
    await api.post('/whatsapp/disconnect')
  } catch (e) {
    console.error('disconnect error', e)
  }
  status.value = 'disconnected'
  qrImage.value = null
  stopPolling()
}

function startPolling() {
  stopPolling()
  pollInterval = setInterval(async () => {
    await loadStatus()
    if (status.value === 'connected') stopPolling()
  }, 3000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(async () => {
  await loadStatus()
  if (status.value === 'qr' || status.value === 'loading') startPolling()
})

onUnmounted(stopPolling)
</script>

<style scoped>
.wa-connect-page {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-5);
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
  direction: rtl;
}

.wa-card {
  background: white;
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-5);
  min-height: 400px;
  justify-content: center;
}

/* Connected */
.connected-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.wa-check { font-size: 4rem; }
.connected-state h2 { font-size: var(--font-size-2xl); font-weight: 900; color: #10b981; margin: 0; }
.connected-phone { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }

/* QR */
.qr-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.qr-state h2 { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin: 0; }
.qr-container {
  padding: var(--space-4);
  background: #f8f9fb;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex; align-items: center; justify-content: center;
  min-width: 220px; min-height: 220px;
}
.qr-image { width: 200px; height: 200px; border-radius: var(--radius); }
.qr-spinner { font-size: 3rem; animation: spin 1.5s linear infinite; }
.polling-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); }

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.loading-state h2 { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin: 0; }
.spinner {
  width: 48px; height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Disconnected */
.disconnected-state { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.wa-logo { font-size: 4rem; }
.disconnected-state h2 { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); margin: 0; }
.btn-connect { width: 100%; max-width: 260px; padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); justify-content: center; }

/* Side */
.wa-side { display: flex; flex-direction: column; gap: var(--space-4); }
.card-pad { padding: var(--space-5); }
.card-pad h3 { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-4); }
.quick-links-list { display: flex; flex-direction: column; gap: var(--space-2); }
.quick-link-btn {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none; color: var(--color-text);
  transition: all var(--transition);
}
.quick-link-btn:hover { background: var(--color-primary-light); transform: translateX(-2px); }
.ql-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.ql-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.ql-arrow { margin-right: auto; color: var(--color-primary); font-weight: 700; }
.tips-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
.tips-list li { font-size: var(--font-size-sm); color: var(--color-text-muted); padding-right: var(--space-4); position: relative; }
.tips-list li::before { content: '•'; color: var(--color-primary); position: absolute; right: 0; font-weight: 700; }

/* Quick links in connected state */
.quick-links { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-family: inherit; font-size: var(--font-size-sm); font-weight: 600;
  cursor: pointer; border: none; text-decoration: none; transition: all 0.2s;
}
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-light); }
.btn-danger-outline { background: transparent; border: 1.5px solid #ef4444; color: #ef4444; }
.btn-danger-outline:hover { background: #fee2e2; }

@keyframes spin { 100% { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .wa-connect-page { grid-template-columns: 1fr; }
}
</style>
