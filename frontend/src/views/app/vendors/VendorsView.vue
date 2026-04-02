<template>
  <div class="vendors-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title">🏪 ספקים</h1>
        <p class="page-subtitle">מצא את הספקים המושלמים לחתונה שלך</p>
      </div>
      <router-link to="/app/vendors/mine" class="btn btn-primary">⭐ הספקים שלי</router-link>
    </header>

    <!-- Category Tabs -->
    <div class="cat-tabs">
      <button v-for="cat in ['הכל', ...categories]" :key="cat"
        class="cat-tab" :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat">
        <span>{{ catIcon(cat) }}</span> {{ cat }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="center-state">
      <div class="spinner"></div>
      <p>טוען ספקים...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="center-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <button @click="load" class="btn btn-outline">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="center-state">
      <div style="font-size:3rem">🔍</div>
      <h3>אין ספקים בקטגוריה זו</h3>
    </div>

    <!-- Grid -->
    <div v-else class="vendors-grid">
      <div v-for="v in filtered" :key="v.id" class="vendor-card" :class="{ featured: v.isFeatured }">
        <div v-if="v.isFeatured" class="featured-badge">⭐ מומלץ</div>
        <div class="vendor-header">
          <div class="vendor-icon">{{ catIcon(v.category) }}</div>
          <div>
            <h3 class="vendor-name">{{ v.name }}</h3>
            <span class="vendor-cat">{{ v.category }}</span>
          </div>
        </div>
        <div class="vendor-body">
          <p class="vendor-desc">{{ v.description }}</p>
          <div class="vendor-details">
            <span class="detail-row"><span class="detail-icon">📍</span> {{ v.city }}</span>
            <span class="detail-row"><span class="detail-icon">💰</span> {{ v.priceRange }}</span>
            <span class="detail-row"><span class="detail-icon">⭐</span> {{ v.rating }}</span>
          </div>
        </div>
        <div class="vendor-footer">
          <a :href="`tel:${v.phone}`" class="btn btn-outline btn-sm">📞 {{ v.phone }}</a>
          <router-link :to="`/app/vendors/${v.id}`" class="btn btn-ghost btn-sm">פרטים</router-link>
          <button v-if="!v.myStatus" @click="addToMine(v)" class="btn btn-primary btn-sm" :disabled="adding === v.id">
            {{ adding === v.id ? '...' : '+ הוסף לשלי' }}
          </button>
          <span v-else class="added-badge">✓ ברשימה שלי</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const vendors = ref([])
const loading = ref(false)
const error = ref(null)
const activeCategory = ref('הכל')
const adding = ref(null)

const categories = computed(() => [...new Set(vendors.value.map(v => v.category))])
const filtered = computed(() =>
  activeCategory.value === 'הכל' ? vendors.value : vendors.value.filter(v => v.category === activeCategory.value)
)

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/vendors', { headers: { Authorization: `Bearer ${auth.token}` } })
    if (!res.ok) throw new Error('שגיאה בטעינת ספקים')
    vendors.value = await res.json()
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function addToMine(v) {
  adding.value = v.id
  try {
    const res = await fetch('/api/vendors/user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: v.id })
    })
    if (!res.ok) throw new Error('שגיאה')
    v.myStatus = 'considering'
  } catch (e) { alert(e.message) }
  finally { adding.value = null }
}

function catIcon(cat) {
  const map = { 'קייטרינג':'🍽️', 'צילום':'📷', 'להקה':'🎵', 'פרחים':'🌸', 'אולם':'🏛️', 'הכל':'🔍' }
  return map[cat] || '📋'
}

onMounted(load)
</script>

<style scoped>
.vendors-view { max-width: 1100px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-5); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.cat-tabs { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-6); border-bottom: 2px solid var(--color-border); padding-bottom: 0; }
.cat-tab { background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; padding: var(--space-3) var(--space-4); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; gap: var(--space-1); border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
.cat-tab:hover { color: var(--color-navy); }
.cat-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

.center-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.vendors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5); }
.vendor-card { background: var(--color-bg-card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); padding: var(--space-5); position: relative; transition: box-shadow var(--transition); border: 2px solid transparent; }
.vendor-card:hover { box-shadow: var(--shadow); }
.vendor-card.featured { border-color: var(--color-primary); }
.featured-badge { position: absolute; top: -1px; right: var(--space-4); background: var(--color-primary); color: #fff; font-size: var(--font-size-xs); font-weight: 700; padding: 2px 10px; border-radius: 0 0 var(--radius-sm) var(--radius-sm); }

.vendor-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); margin-top: var(--space-2); }
.vendor-icon { font-size: 2rem; background: var(--color-primary-bg); border-radius: var(--radius-lg); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.vendor-name { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin: 0 0 2px; }
.vendor-cat { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.vendor-body { margin-bottom: var(--space-4); }
.vendor-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; margin-bottom: var(--space-3); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.vendor-details { display: flex; flex-direction: column; gap: var(--space-1); }
.detail-row { font-size: var(--font-size-xs); color: var(--color-navy); display: flex; align-items: center; gap: var(--space-1); }
.detail-icon { width: 16px; text-align: center; }

.vendor-footer { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; border-top: 1px solid var(--color-border); padding-top: var(--space-3); }
.added-badge { font-size: var(--font-size-xs); color: var(--color-success); font-weight: 700; }

.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); white-space: nowrap; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }
.btn-ghost { background: var(--color-bg-subtle); color: var(--color-navy); }
.btn-ghost:hover { background: var(--color-border); }

@media (max-width: 680px) {
  .vendors-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .vendors-grid { grid-template-columns: 1fr; }
}
</style>
