<template>
  <div class="vendors-list fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">ספקים לחתונה</h1>
        <p class="page-subtitle">מצאו את הספקים המושלמים לאירוע שלכם</p>
      </div>
      <div class="page-actions">
        <router-link to="/app/vendors/mine" class="btn btn-outline btn-sm">
          ❤️ הספקים שלי
        </router-link>
      </div>
    </div>

    <!-- Category Filter -->
    <div class="category-scroll">
      <button
        class="cat-pill"
        :class="{ active: activeCategory === '' }"
        @click="setCategory('')"
      >הכל</button>
      <button
        v-for="cat in store.categories"
        :key="cat"
        class="cat-pill"
        :class="{ active: activeCategory === cat }"
        @click="setCategory(cat)"
      >{{ catIcon(cat) }} {{ cat }}</button>
    </div>

    <!-- Search -->
    <div class="search-bar card">
      <div class="card-body search-body">
        <span class="search-icon">🔍</span>
        <input
          v-model="search"
          class="input search-input"
          placeholder="חפש ספק לפי שם, עיר..."
          @input="onSearch"
        />
        <button v-if="search" class="clear-btn" @click="clearSearch">✕</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="vendors-grid">
      <div v-for="i in 6" :key="i" class="vendor-card skeleton-card">
        <div class="skeleton" style="height:120px;border-radius:var(--radius) var(--radius) 0 0;"></div>
        <div class="vc-body">
          <div class="skeleton" style="height:18px;width:60%;margin-bottom:8px;"></div>
          <div class="skeleton" style="height:14px;width:40%;margin-bottom:6px;"></div>
          <div class="skeleton" style="height:14px;width:55%;"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת ספקים</p>
      <p class="empty-state-text">{{ store.error }}</p>
      <button class="btn btn-primary" @click="load">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <p class="empty-state-title">לא נמצאו ספקים</p>
      <p class="empty-state-text">נסה לשנות את הסינון או החיפוש</p>
      <button class="btn btn-ghost" @click="clearAll">נקה סינון</button>
    </div>

    <!-- Vendors Grid -->
    <div v-else class="vendors-grid">
      <div
        v-for="vendor in filtered"
        :key="vendor.id"
        class="vendor-card"
        @click="$router.push(`/app/vendors/${vendor.id}`)"
      >
        <!-- Featured badge -->
        <div v-if="vendor.isFeatured" class="featured-badge">⭐ מומלץ</div>

        <!-- Card Header Color -->
        <div class="vc-header" :style="{ background: catGradient(vendor.category) }">
          <span class="vc-cat-icon">{{ catIcon(vendor.category) }}</span>
        </div>

        <div class="vc-body">
          <div class="vc-top">
            <h3 class="vc-name">{{ vendor.name }}</h3>
            <div v-if="vendor.rating" class="vc-rating">
              <span class="star">★</span> {{ vendor.rating.toFixed(1) }}
            </div>
          </div>
          <div class="vc-meta">
            <span v-if="vendor.city" class="vc-tag">📍 {{ vendor.city }}</span>
            <span v-if="vendor.priceRange" class="vc-tag price-tag">{{ vendor.priceRange }}</span>
          </div>
          <p v-if="vendor.description" class="vc-desc">{{ truncate(vendor.description, 80) }}</p>

          <div class="vc-footer">
            <router-link
              :to="`/app/vendors/${vendor.id}`"
              class="btn btn-ghost btn-xs"
              @click.stop
            >פרטים</router-link>
            <button
              v-if="vendor.myStatus"
              class="btn btn-success btn-xs saved-btn"
              @click.stop="removeVendor(vendor)"
              :disabled="actionLoading === vendor.id"
            >✓ שמור</button>
            <button
              v-else
              class="btn btn-primary btn-xs"
              @click.stop="addVendor(vendor)"
              :disabled="actionLoading === vendor.id"
            >+ הוסף</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVendorsStore } from '@/stores/vendors'

const store         = useVendorsStore()
const search        = ref('')
const activeCategory = ref('')
const actionLoading = ref(null)

// Category → icon mapping
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

function catIcon(cat) { return CAT_ICONS[cat] || '🏢' }
function catGradient(cat) { return CAT_GRADIENTS[cat] || 'linear-gradient(135deg,#E91E8C,#1A1F36)' }
function truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '...' : s }

const filtered = computed(() => {
  let list = store.vendors
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.city && v.city.toLowerCase().includes(q)) ||
      (v.description && v.description.toLowerCase().includes(q))
    )
  }
  return list
})

async function load() {
  await store.fetchCategories()
  await store.fetchVendors(activeCategory.value)
}

async function setCategory(cat) {
  activeCategory.value = cat
  await store.fetchVendors(cat)
}

function onSearch() {
  // filtering is computed, no API call needed
}

function clearSearch() {
  search.value = ''
}

function clearAll() {
  search.value = ''
  activeCategory.value = ''
  store.fetchVendors('')
}

async function addVendor(vendor) {
  actionLoading.value = vendor.id
  try {
    await store.addToMyList(vendor.id, 'considering')
  } finally {
    actionLoading.value = null
  }
}

async function removeVendor(vendor) {
  // We need the userVendor id — fetch single vendor to get it
  actionLoading.value = vendor.id
  try {
    const res = await import('@/composables/useApi').then(m => m.default.get(`/vendors/${vendor.id}`))
    const myVendor = res.data.myVendor
    if (myVendor) {
      await store.removeFromMyList(myVendor.id, vendor.id)
    }
  } finally {
    actionLoading.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.vendors-list { max-width: var(--content-max); margin: 0 auto; padding: var(--space-6); }

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.page-header-text {}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.page-actions { display: flex; gap: var(--space-2); }

/* Category Scroll */
.category-scroll {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-4);
  scrollbar-width: none;
}
.category-scroll::-webkit-scrollbar { display: none; }
.cat-pill {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: #fff;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-family: var(--font);
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
}
.cat-pill:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-pill.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; font-weight: 600; }

/* Search */
.search-bar { margin-bottom: var(--space-6); }
.search-body { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); }
.search-icon { font-size: var(--font-size-lg); opacity: 0.5; }
.search-input { flex: 1; border: none; outline: none; font-size: var(--font-size-base); font-family: var(--font); background: transparent; color: var(--color-text); }
.clear-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: var(--font-size-sm); padding: var(--space-1); border-radius: var(--radius-sm); transition: var(--transition-fast); }
.clear-btn:hover { background: var(--color-bg); color: var(--color-text); }

/* Vendors Grid */
.vendors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5);
}

/* Vendor Card */
.vendor-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  border: 1.5px solid var(--color-border);
}
.vendor-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-3px);
  border-color: var(--color-primary-light);
}

.featured-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: rgba(255,255,255,0.95);
  color: var(--color-warning);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  z-index: 1;
  box-shadow: var(--shadow-xs);
}

.vc-header {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vc-cat-icon { font-size: 2.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }

.vc-body { padding: var(--space-4); }

.vc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-2); }
.vc-name { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); line-height: 1.3; flex: 1; }
.vc-rating { display: flex; align-items: center; gap: 2px; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); white-space: nowrap; flex-shrink: 0; }
.star { color: var(--color-warning); }

.vc-meta { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-bottom: var(--space-2); }
.vc-tag { font-size: var(--font-size-xs); background: var(--color-bg-subtle); color: var(--color-text-muted); padding: 2px var(--space-2); border-radius: var(--radius-full); }
.price-tag { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }

.vc-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; margin-bottom: var(--space-3); }

.vc-footer { display: flex; gap: var(--space-2); justify-content: flex-end; }

/* Buttons */
.btn-xs { padding: 4px var(--space-3); font-size: var(--font-size-xs); }
.btn-success { background: var(--color-success); border-color: var(--color-success); color: #fff; }
.btn-success:hover { background: #16a34a; border-color: #16a34a; }
.saved-btn { opacity: 0.85; }

/* Skeleton */
.skeleton-card { cursor: default; pointer-events: none; }
.skeleton-card:hover { transform: none; box-shadow: var(--shadow-sm); }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); text-align: center; }
.empty-state-icon { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-state-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-state-text { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }

@media (max-width: 640px) {
  .vendors-list { padding: var(--space-4); }
  .vendors-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; }
}
</style>
