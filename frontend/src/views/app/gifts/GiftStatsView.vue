<template>
  <div class="gift-stats-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title">📊 סטטיסטיקות מתנות</h1>
        <p class="page-subtitle">סיכום המתנות שהתקבלו</p>
      </div>
      <router-link to="/app/gifts" class="btn btn-outline">← חזור למתנות</router-link>
    </header>

    <div v-if="loading" class="center-state">
      <div class="spinner"></div>
      <p>טוען נתונים...</p>
    </div>

    <div v-else-if="error" class="center-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <button @click="load" class="btn btn-outline">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card primary">
          <span class="s-icon">💰</span>
          <span class="s-value">₪{{ fmtNum(stats.total) }}</span>
          <span class="s-label">סה"כ נאסף</span>
        </div>
        <div class="summary-card">
          <span class="s-icon">📊</span>
          <span class="s-value">₪{{ fmtNum(stats.avg) }}</span>
          <span class="s-label">ממוצע למתנה</span>
        </div>
        <div class="summary-card">
          <span class="s-icon">👥</span>
          <span class="s-value">{{ stats.count }}</span>
          <span class="s-label">אורחים שנתנו</span>
        </div>
      </div>

      <div class="stats-grid">
        <!-- Top Givers -->
        <div class="stat-card">
          <h2 class="card-title">🏆 חמשת הנדיבים</h2>
          <div v-if="!stats.topGivers?.length" class="empty-card">אין נתונים עדיין</div>
          <div v-else class="top-givers-list">
            <div v-for="(g, i) in stats.topGivers" :key="g.id" class="giver-row">
              <div class="giver-rank">
                <span v-if="i === 0" class="rank-medal">🥇</span>
                <span v-else-if="i === 1" class="rank-medal">🥈</span>
                <span v-else-if="i === 2" class="rank-medal">🥉</span>
                <span v-else class="rank-num">{{ i + 1 }}</span>
              </div>
              <div class="giver-info">
                <span class="giver-name">{{ g.name }}</span>
                <div class="giver-bar">
                  <div class="giver-fill" :style="{ width: pct(g.giftAmount, stats.topGivers[0]?.giftAmount) + '%' }"></div>
                </div>
              </div>
              <span class="giver-amount">₪{{ fmtNum(g.giftAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Pie Chart by Group -->
        <div class="stat-card">
          <h2 class="card-title">🥧 לפי קבוצה</h2>
          <div v-if="!stats.byGroup?.length" class="empty-card">אין נתונים עדיין</div>
          <div v-else class="pie-section">
            <div class="pie-wrap">
              <div class="pie-chart" :style="{ background: pieGradient }"></div>
              <div class="pie-total">
                <span class="pie-total-val">₪{{ fmtNum(stats.total) }}</span>
                <span class="pie-total-lbl">סה"כ</span>
              </div>
            </div>
            <div class="pie-legend">
              <div v-for="(item, i) in enrichedGroups" :key="item.name" class="legend-row">
                <span class="legend-dot" :style="{ background: pieColors[i % pieColors.length] }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-pct">{{ item.pct }}%</span>
                <span class="legend-amount">₪{{ fmtNum(item.amount) }}</span>
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

const auth = useAuthStore()
const stats = ref({ total: 0, avg: 0, count: 0, topGivers: [], byGroup: [] })
const loading = ref(false)
const error = ref(null)

const pieColors = ['#E91E8C','#1A1F36','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4']

const enrichedGroups = computed(() => {
  const total = stats.value.total || 1
  return (stats.value.byGroup || []).map(g => ({
    ...g,
    pct: Math.round((g.amount / total) * 100)
  })).sort((a, b) => b.amount - a.amount)
})

const pieGradient = computed(() => {
  const groups = enrichedGroups.value
  if (!groups.length) return '#e5e7eb'
  let deg = 0
  const parts = groups.map((g, i) => {
    const from = deg
    deg += (g.amount / (stats.value.total || 1)) * 360
    return `${pieColors[i % pieColors.length]} ${from}deg ${deg}deg`
  })
  return `conic-gradient(${parts.join(', ')})`
})

function pct(val, max) { return max > 0 ? Math.round((val / max) * 100) : 0 }
function fmtNum(n) { return Math.round(n || 0).toLocaleString('he-IL') }

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/gifts/stats', { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) throw new Error('שגיאה בטעינת נתונים')
    stats.value = await res.json()
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.gift-stats-view { max-width: 900px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.center-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.summary-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; }
.summary-card.primary { background: var(--color-primary); color: #fff; }
.summary-card.primary .s-label { color: rgba(255,255,255,.8); }
.s-icon { font-size: 1.8rem; }
.s-value { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); line-height: 1; }
.summary-card.primary .s-value { color: #fff; }
.s-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
.stat-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); }
.card-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-4); }
.empty-card { text-align: center; color: var(--color-text-muted); padding: var(--space-6); }

/* Top Givers */
.top-givers-list { display: flex; flex-direction: column; gap: var(--space-3); }
.giver-row { display: flex; align-items: center; gap: var(--space-3); }
.giver-rank { width: 32px; text-align: center; }
.rank-medal { font-size: 1.3rem; }
.rank-num { width: 24px; height: 24px; background: var(--color-bg-subtle); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); }
.giver-info { flex: 1; }
.giver-name { font-weight: 600; color: var(--color-navy); font-size: var(--font-size-sm); display: block; margin-bottom: 4px; }
.giver-bar { height: 6px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.giver-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width .5s ease; }
.giver-amount { font-weight: 700; color: var(--color-primary); font-size: var(--font-size-sm); white-space: nowrap; }

/* Pie Chart */
.pie-section { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); }
.pie-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
.pie-chart { width: 160px; height: 160px; border-radius: 50%; }
.pie-total { position: absolute; text-align: center; pointer-events: none; }
.pie-total-val { display: block; font-size: var(--font-size-sm); font-weight: 900; color: var(--color-navy); }
.pie-total-lbl { display: block; font-size: 10px; color: var(--color-text-muted); }
.pie-legend { width: 100%; display: flex; flex-direction: column; gap: var(--space-2); }
.legend-row { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xs); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; color: var(--color-navy); font-weight: 600; }
.legend-pct { color: var(--color-text-muted); width: 32px; text-align: left; }
.legend-amount { font-weight: 700; color: var(--color-navy); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

@media (max-width: 680px) {
  .gift-stats-view { padding: var(--space-4); }
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
