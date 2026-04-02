<template>
  <div class="gifts-view" dir="rtl">

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>

    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">🎁 רשימת מתנות</h1>
        <p class="page-subtitle">נהל את כל המתנות שקיבלתם</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline btn-sm" @click="exportCSV">📥 ייצוא CSV</button>
        <button class="btn btn-primary" @click="openAddModal">+ הוסף מתנה</button>
      </div>
    </header>

    <!-- Stats row -->
    <div v-if="!statsLoading && stats" class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">🎁</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">סה"כ מתנות</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-body">
          <div class="stat-value">₪{{ formatAmount(stats.totalAmount) }}</div>
          <div class="stat-label">סכום כולל</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-body">
          <div class="stat-value">₪{{ formatAmount(stats.avgAmount) }}</div>
          <div class="stat-label">ממוצע למתנה</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">✅</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.thanked }}</div>
          <div class="stat-label">נשלחה תודה</div>
        </div>
      </div>
      <div class="stat-card pink">
        <div class="stat-icon">🔔</div>
        <div class="stat-body">
          <div class="stat-value">{{ stats.new }}</div>
          <div class="stat-label">חדשות</div>
        </div>
      </div>
    </div>
    <div v-else-if="statsLoading" class="stats-row">
      <div v-for="i in 5" :key="i" class="stat-card skel-pulse" style="height:80px"></div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="חיפוש לפי שם, טלפון, הודעה..."
          @input="debouncedLoad"
        />
        <button v-if="search" class="clear-search" @click="search = ''; loadGifts()">✕</button>
      </div>
      <div class="status-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: statusFilter === tab.value }"
          @click="statusFilter = tab.value; loadGifts()"
        >{{ tab.label }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="table-skeleton">
      <div v-for="i in 6" :key="i" class="skel-row skel-pulse"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-box">
      <div class="state-icon">⚠️</div>
      <h3>שגיאה בטעינה</h3>
      <p>{{ error }}</p>
      <button @click="loadGifts" class="btn btn-outline">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!gifts.length" class="state-box empty-state">
      <div class="state-icon">🎁</div>
      <h3>אין מתנות עדיין</h3>
      <p v-if="search || statusFilter !== 'all'">לא נמצאו תוצאות — נסה לשנות את הסינון</p>
      <p v-else>הוסף את המתנה הראשונה לאחר החתונה</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
        <button v-if="search || statusFilter !== 'all'" @click="clearFilters" class="btn btn-outline">נקה סינון</button>
        <button @click="openAddModal" class="btn btn-primary">+ הוסף מתנה ראשונה</button>
      </div>
    </div>

    <!-- Gifts table -->
    <div v-else class="table-wrap">
      <table class="gifts-table">
        <thead>
          <tr>
            <th>שם הנותן</th>
            <th>טלפון</th>
            <th>סכום</th>
            <th>הודעה</th>
            <th>תאריך</th>
            <th>סטטוס</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gift in gifts" :key="gift.id" :class="{ 'thanked': gift.status === 'thanked' }">
            <td class="td-name">{{ gift.giverName }}</td>
            <td class="td-phone" dir="ltr">{{ gift.giverPhone || '—' }}</td>
            <td class="td-amount">
              <span class="amount-badge">₪{{ formatAmount(gift.amount) }}</span>
            </td>
            <td class="td-msg">
              <span class="msg-text" :title="gift.message">{{ truncate(gift.message, 40) || '—' }}</span>
            </td>
            <td class="td-date">{{ formatDate(gift.createdAt) }}</td>
            <td class="td-status">
              <span class="status-badge" :class="gift.status">
                {{ gift.status === 'thanked' ? '✅ תודה נשלחה' : '🔔 חדש' }}
              </span>
            </td>
            <td class="td-actions">
              <button
                class="action-btn thank-btn"
                :class="{ thanked: gift.status === 'thanked' }"
                @click="toggleThanked(gift)"
                :title="gift.status === 'thanked' ? 'בטל תודה' : 'סמן תודה'"
              >
                {{ gift.status === 'thanked' ? '↩️' : '✅' }} {{ gift.status === 'thanked' ? 'בטל תודה' : 'סמן תודה' }}
              </button>
              <button class="action-btn edit-btn" @click="openEdit(gift)" title="ערוך">✏️</button>
              <button class="action-btn delete-btn" @click="confirmDelete(gift)" title="מחק">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="total > limit" class="pagination">
        <span class="pagination-info">{{ total }} מתנות סה"כ</span>
        <div class="pagination-btns">
          <button class="pg-btn" :disabled="page <= 1" @click="page--; loadGifts()">→</button>
          <span class="pg-info">{{ page }} / {{ totalPages }}</span>
          <button class="pg-btn" :disabled="page >= totalPages" @click="page++; loadGifts()">←</button>
        </div>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <transition name="fade-overlay">
      <div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ modal.editing ? 'ערוך מתנה' : 'הוסף מתנה' }}</h3>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <label class="field-label">שם הנותן <span class="required">*</span></label>
              <input
                v-model="modal.form.giverName"
                class="field-input"
                type="text"
                placeholder="שם מלא"
                :class="{ error: modal.errors.giverName }"
                ref="giverNameInput"
              />
              <span v-if="modal.errors.giverName" class="field-error">{{ modal.errors.giverName }}</span>
            </div>
            <div class="field-group">
              <label class="field-label">טלפון</label>
              <input v-model="modal.form.giverPhone" class="field-input" type="tel" placeholder="05X-XXXXXXX" dir="ltr" />
            </div>
            <div class="field-group">
              <label class="field-label">סכום (₪)</label>
              <input
                v-model="modal.form.amount"
                class="field-input"
                type="number"
                min="0"
                step="50"
                placeholder="0"
                :class="{ error: modal.errors.amount }"
              />
              <span v-if="modal.errors.amount" class="field-error">{{ modal.errors.amount }}</span>
            </div>
            <div class="field-group">
              <label class="field-label">הודעה / ברכה</label>
              <textarea v-model="modal.form.message" class="field-input field-textarea" placeholder="ברכה מהנותן..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeModal">ביטול</button>
            <button class="btn btn-primary" :disabled="modal.saving" @click="submitModal">
              {{ modal.saving ? 'שומר...' : (modal.editing ? 'שמור שינויים' : 'הוסף מתנה') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete confirm modal -->
    <transition name="fade-overlay">
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <h3>מחיקת מתנה</h3>
            <button class="modal-close" @click="deleteTarget = null">✕</button>
          </div>
          <div class="modal-body">
            <p>האם למחוק את המתנה של <strong>{{ deleteTarget.giverName }}</strong>?<br>
            פעולה זו לא ניתנת לביטול.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="deleteTarget = null">ביטול</button>
            <button class="btn btn-danger" :disabled="deleting" @click="deleteGift">
              {{ deleting ? 'מוחק...' : 'מחק' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const gifts = ref([])
const stats = ref(null)
const loading = ref(false)
const statsLoading = ref(false)
const error = ref(null)
const total = ref(0)
const page = ref(1)
const limit = ref(50)
const search = ref('')
const statusFilter = ref('all')
const toast = ref(null)
const deleteTarget = ref(null)
const deleting = ref(false)
const giverNameInput = ref(null)

const statusTabs = [
  { value: 'all', label: 'הכל' },
  { value: 'new', label: '🔔 חדש' },
  { value: 'thanked', label: '✅ תודה נשלחה' }
]

const totalPages = computed(() => Math.ceil(total.value / limit.value))

const modal = ref({
  open: false,
  editing: false,
  editId: null,
  saving: false,
  errors: {},
  form: { giverName: '', giverPhone: '', amount: '', message: '' }
})

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3200)
}

function formatAmount(n) {
  if (n === undefined || n === null) return '0'
  return Math.round(n).toLocaleString('he-IL')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

function clearFilters() {
  search.value = ''
  statusFilter.value = 'all'
  loadGifts()
}

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadGifts() }, 400)
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await fetch('/api/gifts/stats', {
      headers: { Authorization: 'Bearer ' + auth.token }
    })
    if (!res.ok) throw new Error()
    stats.value = await res.json()
  } catch {
    // stats are optional
  } finally {
    statsLoading.value = false
  }
}

async function loadGifts() {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: limit.value,
      ...(statusFilter.value !== 'all' && { status: statusFilter.value }),
      ...(search.value && { search: search.value })
    })
    const res = await fetch('/api/gifts?' + params, {
      headers: { Authorization: 'Bearer ' + auth.token }
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה בטעינת מתנות')
    }
    const data = await res.json()
    gifts.value = data.gifts
    total.value = data.total
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function toggleThanked(gift) {
  const newStatus = gift.status === 'thanked' ? 'new' : 'thanked'
  try {
    const res = await fetch('/api/gifts/' + gift.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
      body: JSON.stringify({ status: newStatus })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה')
    }
    gift.status = newStatus
    showToast(newStatus === 'thanked' ? '✅ סומן — תודה נשלחה' : 'ↂ הסטטוס אופס')
    loadStats()
  } catch (e) {
    showToast(e.message, 'error')
  }
}

function openAddModal() {
  modal.value = {
    open: true, editing: false, editId: null, saving: false, errors: {},
    form: { giverName: '', giverPhone: '', amount: '', message: '' }
  }
  nextTick(() => giverNameInput.value?.focus())
}

function openEdit(gift) {
  modal.value = {
    open: true, editing: true, editId: gift.id, saving: false, errors: {},
    form: {
      giverName: gift.giverName,
      giverPhone: gift.giverPhone || '',
      amount: gift.amount || '',
      message: gift.message || ''
    }
  }
  nextTick(() => giverNameInput.value?.focus())
}

function closeModal() { modal.value.open = false }

function validateModal() {
  const errors = {}
  if (!modal.value.form.giverName?.trim()) errors.giverName = 'שם הנותן נדרש'
  if (modal.value.form.amount !== '' && isNaN(parseFloat(modal.value.form.amount))) {
    errors.amount = 'סכום לא תקין'
  }
  modal.value.errors = errors
  return Object.keys(errors).length === 0
}

async function submitModal() {
  if (!validateModal()) return
  modal.value.saving = true
  try {
    const body = {
      giverName: modal.value.form.giverName.trim(),
      giverPhone: modal.value.form.giverPhone.trim() || null,
      amount: modal.value.form.amount !== '' ? parseFloat(modal.value.form.amount) : 0,
      message: modal.value.form.message.trim() || null
    }
    let res
    if (modal.value.editing) {
      res = await fetch('/api/gifts/' + modal.value.editId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
        body: JSON.stringify(body)
      })
    } else {
      res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
        body: JSON.stringify(body)
      })
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה בשמירה')
    }
    showToast(modal.value.editing ? '✅ המתנה עודכנה' : '🎁 המתנה נוספה בהצלחה')
    closeModal()
    loadGifts()
    loadStats()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    modal.value.saving = false
  }
}

function confirmDelete(gift) { deleteTarget.value = gift }

async function deleteGift() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await fetch('/api/gifts/' + deleteTarget.value.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + auth.token }
    })
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'שגיאה במחיקה')
    }
    showToast('🗑️ המתנה נמחקה')
    deleteTarget.value = null
    loadGifts()
    loadStats()
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    deleting.value = false
  }
}

function exportCSV() {
  showToast('📥 ייצוא CSV יהיה זמין בקרוב 🎉')
}

onMounted(() => {
  loadGifts()
  loadStats()
})
</script>

<style scoped>
.gifts-view { max-width: 1100px; margin: 0 auto; padding: var(--space-6); }

/* Toast */
.toast { position: fixed; top: var(--space-4); left: 50%; transform: translateX(-50%); z-index: 999; background: #22C55E; color: white; padding: var(--space-3) var(--space-6); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 600; box-shadow: var(--shadow-lg); pointer-events: none; white-space: nowrap; }
.toast.error { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-10px); }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); flex-wrap: wrap; gap: var(--space-4); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }

/* Stats row */
.stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3); margin-bottom: var(--space-5); }
.stat-card { background: white; border-radius: var(--radius-xl); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-3); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); transition: transform 0.15s; }
.stat-card:hover { transform: translateY(-2px); }
.stat-card.green { border-color: #22C55E33; background: linear-gradient(135deg, #fff 0%, #DCFCE7 100%); }
.stat-card.pink { border-color: #E91E8C33; background: linear-gradient(135deg, #fff 0%, #FDE8F4 100%); }
.stat-icon { font-size: 1.5rem; flex-shrink: 0; }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); line-height: 1; }
.stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 500; margin-top: 2px; }

/* Filter bar */
.filter-bar { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; align-items: center; }
.search-wrap { position: relative; flex: 1; min-width: 220px; }
.search-icon { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); font-size: 14px; pointer-events: none; }
.search-input { width: 100%; padding: var(--space-2) var(--space-3); padding-right: var(--space-8); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: var(--font-size-sm); color: var(--color-navy); background: white; box-sizing: border-box; transition: border-color 0.15s; }
.search-input:focus { outline: none; border-color: var(--color-primary); }
.clear-search { position: absolute; left: var(--space-2); top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 12px; padding: 2px 4px; }
.status-tabs { display: flex; gap: var(--space-2); }
.tab-btn { padding: var(--space-1) var(--space-4); border-radius: var(--radius-full); border: 1.5px solid var(--color-border); background: white; color: var(--color-navy); font-family: inherit; font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.tab-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.tab-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

/* Table skeleton */
.table-skeleton { display: flex; flex-direction: column; gap: var(--space-2); }
.skel-row { height: 52px; border-radius: var(--radius); }
.skel-pulse { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200%; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { background-position: 200%; } 100% { background-position: -200%; } }

/* State box */
.state-box { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.state-icon { font-size: 2.5rem; }
.state-box h3 { color: var(--color-navy); font-weight: 700; margin: 0; }
.state-box p { color: var(--color-text-muted); margin: 0; font-size: var(--font-size-sm); }

/* Table */
.table-wrap { background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; }
.gifts-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.gifts-table thead tr { background: var(--color-bg, #f5f5f7); border-bottom: 2px solid var(--color-border); }
.gifts-table th { padding: var(--space-3) var(--space-4); text-align: right; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); white-space: nowrap; }
.gifts-table tbody tr { border-bottom: 1px solid var(--color-border); transition: background 0.1s; }
.gifts-table tbody tr:last-child { border-bottom: none; }
.gifts-table tbody tr:hover { background: var(--color-bg-subtle, #f9f9fb); }
.gifts-table tbody tr.thanked { background: #f0fdf4; }
.gifts-table td { padding: var(--space-3) var(--space-4); vertical-align: middle; }

.td-name { font-weight: 600; color: var(--color-navy); }
.td-phone { color: var(--color-text-muted); font-size: var(--font-size-xs); }
.amount-badge { background: var(--color-primary-bg, #fff5fb); color: var(--color-primary); font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); }
.td-msg { max-width: 200px; }
.msg-text { color: var(--color-text-muted); font-size: var(--font-size-xs); }
.td-date { color: var(--color-text-muted); font-size: var(--font-size-xs); white-space: nowrap; }
.status-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap; }
.status-badge.new { background: #FEF3C7; color: #92400E; }
.status-badge.thanked { background: #DCFCE7; color: #166534; }

.td-actions { display: flex; gap: var(--space-1); align-items: center; }
.action-btn { font-size: var(--font-size-xs); font-weight: 600; font-family: inherit; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); border: 1.5px solid var(--color-border); background: white; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.thank-btn:hover { border-color: #22C55E; color: #166534; background: #DCFCE7; }
.thank-btn.thanked:hover { border-color: #E5E7EB; color: var(--color-text-muted); background: white; }
.edit-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.delete-btn:hover { border-color: var(--color-error); color: var(--color-error); }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--color-border); }
.pagination-info { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.pagination-btns { display: flex; align-items: center; gap: var(--space-2); }
.pg-btn { background: white; border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: var(--font-size-sm); padding: var(--space-1) var(--space-3); cursor: pointer; transition: all 0.15s; }
.pg-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: var(--font-size-xs); color: var(--color-text-muted); font-weight: 600; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-4); }
.modal { background: white; border-radius: var(--radius-2xl); width: 100%; max-width: 480px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); overflow: hidden; }
.modal-sm { max-width: 360px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); }
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 50%; transition: background 0.15s; }
.modal-close:hover { background: var(--color-bg, #f5f5f7); }
.modal-body { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-body p { color: var(--color-navy); font-size: var(--font-size-sm); line-height: 1.6; margin: 0; }
.modal-footer { display: flex; gap: var(--space-3); justify-content: flex-start; flex-direction: row-reverse; padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); }

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-navy); }
.required { color: var(--color-error); }
.field-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: inherit; font-size: var(--font-size-sm); color: var(--color-navy); transition: border-color 0.15s; }
.field-input:focus { outline: none; border-color: var(--color-primary); }
.field-input.error { border-color: var(--color-error); }
.field-textarea { resize: vertical; min-height: 80px; }
.field-error { font-size: var(--font-size-xs); color: var(--color-error); font-weight: 600; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-danger { background: var(--color-error); color: white; }
.btn-danger:hover:not(:disabled) { filter: brightness(1.1); }
.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.2s; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

@media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) {
  .gifts-view { padding: var(--space-4); }
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .filter-bar { flex-direction: column; }
  .search-wrap { width: 100%; }
  .table-wrap { overflow-x: auto; }
  .gifts-table { min-width: 640px; }
  .page-header { flex-direction: column; }
}
@media (max-width: 480px) { .stats-row { grid-template-columns: 1fr 1fr; } }
</style>
