<template>
  <div class="guest-card-page fade-in" dir="rtl">

    <div v-if="loading" class="guest-loading">
      <div class="skeleton" style="height:80px;border-radius:16px;"></div>
      <div class="skeleton" style="height:400px;border-radius:16px;margin-top:1rem;"></div>
    </div>

    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">{{ error }}</p>
      <router-link to="/app/guests" class="btn btn-primary">חזור לאורחים</router-link>
    </div>

    <template v-else>
      <!-- Page header -->
      <div class="guest-page-header">
        <button class="btn btn-ghost btn-sm" @click="$router.push('/app/guests')">← חזור לרשימת אורחים</button>
        <h1 class="guest-page-title">
          {{ isNew ? '➕ אורח חדש' : ('✏️ עריכת אורח: ' + (form.name || '')) }}
        </h1>
        <div style="display:flex;gap:var(--space-3);">
          <a v-if="form.phone && !isNew" :href="`https://wa.me/972${form.phone.replace(/^0/, '')}`" target="_blank" class="btn btn-outline btn-sm">💬 WhatsApp</a>
          <button v-if="!isNew" class="btn btn-ghost btn-sm" style="color:var(--color-error)" @click="confirmDelete">🗑️ מחק אורח</button>
        </div>
      </div>

      <!-- Form -->
      <div class="guest-form-card card">
        <div class="card-body">
          <div class="form-section">
            <h2 class="form-section-title">פרטים אישיים</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="label">שם מלא *</label>
                <input v-model="form.name" class="input" :class="{ 'input-error': errors.name }" placeholder="ישראל ישראלי" />
                <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
              </div>
              <div class="form-group">
                <label class="label">טלפון</label>
                <input v-model="form.phone" class="input" placeholder="050-0000000" type="tel" />
              </div>
              <div class="form-group">
                <label class="label">אימייל</label>
                <input v-model="form.email" class="input" type="email" placeholder="israel@example.com" />
              </div>
              <div class="form-group">
                <label class="label">קבוצה</label>
                <select v-model="form.groupName" class="input">
                  <option value="">בחר קבוצה</option>
                  <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-section">
            <h2 class="form-section-title">פרטי הגעה</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="label">סטטוס RSVP</label>
                <div class="rsvp-selector">
                  <button v-for="opt in rsvpOptions" :key="opt.value" class="rsvp-opt" :class="[opt.cls, { active: form.rsvpStatus === opt.value }]" @click="form.rsvpStatus = opt.value">
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label class="label">מספר מגיעים</label>
                <div class="num-people-input">
                  <button class="btn btn-outline btn-icon btn-sm" @click="form.numPeople = Math.max(1, form.numPeople - 1)">−</button>
                  <input v-model.number="form.numPeople" type="number" min="1" class="input num-input" />
                  <button class="btn btn-outline btn-icon btn-sm" @click="form.numPeople++">+</button>
                </div>
              </div>
              <div class="form-group">
                <label class="label">סכום מתנה (₪)</label>
                <input v-model.number="form.giftAmount" class="input" type="number" min="0" placeholder="0" />
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-section">
            <h2 class="form-section-title">הערות</h2>
            <div class="form-group">
              <textarea v-model="form.notes" class="input notes-textarea" rows="3" placeholder="הערות, הגבלות תזונה, בקשות מיוחדות..."></textarea>
            </div>
          </div>

          <p v-if="saveError" class="form-error" style="margin-bottom: var(--space-4);">{{ saveError }}</p>
          <div class="form-actions">
            <button class="btn btn-ghost" @click="$router.push('/app/guests')">ביטול</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              {{ saving ? 'שומר...' : (isNew ? 'הוסף אורח' : 'שמור שינויים') }}
            </button>
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="!isNew && guest" class="history-section card" style="margin-top: var(--space-5);">
        <div class="card-body">
          <h2 class="form-section-title" style="margin-bottom: var(--space-4);">📅 היסטוריה</h2>
          <div class="history-list">
            <div class="history-item">
              <span class="history-icon">➕</span>
              <div class="history-info">
                <span class="history-label">אורח נוסף</span>
                <span class="history-date">{{ formatDate(guest.createdAt) }}</span>
              </div>
            </div>
            <div v-if="guest.updatedAt !== guest.createdAt" class="history-item">
              <span class="history-icon">✏️</span>
              <div class="history-info">
                <span class="history-label">עודכן לאחרונה</span>
                <span class="history-date">{{ formatDate(guest.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Delete confirm modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-box card pop-in" style="max-width:400px;">
        <div class="modal-body" style="padding: var(--space-8); text-align: center;">
          <div style="font-size: 3rem; margin-bottom: var(--space-4);">🗑️</div>
          <h3 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-2);">מחיקת אורח</h3>
          <p style="color: var(--color-text-muted); margin-bottom: var(--space-6);">
            האם למחוק את <strong>{{ form.name }}</strong>? פעולה זו לא ניתנת לביטול.
          </p>
          <div style="display:flex;gap:var(--space-3);justify-content:center;">
            <button class="btn btn-ghost" @click="showDeleteModal = false">ביטול</button>
            <button class="btn btn-secondary" style="background: var(--color-error);" :disabled="deleting" @click="doDelete">
              {{ deleting ? 'מוחק...' : 'כן, מחק' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route    = useRoute()
const router   = useRouter()
const loading  = ref(true)
const error    = ref('')
const guest    = ref(null)
const saving   = ref(false)
const deleting = ref(false)
const saveError = ref('')
const showDeleteModal = ref(false)
const errors   = ref({})
const isNew    = computed(() => route.name === 'GuestNew' || !route.params.id)
const form     = ref({ name: '', phone: '', email: '', groupName: '', numPeople: 1, rsvpStatus: 'pending', giftAmount: null, notes: '' })
const groups   = ['משפחת החתן', 'משפחת הכלה', 'חברים', 'עבודה', 'אחר']
const rsvpOptions = [
  { value: 'pending',   label: 'ממתין ⏳',  cls: 'rsvp-opt-pending' },
  { value: 'confirmed', label: 'מגיע ✅',    cls: 'rsvp-opt-confirmed' },
  { value: 'maybe',     label: 'לא בטוח 🤔', cls: 'rsvp-opt-maybe' },
  { value: 'declined',  label: 'לא מגיע ❌', cls: 'rsvp-opt-declined' }
]

onMounted(async () => {
  if (isNew.value) { loading.value = false; return }
  try {
    const res = await api.get(`/guests/${route.params.id}`)
    guest.value = res.data
    form.value = {
      name:       res.data.name       || '',
      phone:      res.data.phone      || '',
      email:      res.data.email      || '',
      groupName:  res.data.groupName  || '',
      numPeople:  res.data.numPeople  || 1,
      rsvpStatus: res.data.rsvpStatus || 'pending',
      giftAmount: res.data.giftAmount ?? null,
      notes:      res.data.notes      || ''
    }
  } catch (e) {
    error.value = e?.response?.status === 404 ? 'אורח לא נמצא' : 'שגיאה בטעינה'
  } finally { loading.value = false }
})

async function save() {
  saveError.value = ''
  errors.value    = {}
  if (!form.value.name?.trim()) { errors.value.name = 'שם חובה'; return }
  saving.value = true
  try {
    const payload = {
      name:       form.value.name.trim(),
      phone:      form.value.phone      || undefined,
      email:      form.value.email      || undefined,
      groupName:  form.value.groupName  || undefined,
      numPeople:  form.value.numPeople  || 1,
      rsvpStatus: form.value.rsvpStatus,
      giftAmount: form.value.giftAmount ?? undefined,
      notes:      form.value.notes      || undefined
    }
    if (isNew.value) { await api.post('/guests', payload) }
    else             { await api.put(`/guests/${route.params.id}`, payload) }
    router.push('/app/guests')
  } catch (e) {
    saveError.value = e?.response?.data?.message || 'שגיאה בשמירה'
  } finally { saving.value = false }
}

function confirmDelete() { showDeleteModal.value = true }
async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/guests/${route.params.id}`)
    router.push('/app/guests')
  } catch (e) {
    saveError.value = e?.response?.data?.message || 'שגיאה במחיקה'
    showDeleteModal.value = false
  } finally { deleting.value = false }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('he-IL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.guest-card-page { padding: var(--space-6) var(--space-8); max-width: 760px; margin: 0 auto; }
.guest-loading { display: flex; flex-direction: column; gap: var(--space-4); }
.guest-page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.guest-page-title { font-size: var(--font-size-xl); font-weight: 900; color: var(--color-navy); flex: 1; }
.form-section { margin-bottom: var(--space-2); }
.form-section-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-4); }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
.rsvp-selector { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.rsvp-opt { padding: 8px var(--space-4); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; border: 1.5px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-muted); transition: all var(--transition-fast); white-space: nowrap; }
.rsvp-opt-confirmed.active { background: var(--color-success-bg); border-color: var(--color-success); color: #16A34A; }
.rsvp-opt-maybe.active     { background: var(--color-warning-bg); border-color: var(--color-warning); color: #D97706; }
.rsvp-opt-declined.active  { background: var(--color-error-bg);   border-color: var(--color-error);   color: #DC2626; }
.rsvp-opt-pending.active   { background: var(--color-bg-subtle);  border-color: var(--color-navy-light); color: var(--color-text); }
.rsvp-opt:hover { border-color: var(--color-primary); }
.num-people-input { display: flex; align-items: center; gap: var(--space-2); }
.num-input { text-align: center; max-width: 80px; flex: 1; }
.notes-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
.form-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }
.history-list { display: flex; flex-direction: column; gap: var(--space-3); }
.history-item { display: flex; align-items: center; gap: var(--space-3); }
.history-icon { font-size: 1.2rem; }
.history-info { display: flex; flex-direction: column; gap: 2px; }
.history-label { font-size: var(--font-size-sm); font-weight: 600; }
.history-date { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.modal-overlay { position: fixed; inset: 0; background: rgba(26,31,54,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal-box { width: 100%; }
@media (max-width: 600px) {
  .guest-card-page { padding: var(--space-4); }
  .form-grid { grid-template-columns: 1fr; }
  .guest-page-header { flex-direction: column; align-items: flex-start; }
}
</style>