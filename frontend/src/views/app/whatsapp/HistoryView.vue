<template>
  <div class="history-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title"><span>📋</span> היסטוריית שליחות</h1>
        <p class="page-subtitle">כל ההודעות שנשלחו לאורחים</p>
      </div>
      <router-link to="/app/whatsapp/send" class="btn btn-primary">✉️ שליחה חדשה</router-link>
    </header>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.value"
        class="tab-btn" :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value">
        {{ tab.label }}
        <span v-if="tabCount(tab.value)" class="tab-count">{{ tabCount(tab.value) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="center-state">
      <div class="spinner"></div>
      <p>טוען היסטוריה...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="center-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <button @click="load" class="btn btn-outline">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="center-state">
      <div style="font-size:3rem">📭</div>
      <h3>אין הודעות להצגה</h3>
      <p>{{ activeTab === 'all' ? 'לאחר שתשלח הודעות, הן יופיעו כאן' : 'אין הודעות בסטטוס זה' }}</p>
      <router-link v-if="activeTab === 'all'" to="/app/whatsapp/send" class="btn btn-primary">שלח הודעה ראשונה</router-link>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="msg-table">
        <thead>
          <tr>
            <th>תאריך</th>
            <th>תבנית</th>
            <th>נמענים</th>
            <th>סטטוס</th>
            <th>פעולה</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in filtered" :key="m.id">
            <td>
              <span class="date-main">{{ fmtDate(m.sentAt || m.scheduledAt || m.createdAt) }}</span>
              <span v-if="m.scheduledAt && !m.sentAt" class="date-tag">מתוזמן</span>
            </td>
            <td>
              <span class="type-badge" :class="m.templateType">{{ typeLabel(m.templateType) }}</span>
              <span class="tmpl-name">{{ m.templateName }}</span>
            </td>
            <td>
              <b>{{ m.recipientCount }}</b> אורחים
              <div v-if="m.sent || m.failed" class="mini-row">
                <span class="ok">✓{{ m.sent }}</span>
                <span v-if="m.failed" class="fail">✗{{ m.failed }}</span>
              </div>
            </td>
            <td><span class="status-badge" :class="m.status">{{ statusLabel(m.status) }}</span></td>
            <td>
              <button v-if="m.status === 'pending'" @click="cancel(m)"
                :disabled="cancelling === m.id" class="btn-cancel">
                {{ cancelling === m.id ? '...' : 'בטל' }}
              </button>
              <span v-else class="dash">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const items = ref([])
const loading = ref(false)
const error = ref(null)
const activeTab = ref('all')
const cancelling = ref(null)

const tabs = [
  { value: 'all', label: 'הכל' },
  { value: 'pending', label: 'ממתין' },
  { value: 'sent', label: 'נשלח' },
  { value: 'failed', label: 'נכשל' },
]

const filtered = computed(() =>
  activeTab.value === 'all' ? items.value : items.value.filter(m => m.status === activeTab.value)
)
function tabCount(v) { return v === 'all' ? 0 : items.value.filter(m => m.status === v).length }

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/whatsapp/messages', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) throw new Error('שגיאה בטעינת ההיסטוריה')
    items.value = await res.json()
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function cancel(msg) {
  if (!confirm(`לבטל שליחה ל-${msg.recipientCount} אורחים?`)) return
  cancelling.value = msg.id
  try {
    const res = await fetch(`/api/whatsapp/messages/${msg.id}/cancel`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) throw new Error('שגיאה בביטול')
    msg.status = 'cancelled'
  } catch (e) { alert(e.message) }
  finally { cancelling.value = null }
}

function statusLabel(s) {
  return { sent:'נשלח', pending:'ממתין', failed:'נכשל', partial:'חלקי', cancelled:'בוטל' }[s] || s
}
function typeLabel(t) {
  return { rsvp_invite:'הזמנה', rsvp:'RSVP', reminder:'תזכורת', thank_you:'תודה', custom:'מותאם' }[t] || t
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

onMounted(load)
</script>

<style scoped>
.history-view { max-width: 960px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); display: flex; align-items: center; gap: var(--space-2); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.filter-tabs { display: flex; gap: var(--space-2); border-bottom: 2px solid var(--color-border); margin-bottom: var(--space-5); }
.tab-btn { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; padding: var(--space-3) var(--space-4); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; gap: 6px; }
.tab-btn:hover { color: var(--color-navy); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.tab-count { background: var(--color-primary); color: #fff; border-radius: var(--radius-full); font-size: 11px; padding: 1px 6px; }

.center-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.center-state h3 { color: var(--color-navy); font-weight: 700; margin: var(--space-3) 0 var(--space-2); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { background: var(--color-bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; }
.msg-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.msg-table thead tr { background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); }
.msg-table th { padding: var(--space-3) var(--space-4); text-align: right; font-weight: 700; color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .05em; }
.msg-table tbody tr { border-bottom: 1px solid var(--color-border); transition: background var(--transition-fast); }
.msg-table tbody tr:last-child { border-bottom: none; }
.msg-table tbody tr:hover { background: var(--color-bg-subtle); }
.msg-table td { padding: var(--space-3) var(--space-4); vertical-align: middle; }

.date-main { display: block; color: var(--color-navy); font-weight: 600; }
.date-tag { font-size: 10px; color: var(--color-warning); display: block; }

.type-badge { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: var(--radius-full); font-weight: 700; margin-left: var(--space-2); }
.type-badge.rsvp_invite, .type-badge.rsvp { background: #ede9fe; color: #5b21b6; }
.type-badge.reminder { background: var(--color-info-bg); color: #1e40af; }
.type-badge.thank_you { background: var(--color-success-bg); color: #065f46; }
.type-badge.custom { background: var(--color-primary-light); color: #9d174d; }
.tmpl-name { color: var(--color-navy); }

.mini-row { font-size: var(--font-size-xs); margin-top: 2px; }
.ok { color: var(--color-success); margin-left: 8px; }
.fail { color: var(--color-error); }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.status-badge.sent { background: var(--color-success-bg); color: #065f46; }
.status-badge.pending { background: var(--color-warning-bg); color: #92400e; }
.status-badge.failed { background: var(--color-error-bg); color: #991b1b; }
.status-badge.partial { background: #fef3c7; color: #92400e; }
.status-badge.cancelled { background: var(--color-border); color: var(--color-text-muted); }

.btn-cancel { background: none; border: 1.5px solid var(--color-error); color: var(--color-error); border-radius: var(--radius-sm); padding: 3px 12px; font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; font-family: var(--font); transition: all var(--transition-fast); }
.btn-cancel:hover:not(:disabled) { background: var(--color-error-bg); }
.btn-cancel:disabled { opacity: .5; cursor: not-allowed; }
.dash { color: var(--color-text-light); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-5); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

@media (max-width: 680px) {
  .history-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .table-wrap { overflow-x: auto; }
  .msg-table { min-width: 560px; }
}
</style>
