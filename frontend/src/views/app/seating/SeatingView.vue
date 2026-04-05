<template>
  <div class="seating-view" dir="rtl">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title"><span class="title-icon">🪑</span> סידורי הושבה</h1>
        <p class="page-subtitle">גרור שולחן להזזה, גרור אורח לשולחן או לחץ על אורח ואז על שולחן לשיבוץ</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="exportXlsx">📥 ייצא XLSX</button>
        <router-link to="/app/seating/settings" class="btn btn-outline btn-sm">⚙️ הגדרות</router-link>
        <button @click="showGenerateModal = true" class="btn btn-outline btn-sm">✨ צור שולחנות</button>
        <button @click="openAddElement()" class="btn btn-primary btn-sm">+ הוסף אלמנט</button>
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

    <!-- Loading / Error -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <span>⚠️ {{ error }}</span>
      <button @click="loadData" class="btn btn-outline btn-sm">נסה שוב</button>
    </div>

    <div v-else class="seating-layout">
      <!-- LEFT: Unassigned guests panel -->
      <aside class="guests-panel">
        <div class="panel-header">
          <h3>ללא שולחן <span class="badge-count">{{ unassigned.length }}</span></h3>
          <input v-model="search" placeholder="חפש אורח..." class="search-input" />
        </div>
        <div class="guest-list">
          <div v-if="!filteredUnassigned.length" class="no-guests">
            <span v-if="search">אין תוצאות</span>
            <span v-else>🎉 כל האורחים משובצים!</span>
          </div>
          <div
            v-for="guest in filteredUnassigned"
            :key="guest.id"
            class="guest-chip"
            :class="{ selected: dragGuest?.id === guest.id }"
            draggable="true"
            @dragstart="onDragStart(guest)"
            @dragend="onDragEnd"
            @click="clickGuest(guest)"
          >
            <span class="guest-name">{{ guest.name }}</span>
            <span class="guest-meta">{{ guest.numPeople > 1 ? `×${guest.numPeople}` : '' }}</span>
            <span class="rsvp-dot" :class="guest.rsvpStatus"></span>
          </div>
        </div>
      </aside>

      <!-- CENTER: Konva canvas -->
      <div
        class="canvas-area"
        ref="canvasContainer"
        style="position:relative"
        @dragover.prevent
        @drop.prevent="onCanvasDrop"
      >
        <div v-if="!tables.length" class="empty-canvas">
          <div class="empty-icon">🍽️</div>
          <h3>אין שולחנות עדיין</h3>
          <p>הוסף שולחן ידנית או השתמש ב"צור שולחנות"</p>
          <div class="empty-actions">
            <button @click="showGenerateModal = true" class="btn btn-primary">✨ צור שולחנות</button>
            <button @click="openAddElement()" class="btn btn-outline">+ הוסף אלמנט</button>
          </div>
        </div>

        <!-- Zoom controls -->
        <div v-if="tables.length" class="zoom-controls">
          <button class="zoom-btn" @click="zoomOut" title="הקטן (−)">−</button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button class="zoom-btn" @click="zoomIn" title="הגדל (+)">+</button>
          <button class="zoom-btn zoom-fit" @click="fitToScreen" title="התאם למסך">⛶</button>
        </div>

        <template v-else>
        <div class="zoom-wrapper" :style="zoomWrapperStyle">
          <v-stage
            :config="stageConfig"
            ref="stageRef"
            @click="onStageClick"
          >
            <v-layer>
              <template v-for="(table, idx) in tables" :key="table.id">
                <!-- Table shadow -->
                <v-rect :config="{
                  x: tableX(table, idx),
                  y: tableY(table, idx),
                  width: tableDims(table).w + 8,
                  height: tableDims(table).h + 8,
                  offsetX: (tableDims(table).w + 8) / 2,
                  offsetY: (tableDims(table).h + 8) / 2,
                  cornerRadius: tableDims(table).cr + 4,
                  fill: 'rgba(0,0,0,0.06)',
                  listening: false
                }" />
                <!-- Table body -->
                <v-rect :config="{
                  x: tableX(table, idx),
                  y: tableY(table, idx),
                  width: tableDims(table).w,
                  height: tableDims(table).h,
                  offsetX: tableDims(table).w / 2,
                  offsetY: tableDims(table).h / 2,
                  cornerRadius: tableDims(table).cr,
                  fill: tableFill(table),
                  stroke: selectedTable?.id === table.id ? '#E91E8C' : (dragOverTable?.id === table.id ? '#E91E8C' : '#d1d5db'),
                  strokeWidth: selectedTable?.id === table.id ? 3 : (dragOverTable?.id === table.id ? 3 : 1.5),
                  draggable: true,
                  id: String(table.id)
                }"
                @dragstart="() => onTableDragStart(table)"
                @dragend="(e) => onTableDragEnd(table, e)"
                @click="(e) => { e.cancelBubble = true; onTableClick(table) }"
                />
                <!-- Table label name -->
                <v-text :config="{
                  x: tableX(table, idx) - TABLE_R,
                  y: tableY(table, idx) - 12,
                  width: TABLE_R * 2,
                  text: table.name,
                  fontSize: 12,
                  fontFamily: 'Heebo, sans-serif',
                  fontStyle: 'bold',
                  fill: '#1A1F36',
                  align: 'center',
                  listening: false
                }" />
                <!-- Guest count (numPeople-aware) -->
                <v-text :config="{
                  x: tableX(table, idx) - TABLE_R,
                  y: tableY(table, idx) + 2,
                  width: TABLE_R * 2,
                  text: `${tableGuestCount(table)}/${table.seats}`,
                  fontSize: 11,
                  fontFamily: 'Heebo, sans-serif',
                  fill: tableGuestCount(table) >= table.seats ? '#ef4444' : '#6b7280',
                  align: 'center',
                  listening: false
                }" />
                <!-- Guest names preview -->
                <v-text v-if="table.guests?.length" :config="{
                  x: tableX(table, idx) - TABLE_R,
                  y: tableY(table, idx) + 16,
                  width: TABLE_R * 2,
                  text: tableGuestNames(table),
                  fontSize: 9,
                  fontFamily: 'Heebo, sans-serif',
                  fill: '#9ca3af',
                  align: 'center',
                  listening: false,
                  ellipsis: true,
                  wrap: 'none'
                }" />
              </template>

              <!-- Venue Elements (stage, bar, head table, etc.) -->
              <template v-for="(el, eIdx) in venueElements" :key="'ve-'+eIdx">
                <v-rect :config="{
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height,
                  fill: el.color,
                  stroke: '#9ca3af',
                  strokeWidth: 1.5,
                  cornerRadius: 8,
                  draggable: true,
                  opacity: 0.85,
                  id: 've-'+eIdx
                }"
                @dragend="(e) => onVenueElementDragEnd(eIdx, e)"
                @dblclick="() => removeVenueElement(eIdx)"
                />
                <v-text :config="{
                  x: el.x,
                  y: el.y + el.height / 2 - 8,
                  width: el.width,
                  text: el.icon + ' ' + el.label,
                  fontSize: 13,
                  fontFamily: 'Heebo, sans-serif',
                  fontStyle: 'bold',
                  fill: '#1A1F36',
                  align: 'center',
                  listening: false
                }" />
              </template>
            </v-layer>
          </v-stage>

          <!-- HTML drop-zone overlays positioned on top of each Konva circle -->
          <div
            v-for="(table, idx) in tables"
            :key="'drop-'+table.id"
            class="table-drop-overlay"
            :class="{ 'drop-hover': dragOverTable?.id === table.id }"
            :style="tableDropStyle(table, idx)"
            @dragenter.prevent="dragOverTable = table"
            @dragover.prevent="dragOverTable = table"
            @dragleave.self="handleOverlayLeave($event, table)"
            @drop.prevent="onOverlayDrop(table)"
            @click="onTableClick(table)"
          ></div>
        </div>
        </template>
      </div>

      <!-- RIGHT: Selected table detail -->
      <aside class="table-detail-panel" :class="{ visible: selectedTable }">
        <template v-if="selectedTable">
          <div class="detail-header">
            <h3>{{ selectedTable.name }}</h3>
            <div class="detail-meta">
              <span class="seat-count" :class="{ full: tableGuestCount(selectedTable) >= selectedTable.seats }">
                {{ tableGuestCount(selectedTable) }}/{{ selectedTable.seats }} מקומות
              </span>
              <div class="detail-actions">
                <button @click.stop="editTable(selectedTable)" class="icon-btn" title="עריכה">✏️</button>
                <button @click.stop="confirmDeleteTable(selectedTable)" class="icon-btn danger" title="מחיקה">🗑️</button>
              </div>
            </div>
          </div>

          <div class="seated-guests">
            <div v-if="!selectedTable.guests.length" class="no-seated">
              <p>לא שובצו אורחים</p>
            </div>
            <div
              v-for="guest in selectedTable.guests"
              :key="guest.id"
              class="seated-guest"
              :class="`rsvp-${guest.rsvpStatus}`"
              @click="clickGuest(guest)"
              style="cursor:pointer"
            >
              <span class="guest-name">{{ guest.name }}</span>
              <button class="unassign-btn" @click.stop="unassignGuest(guest.id)" title="הסר">×</button>
            </div>
          </div>

          <!-- Drop zone -->
          <div
            class="drop-zone"
            @dragover.prevent="dropZoneActive = true"
            @dragleave="dropZoneActive = false"
            @drop.prevent="onDropToTable(selectedTable)"
            :class="{ active: dropZoneActive }"
          >
            <span v-if="dragGuest">שחרר כאן לשיבוץ ב{{ selectedTable.name }}</span>
            <span v-else>גרור אורח לכאן</span>
          </div>
        </template>
        <div v-else class="detail-placeholder">
          <p>בחר שולחן לצפייה בפרטים</p>
        </div>
      </aside>
    </div>

    <!-- Assign bar (click-to-assign mode) -->
    <transition name="slide-up">
      <div v-if="clickAssignGuest && !dragGuest" class="assign-bar">
        <span>🎯 <strong>{{ clickAssignGuest.name }}</strong> — לחץ על שולחן לשיבוץ</span>
        <button @click="clickAssignGuest = null" class="btn btn-sm btn-outline">ביטול</button>
      </div>
    </transition>

    <!-- Undo drag bar -->
    <transition name="slide-up">
      <div v-if="lastDraggedTable && lastDragPosition" class="assign-bar undo-bar">
        <span>↩️ שולחן <strong>{{ lastDraggedTable.name }}</strong> הוזז</span>
        <button @click="undoTableDrag" class="btn btn-sm btn-outline">בטל הזזה</button>
        <button @click="lastDraggedTable = null; lastDragPosition = null" class="btn btn-sm btn-outline">סגור</button>
      </div>
    </transition>

    <!-- Add/Edit Element Modal -->
    <div v-if="showAddElement || editingTable" class="modal-overlay" @click.self="closeTableModal">
      <div class="modal">
        <h3 class="modal-title">{{ editingTable ? 'עריכת שולחן' : 'הוספת אלמנט' }}</h3>
        <form @submit.prevent="saveElement" class="modal-form">
          <!-- Element type picker (only when adding, not editing) -->
          <div v-if="!editingTable" class="element-type-picker">
            <label class="picker-label">סוג אלמנט</label>
            <div class="element-grid">
              <button
                type="button"
                class="element-tile"
                :class="{ active: selectedElementType === 'table' }"
                @click="selectedElementType = 'table'"
              >
                <span class="tile-icon">🍽️</span>
                <span class="tile-label">שולחן</span>
              </button>
              <button
                v-for="el in VENUE_ELEMENT_TYPES"
                :key="el.type"
                type="button"
                class="element-tile"
                :class="{ active: selectedElementType === el.type }"
                @click="selectedElementType = el.type"
              >
                <span class="tile-icon">{{ el.icon }}</span>
                <span class="tile-label">{{ el.label }}</span>
              </button>
            </div>
          </div>

          <!-- Table-specific fields -->
          <template v-if="editingTable || selectedElementType === 'table'">
            <label>שם שולחן
              <input v-model="tableForm.name" required placeholder="לדוגמה: שולחן 1" class="form-input" />
            </label>
            <label>מספר מקומות
              <input v-model.number="tableForm.seats" type="number" min="1" max="50" required class="form-input" />
            </label>
            <label>צורת שולחן
              <select v-model="tableForm.type" class="form-input">
                <option value="round">עגול</option>
                <option value="square">ריבוע</option>
                <option value="rectangle">מלבני</option>
                <option value="head">שולחן אבירים</option>
              </select>
            </label>
          </template>

          <div class="modal-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving || !selectedElementType">
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
        <p class="modal-note">⚠️ פעולה זו תמחק את כל השולחנות הקיימים</p>
        <form @submit.prevent="generateTables" class="modal-form">
          <label>מספר שולחנות
            <input v-model.number="generateForm.count" type="number" min="1" max="100" required class="form-input" />
          </label>
          <label>מקומות לשולחן
            <input v-model.number="generateForm.seatsPerTable" type="number" min="1" max="30" required class="form-input" />
          </label>
          <label>שמות שולחנות
            <select v-model="generateForm.namingStyle" class="form-input">
              <option value="numbers">מספרים (שולחן 1, 2, 3...)</option>
              <option value="hebrew">אותיות עבריות (שולחן א, ב, ג...)</option>
              <option value="custom">תחילית מותאמת</option>
            </select>
          </label>
          <label v-if="generateForm.namingStyle === 'custom'">בחר תחילית לשולחנות
            <select v-model="generateForm.prefix" class="form-input">
              <option value="שולחן">שולחן (שולחן 1, שולחן 2...)</option>
              <option value="VIP">VIP (VIP 1, VIP 2...)</option>
              <option value="מספר">מספר (מספר 1, מספר 2...)</option>
              <option value="שולחן VIP">שולחן VIP (שולחן VIP 1...)</option>
              <option value="שולחן משפחה">שולחן משפחה (שולחן משפחה 1...)</option>
              <option value="שולחן חברים">שולחן חברים (שולחן חברים 1...)</option>
              <option value="שולחן עבודה">שולחן עבודה (שולחן עבודה 1...)</option>
            </select>
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
        <p>האם למחוק את <strong>{{ deletingTable.name }}</strong>?
          <span v-if="deletingTable.guests.length > 0" class="warning-text">
            <br>⚠️ {{ deletingTable.guests.length }} אורחים ישוחררו
          </span>
        </p>
        <div class="modal-actions" style="margin-top: 1rem">
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

// Constants
const TABLE_R = 55

// Venue element types
const VENUE_ELEMENT_TYPES = [
  { type: 'stage', icon: '🎤', label: 'במה', width: 300, height: 80, color: '#E8D5F5' },
  { type: 'bar', icon: '🍸', label: 'בר', width: 180, height: 60, color: '#D5E8F5' },
  { type: 'head_table', icon: '👑', label: 'שולחן הנשיא', width: 260, height: 70, color: '#FFF0D5' },
  { type: 'dj', icon: '🎵', label: 'DJ', width: 120, height: 60, color: '#D5F5E8' },
  { type: 'dance_floor', icon: '💃', label: 'רחבת ריקודים', width: 250, height: 200, color: '#F5E8D5' },
  { type: 'entrance', icon: '🚪', label: 'כניסה', width: 120, height: 50, color: '#E0E0E0' },
  { type: 'photo', icon: '📸', label: 'עמדת צילום', width: 100, height: 80, color: '#F5D5E8' },
  { type: 'gifts_table', icon: '🎁', label: 'שולחן מתנות', width: 160, height: 60, color: '#D5F5D5' },
]

const selectedElementType = ref('table')

// State
const tables = ref([])
const venueElements = ref([])
const unassigned = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref(null)
const search = ref('')
const dragGuest = ref(null)         // guest being HTML-dragged
const clickAssignGuest = ref(null)  // guest selected via click
const selectedTable = ref(null)
const dragOverTable = ref(null)
const dropZoneActive = ref(false)
const stageRef = ref(null)
const canvasContainer = ref(null)

// Zoom
const zoom = ref(1)
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2

function zoomIn() {
  zoom.value = Math.min(MAX_ZOOM, Math.round((zoom.value + 0.1) * 100) / 100)
}
function zoomOut() {
  zoom.value = Math.max(MIN_ZOOM, Math.round((zoom.value - 0.1) * 100) / 100)
}
function fitToScreen() {
  const container = canvasContainer.value
  if (!container) return
  const cfg = stageConfig.value
  // Account for padding inside container
  const availW = container.clientWidth - 20
  const availH = container.clientHeight - 20
  if (cfg.width <= 0 || cfg.height <= 0) return
  const scale = Math.min(availW / cfg.width, availH / cfg.height, 1)
  zoom.value = Math.max(MIN_ZOOM, Math.round(scale * 100) / 100)
}

// Table positions (local override while dragging)
const tablePositions = ref({}) // { tableId: {x, y} }

// Modals
const showAddElement = ref(false)
const editingTable = ref(null)
const deletingTable = ref(null)
const showGenerateModal = ref(false)

// Forms
const tableForm = ref({ name: '', seats: 8, type: 'round' })
const generateForm = ref({ count: 10, seatsPerTable: 8, namingStyle: 'numbers', prefix: 'שולחן' })
const saving = ref(false)
const generating = ref(false)
const formError = ref(null)
const generateError = ref(null)

// Stage config — sized dynamically to fit all tables + venue elements
const stageConfig = computed(() => {
  const allItems = [...tables.value, ...venueElements.value]
  const maxX = allItems.reduce((mx, item) => Math.max(mx, (item.x || 0) + 200), 0)
  const maxY = allItems.reduce((my, item) => Math.max(my, (item.y || 0) + 200), 0)
  return {
    width: Math.max(1400, maxX + 100),
    height: Math.max(700, maxY + 100, Math.ceil(tables.value.length / 5) * 200 + 200)
  }
})

// Scaled wrapper: sized to match scaled content so the container scrolls correctly
const zoomWrapperStyle = computed(() => {
  const cfg = stageConfig.value
  return {
    width: cfg.width + 'px',
    height: cfg.height + 'px',
    transform: `scale(${zoom.value})`,
    transformOrigin: 'top right',
    marginBottom: (cfg.height * (zoom.value - 1)) + 'px',
    marginLeft: (cfg.width * (zoom.value - 1)) + 'px',
    position: 'relative'
  }
})

// Grid-based position fallback (no overlap)
function tableGridPos(idx) {
  const cols = 6
  const colWidth = 210
  const rowHeight = 200
  const startX = 120
  const startY = 120
  return {
    x: startX + (idx % cols) * colWidth,
    y: startY + Math.floor(idx / cols) * rowHeight
  }
}

// Table position helpers — prefer explicit drag (local override), then grid fallback
function tableX(table, idx) {
  const local = tablePositions.value[table.id]
  if (local !== undefined) return local.x
  return tableGridPos(idx ?? 0).x
}
function tableY(table, idx) {
  const local = tablePositions.value[table.id]
  if (local !== undefined) return local.y
  return tableGridPos(idx ?? 0).y
}

// Count total number of people (not just guest records) at a table
function tableGuestCount(table) {
  return table.guests?.reduce((sum, g) => sum + (g.numPeople || 1), 0) || 0
}

function tableGuestNames(table) {
  const names = (table.guests || []).map(g => g.name)
  if (names.length <= 3) return names.join(', ')
  return names.slice(0, 2).join(', ') + ` +${names.length - 2}`
}

function tableDims(table) {
  const t = table?.type || 'round'
  if (t === 'rectangle') return { w: TABLE_R * 2.4, h: TABLE_R * 1.2, cr: 10 }
  if (t === 'square')    return { w: TABLE_R * 1.7, h: TABLE_R * 1.7, cr: 10 }
  if (t === 'head')      return { w: TABLE_R * 2.8, h: TABLE_R * 1.1, cr: 10 }
  return { w: TABLE_R * 2, h: TABLE_R * 2, cr: TABLE_R } // round
}

function tableFill(table) {
  if (dragOverTable.value?.id === table.id) return '#fde8f4'
  if (tableGuestCount(table) >= table.seats) return '#fee2e2'
  if (table.guests.length > 0) return '#f0fdf4'
  return '#ffffff'
}

const filteredUnassigned = computed(() => {
  if (!search.value) return unassigned.value
  const q = search.value.toLowerCase()
  return unassigned.value.filter(g => g.name.toLowerCase().includes(q) || (g.phone || '').includes(q))
})

// API helper
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
    // Sync positions — only override with DB value if it's a real (non-default) position
    seating.tables.forEach((t, idx) => {
      if (!tablePositions.value[t.id]) {
        // x=100,y=100 is the default for manually added tables — use grid instead
        if (t.x !== 100 || t.y !== 100) {
          tablePositions.value[t.id] = { x: t.x, y: t.y }
        }
        // else: leave undefined → tableX/tableY will use idx-based grid
      }
    })
    // Update selected table reference
    if (selectedTable.value) {
      selectedTable.value = tables.value.find(t => t.id === selectedTable.value.id) || null
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// ── Guest drag handling ──────────────────────────────────────────────────────
let _dragLeaveTimer = null

function onDragStart(guest) {
  dragGuest.value = guest
  clickAssignGuest.value = null
}
function onDragEnd() {
  clearTimeout(_dragLeaveTimer)
  setTimeout(() => {
    dragGuest.value = null
    dropZoneActive.value = false
    dragOverTable.value = null
  }, 200)
}

// Prevents flickering when cursor briefly leaves an overlay between dragover events
function handleOverlayLeave(evt, table) {
  clearTimeout(_dragLeaveTimer)
  _dragLeaveTimer = setTimeout(() => {
    if (dragOverTable.value?.id === table.id) {
      dragOverTable.value = null
    }
  }, 80)
}

// Click-to-select a guest (no-drag mode)
function selectGuest(guest) {
  if (dragGuest.value) return
  clickAssignGuest.value = clickAssignGuest.value?.id === guest.id ? null : guest
}

// Canvas drag over — highlight which table is under cursor
function onCanvasDragOver(e) {
  if (!dragGuest.value) return
  const rect = canvasContainer.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  dragOverTable.value = tables.value.find((t, idx) => {
    const { w, h } = tableDims(t)
    const dx = Math.abs(mx - tableX(t, idx))
    const dy = Math.abs(my - tableY(t, idx))
    return dx <= w / 2 && dy <= h / 2
  }) || null
}

// Drop on canvas area
async function onCanvasDrop(e) {
  if (!dragGuest.value) return
  const target = dragOverTable.value
  dragOverTable.value = null
  if (target) {
    await assignGuestToTable(dragGuest.value, target)
  }
  dragGuest.value = null
}

// Drop on the detail-panel drop zone
async function onDropToTable(table) {
  dropZoneActive.value = false
  if (!dragGuest.value) return
  await assignGuestToTable(dragGuest.value, table)
  dragGuest.value = null
}

// ── Table Konva click ────────────────────────────────────────────────────────
async function onTableClick(table) {
  if (clickAssignGuest.value) {
    // Assign the selected guest to this table
    await assignGuestToTable(clickAssignGuest.value, table)
    clickAssignGuest.value = null
  } else if (dragGuest.value) {
    await assignGuestToTable(dragGuest.value, table)
    dragGuest.value = null
  } else {
    // Select table for detail panel
    selectedTable.value = selectedTable.value?.id === table.id ? null : table
  }
}

function onStageClick(e) {
  // Click on empty canvas: deselect table
  if (e.target === e.target.getStage()) {
    selectedTable.value = null
  }
}

// ── Table Konva drag ─────────────────────────────────────────────────────────
const lastDragPosition = ref(null)
const lastDraggedTable = ref(null)

function onTableDragStart(table) {
  const idx = tables.value.indexOf(table)
  lastDragPosition.value = { x: tableX(table, idx), y: tableY(table, idx) }
  lastDraggedTable.value = table
}

function isColliding(tableId, x, y) {
  const minDist = TABLE_R * 2 + 10 // minimum distance between table centers
  for (let i = 0; i < tables.value.length; i++) {
    const t = tables.value[i]
    if (t.id === tableId) continue
    const tx = tableX(t, i)
    const ty = tableY(t, i)
    const dx = x - tx
    const dy = y - ty
    if (Math.sqrt(dx * dx + dy * dy) < minDist) return true
  }
  return false
}

async function onTableDragEnd(table, evt) {
  const node = evt.target
  let newX = node.x()
  let newY = node.y()

  // Check collision — if colliding, snap back to previous position
  if (isColliding(table.id, newX, newY)) {
    const idx = tables.value.indexOf(table)
    const prevX = tableX(table, idx)
    const prevY = tableY(table, idx)
    node.x(prevX)
    node.y(prevY)
    stageRef.value?.getNode()?.batchDraw?.()
    return
  }

  tablePositions.value[table.id] = { x: newX, y: newY }
  // Persist position
  apiCall(`/tables/${table.id}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ x: newX, y: newY })
  }).catch(() => {})
}

function undoTableDrag() {
  if (!lastDraggedTable.value || !lastDragPosition.value) return
  const table = lastDraggedTable.value
  const pos = lastDragPosition.value
  tablePositions.value[table.id] = { x: pos.x, y: pos.y }
  apiCall(`/tables/${table.id}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ x: pos.x, y: pos.y })
  }).catch(() => {})
  // Update Konva node
  const stage = stageRef.value?.getNode()
  if (stage) {
    const node = stage.findOne('#' + String(table.id))
    if (node) {
      node.x(pos.x)
      node.y(pos.y)
    }
    stage.batchDraw()
  }
  lastDraggedTable.value = null
  lastDragPosition.value = null
}

// ── Assignment ───────────────────────────────────────────────────────────────
async function assignGuestToTable(guest, table) {
  const currentCount = tableGuestCount(table)
  const guestPeople = guest.numPeople || 1
  if (currentCount + guestPeople > table.seats) {
    alert(`השולחן מלא! קיבולת: ${table.seats}, יושבים: ${currentCount}, האורח: ${guestPeople} אנשים`)
    dragGuest.value = null
    return
  }
  try {
    await apiCall('/assign', {
      method: 'PUT',
      body: JSON.stringify({ guestId: guest.id, tableId: table.id })
    })
    await loadData()
    if (selectedTable.value) {
      selectedTable.value = tables.value.find(t => t.id === selectedTable.value.id) || null
    }
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

// ── Open Add Element (with auto-numbering for tables) ───────────────────────
function openAddElement() {
  const nextNum = tables.value.length + 1
  tableForm.value = { name: `שולחן ${nextNum}`, seats: 8, type: 'round' }
  selectedElementType.value = 'table'
  editingTable.value = null
  formError.value = null
  showAddElement.value = true
}

// ── HTML Overlay Drop Zone helpers ───────────────────────────────────────────
function tableDropStyle(table, idx) {
  const x = tableX(table, idx)
  const y = tableY(table, idx)
  const { w, h, cr } = tableDims(table)
  return {
    position: 'absolute',
    left: (x - w / 2) + 'px',
    top: (y - h / 2) + 'px',
    width: w + 'px',
    height: h + 'px',
    borderRadius: cr + 'px',
    cursor: 'pointer',
    zIndex: 10,
    background: 'transparent'
  }
}
function onOverlayDrop(table) {
  dragOverTable.value = null
  if (!dragGuest.value) return
  const guest = dragGuest.value
  dragGuest.value = null
  assignGuestToTable(guest, table)
}

// ── Bug 5: Click guest → highlight its table ──────────────────────────────────
function clickGuest(guest) {
  const table = tables.value.find(t =>
    t.guests?.some(g => g.id === guest.id)
  )
  if (table) {
    selectedTable.value = table
  } else {
    // Unassigned guest → enter click-assign mode
    selectGuest(guest)
  }
}

// ── Table CRUD ───────────────────────────────────────────────────────────────
function editTable(table) {
  editingTable.value = table
  tableForm.value = { name: table.name, seats: table.seats, type: table.type }
  selectedElementType.value = 'table'
  showAddElement.value = false
}

function confirmDeleteTable(table) {
  deletingTable.value = table
}

function closeTableModal() {
  showAddElement.value = false
  editingTable.value = null
  tableForm.value = { name: '', seats: 8, type: 'round' }
  selectedElementType.value = 'table'
  formError.value = null
}

async function saveElement() {
  formError.value = null
  // Editing an existing table, or adding a table
  if (editingTable.value || selectedElementType.value === 'table') {
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
    return
  }

  // Adding a venue element
  const elType = VENUE_ELEMENT_TYPES.find(e => e.type === selectedElementType.value)
  if (!elType) {
    formError.value = 'בחר סוג אלמנט'
    return
  }
  addVenueElement(elType)
  closeTableModal()
}

async function deleteTable() {
  saving.value = true
  try {
    await apiCall(`/tables/${deletingTable.value.id}`, { method: 'DELETE' })
    if (selectedTable.value?.id === deletingTable.value.id) selectedTable.value = null
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
    tablePositions.value = {}
    selectedTable.value = null
    showGenerateModal.value = false
    await loadData()
  } catch (e) {
    generateError.value = e.message
  } finally {
    generating.value = false
  }
}

// ── Export ───────────────────────────────────────────────────────────────────
async function exportXlsx() {
  const res = await fetch('/api/seating/export', {
    headers: { Authorization: `Bearer ${auth.accessToken}` }
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'seating.xlsx'; a.click()
  URL.revokeObjectURL(url)
}

// ── Venue Elements ──────────────────────────────────────────────────────────
function addVenueElement(elType) {
  venueElements.value.push({
    type: elType.type,
    icon: elType.icon,
    label: elType.label,
    width: elType.width,
    height: elType.height,
    color: elType.color,
    x: 50 + Math.random() * 200,
    y: 50 + Math.random() * 100
  })
  saveVenueElements()
}

function onVenueElementDragEnd(idx, evt) {
  const node = evt.target
  venueElements.value[idx].x = node.x()
  venueElements.value[idx].y = node.y()
  saveVenueElements()
}

function removeVenueElement(idx) {
  if (confirm(`להסיר את ${venueElements.value[idx]?.label}?`)) {
    venueElements.value.splice(idx, 1)
    saveVenueElements()
  }
}

function saveVenueElements() {
  try {
    localStorage.setItem(`venue_elements_${auth.user?.id || 0}`, JSON.stringify(venueElements.value))
  } catch {}
}

function loadVenueElements() {
  try {
    const stored = localStorage.getItem(`venue_elements_${auth.user?.id || 0}`)
    if (stored) venueElements.value = JSON.parse(stored)
  } catch {}
}

onMounted(() => {
  loadData()
  loadVenueElements()
})
</script>

<style scoped>
.seating-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  padding: var(--space-4) var(--space-6);
  overflow: hidden;
}

/* Header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  gap: var(--space-3);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  margin: 0 0 2px;
}
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; }

/* Element type picker */
.element-type-picker { margin-bottom: var(--space-3); }
.picker-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-navy);
  margin-bottom: 8px;
}
.element-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.element-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px solid var(--color-border);
  background: #fff;
  border-radius: var(--radius-lg, 12px);
  cursor: pointer;
  font-family: var(--font);
  transition: all 0.15s;
}
.element-tile:hover { border-color: var(--color-primary); }
.element-tile.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg, #FFF0F5);
}
.tile-icon { font-size: 1.4rem; }
.tile-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-navy);
  text-align: center;
}

/* Stats */
.stats-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-bg-card);
  border-radius: 100px;
  padding: 4px 14px;
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--color-border);
}
.pill-num { font-weight: 800; color: var(--color-navy); font-size: var(--font-size-sm); }
.stat-pill.success .pill-num { color: #10b981; }
.stat-pill.warning .pill-num { color: #f59e0b; }
.pill-lbl { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Layout */
.seating-layout {
  display: grid;
  grid-template-columns: 240px 1fr 260px;
  gap: 0;
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--color-bg-card);
}

/* Guests Panel */
.guests-panel {
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
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
.badge-count {
  background: var(--color-primary);
  color: white;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 100px;
  font-weight: 700;
}
.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-family: inherit;
  font-size: var(--font-size-xs);
  box-sizing: border-box;
  direction: rtl;
}
.search-input:focus { outline: none; border-color: var(--color-primary); }
.guest-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.no-guests {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: var(--space-4);
}

/* Guest Chips */
.guest-chip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 7px 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: var(--font-size-xs);
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}
.guest-chip:hover { border-color: var(--color-primary); background: var(--color-primary-light); }
.guest-chip.selected { border-color: var(--color-primary); background: var(--color-primary-light); border: 2px solid var(--color-primary); }
.guest-chip:active { cursor: grabbing; }
.guest-name { font-weight: 600; color: var(--color-navy); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.guest-meta { font-size: 10px; color: var(--color-text-muted); white-space: nowrap; }
.rsvp-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rsvp-dot.confirmed { background: #10b981; }
.rsvp-dot.declined { background: #ef4444; }
.rsvp-dot.pending { background: #f59e0b; }
.rsvp-dot.maybe { background: #6b7280; }

/* Canvas Area */
.canvas-area {
  background: #f8f9fb;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
}

.zoom-wrapper {
  will-change: transform;
}

.zoom-controls {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  padding: 4px;
  border-radius: var(--radius-full);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
}
.zoom-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-navy);
  font-family: var(--font);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.zoom-btn:hover { background: var(--color-bg-subtle, #F5F6FA); }
.zoom-btn.zoom-fit { font-size: 14px; }
.zoom-level {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-navy);
  min-width: 38px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* HTML drop-zone overlays for guest DnD */
.table-drop-overlay {
  pointer-events: all;
  transition: background 0.15s;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.table-drop-overlay.drop-hover {
  background: rgba(233, 30, 140, 0.15) !important;
  outline: 3px solid #E91E8C;
  outline-offset: -3px;
}
.empty-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
  width: 100%;
}
.empty-icon { font-size: 3rem; margin-bottom: var(--space-3); }
.empty-canvas h3 { color: var(--color-navy); font-weight: 700; margin-bottom: var(--space-2); }
.empty-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); }

/* Table Detail Panel */
.table-detail-panel {
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-card);
}
.detail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--space-6);
}
.detail-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}
.detail-header h3 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-navy);
  margin: 0 0 4px;
}
.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.seat-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.seat-count.full { color: #ef4444; }
.detail-actions { display: flex; gap: 4px; }
.icon-btn {
  background: none; border: none; cursor: pointer;
  font-size: 14px; padding: 2px 4px;
  border-radius: var(--radius-sm);
  opacity: 0.6; transition: all 0.15s;
}
.icon-btn:hover { opacity: 1; background: #f3f4f6; }
.icon-btn.danger:hover { background: #fee2e2; }

.seated-guests {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.no-seated { text-align: center; color: var(--color-text-muted); font-size: var(--font-size-xs); padding: var(--space-4); }
.seated-guest {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
  font-size: var(--font-size-xs);
  border-right: 3px solid transparent;
}
.seated-guest.rsvp-confirmed { border-right-color: #10b981; }
.seated-guest.rsvp-declined { border-right-color: #ef4444; }
.seated-guest.rsvp-pending { border-right-color: #f59e0b; }
.seated-guest.rsvp-maybe { border-right-color: #6b7280; }
.unassign-btn {
  background: none; border: none; cursor: pointer;
  color: #ef4444; font-size: 16px; padding: 0 4px;
  line-height: 1; opacity: 0.5; transition: opacity 0.15s;
}
.unassign-btn:hover { opacity: 1; }

.drop-zone {
  margin: var(--space-2);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-3);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  transition: all 0.2s;
}
.drop-zone.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* Assign Bar */
.assign-bar {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: white;
  padding: 12px var(--space-6);
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
  box-shadow: var(--shadow-xl);
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
  border-radius: var(--radius);
  margin-bottom: var(--space-4);
}
.modal-form { display: flex; flex-direction: column; gap: var(--space-4); }
.modal-form label { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
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
  border-radius: var(--radius-full);
  font-family: inherit; font-size: var(--font-size-sm); font-weight: 600;
  cursor: pointer; border: none; text-decoration: none; transition: all 0.2s;
}
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-light); }
.btn-danger { background: #ef4444; color: white; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

/* Responsive */
@media (max-width: 900px) {
  .seating-view { height: auto; overflow: auto; padding-bottom: calc(80px + env(safe-area-inset-bottom, 16px)); }
  .seating-layout { grid-template-columns: 1fr; height: auto; }
  .guests-panel { max-height: 200px; border-left: none; border-bottom: 1px solid var(--color-border); }
  .canvas-area { min-height: 400px; }
  .table-detail-panel { border-right: none; border-top: 1px solid var(--color-border); }
}
</style>
