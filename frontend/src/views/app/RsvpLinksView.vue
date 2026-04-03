<template>
  <div class="rsvp-links fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">🔗 לינקי RSVP</h1>
        <p class="page-subtitle">שתף לינקים לאישור הגעה עם האורחים שלך</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="skel skel-card" />
      <div class="skel skel-card" />
    </div>

    <template v-else>
      <!-- General Link -->
      <div class="link-card card">
        <div class="card-header-row">
          <h2 class="section-title">🌐 לינק כללי</h2>
          <span class="section-hint">לכל האורחים — ללא פרטים ממולאים מראש</span>
        </div>
        <div class="card-body">
          <div class="link-row">
            <div class="link-url">{{ generalLink }}</div>
            <div class="link-actions">
              <button class="btn btn-outline btn-sm" @click="copyLink(generalLink, 'לינק כללי')">📋 העתק</button>
              <button class="btn btn-outline btn-sm btn-wa" @click="shareWhatsApp(generalLink, '')">📱 שתף</button>
              <button class="btn btn-outline btn-sm" @click="showQR(generalLink)">📷 QR</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Group Links -->
      <div class="link-card card" v-if="groups.length > 0">
        <div class="card-header-row">
          <h2 class="section-title">👥 לינקים לפי קבוצה</h2>
          <span class="section-hint">הלינק ימלא את שם הקבוצה אוטומטית בטופס</span>
        </div>
        <div class="card-body groups-list">
          <div v-for="group in groups" :key="group.linkId" class="group-item">
            <div class="group-name">
              <span class="group-icon">{{ groupIcon(group.name) }}</span>
              {{ group.name }}
              <span class="group-id-badge">#{{ group.linkId }}</span>
            </div>
            <div class="link-url group-link-url">{{ groupLink(group) }}</div>
            <div class="link-actions">
              <button class="btn btn-outline btn-sm" @click="copyLink(groupLink(group), group.name)">📋 העתק</button>
              <button class="btn btn-outline btn-sm btn-wa" @click="shareWhatsApp(groupLink(group), group.name)">📱 שתף</button>
            </div>
          </div>
        </div>
      </div>

      <!-- No groups yet -->
      <div v-else class="card empty-groups">
        <div class="card-body empty-body">
          <div class="empty-icon">👥</div>
          <p class="empty-title">עוד אין קבוצות</p>
          <p class="empty-text">הוסף קבוצות לאורחים שלך כדי ליצור לינקים ייעודיים לכל קבוצה</p>
        </div>
      </div>

      <!-- Tips -->
      <div class="tips-card card">
        <div class="card-body">
          <h3 class="tips-title">💡 טיפים לשיתוף</h3>
          <ul class="tips-list">
            <li>שלח לינק אישי לכל אורח מרשימת האורחים (כפתור 🔗)</li>
            <li>שתף לינק כללי בסטטוס WhatsApp לכל המוזמנים</li>
            <li>שלח לינקי קבוצה לגרופים בוואטסאפ (משפחה, חברים...)</li>
            <li>הדפס QR על ההזמנות המודפסות לאישור הגעה נוח</li>
          </ul>
        </div>
      </div>
    </template>

    <!-- QR Modal -->
    <Teleport to="body">
      <div v-if="qrUrl" class="modal-backdrop" @click.self="qrUrl = null">
        <div class="modal qr-modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>📷 קוד QR</h3>
            <button class="btn btn-ghost btn-icon" @click="qrUrl = null">✕</button>
          </div>
          <div class="modal-body qr-body">
            <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`"
              alt="QR Code" class="qr-img" />
            <p class="qr-url">{{ qrUrl }}</p>
            <button class="btn btn-primary" @click="copyLink(qrUrl, 'QR')">📋 העתק לינק</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const BASE_URL = 'https://aware-carries-protecting-bay.trycloudflare.com'

const loading   = ref(true)
const userData  = ref({})
const groups    = ref([])
const qrUrl     = ref(null)
const toast     = ref(null)

const generalLink = computed(() =>
  userData.value.rsvpToken ? `${BASE_URL}/rsvp/${userData.value.rsvpToken}` : ''
)

function groupLink(group) {
  // Use numeric linkId - no group name exposed in URL
  return `${BASE_URL}/rsvp/${group.linkId}`
}

function groupIcon(group) {
  const g = group.toLowerCase()
  if (g.includes('משפחה') || g.includes('family')) return '👨‍👩‍👧'
  if (g.includes('חבר') || g.includes('friend')) return '👫'
  if (g.includes('עבודה') || g.includes('work')) return '💼'
  if (g.includes('חתן')) return '🤵'
  if (g.includes('כלה') || g.includes('bride')) return '👰'
  return '👥'
}

async function copyLink(url, label) {
  try {
    await navigator.clipboard.writeText(url)
    showToast(`${label ? label + ' — ' : ''}הלינק הועתק! ✅`, 'success')
  } catch {
    showToast('שגיאה בהעתקה', 'error')
  }
}

function shareWhatsApp(url, label) {
  const text = `הגעתם? ${label ? `(${label}) ` : ''}לאישור הגעה לחתונה שלנו:\n${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function showQR(url) {
  qrUrl.value = url
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

onMounted(async () => {
  try {
    const [me, grps] = await Promise.all([
      api.get('/auth/me'),
      api.get('/rsvp/groups')
    ])
    userData.value = me.data
    groups.value   = grps.data
  } catch (e) {
    console.error('Failed to load RSVP links data', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rsvp-links { padding: var(--space-4) 0; display: flex; flex-direction: column; gap: var(--space-5); }

.page-header { margin-bottom: 0; }
.page-title   { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); line-height: 1.2; }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

/* Card header */
.link-card { overflow: visible; }
.card-header-row {
  display: flex; align-items: baseline; gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0; }
.section-hint  { font-size: var(--font-size-xs); color: var(--color-text-muted); }

/* Link row */
.link-row {
  display: flex; align-items: center; gap: var(--space-4);
  flex-wrap: wrap;
}
.link-url {
  flex: 1; font-size: var(--font-size-sm); font-family: monospace;
  color: var(--color-primary); background: var(--color-primary-bg);
  border-radius: var(--radius); padding: var(--space-2) var(--space-3);
  word-break: break-all; direction: ltr; text-align: left;
  min-width: 0;
}
.link-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.btn-wa:hover { color: #25D366 !important; border-color: #25D366 !important; }

/* Groups */
.groups-list { display: flex; flex-direction: column; gap: var(--space-4); }
.group-id-badge {
  display: inline-flex;
  align-items: center;
  background: var(--color-bg-subtle, #F5F0EB);
  color: var(--color-text-muted, #6B7280);
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 8px;
  margin-right: 6px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.group-item {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.group-item:last-child { border-bottom: none; padding-bottom: 0; }
.group-name {
  display: flex; align-items: center; gap: var(--space-2);
  font-weight: 700; color: var(--color-navy);
  min-width: 100px; font-size: var(--font-size-sm);
}
.group-icon { font-size: 1.3rem; }
.group-link-url {
  flex: 1; font-size: var(--font-size-xs);
}

/* Empty groups */
.empty-groups .empty-body { text-align: center; padding: var(--space-8); }
.empty-icon  { font-size: 3rem; margin-bottom: var(--space-3); }
.empty-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin: 0 0 var(--space-2); }
.empty-text  { font-size: var(--font-size-sm); color: var(--color-text-muted); margin: 0; }

/* Tips */
.tips-card .card-body { padding: var(--space-5); }
.tips-title { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin: 0 0 var(--space-3); }
.tips-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.tips-list li { font-size: var(--font-size-sm); color: var(--color-text-muted); padding-right: var(--space-2); }
.tips-list li::before { content: '•'; color: var(--color-primary); margin-left: var(--space-2); }

/* Skeletons */
.loading-state { display: flex; flex-direction: column; gap: var(--space-4); }
.skel-card { height: 140px; border-radius: var(--radius-xl); }
.skel {
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* QR Modal */
.qr-modal { max-width: 340px; }
.qr-body  { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-6); }
.qr-img   { width: 250px; height: 250px; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
.qr-url   { font-size: var(--font-size-xs); color: var(--color-text-muted); word-break: break-all; text-align: center; direction: ltr; }

/* Modal base */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: var(--color-overlay);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4); backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-card); border-radius: var(--radius-2xl);
  width: 100%; box-shadow: var(--shadow-xl);
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border);
}
.modal-header h3 { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }

/* Toast */
.toast {
  position: fixed; bottom: var(--space-8); left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px; border-radius: var(--radius-full);
  font-size: var(--font-size-sm); font-weight: 700;
  z-index: 2000; box-shadow: var(--shadow-lg); color: #fff; white-space: nowrap;
}
.toast.success { background: var(--color-success); }
.toast.error   { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

/* Responsive */
@media (max-width: 600px) {
  .link-row { flex-direction: column; align-items: flex-start; }
  .group-item { flex-direction: column; align-items: flex-start; }
  .group-link-url { width: 100%; }
}
</style>
