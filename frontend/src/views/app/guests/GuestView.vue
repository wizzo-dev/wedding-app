<template>
  <div class="guest-view fade-in" dir="rtl">

    <!-- Loading -->
    <template v-if="loading">
      <div class="skeleton skeleton-hero" style="height:160px;border-radius:20px;"></div>
      <div class="skeleton" style="height:400px;border-radius:16px;margin-top:24px;"></div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="$router.push('/app/guests')">חזרה לרשימה</button>
    </div>

    <template v-else-if="guest">
      <!-- Back -->
      <div class="back-row">
        <button class="btn-back" @click="$router.push('/app/guests')">← חזרה לאורחים</button>
      </div>

      <!-- Hero card -->
      <div class="hero-card">
        <div class="hero-avatar" :style="{ background: avatarColor(guest.name) }">
          {{ initials(guest.name) }}
        </div>
        <div class="hero-info">
          <h1 class="hero-name">{{ guest.name }}</h1>
          <div class="hero-meta">
            <span class="side-badge" :class="sideCls(guest.side)">{{ guest.side }}</span>
            <span class="rsvp-badge" :class="rsvpCls(guest.rsvpStatus)">{{ rsvpLabel(guest.rsvpStatus) }}</span>
            <span v-if="guest.tableName" class="table-badge">🪑 {{ guest.tableName }}</span>
          </div>
          <div class="hero-contact">
            <a v-if="guest.phone" :href="`tel:${guest.phone}`" class="contact-link phone">
              📞 {{ guest.phone }}
            </a>
            <a v-if="guest.phone" :href="`https://wa.me/972${guest.phone.replace(/^0/,'')}`" target="_blank" class="contact-link wa">
              💬 WhatsApp
            </a>
            <a v-if="guest.email" :href="`mailto:${guest.email}`" class="contact-link email">
              ✉️ {{ guest.email }}
            </a>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-outline" @click="editing = !editing">
            {{ editing ? '✕ סגור' : '✏️ ערוך' }}
          </button>
          <button class="btn btn-danger-outline" @click="showDelete = true">
            🗑️ מחק
          </button>
        </div>
      </div>

      <!-- Edit form -->
      <div v-if="editing" class="edit-section">
        <div class="section-title">עריכת פרטי אורח</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">שם מלא *</label>
            <input v-model="form.name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">טלפון</label>
            <input v-model="form.phone" type="tel" class="form-input" dir="ltr" />
          </div>
          <div class="form-group">
            <label class="form-label">מייל</label>
            <input v-model="form.email" type="email" class="form-input" dir="ltr" />
          </div>
          <div class="form-group">
            <label class="form-label">קבוצה</label>
            <input v-model="form.groupName" type="text" class="form-input" placeholder="משפחה, חברים..." />
          </div>
          <div class="form-group">
            <label class="form-label">צד</label>
            <select v-model="form.side" class="form-input">
              <option value="חתן">חתן</option>
              <option value="כלה">כלה</option>
              <option value="משותף">משותף</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">סטטוס RSVP</label>
            <select v-model="form.rsvpStatus" class="form-input">
              <option value="pending">ממתין</option>
              <option value="confirmed">מגיע</option>
              <option value="declined">לא מגיע</option>
              <option value="maybe">אולי</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">מספר נפשות</label>
            <input v-model.number="form.numPeople" type="number" class="form-input" min="1" max="20" />
          </div>
          <div class="form-group">
            <label class="form-label">מתנה (₪)</label>
            <input v-model.number="form.giftAmount" type="number" class="form-input" min="0" placeholder="0" />
          </div>
          <div class="form-group span-2">
            <label class="form-label">הערות</label>
            <textarea v-model="form.notes" class="form-input form-textarea" rows="3" placeholder="הערות נוספות..."></textarea>
          </div>
        </div>
        <div class="form-footer">
          <button class="btn btn-outline" @click="editing = false">ביטול</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'שומר...' : 'שמור שינויים' }}
          </button>
        </div>
      </div>

      <!-- Info cards (read-only when not editing) -->
      <div v-if="!editing" class="info-grid">

        <!-- Contact info -->
        <div class="info-card">
          <div class="info-card-title">📋 פרטי קשר</div>
          <div class="info-row">
            <span class="info-label">שם</span>
            <span class="info-val">{{ guest.name }}</span>
          </div>
          <div class="info-row" v-if="guest.phone">
            <span class="info-label">טלפון</span>
            <a :href="`tel:${guest.phone}`" class="info-val link">{{ guest.phone }}</a>
          </div>
          <div class="info-row" v-if="guest.email">
            <span class="info-label">מייל</span>
            <a :href="`mailto:${guest.email}`" class="info-val link">{{ guest.email }}</a>
          </div>
          <div class="info-row" v-if="guest.groupName">
            <span class="info-label">קבוצה</span>
            <span class="info-val">{{ guest.groupName }}</span>
          </div>
        </div>

        <!-- Wedding info -->
        <div class="info-card">
          <div class="info-card-title">💍 פרטי חתונה</div>
          <div class="info-row">
            <span class="info-label">צד</span>
            <span class="side-badge" :class="sideCls(guest.side)">{{ guest.side }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">RSVP</span>
            <span class="rsvp-badge large" :class="rsvpCls(guest.rsvpStatus)">{{ rsvpLabel(guest.rsvpStatus) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">נפשות</span>
            <span class="info-val">{{ guest.numPeople }}</span>
          </div>
          <div class="info-row" v-if="guest.tableName">
            <span class="info-label">שולחן</span>
            <span class="info-val">{{ guest.tableName }}</span>
          </div>
        </div>

        <!-- Gift + notes -->
        <div class="info-card">
          <div class="info-card-title">🎁 מתנה והערות</div>
          <div class="info-row">
            <span class="info-label">מתנה</span>
            <span class="info-val gift" v-if="guest.giftAmount">
              ₪{{ Number(guest.giftAmount).toLocaleString('he-IL') }}
            </span>
            <span class="info-val muted" v-else>לא צוין</span>
          </div>
          <div class="notes-block" v-if="guest.notes">
            <span class="info-label">הערות</span>
            <p class="notes-text">{{ guest.notes }}</p>
          </div>
          <div class="notes-block" v-else>
            <span class="muted-sm">אין הערות</span>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="info-card quick-actions-card">
          <div class="info-card-title">⚡ פעולות מהירות</div>
          <div class="quick-actions">
            <a v-if="guest.phone"
               :href="`https://wa.me/972${guest.phone.replace(/^0/,'')}`"
               target="_blank"
               class="quick-btn wa"
            >
              <span>💬</span>
              <span>שלח WhatsApp</span>
            </a>
            <a v-if="guest.phone" :href="`tel:${guest.phone}`" class="quick-btn call">
              <span>📞</span>
              <span>התקשר</span>
            </a>
            <a v-if="guest.email" :href="`mailto:${guest.email}`" class="quick-btn mail">
              <span>✉️</span>
              <span>שלח מייל</span>
            </a>
            <button class="quick-btn edit" @click="editing = true">
              <span>✏️</span>
              <span>ערוך</span>
            </button>
          </div>

          <!-- Quick RSVP buttons -->
          <div class="info-card-title" style="margin-top:var(--space-4)">עדכן RSVP</div>
          <div class="rsvp-btns">
            <button
              v-for="s in RSVP_OPTIONS"
              :key="s.val"
              class="rsvp-quick-btn"
              :class="[s.cls, { active: guest.rsvpStatus === s.val }]"
              @click="quickRsvp(s.val)"
            >{{ s.label }}</button>
          </div>
        </div>

      </div>

      <!-- Timestamps -->
      <div class="timestamps" v-if="!editing">
        <span>נוצר: {{ fmtDate(guest.createdAt) }}</span>
        <span>עודכן: {{ fmtDate(guest.updatedAt) }}</span>
      </div>
    </template>

    <!-- ── Confirm Delete ──────────────────────────────────────────────────────── -->
    <teleport to="body">
      <div v-if="showDelete" class="modal-overlay" @click.self="showDelete = false">
        <div class="modal">
          <div class="modal-header">
            <h3>מחיקת אורח</h3>
            <button class="modal-close" @click="showDelete = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="delete-warn">⚠️</div>
            <p>האם למחוק את <strong>{{ guest?.name }}</strong> מרשימת האורחים?</p>
            <p class="warn-text">פעולה זו לא ניתנת לביטול.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showDelete = false">ביטול</button>
            <button class="btn btn-danger" :disabled="saving" @click="deleteGuest">
              {{ saving ? 'מוחק...' : 'מחק לצמיתות' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const guestId = Number(route.params.id)

const RSVP_OPTIONS = [
  { val: 'confirmed', label: '✓ מגיע', cls: 'opt-confirmed' },
  { val: 'declined',  label: '✗ לא מגיע', cls: 'opt-declined' },
  { val: 'maybe',     label: '? אולי', cls: 'opt-maybe' },
  { val: 'pending',   label: '… ממתין', cls: 'opt-pending' }
]

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const editing = ref(false)
const showDelete = ref(false)

const guest = ref(null)
const form = ref({})

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await api.get(`/guests/${guestId}`)
    guest.value = res.data
    initForm()
  } catch (e) {
    if (e.response?.status === 404) {
      error.value = 'אורח לא נמצא'
    } else {
      error.value = e.response?.data?.message || 'שגיאה בטעינה'
    }
  } finally {
    loading.value = false
  }
}

function initForm() {
  if (!guest.value) return
  form.value = {
    name: guest.value.name,
    phone: guest.value.phone || '',
    email: guest.value.email || '',
    groupName: guest.value.groupName || '',
    side: guest.value.side,
    rsvpStatus: guest.value.rsvpStatus,
    numPeople: guest.value.numPeople,
    giftAmount: guest.value.giftAmount || null,
    notes: guest.value.notes || ''
  }
}

async function save() {
  if (!form.value.name?.trim()) { alert('שם אורח נדרש'); return }
  saving.value = true
  try {
    const res = await api.put(`/guests/${guestId}`, {
      name: form.value.name,
      phone: form.value.phone || null,
      email: form.value.email || null,
      groupName: form.value.groupName || null,
      side: form.value.side,
      rsvpStatus: form.value.rsvpStatus,
      numPeople: form.value.numPeople,
      giftAmount: form.value.giftAmount || null,
      notes: form.value.notes || null
    })
    guest.value = { ...guest.value, ...res.data }
    editing.value = false
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בשמירה')
  } finally {
    saving.value = false
  }
}

async function quickRsvp(status) {
  saving.value = true
  try {
    await api.patch(`/guests/${guestId}/rsvp`, { rsvpStatus: status })
    guest.value.rsvpStatus = status
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בעדכון')
  } finally {
    saving.value = false
  }
}

async function deleteGuest() {
  saving.value = true
  try {
    await api.delete(`/guests/${guestId}`)
    router.push('/app/guests')
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה במחיקה')
    saving.value = false
    showDelete.value = false
  }
}

// Helpers
const AVATAR_COLORS = ['#E91E8C','#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2','#9333EA']
function avatarColor(name) {
  let hash = 0
  for (let c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xFFFF
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
function initials(name) {
  return (name || '').trim().split(' ').slice(0, 2).map(w => w[0]).join('')
}
function sideCls(side) {
  return { 'חתן': 'side-groom', 'כלה': 'side-bride', 'משותף': 'side-both' }[side] || ''
}
function rsvpCls(s) {
  return { confirmed: 'rsvp-confirmed', declined: 'rsvp-declined', maybe: 'rsvp-maybe', pending: 'rsvp-pending' }[s] || 'rsvp-pending'
}
function rsvpLabel(s) {
  return { confirmed: '✓ מגיע', declined: '✗ לא מגיע', maybe: '? אולי', pending: '⏳ ממתין' }[s] || s
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(load)
</script>

<style scoped>
.guest-view { padding: var(--space-6); max-width: 900px; }

.back-row { margin-bottom: var(--space-4); }
.btn-back { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); padding: var(--space-1) 0; }
.btn-back:hover { text-decoration: underline; }

/* Hero */
.hero-card { display: flex; gap: var(--space-5); align-items: flex-start; background: linear-gradient(135deg, var(--color-navy) 0%, #2D3454 100%); border-radius: var(--radius-2xl); padding: var(--space-6); margin-bottom: var(--space-5); color: #fff; flex-wrap: wrap; }
.hero-avatar { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 800; flex-shrink: 0; border: 3px solid rgba(255,255,255,.3); }
.hero-info { flex: 1; min-width: 0; }
.hero-name { font-size: var(--font-size-3xl); font-weight: 900; margin-bottom: var(--space-2); }
.hero-meta { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.side-badge { padding: 3px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.side-groom { background: var(--color-info-bg); color: var(--color-info); }
.side-bride { background: var(--color-primary-light); color: var(--color-primary); }
.side-both { background: #f0f0f5; color: #6B7280; }
.rsvp-badge { padding: 4px 14px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; }
.rsvp-badge.large { font-size: var(--font-size-sm); padding: 5px 16px; }
.rsvp-confirmed { background: var(--color-success-bg); color: var(--color-success); }
.rsvp-declined { background: var(--color-error-bg); color: var(--color-error); }
.rsvp-maybe { background: var(--color-warning-bg); color: var(--color-warning); }
.rsvp-pending { background: rgba(255,255,255,.15); color: rgba(255,255,255,.9); }
.table-badge { padding: 3px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; background: rgba(255,255,255,.15); }
.hero-contact { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.contact-link { display: flex; align-items: center; gap: var(--space-1); font-size: var(--font-size-sm); font-weight: 600; color: rgba(255,255,255,.9); text-decoration: none; padding: 6px 14px; background: rgba(255,255,255,.12); border-radius: var(--radius-full); transition: var(--transition-fast); }
.contact-link:hover { background: rgba(255,255,255,.22); }
.hero-actions { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; }

/* Info grid */
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); margin-bottom: var(--space-5); }
.info-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-5); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.info-card-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: .04em; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.info-val { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.info-val.link { color: var(--color-primary); text-decoration: none; }
.info-val.link:hover { text-decoration: underline; }
.info-val.gift { color: var(--color-success); font-weight: 700; }
.muted { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.muted-sm { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.notes-block { padding-top: var(--space-3); }
.notes-text { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.6; margin-top: var(--space-1); }

/* Quick actions */
.quick-actions-card { grid-column: span 1; }
.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-2); }
.quick-btn { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-3); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: 1.5px solid var(--color-border); background: var(--color-bg-subtle); color: var(--color-navy); text-decoration: none; transition: var(--transition-fast); }
.quick-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); color: var(--color-primary); }
.quick-btn.wa:hover { border-color: #22c55e; background: #dcfce7; color: #16a34a; }
.rsvp-btns { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.rsvp-quick-btn { padding: var(--space-2) var(--space-3); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-xs); font-weight: 700; cursor: pointer; border: 2px solid transparent; background: var(--color-bg-subtle); transition: var(--transition-fast); }
.rsvp-quick-btn.opt-confirmed.active, .rsvp-quick-btn.opt-confirmed:hover { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success); }
.rsvp-quick-btn.opt-declined.active, .rsvp-quick-btn.opt-declined:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
.rsvp-quick-btn.opt-maybe.active, .rsvp-quick-btn.opt-maybe:hover { background: var(--color-warning-bg); color: var(--color-warning); border-color: var(--color-warning); }
.rsvp-quick-btn.opt-pending.active, .rsvp-quick-btn.opt-pending:hover { background: var(--color-bg-subtle); color: var(--color-text-muted); border-color: var(--color-border); }

/* Edit section */
.edit-section { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-primary); margin-bottom: var(--space-5); }
.section-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-5); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-group { display: flex; flex-direction: column; gap: var(--space-1); }
.form-group.span-2 { grid-column: span 2; }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.form-input { padding: var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; width: 100%; }
.form-input:focus { border-color: var(--color-primary); background: #fff; }
.form-textarea { resize: vertical; min-height: 70px; }
.form-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-5); }

/* Timestamps */
.timestamps { display: flex; gap: var(--space-5); font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: rgba(255,255,255,.15); color: #fff; border: 1.5px solid rgba(255,255,255,.4); }
.btn-outline:hover { background: rgba(255,255,255,.25); }
.btn-danger-outline { background: rgba(239,68,68,.15); color: #fca5a5; border: 1.5px solid rgba(239,68,68,.4); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: var(--transition-fast); padding: var(--space-2) var(--space-4); }
.btn-danger-outline:hover { background: rgba(239,68,68,.25); }
.btn-danger { background: var(--color-error); color: #fff; }
.btn-danger:disabled { opacity: .6; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay-dark); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
.modal { background: #fff; border-radius: var(--radius-xl); padding: var(--space-6); width: 100%; max-width: 400px; box-shadow: var(--shadow-xl); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text-muted); }
.modal-body { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center; }
.modal-body p { color: var(--color-navy); font-size: var(--font-size-sm); }
.delete-warn { font-size: 48px; }
.warn-text { color: var(--color-error) !important; font-size: var(--font-size-xs) !important; }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }

/* Skeleton */
.skeleton { background: linear-gradient(90deg,#f0f0f5 25%,#e8e8f0 50%,#f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.error-state { text-align: center; padding: var(--space-12); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }

@media (max-width: 700px) {
  .guest-view { padding: var(--space-4); }
  .hero-card { flex-direction: column; }
  .hero-actions { flex-direction: row; }
  .info-grid { grid-template-columns: 1fr; }
  .quick-actions-card { grid-column: span 1; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.span-2 { grid-column: span 1; }
}
</style>
