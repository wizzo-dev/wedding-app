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

    <!-- Stats Badges -->
    <div v-if="!loading && stats" class="stats-row">
      <div
        v-for="tab in statTabs"
        :key="tab.key"
        class="stat-badge"
        :class="[tab.cls, { active: activeFilter === tab.filter }]"
        @click="setFilter(tab.filter)"
      >
        <span class="sb-num">{{ stats[tab.key] }}</span>
        <span class="sb-label">{{ tab.label }}</span>
      </div>
      <div class="stat-badge people-total">
        <span class="sb-num">{{ stats.totalPeople }}</span>
        <span class="sb-label">👥 נפשות</span>
      </div>
    </div>

    <!-- Search + Filter Toolbar -->
    <div class="toolbar card">
      <div class="card-body toolbar-body">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            class="input search-input"
            placeholder="חפש לפי שם, טלפון, קבוצה..."
          />
          <button v-if="search" class="clear-search" @click="search = ''">✕</button>
        </div>
        <div class="filter-row">
          <div class="filter-pills">
            <button
              v-for="tab in filterTabs"
              :key="tab.value"
              class="filter-pill"
              :class="{ active: activeFilter === tab.value }"
              @click="setFilter(tab.value)"
            >{{ tab.label }}</button>
          </div>
          <div class="side-pills">
            <button
              v-for="s in sideFilters"
              :key="s.value"
              class="side-pill"
              :class="{ active: activeSide === s.value }"
              @click="activeSide = s.value"
            >{{ s.label }}</button>
          </div>
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
              <div class="skeleton" style="height:12px;width:22%;"></div>
            </div>
            <div class="skeleton" style="height:24px;width:60px;border-radius:12px;"></div>
            <div class="skeleton" style="height:24px;width:60px;border-radius:12px;"></div>
            <div class="skeleton" style="height:24px;width:80px;border-radius:8px;"></div>
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

    <!-- Content -->
    <template v-else>

      <!-- Empty States -->
      <div v-if="filteredGuests.length === 0" class="empty-state card">
        <div class="card-body">
          <div class="empty-state-icon">🎊</div>
          <p class="empty-state-title">
            {{ (search || activeFilter !== 'all' || activeSide !== 'all') ? 'לא נמצאו אורחים' : 'עדיין אין אורחים' }}
          </p>
          <p class="empty-state-text" v-if="search">נסה לחפש במילים אחרות</p>
          <p class="empty-state-text" v-else-if="activeFilter !== 'all'">אין אורחים בסטטוס זה</p>
          <p class="empty-state-text" v-else>הוסף את האורחים הראשונים שלך לחתונה</p>
          <div style="display:flex;gap:var(--space-2);justify-content:center;flex-wrap:wrap;">
            <button v-if="search" class="btn btn-ghost" @click="search = ''">נקה חיפוש</button>
            <button v-if="!search && activeFilter === 'all' && activeSide === 'all'" class="btn btn-primary" @click="openAddModal">
              + הוסף אורח ראשון
            </button>
          </div>
        </div>
      </div>

      <!-- Guests Table -->
      <div v-else class="guests-table card">
        <div class="card-body" style="padding:0;">
          <!-- Header -->
          <div class="table-header">
            <span class="th-name">אורח</span>
            <span class="th-side">צד</span>
            <span class="th-rsvp">סטטוס</span>
            <span class="th-table">שולחן</span>
            <span class="th-people">נפשות</span>
            <span class="th-actions">פעולות</span>
          </div>

          <!-- Rows -->
          <div
            v-for="(guest, i) in filteredGuests"
            :key="guest.id"
            class="guest-row"
            :class="{ 'row-even': i % 2 === 0 }"
          >
            <!-- Identity -->
            <div class="guest-identity">
              <div
                class="avatar avatar-md guest-avatar"
                :style="{ background: avatarBg(guest.name), color: avatarColor(guest.name) }"
              >{{ initials(guest.name) }}</div>
              <div class="guest-info">
                <span class="guest-name">{{ guest.name }}</span>
                <a
                  v-if="guest.phone"
                  :href="`tel:${guest.phone}`"
                  class="guest-phone"
                  @click.stop
                >{{ guest.phone }}</a>
                <span v-else class="guest-phone no-phone">ללא טלפון</span>
              </div>
            </div>

            <!-- Side -->
            <div class="td-side">
              <span class="side-badge" :class="sideClass(guest.side)">{{ guest.side }}</span>
            </div>

            <!-- RSVP -->
            <div class="td-rsvp">
              <span class="rsvp-badge" :class="rsvpClass(guest.rsvpStatus)">
                {{ rsvpLabel(guest.rsvpStatus) }}
              </span>
            </div>

            <!-- Table -->
            <div class="td-table">
              <span v-if="guest.tableName" class="table-chip">🪑 {{ guest.tableName }}</span>
              <span v-else class="no-data">—</span>
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
                title="ערוך אורח"
              >✏️</button>
              <button
                class="btn btn-ghost btn-icon btn-sm action-del"
                @click="deleteGuest(guest.id)"
                :disabled="deletingId === guest.id"
                title="מחק אורח"
              >{{ deletingId === guest.id ? '⏳' : '🗑️' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer count -->
      <p v-if="filteredGuests.length > 0" class="result-count">
        מציג {{ filteredGuests.length }} מתוך {{ guests.length }} אורחים
        <template v-if="totalFilteredPeople > 0"> · {{ totalFilteredPeople }} נפשות</template>
      </p>

    </template>

    <!-- ─── Add / Edit Guest Modal ─────────────────────────────────────────── -->
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
                <input v-model="form.name" class="input" placeholder="ישראל ישראלי" />
              </div>
              <div class="form-group">
                <label class="label">טלפון</label>
                <input v-model="form.phone" class="input" placeholder="050-1234567" type="tel" />
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label class="label">אימייל</label>
                <input v-model="form.email" class="input" placeholder="guest@email.com" />
              </div>
              <div class="form-group">
                <label class="label">קבוצה / משפחה</label>
                <input v-model="form.groupName" class="input" placeholder="משפחת כהן" />
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="label">צד</label>
                <select v-model="form.side" class="input">
                  <option value="חתן">חתן</option>
                  <option value="כלה">כלה</option>
                  <option value="משותף">משותף</option>
                </select>
              </div>
              <div class="form-group">
                <label class="label">סטטוס הגעה</label>
                <select v-model="form.rsvpStatus" class="input">
                  <option value="pending">⏳ ממתין</option>
                  <option value="confirmed">✅ מגיע</option>
                  <option value="maybe">🤔 לא בטוח</option>
                  <option value="declined">❌ לא מגיע</option>
                </select>
              </div>
              <div class="form-group">
                <label class="label">נפשות</label>
                <input v-model.number="form.numPeople" type="number" class="input" min="1" max="20" />
              </div>
            </div>
            <div class="form-group">
              <label class="label">הערות</label>
              <input v-model="form.notes" class="input" placeholder="הערות נוספות..." />
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="closeGuestModal">ביטול</button>
            <button class="btn btn-primary" @click="submitForm" :disabled="formLoading">
              {{ formLoading ? 'שומר...' : (editingGuest ? 'שמור שינויים' : 'הוסף אורח') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Bulk Import Modal ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showImportModal" class="modal-backdrop" @click.self="showImportModal = false">
        <div class="modal modal-wide pop-in" dir="rtl">
          <div class="modal-header">
            <h3>📥 ייבוא מרובה</h3>
            <button class="btn btn-ghost btn-icon" @click="showImportModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p class="import-hint">הדבק רשימת אורחים — שם, טלפון, צד — כל אורח בשורה נפרדת, מופרדים בפסיק:</p>
            <pre class="import-example">ישראל ישראלי, 050-1234567, חתן
שרה לוי, 052-9876543, כלה
דוד כהן, 053-1112233, משותף</pre>
            <textarea
              v-model="importText"
              class="input import-textarea"
              placeholder="ישראל ישראלי, 050-1234567, חתן&#10;שרה לוי, 052-9876543, כלה"
              rows="8"
            ></textarea>
            <p v-if="importMsg" class="import-msg" :class="importOk ? 'msg-ok' : 'msg-err'">{{ importMsg }}</p>
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

// ── State ─────────────────────────────────────────────────────────────────────
const loading   = ref(true)
const error     = ref(null)
const guests    = ref([])
const stats     = ref(null)

const search      = ref('')
const activeFilter = ref('all')
const activeSide   = ref('all')

const showGuestModal = ref(false)
const editingGuest   = ref(null)
const form           = ref(emptyForm())
const formLoading    = ref(false)
const formError      = ref(null)
const deletingId     = ref(null)

const showImportModal = ref(false)
const importText      = ref('')
const importLoading   = ref(false)
const importMsg       = ref('')
const importOk        = ref(false)

// ── Config ────────────────────────────────────────────────────────────────────
const filterTabs = [
  { value: 'all',       label: 'הכל' },
  { value: 'confirmed', label: '✅ מגיעים' },
  { value: 'maybe',     label: '🤔 לא בטוחים' },
  { value: 'declined',  label: '❌ לא מגיעים' },
  { value: 'pending',   label: '⏳ ממתינים' }
]

const sideFilters = [
  { value: 'all',    label: 'כולם' },
  { value: 'חתן',   label: 'צד חתן' },
  { value: 'כלה',   label: 'צד כלה' },
  { value: 'משותף', label: 'משותף' }
]

const statTabs = [
  { key: 'total',     label: 'הכל',        cls: '',          filter: 'all' },
  { key: 'confirmed', label: 'מגיעים',     cls: 'confirmed', filter: 'confirmed' },
  { key: 'maybe',     label: 'לא בטוחים',  cls: 'maybe',     filter: 'maybe' },
  { key: 'declined',  label: 'לא מגיעים',  cls: 'declined',  filter: 'declined' },
  { key: 'pending',   label: 'ממתינים',    cls: 'pending',   filter: 'pending' }
]

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredGuests = computed(() => {
  let list = guests.value

  if (search.value.trim()) {
    const q = search.value.toLowerCase()
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

const totalFilteredPeople = computed(() =>
  filteredGuests.value.reduce((s, g) => s + g.numPeople, 0)
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function emptyForm() {
  return { name: '', phone: '', email: '', groupName: '', side: 'חתן', rsvpStatus: 'pending', numPeople: 1, notes: '' }
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0)
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

const AVATAR_PALETTES = [
  { bg: '#FDE8F4', color: '#E91E8C' },
  { bg: '#DBEAFE', color: '#1D4ED8' },
  { bg: '#DCFCE7', color: '#15803D' },
  { bg: '#FEF3C7', color: '#B45309' },
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#FFE4E6', color: '#BE123C' }
]

function palette(name) {
  const idx = name ? Math.abs(name.charCodeAt(0)) % AVATAR_PALETTES.length : 0
  return AVATAR_PALETTES[idx]
}
function avatarBg(name)    { return palette(name).bg }
function avatarColor(name) { return palette(name).color }

function sideClass(side) {
  if (side === 'כלה') return 'side-bride'
  if (side === 'משותף') return 'side-mutual'
  return 'side-groom'
}

function rsvpClass(status) {
  return { confirmed: 'rsvp-confirmed', declined: 'rsvp-declined', maybe: 'rsvp-maybe', pending: 'rsvp-pending' }[status] || 'rsvp-pending'
}

function rsvpLabel(status) {
  return { confirmed: '✅ מגיע', declined: '❌ לא מגיע', maybe: '🤔 לא בטוח', pending: '⏳ ממתין' }[status] || status
}

function setFilter(val) { activeFilter.value = val }

function openWhatsApp(guest) {
  const raw = (guest.phone || '').replace(/\D/g, '')
  const intl = raw.startsWith('0') ? '972' + raw.slice(1) : raw
  window.open(`https://wa.me/${intl}`, '_blank')
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchGuests() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/guests')
    guests.value = res.data.guests
    stats.value  = res.data.stats
  } catch (e) {
    error.value = e?.response?.data?.message || 'שגיאה בטעינת האורחים'
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingGuest.value = null
  form.value = emptyForm()
  formError.value = null
  showGuestModal.value = true
}

function openEditModal(guest) {
  editingGuest.value = guest
  form.value = {
    name:       guest.name,
    phone:      guest.phone || '',
    email:      guest.email || '',
    groupName:  guest.groupName || '',
    side:       guest.side || 'חתן',
    rsvpStatus: guest.rsvpStatus || 'pending',
    numPeople:  guest.numPeople || 1,
    notes:      guest.notes || ''
  }
  formError.value = null
  showGuestModal.value = true
}

function closeGuestModal() {
  showGuestModal.value = false
  editingGuest.value = null
}

async function submitForm() {
  formError.value = null
  if (!form.value.name.trim()) {
    formError.value = 'נא להזין שם אורח'
    return
  }
  formLoading.value = true
  try {
    if (editingGuest.value) {
      const res = await api.put(`/guests/${editingGuest.value.id}`, form.value)
      const idx = guests.value.findIndex(g => g.id === editingGuest.value.id)
      if (idx !== -1) guests.value[idx] = res.data
    } else {
      const res = await api.post('/guests', form.value)
      guests.value.unshift(res.data)
    }
    // Refresh stats
    const statsRes = await api.get('/guests')
    stats.value = statsRes.data.stats
    closeGuestModal()
  } catch (e) {
    formError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    formLoading.value = false
  }
}

async function deleteGuest(id) {
  if (!confirm('למחוק אורח זה?')) return
  deletingId.value = id
  try {
    await api.delete(`/guests/${id}`)
    guests.value = guests.value.filter(g => g.id !== id)
    const statsRes = await api.get('/guests')
    stats.value = statsRes.data.stats
  } catch {
    // silent
  } finally {
    deletingId.value = null
  }
}

async function submitImport() {
  importMsg.value = ''
  if (!importText.value.trim()) return
  importLoading.value = true
  try {
    const lines = importText.value.trim().split('\n').filter(l => l.trim())
    const list  = lines.map(line => {
      const [name, phone, side] = line.split(',').map(p => p.trim())
      return { name: name || '', phone: phone || '', side: side || 'חתן' }
    }).filter(g => g.name)

    const res = await api.post('/guests/bulk', { guests: list })
    importMsg.value = res.data.message
    importOk.value  = true
    importText.value = ''
    await fetchGuests()
    setTimeout(() => { showImportModal.value = false; importMsg.value = '' }, 1800)
  } catch (e) {
    importMsg.value = e?.response?.data?.message || 'שגיאה בייבוא'
    importOk.value  = false
  } finally {
    importLoading.value = false
  }
}

onMounted(fetchGuests)
</script>

<style scoped>
.guests-list { padding: var(--space-4) 0; }

/* Header */
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
.page-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* Stats Badges */
.stats-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-5);
}
.stat-badge {
  display: flex; flex-direction: column; align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition);
  min-width: 68px;
}
.stat-badge:not(.people-total):hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.stat-badge.active { background: var(--color-primary-light); border-color: var(--color-primary); }
.stat-badge.confirmed.active { background: var(--color-success-bg); border-color: var(--color-success); }
.stat-badge.maybe.active { background: var(--color-warning-bg); border-color: var(--color-warning); }
.stat-badge.declined.active { background: var(--color-error-bg); border-color: var(--color-error); }
.stat-badge.people-total { cursor: default; background: var(--color-bg-subtle); border-style: dashed; }
.sb-num { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); line-height: 1; }
.sb-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; }

/* Toolbar */
.toolbar { margin-bottom: var(--space-4); }
.toolbar-body { display: flex; flex-direction: column; gap: var(--space-3); }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; right: var(--space-3); font-size: 1rem; pointer-events: none; }
.search-input { padding-right: calc(var(--space-3) + 1.5rem) !important; }
.clear-search {
  position: absolute; left: var(--space-3);
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; font-size: 0.85rem; line-height: 1; padding: 4px;
}
.clear-search:hover { color: var(--color-text); }

.filter-row { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
.filter-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.filter-pill {
  padding: 5px 14px; border-radius: var(--radius-full);
  font-size: var(--font-size-xs); font-weight: 600;
  color: var(--color-text-muted); background: var(--color-bg-subtle);
  border: 1.5px solid transparent; cursor: pointer;
  transition: all var(--transition);
}
.filter-pill:hover { background: var(--color-bg-card); border-color: var(--color-border); }
.filter-pill.active { background: var(--color-primary-light); color: var(--color-primary); border-color: var(--color-primary); }

.side-pills { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.side-pill {
  padding: 4px 12px; border-radius: var(--radius-full);
  font-size: var(--font-size-xs); font-weight: 600;
  color: var(--color-text-muted); background: transparent;
  border: 1.5px solid var(--color-border); cursor: pointer;
  transition: all var(--transition);
}
.side-pill.active { background: var(--color-navy); color: #fff; border-color: var(--color-navy); }

/* Skeleton */
.skeleton-row-guest {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.skeleton-row-guest:last-child { border-bottom: none; }

/* Table */
.guests-table { overflow: hidden; }
.table-header {
  display: grid;
  grid-template-columns: 2.5fr 90px 130px 100px 70px 120px;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-bg-subtle);
  border-bottom: 1.5px solid var(--color-border);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.guest-row {
  display: grid;
  grid-template-columns: 2.5fr 90px 130px 100px 70px 120px;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition);
}
.guest-row:last-child { border-bottom: none; }
.guest-row:hover { background: var(--color-primary-bg) !important; }
.guest-row.row-even { background: var(--color-bg-subtle); }

/* Identity */
.guest-identity { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.guest-avatar { flex-shrink: 0; font-size: var(--font-size-xs); font-weight: 800; }
.guest-info { min-width: 0; }
.guest-name {
  display: block; font-size: var(--font-size-sm); font-weight: 700;
  color: var(--color-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.guest-phone {
  display: block; font-size: var(--font-size-xs); color: var(--color-text-muted);
  direction: ltr; text-align: right; text-decoration: none;
}
.guest-phone:hover { color: var(--color-primary); }
.no-phone { color: var(--color-text-light); }

/* Badges */
.side-badge {
  display: inline-flex; align-items: center; padding: 3px 10px;
  border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;
}
.side-groom  { background: #EFF6FF; color: #1D4ED8; }
.side-bride  { background: var(--color-primary-light); color: var(--color-primary); }
.side-mutual { background: var(--color-bg-subtle); color: var(--color-text-muted); }

.rsvp-badge {
  display: inline-flex; align-items: center; padding: 3px 10px;
  border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700;
  white-space: nowrap;
}
.rsvp-confirmed { background: var(--color-success-bg); color: #15803D; }
.rsvp-declined  { background: var(--color-error-bg);   color: #DC2626; }
.rsvp-maybe     { background: var(--color-warning-bg); color: #B45309; }
.rsvp-pending   { background: var(--color-bg-subtle);  color: var(--color-text-muted); }

.table-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: var(--font-size-xs); font-weight: 600;
  color: var(--color-navy); background: var(--color-bg-subtle);
  border-radius: var(--radius); padding: 3px 8px;
}
.no-data { color: var(--color-text-light); font-size: var(--font-size-xs); }
.people-num { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); text-align: center; }

/* Actions */
.td-actions { display: flex; gap: 2px; justify-content: flex-end; }
.action-wa:hover  { color: #25D366 !important; }
.action-del:hover { color: var(--color-error) !important; }

/* Result count */
.result-count {
  text-align: center; font-size: var(--font-size-xs);
  color: var(--color-text-muted); padding: var(--space-3);
}

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,31,54,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4); backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-card); border-radius: var(--radius-2xl);
  width: 100%; max-width: 520px; box-shadow: var(--shadow-xl);
  max-height: 90vh; overflow-y: auto;
}
.modal-wide { max-width: 560px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border);
  position: sticky; top: 0; background: var(--color-bg-card); z-index: 1;
}
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-body { padding: var(--space-6); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: var(--space-2);
  padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border);
  position: sticky; bottom: 0; background: var(--color-bg-card); z-index: 1;
}
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); }
.form-group { margin-bottom: var(--space-4); }
.form-group:last-child { margin-bottom: 0; }

/* Import */
.import-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); }
.import-example {
  background: var(--color-bg-subtle); border-radius: var(--radius);
  padding: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-muted);
  direction: rtl; margin-bottom: var(--space-3); white-space: pre-wrap;
  font-family: monospace; border: 1px solid var(--color-border);
}
.import-textarea { resize: vertical; min-height: 160px; font-family: monospace; direction: rtl; }
.import-msg { margin-top: var(--space-3); padding: var(--space-3); border-radius: var(--radius); font-size: var(--font-size-sm); font-weight: 600; }
.msg-ok  { background: var(--color-success-bg); color: #15803D; }
.msg-err { background: var(--color-error-bg); color: #DC2626; }

/* Empty state */
.empty-state { text-align: center; padding: var(--space-12) var(--space-8); }

/* Responsive */
@media (max-width: 768px) {
  .table-header { display: none; }
  .guest-row {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: var(--space-2);
    padding: var(--space-4);
  }
  .guest-identity { grid-column: 1; grid-row: 1; }
  .td-rsvp { grid-column: 2; grid-row: 1; }
  .td-side { grid-column: 1; grid-row: 2; }
  .td-actions { grid-column: 2; grid-row: 2; justify-content: flex-end; }
  .td-table, .td-people { display: none; }
  .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .page-header { flex-direction: column; }
  .stats-row { gap: var(--space-1); }
  .stat-badge { min-width: 56px; padding: var(--space-2); }
}
</style>
