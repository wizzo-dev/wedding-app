<template>
  <div class="history-view" dir="rtl">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">📋</span>
          היסטוריית שליחות
        </h1>
        <p class="page-subtitle">כל ההודעות שנשלחו לאורחים</p>
      </div>
      <router-link to="/app/whatsapp/send" class="btn btn-primary">
        <span>✉️</span> שליחה חדשה
      </router-link>
    </header>

    <!-- Stats Bar -->
    <div v-if="!loading && batches.length" class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ totalBatches }}</span>
        <span class="stat-label">שליחות</span>
      </div>
      <div class="stat-item success">
        <span class="stat-value">{{ totalSent }}</span>
        <span class="stat-label">נשלחו</span>
      </div>
      <div class="stat-item danger">
        <span class="stat-value">{{ totalFailed }}</span>
        <span class="stat-label">נכשלו</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ successRate }}%</span>
        <span class="stat-label">הצלחה</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען היסטוריה...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadHistory" class="btn btn-outline">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!batches.length" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>לא נשלחו הודעות עדיין</h3>
      <p>לאחר שתשלח הודעות לאורחים, הן יופיעו כאן</p>
      <router-link to="/app/whatsapp/send" class="btn btn-primary">שלח הודעה ראשונה</router-link>
    </div>

    <!-- Batches List -->
    <div v-else class="batches-list">
      <div
        v-for="batch in batches"
        :key="batch.id"
        class="batch-card"
        :class="`status-${batch.status}`"
      >
        <div class="batch-header">
          <div class="batch-meta">
            <span class="batch-status-badge" :class="batch.status">
              {{ statusLabel(batch.status) }}
            </span>
            <span class="batch-template">
              <span class="template-type-badge" :class="batch.templateType">{{ templateTypeLabel(batch.templateType) }}</span>
              {{ batch.templateName }}
            </span>
          </div>
          <span class="batch-time">{{ formatDate(batch.sentAt) }}</span>
        </div>

        <div class="batch-stats">
          <div class="batch-stat">
            <span class="stat-num">{{ batch.total }}</span>
            <span class="stat-lbl">נמענים</span>
          </div>
          <div class="batch-stat success">
            <span class="stat-num">{{ batch.sent }}</span>
            <span class="stat-lbl">✅ הצלחה</span>
          </div>
          <div class="batch-stat danger" v-if="batch.failed > 0">
            <span class="stat-num">{{ batch.failed }}</span>
            <span class="stat-lbl">❌ נכשלו</span>
          </div>
          <div class="batch-stat">
            <div class="mini-progress">
              <div
                class="mini-progress-fill"
                :style="{ width: batch.total > 0 ? (batch.sent / batch.total * 100) + '%' : '0%' }"
              ></div>
            </div>
            <span class="stat-lbl">{{ batch.total > 0 ? Math.round(batch.sent / batch.total * 100) : 0 }}%</span>
          </div>
        </div>

        <!-- Failed recipients -->
        <div v-if="batch.failed > 0 && expandedBatch === batch.id" class="failed-list">
          <p class="failed-title">❌ נכשל לשלוח ל:</p>
          <div v-for="r in batch.results.filter(r => r.status === 'failed')" :key="r.guestId" class="failed-item">
            <span>{{ r.name || r.phone }}</span>
            <span class="failed-reason">{{ r.error || 'שגיאה לא ידועה' }}</span>
          </div>
        </div>

        <div class="batch-footer">
          <button
            v-if="batch.failed > 0"
            @click="toggleExpand(batch.id)"
            class="btn-link"
          >
            {{ expandedBatch === batch.id ? '▲ הסתר' : '▼ הצג כשלונות' }}
          </button>
          <span v-else class="all-success">🎉 כולם נשלחו בהצלחה!</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const batches = ref([])
const loading = ref(false)
const error = ref(null)
const expandedBatch = ref(null)

const totalBatches = computed(() => batches.value.length)
const totalSent = computed(() => batches.value.reduce((s, b) => s + b.sent, 0))
const totalFailed = computed(() => batches.value.reduce((s, b) => s + b.failed, 0))
const successRate = computed(() => {
  const total = totalSent.value + totalFailed.value
  return total > 0 ? Math.round((totalSent.value / total) * 100) : 0
})

async function loadHistory() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/whatsapp/history', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) throw new Error('שגיאה בטעינת ההיסטוריה')
    batches.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expandedBatch.value = expandedBatch.value === id ? null : id
}

function statusLabel(s) {
  return { sent: 'נשלח', pending: 'ממתין', failed: 'נכשל', partial: 'חלקי' }[s] || s
}

function templateTypeLabel(t) {
  return { rsvp: 'RSVP', reminder: 'תזכורת', custom: 'מותאם', info: 'מידע' }[t] || t
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

onMounted(loadHistory)
</script>

<style scoped>
.history-view {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--space-6);
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}
.header-content {}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.title-icon { font-size: 1.4rem; }
.page-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 60px;
}
.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  line-height: 1;
}
.stat-item.success .stat-value { color: #10b981; }
.stat-item.danger .stat-value { color: #ef4444; }
.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* States */
.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--color-text-muted);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--space-4);
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 2rem; display: block; margin-bottom: var(--space-2); }
.empty-icon { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-state h3 { color: var(--color-navy); font-weight: 700; margin-bottom: var(--space-2); }

/* Batches */
.batches-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.batch-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  border-right: 4px solid transparent;
  transition: box-shadow 0.2s;
}
.batch-card:hover { box-shadow: var(--shadow-md); }
.batch-card.status-sent { border-right-color: #10b981; }
.batch-card.status-partial { border-right-color: #f59e0b; }
.batch-card.status-failed { border-right-color: #ef4444; }
.batch-card.status-pending { border-right-color: #6b7280; }

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  gap: var(--space-2);
  flex-wrap: wrap;
}
.batch-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.batch-status-badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 100px;
}
.batch-status-badge.sent { background: #d1fae5; color: #065f46; }
.batch-status-badge.partial { background: #fef3c7; color: #92400e; }
.batch-status-badge.failed { background: #fee2e2; color: #991b1b; }
.batch-status-badge.pending { background: #f3f4f6; color: #374151; }

.batch-template {
  font-size: var(--font-size-sm);
  color: var(--color-navy);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.template-type-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 100px;
  font-weight: 700;
}
.template-type-badge.rsvp { background: #ede9fe; color: #5b21b6; }
.template-type-badge.reminder { background: #dbeafe; color: #1e40af; }
.template-type-badge.custom { background: #fce7f3; color: #9d174d; }
.template-type-badge.info { background: #d1fae5; color: #065f46; }

.batch-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Batch Stats */
.batch-stats {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}
.batch-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 48px;
}
.stat-num {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-navy);
  line-height: 1;
}
.batch-stat.success .stat-num { color: #10b981; }
.batch-stat.danger .stat-num { color: #ef4444; }
.stat-lbl { font-size: 11px; color: var(--color-text-muted); }

.mini-progress {
  width: 80px; height: 6px;
  background: var(--color-border);
  border-radius: 100px;
  overflow: hidden;
}
.mini-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 100px;
  transition: width 0.4s ease;
}

/* Failed list */
.failed-list {
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border);
}
.failed-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #ef4444;
  margin-bottom: var(--space-2);
}
.failed-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--color-border);
  gap: var(--space-2);
}
.failed-reason { color: var(--color-text-muted); font-size: var(--font-size-xs); }

/* Footer */
.batch-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);
}
.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-family: inherit;
  padding: 0;
}
.all-success {
  font-size: var(--font-size-xs);
  color: #10b981;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline {
  background: transparent;
  border: 1.5px solid var(--color-primary);
  color: var(--color-primary);
}
.btn-outline:hover { background: #fce7f3; }

/* Responsive */
@media (max-width: 600px) {
  .history-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .stats-bar { gap: var(--space-3); }
  .batch-stats { gap: var(--space-2); }
}
</style>
