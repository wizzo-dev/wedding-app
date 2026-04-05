<template>
  <div class="vendor-view fade-in" dir="rtl">

    <!-- Back -->
    <button class="back-btn" @click="$router.push('/app/vendors')">← חזרה לספקים</button>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadVendor">נסה שוב</button>
    </div>

    <template v-else-if="vendor">
      <!-- Header Card -->
      <div class="vendor-header card card-body">
        <div class="vendor-top">
          <div>
            <div class="vendor-cat-badge" :class="catClass(vendor.category)">{{ vendor.category }}</div>
            <h1 class="vendor-name">{{ vendor.name }}</h1>
            <div class="vendor-city">📍 {{ vendor.city }}</div>
          </div>
          <div class="vendor-rating-box">
            <div class="stars">
              <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= Math.round(vendor.rating || 0) }">★</span>
            </div>
            <div class="rating-num">{{ vendor.rating }}</div>
          </div>
        </div>

        <div v-if="vendor.isFeatured" class="featured-banner">⭐ ספק מומלץ</div>

        <p class="vendor-desc">{{ vendor.description }}</p>

        <div class="vendor-info-row">
          <div class="info-chip">
            <span class="chip-icon">💰</span>
            <span>{{ vendor.priceRange }}</span>
          </div>
          <div v-if="vendor.phone" class="info-chip">
            <span class="chip-icon">📞</span>
            <a :href="`tel:${vendor.phone}`">{{ vendor.phone }}</a>
          </div>
          <div v-if="vendor.website" class="info-chip">
            <span class="chip-icon">🌐</span>
            <a :href="vendor.website" target="_blank" rel="noopener">אתר אינטרנט</a>
          </div>
        </div>

        <button
          class="btn btn-primary save-btn"
          :class="{ saved: vendor.myVendor }"
          @click="saveVendor"
          :disabled="saving"
        >
          {{ saving ? 'שומר...' : (vendor.myVendor ? '✓ נשמר בספקים שלי' : '+ הוסף לספקים שלי') }}
        </button>
      </div>

      <!-- Reviews placeholder -->
      <div class="reviews-section card card-body">
        <h2 class="section-title">ביקורות</h2>
        <div class="reviews-placeholder">
          <div style="font-size:2rem">💬</div>
          <p>ביקורות יתווספו בקרוב</p>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const loading = ref(true)
const error = ref(null)
const vendor = ref(null)
const saving = ref(false)

function catClass(cat) {
  const map = { 'קייטרינג': 'cat-food', 'צילום': 'cat-photo', 'להקה': 'cat-music', 'פרחים': 'cat-flowers', 'אולם': 'cat-hall' }
  return map[cat] || 'cat-other'
}

async function loadVendor() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/vendors/${id}`)
    vendor.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'ספק לא נמצא'
  } finally {
    loading.value = false
  }
}

async function saveVendor() {
  if (vendor.value?.myVendor) return
  saving.value = true
  try {
    const res = await api.post('/vendors/user', { vendorId: vendor.value.id })
    vendor.value.myVendor = res.data
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

onMounted(loadVendor)
</script>

<style scoped>
.vendor-view { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

.back-btn { background: none; border: none; color: var(--color-primary); font-size: var(--font-size-sm); cursor: pointer; margin-bottom: var(--space-5); padding: 0; font-weight: 600; }
.back-btn:hover { text-decoration: underline; }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.vendor-header { margin-bottom: var(--space-4); }
.vendor-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
.vendor-cat-badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; margin-bottom: var(--space-2); }
.cat-food { background: #fef3c7; color: #d97706; }
.cat-photo { background: #dbeafe; color: #2563eb; }
.cat-music { background: #ede9fe; color: #7c3aed; }
.cat-flowers { background: #dcfce7; color: #16a34a; }
.cat-hall { background: #fce7f3; color: #be185d; }
.cat-other { background: var(--color-bg); color: var(--color-text-muted); }

.vendor-name { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-1); }
.vendor-city { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.vendor-rating-box { text-align: center; }
.stars { display: flex; gap: 2px; margin-bottom: var(--space-1); }
.star { font-size: 1.2rem; color: var(--color-border); }
.star.filled { color: var(--color-warning); }
.rating-num { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }

.featured-banner { background: linear-gradient(135deg, #fef3c7, #fffbeb); border: 1px solid #fde68a; color: #92400e; padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-4); display: inline-block; }

.vendor-desc { font-size: var(--font-size-base); color: var(--color-text); line-height: 1.7; margin-bottom: var(--space-4); }

.vendor-info-row { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-5); }
.info-chip { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--color-bg); border-radius: var(--radius-full); font-size: var(--font-size-sm); }
.chip-icon { font-size: 0.9rem; }
.info-chip a { color: var(--color-primary); text-decoration: none; }
.info-chip a:hover { text-decoration: underline; }

.save-btn { width: 100%; padding: var(--space-4); font-size: var(--font-size-base); }
.save-btn.saved { background: var(--color-success); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.reviews-section { }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.reviews-placeholder { text-align: center; padding: var(--space-8); color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }
</style>
