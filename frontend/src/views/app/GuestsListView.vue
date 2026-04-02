<template>
  <div class="guests-list fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">רשימת אורחים</h1>
        <p class="page-subtitle">נהל את כל האורחים שלך במקום אחד</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline btn-sm" @click="showImportModal = true">
          📥 ייבוא מרובה
        </button>
        <button class="btn btn-primary btn-sm" @click="openAddModal">
          + הוסף אורח
        </button>
      </div>
    </div>

    <!-- Stats badges -->
    <div v-if="!loading && stats" class="stats-row">
      <div class="stat-badge" :class="{ active: activeFilter === 'all' }" @click="setFilter('all')">
        <span class="sb-num">{{ stats.total }}</span>
        <span class="sb-label">הכל</span>
      </div>
      <div class="stat-badge confirmed" :class="{ active: activeFilter === 'confirmed' }" @click="setFilter('confirmed')">
        <span class="sb-num">{{ stats.confirmed }}</span>
        <span class="sb-label">מגיעים</span>
      </div>
      <div class="stat-badge maybe" :class="{ active: activeFilter === 'maybe' }" @click="setFilter('maybe')">
        <span class="sb-num">{{ stats.maybe }}</span>
        <span class="sb-label">לא בטוחים</span>
      </div>
      <div class="stat-badge declined" :class="{ active: activeFilter === 'declined' }" @click="setFilter('declined')">
        <span class="sb-num">{{ stats.declined }}</span>
        <span class="sb-label">לא מגיעים</span>
      </div>
      <div class="stat-badge pending" :class="{ active: activeFilter === 'pending' }" @click="setFilter('pending')">
        <span class="sb-num">{{ stats.pending }}</span>
        <span class="sb-label">ממתינים</span>
      </div>
      <div class="stat-badge people-total">
        <span class="sb-num">{{ stats.totalPeople }}</span>
        <span class="sb-label">👥 נפשות</span>
      </div>
    </div>

    <!-- Search + filter bar -->
    <div class="toolbar card">
      <div class="card-body toolbar-body">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            class="input search-input"
            placeholder="חפש לפי שם, טלפון, קבוצה..."
            @input="onSearchInput"
          />
          <button v-if="search" class="clear-search" @click="clearSearch">✕</button>
        </div>
        <div class="filter-pills">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            class="filter-pill"
            :class="{ active: activeFilter === tab.value }"
            @click="setFilter(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="side-filters">
          <button
            v-for="s in sideFilters"
            :key="s.value"
            class="side-pill"
            :class="{ active: activeSide === s.value }"
            @click="setSide(s.value)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <template v-if="loading">
      <div class="guests-table card">
        <div class="card-body" style="padding:0">
          <div v-for="i in 8" :key="i" class="skeleton-row-guest">
            <div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;"></div>
            <div style="flex:1;display:flex;flex-direction:column;gap:6px;">
              <div class="skeleton" style="height:14px;width:35%;"></div>
              <div class="skeleton" style="height:12px;width:20%;"></div>
            </div>
            <div class="skeleton" style="height:24px;width:60px;border-radius:12px;"></div>
            <div class="skeleton" style="height:24px;width:60px;border-radius:12px;"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Error State -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת האורחים</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="fetchGuests">נסה שוב</button>
    </div>

    <!-- Empty States -->
    <template v-else>
      <div v-if="filteredGuests.length === 0" class="empty-state card">
        <div class="card-body">
          <div class="empty-state-icon">🎊</div>
          <p class="empty-state-title" v-if="search || activeFilter !== 'all'">לא נמצאו אורחים</p>
          <p class="empty-state-title" v-else>עדיין אין אורחים</p>
          <p class="empty-state-text" v-if="search">נסה לחפש במילים אחרות</p>
          <p class="empty-state-text" v-else-if="activeFilter !== 'all'">אין אורחים בסטטוס זה</p>
          <p class="empty-state-text" v-else>הוסף את האורחים הראשונים שלך לחתונה</p>
          <button v-if="!search && activeFilter === 'all'" class="btn btn-primary" @click="openAddModal">
            + הוסף אורח ראשון
          </button>
          <button v-else-if="search" class="btn btn-ghost" @click="clearSearch">נקה חיפוש</button>
        </div>
      </div>

      <!-- Guests Table -->
      <div v-else class="guests-table card">
        <div class="card-body" style="padding:0">
          <!-- Table Header -->
          <div class="table-header">
            <span class="th-name">אורח</span>
            <span class="th-side">צד</span>
            <span class="th-rsvp">סטטוס</span>
            <span class="th-table">שולחן</span>
            <span class="th-people">נפשות</span>
            <span class="th-actions">פעולות</span>
          </div>

          <!-- Guest Rows -->
          <div
            v-for="(guest, idx) in filteredGuests"
            :key="guest.id"
            class="guest-row"
            :class="{ 'row-alt': idx % 2 === 1 }"
          >
            <!-- Avatar + Name -->
            <div class="guest-identity">
              <div class="avatar avatar-md guest-avatar" :style="{ background: avatarBg(guest.name) }">
                {{ initials(guest.name) }}
              </div>
              <div class="guest-info">
                <span class="guest-name">{{ guest.name }}</span>
                <span v-if="guest.phone" class="guest-phone">{{ guest.phone }}</span>
                <span v-else class="guest-phone text-light">ללא טלפון</span>
              </div>
            </div>

            <!-- Side Badge -->
            <div class="td-side">
              <span class="side-badge" :class="sideClass(guest.side)">{{ guest.side }}</span>
            </div>

            <!-- RSVP Badge -->
            <div class="td-rsvp">
              <span class="rsvp-badge" :class="rsvpClass(guest.rsvpStatus)">
                {{ rsvpLabel(guest.rsvpStatus) }}
              </span>
            </div>

            <!-- Table -->
            <div class="td-table">
              <span v-if="guest.tableName" class="table-chip">🪑 {{ guest.tableName }}</span>
              <span v-else class="text-light text-sm">—</span>
            </div>

            <!-- People count -->
            <div class="td-people">
              <span class="people-num">{{ guest.numPeople }}</span>
            </div>

            <!-- Actions -->
            <div class="td-actions">
              <button
                v-if="guest.phone"
                class="btn btn-ghost btn-icon btn-sm action-wa"
                @click="openWhatsApp(guest)"
                title="שלח WhatsApp"
              >💬</button>
              <button
                class="btn btn-ghost btn-icon btn-sm"
                @click="openEditModal(guest)"
                title="ערוך"
              >✏️</button>
              <button
                class="btn btn-ghost btn-icon btn-sm action-del"
                @click="deleteGuest(guest.id)"
                :disabled="deletingId === guest.id"
                title="מחק"
              >{{ deletingId === guest.id ? '⏳' : '🗑️' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom count -->
      <div v-if="filteredGuests.length > 0" class="bottom-count">
        מציג {{ filteredGuests.length }} מתוך {{ guests.length }} אורחים
      </div>
    </template>

    <!-- Add / Edit Guest Modal -->
    <Teleport to="body">
      <div v-if="showGuestModal" class="modal-backdrop" @click.self="closeGuestModal">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>{{ editingGuest ? 'עריכת אורח' : 'הוסף אורח חדש' }}</h3>
            <button class="btn btn-ghost btn-icon" @click="closeGuestModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="label">שם מלא *</label>
                <input v-model="guestForm.name" class="input" placeholder="ישראל ישראלי" />
              </div>
              <div class="form-group">
                <label class="label">טלפון</label>
                <input v-model="guestForm.phone" class="input" placeholder="050-1234567" type="tel" />
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="label">אימייל</label>
                <input v-model="guestForm.email" class="input" placeholder="guest@email.com" type="email" />
              </div>
              <div class="form-group">
                <label class="label">קבוצה / משפחה</label>
                <input v-model="guestForm.groupName" class="input" placeholder="משפחת כהן" />
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="label">צד</label>
                <select v-model="guestForm.side" class="input">
                  <option value="חתן">חתן</option>
                  <option value="כלה">כלה</option>
                  <option value="משותף">משותף</option>
                </select>
              </div>
              <div class="form-group">
                <label class="label">סטטוס הגעה</label>
                <select v-model="guestForm.rsvpStatus" class="input">
                  <option value="pending">ממתין</option>
                  <option value="confirmed">מגיע</option>
                  <option value="maybe">לא בטוח</option>
                  <option value="declined">לא מגיע</option>
                </select>
              </div>
              <div class="form-group">
                <label class="label">מספר נפשות</label>
                <input v-model.number="guestForm.numPeople" type="number" class="input" min="1" max="20" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">הערות</label>
              <input v-model="guestForm.notes" class="input" placeholder="הערה נוספת..." />
            </div>
            <p v-if="guestFormError" class="form-error">{{ guestFormError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeGuestModal">ביטול</button>
            <button class="btn btn-primary" @click="submitGuestForm" :disabled="guestFormLoading">
              {{ guestFormLoading ? 'שומר...' : (editingGuest ? 'שמור שינויים' : 'הוסף אורח') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Bulk Import Modal -->
    <Teleport to="body">
      <div v-if="showImportModal" class="modal-backdrop" @click.self="showImportModal = false">
        <div class="modal modal-wide pop-in" dir="rtl">
          <div class="modal-header">
            <h3>📥 ייבוא מרובה</h3>
            <button class="btn btn-ghost btn-icon" @click="showImportModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="import-hint">הדבק רשימת אורחים — שם, טלפון וצד (מופרדים בפסיק), כל אורח בשורה נפרדת:</p>
            <pre class="import-example">ישראל ישראלי, 050-1234567, חתן
שרה לוי, 052-9876543, כלה
דוד כהן, 053-1112233, משותף</pre>
            <textarea
              v-model="importText"
              class="input import-textarea"
              placeholder="ישראל ישראלי, 050-1234567, חתן&#10;שרה לוי, 052-9876543, כלה"
              rows="8"
            ></textarea>
            <p v-if="importResult" class="import-result" :class="importResult.ok ? 'result-ok' : 'result-err'">
              {{ importResult.msg }}
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showImportModal = false">ביטול</button>
            <button class="btn btn-primary" @click="submitImport" :disabled="importLoading">
              {{ importLoading ? 'מייבא...' : 'ייבוא' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref(null)
const guests = ref([])
const stats = ref(null)

const search = ref('')
const activeFilter = ref('all')
const activeSide = ref('all')
let searchTimer = null

const showGuestModal = ref(false)
const editingGuest = ref(null)
const guestForm = ref(emptyForm())
const guestFormLoading = ref(false)
const guestFormError = ref(null)
const deletingId = ref(null)

const showImportModal = ref(false)
const importText = ref('')
const importLoading = ref(false)
const importResult = ref(null)

const filterTabs = [
  { value: 'all', label: 'הכל' },
  { value: 'confirmed', label: '✅ מגיעים' },
  { value: 'maybe', label: '🤔 לא בטוחים' },
  { value: 'declined', label: '❌ לא מגיעים' },
  { value: 'pending', label: '⏳ ממתינים' }
]

const sideFilters = [
  { value: 'all', label: 'הכל' },
  { value: 'חתן', label: 'צד חתן' },
  { value: 'כלה', label: 'צד כלה' },
  { value: 'משותף', label: 'משותף' }
]

// Computed filtered list (client-side filter)
const filteredGuests = computed(() => {
  let list = guests.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase().trim()
    list = list.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.phone && g.phone.includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.groupName && g.groupName.toLowerCase().includes(q))
    )
  }

  if (activeFilter.value !== 'all') {
    list = list.filter(g => g.rsvpStatus === activeFilter.value)
  }

  if (activeSide.value !== 'all') {
    list = list.filter(g => g.side === activeSide.value)
  }

  return list
})

function emptyForm() {
  return { name: '', phone: '', email: '', groupName: '', side: 'חתן', rsvpStatus: 'pending', numPeople: 1, notes: '' }
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0)
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

const AVATAR_COLORS = ['#E91E8C22', '#1A1F3622', '#22C55E22', '#3B82F622', '#F59E0B22', '#EF444422']
function avatarBg(name) {
  if (!name) return AVATAR_COLORS[0]
  const code = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[code]
}

function sideClass(side) {
  if (side === 'חתן') return 'side-groom'
  if (side === 'כלה') return 'side-bride'
  return 'side-mutual'
}

function rsvpClass(status) {
  const map = {
    confirmed: 'rsvp-confirmed',
    declined: 'rsvp-declined',
    maybe: 'rsvp-maybe',
    pending: 'rsvp-pending'
  }
  return map[status] || 'rsvp-pending'
}

function rsvpLabel(status) {
  const map = {
    confirmed: '✅ מגיע',
    declined: '❌ לא מגיע',
    maybe: '🤔 לא בטוח',
    pending: '⏳ ממתין'
  }
  return map[status] || status
}

function setFilter(val) {
  activeFilter.value = val
}

function setSide(val) {
  activeSide.value = val
}

function clearSearch() {
  search.value = ''
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {}, 300)
}

function openWhatsApp(guest) {
  const phone = guest.phone.replace(/\D/g, '')
  const normalized = phone.startsWith('0') ? '972' + phone.slice(1) : phone
  window.open(`https://wa.me/${normalized}`, '_blank')
}

async function fetchGuests() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/guests')
    guests.value = res.data.guests
    stats.value = res.data.stats
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת האורחים'
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingGuest.value = null
  guestForm.value = emptyForm()
  guestFormError.value = null
  showGuestModal.value = true
}

function openEditModal(guest) {
  editingGuest.value = guest
  guestForm.value = {
    name: guest.name,
    phone: guest.phone || '',
    email: guest.email || '',
    groupName: guest.groupName || '',
    side: guest.side || 'חתן',
    rsvpStatus: guest.rsvpStatus || 'pending',
    numPeople: guest.numPeople || 1,
    notes: guest.notes || ''
  }
  guestFormError.value = null
  showGuestModal.value = true
}

function closeGuestModal() {
  showGuestModal.value = false
  editingGuest.value = null
  guestFormError.value = null
}

async function submitGuestForm() {
  guestFormError.value = null
  if (!guestForm.value.name.trim()) {
    guestFormError.value = 'נא להזין שם אורח'
    return
  }
  guestFormLoading.value = true
  try {
    if (editingGuest.value) {
      const res = await api.put(`/guests/${editingGuest.value.id}`, guestForm.value)
      const idx = guests.value.findIndex(g => g.id === editingGuest.value.id)
      if (idx !== -1) guests.value[idx] = res.data
      // Update stats
      await refreshStats()
    } else {
      const res = await api.post('/guests', guestForm.value)
      guests.value.unshift(res.data)
      await refreshStats()
    }
    closeGuestModal()
  } catch (e) {
    guestFormError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    guestFormLoading.value = false
  }
}

async function deleteGuest(id) {
  if (!confirm('למחוק אורח זה?')) return
  deletingId.value = id
  try {
    await api.delete(`/guests/${id}`)
    guests.value = guests.value.filter(g => g.id !== id)
    await refreshStats()
  } catch {
    // silent
  } finally {
    deletingId.value = null
  }
}

async function refreshStats() {
  try {
    const res = await api.get('/guests')
    stats.value = res.data.stats
    guests.value = res.data.guests
  } catch {}
}

async function submitImport() {
  importResult.value = null
  if (!importText.value.trim()) return
  importLoading.value = true
  try {
    const lines = importText.value.trim().split('\n').filter(l => l.trim())
    const list = lines.map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        name: parts[0] || '',
        phone: parts[1] || '',
        side: parts[2] || 'חתן'
      }
    }).filter(g => g.name)

    const res = await api.post('/guests/bulk', { guests: list })
    importResult.value = { ok: true, msg: res.data.message }
    await fetchGuests()
    importText.value = ''
    setTimeout(() => { showImportModal.value = false }, 1500)
  } catch (e) {
    importResult.value = { ok: false, msg: e?.response?.data?.message || 'שגיאה בייבוא' }
  } finally {
    importLoading.value = false
  }
}

onMounted(fetchGuests)
</script>

<style scoped>
.guests-list { padding: var(--space-4) 0; }

/* Page Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1.2; }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.page-actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }

/* Stats Row */
.stats-row {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}
.stat-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition);
  min-width: 70px;
}
.stat-badge:hover { border-color: var(--color-primary); }
.stat-badge.active { background: var(--color-primary-light); border-color: var(--color-primary); }
.stat-badge.confirmed.active { background: var(--color-success-bg); border-color: var(--color-success); }
.stat-badge.maybe.active { background: var(--color-warning-bg); border-color: var(--color-warning); }
.stat-badge.declined.active { background: var(--color-error-bg); border-color: var(--color-error); }
.stat-badge.people-total { cursor: default; background: var(--color-bg-subtle); }
.sb-num { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); line-height: 1; }
.sb-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; }

/* Toolbar */
.toolbar { margin-bottom: var(--space-4); }
.toolbar-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  right: var(--space-3);
  font-size: 1rem;
  pointer-events: none;
}
.search-input {
  padding-right: var(--space-10) !important;
  padding-left: var(--space-8) !important;
}
.clear-search {
  position: absolute;
  left: var(--space-3);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  padding: 4px;
}
.clear-search:hover { color: var(--color-text); }

.filter-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.filter-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all var(--transition);
}
.filter-pill:hover { background: var(--color-bg-card); border-color: var(--color-border); }
.filter-pill.active { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }

.side-filters { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.side-pill {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all var(--transition);
}
.side-pill.active { background: var(--color-navy); color: #fff; }

/* Skeleton */
.skeleton-row-guest {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.skeleton-row-guest:last-child { border-bottom: none; }

/* Table */
.guests-table { overflow: hidden; }
.table-header {
  display: grid;
  grid-template-columns: 2fr 80px 120px 100px 70px 120px;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-subtle);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.guest-row {
  display: grid;
  grid-template-columns: 2fr 80px 120px 100px 70px 120px;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition);
}
.guest-row:last-child { border-bottom: none; }
.guest-row:hover { background: var(--color-bg-subtle); }
.guest-row.row-alt { background: var(--color-bg-subtle); }
.guest-row.row-alt:hover { background: var(--color-primary-bg); }

/* Guest identity */
.guest-identity { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.guest-avatar {
  color: var(--color-primary);
  font-weight: 800;
  flex-shrink: 0;
  font-size: var(--font-size-xs);
  border: 2px solid rgba(233,30,140,0.15);
}
.guest-info { min-width: 0; }
.guest-name { display: block; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.guest-phone { display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); direction: ltr; text-align: right; }
.text-light { color: var(--color-text-light); }
.text-sm { font-size: var(--font-size-xs); }

/* Badges */
.side-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}
.side-groom { background: #EFF6FF; color: #1D4ED8; }
.side-bride { background: var(--color-primary-light); color: var(--color-primary); }
.side-mutual { background: var(--color-bg-subtle); color: var(--color-text-muted); }

.rsvp-badge {
  display: inline-flex; align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}
.rsvp-confirmed { background: var(--color-success-bg); color: #15803D; }
.rsvp-declined  { background: var(--color-error-bg);   color: #DC2626; }
.rsvp-maybe     { background: var(--color-warning-bg); color: #B45309; }
.rsvp-pending   { background: var(--color-bg-subtle);  color: var(--color-text-muted); }

.table-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-navy);
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
  padding: 3px 8px;
}
.people-num { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); text-align: center; }

/* Actions */
.td-actions { display: flex; gap: 4px; justify-content: flex-end; }
.action-wa:hover { color: #25D366 !important; }
.action-del:hover { color: var(--color-error) !important; }

/* Bottom count */
.bottom-count {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding: var(--space-3);
}

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,31,54,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  width: 100%; max-width: 520px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-wide { max-width: 580px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  position: sticky; top: 0; background: var(--color-bg-card); z-index: 1;
}
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-body { padding: var(--space-6); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
  position: sticky; bottom: 0; background: var(--color-bg-card); z-index: 1;
}
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); }
.form-group { margin-bottom: var(--space-4); }
.form-group:last-child { margin-bottom: 0; }

/* Import */
.import-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); }
.import-example {
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
  padding: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  direction: rtl;
  margin-bottom: var(--space-3);
  white-space: pre-wrap;
  font-family: monospace;
}
.import-textarea { resize: vertical; min-height: 160px; font-family: monospace; direction: rtl; }
.import-result { margin-top: var(--space-3); padding: var(--space-3); border-radius: var(--radius); font-size: var(--font-size-sm); font-weight: 600; }
.result-ok { background: var(--color-success-bg); color: #15803D; }
.result-err { background: var(--color-error-bg); color: #DC2626; }

/* Empty State */
.empty-state { text-align: center; padding: var(--space-12) var(--space-8); }

@media (max-width: 768px) {
  .table-header { display: none; }
  .guest-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
    padding: var(--space-4);
    position: relative;
  }
  .td-side, .td-table, .td-people { display: none; }
  .td-rsvp { position: absolute; top: var(--space-4); left: var(--space-4); }
  .td-actions { justify-content: flex-start; }
  .form-row-2 { grid-template-columns: 1fr; }
  .form-row-3 { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 480px) {
  .stats-row { gap: var(--space-1); }
  .stat-badge { min-width: 56px; padding: var(--space-2); }
  .page-header { flex-direction: column; }
  .form-row-3 { grid-template-columns: 1fr; }
}
</style>
