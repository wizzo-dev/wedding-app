<template>
  <div class="view-placeholder fade-in">
    <h1>ספק</h1>
    <p style="color:var(--color-text-muted)">בבנייה... 🚧</p>
    <!-- implemented by freddy: 2026-04-02T23:23:00Z -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const vendor = ref(null)
const myVendor = ref(null)
const loading = ref(false)
const error = ref(null)
const adding = ref(false)
const editStatus = ref('considering')
const editPrice = ref('')
const editNotes = ref('')

async function load() {
  loading.value = true; error.value = null
  try {
    const res = await fetch(`/api/vendors/${route.params.id}`, {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
    if (!res.ok) throw new Error('ספק לא נמצא')
    const data = await res.json()
    vendor.value = data
    if (data.myVendor) {
      myVendor.value = data.myVendor
      editStatus.value = data.myVendor.status || 'considering'
      editPrice.value = data.myVendor.priceAgreed || ''
      editNotes.value = data.myVendor.notes || ''
    }
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}

async function addToMine() {
  adding.value = true
  try {
    const res = await fetch('/api/vendors/user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: vendor.value.id })
    })
    if (!res.ok) throw new Error('שגיאה')
    const data = await res.json()
    myVendor.value = data
    editStatus.value = 'considering'
  } catch (e) { alert(e.message) }
  finally { adding.value = false }
}

async function updateStatus() {
  if (!myVendor.value) return
  try {
    await fetch(`/api/vendors/user/${myVendor.value.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: editStatus.value, priceAgreed: parseFloat(editPrice.value) || null, notes: editNotes.value })
    })
  } catch (e) { console.error(e) }
}

async function removeFromMine() {
  if (!confirm('להסיר ספק זה מהרשימה שלך?')) return
  try {
    await fetch(`/api/vendors/user/${myVendor.value.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` }
    })
    myVendor.value = null
  } catch (e) { alert(e.message) }
}

function catIcon(cat) {
  return { 'קייטרינג':'🍽️', 'צילום':'📷', 'להקה':'🎵', 'פרחים':'🌸', 'אולם':'🏛️' }[cat] || '📋'
}
function statusLabel(s) {
  return { considering:'בודק', negotiating:'במשא ומתן', booked:'סגרתי' }[s] || s
}

onMounted(load)
</script>

<style scoped>
.vendor-view { max-width: 900px; margin: 0 auto; padding: var(--space-6); }
.back-btn { background: none; border: none; color: var(--color-primary); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; margin-bottom: var(--space-5); padding: 0; }

.center-state { text-align: center; padding: var(--space-12); color: var(--color-text-muted); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto var(--space-4); }
@keyframes spin { to { transform: rotate(360deg); } }

.vendor-hero { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); margin-bottom: var(--space-6); display: flex; align-items: center; gap: var(--space-5); position: relative; border: 2px solid transparent; }
.vendor-hero.featured { border-color: var(--color-primary); }
.featured-badge { position: absolute; top: -1px; right: var(--space-5); background: var(--color-primary); color: #fff; font-size: var(--font-size-xs); font-weight: 700; padding: 2px 12px; border-radius: 0 0 var(--radius-sm) var(--radius-sm); }
.hero-icon { font-size: 3rem; background: var(--color-primary-bg); border-radius: var(--radius-xl); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-cat { font-size: var(--font-size-xs); color: var(--color-primary); font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 4px; }
.hero-name { font-size: var(--font-size-3xl); font-weight: 900; color: var(--color-navy); margin: 0 0 var(--space-3); }
.hero-meta { display: flex; gap: var(--space-4); font-size: var(--font-size-sm); color: var(--color-text-muted); flex-wrap: wrap; }

.vendor-body { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-6); }
.info-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-3); }
.vendor-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.7; }

.contact-list { display: flex; flex-direction: column; gap: var(--space-2); }
.contact-row { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; color: var(--color-navy); font-size: var(--font-size-sm); padding: var(--space-2); border-radius: var(--radius); transition: background var(--transition-fast); }
.contact-row:hover { background: var(--color-bg-subtle); }
.contact-icon { font-size: 1.2rem; }

.status-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); position: sticky; top: 80px; }
.status-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-4); }
.not-added p { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-3); }
.added-state { display: flex; flex-direction: column; gap: var(--space-3); }
.status-row { display: flex; flex-direction: column; gap: 4px; }
.status-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.status-select { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg-card); color: var(--color-navy); cursor: pointer; }
.price-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); }
.notes-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); resize: vertical; }
.status-badge-wrap { text-align: center; }
.my-status-badge { display: inline-block; padding: 4px 14px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.my-status-badge.booked { background: var(--color-success-bg); color: #065f46; }
.my-status-badge.negotiating { background: var(--color-warning-bg); color: #92400e; }
.my-status-badge.considering { background: var(--color-info-bg); color: #1e40af; }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-full { width: 100%; justify-content: center; }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-danger { background: var(--color-error-bg); color: var(--color-error); border: 1px solid var(--color-error); }
.btn-danger:hover { background: var(--color-error); color: #fff; }

@media (max-width: 768px) {
  .vendor-view { padding: var(--space-4); }
  .vendor-body { grid-template-columns: 1fr; }
  .vendor-hero { flex-direction: column; text-align: center; }
  .hero-meta { justify-content: center; }
}
</style>
