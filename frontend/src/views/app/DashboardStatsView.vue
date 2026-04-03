<template>
  <div class="stats-page fade-in" dir="rtl">
    <!-- Header -->
    <div class="page-header">
      <div class="header-text">
        <h1 class="page-title">📊 סטטיסטיקות</h1>
        <p class="page-sub" v-if="data?.couple">
          {{ data.couple.name1 }} &amp; {{ data.couple.name2 }}
          <span v-if="data.couple.daysToWedding !== null" class="days-badge"
            :class="{ urgent: data.couple.daysToWedding <= 30 }">
            {{ data.couple.daysToWedding > 0 ? data.couple.daysToWedding + ' ימים לחתונה' : data.couple.daysToWedding === 0 ? 'היום!' : 'החתונה עברה' }}
          </span>
        </p>
      </div>
      <button class="btn btn-outline btn-sm" @click="loadStats" :disabled="loading">
        <span v-if="loading">⏳</span><span v-else>🔄 רענן</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="stats-grid">
      <div v-for="i in 4" :key="i" class="stat-card card">
        <div class="skel skel-title" /><div class="skel skel-chart" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert-error">
      <span>⚠️</span> {{ error }}
      <button class="btn btn-sm btn-outline" @click="loadStats">נסה שוב</button>
    </div>

    <!-- Stats content -->
    <template v-else-if="data">
      <div class="stats-grid">
        <!-- ── 1. GUEST SUMMARY ──────────────────────────────────────────── -->
        <div class="stat-card card">
          <div class="card-header">
            <h2 class="card-title">👥 אורחים</h2>
            <span class="card-total">{{ data.guests.total }} מוזמנים</span>
          </div>
          <div class="guest-bars">
            <div v-for="bar in guestBars" :key="bar.label" class="bar-row">
              <div class="bar-label">
                <span class="bar-emoji">{{ bar.emoji }}</span>
                <span class="bar-text">{{ bar.label }}</span>
                <span class="bar-num">{{ bar.value }}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: barWidth(bar.value, data.guests.total) + '%', background: bar.color }" />
              </div>
            </div>
          </div>
          <div class="guest-footer">
            <span class="footer-item">
              <strong>{{ data.guests.totalSeats }}</strong> מקומות ישיבה
            </span>
            <span class="footer-item">
              <strong>{{ Math.round((data.guests.confirmed / Math.max(data.guests.total,1)) * 100) }}%</strong> אישרו
            </span>
          </div>
        </div>

        <!-- ── 2. BUDGET SUMMARY ─────────────────────────────────────────── -->
        <div class="stat-card card">
          <div class="card-header">
            <h2 class="card-title">💰 תקציב</h2>
            <span class="card-total">₪{{ formatNum(data.budget.totalAllocated) }}</span>
          </div>

          <!-- SVG Donut chart -->
          <div class="donut-wrap">
            <svg class="donut" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="תרשים תקציב">
              <circle class="donut-bg" cx="60" cy="60" r="50" />
              <circle
                class="donut-fill"
                cx="60" cy="60" r="50"
                :stroke-dasharray="`${data.budget.spentPct * 3.14159} ${314.159}`"
                stroke-dashoffset="78.54"
              />
            </svg>
            <div class="donut-center">
              <div class="donut-num">{{ data.budget.spentPct }}%</div>
              <div class="donut-sub">נוצל</div>
            </div>
          </div>

          <div class="budget-nums">
            <div class="bnum">
              <span class="bnum-label">הוצאה</span>
              <span class="bnum-val spent">₪{{ formatNum(data.budget.totalSpent) }}</span>
            </div>
            <div class="bnum">
              <span class="bnum-label">נותר</span>
              <span class="bnum-val remain">₪{{ formatNum(data.budget.remaining) }}</span>
            </div>
          </div>

          <!-- Budget progress bar -->
          <div class="budget-bar-wrap">
            <div class="budget-track">
              <div class="budget-fill" :style="{ width: Math.min(data.budget.spentPct, 100) + '%' }"
                :class="{ 'over-budget': data.budget.spentPct > 100 }" />
            </div>
            <span class="budget-ovr" v-if="data.budget.spentPct > 100">חרגת מהתקציב!</span>
          </div>
        </div>

        <!-- ── 3. TASK COMPLETION ─────────────────────────────────────────── -->
        <div class="stat-card card">
          <div class="card-header">
            <h2 class="card-title">✅ משימות</h2>
            <span class="card-total">{{ data.tasks.total }} משימות</span>
          </div>

          <!-- Circular SVG progress -->
          <div class="circle-wrap">
            <svg class="circle-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <circle class="circle-bg"   cx="60" cy="60" r="50" />
              <circle class="circle-prog" cx="60" cy="60" r="50"
                :stroke-dasharray="`${data.tasks.completionPct * 3.14159} ${314.159}`"
                stroke-dashoffset="78.54" />
            </svg>
            <div class="circle-center">
              <div class="circle-num">{{ data.tasks.completionPct }}%</div>
              <div class="circle-sub">הושלם</div>
            </div>
          </div>

          <div class="task-chips">
            <div class="task-chip done">
              <span class="chip-dot" /><span class="chip-count">{{ data.tasks.done }}</span><span class="chip-lbl">הושלמו</span>
            </div>
            <div class="task-chip pending">
              <span class="chip-dot" /><span class="chip-count">{{ data.tasks.pending }}</span><span class="chip-lbl">ממתינות</span>
            </div>
            <div class="task-chip in-progress" v-if="data.tasks.inProgress">
              <span class="chip-dot" /><span class="chip-count">{{ data.tasks.inProgress }}</span><span class="chip-lbl">בתהליך</span>
            </div>
          </div>

          <div v-if="!data.tasks.total" class="no-tasks">
            <router-link to="/app/tasks" class="btn btn-sm btn-outline">הוסף משימות</router-link>
          </div>
        </div>

        <!-- ── 4. VENDOR STATUS ───────────────────────────────────────────── -->
        <div class="stat-card card">
          <div class="card-header">
            <h2 class="card-title">🤝 ספקים</h2>
            <span class="card-total">{{ data.vendors.total }} ספקים</span>
          </div>

          <!-- Horizontal stacked bar -->
          <div class="vendor-stack-wrap">
            <div class="vendor-stack" v-if="data.vendors.total > 0">
              <div v-for="seg in vendorSegments" :key="seg.label"
                class="stack-seg"
                :style="{ width: barWidth(seg.value, data.vendors.total) + '%', background: seg.color }"
                :title="`${seg.label}: ${seg.value}`"
              />
            </div>
            <div class="vendor-stack empty" v-else />
          </div>

          <div class="vendor-legend">
            <div v-for="seg in vendorSegments" :key="seg.label" class="leg-row">
              <span class="leg-dot" :style="{ background: seg.color }" />
              <span class="leg-label">{{ seg.label }}</span>
              <span class="leg-count">{{ seg.value }}</span>
            </div>
          </div>

          <div v-if="!data.vendors.total" class="no-vendors">
            <router-link to="/app/vendors" class="btn btn-sm btn-outline">הוסף ספקים</router-link>
          </div>
        </div>
      </div>

      <!-- ── Recent activity (last 5 guests) ───────────────────────────────── -->
      <div v-if="data.recent?.guests?.length" class="card recent-card">
        <h2 class="recent-title">🕐 אורחים שנוספו לאחרונה</h2>
        <div class="recent-list">
          <div v-for="g in data.recent.guests" :key="g.id" class="recent-item">
            <div class="recent-avatar">{{ g.name[0] }}</div>
            <div class="recent-info">
              <div class="recent-name">{{ g.name }}</div>
              <div class="recent-date">{{ formatRelative(g.createdAt) }}</div>
            </div>
            <div class="recent-badge" :class="`status-${g.rsvpStatus}`">
              {{ statusLabel(g.rsvpStatus) }}
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
const error   = ref('')
const data    = ref(null)

onMounted(() => loadStats())

async function loadStats() {
  loading.value = true
  error.value   = ''
  try {
    const res = await api.get('/stats/summary')
    data.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

// ── Computed ─────────────────────────────────────────────────────────────────
const guestBars = computed(() => [
  { label: 'מאושרים',  value: data.value?.guests.confirmed || 0, emoji: '✅', color: 'var(--color-success)' },
  { label: 'ממתינים',  value: data.value?.guests.pending   || 0, emoji: '⏳', color: 'var(--color-warning)' },
  { label: 'אולי',     value: data.value?.guests.maybe     || 0, emoji: '🤔', color: '#8B5CF6' },
  { label: 'לא מגיעים', value: data.value?.guests.declined || 0, emoji: '❌', color: 'var(--color-error)' }
])

const vendorSegments = computed(() => [
  { label: 'הוזמן',       value: data.value?.vendors.booked      || 0, color: 'var(--color-success)' },
  { label: 'בשיקול',      value: data.value?.vendors.considering || 0, color: 'var(--color-warning)' },
  { label: 'נוצר קשר',   value: data.value?.vendors.contacted   || 0, color: '#8B5CF6' },
  { label: 'נדחה',        value: data.value?.vendors.rejected    || 0, color: 'var(--color-error)' }
])

// ── Helpers ───────────────────────────────────────────────────────────────────
function barWidth(val, total) {
  if (!total || !val) return 0
  return Math.round((val / total) * 100)
}

function formatNum(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('he-IL')
}

function formatRelative(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `לפני ${mins} דק'`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  const days = Math.floor(hrs / 24)
  return `לפני ${days} ימים`
}

function statusLabel(s) {
  return { confirmed: 'מגיע ✅', declined: 'לא מגיע ❌', pending: 'ממתין ⏳', maybe: 'אולי 🤔' }[s] || s
}
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.stats-page { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.page-title  { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub    { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.days-badge  { background: var(--color-primary-light); color: var(--color-primary); border-radius: var(--radius-full); padding: 2px 12px; font-weight: 700; font-size: var(--font-size-xs); }
.days-badge.urgent { background: var(--color-error-bg); color: var(--color-error); }

/* ── Grid ────────────────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

/* ── Stat card ───────────────────────────────────────────────────────────── */
.stat-card { padding: var(--space-5); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
.card-title  { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); }
.card-total  { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 600; }

/* ── Guest bars ──────────────────────────────────────────────────────────── */
.guest-bars { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
.bar-row    { display: flex; flex-direction: column; gap: var(--space-1); }
.bar-label  { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); }
.bar-emoji  { font-size: 1rem; }
.bar-text   { flex: 1; color: var(--color-text); }
.bar-num    { font-weight: 700; color: var(--color-navy); }
.bar-track  { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.bar-fill   { height: 100%; border-radius: var(--radius-full); transition: width 0.8s ease; }
.guest-footer { display: flex; justify-content: space-between; padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.footer-item { font-size: var(--font-size-sm); color: var(--color-text-muted); }

/* ── Donut chart ─────────────────────────────────────────────────────────── */
.donut-wrap { position: relative; width: 140px; height: 140px; margin: 0 auto var(--space-4); }
.donut { transform: rotate(-90deg); width: 100%; height: 100%; }
.donut-bg   { fill: none; stroke: var(--color-border); stroke-width: 14; }
.donut-fill { fill: none; stroke: var(--color-primary); stroke-width: 14; stroke-linecap: round; transition: stroke-dasharray 0.8s ease; }
.donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-num  { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.donut-sub  { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.budget-nums { display: flex; justify-content: space-between; margin-bottom: var(--space-3); }
.bnum       { display: flex; flex-direction: column; align-items: center; }
.bnum-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.bnum-val   { font-size: var(--font-size-base); font-weight: 800; }
.bnum-val.spent  { color: var(--color-primary); }
.bnum-val.remain { color: var(--color-success); }
.budget-bar-wrap { }
.budget-track { height: 10px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.budget-fill  { height: 100%; background: linear-gradient(90deg, var(--color-primary), #FF6AC1); border-radius: var(--radius-full); transition: width 0.8s ease; }
.budget-fill.over-budget { background: linear-gradient(90deg, var(--color-error), #FF6060); }
.budget-ovr { font-size: var(--font-size-xs); color: var(--color-error); font-weight: 700; margin-top: var(--space-1); display: block; text-align: center; }

/* ── Circle progress ─────────────────────────────────────────────────────── */
.circle-wrap { position: relative; width: 140px; height: 140px; margin: 0 auto var(--space-4); }
.circle-svg  { transform: rotate(-90deg); width: 100%; height: 100%; }
.circle-bg   { fill: none; stroke: var(--color-border); stroke-width: 14; }
.circle-prog { fill: none; stroke: var(--color-success); stroke-width: 14; stroke-linecap: round; transition: stroke-dasharray 0.8s ease; }
.circle-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.circle-num { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.circle-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.task-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.task-chip  { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.task-chip.done        { background: var(--color-success-bg); color: #16A34A; }
.task-chip.pending     { background: var(--color-warning-bg); color: #D97706; }
.task-chip.in-progress { background: #EEF2FF; color: #7C3AED; }
.chip-dot   { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.chip-count { font-weight: 800; }
.chip-lbl   { }
.no-tasks, .no-vendors { text-align: center; padding: var(--space-3); }

/* ── Vendor stacked bar ──────────────────────────────────────────────────── */
.vendor-stack-wrap { margin-bottom: var(--space-4); }
.vendor-stack { display: flex; height: 16px; border-radius: var(--radius-full); overflow: hidden; gap: 2px; }
.vendor-stack.empty { background: var(--color-border); border-radius: var(--radius-full); }
.stack-seg { height: 100%; transition: width 0.8s ease; min-width: 4px; }
.vendor-legend { display: flex; flex-direction: column; gap: var(--space-2); }
.leg-row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); }
.leg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.leg-label { flex: 1; color: var(--color-text); }
.leg-count { font-weight: 700; color: var(--color-navy); }

/* ── Recent card ─────────────────────────────────────────────────────────── */
.recent-card { padding: var(--space-5); }
.recent-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-4); }
.recent-list { display: flex; flex-direction: column; gap: var(--space-3); }
.recent-item { display: flex; align-items: center; gap: var(--space-3); }
.recent-avatar { width: 38px; height: 38px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); font-weight: 800; font-size: var(--font-size-base); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.recent-info { flex: 1; }
.recent-name { font-weight: 700; color: var(--color-navy); font-size: var(--font-size-sm); }
.recent-date { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.recent-badge { font-size: var(--font-size-xs); font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap; }
.status-confirmed { background: var(--color-success-bg); color: #16A34A; }
.status-declined  { background: var(--color-error-bg); color: #DC2626; }
.status-pending   { background: var(--color-warning-bg); color: #D97706; }
.status-maybe     { background: #EEF2FF; color: #7C3AED; }

/* ── Alert ───────────────────────────────────────────────────────────────── */
.alert-error { display: flex; align-items: center; gap: var(--space-3); background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius-lg); padding: var(--space-4); font-size: var(--font-size-sm); }

/* ── Skeletons ───────────────────────────────────────────────────────────── */
.skel { border-radius: var(--radius); background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skel-title { height: 20px; width: 60%; margin-bottom: var(--space-4); }
.skel-chart { height: 120px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 640px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stats-page { padding: var(--space-4); }
}
</style>
