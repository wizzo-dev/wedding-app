<template>
  <div class="cards-view" dir="rtl">
    <header class="page-header">
      <h1 class="page-title">💌 הזמנות חתונה</h1>
      <p class="page-subtitle">בחר תבנית להזמנה המושלמת שלך</p>
    </header>

    <div class="filter-bar">
      <div class="cats">
        <button v-for="cat in categories" :key="cat.id" @click="activeCategory = cat.id"
          class="cat-btn" :class="{ active: activeCategory === cat.id }">{{ cat.name }}</button>
      </div>
      <div class="filter-opts">
        <label><input type="checkbox" v-model="popular" /> ⭐ פופולרי</label>
        <label><input type="checkbox" v-model="freeOnly" /> חינמי</label>
      </div>
    </div>

    <div v-if="loading" class="state-center"><div class="spinner"></div><p>טוען...</p></div>
    <div v-else-if="error" class="state-center"><p>⚠️ {{ error }}</p><button @click="load" class="btn btn-outline">נסה שוב</button></div>
    <div v-else-if="!filtered.length" class="state-center"><p>🔍 לא נמצאו תבניות</p><button @click="reset" class="btn btn-outline">נקה סינון</button></div>

    <div v-else class="grid">
      <div v-for="t in filtered" :key="t.id" class="card" @click="openP(t)">
        <div class="card-bg" :style="{ background: t.bgColor }">
          <div class="card-txt">
            <div class="cc" :style="{ color: t.primaryColor }">עמית ❤ מיכל</div>
            <div class="cd" :style="{ color: t.accentColor }">י"ד באדר תשפ"ה</div>
            <div class="cv" :style="{ color: t.primaryColor, opacity: 0.7 }">אולם נצח</div>
          </div>
          <span v-if="t.premium" class="badge prem">👑 פרמיום</span>
          <span v-else-if="t.popular" class="badge pop">⭐</span>
          <div class="hover-ol"><span class="hhint">לחץ לתצוגה</span></div>
        </div>
        <div class="card-body">
          <div class="card-row"><span class="tname">{{ t.name }}</span><span class="tcat">{{ catName(t.category) }}</span></div>
          <p class="tdesc">{{ t.description }}</p>
          <div class="dots">
            <span class="dot" :style="{ background: t.primaryColor }"></span>
            <span class="dot" :style="{ background: t.accentColor }"></span>
            <span class="dot" :style="{ background: t.bgColor, border: '1.5px solid #e5e7eb' }"></span>
          </div>
          <router-link :to="'/app/cards/preview/' + t.id" class="btn btn-primary btn-sm" @click.stop>בחר →</router-link>
        </div>
      </div>
    </div>

    <div v-if="pv" class="overlay" @click.self="pv = null">
      <div class="pmodal">
        <button class="xbtn" @click="pv = null">✕</button>
        <div class="pcanvas" :style="{ background: pv.bgColor }">
          <div class="pinner">
            <div style="font-size:2rem;margin-bottom:1rem">💑</div>
            <div class="pcc" :style="{ color: pv.primaryColor }">עמית ❤ מיכל</div>
            <div class="pca" :style="{ color: pv.accentColor }">מתכבדים להזמינכם לחתונתנו</div>
            <div class="pcd" :style="{ color: pv.primaryColor }">יום שישי, י"ד באדר תשפ"ה<br>14.3.2025 | 19:00</div>
            <div class="pcv" :style="{ color: pv.primaryColor, opacity: 0.7 }">אולם נצח, הרצליה</div>
          </div>
        </div>
        <div class="pfooter">
          <strong style="color:var(--color-navy)">{{ pv.name }}</strong>
          <p style="color:var(--color-text-muted);font-size:var(--font-size-xs);margin:4px 0 var(--space-4)">{{ pv.description }}</p>
          <router-link :to="'/app/cards/preview/' + pv.id" class="btn btn-primary">בחר תבנית זו →</router-link>
        </div>
      </div>
    </div>
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
const popular = ref(false)
const freeOnly = ref(false)
const pv = ref(null)

const filtered = computed(() => {
  let list = all.value
  if (activeCategory.value !== 'all') list = list.filter(t => t.category === activeCategory.value)
  if (popular.value) list = list.filter(t => t.popular)
  if (freeOnly.value) list = list.filter(t => !t.premium)
  return list
})

function catName(id) { return categories.value.find(c => c.id === id)?.name || id }
function openP(t) { pv.value = t }
function reset() { activeCategory.value = 'all'; popular.value = false; freeOnly.value = false }

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/cards/templates', { headers: { Authorization: 'Bearer ' + auth.token } })
    if (!res.ok) throw new Error('שגיאה')
    const d = await res.json()
    all.value = d.templates || d; categories.value = d.categories || []
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.cards-view { max-width: 1100px; margin: 0 auto; padding: var(--space-6); }
.page-header { margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.cats { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.cat-btn { padding: var(--space-1) var(--space-3); border-radius: 100px; border: 1.5px solid var(--color-border); background: white; color: var(--color-navy); font-family: inherit; font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; transition: all 0.15s; }
.cat-btn:hover, .cat-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.filter-opts { display: flex; gap: var(--space-4); font-size: var(--font-size-xs); font-weight: 600; color: var(--color-navy); }
.filter-opts label { display: flex; align-items: center; gap: var(--space-1); cursor: pointer; }
.filter-opts input { accent-color: var(--color-primary); }
.state-center { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--space-5); }
.card { background: var(--color-surface); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); border: 2px solid transparent; transition: all 0.2s; cursor: pointer; }
.card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-primary); }
.card-bg { position: relative; height: 160px; display: flex; align-items: center; justify-content: center; }
.card-txt { text-align: center; padding: var(--space-4); z-index: 1; }
.cc { font-size: 1rem; font-weight: 800; margin-bottom: 6px; }
.cd { font-size: 0.7rem; font-weight: 700; margin-bottom: 4px; }
.cv { font-size: 0.65rem; }
.badge { position: absolute; top: var(--space-2); right: var(--space-2); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; z-index: 3; }
.badge.prem { background: #D4AF37; color: white; }
.badge.pop { background: var(--color-primary); color: white; }
.hover-ol { position: absolute; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.card:hover .hover-ol { opacity: 1; }
.hhint { background: white; border-radius: var(--radius-lg); padding: 4px 12px; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-navy); }
.card-body { padding: var(--space-4); }
.card-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.tname { font-weight: 700; color: var(--color-navy); font-size: var(--font-size-sm); }
.tcat { font-size: 10px; background: var(--color-primary-light); color: var(--color-primary); padding: 1px 6px; border-radius: 100px; font-weight: 600; }
.tdesc { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0 0 var(--space-3); line-height: 1.5; }
.dots { display: flex; gap: 4px; margin-bottom: var(--space-3); }
.dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; }
.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); }
.pmodal { background: white; border-radius: var(--radius-2xl); max-width: 340px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); position: relative; }
.xbtn { position: absolute; top: var(--space-3); left: var(--space-3); background: rgba(255,255,255,0.9); border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; z-index: 5; font-size: 12px; }
.pcanvas { min-height: 240px; display: flex; align-items: center; justify-content: center; }
.pinner { text-align: center; padding: var(--space-6); width: 100%; }
.pcc { font-size: 1.2rem; font-weight: 900; margin-bottom: var(--space-2); }
.pca { font-size: 0.75rem; margin-bottom: var(--space-3); }
.pcd { font-size: 0.85rem; font-weight: 700; margin-bottom: var(--space-2); line-height: 1.5; }
.pcv { font-size: 0.75rem; }
.pfooter { padding: var(--space-4); border-top: 1px solid var(--color-border); text-align: center; }
@media (max-width: 768px) { .cards-view { padding: var(--space-4); } .filter-bar { flex-direction: column; align-items: flex-start; } }
</style>
