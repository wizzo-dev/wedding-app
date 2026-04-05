<template>
  <div class="invitations-list fade-in" dir="rtl">
    <div class="page-header">
      <div>
        <h1 class="page-title">הזמנות 💌</h1>
        <p class="page-sub">נהל את הזמנות החתונה שלך</p>
      </div>
      <RouterLink to="/app/invitations/new" class="btn btn-primary">
        + צור הזמנה חדשה
      </RouterLink>
    </div>

    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-card card card-body">
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadInvitations">נסה שוב</button>
    </div>

    <div v-else-if="invitations.length === 0" class="empty-state card card-body">
      <div class="empty-icon">💌</div>
      <h3>עדיין אין הזמנות</h3>
      <p>צור את ההזמנה הראשונה שלך עכשיו!</p>
      <RouterLink to="/app/invitations/new" class="btn btn-primary">
        + צור הזמנה חדשה
      </RouterLink>
    </div>

    <div v-else class="invitations-grid">
      <div
        v-for="inv in invitations"
        :key="inv.id"
        class="invitation-card card"
      >
        <div class="inv-thumb">
          <img
            :src="inv.template.imageUrl"
            :alt="inv.template.name"
            loading="lazy"
          />
          <div class="inv-overlay">
            <div class="couple-names">
              <span>{{ inv.fields.groomName || 'החתן' }}</span>
              <span class="amp">&amp;</span>
              <span>{{ inv.fields.brideName || 'הכלה' }}</span>
            </div>
          </div>
        </div>
        <div class="inv-body card-body">
          <div class="inv-meta">
            <div class="inv-template-name">{{ inv.template.name }}</div>
            <div class="inv-date" v-if="inv.fields.date">{{ formatDate(inv.fields.date) }}</div>
          </div>
          <div class="inv-venue" v-if="inv.fields.venue">📍 {{ inv.fields.venue }}</div>
          <div class="inv-actions">
            <RouterLink :to="`/app/invitations/edit/${inv.id}`" class="btn btn-sm btn-outline">
              ✏️ ערוך
            </RouterLink>
            <button class="btn btn-sm btn-outline" @click="downloadPdf(inv.id)" :disabled="downloading === inv.id">
              <span v-if="downloading === inv.id">⏳</span>
              <span v-else>📥 הורד</span>
            </button>
            <button class="btn btn-sm btn-outline" @click="copyShareLink(inv.id)">
              🔗 שתף
            </button>
            <button class="btn btn-sm btn-danger-outline" @click="confirmDelete(inv)">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <div class="modal card card-body">
        <h3>מחיקת הזמנה</h3>
        <p>האם למחוק את ההזמנה של {{ deleteTarget.fields.groomName || '' }} ו-{{ deleteTarget.fields.brideName || '' }}?</p>
        <div class="modal-actions">
          <button class="btn btn-outline" @click="deleteTarget = null">ביטול</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="deleting">
            {{ deleting ? '...' : 'מחק' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'

const invitations = ref([])
const loading = ref(true)
const error = ref(null)
const downloading = ref(null)
const deleteTarget = ref(null)
const deleting = ref(false)
const toast = ref(null)

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

async function loadInvitations() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/invitations')
    invitations.value = res.data
  } catch (e) {
    error.value = 'שגיאה בטעינת ההזמנות'
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

async function downloadPdf(id) {
  downloading.value = id
  try {
    const res = await api.get(`/invitations/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `invitation-${id}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('ההזמנה הורדה בהצלחה!')
  } catch {
    showToast('שגיאה בהורדה', 'error')
  } finally {
    downloading.value = null
  }
}

function copyShareLink(id) {
  const url = `${window.location.origin}/invitation/${id}`
  navigator.clipboard.writeText(url).then(() => {
    showToast('הקישור הועתק! 🎉')
  }).catch(() => {
    showToast('שגיאה בהעתקה', 'error')
  })
}

function confirmDelete(inv) {
  deleteTarget.value = inv
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/invitations/${deleteTarget.value.id}`)
    invitations.value = invitations.value.filter(i => i.id !== deleteTarget.value.id)
    showToast('ההזמנה נמחקה')
    deleteTarget.value = null
  } catch {
    showToast('שגיאה במחיקה', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(loadInvitations)
</script>

<style scoped>
.invitations-list { padding-bottom: var(--space-8); }

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

.invitations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.invitation-card {
  overflow: hidden;
  transition: transform var(--transition);
}
.invitation-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.inv-thumb {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.inv-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.invitation-card:hover .inv-thumb img { transform: scale(1.05); }

.inv-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  padding: var(--space-3);
}

.couple-names {
  color: #fff;
  font-size: var(--font-size-lg);
  font-weight: 700;
  display: flex;
  gap: var(--space-2);
  align-items: center;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.amp { color: var(--color-primary); font-size: 1.2em; }

.inv-body { padding: var(--space-4); }

.inv-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.inv-template-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.inv-date { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.inv-venue { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-3); }

.inv-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.btn-sm { padding: 4px 10px; font-size: var(--font-size-xs); }
.btn-danger-outline {
  border: 1px solid rgba(255,100,100,0.4);
  color: #e55;
  background: transparent;
  border-radius: var(--radius);
  cursor: pointer;
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.btn-danger-outline:hover { background: rgba(255,100,100,0.1); }
.btn-danger { background: #e55; color: #fff; border: none; }

.empty-state {
  text-align: center;
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}
.empty-icon { font-size: 3rem; }
.empty-state h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.empty-state p { color: var(--color-text-muted); }

.loading-center { display: flex; justify-content: center; padding: var(--space-12); }

.error-card { text-align: center; padding: var(--space-8); }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 500;
}
.modal {
  max-width: 420px;
  width: 90%;
  padding: var(--space-6);
}
.modal h3 { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: var(--space-3); }
.modal p { color: var(--color-text-muted); margin-bottom: var(--space-5); }
.modal-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }

/* Toast */
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  z-index: 9999;
  box-shadow: var(--shadow-lg);
  animation: slide-up 0.3s ease;
}
.toast.error { background: #e55; }
@keyframes slide-up {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
