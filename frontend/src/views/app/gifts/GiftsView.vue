<template>
  <div class="gifts-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title">🎁 מתנות</h1>
        <p class="page-subtitle">עקוב אחר המתנות שקיבלת מהאורחים</p>
      </div>
      <div class="header-actions">
        <router-link to="/app/gifts/stats" class="btn btn-outline">📊 סטטיסטיקות</router-link>
        <button @click="exportCsv" class="btn btn-outline">📥 ייצא CSV</button>
      </div>
    </header>

    <!-- Total Bar -->
    <div v-if="!loading" class="total-bar">
      <div class="total-item primary">
        <span class="total-num">₪{{ fmtNum(totalCollected) }}</span>
        <span class="total-label">סה"כ נאסף</span>
      </div>
      <div class="total-item">
        <span class="total-num">{{ withGift }}</span>
        <span class="total-label">אורחים שנתנו מתנה</span>
      </div>
      <div class="total-item">
        <span class="total-num">{{ guests.length - withGift }}</span>
        <span class="total-label">ללא מתנה עדיין</span>
      </div>
      <div class="total-item">
        <span class="total-num">₪{{ fmtNum(avgGift) }}</span>
        <span class="total-label">ממוצע</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="center-state">
      <div class="spinner"></div>
      <p>טוען מתנות...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="center-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <button @click="load" class="btn btn-outline">נסה שוב</button>
    </div>

    <!-- Table -->
    <div v-else>
      <!-- Search -->
      <div class="search-bar">
        <input v-model="search" type="text" class="search-input" placeholder="🔍 חיפוש אורח..." />
        <select v-model="filterGift" class="filter-select">
          <option value="all">כל האורחים</option>
          <option value="with">עם מתנה</option>
          <option value="without">ללא מתנה</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="gifts-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>קבוצה</th>
              <th>סטטוס RSVP</th>
              <th>סכום מתנה (₪)</th>
              <th>פעולה</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in filteredGuests" :key="g.id">
              <td class="name-cell">{{ g.name }}</td>
              <td><span v-if="g.groupName" class="group-tag">{{ g.groupName }}</span><span v-else class="dash">—</span></td>
              <td><span class="rsvp-badge" :class="g.rsvpStatus">{{ rsvpLabel(g.rsvpStatus) }}</span></td>
              <td class="gift-cell">
                <div v-if="editing === g.id" class="edit-row">
                  <input v-model="editValue" type="number" class="amount-input" placeholder="0" @keyup.enter="save(g)" @keyup.escape="editing=null" ref="editRef" />
                  <button @click="save(g)" class="btn-save">✓</button>
                  <button @click="editing=null" class="btn-cancel-edit">✗</button>
                </div>
                <span v-else class="amount-display" :class="{ 'has-gift': g.giftAmount > 0 }">
                  {{ g.giftAmount ? `₪${fmtNum(g.giftAmount)}` : '—' }}
                </span>
              </td>
              <td>
                <button @click="startEdit(g)" class="btn-edit">✏️ עריכה</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="filteredGuests.length === 0" class="no-results">אין תוצאות</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const guests = ref([])
const loading = ref(false)
const error = ref(null)
const editing = ref(null)
const editValue = ref('')
const editRef = ref(null)
const search = ref('')
const filterGift = ref('all')

const totalCollected = computed(() => guests.value.reduce((s, g) => s + (g.giftAmount || 0), 0))
const withGift = computed(() => guests.value.filter(g => g.giftAmount > 0).length)
const avgGift = computed(() => withGift.value > 0 ? Math.round(totalCollected.value / withGift.value) : 0)

const filteredGuests = computed(() => {
  let list = guests.value
  if (search.value) list = list.filter(g => g.name.includes(search.value))
  if (filterGift.value === 'with') list = list.filter(g => g.giftAmount > 0)
  if (filterGift.value === 'without') list = list.filter(g => !g.giftAmount || g.giftAmount === 0)
  return list
})

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/gifts', { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) throw new Error('שגיאה בטעינה')
    guests.value = await res.json()
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function startEdit(g) {
  editing.value = g.id
  editValue.value = g.giftAmount || ''
  await nextTick()
  editRef.value?.focus()
}

async function save(g) {
  const amount = parseFloat(editValue.value) || null
  try {
    const res = await fetch(`/api/gifts/${g.id}/gift`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    if (!res.ok) throw new Error('שגיאה בשמירה')
    const updated = await res.json()
    g.giftAmount = updated.giftAmount
  } catch (e) { alert(e.message) }
  finally { editing.value = null }
}

function exportCsv() {
  const rows = [['שם', 'קבוצה', 'סטטוס RSVP', 'מתנה (₪)']]
  guests.value.forEach(g => rows.push([g.name, g.groupName || '', rsvpLabel(g.rsvpStatus), g.giftAmount || 0]))
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'מתנות.csv'; a.click()
  URL.revokeObjectURL(url)
}

function rsvpLabel(s) { return { confirmed:'מגיע', declined:'לא מגיע', pending:'ממתין' }[s] || s }
function fmtNum(n) { return Math.round(n).toLocaleString('he-IL') }

onMounted(load)
</script>

<style scoped>
.gifts-view { max-width: 1000px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-5); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-3); }

.total-bar { display: flex; gap: var(--space-4); background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5) var(--space-6); box-shadow: var(--shadow-sm); margin-bottom: var(--space-6); flex-wrap: wrap; }
.total-item { flex: 1; min-width: 80px; text-align: center; }
.total-item.primary .total-num { color: var(--color-primary); }
.total-num { display: block; font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); line-height: 1; }
.total-label { font-size: var(--font-size-xs); color: var(--color-text-muted); display: block; margin-top: 4px; }

.center-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.search-bar { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); }
.search-input { flex: 1; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg-card); color: var(--color-navy); }
.search-input:focus { outline: none; border-color: var(--color-primary); }
.filter-select { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg-card); color: var(--color-navy); cursor: pointer; }

.table-wrap { background: var(--color-bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; }
.gifts-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.gifts-table thead tr { background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); }
.gifts-table th { padding: var(--space-3) var(--space-4); text-align: right; font-weight: 700; color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; }
.gifts-table tbody tr { border-bottom: 1px solid var(--color-border); transition: background var(--transition-fast); }
.gifts-table tbody tr:last-child { border-bottom: none; }
.gifts-table tbody tr:hover { background: var(--color-bg-subtle); }
.gifts-table td { padding: var(--space-3) var(--space-4); vertical-align: middle; }

.name-cell { font-weight: 600; color: var(--color-navy); }
.group-tag { background: var(--color-info-bg); color: #1e40af; border-radius: var(--radius-full); padding: 2px 8px; font-size: var(--font-size-xs); font-weight: 600; }
.dash { color: var(--color-text-light); }

.rsvp-badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.rsvp-badge.confirmed { background: var(--color-success-bg); color: #065f46; }
.rsvp-badge.declined { background: var(--color-error-bg); color: #991b1b; }
.rsvp-badge.pending { background: var(--color-warning-bg); color: #92400e; }

.gift-cell { min-width: 160px; }
.edit-row { display: flex; align-items: center; gap: var(--space-2); }
.amount-input { width: 90px; padding: 4px 8px; border: 1.5px solid var(--color-primary); border-radius: var(--radius-sm); font-family: var(--font); font-size: var(--font-size-sm); }
.amount-input:focus { outline: none; }
.btn-save { background: var(--color-success); color: #fff; border: none; border-radius: var(--radius-sm); padding: 4px 8px; cursor: pointer; font-size: var(--font-size-xs); font-weight: 700; }
.btn-cancel-edit { background: var(--color-error); color: #fff; border: none; border-radius: var(--radius-sm); padding: 4px 8px; cursor: pointer; font-size: var(--font-size-xs); }
.amount-display { font-weight: 700; color: var(--color-text-muted); }
.amount-display.has-gift { color: var(--color-primary); font-size: var(--font-size-base); }

.btn-edit { background: none; border: 1.5px solid var(--color-border); color: var(--color-text-muted); border-radius: var(--radius-sm); padding: 3px 10px; font-size: var(--font-size-xs); cursor: pointer; font-family: var(--font); transition: all var(--transition-fast); }
.btn-edit:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-bg); }

.no-results { text-align: center; padding: var(--space-8); color: var(--color-text-muted); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

@media (max-width: 680px) {
  .gifts-view { padding: var(--space-4); }
  .page-header, .header-actions { flex-direction: column; }
  .total-bar { gap: var(--space-3); }
  .table-wrap { overflow-x: auto; }
  .gifts-table { min-width: 600px; }
}
</style>
