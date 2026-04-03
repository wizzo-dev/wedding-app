<template>
  <div class="preview-view" dir="rtl">
    <div class="preview-toolbar">
      <router-link to="/app/cards" class="back-btn">← חזור לגלריה</router-link>
      <div class="toolbar-actions">
        <button class="btn btn-outline btn-sm">📤 שתף</button>
        <button class="btn btn-primary btn-sm" @click="useTemplate">
          השתמש בתבנית →
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען תבנית...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span style="font-size:2rem">⚠️</span>
      <p>{{ error }}</p>
      <router-link to="/app/cards" class="btn btn-outline">חזור לגלריה</router-link>
    </div>

    <div v-else-if="template" class="preview-content">
      <div class="preview-side">
        <div class="card-canvas" :style="{ background: template.bgColor }">
          <div class="canvas-inner">
            <div class="canvas-hearts" :style="{ color: template.accentColor }">💑</div>
            <div class="canvas-couple" :style="{ color: template.primaryColor }">
              עמית ❤ מיכל
            </div>
            <div class="canvas-invite" :style="{ color: template.accentColor }">
              מתכבדים להזמינכם לחתונתנו
            </div>
            <div class="canvas-divider" :style="{ background: template.accentColor }"></div>
            <div class="canvas-date" :style="{ color: template.primaryColor }">
              יום שישי, י&quot;ד באדר תשפ&quot;ה
            </div>
            <div class="canvas-time" :style="{ color: template.primaryColor }">
              14.3.2025 | 19:00
            </div>
            <div class="canvas-venue" :style="{ color: template.primaryColor, opacity: 0.75 }">
              אולם נצח, הרצליה
            </div>
            <div class="canvas-rsvp-btn" :style="{ background: template.primaryColor }">
              אישור הגעה
            </div>
          </div>
        </div>
        <div class="template-badges">
          <span v-if="template.premium" class="tgt premium">👑 תבנית פרמיום</span>
          <span v-if="template.popular" class="tgt popular">⭐ פופולרי</span>
          <span class="tgt">{{ template.layout === 'portrait' ? '📄 לאורך' : '📋 לרוחב' }}</span>
        </div>
      </div>

      <div class="template-details">
        <h1 class="template-name">{{ template.name }}</h1>
        <p class="template-desc">{{ template.description }}</p>

        <div class="detail-section">
          <h3>🎨 צבעים</h3>
          <div class="color-row">
            <div class="color-item">
              <span class="color-swatch" :style="{ background: template.primaryColor }"></span>
              <span class="color-name">ראשי</span>
              <code>{{ template.primaryColor }}</code>
            </div>
            <div class="color-item">
              <span class="color-swatch" :style="{ background: template.accentColor }"></span>
              <span class="color-name">מבטא</span>
              <code>{{ template.accentColor }}</code>
            </div>
            <div class="color-item">
              <span class="color-swatch" :style="{ background: template.bgColor, border: '1.5px solid #e5e7eb' }"></span>
              <span class="color-name">רקע</span>
              <code>{{ template.bgColor }}</code>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="template.fields">
          <h3>📝 שדות נתמכים</h3>
          <div class="fields-list">
            <span v-for="f in template.fields" :key="f" class="field-tag">{{ fieldLabel(f) }}</span>
          </div>
        </div>

        <div class="cta-box">
          <h3>מוכנים ליצור את ההזמנה?</h3>
          <p>השתמשו בתבנית זו ועצבו את ההזמנה האישית שלכם</p>
          <button @click="useTemplate" class="btn btn-primary">
            השתמש בתבנית {{ template.name }} →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const template = ref(null)
const loading = ref(false)
const error = ref(null)

const FIELD_LABELS = {
  coupleName: 'שמות הזוג', weddingDate: 'תאריך', venue: 'מקום',
  rsvpDate: 'תאריך אישור', phone: 'טלפון', dresscode: 'קוד לבוש', blessings: 'ברכות'
}

function fieldLabel(f) { return FIELD_LABELS[f] || f }

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch('/api/cards/templates/' + route.params.id, {
      headers: { Authorization: 'Bearer ' + auth.accessToken }
    })
    if (!res.ok) throw new Error('תבנית לא נמצאה')
    template.value = await res.json()
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

function useTemplate() {
  // Phase 1: just navigate back with selection
  // TODO: implement card customization flow
  router.push('/app/cards')
}

onMounted(load)
</script>

<style scoped>
.preview-view { max-width: 1000px; margin: 0 auto; padding: var(--space-6); }

.preview-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }
.back-btn { color: var(--color-primary); text-decoration: none; font-weight: 600; font-size: var(--font-size-sm); }
.back-btn:hover { text-decoration: underline; }
.toolbar-actions { display: flex; gap: var(--space-2); }

.loading-state, .error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.preview-content { display: grid; grid-template-columns: 380px 1fr; gap: var(--space-8); align-items: start; }

.card-canvas { border-radius: var(--radius-2xl); min-height: 480px; display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
.canvas-inner { text-align: center; padding: var(--space-8); width: 100%; }
.canvas-hearts { font-size: 2.5rem; margin-bottom: var(--space-4); }
.canvas-couple { font-size: 1.6rem; font-weight: 900; margin-bottom: var(--space-3); }
.canvas-invite { font-size: 0.85rem; margin-bottom: var(--space-4); letter-spacing: 0.5px; }
.canvas-divider { height: 1px; width: 60px; margin: 0 auto var(--space-4); }
.canvas-date { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-1); }
.canvas-time { font-size: 0.85rem; margin-bottom: var(--space-3); }
.canvas-venue { font-size: 0.85rem; margin-bottom: var(--space-6); }
.canvas-rsvp-btn { display: inline-block; color: white; padding: 10px 24px; border-radius: 100px; font-size: 0.85rem; font-weight: 700; }

.template-badges { display: flex; gap: var(--space-2); margin-top: var(--space-3); flex-wrap: wrap; justify-content: center; }
.tgt { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
.tgt.premium { background: #fef3c7; color: #92400e; }
.tgt.popular { background: var(--color-primary-light); color: var(--color-primary); }
.tgt:not(.premium):not(.popular) { background: #f3f4f6; color: #6b7280; }

.template-name { font-size: var(--font-size-3xl); font-weight: 900; color: var(--color-navy); margin: 0 0 var(--space-3); }
.template-desc { color: var(--color-text-muted); font-size: var(--font-size-base); margin: 0 0 var(--space-6); line-height: 1.6; }

.detail-section { margin-bottom: var(--space-6); }
.detail-section h3 { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin: 0 0 var(--space-3); }
.color-row { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.color-item { display: flex; align-items: center; gap: var(--space-2); }
.color-swatch { width: 24px; height: 24px; border-radius: 50%; display: inline-block; }
.color-name { font-size: var(--font-size-xs); color: var(--color-text-muted); }
code { font-size: var(--font-size-xs); background: #f3f4f6; padding: 1px 6px; border-radius: 4px; }

.fields-list { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.field-tag { background: var(--color-primary-light); color: var(--color-primary); font-size: var(--font-size-xs); font-weight: 600; padding: 3px 10px; border-radius: 100px; }

.cta-box { background: var(--color-primary-bg); border-radius: var(--radius-xl); padding: var(--space-6); text-align: center; }
.cta-box h3 { font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-2); }
.cta-box p { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0 0 var(--space-4); }

.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }

@media (max-width: 768px) { .preview-view { padding: var(--space-4); } .preview-content { grid-template-columns: 1fr; } }
</style>
