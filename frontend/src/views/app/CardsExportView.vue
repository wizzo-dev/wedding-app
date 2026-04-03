<template>
  <div class="cards-export fade-in" dir="rtl">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-text">
        <h1 class="page-title">יצוא הזמנות</h1>
        <p class="page-sub">יצא הזמנות אישיות לכל האורחים כקובץ אחד</p>
      </div>
      <button
        class="btn btn-primary btn-lg"
        :disabled="exporting || !!jobId"
        @click="startExport"
      >
        <span v-if="exporting">⏳ מכין...</span>
        <span v-else-if="jobId && jobStatus === 'ready'">✅ ייצוא מוכן</span>
        <span v-else>📥 יצא הכל</span>
      </button>
    </div>

    <!-- Export progress -->
    <Transition name="slide-down">
      <div v-if="jobId" class="export-progress-card card">
        <div class="progress-header">
          <div class="progress-info">
            <span class="progress-icon">{{ jobStatus === 'ready' ? '✅' : '⏳' }}</span>
            <div>
              <div class="progress-title">
                {{ jobStatus === 'ready' ? 'ייצוא הושלם!' : 'מכין את הקבצים...' }}
              </div>
              <div class="progress-sub">
                {{ jobStatus === 'ready' ? `${totalGuests} כרטיסים מוכנים להורדה` : 'אנא המתן...' }}
              </div>
            </div>
          </div>
          <button
            v-if="jobStatus === 'ready'"
            class="btn btn-primary"
            @click="downloadExport"
          >
            ⬇️ הורד ZIP
          </button>
        </div>

        <!-- Progress bar -->
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: jobStatus === 'ready' ? '100%' : `${fakeProgress}%` }"
          />
        </div>
        <div class="progress-pct">{{ jobStatus === 'ready' ? 100 : fakeProgress }}%</div>
      </div>
    </Transition>

    <!-- Error state -->
    <div v-if="exportError" class="alert-error">
      <span>⚠️</span> {{ exportError }}
    </div>

    <!-- Stats row -->
    <div v-if="exportData" class="stats-row">
      <div class="stat-chip" v-for="stat in stats" :key="stat.label">
        <span class="chip-num">{{ stat.num }}</span>
        <span class="chip-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="guests-grid">
      <div v-for="i in 8" :key="i" class="card-preview-skel">
        <div class="skel skel-card-header" />
        <div class="skel skel-card-name" />
        <div class="skel skel-card-sub" />
      </div>
    </div>

    <!-- Empty state (no guests) -->
    <div v-else-if="!loading && exportData && !exportData.guests?.length" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <p class="empty-state-title">אין אורחים עדיין</p>
      <p class="empty-state-text">הוסף אורחים כדי לייצא הזמנות אישיות</p>
      <router-link to="/app/guests" class="btn btn-primary">הוסף אורחים</router-link>
    </div>

    <!-- Guest cards grid -->
    <div v-else-if="exportData" class="guests-grid">
      <div
        v-for="guest in exportData.guests"
        :key="guest.id"
        class="card-preview"
        :style="templateStyle"
      >
        <!-- Mini card preview -->
        <div class="preview-header">
          <div class="preview-hearts">💍</div>
        </div>
        <div class="preview-couple">
          {{ exportData.couple.name1 }} &amp; {{ exportData.couple.name2 }}
        </div>
        <div class="preview-invite">מזמינים את</div>
        <div class="preview-guest-name">{{ guest.name }}</div>
        <div class="preview-seats" v-if="guest.numPeople > 1">
          ({{ guest.numPeople }} מקומות)
        </div>
        <div class="preview-divider" />
        <div class="preview-date" v-if="exportData.couple.weddingDate">
          {{ formatDate(exportData.couple.weddingDate) }}
        </div>
        <div class="preview-venue" v-if="exportData.couple.venue">
          📍 {{ exportData.couple.venue }}
        </div>
        <div class="preview-status-badge" :class="`status-${guest.rsvpStatus}`">
          {{ statusLabel(guest.rsvpStatus) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/composables/useApi'

const loading     = ref(true)
const exporting   = ref(false)
const exportData  = ref(null)
const exportError = ref('')
const jobId       = ref(null)
const jobStatus   = ref('')
const fakeProgress = ref(0)
let pollTimer    = null
let progressTimer = null

const totalGuests = computed(() => exportData.value?.guests?.length || 0)

const stats = computed(() => {
  const g = exportData.value?.guests || []
  return [
    { num: g.length,                                         label: 'כלל האורחים' },
    { num: g.filter(x => x.rsvpStatus === 'confirmed').length, label: 'מאושרים' },
    { num: g.filter(x => x.rsvpStatus === 'pending').length,   label: 'ממתינים' },
    { num: g.filter(x => x.rsvpStatus === 'declined').length,  label: 'סירבו' }
  ]
})

// Template color scheme — use primary pink
const templateStyle = computed(() => ({
  '--card-primary': 'var(--color-primary)',
  '--card-accent':  'var(--color-primary-light)',
  '--card-navy':    'var(--color-navy)'
}))

onMounted(() => loadGuests())
onUnmounted(() => { clearInterval(pollTimer); clearInterval(progressTimer) })

async function loadGuests() {
  loading.value = true
  try {
    // Load guests directly — do NOT trigger export on page load
    const [guestsRes, jobRes] = await Promise.all([
      api.get('/guests'),
      api.get('/cards/export').catch(() => ({ data: { job: null } }))
    ])
    const guestList = guestsRes.data?.guests || []
    exportData.value = { guests: guestList }

    // Restore existing job status if present
    const job = jobRes.data
    if (job && job.jobId) {
      jobId.value     = job.jobId
      jobStatus.value = job.status
      if (job.status === 'ready') fakeProgress.value = 100
      else { animateProgress(); pollStatus() }
    }
  } catch (e) {
    exportError.value = 'שגיאה בטעינת הנתונים'
  } finally {
    loading.value = false
  }
}

async function startExport() {
  if (jobId.value) return
  exporting.value = true
  exportError.value = ''
  fakeProgress.value = 0
  try {
    // POST to explicitly create a new export job — never auto-trigger
    const res = await api.post('/cards/export/start')
    jobId.value     = res.data.jobId
    jobStatus.value = res.data.status
    animateProgress()
    if (res.data.status !== 'ready') pollStatus()
  } catch {
    exportError.value = 'שגיאה בייצוא. אנא נסה שוב.'
  } finally {
    exporting.value = false
  }
}

function animateProgress() {
  clearInterval(progressTimer)
  if (jobStatus.value === 'ready') { fakeProgress.value = 100; return }
  fakeProgress.value = 5
  progressTimer = setInterval(() => {
    if (fakeProgress.value < 90) fakeProgress.value += Math.random() * 8
    if (jobStatus.value === 'ready') { fakeProgress.value = 100; clearInterval(progressTimer) }
  }, 400)
}

function pollStatus() {
  clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    try {
      const res = await api.get(`/cards/export/${jobId.value}`)
      jobStatus.value = res.data.status
      if (res.data.status === 'ready') {
        fakeProgress.value = 100
        clearInterval(pollTimer)
        clearInterval(progressTimer)
      }
    } catch { clearInterval(pollTimer) }
  }, 1500)
}

async function downloadExport() {
  try {
    // Use axios (which attaches JWT via interceptor) to fetch the download
    const res = await api.get(`/cards/export/${jobId.value}/download`, {
      responseType: 'blob'
    })
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invitations-${jobId.value}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch { exportError.value = 'שגיאה בהורדה' }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function statusLabel(s) {
  return { confirmed: 'מגיע ✅', declined: 'לא מגיע ❌', pending: 'ממתין ⏳' }[s] || s
}
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.cards-export { padding: var(--space-6); max-width: 1200px; margin: 0 auto; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title  { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub    { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

/* ── Progress card ───────────────────────────────────────────────────────── */
.export-progress-card { padding: var(--space-5); margin-bottom: var(--space-6); }
.progress-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); gap: var(--space-4); flex-wrap: wrap; }
.progress-info { display: flex; align-items: center; gap: var(--space-3); }
.progress-icon { font-size: 1.5rem; }
.progress-title { font-weight: 700; color: var(--color-navy); }
.progress-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 2px; }
.progress-track { height: 8px; background: var(--color-border); border-radius: var(--radius-full); overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary) 0%, #FF6AC1 100%); border-radius: var(--radius-full); transition: width 0.4s ease; }
.progress-pct { text-align: left; font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-2); }

/* ── Alert ───────────────────────────────────────────────────────────────── */
.alert-error { display: flex; align-items: center; gap: var(--space-2); background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4); font-size: var(--font-size-sm); }

/* ── Stats row ───────────────────────────────────────────────────────────── */
.stats-row { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-6); }
.stat-chip { display: flex; flex-direction: column; align-items: center; background: var(--color-bg-card); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-3) var(--space-5); min-width: 80px; }
.chip-num   { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1; }
.chip-label { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-1); }

/* ── Guest cards grid ────────────────────────────────────────────────────── */
.guests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* ── Card preview ────────────────────────────────────────────────────────── */
.card-preview {
  background: linear-gradient(160deg, #FFF5FB 0%, #FFF0F8 100%);
  border: 1.5px solid var(--color-primary-light);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition);
  aspect-ratio: 3/4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
}
.card-preview:hover { transform: translateY(-4px) rotate(-0.5deg); box-shadow: var(--shadow-pink); }

.preview-header   { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, var(--color-primary), #FF6AC1); }
.preview-hearts   { font-size: 1.2rem; margin-bottom: var(--space-1); }
.preview-couple   { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-navy); letter-spacing: 0.03em; }
.preview-invite   { font-size: 9px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: var(--space-2); }
.preview-guest-name { font-size: var(--font-size-sm); font-weight: 800; color: var(--color-primary); margin-top: var(--space-1); }
.preview-seats    { font-size: 9px; color: var(--color-text-muted); }
.preview-divider  { width: 40px; height: 1px; background: var(--color-primary-light); margin: var(--space-2) auto; }
.preview-date     { font-size: 9px; color: var(--color-navy); font-weight: 600; }
.preview-venue    { font-size: 8px; color: var(--color-text-muted); }
.preview-status-badge {
  position: absolute;
  bottom: var(--space-2);
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.status-confirmed { background: var(--color-success-bg); color: #16A34A; }
.status-declined  { background: var(--color-error-bg); color: #DC2626; }
.status-pending   { background: var(--color-warning-bg); color: #D97706; }

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.card-preview-skel { aspect-ratio: 3/4; border-radius: var(--radius-xl); overflow: hidden; background: var(--color-bg-subtle); display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); }
.skel { border-radius: var(--radius); background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
.skel-card-header { height: 60px; }
.skel-card-name { height: 20px; width: 70%; align-self: center; }
.skel-card-sub { height: 14px; width: 50%; align-self: center; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Transition ──────────────────────────────────────────────────────────── */
.slide-down-enter-active, .slide-down-leave-active { transition: all var(--transition); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 600px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .guests-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
}
</style>
