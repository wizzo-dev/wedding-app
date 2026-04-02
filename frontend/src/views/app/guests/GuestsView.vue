<template>
  <div class="guests-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">רשימת אורחים 👥</h1>
        <p class="page-sub" v-if="!loading">{{ stats.total }} אורחים · {{ stats.totalPeople }} נפשות</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="$router.push('/app/guests/stats')">
          📊 סטטיסטיקות
        </button>
        <button class="btn btn-outline" @click="$router.push('/app/guests/import')">
          📥 ייבוא
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          + הוסף אורח
        </button>
      </div>
    </div>

    <!-- Stats bar -->
    <div class="stats-bar" v-if="!loading">
      <div class="stat-chip" :class="{ active: activeStatus === null }" @click="activeStatus = null">
        <span class="chip-num">{{ stats.total }}</span>
        <span class="chip-label">הכל</span>
      </div>
      <div class="stat-chip confirmed" :class="{ active: activeStatus === 'confirmed' }" @click="activeStatus = activeStatus === 'confirmed' ? null : 'confirmed'">
        <span class="chip-num">{{ stats.confirmed }}</span>
        <span class="chip-label">מגיעים</span>
      </div>
      <div class="stat-chip maybe" :class="{ active: activeStatus === 'maybe' }" @click="activeStatus = activeStatus === 'maybe' ? null : 'maybe'">
        <span class="chip-num">{{ stats.maybe }}</span>
        <span class="chip-label">אולי</span>
      </div>
      <div class="stat-chip pending" :class="{ active: activeStatus === 'pending' }" @click="activeStatus = activeStatus === 'pending' ? null : 'pending'">
        <span class="chip-num">{{ stats.pending }}</span>
        <span class="chip-label">ממתינים</span>
      </div>
      <div class="stat-chip declined" :class="{ active: activeStatus === 'declined' }" @click="activeStatus = activeStatus === 'declined' ? null : 'declined'">
        <span class="chip-num">{{ stats.declined }}</span>
        <span class="chip-label">לא מגיעים</span>
      </div>
      <div class="stat-chip people">
        <span class="chip-num">{{ stats.totalPeople }}</span>
        <span class="chip-label">נפשות</span>
      </div>
    </div>

    <!-- Search + Filters -->
    <div class="search-row">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="חפש לפי שם, טלפון, מייל, קבוצה..."
          @input="page = 1"
        />
        <button v-if="search" class="search-clear" @click="search = ''; page = 1">✕</button>
      </div>
      <div class="filter-pills">
        <button
          v-for="side in SIDES"
          :key="side.val"
          class="filter-pill"
          :class="{ active: activeSide === side.val }"
          @click="activeSide = activeSide === side.val ? null : side.val; page = 1"
        >{{ side.label }}</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-row">
      <button
        v-for="tab in TABS"
        :key="tab.val"
        class="tab-btn"
        :class="{ active: activeTab === tab.val }"
        @click="activeTab = tab.val; page = 1"
      >
        {{ tab.label }}
        <span v-if="tab.count !== null" class="tab-count">{{ tabCount(tab.val) }}</span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="skeleton-table">
      <div class="skeleton skeleton-row" v-for="n in 8" :key="n"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️</span><p>{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <span class="empty-icon">👥</span>
      <h3>{{ search || activeStatus || activeSide ? 'לא נמצאו אורחים' : 'אין אורחים עדיין' }}</h3>
      <p>{{ search || activeStatus || activeSide ? 'נסה לשנות את החיפוש או הפילטרים' : 'הוסף אורחים לרשימה שלך' }}</p>
      <button v-if="!search && !activeStatus && !activeSide" class="btn btn-primary" @click="openAddModal">+ הוסף אורח ראשון</button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrap">
      <table class="guests-table">
        <thead>
          <tr>
            <th></th>
            <th>שם</th>
            <th>טלפון</th>
            <th>קבוצה</th>
            <th>צד</th>
            <th>RSVP</th>
            <th>נפשות</th>
            <th>שולחן</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in paginated"
            :key="g.id"
            class="guest-row"
            @click="$router.push(`/app/guests/${g.id}`)"
          >
            <td @click.stop>
              <div class="avatar" :style="{ background: avatarColor(g.name) }">
                {{ initials(g.name) }}
              </div>
            </td>
            <td>
              <div class="guest-name">{{ g.name }}</div>
              <div class="guest-email" v-if="g.email">{{ g.email }}</div>
            </td>
            <td>
              <a v-if="g.phone" :href="`tel:${g.phone}`" class="phone-link" @click.stop>{{ g.phone }}</a>
              <span v-else class="muted">—</span>
            </td>
            <td><span v-if="g.groupName" class="group-chip">{{ g.groupName }}</span><span v-else class="muted">—</span></td>
            <td><span class="side-badge" :class="sideCls(g.side)">{{ g.side }}</span></td>
            <td @click.stop>
              <select class="rsvp-select" :class="rsvpCls(g.rsvpStatus)" :value="g.rsvpStatus" @change="quickRsvp(g, $event.target.value)">
                <option value="pending">ממתין</option>
                <option value="confirmed">מגיע ✓</option>
                <option value="declined">לא מגיע ✗</option>
                <option value="maybe">אולי</option>
              </select>
            </td>
            <td class="center">{{ g.numPeople }}</td>
            <td><span v-if="g.tableName" class="table-chip">{{ g.tableName }}</span><span v-else class="muted">—</span></td>
            <td @click.stop>
              <div class="row-actions">
                <a v-if="g.phone" :href="`https://wa.me/972${g.phone?.replace(/^0/,'')}`" target="_blank" class="icon-btn wa" title="WhatsApp">💬</a>
                <button class="icon-btn edit" @click.stop="openEditModal(g)" title="ערוך">✏️</button>
                <button class="icon-btn del" @click.stop="confirmDeleteGuest(g)" title="מחק">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="page === 1" @click="page--">→</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">←</button>
      </div>

      <div class="result-count">מציג {{ paginated.length }} מתוך {{ filtered.length }} אורחים</div>
    </div>

    <!-- ── Modals ─────────────────────────────────────────────────────────────── -->
    <teleport to="body">

      <!-- Add / Edit Guest Modal -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ editGuest ? 'עריכת אורח' : 'הוסף אורח' }}</h3>
            <button class="modal-close" @click="showModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">שם מלא *</label>
                <input v-model="form.name" type="text" class="form-input" placeholder="ישראל ישראלי" />
              </div>
              <div class="form-group">
                <label class="form-label">טלפון</label>
                <input v-model="form.phone" type="tel" class="form-input" placeholder="05X-XXXXXXX" dir="ltr" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">מייל</label>
                <input v-model="form.email" type="email" class="form-input" placeholder="israel@example.com" dir="ltr" />
              </div>
              <div class="form-group">
                <label class="form-label">קבוצה</label>
                <input v-model="form.groupName" type="text" class="form-input" placeholder="לדוגמה: משפחה, חברים" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">צד</label>
                <select v-model="form.side" class="form-input">
                  <option v-for="s in ['חתן','כלה','משותף']" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">סטטוס RSVP</label>
                <select v-model="form.rsvpStatus" class="form-input">
                  <option value="pending">ממתין</option>
                  <option value="confirmed">מגיע</option>
                  <option value="declined">לא מגיע</option>
                  <option value="maybe">אולי</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">מספר נפשות</label>
                <input v-model.number="form.numPeople" type="number" class="form-input" min="1" max="20" />
              </div>
              <div class="form-group">
                <label class="form-label">סכום מתנה (₪)</label>
                <input v-model.number="form.giftAmount" type="number" class="form-input" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">הערות</label>
              <textarea v-model="form.notes" class="form-input form-textarea" rows="2" placeholder="הערות נוספות..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showModal = false">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveGuest">
              {{ saving ? 'שומר...' : editGuest ? 'שמור שינויים' : 'הוסף אורח' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm Delete -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3>מחיקת אורח</h3>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <div class="modal-body">
            <p>האם למחוק את <strong>{{ deleteTarget.name }}</strong> מהרשימה?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deleteTarget = null">ביטול</button>
            <button class="btn btn-danger" :disabled="saving" @click="deleteGuest">
              {{ saving ? 'מוחק...' : 'מחק' }}
            </button>
          </div>
        </div>
      </div>

    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const TABS = [
  { val: null, label: 'הכל', count: true },
  { val: 'confirmed', label: 'מגיעים', count: true },
  { val: 'maybe', label: 'לא בטוחים', count: true },
  { val: 'declined', label: 'לא מגיעים', count: true },
  { val: 'pending', label: 'ממתינים', count: true }
]

const SIDES = [
  { val: 'חתן', label: '🤵 חתן' },
  { val: 'כלה', label: '👰 כלה' },
  { val: 'משותף', label: '💑 משותף' }
]

const PAGE_SIZE = 20

const loading = ref(true)
const saving = ref(false)
const error = ref(null)

const guests = ref([])
const stats = ref({ total: 0, totalPeople: 0, confirmed: 0, declined: 0, maybe: 0, pending: 0 })

const search = ref('')
const activeStatus = ref(null)
const activeTab = ref(null)
const activeSide = ref(null)
const page = ref(1)

const showModal = ref(false)
const editGuest = ref(null)
const deleteTarget = ref(null)

const form = ref({ name: '', phone: '', email: '', groupName: '', side: 'חתן', rsvpStatus: 'pending', numPeople: 1, giftAmount: null, notes: '' })

// ── Computed ──────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = guests.value

  // Tab filter
  const tabFilter = activeStatus.value ?? activeTab.value
  if (tabFilter) list = list.filter(g => g.rsvpStatus === tabFilter)

  // Side filter
  if (activeSide.value) list = list.filter(g => g.side === activeSide.value)

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.groupName?.toLowerCase().includes(q)
    )
  }

  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

function tabCount(val) {
  if (!val) return guests.value.length
  return guests.value.filter(g => g.rsvpStatus === val).length
}

// ── API ───────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/guests')
    guests.value = res.data.guests
    stats.value = res.data.stats
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת אורחים'
  } finally {
    loading.value = false
  }
}

async function quickRsvp(g, status) {
  try {
    await api.patch(`/guests/${g.id}/rsvp`, { rsvpStatus: status })
    g.rsvpStatus = status
    // Update stats
    stats.value = calcStats(guests.value)
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בעדכון')
    await load()
  }
}

function calcStats(list) {
  return {
    total: list.length,
    totalPeople: list.reduce((s, g) => s + g.numPeople, 0),
    confirmed: list.filter(g => g.rsvpStatus === 'confirmed').length,
    declined: list.filter(g => g.rsvpStatus === 'declined').length,
    maybe: list.filter(g => g.rsvpStatus === 'maybe').length,
    pending: list.filter(g => g.rsvpStatus === 'pending').length
  }
}

function openAddModal() {
  editGuest.value = null
  form.value = { name: '', phone: '', email: '', groupName: '', side: 'חתן', rsvpStatus: 'pending', numPeople: 1, giftAmount: null, notes: '' }
  showModal.value = true
}

function openEditModal(g) {
  editGuest.value = g
  form.value = {
    name: g.name, phone: g.phone || '', email: g.email || '',
    groupName: g.groupName || '', side: g.side, rsvpStatus: g.rsvpStatus,
    numPeople: g.numPeople, giftAmount: g.giftAmount || null, notes: g.notes || ''
  }
  showModal.value = true
}

async function saveGuest() {
  if (!form.value.name.trim()) { alert('שם אורח נדרש'); return }
  saving.value = true
  try {
    if (editGuest.value) {
      const res = await api.put(`/guests/${editGuest.value.id}`, form.value)
      const idx = guests.value.findIndex(g => g.id === editGuest.value.id)
      if (idx !== -1) guests.value[idx] = { ...guests.value[idx], ...res.data }
    } else {
      const res = await api.post('/guests', form.value)
      guests.value.unshift(res.data)
    }
    stats.value = calcStats(guests.value)
    showModal.value = false
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

function confirmDeleteGuest(g) { deleteTarget.value = g }

async function deleteGuest() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await api.delete(`/guests/${deleteTarget.value.id}`)
    guests.value = guests.value.filter(g => g.id !== deleteTarget.value.id)
    stats.value = calcStats(guests.value)
    deleteTarget.value = null
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה במחיקה')
  } finally {
    saving.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#E91E8C','#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2','#9333EA']
function avatarColor(name) {
  let hash = 0
  for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFF
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(name) {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('')
}

function rsvpCls(status) {
  return { confirmed: 'rsvp-confirmed', declined: 'rsvp-declined', maybe: 'rsvp-maybe', pending: 'rsvp-pending' }[status] || 'rsvp-pending'
}

function sideCls(side) {
  return { 'חתן': 'side-groom', 'כלה': 'side-bride', 'משותף': 'side-both' }[side] || ''
}

onMounted(load)
</script>

<style scoped>
.guests-view { padding: var(--space-6); max-width: 1200px; }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Stats bar */
.stats-bar { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-4); }
.stat-chip { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: var(--color-bg-card); border: 1.5px solid var(--color-border); border-radius: var(--radius-full); cursor: pointer; transition: var(--transition-fast); user-select: none; }
.stat-chip:hover { border-color: var(--color-navy); }
.stat-chip.active { border-color: var(--color-primary); background: var(--color-primary-bg); }
.stat-chip.confirmed.active { border-color: var(--color-success); background: var(--color-success-bg); }
.stat-chip.declined.active { border-color: var(--color-error); background: var(--color-error-bg); }
.stat-chip.maybe.active, .stat-chip.pending.active { border-color: var(--color-warning); background: var(--color-warning-bg); }
.chip-num { font-weight: 800; font-size: var(--font-size-lg); color: var(--color-navy); }
.chip-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }
.stat-chip.people { cursor: default; }

/* Search */
.search-row { display: flex; gap: var(--space-4); align-items: center; margin-bottom: var(--space-3); flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
.search-input { width: 100%; padding: var(--space-3) var(--space-3) var(--space-3) var(--space-8); padding-right: var(--space-10); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg-card); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; }
.search-input:focus { border-color: var(--color-primary); }
.search-clear { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 14px; }
.filter-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.filter-pill { padding: 6px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-bg-card); font-family: var(--font); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; transition: var(--transition-fast); }
.filter-pill:hover { border-color: var(--color-navy); }
.filter-pill.active { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary); }

/* Tabs */
.tabs-row { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: var(--space-4); overflow-x: auto; }
.tab-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; color: var(--color-text-muted); white-space: nowrap; transition: var(--transition-fast); }
.tab-btn:hover { color: var(--color-navy); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.tab-count { background: var(--color-bg-subtle); border-radius: var(--radius-full); padding: 2px 8px; font-size: var(--font-size-xs); }
.tab-btn.active .tab-count { background: var(--color-primary-light); color: var(--color-primary); }

/* Table */
.table-wrap { background: var(--color-bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); overflow: hidden; }
.guests-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.guests-table th { text-align: right; padding: var(--space-3) var(--space-4); background: var(--color-bg-subtle); border-bottom: 2px solid var(--color-border); font-weight: 700; color: var(--color-text-muted); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
.guests-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.guest-row { cursor: pointer; transition: var(--transition-fast); }
.guest-row:hover td { background: var(--color-primary-bg); }
.guest-row:last-child td { border-bottom: none; }

.avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.guest-name { font-weight: 600; color: var(--color-navy); }
.guest-email { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.phone-link { color: var(--color-primary); text-decoration: none; font-weight: 500; direction: ltr; display: inline-block; }
.phone-link:hover { text-decoration: underline; }
.muted { color: var(--color-text-muted); }
.center { text-align: center; }

.group-chip { background: var(--color-info-bg); color: var(--color-info); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.side-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.side-groom { background: #DBEAFE; color: #1D4ED8; }
.side-bride { background: var(--color-primary-light); color: var(--color-primary); }
.side-both { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.table-chip { background: var(--color-bg-subtle); color: var(--color-navy); padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }

/* RSVP select */
.rsvp-select { padding: 4px 10px; border-radius: var(--radius-full); font-family: var(--font); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; border: 2px solid; outline: none; background: #fff; }
.rsvp-select.rsvp-confirmed { border-color: var(--color-success); color: var(--color-success); background: var(--color-success-bg); }
.rsvp-select.rsvp-declined { border-color: var(--color-error); color: var(--color-error); background: var(--color-error-bg); }
.rsvp-select.rsvp-maybe { border-color: var(--color-warning); color: var(--color-warning); background: var(--color-warning-bg); }
.rsvp-select.rsvp-pending { border-color: var(--color-border); color: var(--color-text-muted); }

/* Row actions */
.row-actions { display: flex; gap: 4px; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: 15px; padding: 5px 6px; border-radius: var(--radius-sm); transition: var(--transition-fast); text-decoration: none; display: inline-flex; align-items: center; }
.icon-btn:hover { background: var(--color-bg-subtle); }
.icon-btn.del:hover { background: var(--color-error-bg); }
.icon-btn.wa:hover { background: #e7f9ee; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-4); border-top: 1px solid var(--color-border); }
.page-btn { background: var(--color-bg-subtle); border: 1.5px solid var(--color-border); border-radius: var(--radius); padding: var(--space-2) var(--space-3); cursor: pointer; font-family: var(--font); font-weight: 600; transition: var(--transition-fast); }
.page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-info { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); }
.result-count { text-align: center; padding: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-muted); border-top: 1px solid var(--color-border); }

/* Empty / Error */
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }
.empty-icon { font-size: 56px; display: block; margin-bottom: var(--space-4); }
.empty-state h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-state p { color: var(--color-text-muted); margin-bottom: var(--space-5); }
.error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

/* Skeleton */
.skeleton-table { background: var(--color-bg-card); border-radius: var(--radius-xl); overflow: hidden; border: 1.5px solid var(--color-border); }
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.skeleton-row { height: 56px; margin-bottom: 1px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--color-navy); border: 1.5px solid var(--color-border); }
.btn-outline:hover { border-color: var(--color-navy); }
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: #fff; border-radius: var(--radius-xl); padding: var(--space-6); width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-xl); }
.modal-sm { max-width: 380px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); }
.modal-body { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-group { display: flex; flex-direction: column; gap: var(--space-1); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { width: 100%; padding: var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; }
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-textarea { resize: vertical; min-height: 60px; }

@media (max-width: 800px) {
  .guests-view { padding: var(--space-4); }
  .guests-table th:nth-child(4), .guests-table td:nth-child(4),
  .guests-table th:nth-child(8), .guests-table td:nth-child(8) { display: none; }
  .form-row { grid-template-columns: 1fr; }
}
@media (max-width: 500px) {
  .guests-table th:nth-child(3), .guests-table td:nth-child(3) { display: none; }
  .page-header { flex-direction: column; }
  .header-actions { flex-wrap: wrap; }
}
</style>
