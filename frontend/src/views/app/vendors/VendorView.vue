<template>
  <div class="vendor-detail fade-in" dir="rtl">

    <!-- Back -->
    <button class="back-btn" @click="$router.back()">← חזרה</button>

    <!-- Loading -->
    <div v-if="loading" class="loading-wrap">
      <div class="skeleton-hero"></div>
      <div class="detail-body">
        <div class="skeleton" style="height:28px;width:50%;margin-bottom:12px;"></div>
        <div class="skeleton" style="height:18px;width:35%;margin-bottom:8px;"></div>
        <div class="skeleton" style="height:18px;width:40%;"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">{{ error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <!-- Content -->
    <div v-else-if="vendor" class="detail-wrap">

      <!-- Hero -->
      <div class="hero-card card">
        <div class="hero-bg" :style="{ background: catGradient(vendor.category) }">
          <span class="hero-icon">{{ catIcon(vendor.category) }}</span>
          <div v-if="vendor.isFeatured" class="featured-badge">⭐ מומלץ</div>
        </div>
        <div class="hero-body">
          <div class="hero-top">
            <div>
              <h1 class="vendor-name">{{ vendor.name }}</h1>
              <div class="vendor-category">{{ vendor.category }}</div>
            </div>
            <div class="hero-rating" v-if="vendor.rating">
              <span class="star">★</span>
              <span class="rating-num">{{ vendor.rating.toFixed(1) }}</span>
            </div>
          </div>
          <div class="vendor-tags">
            <span v-if="vendor.city" class="v-tag">📍 {{ vendor.city }}</span>
            <span v-if="vendor.priceRange" class="v-tag price-tag">💰 {{ vendor.priceRange }}</span>
          </div>
          <p v-if="vendor.description" class="vendor-desc">{{ vendor.description }}</p>
          <div class="vendor-contacts">
            <a v-if="vendor.phone" :href="`tel:${vendor.phone}`" class="contact-btn">
              📞 {{ vendor.phone }}
            </a>
            <a v-if="vendor.website" :href="vendor.website" target="_blank" rel="noopener" class="contact-btn website-btn">
              🌐 אתר הספק
            </a>
          </div>
        </div>
      </div>

      <!-- My Vendor Panel -->
      <div class="my-vendor-card card">
        <div class="card-body">
          <h2 class="section-title">הספק שלי</h2>

          <!-- Not in list -->
          <div v-if="!myVendor" class="add-section">
            <p class="add-desc">הוסף ספק זה לרשימת הספקים שלך כדי לנהל אותו</p>
            <div class="status-options">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                class="status-opt-btn"
                :class="{ selected: selectedStatus === opt.value }"
                @click="selectedStatus = opt.value"
              >
                <span class="opt-icon">{{ opt.icon }}</span>
                <span class="opt-label">{{ opt.label }}</span>
              </button>
            </div>
            <button
              class="btn btn-primary btn-full"
              @click="addToList"
              :disabled="actionLoading"
            >
              <span v-if="actionLoading">⏳ מוסיף...</span>
              <span v-else>+ הוסף לרשימה שלי</span>
            </button>
          </div>

          <!-- In list -->
          <div v-else class="manage-section">
            <div class="current-status">
              <span class="status-label">סטטוס:</span>
              <span class="status-badge" :class="statusClass(myVendor.status)">
                {{ statusLabel(myVendor.status) }}
              </span>
            </div>

            <!-- Status Buttons -->
            <div class="status-options">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                class="status-opt-btn"
                :class="{ selected: editStatus === opt.value }"
                @click="editStatus = opt.value"
              >
                <span class="opt-icon">{{ opt.icon }}</span>
                <span class="opt-label">{{ opt.label }}</span>
              </button>
            </div>

            <!-- Price Agreed -->
            <div class="form-group">
              <label class="form-label">מחיר סוכם (₪)</label>
              <input
                v-model.number="editPrice"
                class="input"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label class="form-label">הערות</label>
              <textarea
                v-model="editNotes"
                class="input textarea"
                rows="3"
                placeholder="הערות על הספק..."
              ></textarea>
            </div>

            <div class="manage-actions">
              <button
                class="btn btn-primary"
                @click="updateVendor"
                :disabled="actionLoading"
              >
                <span v-if="actionLoading">⏳ שומר...</span>
                <span v-else>💾 שמור שינויים</span>
              </button>
              <button
                class="btn btn-ghost btn-danger"
                @click="confirmRemove = true"
                :disabled="actionLoading"
              >🗑️ הסר</button>
            </div>

            <div v-if="saveSuccess" class="success-msg">✓ השינויים נשמרו בהצלחה</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Remove Confirm Modal -->
    <div v-if="confirmRemove" class="modal-backdrop" @click.self="confirmRemove = false">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">הסר ספק</h3>
          <p class="modal-text">האם להסיר את <strong>{{ vendor?.name }}</strong> מהרשימה שלך?</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmRemove = false">ביטול</button>
            <button class="btn btn-error" @click="removeFromList" :disabled="actionLoading">הסר</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route  = useRoute()
const router = useRouter()

const vendor       = ref(null)
const myVendor     = ref(null)
const loading      = ref(true)
const error        = ref(null)
const actionLoading = ref(false)
const confirmRemove = ref(false)
const saveSuccess  = ref(false)

const selectedStatus = ref('considering')
const editStatus     = ref('')
const editPrice      = ref('')
const editNotes      = ref('')

const statusOptions = [
  { value: 'considering', label: 'שוקל/ת',   icon: '🤔' },
  { value: 'contacted',   label: 'יצרתי קשר', icon: '📞' },
  { value: 'booked',      label: 'הוזמן',     icon: '✅' },
  { value: 'rejected',    label: 'לא מתאים',  icon: '❌' },
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

function statusLabel(s) {
  return statusOptions.find(o => o.value === s)?.label || s
}
function statusClass(s) {
  const map = { considering: 'badge-warning', contacted: 'badge-info', booked: 'badge-success', rejected: 'badge-error' }
  return map[s] || 'badge-neutral'
}

async function load() {
  loading.value = true
  error.value   = null
  try {
    const res = await api.get(`/vendors/${route.params.id}`)
    vendor.value   = res.data
    myVendor.value = res.data.myVendor || null
    if (myVendor.value) {
      editStatus.value = myVendor.value.status
      editPrice.value  = myVendor.value.priceAgreed || ''
      editNotes.value  = myVendor.value.notes || ''
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'ספק לא נמצא'
  } finally {
    loading.value = false
  }
}

async function addToList() {
  actionLoading.value = true
  try {
    const res = await api.post('/vendors/user', {
      vendorId: vendor.value.id,
      status: selectedStatus.value,
    })
    myVendor.value = res.data
    editStatus.value = res.data.status
    editPrice.value  = res.data.priceAgreed || ''
    editNotes.value  = res.data.notes || ''
  } finally {
    actionLoading.value = false
  }
}

async function updateVendor() {
  actionLoading.value = true
  saveSuccess.value   = false
  try {
    const res = await api.patch(`/vendors/user/${myVendor.value.id}`, {
      status:      editStatus.value,
      priceAgreed: editPrice.value || null,
      notes:       editNotes.value || null,
    })
    myVendor.value   = { ...myVendor.value, ...res.data }
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } finally {
    actionLoading.value = false
  }
}

async function removeFromList() {
  actionLoading.value = true
  try {
    await api.delete(`/vendors/user/${myVendor.value.id}`)
    myVendor.value  = null
    confirmRemove.value = false
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.vendor-detail { max-width: 760px; margin: 0 auto; padding: var(--space-6); }

.back-btn {
  display: inline-flex; align-items: center; gap: var(--space-1);
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); font-size: var(--font-size-sm);
  font-family: var(--font); padding: var(--space-1) 0;
  margin-bottom: var(--space-5); transition: var(--transition-fast);
}
.back-btn:hover { color: var(--color-primary); }

.detail-wrap { display: flex; flex-direction: column; gap: var(--space-5); }

/* Hero */
.hero-card { overflow: hidden; }
.hero-bg {
  height: 140px; display: flex; align-items: center; justify-content: center;
  position: relative;
}
.hero-icon { font-size: 4rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2)); }
.featured-badge {
  position: absolute; top: var(--space-3); right: var(--space-3);
  background: rgba(255,255,255,0.95); color: var(--color-warning);
  font-size: var(--font-size-xs); font-weight: 700;
  padding: 3px var(--space-3); border-radius: var(--radius-full);
  box-shadow: var(--shadow-xs);
}

.hero-body { padding: var(--space-5); }
.hero-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-3); }
.vendor-name { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1.2; }
.vendor-category { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; }

.hero-rating { display: flex; align-items: center; gap: 4px; background: var(--color-bg-subtle); padding: var(--space-2) var(--space-3); border-radius: var(--radius-full); }
.star { color: var(--color-warning); font-size: var(--font-size-lg); }
.rating-num { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }

.vendor-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.v-tag { font-size: var(--font-size-sm); background: var(--color-bg-subtle); color: var(--color-text-muted); padding: var(--space-1) var(--space-3); border-radius: var(--radius-full); }
.price-tag { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }

.vendor-desc { font-size: var(--font-size-base); color: var(--color-text-muted); line-height: 1.7; margin-bottom: var(--space-4); }

.vendor-contacts { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.contact-btn {
  display: inline-flex; align-items: center; gap: var(--space-1);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
  background: var(--color-bg-subtle); color: var(--color-text);
  text-decoration: none; font-size: var(--font-size-sm); font-weight: 600;
  border: 1.5px solid var(--color-border); transition: var(--transition-fast);
}
.contact-btn:hover { background: var(--color-primary-light); border-color: var(--color-primary); color: var(--color-primary); }
.website-btn {}

/* My Vendor Panel */
.section-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }

.add-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }

.status-options { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); }
.status-opt-btn {
  display: flex; align-items: center; gap: var(--space-1);
  padding: var(--space-2) var(--space-3); border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border); background: #fff;
  cursor: pointer; font-size: var(--font-size-sm); font-family: var(--font);
  transition: var(--transition-fast);
}
.status-opt-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.status-opt-btn.selected { border-color: var(--color-primary); background: var(--color-primary); color: #fff; font-weight: 600; }
.opt-icon { font-size: var(--font-size-base); }

.btn-full { width: 100%; justify-content: center; }

/* Current Status */
.current-status { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
.status-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); }
.status-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 3px var(--space-3); border-radius: var(--radius-full); }
.badge-warning  { background: var(--color-warning-bg);  color: var(--color-warning); }
.badge-info     { background: var(--color-info-bg);     color: var(--color-info); }
.badge-success  { background: var(--color-success-bg);  color: var(--color-success); }
.badge-error    { background: var(--color-error-bg);    color: var(--color-error); }
.badge-neutral  { background: var(--color-bg-subtle);   color: var(--color-text-muted); }

.form-group { margin-bottom: var(--space-4); }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); margin-bottom: var(--space-1); }
.textarea { resize: vertical; min-height: 80px; }

.manage-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-4); }
.btn-danger { color: var(--color-error); }
.btn-danger:hover { background: var(--color-error-bg); }

.success-msg { margin-top: var(--space-3); color: var(--color-success); font-size: var(--font-size-sm); font-weight: 600; }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: var(--color-overlay); z-index: 100; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal { max-width: 400px; width: 100%; }
.modal-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.modal-text { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }
.modal-actions { display: flex; gap: var(--space-2); justify-content: flex-end; }

/* Loading skeletons */
.loading-wrap { display: flex; flex-direction: column; gap: var(--space-5); }
.skeleton-hero { height: 140px; border-radius: var(--radius-lg); }
.detail-body { background: #fff; border-radius: var(--radius-lg); padding: var(--space-5); }

/* Empty */
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }
.empty-state-icon { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-state-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }

@media (max-width: 640px) {
  .vendor-detail { padding: var(--space-4); }
  .hero-top { flex-direction: column; }
}
</style>
