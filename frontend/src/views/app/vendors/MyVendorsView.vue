<template>
  <div class="my-vendors fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">הספקים שלי</h1>
        <p class="page-subtitle">ניהול הספקים שבחרתם לחתונה</p>
      </div>
      <div class="page-actions">
        <router-link to="/app/vendors" class="btn btn-outline btn-sm">+ הוסף ספק</router-link>
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="!store.loading && store.myVendors.length > 0" class="stats-row">
      <div class="stat-card">
        <div class="stat-num">{{ store.myVendors.length }}</div>
        <div class="stat-label">סה״כ ספקים</div>
      </div>
      <div class="stat-card stat-booked">
        <div class="stat-num">{{ store.bookedVendors.length }}</div>
        <div class="stat-label">מוזמנים ✅</div>
      </div>
      <div class="stat-card stat-budget">
        <div class="stat-num">{{ formatPrice(store.totalBudget) }}</div>
        <div class="stat-label">סה״כ תקציב</div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div v-if="store.myVendors.length > 0" class="filter-tabs">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.icon }} {{ tab.label }}
        <span class="tab-count">{{ countByStatus(tab.value) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="vendors-list-skeleton">
      <div v-for="i in 4" :key="i" class="vendor-item-skeleton card">
        <div class="card-body" style="display:flex;gap:16px;align-items:center;">
          <div class="skeleton" style="width:56px;height:56px;border-radius:12px;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="height:16px;width:45%;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:14px;width:30%;"></div>
          </div>
          <div class="skeleton" style="width:80px;height:28px;border-radius:14px;"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת הספקים</p>
      <p class="empty-state-text">{{ store.error }}</p>
      <button class="btn btn-primary" @click="store.fetchMyVendors()">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="store.myVendors.length === 0" class="empty-state">
      <div class="empty-state-icon">💼</div>
      <p class="empty-state-title">עדיין אין ספקים</p>
      <p class="empty-state-text">הוסיפו ספקים מרשימת הספקים כדי לנהל אותם כאן</p>
      <router-link to="/app/vendors" class="btn btn-primary">גלה ספקים</router-link>
    </div>

    <!-- Vendor List -->
    <div v-else class="vendors-list">
      <template v-for="uv in filteredList" :key="uv.id">
        <div class="vendor-item card">
          <div class="card-body">
            <div class="vi-main">
              <!-- Icon -->
              <div class="vi-icon" :style="{ background: catGradient(uv.vendor.category) }">
                {{ catIcon(uv.vendor.category) }}
              </div>

              <!-- Info -->
              <div class="vi-info">
                <div class="vi-top">
                  <router-link :to="`/app/vendors/${uv.vendor.id}`" class="vi-name">
                    {{ uv.vendor.name }}
                  </router-link>
                  <span class="status-badge" :class="statusClass(uv.status)">
                    {{ statusLabel(uv.status) }}
                  </span>
                </div>
                <div class="vi-meta">
                  <span class="vi-cat">{{ uv.vendor.category }}</span>
                  <span v-if="uv.vendor.city" class="vi-city">📍 {{ uv.vendor.city }}</span>
                  <span v-if="uv.priceAgreed" class="vi-price">💰 {{ formatPrice(uv.priceAgreed) }}</span>
                </div>
                <p v-if="uv.notes" class="vi-notes">📝 {{ uv.notes }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="vi-actions">
              <select
                class="input status-select"
                :value="uv.status"
                @change="changeStatus(uv, $event.target.value)"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.icon }} {{ opt.label }}
                </option>
              </select>
              <button class="btn btn-ghost btn-sm icon-btn" @click="openEdit(uv)" title="ערוך">✏️</button>
              <button class="btn btn-ghost btn-sm icon-btn danger-btn" @click="confirmRemoveItem = uv" title="הסר">🗑️</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Filtered empty -->
      <div v-if="filteredList.length === 0" class="empty-filtered">
        <p>אין ספקים בסטטוס זה</p>
        <button class="btn btn-ghost btn-sm" @click="activeFilter = 'all'">הצג הכל</button>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editItem" class="modal-backdrop" @click.self="editItem = null">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">עריכת {{ editItem.vendor.name }}</h3>

          <div class="form-group">
            <label class="form-label">סטטוס</label>
            <select v-model="editStatus" class="input">
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.icon }} {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">מחיר סוכם (₪)</label>
            <input v-model.number="editPrice" class="input" type="number" min="0" placeholder="0" />
          </div>

          <div class="form-group">
            <label class="form-label">הערות</label>
            <textarea v-model="editNotes" class="input textarea" rows="3" placeholder="הערות..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="editItem = null">ביטול</button>
            <button class="btn btn-primary" @click="saveEdit" :disabled="actionLoading">
              <span v-if="actionLoading">⏳ שומר...</span>
              <span v-else>💾 שמור</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Confirm -->
    <div v-if="confirmRemoveItem" class="modal-backdrop" @click.self="confirmRemoveItem = null">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">הסר ספק</h3>
          <p class="modal-text">האם להסיר את <strong>{{ confirmRemoveItem.vendor.name }}</strong>?</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmRemoveItem = null">ביטול</button>
            <button class="btn btn-error" @click="removeItem" :disabled="actionLoading">הסר</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVendorsStore } from '@/stores/vendors'

const store = useVendorsStore()

const activeFilter     = ref('all')
const editItem         = ref(null)
const editStatus       = ref('')
const editPrice        = ref('')
const editNotes        = ref('')
const confirmRemoveItem = ref(null)
const actionLoading    = ref(false)

const filterTabs = [
  { value: 'all',         label: 'הכל',         icon: '📋' },
  { value: 'considering', label: 'שוקל/ת',       icon: '🤔' },
  { value: 'contacted',   label: 'יצרתי קשר',   icon: '📞' },
  { value: 'booked',      label: 'מוזמן',        icon: '✅' },
  { value: 'rejected',    label: 'לא מתאים',    icon: '❌' },
]

const statusOptions = [
  { value: 'considering', label: 'שוקל/ת',       icon: '🤔' },
  { value: 'contacted',   label: 'יצרתי קשר',   icon: '📞' },
  { value: 'booked',      label: 'הוזמן',        icon: '✅' },
  { value: 'rejected',    label: 'לא מתאים',    icon: '❌' },
]

const CAT_ICONS = {
  'קייטרינג': '🍽️',
  'צילום':    '📸',
  'להקה':     '🎵',
  'פרחים':    '💐',
  'אולם':     '🏛️',
}
const CAT_GRADIENTS = {
  'קייטרינג': 'linear-gradient(135deg,#FF6B6B,#FFE66D)',
  'צילום':    'linear-gradient(135deg,#667EEA,#764BA2)',
  'להקה':     'linear-gradient(135deg,#F093FB,#F5576C)',
  'פרחים':    'linear-gradient(135deg,#4FACFE,#00F2FE)',
  'אולם':     'linear-gradient(135deg,#43E97B,#38F9D7)',
}

function catIcon(cat)     { return CAT_ICONS[cat] || '🏢' }
function catGradient(cat) { return CAT_GRADIENTS[cat] || 'linear-gradient(135deg,#E91E8C,#1A1F36)' }

function statusLabel(s) { return statusOptions.find(o => o.value === s)?.label || s }
function statusClass(s) {
  const map = { considering: 'badge-warning', contacted: 'badge-info', booked: 'badge-success', rejected: 'badge-error' }
  return map[s] || 'badge-neutral'
}

function formatPrice(n) {
  if (!n) return '₪0'
  return '₪' + n.toLocaleString('he-IL')
}

function countByStatus(status) {
  if (status === 'all') return store.myVendors.length
  return store.myVendors.filter(uv => uv.status === status).length
}

const filteredList = computed(() => {
  if (activeFilter.value === 'all') return store.myVendors
  return store.myVendors.filter(uv => uv.status === activeFilter.value)
})

async function changeStatus(uv, newStatus) {
  try {
    await store.updateMyVendor(uv.id, { status: newStatus })
  } catch {}
}

function openEdit(uv) {
  editItem.value   = uv
  editStatus.value = uv.status
  editPrice.value  = uv.priceAgreed || ''
  editNotes.value  = uv.notes || ''
}

async function saveEdit() {
  actionLoading.value = true
  try {
    await store.updateMyVendor(editItem.value.id, {
      status:      editStatus.value,
      priceAgreed: editPrice.value || null,
      notes:       editNotes.value || null,
    })
    editItem.value = null
  } finally {
    actionLoading.value = false
  }
}

async function removeItem() {
  actionLoading.value = true
  try {
    await store.removeFromMyList(confirmRemoveItem.value.id, confirmRemoveItem.value.vendor.id)
    confirmRemoveItem.value = null
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => store.fetchMyVendors())
</script>

<style scoped>
.my-vendors { max-width: var(--content-max); margin: 0 auto; padding: var(--space-6); }

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

/* Stats */
.stats-row { display: flex; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.stat-card { background: #fff; border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5); flex: 1; min-width: 120px; box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); text-align: center; }
.stat-num { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.stat-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 2px; }
.stat-booked .stat-num { color: var(--color-success); }
.stat-budget .stat-num { color: var(--color-primary); font-size: var(--font-size-xl); }

/* Filter Tabs */
.filter-tabs { display: flex; gap: var(--space-2); overflow-x: auto; padding-bottom: var(--space-2); margin-bottom: var(--space-5); scrollbar-width: none; }
.filter-tabs::-webkit-scrollbar { display: none; }
.filter-tab {
  flex-shrink: 0; display: flex; align-items: center; gap: var(--space-1);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border); background: #fff;
  color: var(--color-text-muted); font-size: var(--font-size-sm);
  font-family: var(--font); cursor: pointer; transition: var(--transition-fast);
  white-space: nowrap;
}
.filter-tab:hover { border-color: var(--color-primary); color: var(--color-primary); }
.filter-tab.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; font-weight: 600; }
.tab-count { background: rgba(255,255,255,0.2); border-radius: var(--radius-full); padding: 1px 6px; font-size: var(--font-size-xs); font-weight: 700; }
.filter-tab:not(.active) .tab-count { background: var(--color-bg-subtle); color: var(--color-text-muted); }

/* Vendor Items */
.vendors-list { display: flex; flex-direction: column; gap: var(--space-3); }

.vendor-item .card-body { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; padding: var(--space-4); }
.vi-main { display: flex; align-items: center; gap: var(--space-3); flex: 1; min-width: 200px; }

.vi-icon {
  width: 56px; height: 56px; border-radius: var(--radius); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem; box-shadow: var(--shadow-xs);
}

.vi-info { flex: 1; }
.vi-top { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-bottom: 4px; }
.vi-name { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); text-decoration: none; }
.vi-name:hover { color: var(--color-primary); }

.status-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 2px var(--space-2); border-radius: var(--radius-full); }
.badge-warning  { background: var(--color-warning-bg);  color: var(--color-warning); }
.badge-info     { background: var(--color-info-bg);     color: var(--color-info); }
.badge-success  { background: var(--color-success-bg);  color: var(--color-success); }
.badge-error    { background: var(--color-error-bg);    color: var(--color-error); }
.badge-neutral  { background: var(--color-bg-subtle);   color: var(--color-text-muted); }

.vi-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); font-size: var(--font-size-xs); color: var(--color-text-muted); }
.vi-price { color: var(--color-primary); font-weight: 600; }
.vi-notes { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px; font-style: italic; }

.vi-actions { display: flex; align-items: center; gap: var(--space-2); }
.status-select { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); border-radius: var(--radius-full); height: auto; min-width: 110px; }
.icon-btn { padding: var(--space-1) var(--space-2); font-size: var(--font-size-base); }
.danger-btn:hover { background: var(--color-error-bg); }

.empty-filtered { text-align: center; padding: var(--space-8); color: var(--color-text-muted); font-size: var(--font-size-sm); }
.empty-filtered p { margin-bottom: var(--space-2); }

/* Skeleton */
.vendors-list-skeleton { display: flex; flex-direction: column; gap: var(--space-3); }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); text-align: center; }
.empty-state-icon { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-state-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-state-text { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: var(--color-overlay); z-index: 100; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal { max-width: 440px; width: 100%; }
.modal-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.modal-text { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }
.modal-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4); }
.form-group { margin-bottom: var(--space-4); }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); margin-bottom: var(--space-1); }
.textarea { resize: vertical; min-height: 70px; }
.btn-error { background: var(--color-error); color: #fff; border-color: var(--color-error); }
.btn-error:hover { background: #dc2626; }

@media (max-width: 640px) {
  .my-vendors { padding: var(--space-4); }
  .stats-row { gap: var(--space-2); }
  .vi-actions { width: 100%; justify-content: flex-end; }
}
</style>
