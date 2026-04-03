<template>
  <div class="dashboard fade-in">
    <!-- ── Loading skeleton ─────────────────────────────────────────── -->
    <div v-if="loading" class="dashboard-loading">
      <div class="skeleton sk-hero"></div>
      <div class="skeleton-row">
        <div class="skeleton sk-stat" v-for="i in 4" :key="i"></div>
      </div>
      <div class="skeleton sk-card-wide"></div>
    </div>

    <!-- ── Error state ───────────────────────────────────────────────── -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הנתונים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadDashboard">נסה שוב</button>
    </div>

    <!-- ── Main content ──────────────────────────────────────────────── -->
    <template v-else-if="data">

      <!-- Hero -->
      <div class="dash-hero">
        <div class="dash-hero-text">
          <div class="hero-greeting">ברוכים הבאים</div>
          <h1 class="hero-names">
            {{ data.user.name1 }}
            <span class="heart">❤️</span>
            {{ data.user.name2 }}
          </h1>
          <div class="hero-meta">
            <span v-if="data.countdown.hasDate && formattedDate" class="hero-date">{{ formattedDate }}</span>
            <span
              v-if="data.countdown.hasDate && data.countdown.days >= 0"
              :class="['days-chip', data.countdown.days <= 30 ? 'urgent' : '']"
            >
              {{ data.countdown.days }} ימים נשארו
            </span>
            <span v-else-if="data.countdown.hasDate && data.countdown.days < 0" class="days-chip">
              🎊 מזל טוב!
            </span>
            <span v-else class="hero-no-date">
              <router-link to="/app/settings/account" class="set-date-link">הגדר תאריך חתונה →</router-link>
            </span>
          </div>
        </div>
        <div class="hero-decoration">💒</div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card" @click="$router.push('/app/guests')" role="button" tabindex="0">
          <div class="stat-icon">👥</div>
          <div class="stat-number">{{ data.guests.total }}</div>
          <div class="stat-label">סה"כ אורחים</div>
        </div>
        <div class="stat-card" @click="$router.push('/app/guests')" role="button" tabindex="0">
          <div class="stat-icon">✅</div>
          <div class="stat-number confirmed">{{ data.guests.confirmed }}</div>
          <div class="stat-label">מגיעים</div>
        </div>
        <div class="stat-card" @click="$router.push('/app/guests')" role="button" tabindex="0">
          <div class="stat-icon">❌</div>
          <div class="stat-number declined">{{ data.guests.declined }}</div>
          <div class="stat-label">לא מגיעים</div>
        </div>
        <div class="stat-card" @click="$router.push('/app/guests')" role="button" tabindex="0">
          <div class="stat-icon">⏳</div>
          <div class="stat-number pending">{{ data.guests.pending }}</div>
          <div class="stat-label">ממתינים</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-bar">
        <h2 class="section-title">פעולות מהירות</h2>
        <div class="quick-actions-grid">
          <router-link to="/app/guests" class="quick-action-btn">
            <span class="qa-icon">👤</span>
            <span>הוסף אורח</span>
          </router-link>
          <router-link to="/app/whatsapp" class="quick-action-btn">
            <span class="qa-icon">📤</span>
            <span>שלח WhatsApp</span>
          </router-link>
          <router-link to="/app/seating" class="quick-action-btn">
            <span class="qa-icon">🪑</span>
            <span>מפת ישיבה</span>
          </router-link>
          <router-link to="/app/invitations" class="quick-action-btn">
            <span class="qa-icon">🎴</span>
            <span>הזמנות</span>
          </router-link>
          <router-link to="/app/budget" class="quick-action-btn">
            <span class="qa-icon">💰</span>
            <span>תקציב</span>
          </router-link>
          <router-link to="/app/tasks" class="quick-action-btn">
            <span class="qa-icon">✅</span>
            <span>משימות</span>
          </router-link>
          <router-link to="/app/gifts" class="quick-action-btn">
            <span class="qa-icon">🎁</span>
            <span>מתנות</span>
          </router-link>
          <router-link to="/app/vendors" class="quick-action-btn">
            <span class="qa-icon">🏢</span>
            <span>ספקים</span>
          </router-link>
        </div>
      </div>

      <!-- Bottom Grid: RSVPs + Budget -->
      <div class="dash-grid">

        <!-- Recent RSVPs -->
        <div class="dash-card">
          <div class="card-hdr">
            <h2 class="card-title">תגובות אחרונות</h2>
            <router-link to="/app/guests" class="card-link">כל האורחים ←</router-link>
          </div>

          <div v-if="data.activity.length === 0" class="activity-empty">
            <p class="text-muted text-sm">טרם נוספו אורחים</p>
            <router-link to="/app/guests" class="btn btn-outline btn-sm" style="margin-top: var(--space-3)">הוסף אורחים</router-link>
          </div>

          <div v-else class="activity-list">
            <div
              v-for="item in data.activity"
              :key="item.guestId"
              class="activity-item"
            >
              <div class="activity-avatar">{{ item.guestName.charAt(0) }}</div>
              <div class="activity-info">
                <span class="activity-name">{{ item.guestName }}</span>
                <span class="activity-meta">{{ item.numPeople > 1 ? item.numPeople + ' מוזמנים' : 'מוזמן אחד' }}</span>
              </div>
              <div class="activity-status">
                <span class="badge" :class="rsvpBadgeClass(item.rsvpStatus)">
                  {{ rsvpLabel(item.rsvpStatus) }}
                </span>
                <span class="activity-time">{{ formatRelativeTime(item.at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Budget Summary -->
        <div class="dash-card">
          <div class="card-hdr">
            <h2 class="card-title">סיכום תקציב</h2>
            <router-link to="/app/budget" class="card-link">לניהול תקציב ←</router-link>
          </div>

          <div v-if="data.budget.total === 0" class="budget-empty">
            <p>עדיין לא הוגדר תקציב</p>
            <router-link to="/app/budget" class="btn btn-outline btn-sm">הגדר תקציב</router-link>
          </div>
          <template v-else>
            <div class="budget-numbers">
              <div>
                <div class="budget-big-num">{{ formatCurrency(data.budget.remaining) }}</div>
                <div class="budget-big-lbl">נשאר</div>
              </div>
              <div class="budget-total-info">מתוך {{ formatCurrency(data.budget.total) }}</div>
            </div>

            <div class="budget-progress-wrap">
              <div class="budget-bar">
                <div
                  class="budget-fill"
                  :class="{ overspent: data.budget.percent > 100 }"
                  :style="{ width: Math.min(data.budget.percent, 100) + '%' }"
                ></div>
              </div>
              <span class="budget-pct" :class="{ 'budget-pct-danger': data.budget.percent > 90 }">
                {{ data.budget.percent }}%
              </span>
            </div>
            <p class="budget-spent-label">הוצא: {{ formatCurrency(data.budget.spent) }}</p>
          </template>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/composables/useApi'

const auth = useAuthStore()
const data = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(() => {
  loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/dashboard')
    data.value = res.data
    if (res.data.user && auth.user) {
      auth.user = { ...auth.user, ...res.data.user }
    }
  } catch (err) {
    error.value = err?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

const formattedDate = computed(() => {
  if (!data.value?.user?.weddingDate) return null
  return new Date(data.value.user.weddingDate).toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

function formatCurrency(amount) {
  if (!amount) return '₪0'
  return '₪' + Math.round(amount).toLocaleString('he-IL')
}

function formatRelativeTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1)  return 'עכשיו'
  if (diffMin < 60) return `לפני ${diffMin} דק'`
  if (diffHr < 24)  return `לפני ${diffHr} שע'`
  if (diffDay < 7)  return `לפני ${diffDay} ימים`
  return d.toLocaleDateString('he-IL')
}

function rsvpLabel(status) {
  const map = {
    confirmed: 'מגיע ✅',
    declined:  'לא מגיע ❌',
    pending:   'ממתין ⏳'
  }
  return map[status] || status
}

function rsvpBadgeClass(status) {
  const map = {
    confirmed: 'badge-success',
    declined:  'badge-error',
    pending:   'badge-neutral'
  }
  return map[status] || 'badge-neutral'
}
</script>

<style scoped>
/* ── Page ── */
.dashboard {
  /* Content lives inside .page-content from layout */
}

/* ── Skeletons ── */
.dashboard-loading { display: flex; flex-direction: column; gap: var(--space-6); }
.sk-hero { height: 140px; border-radius: var(--radius-xl); }
.skeleton-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.sk-stat { height: 110px; border-radius: var(--radius-lg); }
.sk-card-wide { height: 200px; border-radius: var(--radius-xl); }

/* ── Hero ── */
.dash-hero {
  background: linear-gradient(135deg, #FFF5F9 0%, #F0F3FF 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 36px 40px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}

.hero-decoration {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 90px;
  opacity: 0.05;
  pointer-events: none;
  user-select: none;
}

.hero-greeting {
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 6px;
  font-weight: 500;
}

.hero-names {
  font-family: 'Cormorant Garamond', serif;
  font-size: 38px;
  font-weight: 700;
  color: var(--color-navy);
  margin: 0 0 14px;
  line-height: 1.15;
}

.heart {
  color: var(--color-primary);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-date {
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.days-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 14px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.days-chip.urgent {
  background: #FEE2E2;
  color: #DC2626;
}

.set-date-link {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}
.set-date-link:hover { opacity: 0.75; }

/* ── Stats Row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow var(--transition), transform var(--transition);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 10px;
  line-height: 1;
}

.stat-number {
  font-family: 'Cormorant Garamond', serif;
  font-size: 44px;
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-number.confirmed { color: #16A34A; }
.stat-number.declined  { color: #DC2626; }
.stat-number.pending   { color: #D97706; }

.stat-label {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* ── Quick Actions ── */
.quick-actions-bar {
  margin-bottom: 28px;
}

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: 14px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 8px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  transition: all var(--transition);
  text-align: center;
}

.quick-action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: var(--shadow-pink);
}

.qa-icon { font-size: 22px; line-height: 1; }

/* ── Main grid ── */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dash-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-navy);
}

.card-link {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--transition-fast);
}
.card-link:hover { opacity: 0.75; }

/* Activity list */
.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.activity-item:last-child { border-bottom: none; padding-bottom: 0; }

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.activity-name {
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.activity-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

/* Budget */
.budget-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.budget-numbers {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.budget-big-num {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px;
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
}

.budget-big-lbl {
  font-size: 12px;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-top: 2px;
}

.budget-total-info {
  font-size: 13px;
  color: var(--color-text-muted);
}

.budget-progress-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 8px;
}

.budget-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.budget-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #E8529A);
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.budget-fill.overspent { background: var(--color-error); }

.budget-pct {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  min-width: 3.5ch;
}

.budget-pct-danger { color: var(--color-error); }

.budget-spent-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
  .quick-actions-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 600px) {
  .dash-hero { padding: 24px 20px; }
  .hero-names { font-size: 28px; }
  .hero-decoration { display: none; }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-number { font-size: 36px; }
  .quick-actions-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .quick-action-btn { padding: 12px 4px; font-size: 10px; }
  .qa-icon { font-size: 18px; }
}
</style>
