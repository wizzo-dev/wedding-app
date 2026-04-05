<template>
  <div class="my-vendors-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">הספקים שלי ⭐</h1>
        <p class="page-sub">ספקים שבחרתם לחתונה שלכם</p>
      </div>
      <router-link to="/app/vendors" class="btn btn-outline">+ הוסף ספקים</router-link>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadMyVendors">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="myVendors.length === 0" class="empty-state card card-body">
      <div style="font-size:2.5rem">🔍</div>
      <h3>אין ספקים עדיין</h3>
      <p>גשו לרשימת הספקים ובחרו את הספקים לחתונה שלכם</p>
      <router-link to="/app/vendors" class="btn btn-primary">עיין בספקים</router-link>
    </div>

    <!-- Vendors List -->
    <div v-else class="vendors-list">
      <div v-for="uv in myVendors" :key="uv.id" class="vendor-card card card-body">
        <div class="vendor-header">
          <div>
            <div class="vendor-cat-badge" :class="catClass(uv.vendor?.category)">{{ uv.vendor?.category }}</div>
            <router-link :to="`/app/vendors/${uv.vendorId}`" class="vendor-name">{{ uv.vendor?.name }}</router-link>
            <div class="vendor-meta">
              <span>📍 {{ uv.vendor?.city }}</span>
              <span>{{ uv.vendor?.priceRange }}</span>
            </div>
          </div>
          <button class="remove-btn" @click="removeVendor(uv)" title="הסר">🗑️</button>
        </div>

        <!-- Editable fields -->
        <div class="vendor-edit">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">סטטוס</label>
              <select v-model="uv.status" class="form-select" @change="updateVendor(uv)">
                <option value="considering">בודק</option>
                <option value="negotiating">במשא ומתן</option>
                <option value="booked">סגרתי ✓</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">מחיר סגור (₪)</label>
              <input
                v-model="uv.priceAgreed"
                type="number"
                class="form-input"
                placeholder="0"
                @blur="updateVendor(uv)"
                @keyup.enter="updateVendor(uv)"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">הערות</label>
            <input
              v-model="uv.notes"
              type="text"
              class="form-input"
              placeholder="הוסיפו הערות..."
              @blur="updateVendor(uv)"
              @keyup.enter="updateVendor(uv)"
            />
          </div>
        </div>

        <div class="status-footer">
          <span class="status-badge" :class="uv.status">{{ statusLabel(uv.status) }}</span>
          <span v-if="uv.priceAgreed" class="price-agreed">💰 ₪{{ Number(uv.priceAgreed).toLocaleString('he-IL') }}</span>
          <span v-if="savingId === uv.id" class="saving-hint">שומר...</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref(null)
const myVendors = ref([])
const savingId = ref(null)

function catClass(cat) {
  const map = { 'קייטרינג': 'cat-food', 'צילום': 'cat-photo', 'להקה': 'cat-music', 'פרחים': 'cat-flowers', 'אולם': 'cat-hall' }
  return map[cat] || 'cat-other'
}

function statusLabel(s) {
  const map = { considering: 'בודק', negotiating: 'במשא ומתן', booked: 'סגרתי ✓' }
  return map[s] || s
}

async function loadMyVendors() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/vendors/mine')
    myVendors.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינה'
  } finally {
    loading.value = false
  }
}

async function updateVendor(uv) {
  savingId.value = uv.id
  try {
    await api.patch(`/vendors/user/${uv.id}`, {
      status: uv.status,
      priceAgreed: uv.priceAgreed ? parseFloat(uv.priceAgreed) : null,
      notes: uv.notes || null
    })
  } catch {}
  savingId.value = null
}

async function removeVendor(uv) {
  if (!confirm(`להסיר את ${uv.vendor?.name} מרשימת הספקים שלך?`)) return
  try {
    await api.delete(`/vendors/user/${uv.id}`)
    myVendors.value = myVendors.value.filter(v => v.id !== uv.id)
  } catch {}
}

onMounted(loadMyVendors)
</script>

<style scoped>
.my-vendors-view { padding: var(--space-6); max-width: 900px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.empty-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.empty-state h3 { color: var(--color-navy); font-size: var(--font-size-xl); }

.vendors-list { display: flex; flex-direction: column; gap: var(--space-4); }

.vendor-card { }
.vendor-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
.vendor-cat-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; margin-bottom: var(--space-1); }
.cat-food { background: #fef3c7; color: #d97706; }
.cat-photo { background: #dbeafe; color: #2563eb; }
.cat-music { background: #ede9fe; color: #7c3aed; }
.cat-flowers { background: #dcfce7; color: #16a34a; }
.cat-hall { background: #fce7f3; color: #be185d; }
.cat-other { background: var(--color-bg); color: var(--color-text-muted); }

.vendor-name { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); text-decoration: none; display: block; margin-bottom: var(--space-1); }
.vendor-name:hover { color: var(--color-primary); }
.vendor-meta { display: flex; gap: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); }

.remove-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.4; transition: opacity var(--transition-fast); padding: var(--space-2); }
.remove-btn:hover { opacity: 1; }

.vendor-edit { margin-bottom: var(--space-3); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-3); }
.form-group { display: flex; flex-direction: column; gap: var(--space-1); }
.form-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.form-input, .form-select { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); outline: none; background: white; }
.form-input:focus, .form-select:focus { border-color: var(--color-primary); }

.status-footer { display: flex; align-items: center; gap: var(--space-3); padding-top: var(--space-2); border-top: 1px solid var(--color-border); }
.status-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.status-badge.considering { background: var(--color-warning-bg); color: var(--color-warning); }
.status-badge.negotiating { background: var(--color-info-bg); color: var(--color-info); }
.status-badge.booked { background: var(--color-success-bg); color: var(--color-success); }
.price-agreed { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.saving-hint { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-right: auto; }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); text-decoration: none; display: inline-flex; align-items: center; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 500px) {
  .form-row { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: var(--space-3); }
}
</style>
