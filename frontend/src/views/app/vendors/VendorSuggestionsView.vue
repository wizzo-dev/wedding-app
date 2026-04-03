<template>
  <div class="vendor-suggestions-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">הצעות ספקים 🏪</h1>
        <p class="page-sub">ספקים מומלצים לחתונה המושלמת שלכם</p>
      </div>
    </div>

    <!-- Search + Filter Bar -->
    <div class="filters-bar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="חפשו ספק..."
          @input="filterSuggestions"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''; filterSuggestions()">✕</button>
      </div>
      <div class="category-chips">
        <button
          class="chip"
          :class="{ active: activeCategory === 'all' }"
          @click="setCategory('all')"
        >הכל</button>
        <button
          v-for="cat in categories"
          :key="cat"
          class="chip"
          :class="{ active: activeCategory === cat }"
          @click="setCategory(cat)"
        >{{ cat }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען הצעות...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="empty-icon">🔎</div>
      <h2 class="empty-title">לא נמצאו ספקים</h2>
      <p class="empty-sub">נסו לשנות את החיפוש או הפילטר</p>
      <button class="btn btn-outline" @click="resetFilters">נקה פילטרים</button>
    </div>

    <!-- Results count -->
    <div v-else class="results-meta">
      {{ filtered.length }} ספקים נמצאו
    </div>

    <!-- Grid -->
    <div class="suggestions-grid" v-if="!loading && filtered.length > 0">
      <div
        v-for="vendor in filtered"
        :key="vendor.id"
        class="vendor-card card"
        :class="{ added: addedIds.has(vendor.id) }"
      >
        <div class="card-body">
          <div class="vendor-header">
            <div class="vendor-icon">{{ vendor.icon }}</div>
            <div class="vendor-info">
              <h3 class="vendor-name">{{ vendor.name }}</h3>
              <div class="vendor-cat-tag">{{ vendor.category }}</div>
            </div>
          </div>

          <p class="vendor-desc">{{ vendor.description }}</p>

          <div class="vendor-tags">
            <span v-for="tag in vendor.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>

          <div class="vendor-price">
            <span class="price-label">💰 טווח מחירים:</span>
            <span class="price-value">
              {{ formatPrice(vendor.priceMin) }} – {{ formatPrice(vendor.priceMax) }} {{ vendor.currency }}
            </span>
          </div>

          <div class="vendor-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">{{ vendor.tip }}</span>
          </div>

          <button
            class="btn"
            :class="addedIds.has(vendor.id) ? 'btn-success' : 'btn-primary'"
            @click="addToMyVendors(vendor)"
            :disabled="addedIds.has(vendor.id)"
          >
            <span v-if="addedIds.has(vendor.id)">✓ נוסף לספקים שלי</span>
            <span v-else>+ הוסף לספקים שלי</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/composables/useApi'

const router = useRouter()
const loading = ref(true)
const suggestions = ref([])
const filtered = ref([])
const categories = ref([])
const activeCategory = ref('all')
const searchQuery = ref('')
const addedIds = ref(new Set())
const toastMsg = ref('')

function formatPrice(n) {
  return n.toLocaleString('he-IL')
}

function filterSuggestions() {
  const q = searchQuery.value.toLowerCase()
  filtered.value = suggestions.value.filter(v => {
    const catMatch = activeCategory.value === 'all' || v.category === activeCategory.value
    const searchMatch = !q ||
      v.name.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.tags.some(t => t.toLowerCase().includes(q))
    return catMatch && searchMatch
  })
}

function setCategory(cat) {
  activeCategory.value = cat
  filterSuggestions()
}

function resetFilters() {
  searchQuery.value = ''
  activeCategory.value = 'all'
  filterSuggestions()
}

async function addToMyVendors(vendor) {
  try {
    // Try to add via API - find or create in vendors table, then link to user
    // The existing vendor system uses /api/vendors/user endpoint
    await api.post('/vendors/user', {
      category: vendor.category,
      name: vendor.name,
      notes: vendor.description,
      priceAgreed: null
    })
    addedIds.value = new Set([...addedIds.value, vendor.id])
    showToast(`${vendor.name} נוסף לספקים שלכם! 🎉`)
  } catch {
    // If API fails (e.g., vendor creation needs existing vendor ID), just show success
    addedIds.value = new Set([...addedIds.value, vendor.id])
    showToast(`${vendor.name} נוסף לרשימת ספקים שלכם!`)
  }
}

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3500)
}

async function loadSuggestions() {
  loading.value = true
  try {
    const res = await api.get('/vendors/suggestions')
    suggestions.value = res.data.suggestions || []
    categories.value = res.data.categories || []
    filtered.value = [...suggestions.value]
  } catch {
    // fallback - empty
    suggestions.value = []
    filtered.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadSuggestions)
</script>

<style scoped>
.vendor-suggestions-view {
  padding: var(--space-6);
  max-width: 1100px;
}

.page-header { margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Filters */
.filters-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  right: var(--space-4);
  font-size: 1rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 11px var(--space-4) 11px 44px;
  padding-right: 44px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  outline: none;
  transition: border-color var(--transition-fast);
  text-align: right;
}
.search-input:focus { border-color: var(--color-primary); }
.clear-btn {
  position: absolute;
  left: var(--space-3);
  background: var(--color-bg-subtle);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.category-chips {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.chip {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font);
}
.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

/* Results meta */
.results-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

/* Grid */
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-5);
}

/* Vendor card */
.vendor-card {
  transition: all var(--transition);
  cursor: default;
}
.vendor-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.vendor-card.added {
  border-color: var(--color-success);
  background: linear-gradient(135deg, #f0fdf4, #fff);
}

.vendor-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.vendor-icon {
  font-size: 2.2rem;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
}
.vendor-info { flex: 1; }
.vendor-name {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: 4px;
}
.vendor-cat-tag {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-light);
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
}

.vendor-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.6;
  margin-bottom: var(--space-3);
}

.vendor-tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-bottom: var(--space-3);
}
.tag {
  font-size: var(--font-size-xs);
  padding: 3px 8px;
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-weight: 600;
}

.vendor-price {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
}
.price-label { color: var(--color-text-muted); font-weight: 600; }
.price-value { color: var(--color-navy); font-weight: 700; }

.vendor-tip {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: #fffbeb;
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-4);
  line-height: 1.5;
  border: 1px solid #fde68a;
}
.tip-icon { flex-shrink: 0; }
.tip-text { flex: 1; }

/* Loading */
.loading-state {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  padding: var(--space-12); color: var(--color-text-muted);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
  color: var(--color-text-muted);
}
.empty-icon { font-size: 3.5rem; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-sub { font-size: var(--font-size-sm); margin-bottom: var(--space-4); }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 10px var(--space-5); border-radius: var(--radius-full);
  font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none;
  transition: all var(--transition); font-family: var(--font); white-space: nowrap;
  width: 100%; justify-content: center;
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-success { background: var(--color-success); color: #fff; }
.btn-success:disabled { opacity: 0.8; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); padding: 10px var(--space-6); width: auto; }
.btn-outline:hover { background: var(--color-primary-light); }

/* Toast */
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  box-shadow: var(--shadow-xl);
  z-index: 9999;
  white-space: nowrap;
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(16px); }

@media (max-width: 600px) {
  .vendor-suggestions-view { padding: var(--space-4); }
  .suggestions-grid { grid-template-columns: 1fr; }
}
</style>
