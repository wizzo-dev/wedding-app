<template>
  <div class="dashboard fade-in">
    <!-- ── Loading skeleton ─────────────────────────────────────────── -->
    <div v-if="loading" class="dashboard-loading">
      <div class="skeleton sk-greeting"></div>
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
      <!-- Greeting header -->
      <div class="dash-header">
        <div class="dash-greeting">
          <h1 class="greeting-text">
            שלום {{ data.user.name1 }} ו{{ data.user.name2 }}! 💍
          </h1>
          <p class="greeting-sub">{{ greetingSub }}</p>
        </div>
        <!-- Countdown or no-date CTA -->
        <div v-if="data.countdown.hasDate" class="countdown-badge" :class="{ urgent: data.countdown.days <= 30 }">
          <span class="countdown-num">{{ Math.max(0, data.countdown.days) }}</span>
          <span class="countdown-label">ימים לחתונה</span>
        </div>
        <div v-else class="no-date-cta">
          <p class="no-date-text">טרם קבעת תאריך</p>
          <router-link to="/app/settings/account" class="btn btn-primary btn-sm">הגדר תאריך חתונה</router-link>
        </div>
      </div>

      <!-- ── Wedding date set but passed ──────────────────────────── -->
      <div v-if="data.countdown.hasDate && data.countdown.days < 0" class="congrats-banner">
        🎊 מזל טוב! החתונה כבר עברה. נשמח לשמוע איך היה!
      </div>

      <!-- ── Stats row ────────────────────────────────────────────── -->
      <div class="stats-row">
        <div class="stat-card card card-hover" @click="$router.push('/app/guests')">
          <div class="stat-card-body">
            <div class="stat-icon stat-icon-success">✅</div>
            <div>
              <div class="stat-num">{{ data.guests.confirmed }}</div>
              <div class="stat-lbl">אורחים מאושרים</div>
            </div>
          </div>
        </div>
        <div class="stat-card card card-hover" @click="$router.push('/app/guests')">
          <div class="stat-card-body">
            <div class="stat-icon stat-icon-warning">⏳</div>
            <div>
              <div class="stat-num">{{ data.guests.pending }}</div>
              <div class="stat-lbl">ממתינים לאישור</div>
            </div>
          </div>
        </div>
        <div class="stat-card card card-hover" @click="$router.push('/app/guests')">
          <div class="stat-card-body">
            <div class="stat-icon stat-icon-error">❌</div>
            <div>
              <div class="stat-num">{{ data.guests.declined }}</div>
              <div class="stat-lbl">לא מגיעים</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-total card card-hover" @click="$router.push('/app/guests')">
          <div class="stat-card-body">
            <div class="stat-icon stat-icon-primary">👥</div>
            <div>
              <div class="stat-num stat-num-primary">{{ data.guests.total }}</div>
              <div class="stat-lbl">סה"כ אורחים</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Main grid ─────────────────────────────────────────────── -->
      <div class="dash-grid">
        <!-- Budget card -->
        <div class="card dash-card budget-card">
          <div class="card-body">
            <div class="card-hdr">
              <h2 class="card-title">💰 תקציב</h2>
              <router-link to="/app/budget" class="card-link">לניהול תקציב ←</router-link>
            </div>

            <div v-if="data.budget.total === 0" class="budget-empty">
              <p>עדיין לא הוגדר תקציב</p>
              <router-link to="/app/budget" class="btn btn-outline btn-sm">הגדר תקציב</router-link>
            </div>
            <template v-else>
              <div class="budget-amounts">
                <div class="budget-remaining">
                  <span class="budget-remaining-num">{{ formatCurrency(data.budget.remaining) }}</span>
                  <span class="budget-remaining-lbl">נשאר</span>
                </div>
                <div class="budget-total-lbl">מתוך {{ formatCurrency(data.budget.total) }}</div>
              </div>

              <div class="budget-progress">
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

        <!-- Quick actions -->
        <div class="card dash-card quick-actions-card">
          <div class="card-body">
            <h2 class="card-title">⚡ פעולות מהירות</h2>
            <div class="quick-actions-grid">
              <router-link to="/app/guests" class="quick-action-btn">
                <span class="qa-icon">👥</span>
                <span>אורחים</span>
              </router-link>
              <router-link to="/app/budget" class="quick-action-btn">
                <span class="qa-icon">💰</span>
                <span>תקציב</span>
              </router-link>
              <router-link to="/app/seating" class="quick-action-btn">
                <span class="qa-icon">🪑</span>
                <span>הושבה</span>
              </router-link>
              <router-link to="/app/whatsapp" class="quick-action-btn">
                <span class="qa-icon">💬</span>
                <span>וואטסאפ</span>
              </router-link>
              <router-link to="/app/vendors" class="quick-action-btn">
                <span class="qa-icon">🏪</span>
                <span>ספקים</span>
              </router-link>
              <router-link to="/app/gifts" class="quick-action-btn">
                <span class="qa-icon">🎁</span>
                <span>מתנות</span>
              </router-link>
              <router-link to="/app/tasks" class="quick-action-btn">
                <span class="qa-icon">✅</span>
                <span>משימות</span>
              </router-link>
              <router-link to="/app/cards" class="quick-action-btn">
                <span class="qa-icon">✉️</span>
                <span>הזמנות</span>
              </router-link>
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card dash-card activity-card">
          <div class="card-body">
            <div class="card-hdr">
              <h2 class="card-title">🕐 פעילות אחרונה</h2>
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
                <div class="activity-avatar">
                  {{ item.guestName.charAt(0) }}
                </div>
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
    // Sync auth user with latest data if needed
    if (res.data.user && auth.user) {
      auth.user = { ...auth.user, ...res.data.user }
    }
  } catch (err) {
    error.value = err?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

const greetingSub = computed(() => {
  if (!data.value) return ''
  const { countdown, guests } = data.value
  if (!countdown.hasDate) return 'מוכנים לתכנן את היום הגדול?'
  if (countdown.days < 0) return 'מזל טוב על החתונה! 🎊'
  if (countdown.days === 0) return 'היום הגדול הגיע! 🎊'
  if (countdown.days <= 7) return `עוד ${countdown.days} ימים — הכל מוכן?`
  if (countdown.days <= 30) return `עוד חודש! בדקו שהכל מסודר 🔔`
  if (guests.total === 0) return 'מתחילים? הוסיפו את רשימת האורחים'
  return `${guests.confirmed} אורחים מאשרים מתוך ${guests.total} סה"כ`
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
/* ── Page ───────────────────────────────────────────────── */
.dashboard {
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
}

/* ── Loading skeletons ──────────────────────────────────── */
.dashboard-loading { display: flex; flex-direction: column; gap: var(--space-6); }
.sk-greeting { height: 80px; border-radius: var(--radius-lg); }
.skeleton-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.sk-stat { height: 96px; border-radius: var(--radius-xl); }
.sk-card-wide { height: 200px; border-radius: var(--radius-xl); }

/* ── Header ─────────────────────────────────────────────── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}

.greeting-text {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-1);
  line-height: 1.2;
}
.greeting-sub {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
}

/* Countdown badge */
.countdown-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: #fff;
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-pink);
  min-width: 130px;
  flex-shrink: 0;
}
.countdown-badge.urgent {
  animation: pulse-badge 2s infinite;
}
@keyframes pulse-badge {
  0%, 100% { box-shadow: var(--shadow-pink); }
  50% { box-shadow: 0 8px 32px rgba(233,30,140,0.5); }
}
.countdown-num {
  font-size: var(--font-size-5xl);
  font-weight: 900;
  line-height: 1;
}
.countdown-label {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  font-weight: 600;
  margin-top: 4px;
}

/* No date CTA */
.no-date-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  background: var(--color-primary-bg);
  border: 1.5px dashed var(--color-primary);
  border-radius: var(--radius-xl);
}
.no-date-text {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
}

/* Congrats banner */
.congrats-banner {
  background: linear-gradient(90deg, var(--color-primary-light), #fff8e7);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
  font-weight: 600;
  color: var(--color-navy);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-base);
}

/* ── Stats row ──────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  cursor: pointer;
  transition: box-shadow var(--transition), transform var(--transition);
}
.stat-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-3px);
}
.stat-card-body {
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}
.stat-icon-success { background: var(--color-success-bg); }
.stat-icon-warning { background: var(--color-warning-bg); }
.stat-icon-error   { background: var(--color-error-bg); }
.stat-icon-primary { background: var(--color-primary-light); }

.stat-num {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1;
}
.stat-num-primary { color: var(--color-primary); }
.stat-lbl {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
  margin-top: 2px;
}

/* ── Main grid ──────────────────────────────────────────── */
.dash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: var(--space-5);
}

.dash-card { overflow: hidden; }

.card-body {
  padding: var(--space-6);
}

.card-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.card-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-navy);
}
.card-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: 600;
  transition: opacity var(--transition-fast);
}
.card-link:hover { opacity: 0.75; }

/* ── Budget card ────────────────────────────────────────── */
.budget-card { grid-column: 1; }

.budget-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.budget-amounts {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}
.budget-remaining-num {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1;
}
.budget-remaining-lbl {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 600;
  margin-right: var(--space-2);
}
.budget-total-lbl {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.budget-progress {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.budget-bar {
  flex: 1;
  height: 10px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.budget-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}
.budget-fill.overspent { background: var(--color-error); }
.budget-pct {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
  min-width: 3ch;
}
.budget-pct-danger { color: var(--color-error); }
.budget-spent-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Quick actions card ─────────────────────────────────── */
.quick-actions-card {
  grid-column: 2;
  grid-row: 1 / 3;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-top: var(--space-4);
}
.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition);
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
}
.quick-action-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: var(--shadow-pink);
}
.qa-icon { font-size: 1.6rem; line-height: 1; }

/* ── Activity card ──────────────────────────────────────── */
.activity-card {
  grid-column: 1;
}

.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) 0;
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
  border-radius: var(--radius-full);
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
}
.activity-name {
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--color-text);
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
}
.activity-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-light);
}

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 1100px) {
  .quick-actions-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
  .quick-actions-card { grid-column: 1; grid-row: auto; }
}

@media (max-width: 600px) {
  .dashboard { padding: var(--space-4); }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
  .greeting-text { font-size: var(--font-size-2xl); }
  .countdown-num { font-size: var(--font-size-4xl); }
  .dash-header { flex-direction: column; align-items: flex-start; }
  .quick-actions-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 420px) {
  /* Tighten stat cards so they don't overflow at 375px */
  .stat-card-body { padding: var(--space-3); gap: var(--space-2); }
  .stat-icon { width: 38px; height: 38px; font-size: 1.1rem; }
  .stat-num { font-size: var(--font-size-2xl); }
  /* Quick actions: 4-col is tight at 375px, keep icons visible */
  .quick-action-btn { padding: var(--space-3) var(--space-1); }
  .qa-icon { font-size: 1.3rem; }
}
</style>
