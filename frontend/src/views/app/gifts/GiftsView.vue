<template>
  <div class="gifts-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">מתנות 🎁</h1>
        <p class="page-sub">מעקב אחרי המתנות שהתקבלו</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="exportCSV">📥 ייצוא CSV</button>
        <button class="btn btn-outline" @click="exportXlsx">📊 ייצא XLSX</button>
        <button class="btn btn-primary" @click="showAddModal = true">+ הוסף מתנה</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadGifts">נסה שוב</button>
    </div>

    <template v-else>
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card card card-body">
          <div class="stat-icon">💰</div>
          <div class="stat-label">סך הכל התקבל</div>
          <div class="stat-value">{{ formatCurrency(totalAmount) }}</div>
        </div>
        <div class="stat-card card card-body">
          <div class="stat-icon">📊</div>
          <div class="stat-label">ממוצע מתנה</div>
          <div class="stat-value">{{ gifts.length ? formatCurrency(totalAmount / gifts.length) : '₪0' }}</div>
        </div>
        <div class="stat-card card card-body">
          <div class="stat-icon">👥</div>
          <div class="stat-label">מספר נותנים</div>
          <div class="stat-value">{{ gifts.length }}</div>
        </div>
      </div>

      <!-- Search -->
      <div class="search-row">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="search" type="text" class="search-input" placeholder="חפש לפי שם..." />
          <button v-if="search" class="search-clear" @click="search = ''">✕</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="filtered.length === 0" class="empty-state card card-body">
        <div style="font-size:2rem">🎁</div>
        <p>{{ search ? 'לא נמצאו תוצאות לחיפוש' : 'אין מתנות עדיין. הוסיפו את המתנה הראשונה!' }}</p>
      </div>

      <!-- Table -->
      <div v-else class="gifts-table-wrap card">
        <table class="gifts-table">
          <thead>
            <tr>
              <th>שם</th>
              <th>סכום</th>
              <th>הערות</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gift in filtered" :key="gift.id">
              <td class="gift-name">{{ gift.giverName }}</td>
              <td>
                <div v-if="editingId === gift.id" class="inline-edit">
                  <input
                    v-model="editAmount"
                    type="number"
                    class="inline-input"
                    @keyup.enter="saveAmount(gift)"
                    @blur="cancelEdit"
                    min="0"
                  />
                  <button class="save-btn" @mousedown.prevent="saveAmount(gift)">✓</button>
                </div>
                <button v-else class="amount-btn" @click="startEdit(gift)">
                  {{ formatCurrency(gift.amount) }}
                  <span class="edit-hint">✏️</span>
                </button>
              </td>
              <td class="gift-notes">{{ gift.message || '—' }}</td>
              <td>
                <span class="status-badge" :class="gift.status">
                  {{ statusLabel(gift.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button
                    class="action-btn received"
                    :class="{ active: gift.status === 'thanked' }"
                    @click="toggleStatus(gift)"
                    :title="gift.status === 'thanked' ? 'בוטל סימון' : 'סמן כהתקבל'"
                  >✓</button>
                  <button class="action-btn delete" @click="deleteGift(gift.id)" title="מחק">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Add Gift Modal -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal card" dir="rtl">
          <div class="modal-header">
            <h3>הוספת מתנה</h3>
            <button class="modal-close" @click="showAddModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">שם הנותן *</label>
              <input v-model="newGift.giverName" type="text" class="form-input" placeholder="שם מלא" />
            </div>
            <div class="form-group">
              <label class="form-label">טלפון</label>
              <input v-model="newGift.giverPhone" type="tel" class="form-input" placeholder="050-0000000" />
            </div>
            <div class="form-group">
              <label class="form-label">סכום (₪) *</label>
              <input v-model="newGift.amount" type="number" class="form-input" placeholder="0" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">הערה</label>
              <input v-model="newGift.message" type="text" class="form-input" placeholder="הערה אופציונלית" />
            </div>
            <div v-if="addError" class="form-error-msg">{{ addError }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddModal = false">ביטול</button>
            <button class="btn btn-primary" :disabled="adding" @click="addGift">
              {{ adding ? 'שומר...' : 'שמור' }}
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
const gifts = ref([])
const search = ref('')
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref(null)
const newGift = ref({ giverName: '', giverPhone: '', amount: '', message: '' })
const editingId = ref(null)
const editAmount = ref('')

const totalAmount = computed(() => gifts.value.reduce((s, g) => s + (g.amount || 0), 0))
const filtered = computed(() => {
  if (!search.value) return gifts.value
  const q = search.value.toLowerCase()
  return gifts.value.filter(g => g.giverName?.toLowerCase().includes(q))
})

function formatCurrency(n) {
  return `₪${Math.round(n || 0).toLocaleString('he-IL')}`
}

function statusLabel(status) {
  const map = { new: 'חדש', thanked: 'הודינו ✓' }
  return map[status] || status
}

function startEdit(gift) {
  editingId.value = gift.id
  editAmount.value = gift.amount
}

function cancelEdit() {
  setTimeout(() => { editingId.value = null }, 150)
}

async function saveAmount(gift) {
  const amount = parseFloat(editAmount.value)
  if (isNaN(amount) || amount < 0) { editingId.value = null; return }
  try {
    const res = await api.put(`/gifts/${gift.id}`, { amount })
    const idx = gifts.value.findIndex(g => g.id === gift.id)
    if (idx >= 0) gifts.value[idx] = res.data
  } catch {}
  editingId.value = null
}

async function toggleStatus(gift) {
  const newStatus = gift.status === 'thanked' ? 'new' : 'thanked'
  try {
    const res = await api.put(`/gifts/${gift.id}`, { status: newStatus })
    const idx = gifts.value.findIndex(g => g.id === gift.id)
    if (idx >= 0) gifts.value[idx] = res.data
  } catch {}
}

async function deleteGift(id) {
  if (!confirm('למחוק את המתנה הזו?')) return
  try {
    await api.delete(`/gifts/${id}`)
    gifts.value = gifts.value.filter(g => g.id !== id)
  } catch {}
}

async function loadGifts() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/gifts')
    gifts.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

async function addGift() {
  addError.value = null
  if (!newGift.value.giverName?.trim()) { addError.value = 'שם הנותן נדרש'; return }
  if (!newGift.value.amount || isNaN(newGift.value.amount)) { addError.value = 'סכום נדרש'; return }
  adding.value = true
  try {
    const res = await api.post('/gifts', {
      giverName: newGift.value.giverName.trim(),
      giverPhone: newGift.value.giverPhone?.trim() || undefined,
      amount: parseFloat(newGift.value.amount),
      message: newGift.value.message?.trim() || undefined
    })
    gifts.value.unshift(res.data)
    showAddModal.value = false
    newGift.value = { giverName: '', giverPhone: '', amount: '', message: '' }
  } catch (e) {
    addError.value = e.response?.data?.message || 'שגיאה בשמירה'
  } finally {
    adding.value = false
  }
}

function exportCSV() {
  const headers = ['שם', 'סכום', 'הערה', 'סטטוס']
  const rows = gifts.value.map(g => [
    `"${g.giverName || ''}"`,
    g.amount || 0,
    `"${g.message || ''}"`,
    `"${statusLabel(g.status)}"`
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gifts.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function exportXlsx() {
  const res = await api.get('/gifts/export', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url; a.download = 'gifts.xlsx'; a.click()
  URL.revokeObjectURL(url)
}

onMounted(loadGifts)
</script>

<style scoped>
.gifts-view { padding: var(--space-6); max-width: 1000px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }
.header-actions { display: flex; gap: var(--space-3); }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
.stat-card { text-align: center; }
.stat-icon { font-size: 1.5rem; margin-bottom: var(--space-2); }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-1); }
.stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }

.search-row { margin-bottom: var(--space-4); }
.search-wrap { position: relative; max-width: 400px; }
.search-icon { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); }
.search-input { width: 100%; padding: var(--space-3) var(--space-10) var(--space-3) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius-xl); font-size: var(--font-size-sm); outline: none; }
.search-input:focus { border-color: var(--color-primary); }
.search-clear { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-muted); }

.empty-state { text-align: center; padding: var(--space-10); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }

.gifts-table-wrap { overflow-x: auto; }
.gifts-table { width: 100%; border-collapse: collapse; }
.gifts-table th { padding: var(--space-3) var(--space-4); text-align: right; font-size: var(--font-size-sm); color: var(--color-text-muted); border-bottom: 2px solid var(--color-border); background: var(--color-bg-subtle); }
.gifts-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.gifts-table tr:hover td { background: var(--color-primary-bg); }
.gift-name { font-weight: 600; color: var(--color-navy); }
.gift-notes { font-size: var(--font-size-sm); color: var(--color-text-muted); max-width: 200px; }

.amount-btn { background: none; border: none; cursor: pointer; font-weight: 700; color: var(--color-navy); font-size: var(--font-size-base); display: flex; align-items: center; gap: var(--space-1); }
.amount-btn:hover { color: var(--color-primary); }
.edit-hint { font-size: 0.7rem; opacity: 0.5; }
.inline-edit { display: flex; align-items: center; gap: var(--space-2); }
.inline-input { width: 90px; padding: var(--space-1) var(--space-2); border: 1.5px solid var(--color-primary); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.save-btn { background: var(--color-success); color: white; border: none; border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); cursor: pointer; font-size: 0.9rem; }

.status-badge { padding: 3px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.status-badge.new { background: var(--color-warning-bg); color: var(--color-warning); }
.status-badge.thanked { background: var(--color-success-bg); color: var(--color-success); }

.actions { display: flex; gap: var(--space-2); }
.action-btn { width: 32px; height: 32px; border-radius: var(--radius-sm); border: none; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); }
.action-btn.received { background: var(--color-bg); color: var(--color-text-muted); }
.action-btn.received.active, .action-btn.received:hover { background: var(--color-success-bg); color: var(--color-success); }
.action-btn.delete { background: var(--color-bg); color: var(--color-text-muted); }
.action-btn.delete:hover { background: var(--color-error-bg); color: var(--color-error); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { width: 100%; max-width: 480px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-5) 0; }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-text-muted); }
.modal-body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: 0 var(--space-5) var(--space-5); }

.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-base); outline: none; transition: border-color var(--transition-fast); }
.form-input:focus { border-color: var(--color-primary); }
.form-error-msg { color: var(--color-error); font-size: var(--font-size-sm); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 600px) {
  .stats-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; }
  .header-actions { flex-wrap: wrap; }
}
</style>
