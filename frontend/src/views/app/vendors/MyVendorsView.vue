<template>
  <div class="view-placeholder fade-in">
    <h1>הספקים שלי</h1>
    <p style="color:var(--color-text-muted)">בבנייה... 🚧</p>
    <!-- implemented by freddy: 2026-04-02T23:23:00Z -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const items = ref([])
const loading = ref(false)
const error = ref(null)

const statusSummary = computed(() => {
  const counts = {}
  for (const uv of items.value) counts[uv.status] = (counts[uv.status] || 0) + 1
  return Object.entries(counts).map(([status, count]) => ({ status, count }))
})

const totalPrice = computed(() =>
  items.value.reduce((s, uv) => s + (parseFloat(uv._price) || 0), 0)
)

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/vendors/mine', { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) throw new Error('שגיאה בטעינה')
    const data = await res.json()
    items.value = data.map(uv => ({
      ...uv,
      _price: uv.priceAgreed || '',
      _notes: uv.notes || ''
    }))
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function update(uv) {
  try {
    await fetch(`/api/vendors/user/${uv.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: uv.status, priceAgreed: parseFloat(uv._price) || null, notes: uv._notes })
    })
  } catch (e) { console.error(e) }
}

async function remove(uv) {
  if (!confirm(`להסיר את ${uv.vendor.name} מהרשימה?`)) return
  try {
    const res = await fetch(`/api/vendors/user/${uv.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) throw new Error('שגיאה')
    items.value = items.value.filter(i => i.id !== uv.id)
  } catch (e) { alert(e.message) }
}

function catIcon(cat) {
  return { 'קייטרינג':'🍽️', 'צילום':'📷', 'להקה':'🎵', 'פרחים':'🌸', 'אולם':'🏛️' }[cat] || '📋'
}
function statusLabel(s) {
  return { considering:'בודק', negotiating:'במשא ומתן', booked:'סגרתי' }[s] || s
}
function fmtNum(n) { return Math.round(n).toLocaleString('he-IL') }

onMounted(load)
</script>

<style scoped>
.my-vendors-view { max-width: 900px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.center-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.center-state h3 { color: var(--color-navy); font-weight: 700; margin: var(--space-3) 0 var(--space-2); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.summary-bar { display: flex; gap: var(--space-4); background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-4) var(--space-6); margin-bottom: var(--space-5); box-shadow: var(--shadow-sm); flex-wrap: wrap; }
.sum-item { flex: 1; min-width: 70px; text-align: center; }
.sum-num { display: block; font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); line-height: 1; }
.sum-num.booked { color: var(--color-success); }
.sum-num.negotiating { color: var(--color-warning); }
.sum-num.considering { color: var(--color-info); }
.sum-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.sum-item.total .sum-num { color: var(--color-primary); }

.vendors-list { display: flex; flex-direction: column; gap: var(--space-4); }
.vendor-row { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); display: flex; gap: var(--space-5); flex-wrap: wrap; }
.vendor-left { display: flex; align-items: flex-start; gap: var(--space-3); min-width: 200px; }
.vendor-icon { font-size: 2rem; background: var(--color-primary-bg); border-radius: var(--radius-lg); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vendor-name { font-weight: 800; color: var(--color-navy); font-size: var(--font-size-base); margin: 0 0 2px; }
.vendor-cat { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; }
.vendor-price-range { font-size: var(--font-size-xs); color: var(--color-primary); font-weight: 600; margin-top: 4px; }

.vendor-right { flex: 1; min-width: 280px; }
.fields-row { display: flex; gap: var(--space-4); margin-bottom: var(--space-3); flex-wrap: wrap; }
.field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
.notes-field { margin-bottom: var(--space-3); }
.field label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.field-select, .field-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg-card); color: var(--color-navy); }
.field-select:focus, .field-input:focus { outline: none; border-color: var(--color-primary); }

.row-footer { display: flex; align-items: center; justify-content: space-between; }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.status-badge.booked { background: var(--color-success-bg); color: #065f46; }
.status-badge.negotiating { background: var(--color-warning-bg); color: #92400e; }
.status-badge.considering { background: var(--color-info-bg); color: #1e40af; }
.btn-remove { background: none; border: 1px solid var(--color-error); color: var(--color-error); border-radius: var(--radius-sm); padding: 3px 10px; font-size: var(--font-size-xs); font-family: var(--font); cursor: pointer; transition: all var(--transition-fast); }
.btn-remove:hover { background: var(--color-error-bg); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

@media (max-width: 680px) {
  .my-vendors-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .vendor-row { flex-direction: column; }
}
</style>
