<template>
  <div class="guests-page fade-in" dir="rtl">

    <!-- Stats bar -->
    <div class="guests-stats-bar" v-if="!statsLoading">
      <div class="gstat-item" :class="{ active: filter === 'all' }" @click="setFilter('all')">
        <span class="gstat-num">{{ stats.total }}</span>
        <span class="gstat-label">סה"כ</span>
      </div>
      <div class="gstat-divider"></div>
      <div class="gstat-item gstat-confirmed" :class="{ active: filter === 'confirmed' }" @click="setFilter('confirmed')">
        <span class="gstat-num">{{ stats.confirmed }}</span>
        <span class="gstat-label">מגיעים ✅</span>
      </div>
      <div class="gstat-divider"></div>
      <div class="gstat-item gstat-maybe" :class="{ active: filter === 'maybe' }" @click="setFilter('maybe')">
        <span class="gstat-num">{{ stats.maybe }}</span>
        <span class="gstat-label">לא בטוחים 🤔</span>
      </div>
      <div class="gstat-divider"></div>
      <div class="gstat-item gstat-declined" :class="{ active: filter === 'declined' }" @click="setFilter('declined')">
        <span class="gstat-num">{{ stats.declined }}</span>
        <span class="gstat-label">לא מגיעים ❌</span>
      </div>
      <div class="gstat-divider"></div>
      <div class="gstat-item gstat-people">
        <span class="gstat-num">{{ stats.totalPeople }}</span>
        <span class="gstat-label">👥 נפשות</span>
      </div>
    </div>

    <!-- Search + actions -->
    <div class="guests-toolbar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="search" class="input search-input" placeholder="חפש לפי שם, טלפון, אימייל..." @input="debouncedLoad" />
      </div>
      <div class="filter-tabs">
        <button v-for="tab in filterTabs" :key="tab.value" class="filter-tab" :class="{ active: filter === tab.value }" @click="setFilter(tab.value)">
          {{ tab.label }}
        </button>
      </div>
      <div class="toolbar-actions">
        <router-link to="/app/guests/import" class="btn btn-outline btn-sm">📥 ייבוא Excel</router-link>
        <button class="btn btn-primary btn-sm" @click="openAddModal">+ הוסף אורח</button>
      </div>
    </div>

    <!-- Bulk actions bar -->
    <div v-if="selectedIds.size > 0" class="bulk-bar fade-in-up">
      <span class="bulk-count">{{ selectedIds.size }} נבחרו</span>
      <div class="bulk-actions">
        <button class="btn btn-outline btn-sm" @click="bulkRsvp('confirmed')">✅ מגיעים</button>
        <button class="btn btn-outline btn-sm" @click="bulkRsvp('maybe')">🤔 לא בטוחים</button>
        <button class="btn btn-outline btn-sm" @click="bulkRsvp('declined')">❌ לא מגיעים</button>
        <button class="btn btn-ghost btn-sm" style="color:var(--color-error)" @click="bulkDelete">🗑️ מחק</button>
      </div>
      <button class="btn btn-ghost btn-sm" @click="selectedIds.clear()">ביטול</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="padding: var(--space-8);">
      <div class="skeleton" style="height:56px;border-radius:12px;margin-bottom:var(--space-3);" v-for="i in 8" :key="i"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="guests.length === 0" class="empty-state">
      <div class="empty-state-icon">👥</div>
      <p class="empty-state-title">{{ search || filter !== 'all' ? 'לא נמצאו אורחים' : 'אין אורחים עדיין' }}</p>
      <p class="empty-state-text">{{ search || filter !== 'all' ? 'נסה לשנות את הסינון' : 'הוסף אורחים לרשימה' }}</p>
      <button v-if="!search && filter === 'all'" class="btn btn-primary" @click="openAddModal">+ הוסף אורח ראשון</button>
    </div>

    <!-- Guests table -->
    <div v-else class="guests-table card">
      <div class="table-header">
        <div class="th-check"><input type="checkbox" @change="toggleAll" :checked="allSelected" /></div>
        <div class="th-name">שם</div>
        <div class="th-phone">טלפון</div>
        <div class="th-group">קבוצה</div>
        <div class="th-rsvp">RSVP</div>
        <div class="th-people">נפשות</div>
        <div class="th-gift">מתנה</div>
        <div class="th-actions"></div>
      </div>

      <div v-for="guest in guests" :key="guest.id" class="table-row" :class="{ selected: selectedIds.has(guest.id) }">
        <div class="td-check">
          <input type="checkbox" :checked="selectedIds.has(guest.id)" @change="toggleSelect(guest.id)" />
        </div>
        <div class="td-name" @click="$router.push(`/app/guests/${guest.id}`)">
          <div class="guest-avatar">{{ guest.name.charAt(0) }}</div>
          <div class="guest-name-col">
            <span class="guest-name">{{ guest.name }}</span>
            <span v-if="guest.email" class="guest-email">{{ guest.email }}</span>
          </div>
        </div>
        <div class="td-phone">
          <a v-if="guest.phone" :href="`https://wa.me/972${guest.phone.replace(/^0/, '')}`" target="_blank" class="phone-link" @click.stop>{{ guest.phone }}</a>
          <span v-else class="text-muted">—</span>
        </div>
        <div class="td-group">
          <span v-if="guest.groupName" class="group-badge">{{ guest.groupName }}</span>
          <span v-else class="text-muted">—</span>
        </div>
        <div class="td-rsvp">
          <button class="rsvp-badge" :class="rsvpClass(guest.rsvpStatus)" @click.stop="cycleRsvp(guest)" title="לחץ לשינוי סטטוס">
            {{ rsvpLabel(guest.rsvpStatus) }}
          </button>
        </div>
        <div class="td-people">{{ guest.numPeople }}</div>
        <div class="td-gift">
          <span v-if="guest.giftAmount">₪{{ Math.round(guest.giftAmount).toLocaleString('he-IL') }}</span>
          <span v-else class="text-muted">—</span>
        </div>
        <div class="td-actions">
          <button class="btn btn-ghost btn-icon btn-sm" @click.stop="$router.push(`/app/guests/${guest.id}`)" title="עריכה">✏️</button>
          <button class="btn btn-ghost btn-icon btn-sm" @click.stop="deleteGuest(guest.id)" title="מחק">🗑️</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button class="btn btn-ghost btn-sm" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">← הקודם</button>
      <span class="page-info">עמוד {{ pagination.page }} מתוך {{ pagination.totalPages }}</span>
      <button class="btn btn-ghost btn-sm" :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">הבא →</button>
    </div>

    <!-- Add Guest Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-box card pop-in">
        <div class="modal-header">
          <h3 class="modal-title">הוסף אורח</h3>
          <button class="btn btn-ghost btn-icon" @click="showModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="label">שם מלא *</label>
              <input v-model="form.name" class="input" placeholder="ישראל ישראלי" />
            </div>
            <div class="form-group flex-1">
              <label class="label">טלפון</label>
              <input v-model="form.phone" class="input" placeholder="050-0000000" />
            </div>
          </div>
          <div class="form-group">
            <label class="label">אימייל</label>
            <input v-model="form.email" class="input" type="email" placeholder="israel@example.com" />
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="label">קבוצה</label>
              <select v-model="form.groupName" class="input">
                <option value="">בחר קבוצה</option>
                <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="label">מספר מגיעים</label>
              <input v-model.number="form.numPeople" class="input" type="number" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="label">סטטוס RSVP</label>
              <select v-model="form.rsvpStatus" class="input">
                <option value="pending">ממתין ⏳</option>
                <option value="confirmed">מגיע ✅</option>
                <option value="maybe">לא בטוח 🤔</option>
                <option value="declined">לא מגיע ❌</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="label">סכום מתנה (₪)</label>
              <input v-model.number="form.giftAmount" class="input" type="number" min="0" placeholder="0" />
            </div>
          </div>
          <div class="form-group">
            <label class="label">הערות</label>
            <input v-model="form.notes" class="input" placeholder="הערות נוספות..." />
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button class="btn btn-primary w-full" :disabled="saving" @click="saveGuest">
            {{ saving ? 'שומר...' : 'הוסף אורח' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import api from '@/composables/useApi'

const loading       = ref(true)
const statsLoading  = ref(true)
const guests        = ref([])
const pagination    = ref({ total: 0, page: 1, limit: 50, totalPages: 1 })
const stats         = ref({ total: 0, confirmed: 0, pending: 0, declined: 0, maybe: 0, totalPeople: 0 })
const search        = ref('')
const filter        = ref('all')
const selectedIds   = reactive(new Set())
const showModal     = ref(false)
const formError     = ref('')
const saving        = ref(false)
const form          = ref(emptyForm())

const groups = ['משפחת החתן', 'משפחת הכלה', 'חברים', 'עבודה', 'אחר']
const filterTabs = [
  { value: 'all',       label: 'הכל' },
  { value: 'confirmed', label: 'מגיעים ✅' },
  { value: 'maybe',     label: 'לא בטוחים 🤔' },
  { value: 'declined',  label: 'לא מגיעים ❌' },
  { value: 'pending',   label: 'ממתינים ⏳' }
]
const allSelected = computed(() => guests.value.length > 0 && guests.value.every(g => selectedIds.has(g.id)))

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadGuests(), 300)
}

onMounted(async () => { await Promise.all([loadGuests(), loadStats()]) })

async function loadGuests(page = 1) {
  loading.value = true
  try {
    const res = await api.get('/guests', { params: { page, limit: 50, search: search.value, filter: filter.value === 'all' ? '' : filter.value } })
    guests.value     = res.data.guests
    pagination.value = res.data.pagination
  } catch (e) { console.error(e) } finally { loading.value = false }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await api.get('/guests/stats')
    stats.value = res.data
  } catch (e) { console.error(e) } finally { statsLoading.value = false }
}

function setFilter(val) { filter.value = val; loadGuests() }
function changePage(p)  { loadGuests(p) }

function toggleAll() {
  if (allSelected.value) { guests.value.forEach(g => selectedIds.delete(g.id)) }
  else                   { guests.value.forEach(g => selectedIds.add(g.id)) }
}
function toggleSelect(id) {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

async function cycleRsvp(guest) {
  const order = ['pending', 'confirmed', 'maybe', 'declined']
  const nextStatus = order[(order.indexOf(guest.rsvpStatus) + 1) % order.length]
  try {
    await api.patch(`/guests/${guest.id}/rsvp`, { rsvpStatus: nextStatus })
    guest.rsvpStatus = nextStatus
    loadStats()
  } catch (e) { console.error(e) }
}

async function deleteGuest(id) {
  if (!confirm('למחוק אורח זה?')) return
  try {
    await api.delete(`/guests/${id}`)
    guests.value = guests.value.filter(g => g.id !== id)
    selectedIds.delete(id)
    loadStats()
  } catch (e) { alert(e?.response?.data?.message || 'שגיאה') }
}

async function bulkRsvp(rsvpStatus) {
  const ids = Array.from(selectedIds)
  if (!ids.length) return
  try {
    await api.post('/guests/bulk', { ids, action: 'rsvp', rsvpStatus })
    selectedIds.clear()
    await Promise.all([loadGuests(pagination.value.page), loadStats()])
  } catch (e) { alert(e?.response?.data?.message || 'שגיאה') }
}

async function bulkDelete() {
  const ids = Array.from(selectedIds)
  if (!ids.length || !confirm(`למחוק ${ids.length} אורחים?`)) return
  try {
    await api.post('/guests/bulk', { ids, action: 'delete' })
    selectedIds.clear()
    await Promise.all([loadGuests(), loadStats()])
  } catch (e) { alert(e?.response?.data?.message || 'שגיאה') }
}

function openAddModal() { form.value = emptyForm(); formError.value = ''; showModal.value = true }

async function saveGuest() {
  formError.value = ''
  if (!form.value.name?.trim()) { formError.value = 'אנא הזן שם אורח'; return }
  saving.value = true
  try {
    await api.post('/guests', {
      name:       form.value.name.trim(),
      phone:      form.value.phone      || undefined,
      email:      form.value.email      || undefined,
      groupName:  form.value.groupName  || undefined,
      numPeople:  form.value.numPeople  || 1,
      rsvpStatus: form.value.rsvpStatus || 'pending',
      giftAmount: form.value.giftAmount || undefined,
      notes:      form.value.notes      || undefined
    })
    showModal.value = false
    await Promise.all([loadGuests(), loadStats()])
  } catch (e) { formError.value = e?.response?.data?.message || 'שגיאה בשמירה' }
  finally { saving.value = false }
}

function emptyForm() {
  return { name: '', phone: '', email: '', groupName: '', numPeople: 1, rsvpStatus: 'pending', giftAmount: null, notes: '' }
}
function rsvpLabel(status) {
  return { confirmed: 'מגיע ✅', maybe: 'לא בטוח 🤔', declined: 'לא מגיע ❌', pending: 'ממתין ⏳' }[status] || status
}
function rsvpClass(status) {
  return { confirmed: 'rsvp-confirmed', maybe: 'rsvp-maybe', declined: 'rsvp-declined', pending: 'rsvp-pending' }[status] || 'rsvp-pending'
}
</script>

<style scoped>
.guests-page { padding: var(--space-6) var(--space-8); max-width: var(--content-max); margin: 0 auto; }
.guests-stats-bar {
  display: flex; align-items: center; gap: var(--space-4);
  background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-8); margin-bottom: var(--space-6); flex-wrap: wrap; box-shadow: var(--shadow-sm);
}
.gstat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: var(--space-2) var(--space-3); border-radius: var(--radius); transition: background var(--transition-fast); flex: 1; min-width: 60px; }
.gstat-item:hover { background: var(--color-bg-subtle); }
.gstat-item.active { background: var(--color-primary-bg); }
.gstat-num { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); line-height: 1; }
.gstat-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.gstat-confirmed .gstat-num { color: var(--color-success); }
.gstat-maybe .gstat-num    { color: var(--color-warning); }
.gstat-declined .gstat-num { color: var(--color-error); }
.gstat-people .gstat-num   { color: var(--color-primary); }
.gstat-divider { width: 1px; height: 40px; background: var(--color-border); flex-shrink: 0; }
.guests-toolbar { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 1rem; pointer-events: none; }
.search-input { padding-right: 40px; }
.filter-tabs { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.filter-tab { padding: 7px var(--space-4); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; border: 1.5px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-muted); transition: all var(--transition-fast); }
.filter-tab.active, .filter-tab:hover { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary); }
.toolbar-actions { display: flex; gap: var(--space-3); flex-shrink: 0; }
.bulk-bar { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-6); background: var(--color-navy); border-radius: var(--radius-xl); margin-bottom: var(--space-4); flex-wrap: wrap; }
.bulk-count { color: #fff; font-weight: 700; font-size: var(--font-size-sm); flex-shrink: 0; }
.bulk-actions { display: flex; gap: var(--space-2); flex: 1; flex-wrap: wrap; }
.bulk-actions .btn-outline { border-color: rgba(255,255,255,0.4); color: #fff; }
.bulk-actions .btn-outline:hover { background: rgba(255,255,255,0.1); }
.guests-table { overflow: hidden; }
.table-header {
  display: grid;
  grid-template-columns: 40px 2.5fr 1.2fr 1fr 1fr 80px 80px 80px;
  gap: var(--space-3); padding: var(--space-3) var(--space-6);
  background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em;
}
.table-row {
  display: grid;
  grid-template-columns: 40px 2.5fr 1.2fr 1fr 1fr 80px 80px 80px;
  gap: var(--space-3); padding: var(--space-4) var(--space-6); align-items: center;
  border-bottom: 1px solid var(--color-border); transition: background var(--transition-fast); cursor: pointer;
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: var(--color-bg-subtle); }
.table-row.selected { background: var(--color-primary-bg); }
.td-name { display: flex; align-items: center; gap: var(--space-3); }
.guest-avatar { width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: var(--font-size-sm); flex-shrink: 0; }
.guest-name-col { display: flex; flex-direction: column; min-width: 0; }
.guest-name { font-weight: 700; font-size: var(--font-size-sm); }
.guest-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.phone-link { color: var(--color-info); font-size: var(--font-size-sm); text-decoration: none; }
.phone-link:hover { text-decoration: underline; }
.group-badge { font-size: var(--font-size-xs); background: var(--color-bg-subtle); color: var(--color-text-muted); padding: 3px 8px; border-radius: var(--radius-full); font-weight: 600; }
.rsvp-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; border: none; transition: all var(--transition-fast); white-space: nowrap; }
.rsvp-badge:hover { transform: scale(1.05); }
.rsvp-confirmed { background: var(--color-success-bg);  color: #16A34A; }
.rsvp-maybe     { background: var(--color-warning-bg);  color: #D97706; }
.rsvp-declined  { background: var(--color-error-bg);    color: #DC2626; }
.rsvp-pending   { background: var(--color-bg-subtle);   color: var(--color-text-muted); }
.td-actions { display: flex; gap: var(--space-1); }
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-4); margin-top: var(--space-6); }
.page-info { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.modal-overlay { position: fixed; inset: 0; background: rgba(26,31,54,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal-box { width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; background: var(--color-bg-card); z-index: 1; }
.modal-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-body { padding: var(--space-6); }
.form-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 140px; }
.flex-1 { flex: 1; }
@media (max-width: 900px) {
  .guests-page { padding: var(--space-4); }
  .table-header, .table-row { grid-template-columns: 40px 2fr 1fr 1fr 80px 60px; }
  .th-phone, .td-phone, .th-gift, .td-gift { display: none; }
}
@media (max-width: 600px) {
  .table-header, .table-row { grid-template-columns: 40px 2fr 1fr 80px; }
  .th-group, .td-group, .th-people, .td-people { display: none; }
  .guests-stats-bar { gap: var(--space-2); }
}
</style>