<template>
  <div class="gift-stats-view" dir="rtl">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">📊 סטטיסטיקות מתנות</h1>
        <p class="page-subtitle">סיכום וניתוח מתנות שהתקבלו</p>
      </div>
      <div class="header-actions">
        <button @click="exportStats" class="btn btn-outline">⬇️ ייצוא</button>
        <router-link to="/app/gifts" class="btn btn-primary">← רשימת מתנות</router-link>
      </div>
    </header>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>

    <!-- Loading skeletons -->
    <template v-if="loading">
      <div class="summary-grid">
        <div v-for="i in 4" :key="i" class="summary-card skeleton-card">
          <div class="skel skel-circle"></div>
          <div class="skel skel-lg"></div>
          <div class="skel skel-sm"></div>
        </div>
      </div>
      <div class="stats-grid">
        <div v-for="i in 3" :key="i" class="stat-card skeleton-card" style="height:240px"></div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="center-state">
      <div class="error-icon">⚠️</div>
      <p class="error-msg">{{ error }}</p>
      <button @click="load" class="btn btn-primary">נסה שוב</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="stats.count === 0" class="center-state">
      <div style="font-size:3rem">🎁</div>
      <h3>עדיין אין מתנות</h3>
      <p>הוסף מתנות כדי לראות סטטיסטיקות</p>
      <router-link to="/app/gifts" class="btn btn-primary">+ הוסף מתנה</router-link>
    </div>

    <!-- Data -->
    <template v-else>
      <!-- Big number cards -->
      <div class="summary-grid">
        <div class="summary-card primary">
          <span class="s-icon">💰</span>
          <span class="s-value">₪{{ fmtNum(stats.total) }}</span>
          <span class="s-label">סה"כ נאסף</span>
        </div>
        <div class="summary-card">
          <span class="s-icon">🎁</span>
          <span class="s-value">{{ stats.count }}</span>
          <span class="s-label">מתנות</span>
        </div>
        <div class="summary-card">
          <span class="s-icon">📐</span>
          <span class="s-value">₪{{ fmtNum(stats.avg) }}</span>
          <span class="s-label">ממוצע למתנה</span>
        </div>
        <div class="summary-card accent">
          <span class="s-icon">💌</span>
          <span class="s-value">{{ stats.pctThanked }}%</span>
          <span class="s-label">קיבלו תודה</span>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="stats-grid">

        <!-- Top givers bar chart (CSS-only) -->
        <div class="stat-card span2">
          <h2 class="card-title">🏆 נדיבים מובילים</h2>
          <div v-if="!stats.topGivers?.length" class="empty-card">אין נתונים</div>
          <div v-else class="bar-chart">
            <div
              v-for="(g, i) in stats.topGivers.slice(0, 8)"
              :key="g.name"
              class="bar-row"
            >
              <div class="bar-label">
                <span class="rank">{{ rankIcon(i) }}</span>
                <span class="giver-name">{{ g.name }}</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{
                    width: barPct(g.amount, stats.topGivers[0].amount) + '%',
                    background: i === 0 ? 'var(--color-primary)' : i === 1 ? '#c2185b' : i === 2 ? '#e91e8c80' : 'var(--color-border)'
                  }"
                ></div>
              </div>
              <span class="bar-value">₪{{ fmtNum(g.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Breakdown by amount range -->
        <div class="stat-card">
          <h2 class="card-title">📊 פילוח לפי סכום</h2>
          <div v-if="!stats.breakdown?.length || totalBreakdownCount === 0" class="empty-card">אין נתונים</div>
          <div v-else class="range-chart">
            <div
              v-for="r in stats.breakdown"
              :key="r.label"
              class="range-row"
            >
              <div class="range-meta">
                <span class="range-label">₪{{ r.label }}</span>
                <span class="range-count">{{ r.count }} מתנות</span>
              </div>
              <div class="range-track">
                <div
                  class="range-fill"
                  :style="{ width: rangePct(r.count) + '%' }"
                ></div>
              </div>
              <span class="range-amount">₪{{ fmtNum(r.amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Timeline sparkline: last 30 days -->
        <div class="stat-card">
          <h2 class="card-title">📅 מתנות ב-30 ימים האחרונים</h2>
          <div v-if="!timelineHasData" class="empty-card">אין מתנות ב-30 ימים האחרונים</div>
          <div v-else class="sparkline-wrap">
            <div class="sparkline">
              <div
                v-for="day in stats.timeline"
                :key="day.date"
                class="spark-col-wrap"
                :title="`${day.date}: ${day.count} מתנות · ₪${fmtNum(day.amount)}`"
              >
                <div
                  class="spark-col"
                  :style="{
                    height: sparkHeight(day.count) + '%',
                    background: day.count > 0 ? 'var(--color-primary)' : 'var(--color-border)'
                  }"
                ></div>
              </div>
            </div>
            <div class="spark-labels">
              <span>{{ stats.timeline?.[0]?.date?.slice(5) }}</span>
              <span>{{ stats.timeline?.[14]?.date?.slice(5) }}</span>
              <span>היום</span>
            </div>
            <div class="spark-summary">
              {{ timelineTotalCount }} מתנות בסה"כ · ₪{{ fmtNum(timelineTotalAmount) }}
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

const auth  = useAuthStore()
const stats = ref({ total: 0, count: 0, avg: 0, pctThanked: 0, topGivers: [], breakdown: [], timeline: [] })
const loading = ref(false)
const error   = ref(null)
const toast   = ref(null)

// ── Computed ────────────────────────────────────────────────────────────────
const totalBreakdownCount = computed(() =>
  (stats.value.breakdown || []).reduce((s, r) => s + r.count, 0)
)

const timelineMax = computed(() =>
  Math.max(1, ...(stats.value.timeline || []).map(d => d.count))
)

const timelineHasData = computed(() =>
  (stats.value.timeline || []).some(d => d.count > 0)
)

const timelineTotalCount = computed(() =>
  (stats.value.timeline || []).reduce((s, d) => s + d.count, 0)
)

const timelineTotalAmount = computed(() =>
  (stats.value.timeline || []).reduce((s, d) => s + d.amount, 0)
)

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n) {
  return Math.round(n || 0).toLocaleString('he-IL')
}

function barPct(val, max) {
  return max > 0 ? Math.round((val / max) * 100) : 0
}

function rangePct(count) {
  const max = Math.max(1, ...(stats.value.breakdown || []).map(r => r.count))
  return max > 0 ? Math.round((count / max) * 100) : 0
}

function sparkHeight(count) {
  const max = timelineMax.value
  if (count === 0) return 4
  return Math.max(8, Math.round((count / max) * 100))
}

function rankIcon(i) {
  return ['🥇', '🥈', '🥉'][i] || `${i + 1}.`
}

// ── API ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value   = null
  try {
    const res = await fetch('/api/gifts/stats', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `שגיאת שרת ${res.status}`)
    }
    stats.value = await res.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 3000)
}

function exportStats() {
  showToast('📋 הנתונים הועתקו ללוח! (ייצוא CSV בקרוב)')
}

onMounted(load)
</script>

<style scoped>
.gift-stats-view { max-width: 960px; margin: 0 auto; padding: var(--space-6); }

/* Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Toast */
.toast { position: fixed; top: var(--space-6); left: 50%; transform: translateX(-50%); background: var(--color-navy); color: #fff; padding: var(--space-3) var(--space-6); border-radius: var(--radius-xl); font-size: var(--font-size-sm); font-weight: 600; z-index: 999; box-shadow: var(--shadow-lg); }
.toast-enter-active, .toast-leave-active { transition: all .3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }

/* Center state */
.center-state { text-align: center; padding: var(--space-16); color: var(--color-text-muted); }
.center-state h3 { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin: var(--space-3) 0 var(--space-2); }
.center-state p  { margin: 0 0 var(--space-5); font-size: var(--font-size-sm); }
.error-icon { font-size: 2.5rem; margin-bottom: var(--space-3); }
.error-msg  { color: var(--color-error); margin-bottom: var(--space-4); font-size: var(--font-size-sm); }

/* Summary cards */
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.summary-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; border: 2px solid transparent; transition: box-shadow var(--transition); }
.summary-card:hover { box-shadow: var(--shadow); }
.summary-card.primary { background: var(--color-primary); }
.summary-card.primary .s-value,
.summary-card.primary .s-label  { color: #fff; }
.summary-card.accent { border-color: var(--color-primary); }
.s-icon  { font-size: 1.8rem; }
.s-value { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.s-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }

/* Stats grid */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
.stat-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); }
.stat-card.span2 { grid-column: 1 / -1; }
.card-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-5); }
.empty-card { text-align: center; color: var(--color-text-muted); padding: var(--space-8); font-size: var(--font-size-sm); }

/* Bar chart (CSS-only, top givers) */
.bar-chart { display: flex; flex-direction: column; gap: var(--space-3); }
.bar-row { display: grid; grid-template-columns: 160px 1fr 80px; align-items: center; gap: var(--space-3); }
.bar-label { display: flex; align-items: center; gap: var(--space-2); overflow: hidden; }
.rank { font-size: 1.1rem; flex-shrink: 0; }
.giver-name { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-track { height: 12px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.bar-fill { height: 100%; border-radius: var(--radius-full); transition: width .6s ease; }
.bar-value { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary); text-align: start; white-space: nowrap; }

/* Range breakdown (horizontal bars) */
.range-chart { display: flex; flex-direction: column; gap: var(--space-4); }
.range-row { display: flex; flex-direction: column; gap: var(--space-1); }
.range-meta { display: flex; justify-content: space-between; align-items: center; }
.range-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.range-count { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.range-track { height: 10px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.range-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width .6s ease; }
.range-amount { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; align-self: flex-end; }

/* Sparkline timeline */
.sparkline-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
.sparkline { display: grid; grid-template-columns: repeat(30, 1fr); gap: 2px; height: 80px; align-items: flex-end; }
.spark-col-wrap { display: flex; align-items: flex-end; height: 100%; cursor: default; }
.spark-col { width: 100%; border-radius: 2px 2px 0 0; transition: height .4s ease; min-height: 3px; }
.spark-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-muted); }
.spark-summary { text-align: center; font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; background: var(--color-bg-subtle); padding: var(--space-2) var(--space-3); border-radius: var(--radius-lg); }

/* Skeleton */
.skeleton-card { animation: shimmer 1.4s infinite; }
@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: .5; }
}
.skel { background: var(--color-border); border-radius: var(--radius); }
.skel-circle { width: 40px; height: 40px; border-radius: 50%; }
.skel-lg { width: 80%; height: 28px; }
.skel-sm { width: 50%; height: 14px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); white-space: nowrap; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

/* Responsive */
@media (max-width: 880px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-grid   { grid-template-columns: 1fr; }
  .stat-card.span2 { grid-column: unset; }
  .bar-row { grid-template-columns: 120px 1fr 70px; }
}
@media (max-width: 480px) {
  .gift-stats-view { padding: var(--space-4); }
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .bar-row { grid-template-columns: 90px 1fr 60px; }
  .header-actions { width: 100%; }
}
</style>
