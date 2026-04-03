<template>
  <div class="notifications-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div class="header-main">
        <div>
          <h1 class="page-title">התראות 🔔</h1>
          <p class="page-sub">כל ההתראות שלכם במקום אחד</p>
        </div>
        <button
          v-if="unreadCount > 0"
          class="btn btn-outline"
          @click="markAllRead"
          :disabled="markingAll"
        >
          <span v-if="markingAll">מסמן...</span>
          <span v-else>✓ סמן הכל כנקרא ({{ unreadCount }})</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען התראות...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="notifications.length === 0" class="empty-state">
      <div class="empty-icon">🔕</div>
      <h2 class="empty-title">אין התראות</h2>
      <p class="empty-sub">כשיהיו חדשות חשובות — תקבלו התראה כאן</p>
    </div>

    <!-- Notifications grouped by date -->
    <div v-else class="notifications-list">
      <div
        v-for="group in groupedNotifications"
        :key="group.dateLabel"
        class="notif-group"
      >
        <div class="group-label">{{ group.dateLabel }}</div>
        <div
          v-for="n in group.items"
          :key="n.id"
          class="notif-card"
          :class="{ unread: !n.isRead }"
          @click="markRead(n)"
          role="button"
          tabindex="0"
          @keydown.enter="markRead(n)"
          :aria-label="n.title"
        >
          <div class="notif-icon">{{ typeIcon(n.type) }}</div>
          <div class="notif-body">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-text">{{ n.body }}</div>
            <div class="notif-time">{{ formatTime(n.createdAt) }}</div>
          </div>
          <div class="notif-dot" v-if="!n.isRead" aria-label="לא נקרא"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-alert">⚠️ {{ error }}</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(true)
const markingAll = ref(false)
const error = ref(null)

const TYPE_ICONS = {
  rsvp_received: '💌',
  gift_received: '🎁',
  task_due: '⏰',
  system: '📢'
}

function typeIcon(type) {
  return TYPE_ICONS[type] || '📢'
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const dStr = d.toDateString()
  if (dStr === today.toDateString()) return 'היום'
  if (dStr === yesterday.toDateString()) return 'אתמול'
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const groupedNotifications = computed(() => {
  const groups = {}
  for (const n of notifications.value) {
    const label = dateLabel(n.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }
  return Object.entries(groups).map(([dateLabel, items]) => ({ dateLabel, items }))
})

async function loadNotifications() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data.notifications || []
    unreadCount.value = res.data.unreadCount || 0
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת ההתראות'
  } finally {
    loading.value = false
  }
}

async function markRead(n) {
  if (n.isRead) return
  try {
    await api.patch(`/notifications/${n.id}/read`)
    n.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {}
}

async function markAllRead() {
  markingAll.value = true
  try {
    await api.patch('/notifications/read-all')
    notifications.value.forEach(n => { n.isRead = true })
    unreadCount.value = 0
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בסימון ההתראות'
  } finally {
    markingAll.value = false
  }
}

onMounted(loadNotifications)
</script>

<style scoped>
.notifications-view {
  padding: var(--space-6);
  max-width: 700px;
}

/* Header */
.page-header { margin-bottom: var(--space-6); }
.header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12);
  color: var(--color-text-muted);
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
  color: var(--color-text-muted);
}
.empty-icon { font-size: 3.5rem; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-sub { font-size: var(--font-size-sm); }

/* Groups */
.notifications-list { display: flex; flex-direction: column; gap: var(--space-6); }

.notif-group { display: flex; flex-direction: column; gap: var(--space-3); }

.group-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

/* Notification card */
.notif-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.notif-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}

.notif-card.unread {
  background: linear-gradient(135deg, #fff0f7, #fff);
  border-color: var(--color-primary-light);
}

.notif-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
}

.notif-card.unread .notif-icon {
  background: var(--color-primary-light);
}

.notif-body { flex: 1; min-width: 0; }

.notif-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: 4px;
}

.notif-text {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.5;
}

.notif-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 6px;
}

.notif-dot {
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  border: 2px solid var(--color-primary);
}

/* Buttons */
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
  white-space: nowrap;
}
.btn-outline {
  background: transparent;
  border: 1.5px solid var(--color-primary);
  color: var(--color-primary);
}
.btn-outline:hover:not(:disabled) { background: var(--color-primary-light); }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

/* Error */
.error-alert {
  margin-top: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

@media (max-width: 600px) {
  .notifications-view { padding: var(--space-4); }
  .header-main { flex-direction: column; }
}
</style>
