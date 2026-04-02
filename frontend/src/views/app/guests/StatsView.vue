<template>
  <div class="stats-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">סטטיסטיקות אורחים 📊</h1>
        <p class="page-sub">תובנות על רשימת האורחים שלך</p>
      </div>
      <button class="btn btn-outline" @click="$router.push('/app/guests')">← רשימת אורחים</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="skeleton-layout">
      <div class="skeleton" style="height:120px;border-radius:16px;" v-for="n in 4" :key="n"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️</span><p>{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <template v-else>

      <!-- Big number cards -->
      <div class="big-numbers">
        <div class="big-card total">
          <div class="big-num">{{ stats.total }}</div>
          <div class="big-label">סה"כ אורחים</div>
          <div class="big-sub">{{ stats.totalPeople }} נפשות</div>
        </div>
        <div class="big-card confirmed">
          <div class="big-num">{{ stats.confirmed }}</div>
          <div class="big-label">✅ מגיעים</div>
          <div class="big-sub">{{ stats.confirmedPeople }} נפשות</div>
        </div>
        <div class="big-card declined">
          <div class="big-num">{{ stats.declined }}</div>
          <div class="big-label">❌ לא מגיעים</div>
          <div class="big-sub">{{ stats.declinedPeople }} נפשות</div>
        </div>
        <div class="big-card pending">
          <div class="big-num">{{ stats.pending + stats.maybe }}</div>
          <div class="big-label">⏳ ממתינים</div>
          <div class="big-sub">{{ stats.maybe > 0 ? `${stats.maybe} אולי` : 'לא אישרו' }}</div>
        </div>
      </div>

      <!-- Main content row -->
      <div class="content-row">

        <!-- CSS-only RSVP Pie chart -->
        <div class="chart-card">
          <h2 class="card-title">פיזור RSVP</h2>
          <div class="pie-wrapper">
            <div
              class="pie-chart"
              :style="{ background: pieGradient }"
            ></div>
            <div class="pie-center">
              <div class="pie-num">{{ stats.total }}</div>
              <div class="pie-label">אורחים</div>
            </div>
          </div>
          <div class="pie-legend">
            <div v-for="seg in pieSegments" :key="seg.label" class="legend-row">
              <span class="legend-dot" :style="{ background: seg.color }"></span>
              <span class="legend-label">{{ seg.label }}</span>
              <span class="legend-count">{{ seg.count }}</span>
              <div class="legend-bar-wrap">
                <div class="legend-bar" :style="{ width: seg.pct + '%', background: seg.color }"></div>
              </div>
              <span class="legend-pct">{{ seg.pct }}%</span>
            </div>
          </div>
        </div>

        <!-- Sides breakdown -->
        <div class="sides-card">
          <h2 class="card-title">פיזור לפי צד</h2>
          <div class="sides-bars">
            <div class="side-bar-row" v-for="(count, side) in stats.sides" :key="side">
              <div class="side-label-row">
                <span class="side-label">{{ sideIcon(side) }} {{ side }}</span>
                <span class="side-count">{{ count }}</span>
              </div>
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: stats.total > 0 ? (count/stats.total*100) + '%' : '0%', background: sideColor(side) }"
                ></div>
              </div>
              <div class="side-pct">{{ stats.total > 0 ? Math.round(count/stats.total*100) : 0 }}%</div>
            </div>
          </div>

          <!-- Gifts section -->
          <div class="gifts-section">
            <h2 class="card-title">🎁 מתנות</h2>
            <div class="gift-stats">
              <div class="gift-stat">
                <span class="gift-num">₪{{ stats.gifts?.total ? Number(stats.gifts.total).toLocaleString('he-IL') : '0' }}</span>
                <span class="gift-label">סה"כ מתנות</span>
              </div>
              <div class="gift-stat">
                <span class="gift-num">{{ stats.gifts?.count || 0 }}</span>
                <span class="gift-label">אורחים עם מתנה</span>
              </div>
              <div class="gift-stat">
                <span class="gift-num">₪{{ stats.gifts?.average ? Number(stats.gifts.average).toLocaleString('he-IL') : '0' }}</span>
                <span class="gift-label">ממוצע למתנה</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Groups breakdown -->
      <div class="groups-card" v-if="stats.groups?.length">
        <h2 class="card-title">קבוצות אורחים</h2>
        <div class="groups-grid">
          <div v-for="group in stats.groups" :key="group.name" class="group-card">
            <div class="group-header">
              <div class="group-icon">{{ groupIcon(group.name) }}</div>
              <div>
                <div class="group-name">{{ group.name }}</div>
                <div class="group-sub">{{ group.count }} אורחים · {{ group.people }} נפשות</div>
              </div>
            </div>
            <div class="group-bar-track">
              <div class="group-bar-fill" :style="{ width: stats.total > 0 ? (group.count/stats.total*100)+'%' : '0%' }"></div>
            </div>
            <div class="group-pct">{{ stats.total > 0 ? Math.round(group.count/stats.total*100) : 0 }}% מהאורחים</div>
          </div>
        </div>
      </div>

      <!-- Empty state for groups -->
      <div v-else-if="!loading" class="empty-groups">
        <span>📭</span>
        <p>אין קבוצות מוגדרות עדיין</p>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref(null)
const stats = ref({
  total: 0, totalPeople: 0, confirmed: 0, confirmedPeople: 0,
  declined: 0, declinedPeople: 0, pending: 0, maybe: 0,
  sides: {}, groups: [], gifts: { total: 0, count: 0, average: 0 }
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/guests/stats')
    stats.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

// Pie chart segments
const PIE_COLORS = {
  confirmed: '#22C55E',
  declined:  '#EF4444',
  maybe:     '#F59E0B',
  pending:   '#94A3B8'
}
const PIE_LABELS = {
  confirmed: 'מגיעים',
  declined:  'לא מגיעים',
  maybe:     'אולי',
  pending:   'ממתינים'
}

const pieSegments = computed(() => {
  const total = stats.value.total || 1
  return ['confirmed', 'declined', 'maybe', 'pending'].map(key => ({
    key,
    label: PIE_LABELS[key],
    color: PIE_COLORS[key],
    count: stats.value[key] || 0,
    pct: Math.round(((stats.value[key] || 0) / total) * 100)
  })).filter(s => s.count > 0)
})

// Build conic-gradient for CSS pie
const pieGradient = computed(() => {
  if (stats.value.total === 0) return '#f0f0f5'
  const total = stats.value.total
  let angle = 0
  const stops = []
  pieSegments.value.forEach(seg => {
    const deg = (seg.count / total) * 360
    stops.push(`${seg.color} ${angle}deg ${angle + deg}deg`)
    angle += deg
  })
  return `conic-gradient(${stops.join(', ')})`
})

function sideIcon(side) {
  return { 'חתן': '🤵', 'כלה': '👰', 'משותף': '💑' }[side] || '👤'
}

function sideColor(side) {
  return { 'חתן': '#3B82F6', 'כלה': '#E91E8C', 'משותף': '#8B5CF6' }[side] || '#94A3B8'
}

const GROUP_ICONS = ['👨‍👩‍👧‍👦', '🤝', '🏢', '🎓', '⚽', '🎵', '✈️', '🏠']
function groupIcon(name) {
  let hash = 0
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xFF
  return GROUP_ICONS[hash % GROUP_ICONS.length]
}

onMounted(load)
</script>

<style scoped>
.stats-view { padding: var(--space-6); max-width: 1100px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Big numbers */
.big-numbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.big-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); text-align: center; transition: var(--transition); }
.big-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.big-card.total { border-color: var(--color-navy); }
.big-card.confirmed { border-color: var(--color-success); background: linear-gradient(135deg, #fff 0%, var(--color-success-bg) 100%); }
.big-card.declined { border-color: var(--color-error); background: linear-gradient(135deg, #fff 0%, var(--color-error-bg) 100%); }
.big-card.pending { border-color: var(--color-warning); background: linear-gradient(135deg, #fff 0%, var(--color-warning-bg) 100%); }
.big-num { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 900; color: var(--color-navy); line-height: 1; margin-bottom: var(--space-2); }
.big-card.confirmed .big-num { color: var(--color-success); }
.big-card.declined .big-num { color: var(--color-error); }
.big-card.pending .big-num { color: var(--color-warning); }
.big-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-1); }
.big-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Content row */
.content-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-bottom: var(--space-5); }
.card-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }

/* Pie chart (CSS conic-gradient) */
.chart-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.pie-wrapper { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-5); }
.pie-chart { width: 180px; height: 180px; border-radius: 50%; flex-shrink: 0; }
.pie-center { position: absolute; text-align: center; }
.pie-num { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.pie-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Donut hole effect */
.pie-chart { box-shadow: inset 0 0 0 42px #fff; }

.pie-legend { display: flex; flex-direction: column; gap: var(--space-3); }
.legend-row { display: flex; align-items: center; gap: var(--space-2); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-label { width: 80px; font-size: var(--font-size-sm); font-weight: 500; color: var(--color-navy); flex-shrink: 0; }
.legend-count { width: 30px; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); text-align: center; flex-shrink: 0; }
.legend-bar-wrap { flex: 1; height: 8px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.legend-bar { height: 100%; border-radius: var(--radius-full); transition: width .5s ease; }
.legend-pct { width: 35px; text-align: left; font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); flex-shrink: 0; }

/* Sides card */
.sides-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); display: flex; flex-direction: column; gap: var(--space-4); }
.sides-bars { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-4); }
.side-bar-row { display: flex; flex-direction: column; gap: var(--space-1); }
.side-label-row { display: flex; justify-content: space-between; }
.side-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.side-count { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.bar-track { height: 12px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.bar-fill { height: 100%; border-radius: var(--radius-full); transition: width .5s ease; }
.side-pct { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }

/* Gifts */
.gifts-section { border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
.gift-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
.gift-stat { text-align: center; background: var(--color-bg-subtle); border-radius: var(--radius-lg); padding: var(--space-3); }
.gift-num { display: block; font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary); margin-bottom: 4px; }
.gift-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }

/* Groups */
.groups-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-4); }
.group-card { background: var(--color-bg-subtle); border-radius: var(--radius-lg); padding: var(--space-4); transition: var(--transition-fast); }
.group-card:hover { background: var(--color-primary-bg); }
.group-header { display: flex; gap: var(--space-3); align-items: center; margin-bottom: var(--space-3); }
.group-icon { font-size: 28px; }
.group-name { font-weight: 700; font-size: var(--font-size-sm); color: var(--color-navy); }
.group-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }
.group-bar-track { height: 6px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-1); }
.group-bar-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width .5s ease; }
.group-pct { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }

/* Empty */
.empty-groups { text-align: center; padding: var(--space-8); color: var(--color-text-muted); background: var(--color-bg-card); border-radius: var(--radius-xl); border: 2px dashed var(--color-border); }

/* Skeleton */
.skeleton-layout { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.skeleton { background: linear-gradient(90deg,#f0f0f5 25%,#e8e8f0 50%,#f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-outline { background: transparent; color: var(--color-navy); border: 1.5px solid var(--color-border); }
.btn-outline:hover { border-color: var(--color-navy); }

@media (max-width: 900px) {
  .big-numbers { grid-template-columns: repeat(2, 1fr); }
  .content-row { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .stats-view { padding: var(--space-4); }
  .big-numbers { grid-template-columns: repeat(2, 1fr); }
  .gift-stats { grid-template-columns: 1fr; }
}
</style>
