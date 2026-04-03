<template>
  <div class="vendors-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ספקים 🏪</h1>
        <p class="page-sub">מצאו את הספקים הטובים ביותר לחתונה שלכם</p>
      </div>
      <router-link to="/app/vendors/mine" class="btn btn-outline">⭐ הספקים שלי</router-link>
    </div>

    <!-- Search -->
    <div class="search-row">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input v-model="search" type="text" class="search-input" placeholder="חפש ספק לפי שם..." />
        <button v-if="search" class="search-clear" @click="search = ''">✕</button>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs-row">
      <button
        v-for="cat in ALL_CATS"
        :key="cat"
        class="tab-btn"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ cat }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadVendors">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state card card-body">
      <div style="font-size:2rem">🔍</div>
      <p>לא נמצאו ספקים</p>
    </div>

    <!-- Vendors Grid -->
    <div v-else class="vendors-grid">
      <div v-for="v in filtered" :key="v.id" class="vendor-card card">
        <router-link :to="`/app/vendors/${v.id}`" class="vendor-link">
          <div class="vendor-body card-body">
            <div class="vendor-top">
              <div class="vendor-cat-badge" :class="catClass(v.category)">{{ v.category }}</div>
              <div v-if="v.isFeatured" class="featured-badge">⭐ מומלץ</div>
            </div>
            <h3 class="vendor-name">{{ v.name }}</h3>
            <p class="vendor-desc">{{ v.description }}</p>
            <div class="vendor-meta">
              <span class="vendor-city">📍 {{ v.city }}</span>
              <span class="vendor-price">{{ v.priceRange }}</span>
            </div>
            <div class="vendor-rating">
              <span v-for="s in 5" :key="s" class="star" :class="{ filled: s <= Math.round(v.rating) }">★</span>
              <span class="rating-num">{{ v.rating }}</span>
            </div>
          </div>
        </router-link>
        <div class="vendor-footer">
          <button
            class="btn-save"
            :class="{ saved: v.myStatus }"
            @click="saveVendor(v)"
            :disabled="savingId === v.id"
          >
            {{ v.myStatus ? '✓ נשמר' : '+ הוסף לשלי' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const ALL_CATS = ['הכל', 'קייטרינג', 'צילום', 'להקה', 'פרחים', 'אולם']

const loading = ref(true)
const error = ref(null)
const vendors = ref([])
const search = ref('')
const activeCategory = ref('הכל')
const savingId = ref(null)

const filtered = computed(() => {
  let list = vendors.value
  if (activeCategory.value !== 'הכל') list = list.filter(v => v.category === activeCategory.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(v => v.name.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q))
  }
  return list
})

function catClass(cat) {
  const map = { 'קייטרינג': 'cat-food', 'צילום': 'cat-photo', 'להקה': 'cat-music', 'פרחים': 'cat-flowers', 'אולם': 'cat-hall' }
  return map[cat] || 'cat-other'
}

async function loadVendors() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/vendors')
    vendors.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'שגיאה בטעינת ספקים'
  } finally {
    loading.value = false
  }
}

async function saveVendor(v) {
  if (v.myStatus) return
  savingId.value = v.id
  try {
    await api.post('/vendors/user', { vendorId: v.id })
    v.myStatus = 'considering'
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    savingId.value = null
  }
}

onMounted(loadVendors)
</script>

<style scoped>
.vendors-view { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }

.search-row { margin-bottom: var(--space-4); }
.search-wrap { position: relative; max-width: 400px; }
.search-icon { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); }
.search-input { width: 100%; padding: var(--space-3) var(--space-10) var(--space-3) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-sm); outline: none; }
.search-input:focus { border-color: var(--color-primary); }
.search-clear { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-muted); }

.tabs-row { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
.tab-btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); border: 1.5px solid var(--color-border); background: white; font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-fast); }
.tab-btn:hover, .tab-btn.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }

.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.empty-state { text-align: center; padding: var(--space-10); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }

.vendors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.vendor-card { display: flex; flex-direction: column; overflow: hidden; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
.vendor-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.vendor-link { text-decoration: none; color: inherit; flex: 1; }
.vendor-body { flex: 1; }

.vendor-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
.vendor-cat-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.cat-food { background: #fef3c7; color: #d97706; }
.cat-photo { background: #dbeafe; color: #2563eb; }
.cat-music { background: #ede9fe; color: #7c3aed; }
.cat-flowers { background: #dcfce7; color: #16a34a; }
.cat-hall { background: #fce7f3; color: #be185d; }
.cat-other { background: var(--color-bg); color: var(--color-text-muted); }
.featured-badge { font-size: var(--font-size-xs); color: var(--color-warning); font-weight: 600; }

.vendor-name { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.vendor-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; margin-bottom: var(--space-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.vendor-meta { display: flex; justify-content: space-between; font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
.vendor-city { color: var(--color-text-muted); }
.vendor-price { font-weight: 600; color: var(--color-navy); }
.vendor-rating { display: flex; align-items: center; gap: var(--space-1); }
.star { color: var(--color-border); font-size: 0.9rem; }
.star.filled { color: var(--color-warning); }
.rating-num { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-right: var(--space-1); }

.vendor-footer { padding: var(--space-3) var(--space-5) var(--space-4); border-top: 1px solid var(--color-border); }
.btn-save { width: 100%; padding: var(--space-2) var(--space-4); border-radius: var(--radius); border: 1.5px solid var(--color-primary); background: white; color: var(--color-primary); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-save:hover { background: var(--color-primary); color: white; }
.btn-save.saved { background: var(--color-primary-light); border-color: var(--color-primary); cursor: default; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); text-decoration: none; display: inline-flex; align-items: center; }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-hover); }

@media (max-width: 600px) {
  .vendors-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; gap: var(--space-3); }
}
</style>
