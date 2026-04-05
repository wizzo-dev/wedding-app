<template>
  <div class="template-picker fade-in" dir="rtl">
    <div class="page-header">
      <div>
        <h1 class="page-title">בחר תבנית 🎨</h1>
        <p class="page-sub">בחר עיצוב לבסיס ההזמנה שלך</p>
      </div>
      <RouterLink to="/app/invitations" class="btn btn-outline">
        ← חזור להזמנות
      </RouterLink>
    </div>

    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadTemplates">נסה שוב</button>
    </div>

    <div v-else class="templates-grid">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="template-card card"
        @click="selectTemplate(tpl.id)"
        role="button"
        tabindex="0"
        @keydown.enter="selectTemplate(tpl.id)"
      >
        <div class="tpl-thumb">
          <img :src="tpl.imageUrl" :alt="tpl.name" loading="lazy" />
          <div class="tpl-hover-overlay">
            <span class="choose-btn">בחר תבנית ›</span>
          </div>
        </div>
        <div class="tpl-footer card-body">
          <span class="tpl-name">{{ tpl.name }}</span>
          <span class="tpl-zones-count">{{ JSON.parse(tpl.textZones || '[]').length || tpl.textZones?.length }} שדות</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/composables/useApi'

const router = useRouter()
const templates = ref([])
const loading = ref(true)
const error = ref(null)

async function loadTemplates() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/invitations/templates')
    // textZones already parsed by backend
    templates.value = res.data.map(t => ({
      ...t,
      textZones: Array.isArray(t.textZones) ? JSON.stringify(t.textZones) : t.textZones
    }))
  } catch {
    error.value = 'שגיאה בטעינת התבניות'
  } finally {
    loading.value = false
  }
}

function selectTemplate(id) {
  router.push(`/app/invitations/builder/${id}`)
}

onMounted(loadTemplates)
</script>

<style scoped>
.template-picker { padding-bottom: var(--space-8); }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
  gap: var(--space-4);
}
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub   { color: var(--color-text-muted); margin-top: 4px; }

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-6);
}

.template-card {
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--transition);
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.template-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}
.template-card:focus { outline-color: var(--color-primary); }

.tpl-thumb {
  position: relative;
  height: 220px;
  overflow: hidden;
}
.tpl-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.template-card:hover .tpl-thumb img { transform: scale(1.08); }

.tpl-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(233, 30, 140, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.template-card:hover .tpl-hover-overlay { opacity: 1; }

.choose-btn {
  background: #fff;
  color: var(--color-primary);
  font-weight: 700;
  font-size: var(--font-size-base);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
}

.tpl-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
}

.tpl-name {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-navy);
}

.tpl-zones-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.loading-center { display: flex; justify-content: center; padding: var(--space-12); }
.error-card { text-align: center; padding: var(--space-8); }
</style>
