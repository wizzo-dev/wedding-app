<template>
  <div class="cards-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title"><span>🪑</span> כרטיסי הושבה</h1>
        <p class="page-subtitle">צרו כרטיסי הושבה יפים לכל אורח — שם + מספר שולחן</p>
      </div>
      <button class="btn btn-primary" @click="generateCards" :disabled="generating || !guests.length">
        {{ generating ? '⏳ מכין...' : '📥 הורד כרטיסים (PDF)' }}
      </button>
    </header>

    <!-- Template Picker -->
    <div class="section-title">בחר תבנית</div>
    <div class="templates-row">
      <div
        v-for="t in templates"
        :key="t.id"
        class="template-option"
        :class="{ active: selectedTemplate === t.id }"
        @click="selectedTemplate = t.id"
      >
        <div class="template-preview" :style="t.style">
          <div class="tp-name" :style="{ color: t.nameColor }">שם האורח</div>
          <div class="tp-table" :style="{ color: t.tableColor }">שולחן 5</div>
        </div>
        <div class="template-label">{{ t.name }}</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!guests.length" class="empty-state">
      <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🪑</div>
      <h3>אין אורחים משובצים לשולחנות</h3>
      <p>שבצו אורחים לשולחנות במפת הישיבה ואז חזרו לייצא כרטיסים</p>
      <router-link to="/app/seating" class="btn btn-primary">עבור למפת ישיבה</router-link>
    </div>

    <!-- Preview Grid -->
    <template v-else>
      <div class="section-title">תצוגה מקדימה ({{ guests.length }} כרטיסים)</div>
      <div class="cards-grid">
        <div
          v-for="guest in guests"
          :key="guest.id"
          class="seating-card"
          :style="currentTemplate.style"
        >
          <div class="sc-name" :style="{ color: currentTemplate.nameColor }">{{ guest.name }}</div>
          <div class="sc-divider" :style="{ background: currentTemplate.dividerColor }"></div>
          <div class="sc-table" :style="{ color: currentTemplate.tableColor }">{{ guest.tableName || `שולחן ${guest.tableNumber}` }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const generating = ref(false)
const guests = ref([])
const selectedTemplate = ref('elegant')

const templates = [
  {
    id: 'elegant',
    name: 'אלגנטי',
    style: { background: '#FFFAF5', border: '2px solid #D4AF37' },
    nameColor: '#1B3C73',
    tableColor: '#D4AF37',
    dividerColor: '#D4AF37',
  },
  {
    id: 'modern',
    name: 'מודרני',
    style: { background: '#FFFFFF', border: '2px solid #1B3C73' },
    nameColor: '#1B3C73',
    tableColor: '#E91E8C',
    dividerColor: '#E91E8C',
  },
  {
    id: 'romantic',
    name: 'רומנטי',
    style: { background: '#FFF0F5', border: '2px solid #E91E8C' },
    nameColor: '#E91E8C',
    tableColor: '#1B3C73',
    dividerColor: '#FFB6C1',
  },
  {
    id: 'minimal',
    name: 'מינימלי',
    style: { background: '#FAFAFA', border: '1px solid #E0E0E0' },
    nameColor: '#333333',
    tableColor: '#888888',
    dividerColor: '#E0E0E0',
  },
]

const currentTemplate = computed(() => templates.find(t => t.id === selectedTemplate.value) || templates[0])

async function loadGuests() {
  loading.value = true
  try {
    const res = await api.get('/seating/assigned-guests')
    guests.value = res.data || []
  } catch {
    // Fallback: load tables with guests
    try {
      const res = await api.get('/tables')
      const allGuests = []
      for (const table of (res.data || [])) {
        for (const g of (table.guests || [])) {
          allGuests.push({
            id: g.id,
            name: g.name,
            tableName: table.name,
            tableNumber: table.number || table.id,
          })
        }
      }
      guests.value = allGuests
    } catch {
      guests.value = []
    }
  } finally {
    loading.value = false
  }
}

async function generateCards() {
  generating.value = true
  try {
    const res = await api.post('/cards/seating/export', {
      template: selectedTemplate.value,
      guests: guests.value.map(g => ({ name: g.name, table: g.tableName || `שולחן ${g.tableNumber}` }))
    }, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'seating-cards.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('שגיאה ביצירת הכרטיסים. נסה שוב.')
  } finally {
    generating.value = false
  }
}

onMounted(loadGuests)
</script>

<style scoped>
.cards-view { max-width: 1100px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; display: flex; align-items: center; gap: var(--space-2); }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }

.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }

/* Template Picker */
.templates-row { display: flex; gap: var(--space-4); margin-bottom: var(--space-8); flex-wrap: wrap; }

.template-option {
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}
.template-option.active .template-preview {
  box-shadow: 0 0 0 3px var(--color-primary);
}

.template-preview {
  width: 140px;
  height: 90px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: box-shadow 0.2s;
}
.template-preview:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.tp-name { font-size: 14px; font-weight: 700; }
.tp-table { font-size: 11px; font-weight: 600; }

.template-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-navy); margin-top: var(--space-2); }

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-4);
}

.seating-card {
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-4);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  aspect-ratio: 3/2;
  transition: transform 0.2s, box-shadow 0.2s;
}
.seating-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.sc-name { font-size: var(--font-size-lg); font-weight: 800; }
.sc-divider { width: 40px; height: 2px; border-radius: 1px; }
.sc-table { font-size: var(--font-size-sm); font-weight: 600; }

/* Other */
.loading-center { display: flex; justify-content: center; padding: var(--space-16); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: var(--space-12) var(--space-4); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); color: var(--color-text-muted); }
.empty-state h3 { color: var(--color-navy); font-weight: 700; margin: 0; }
.empty-state p { margin: 0; }

.btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: inherit; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { filter: brightness(1.1); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 768px) {
  .cards-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .templates-row { overflow-x: auto; flex-wrap: nowrap; }
  .cards-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}
</style>
