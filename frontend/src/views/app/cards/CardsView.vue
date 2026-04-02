<template>
  <div class="cards-view" dir="rtl">
    <header class="page-header">
      <h1 class="page-title"><span>💌</span> הזמנות חתונה</h1>
      <p class="page-subtitle">בחר תבנית להזמנה המושלמת שלך</p>
    </header>

    <div class="filter-bar">
      <div class="categories">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="activeCategory = cat.id"
          class="cat-btn"
          :class="{ active: activeCategory === cat.id }"
        >{{ cat.name }}</button>
      </div>
      <div class="filter-options">
        <label class="filter-toggle">
          <input type="checkbox" v-model="showPopularOnly" />
          <span>⭐ פופולרי</span>
        </label>
        <label class="filter-toggle">
          <input type="checkbox" v-model="showFreeOnly" />
          <span>חינמי</span>
        </label>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען תבניות...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <button @click="load" class="btn btn-outline">נסה שוב</button>
    </div>

    <div v-else-if="!filtered.length" class="empty-state">
      <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🔍</div>
      <h3>לא נמצאו תבניות</h3>
      <p>נסה לשנות את הסינון</p>
      <button @click="resetFilters" class="btn btn-outline">נקה סינון</button>
    </div>

    <div v-else class="templates-grid">
      <div
        v-for="t in filtered"
        :key="t.id"
        class="template-card"
        @click="openPreview(t)"
      >
        <div class="card-preview" :style="{ background: t.bgColor }">
          <div class="preview-inner">
            <div class="preview-couple" :style="{ color: t.primaryColor }">עמית ❤ מיכל</div>
            <div class="preview-date" :style="{ color: t.accentColor }">י&quot;ד באדר תשפ&quot;ה</div>
            <div class="preview-venue" :style="{ color: t.primaryColor, opacity: 0.7 }">אולם נצח, הרצליה</div>
          </div>
          <span v-if="t.premium" class="badge premium">👑 פרמיום</span>
          <span v-else-if="t.popular" class="badge popular">⭐ פופולרי</span>
          <div class="hover-overlay">
            <span class="preview-hint">לחץ לתצוגה</span>
          </div>
        </div>

        <div class="card-info">
          <div class="card-top">
            <span class="t-name">{{ t.name }}</span>
            <span class="t-cat">{{ catName(t.category) }}</span>
          </div>
          <p class="t-desc">{{ t.description }}</p>
          <div class="card-meta">
            <div class="color-dots">
              <span class="cdot" :style="{ background: t.primaryColor }"></span>
              <span class="cdot" :style="{ background: t.accentColor }"></span>
              <span class="cdot" :style="{ background: t.bgColor, border: '1.5px solid #e5e7eb' }"></span>
            </div>
            <span class="layout-lbl">{{ t.layout === 'portrait' ? '📄 לאורך' : '📋 לרוחב' }}</span>
          </div>
          <div class="card-actions">
            <router-link :to="'/app/cards/preview/' + t.id" class="btn btn-primary btn-sm" @click.stop>בחר תבנית →</router-link>
          </div>
        </div>
      </div>
    </div>

    <transition name="fade-overlay">
      <div v-if="preview" class="modal-overlay" @click.self="preview = null">
        <div class="preview-modal">
          <button class="close-btn" @click="preview = null">✕</button>
          <div class="modal-preview" :style="{ background: preview.bgColor }">
            <div class="fp-inner">
              <div style="font-size:2rem;margin-bottom:1rem">💑</div>
              <div class="fp-couple" :style="{ color: preview.primaryColor }">עמית ❤ מיכל</div>
              <div class="fp-invite" :style="{ color: preview.accentColor }">מתכבדים להזמינכם לחתונתנו</div>
              <div class="fp-date" :style="{ color: preview.primaryColor }">
                יום שישי, י&quot;ד באדר תשפ&quot;ה<br>14.3.2025 | 19:00
              </div>
              <div class="fp-venue" :style="{ color: preview.primaryColor, opacity: 0.7 }">אולם נצח, הרצליה</div>
            </div>
          </div>
          <div class="modal-footer">
            <h3 class="modal-name">{{ preview.name }}</h3>
            <p class="modal-desc">{{ preview.description }}</p>
            <router-link :to="'/app/cards/preview/' + preview.id" class="btn btn-primary">
              בחר תבנית זו →
            </router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const all = ref([])
const categories = ref([])
const loading = ref(false)
const error = ref(null)
const activeCategory = ref('all')
const showPopularOnly = ref(false)
const showFreeOnly = ref(false)
const preview = ref(null)

const filtered = computed(() => {
  let list = all.value
  if (activeCategory.value !== 'all') list = list.filter(t => t.category === activeCategory.value)
  if (showPopularOnly.value) list = list.filter(t => t.popular)
  if (showFreeOnly.value) list = list.filter(t => !t.premium)
  return list
})

function catName(id) { return categories.value.find(c => c.id === id)?.name || id }
function openPreview(t) { preview.value = t }
function resetFilters() { activeCategory.value = 'all'; showPopularOnly.value = false; showFreeOnly.value = false }

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/cards/templates', {
      headers: { Authorization: 'Bearer ' + auth.token }
    })
    if (!res.ok) throw new Error('שגיאה בטעינת התבניות')
    const d = await res.json()
    all.value = d.templates || d
    categories.value = d.categories || []
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.cards-view { max-width: 1100px; margin: 0 auto; padding: var(--space-6); }
.page-header { margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; display: flex; align-items: center; gap: var(--space-2); }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.categories { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.cat-btn { padding: var(--space-1) var(--space-3); border-radius: 100px; border: 1.5px solid var(--color-border); background: white; color: var(--color-navy); font-family: inherit; font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; transition: all 0.15s; }
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.filter-options { display: flex; gap: var(--space-4); }
.filter-toggle { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-xs); font-weight: 600; color: var(--color-navy); cursor: pointer; }
.filter-toggle input { cursor: pointer; accent-color: var(--color-primary); }

.loading-state, .error-state, .empty-state { text-align: center; padding: var(--space-12) var(--space-4); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state h3 { color: var(--color-navy); font-weight: 700; margin: 0; }
.empty-state p { margin: 0; }

.templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-5); }

.template-card { background: var(--color-surface); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); border: 2px solid transparent; transition: all 0.2s; cursor: pointer; }
.template-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-primary); }

.card-preview { position: relative; height: 170px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview-inner { text-align: center; padding: var(--space-4); z-index: 1; }
.preview-couple { font-size: 1.05rem; font-weight: 800; margin-bottom: 6px; }
.preview-date { font-size: 0.72rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; }
.preview-venue { font-size: 0.68rem; }

.badge { position: absolute; top: var(--space-2); right: var(--space-2); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; z-index: 3; }
.badge.premium { background: #D4AF37; color: white; }
.badge.popular { background: var(--color-primary); color: white; }

.hover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.template-card:hover .hover-overlay { opacity: 1; }
.preview-hint { background: white; border-radius: var(--radius-lg); padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); font-weight: 700; color: var(--color-navy); }

.card-info { padding: var(--space-4); }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.t-name { font-weight: 700; color: var(--color-navy); font-size: var(--font-size-sm); }
.t-cat { font-size: 10px; background: var(--color-primary-light); color: var(--color-primary); padding: 1px 6px; border-radius: 100px; font-weight: 600; }
.t-desc { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-3); line-height: 1.5; }
.card-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3); }
.color-dots { display: flex; gap: 4px; }
.cdot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
.layout-lbl { font-size: 10px; color: var(--color-text-muted); }
.card-actions { display: flex; }

.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.preview-modal { background: white; border-radius: var(--radius-2xl); max-width: 360px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); position: relative; }
.close-btn { position: absolute; top: var(--space-3); left: var(--space-3); background: rgba(255,255,255,0.9); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.modal-preview { min-height: 260px; display: flex; align-items: center; justify-content: center; }
.fp-inner { text-align: center; padding: var(--space-6); width: 100%; }
.fp-couple { font-size: 1.3rem; font-weight: 900; margin-bottom: var(--space-2); }
.fp-invite { font-size: 0.78rem; margin-bottom: var(--space-3); }
.fp-date { font-size: 0.85rem; font-weight: 700; margin-bottom: var(--space-2); line-height: 1.5; }
.fp-venue { font-size: 0.78rem; }
.modal-footer { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--color-border); text-align: center; }
.modal-name { font-weight: 800; color: var(--color-navy); margin: 0 0 4px; font-size: var(--font-size-base); }
.modal-desc { color: var(--color-text-muted); font-size: var(--font-size-xs); margin: 0 0 var(--space-4); }

.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.2s; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

@media (max-width: 768px) { .cards-view { padding: var(--space-4); } .filter-bar { flex-direction: column; align-items: flex-start; } }
</style>
