<template>
  <div class="cards-export fade-in" dir="rtl">
    <div class="page-header">
      <div><h1 class="page-title">יצוא הזמנות</h1><p class="page-sub">יצא הזמנות אישיות לכל האורחים</p></div>
      <button class="btn btn-primary btn-lg" :disabled="loading" @click="startExport">
        <span v-if="loading">⏳ מכין...</span><span v-else>📥 יצא הכל</span>
      </button>
    </div>
    <div v-if="progress !== null" class="card export-card">
      <p>{{ progress === 100 ? '✅ ייצוא הושלם!' : '⏳ מכין...' }}</p>
      <div class="progress-track"><div class="progress-fill" :style="{ width: progress + '%' }" /></div>
      <button v-if="progress === 100" class="btn btn-primary" @click="download">⬇️ הורד</button>
    </div>
    <div v-if="guests.length" class="guests-grid">
      <div v-for="g in guests" :key="g.id" class="card-preview">
        <div class="preview-name">{{ g.name }}</div>
        <div class="preview-status">{{ statusLabel(g.rsvpStatus) }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'
const loading = ref(false), progress = ref(null), guests = ref([]), jobId = ref(null)
onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/cards/export')
    guests.value = res.data.guests || []
    jobId.value  = res.data.jobId
    if (res.data.status === 'ready') progress.value = 100
  } catch {} finally { loading.value = false }
})
async function startExport() {
  loading.value = true; progress.value = 0
  try {
    const res = await api.get('/cards/export')
    jobId.value = res.data.jobId; guests.value = res.data.guests || []
    let p = 0
    const iv = setInterval(() => { p = Math.min(p + 10, 90); progress.value = p }, 200)
    setTimeout(async () => { clearInterval(iv); progress.value = 100 }, 2000)
  } catch {} finally { loading.value = false }
}
function download() { window.open(`/api/cards/export/${jobId.value}/download`, '_blank') }
function statusLabel(s) { return { confirmed: '✅', declined: '❌', pending: '⏳' }[s] || '' }
</script>
<style scoped>
.cards-export { padding: var(--space-6); max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.page-title { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.export-card { padding: var(--space-5); margin-bottom: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
.progress-track { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.3s ease; }
.guests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--space-3); }
.card-preview { background: linear-gradient(160deg, #FFF5FB, #FFF0F8); border: 1.5px solid var(--color-primary-light); border-radius: var(--radius-xl); padding: var(--space-4); text-align: center; aspect-ratio: 3/4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-2); }
.preview-name { font-weight: 800; color: var(--color-navy); font-size: var(--font-size-sm); }
.preview-status { font-size: var(--font-size-xl); }
</style>
