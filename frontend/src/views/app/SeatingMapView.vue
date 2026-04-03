<template>
  <div class="seating-map fade-in" dir="rtl">

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div v-if="error && !loading" class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3 class="empty-title">שגיאה בטעינת הנתונים</h3>
      <p class="empty-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadSeating">נסה שוב</button>
    </div>

    <template v-else>
      <!-- ── Page Header ──────────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🪑 סידורי הושבה</h1>
          <p class="page-sub" v-if="!loading">
            {{ tables.length }} שולחנות · {{ assignedCount }} מוקצים · {{ unassigned.length }} לא מוקצים
          </p>
          <p class="page-sub" v-else>&nbsp;</p>
        </div>
        <div class="header-actions">
          <router-link to="/app/seating/settings" class="btn btn-outline btn-sm">⚙️ הגדרות אולם</router-link>
          <button class="btn btn-primary btn-sm" @click="openAddTable">➕ הוסף שולחן</button>
        </div>
      </div>

      <!-- ── Layout: sidebar + grid ────────────────────────────────────────── -->
      <div class="seating-layout">

        <!-- SIDEBAR: unassigned guests -->
        <aside class="guests-sidebar card">
          <div class="sidebar-header">
            <h3 class="sidebar-title">אורחים ללא שולחן</h3>
            <span class="badge-count" v-if="unassigned.length">{{ unassigned.length }}</span>
          </div>

          <div class="sidebar-search">
            <input
              v-model="guestSearch"
              class="form-input search-input"
              placeholder="🔍 חיפוש אורח..."
              @input="filterUnassigned"
            />
          </div>

          <div v-if="loading" class="guest-skeleton-list">
            <div v-for="i in 6" :key="i" class="skeleton" style="height:44px;border-radius:8px;"></div>
          </div>

          <div v-else-if="filteredUnassigned.length === 0" class="sidebar-empty">
            <p v-if="unassigned.length === 0" class="sidebar-empty-text">🎉 כל האורחים מוקצים לשולחן!</p>
            <p v-else class="sidebar-empty-text">לא נמצאו תוצאות</p>
          </div>

          <div v-else class="guest-list">
            <div
              v-for="guest in filteredUnassigned"
              :key="guest.id"
              class="guest-chip draggable-guest"
              :class="{ 'is-dragging': dragGuest?.id === guest.id }"
              draggable="true"
              @dragstart="onGuestDragStart($event, guest)"
              @dragend="onGuestDragEnd"
              :title="`גרור לשולחן להקצות`"
            >
              <span class="guest-avatar">{{ guest.name.charAt(0) }}</span>
              <span class="guest-chip-name">{{ guest.name }}</span>
              <span class="guest-chip-meta" v-if="guest.numPeople > 1">+{{ guest.numPeople - 1 }}</span>
            </div>
          </div>

          <div v-if="!loading && unassigned.length > 0" class="sidebar-hint">
            <span>💡 גרור אורח לשולחן להקצאה</span>
          </div>
        </aside>

        <!-- MAIN: tables grid -->
        <main class="tables-area">
          <div v-if="loading" class="tables-grid">
            <div v-for="i in 8" :key="i" class="skeleton" style="height:180px;border-radius:16px;"></div>
          </div>

          <div v-else-if="tables.length === 0" class="empty-tables">
            <div class="empty-icon">🪑</div>
            <h3 class="empty-title">אין שולחנות עדיין</h3>
            <p class="empty-text">הוסף שולחנות ידנית או השתמש בכלי ייצור שולחנות אוטומטי</p>
            <div class="empty-actions">
              <button class="btn btn-primary" @click="openAddTable">➕ הוסף שולחן</button>
              <router-link to="/app/seating/settings" class="btn btn-outline">⚙️ ייצר שולחנות אוטומטית</router-link>
            </div>
          </div>

          <div v-else class="tables-grid">
            <div
              v-for="(table, idx) in tables"
              :key="table.id"
              class="table-card"
              :class="{
                'drag-over': dragOverTable === table.id,
                'table-full': table.guests.length >= table.seats,
                'being-dragged': dragTable?.id === table.id
              }"
              draggable="true"
              @dragstart="onTableDragStart($event, table, idx)"
              @dragend="onTableDragEnd"
              @dragover.prevent="onTableDragOver(table.id, $event)"
              @dragleave="onTableDragLeave"
              @drop.prevent="onDrop($event, table)"
            >
              <!-- Table header -->
              <div class="table-head">
                <div class="table-info">
                  <div class="table-icon">🍽️</div>
                  <div>
                    <span class="table-name">{{ table.name }}</span>
                    <span class="table-capacity">{{ table.guests.length }}/{{ table.seats }} מקומות</span>
                  </div>
                </div>
                <div class="table-actions">
                  <button class="icon-btn" @click.stop="openEditTable(table)" title="ערוך שולחן">✏️</button>
                  <button class="icon-btn icon-btn-danger" @click.stop="deleteTable(table)" title="מחק שולחן">🗑️</button>
                </div>
              </div>

              <!-- Capacity bar -->
              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :class="{ 'capacity-full': table.guests.length >= table.seats }"
                  :style="{ width: (table.guests.length / Math.max(table.seats, 1) * 100) + '%' }"
                ></div>
              </div>

              <!-- Guest chips -->
              <div class="table-guests" v-if="table.guests.length > 0">
                <span
                  v-for="g in table.guests"
                  :key="g.id"
                  class="guest-assigned-chip"
                  :class="statusChipClass(g.rsvpStatus)"
                  :title="g.name"
                >
                  {{ g.name.length > 8 ? g.name.substring(0, 8) + '…' : g.name }}
                  <button class="chip-remove" @click.stop="unassignGuest(g, table)" title="הסר מהשולחן">×</button>
                </span>
              </div>

              <!-- Drop hint when dragging -->
              <div class="drop-hint" v-if="dragGuest && dragOverTable === table.id">
                <span>⬇ שחרר להקצאה</span>
              </div>
              <div class="drop-hint-idle" v-else-if="dragGuest && dragOverTable !== table.id && table.guests.length === 0">
                <span>גרור לכאן</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- ── Add/Edit Table Modal ────────────────────────────────────────────── -->
    <transition name="modal">
      <div v-if="showTableModal" class="modal-overlay" @click.self="closeTableModal">
        <div class="modal-box card" dir="rtl">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingTable ? 'ערוך שולחן' : 'הוסף שולחן חדש' }}</h3>
            <button class="modal-close" @click="closeTableModal">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">שם השולחן *</label>
              <input
                v-model="tableForm.name"
                class="form-input"
                placeholder="לדוגמה: שולחן 1 / שולחן המשפחה"
                @keyup.enter="saveTable"
                ref="tableNameInput"
              />
            </div>
            <div class="form-group">
              <label class="form-label">מספר מקומות</label>
              <input
                v-model.number="tableForm.seats"
                type="number"
                class="form-input"
                min="1"
                max="50"
                placeholder="8"
              />
            </div>
            <p v-if="tableFormError" class="form-error">{{ tableFormError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeTableModal">ביטול</button>
            <button class="btn btn-primary" :disabled="savingTable" @click="saveTable">
              <span v-if="savingTable">⏳ שומר...</span>
              <span v-else>{{ editingTable ? '💾 שמור' : '➕ הוסף' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Toast ─────────────────────────────────────────────────────────── -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import api from '@/composables/useApi'

// ── State ──────────────────────────────────────────────────────────────────────
const tables      = ref([])
const unassigned  = ref([])
const loading     = ref(true)
const error       = ref(null)
const toast       = ref(null)
const guestSearch = ref('')

// Drag state
const dragGuest     = ref(null)
const dragTable     = ref(null)
const dragOverTable = ref(null)

// Modal state
const showTableModal = ref(false)
const editingTable   = ref(null)
const savingTable    = ref(false)
const tableFormError = ref('')
const tableNameInput = ref(null)
const tableForm = reactive({ name: '', seats: 8 })

// ── Computed ───────────────────────────────────────────────────────────────────
const filteredUnassigned = computed(() => {
  if (!guestSearch.value) return unassigned.value
  const q = guestSearch.value.toLowerCase()
  return unassigned.value.filter(g => g.name.toLowerCase().includes(q) || (g.phone && g.phone.includes(q)))
})

const assignedCount = computed(() => tables.value.reduce((sum, t) => sum + t.guests.length, 0))

// ── Methods ────────────────────────────────────────────────────────────────────
async function loadSeating() {
  loading.value = true
  error.value   = null
  try {
    const { data } = await api.get('/api/seating/tables')
    tables.value     = data.tables
    unassigned.value = data.unassigned
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

// ── Drag: Guests ───────────────────────────────────────────────────────────────
function onGuestDragStart(evt, guest) {
  dragGuest.value = guest
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('type', 'guest')
  evt.dataTransfer.setData('guestId', String(guest.id))
}
function onGuestDragEnd() {
  dragGuest.value     = null
  dragOverTable.value = null
}

// ── Drag: Tables ───────────────────────────────────────────────────────────────
function onTableDragStart(evt, table, idx) {
  if (dragGuest.value) return // Don't allow table drag when dragging a guest
  dragTable.value = { ...table, idx }
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('type', 'table')
}
function onTableDragEnd() {
  dragTable.value     = null
  dragOverTable.value = null
}

// ── Drag: Target table ─────────────────────────────────────────────────────────
function onTableDragOver(tableId, evt) {
  dragOverTable.value = tableId
  evt.dataTransfer.dropEffect = 'move'
}
function onTableDragLeave() {
  dragOverTable.value = null
}

async function onDrop(evt, targetTable) {
  dragOverTable.value = null
  const type = evt.dataTransfer.getData('type')

  if (type === 'guest') {
    const guestId = parseInt(evt.dataTransfer.getData('guestId'))
    await assignGuestToTable(guestId, targetTable.id)
  } else if (type === 'table' && dragTable.value) {
    // Reorder: swap positions in local state
    const fromIdx = tables.value.findIndex(t => t.id === dragTable.value.id)
    const toIdx   = tables.value.findIndex(t => t.id === targetTable.id)
    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      const copy = [...tables.value]
      const [moved] = copy.splice(fromIdx, 1)
      copy.splice(toIdx, 0, moved)
      tables.value = copy
    }
    dragTable.value = null
  }
}

async function assignGuestToTable(guestId, tableId) {
  try {
    await api.put('/api/seating/assign', { guestId, tableId })
    // Optimistic update
    const guest = unassigned.value.find(g => g.id === guestId)
    if (guest) {
      unassigned.value = unassigned.value.filter(g => g.id !== guestId)
      const table = tables.value.find(t => t.id === tableId)
      if (table) table.guests.push(guest)
    }
    showToast(`${guest?.name} הוקצה לשולחן`, 'success')
  } catch (e) {
    showToast(e.response?.data?.error || 'שגיאה בהקצאה', 'error')
    loadSeating()
  }
}

async function unassignGuest(guest, table) {
  try {
    await api.put('/api/seating/assign', { guestId: guest.id, tableId: null })
    // Optimistic update
    table.guests = table.guests.filter(g => g.id !== guest.id)
    unassigned.value.push(guest)
    showToast(`${guest.name} הוסר מהשולחן`, 'success')
  } catch (e) {
    showToast(e.response?.data?.error || 'שגיאה בהסרה', 'error')
    loadSeating()
  }
}

// ── Add/Edit Table ─────────────────────────────────────────────────────────────
function openAddTable() {
  editingTable.value   = null
  tableForm.name       = ''
  tableForm.seats      = 8
  tableFormError.value = ''
  showTableModal.value = true
  nextTick(() => tableNameInput.value?.focus())
}

function openEditTable(table) {
  editingTable.value   = table
  tableForm.name       = table.name
  tableForm.seats      = table.seats
  tableFormError.value = ''
  showTableModal.value = true
  nextTick(() => tableNameInput.value?.focus())
}

function closeTableModal() {
  showTableModal.value = false
  editingTable.value   = null
}

async function saveTable() {
  tableFormError.value = ''
  if (!tableForm.name.trim()) {
    tableFormError.value = 'שם השולחן הוא שדה חובה'
    return
  }

  savingTable.value = true
  try {
    if (editingTable.value) {
      const { data } = await api.put(`/api/seating/tables/${editingTable.value.id}`, {
        name: tableForm.name,
        seats: tableForm.seats
      })
      const idx = tables.value.findIndex(t => t.id === data.id)
      if (idx !== -1) tables.value[idx] = { ...tables.value[idx], ...data }
      showToast('שולחן עודכן בהצלחה', 'success')
    } else {
      const { data } = await api.post('/api/seating/tables', {
        name: tableForm.name,
        seats: tableForm.seats
      })
      tables.value.push(data)
      showToast('שולחן נוסף בהצלחה', 'success')
    }
    closeTableModal()
  } catch (e) {
    tableFormError.value = e.response?.data?.error || 'שגיאה בשמירה'
  } finally {
    savingTable.value = false
  }
}

async function deleteTable(table) {
  if (!confirm(`למחוק את "${table.name}"? כל האורחים יוסרו מהשולחן.`)) return
  try {
    await api.delete(`/api/seating/tables/${table.id}`)
    const removed = tables.value.find(t => t.id === table.id)
    tables.value = tables.value.filter(t => t.id !== table.id)
    // Return guests to unassigned
    if (removed?.guests) {
      unassigned.value.push(...removed.guests)
    }
    showToast('שולחן נמחק', 'success')
  } catch (e) {
    showToast(e.response?.data?.error || 'שגיאה במחיקה', 'error')
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function filterUnassigned() {} // handled by computed

function statusChipClass(status) {
  return {
    'chip-confirmed': status === 'confirmed',
    'chip-declined':  status === 'declined',
    'chip-maybe':     status === 'maybe',
    'chip-pending':   status === 'pending'
  }
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

onMounted(loadSeating)
</script>

<style scoped>
.seating-map { padding: var(--space-8); max-width: var(--content-max); margin: 0 auto; direction: rtl; }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.page-title  { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub    { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Main layout */
.seating-layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-6); align-items: start; }

/* Sidebar */
.guests-sidebar { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: 84px; max-height: calc(100vh - 120px); overflow: hidden; }
.sidebar-header { display: flex; align-items: center; justify-content: space-between; }
.sidebar-title  { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.badge-count    { background: var(--color-primary); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }
.sidebar-search { flex-shrink: 0; }
.search-input   { width: 100%; }

.guest-skeleton-list { display: flex; flex-direction: column; gap: var(--space-2); }
.guest-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  overflow-y: auto;
  max-height: calc(100vh - 340px);
  padding-left: 2px;
}

.draggable-guest {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-card);
  cursor: grab;
  transition: all var(--transition-fast);
  user-select: none;
}
.draggable-guest:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.draggable-guest:active, .draggable-guest.is-dragging { opacity: 0.5; cursor: grabbing; }

.guest-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #c9177a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.guest-chip-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.guest-chip-meta { font-size: 11px; color: var(--color-text-muted); background: var(--color-bg-subtle); padding: 2px 6px; border-radius: var(--radius-full); }

.sidebar-empty { text-align: center; padding: var(--space-8) 0; }
.sidebar-empty-text { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.sidebar-hint { font-size: 11px; color: var(--color-text-muted); text-align: center; padding-top: var(--space-2); border-top: 1px solid var(--color-border); }

/* Tables area */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-5);
}

.table-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  padding: var(--space-4);
  transition: all var(--transition);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 160px;
}
.table-card:hover { box-shadow: var(--shadow); }
.table-card.drag-over { border-color: var(--color-primary); background: var(--color-primary-bg); box-shadow: 0 0 0 3px rgba(233,30,140,0.15); }
.table-card.table-full { border-color: var(--color-success); }
.table-card.being-dragged { opacity: 0.4; }

.table-head { display: flex; align-items: flex-start; justify-content: space-between; }
.table-info { display: flex; align-items: center; gap: var(--space-3); }
.table-icon { font-size: 24px; }
.table-name     { display: block; font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); line-height: 1.2; }
.table-capacity { display: block; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }

.table-actions { display: flex; gap: 4px; opacity: 0; transition: opacity var(--transition-fast); }
.table-card:hover .table-actions { opacity: 1; }
.icon-btn { width: 26px; height: 26px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 14px; transition: background var(--transition-fast); }
.icon-btn:hover { background: var(--color-bg-subtle); }
.icon-btn-danger:hover { background: var(--color-error-bg); }

/* Capacity bar */
.capacity-bar  { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.capacity-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.4s ease; }
.capacity-fill.capacity-full { background: var(--color-success); }

/* Guest chips on table */
.table-guests { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.guest-assigned-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  color: var(--color-navy);
  max-width: 130px;
  white-space: nowrap;
}
.chip-remove { font-size: 14px; line-height: 1; cursor: pointer; opacity: 0.5; padding: 0 2px; transition: opacity var(--transition-fast); border-radius: 50%; }
.chip-remove:hover { opacity: 1; background: rgba(0,0,0,0.1); }
.chip-confirmed { background: var(--color-success-bg); border-color: var(--color-success); color: #166534; }
.chip-declined  { background: var(--color-error-bg); border-color: var(--color-error); color: #991b1b; }
.chip-maybe     { background: var(--color-warning-bg); border-color: var(--color-warning); color: #92400e; }
.chip-pending   { background: var(--color-bg-subtle); }

.drop-hint      { text-align: center; padding: var(--space-4); color: var(--color-primary); font-size: var(--font-size-sm); font-weight: 700; border: 2px dashed var(--color-primary); border-radius: var(--radius); animation: pulse 1s ease infinite; }
.drop-hint-idle { text-align: center; padding: var(--space-4); color: var(--color-text-muted); font-size: var(--font-size-xs); }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

/* Empty tables */
.empty-tables { text-align: center; padding: var(--space-16) var(--space-8); grid-column: 1/-1; }
.empty-icon   { font-size: 56px; margin-bottom: var(--space-4); }
.empty-title  { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-3); }
.empty-text   { color: var(--color-text-muted); margin-bottom: var(--space-6); }
.empty-actions { display: flex; justify-content: center; gap: var(--space-3); flex-wrap: wrap; }

/* Empty state global */
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); z-index: 200; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal-box { width: 100%; max-width: 440px; border-radius: var(--radius-xl); overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); }
.modal-title  { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-close  { width: 32px; height: 32px; border-radius: 50%; font-size: 20px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); transition: background var(--transition-fast); }
.modal-close:hover { background: var(--color-border); }
.modal-body   { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-5); }
.modal-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: var(--space-3); }

.form-group   { display: flex; flex-direction: column; gap: 6px; }
.form-label   { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.form-error   { font-size: var(--font-size-sm); color: var(--color-error); }
.form-input   { width: 100%; height: 44px; padding: 0 14px; border-radius: var(--radius); border: 1.5px solid var(--color-border); background: var(--color-bg-subtle); font-size: var(--font-size-sm); font-family: var(--font); color: var(--color-text); transition: border-color var(--transition-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }

/* Toast */
.toast { position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; z-index: 1000; box-shadow: var(--shadow-lg); color: #fff; white-space: nowrap; }
.toast.success { background: var(--color-success); }
.toast.error   { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.95) translateY(-10px); }

/* Skeleton */
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e0e0ea 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius); }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 10px var(--space-5); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none; transition: all var(--transition); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-sm { padding: 6px var(--space-4); font-size: var(--font-size-xs); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

/* Card */
.card { background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); }

/* Fade-in */
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Responsive */
@media (max-width: 900px) {
  .seating-layout { grid-template-columns: 1fr; }
  .guests-sidebar  { position: static; max-height: none; }
  .guest-list { max-height: 200px; }
}
@media (max-width: 640px) {
  .seating-map { padding: var(--space-4); }
  .tables-grid { grid-template-columns: 1fr 1fr; }
  .header-actions { width: 100%; }
}
@media (max-width: 420px) {
  .tables-grid { grid-template-columns: 1fr; }
}
</style>
