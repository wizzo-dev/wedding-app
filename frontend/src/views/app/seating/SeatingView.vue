<template>
  <div class="seating-view" dir="rtl">
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🪑</span>
          סידורי הושבה
        </h1>
        <p class="page-subtitle">הגדר שולחנות ושבץ אורחים</p>
      </div>
      <div class="header-actions">
        <router-link to="/app/seating/settings" class="btn btn-outline btn-sm">⚙️ הגדרות אולם</router-link>
        <button @click="showGenerateModal = true" class="btn btn-outline btn-sm">✨ צור שולחנות</button>
        <button @click="showAddTable = true" class="btn btn-primary btn-sm">+ שולחן חדש</button>
      </div>
    </header>

    <!-- Stats -->
    <div v-if="stats" class="stats-bar">
      <div class="stat-pill">
        <span class="pill-num">{{ stats.totalTables }}</span>
        <span class="pill-lbl">שולחנות</span>
      </div>
      <div class="stat-pill">
        <span class="pill-num">{{ stats.totalSeats }}</span>
        <span class="pill-lbl">מקומות</span>
      </div>
      <div class="stat-pill success">
        <span class="pill-num">{{ stats.assignedGuests }}</span>
        <span class="pill-lbl">משובצים</span>
      </div>
      <div class="stat-pill warning">
        <span class="pill-num">{{ stats.unassignedGuests }}</span>
        <span class="pill-lbl">לא משובצים</span>
      </div>
      <div class="stat-pill">
        <span class="pill-num">{{ stats.occupancyRate }}%</span>
        <span class="pill-lbl">תפוסה</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען שולחנות...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadData" class="btn btn-outline">נסה שוב</button>
    </div>

    <div v-else class="seating-layout">
      <!-- Unassigned panel -->
      <aside class="unassigned-panel">
        <div class="panel-header">
          <h3>לא משובצים <span class="badge">{{ unassigned.length }}</span></h3>
          <input v-model="guestSearch" placeholder="חיפוש אורח..." class="search-input" />
        </div>
        <div class="unassigned-list">
          <div
            v-if="!filteredUnassigned.length"
            class="no-unassigned"
          >
            <span v-if="guestSearch">אין תוצאות</span>
            <span v-else>🎉 כל האורחים משובצים!</span>
          </div>
          <div
            v-for="guest in filteredUnassigned"
            :key="guest.id"
            class="guest-chip unassigned"
            :class="`rsvp-${guest.rsvpStatus}`"
            @click="selectGuestForAssign(guest)"
            :title="`${guest.name} — לחץ לשיבוץ`"
          >
            <span class="guest-name">{{ guest.name }}</span>
            <span class="guest-people" v-if="guest.numPeople > 1">×{{ guest.numPeople }}</span>
            <span class="rsvp-dot" :class="guest.rsvpStatus"></span>
          </div>
        </div>
      </aside>

      <!-- Tables Grid -->
      <main class="tables-grid">
        <!-- Empty tables state -->
        <div v-if="!tables.length" class="empty-tables">
          <div class="empty-icon">🍽️</div>
          <h3>אין שולחנות עדיין</h3>
          <p>הוסף שולחן ידנית או השתמש ב"צור שולחנות" לייצור מהיר</p>
          <div class="empty-actions">
            <button @click="showGenerateModal = true" class="btn btn-primary">✨ צור שולחנות</button>
            <button @click="showAddTable = true" class="btn btn-outline">+ שולחן חדש</button>
          </div>
        </div>

        <div
          v-for="table in tables"
          :key="table.id"
          class="table-card"
          :class="{ 'selected-target': selectedGuest && selectedTable?.id !== table.id, 'full': table.assignedCount >= table.seats }"
          @click="handleTableClick(table)"
        >
          <div class="table-icon">
            <svg viewBox="0 0 60 60" width="56" height="56">
              <circle cx="30" cy="30" r="26" fill="#f3e8ff" stroke="var(--color-primary)" stroke-width="2"/>
              <circle cx="30" cy="30" r="14" fill="white" stroke="var(--color-primary)" stroke-width="1.5"/>
              <text x="30" y="35" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-primary)">{{ table.seats }}</text>
            </svg>
          </div>
          <div class="table-info">
            <div class="table-top">
              <span class="table-name">{{ table.name }}</span>
              <div class="table-actions">
                <button @click.stop="editTable(table)" class="icon-btn" title="עריכה">✏️</button>
                <button @click.stop="confirmDeleteTable(table)" class="icon-btn danger" title="מחיקה">🗑️</button>
              </div>
            </div>
            <div class="seat-bar">
              <div
                class="seat-fill"
                :style="{ width: `${Math.min(table.assignedCount / table.seats * 100, 100)}%` }"
                :class="{ full: table.assignedCount >= table.seats }"
              ></div>
            </div>
            <p class="seat-count">
              {{ table.assignedCount }} / {{ table.seats }} מקומות
              <span v-if="table.assignedCount >= table.seats" class="full-badge">מלא</span>
            </p>
          </div>

          <!-- Guests in table -->
          <div class="table-guests">
            <div
              v-for="guest in table.guests"
              :key="guest.id"
              class="guest-chip assigned"
              :class="`rsvp-${guest.rsvpStatus}`"
            >
              <span class="guest-name">{{ guest.name }}</span>
              <button
                @click.stop="unassignGuest(guest.id)"
                class="unassign-btn"
                title="הסר מהשולחן"
              >×</button>
            </div>
            <div v-if="!table.guests.length" class="empty-table-hint">
              <span v-if="selectedGuest">👆 לחץ לשיבוץ</span>
              <span v-else>לא שובצו אורחים</span>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Assign hint bar -->
    <transition name="slide-up">
      <div v-if="selectedGuest" class="assign-bar">
        <span>🎯 <strong>{{ selectedGuest.name }}</strong> — בחר שולחן לשיבוץ</span>
        <button @click="selectedGuest = null" class="btn btn-sm btn-outline">ביטול</button>
      </div>
    </transition>

    <!-- Add Table Modal -->
    <div v-if="showAddTable || editingTable" class="modal-overlay" @click.self="closeTableModal">
      <div class="modal">
        <h3 class="modal-title">{{ editingTable ? 'עריכת שולחן' : 'שולחן חדש' }}</h3>
        <form @submit.prevent="saveTable" class="modal-form">
          <label>
            שם שולחן
            <input v-model="tableForm.name" required placeholder="לדוגמה: שולחן 1" class="form-input" />
          </label>
          <label>
            מספר מקומות
            <input v-model.number="tableForm.seats" type="number" min="1" max="50" required class="form-input" />
          </label>
          <label>
            סוג שולחן
            <select v-model="tableForm.type" class="form-input">
              <option value="round">עגול</option>
              <option value="rectangle">מלבני</option>
              <option value="head">שולחן ראשי</option>
            </select>
          </label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'שומר...' : (editingTable ? 'שמור' : 'הוסף') }}
            </button>
            <button type="button" @click="closeTableModal" class="btn btn-outline">ביטול</button>
          </div>
          <p v-if="formError" class="form-error">{{ formError }}</p>
        </form>
      </div>
    </div>

    <!-- Generate Tables Modal -->
    <div v-if="showGenerateModal" class="modal-overlay" @click.self="showGenerateModal = false">
      <div class="modal">
        <h3 class="modal-title">✨ צור שולחנות אוטומטית</h3>
        <p class="modal-note">⚠️ פעולה זו תמחק את כל השולחנות הקיימים ותיצור חדשים</p>
        <form @submit.prevent="generateTables" class="modal-form">
          <label>
            מספר שולחנות
            <input v-model.number="generateForm.count" type="number" min="1" max="100" required class="form-input" />
          </label>
          <label>
            מקומות לשולחן
            <input v-model.number="generateForm.seatsPerTable" type="number" min="1" max="30" required class="form-input" />
          </label>
          <label>
            שמות שולחנות
            <select v-model="generateForm.namingStyle" class="form-input">
              <option value="numbers">מספרים (שולחן 1, 2, 3...)</option>
              <option value="hebrew">אותיות עבריות (שולחן א, ב, ג...)</option>
              <option value="custom">תחילית מותאמת</option>
            </select>
          </label>
          <label v-if="generateForm.namingStyle === 'custom'">
            תחילית
            <input v-model="generateForm.prefix" class="form-input" placeholder="לדוגמה: מספר" />
          </label>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="generating">
              {{ generating ? 'יוצר...' : 'צור שולחנות' }}
            </button>
            <button type="button" @click="showGenerateModal = false" class="btn btn-outline">ביטול</button>
          </div>
          <p v-if="generateError" class="form-error">{{ generateError }}</p>
        </form>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="deletingTable" class="modal-overlay" @click.self="deletingTable = null">
      <div class="modal modal-sm">
        <h3 class="modal-title">מחיקת שולחן</h3>
        <p>האם למחוק את <strong>{{ deletingTable.name }}</strong>?<br>
        <span v-if="deletingTable.assignedCount > 0" class="warning-text">⚠️ {{ deletingTable.assignedCount }} אורחים ישוחררו</span></p>
        <div class="modal-actions">
          <button @click="deleteTable" class="btn btn-danger" :disabled="saving">{{ saving ? 'מוחק...' : 'מחק' }}</button>
          <button @click="deletingTable = null" class="btn btn-outline">ביטול</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// State
const tables = ref([])
const unassigned = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref(null)
const guestSearch = ref('')
const selectedGuest = ref(null)

// Modals
const showAddTable = ref(false)
const editingTable = ref(null)
const deletingTable = ref(null)
const showGenerateModal = ref(false)
const selectedTable = ref(null)

// Forms
const tableForm = ref({ name: '', seats: 8, type: 'round' })
const generateForm = ref({ count: 10, seatsPerTable: 8, namingStyle: 'numbers', prefix: 'שולחן' })
const saving = ref(false)
const generating = ref(false)
const formError = ref(null)
const generateError = ref(null)

const filteredUnassigned = computed(() => {
  if (!guestSearch.value) return unassigned.value
  const q = guestSearch.value.toLowerCase()
  return unassigned.value.filter(g => g.name.toLowerCase().includes(q) || (g.phone || '').includes(q))
})

async function apiCall(path, options = {}) {
  const res = await fetch(`/api/seating${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.accessToken}`,
      ...options.headers
    }
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `שגיאה ${res.status}`)
  }
  return res.json()
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [seating, statsData] = await Promise.all([
      apiCall('/tables'),
      apiCall('/stats').catch(() => null)
    ])
    tables.value = seating.tables
    unassigned.value = seating.unassigned
    stats.value = statsData
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function selectGuestForAssign(guest) {
  selectedGuest.value = guest
}

async function handleTableClick(table) {
  if (!selectedGuest.value) return
  if (table.assignedCount >= table.seats) {
    alert(`שולחן ${table.name} מלא (${table.seats} מקומות)`)
    return
  }
  try {
    await apiCall('/assign', {
      method: 'PUT',
      body: JSON.stringify({ guestId: selectedGuest.value.id, tableId: table.id })
    })
    selectedGuest.value = null
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

async function unassignGuest(guestId) {
  try {
    await apiCall('/assign', {
      method: 'PUT',
      body: JSON.stringify({ guestId, tableId: null })
    })
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

function editTable(table) {
  editingTable.value = table
  tableForm.value = { name: table.name, seats: table.seats, type: table.type }
  showAddTable.value = false
}

function confirmDeleteTable(table) {
  deletingTable.value = table
}

function closeTableModal() {
  showAddTable.value = false
  editingTable.value = null
  tableForm.value = { name: '', seats: 8, type: 'round' }
  formError.value = null
}

async function saveTable() {
  formError.value = null
  saving.value = true
  try {
    if (editingTable.value) {
      await apiCall(`/tables/${editingTable.value.id}`, {
        method: 'PUT',
        body: JSON.stringify(tableForm.value)
      })
    } else {
      await apiCall('/tables', {
        method: 'POST',
        body: JSON.stringify(tableForm.value)
      })
    }
    closeTableModal()
    await loadData()
  } catch (e) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

async function deleteTable() {
  saving.value = true
  try {
    await apiCall(`/tables/${deletingTable.value.id}`, { method: 'DELETE' })
    deletingTable.value = null
    await loadData()
  } catch (e) {
    alert(e.message)
  } finally {
    saving.value = false
  }
}

async function generateTables() {
  generateError.value = null
  generating.value = true
  try {
    await apiCall('/generate-tables', {
      method: 'POST',
      body: JSON.stringify(generateForm.value)
    })
    showGenerateModal.value = false
    await loadData()
  } catch (e) {
    generateError.value = e.message
  } finally {
    generating.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.seating-view {
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-6);
  overflow: hidden;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  gap: var(--space-4);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  margin: 0 0 2px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }

/* Stats */
.stats-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);
  border-radius: 100px;
  padding: var(--space-1) var(--space-3);
  box-shadow: var(--shadow-sm);
}
.pill-num { font-weight: 800; color: var(--color-navy); font-size: var(--font-size-base); }
.stat-pill.success .pill-num { color: #10b981; }
.stat-pill.warning .pill-num { color: #f59e0b; }
.pill-lbl { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Layout */
.seating-layout {
  display: flex;
  gap: var(--space-4);
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Unassigned Panel */
.unassigned-panel {
  width: 220px;
  min-width: 180px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.panel-header h3 {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-navy);
  margin: 0 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.badge {
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 100px;
}
.search-input {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--font-size-xs);
  box-sizing: border-box;
}
.unassigned-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.no-unassigned {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: var(--space-4);
}

/* Guest Chips */
.guest-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  gap: var(--space-1);
  position: relative;
}
.guest-chip.unassigned {
  background: #f9fafb;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.15s;
}
.guest-chip.unassigned:hover {
  background: #fce7f3;
  border-color: var(--color-primary);
  transform: translateX(-2px);
}
.guest-chip.assigned {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.guest-name { font-weight: 600; color: var(--color-navy); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.guest-people { font-size: 10px; color: var(--color-text-muted); white-space: nowrap; }
.rsvp-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rsvp-dot.confirmed { background: #10b981; }
.rsvp-dot.declined { background: #ef4444; }
.rsvp-dot.pending { background: #f59e0b; }
.rsvp-dot.maybe { background: #6b7280; }
.unassign-btn {
  background: none; border: none; cursor: pointer;
  color: #ef4444; font-size: 12px; padding: 0 2px;
  opacity: 0.5; transition: opacity 0.15s;
}
.unassign-btn:hover { opacity: 1; }

/* Tables Grid */
.tables-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
  align-content: start;
}
.empty-tables {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
}
.empty-icon { font-size: 3rem; margin-bottom: var(--space-3); }
.empty-tables h3 { color: var(--color-navy); font-weight: 700; margin-bottom: var(--space-2); }
.empty-actions { display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-4); }

/* Table Card */
.table-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: default;
}
.table-card.selected-target {
  border-color: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 0 3px #fce7f3;
}
.table-card.selected-target:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.table-card.full {
  opacity: 0.7;
}

.table-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}
.table-name { font-weight: 700; color: var(--color-navy); font-size: var(--font-size-sm); }
.table-actions { display: flex; gap: 4px; }
.icon-btn {
  background: none; border: none; cursor: pointer;
  font-size: 14px; padding: 2px 4px;
  border-radius: var(--radius-sm);
  opacity: 0.6; transition: all 0.15s;
}
.icon-btn:hover { opacity: 1; background: #f3f4f6; }
.icon-btn.danger:hover { background: #fee2e2; }

.table-icon { display: flex; justify-content: center; margin-bottom: var(--space-2); }

.seat-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 4px;
}
.seat-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 100px;
  transition: width 0.3s ease;
}
.seat-fill.full { background: #ef4444; }
.seat-count {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}
.full-badge {
  background: #fee2e2;
  color: #ef4444;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 100px;
}

.table-guests {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 28px;
}
.empty-table-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-style: italic;
  padding: var(--space-1);
}

/* Assign Bar */
.assign-bar {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: var(--shadow-xl);
  z-index: 50;
  font-size: var(--font-size-sm);
}
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }

/* States */
.loading-state, .error-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex: 1; gap: var(--space-3);
  color: var(--color-text-muted);
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 2rem; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: var(--space-4);
}
.modal {
  background: white;
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-2xl);
}
.modal-sm { max-width: 320px; }
.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}
.modal-note {
  font-size: var(--font-size-xs);
  color: #f59e0b;
  background: #fef3c7;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}
.modal-form { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-form label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: var(--font-size-sm);
  color: var(--color-navy);
  direction: rtl;
}
.form-input:focus { outline: none; border-color: var(--color-primary); }
.modal-actions { display: flex; gap: var(--space-3); }
.form-error { color: #ef4444; font-size: var(--font-size-xs); }
.warning-text { color: #f59e0b; font-size: var(--font-size-sm); }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-family: inherit; font-size: var(--font-size-sm); font-weight: 600;
  cursor: pointer; border: none; text-decoration: none; transition: all 0.2s;
}
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: #fce7f3; }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* Responsive */
@media (max-width: 768px) {
  .seating-view { padding: var(--space-4); overflow: auto; height: auto; }
  .seating-layout { flex-direction: column; overflow: visible; }
  .unassigned-panel { width: 100%; max-height: 200px; }
  .tables-grid { overflow: visible; }
}
</style>
