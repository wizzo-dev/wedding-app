<template>
  <div class="timeline-view" dir="rtl">
    <header class="page-header">
      <div>
        <h1 class="page-title">🕐 לוח זמנים ליום החתונה</h1>
        <p class="page-subtitle">סדר אירועי יום החתונה</p>
      </div>
      <div class="header-actions">
        <router-link to="/app/tasks" class="btn btn-outline">✅ משימות</router-link>
        <button @click="showAddModal = true" class="btn btn-primary">+ הוסף אירוע</button>
      </div>
    </header>

    <div v-if="!slots.length" class="empty-state">
      <div style="font-size:3rem">🕐</div>
      <h3>לוח הזמנים ריק</h3>
      <p>הוסף אירועים לתכנון יום החתונה שלך</p>
      <button @click="loadDefaults" class="btn btn-primary">📅 טען לוח ברירת מחדל</button>
    </div>

    <div v-else class="timeline-wrap">
      <div class="timeline-line"></div>
      <div v-for="(slot, idx) in sortedSlots" :key="slot.id" class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="slot-time">{{ slot.time }}</div>
          <div v-if="editing === slot.id" class="slot-edit">
            <div class="edit-row">
              <input v-model="editData.time" type="time" class="edit-input time-input" />
              <input v-model="editData.label" type="text" class="edit-input label-input" placeholder="שם האירוע" />
            </div>
            <textarea v-model="editData.notes" class="edit-notes" rows="2" placeholder="הערות..."></textarea>
            <div class="edit-actions">
              <button @click="saveEdit(slot)" class="btn btn-primary btn-sm">שמור</button>
              <button @click="editing = null" class="btn btn-outline btn-sm">ביטול</button>
            </div>
          </div>
          <div v-else class="slot-content">
            <h3 class="slot-label">{{ slot.label }}</h3>
            <p v-if="slot.notes" class="slot-notes">{{ slot.notes }}</p>
            <div class="slot-actions">
              <button @click="startEdit(slot)" class="btn-icon" title="ערוך">✏️</button>
              <button @click="remove(slot.id)" class="btn-icon danger" title="מחק">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-box">
        <h2 class="modal-title">הוסף אירוע</h2>
        <div class="form-group">
          <label>שעה</label>
          <input v-model="newSlot.time" type="time" class="form-input" />
        </div>
        <div class="form-group">
          <label>שם האירוע</label>
          <input v-model="newSlot.label" type="text" class="form-input" placeholder="לדוגמה: קבלת פנים" />
        </div>
        <div class="form-group">
          <label>הערות (אופציונלי)</label>
          <textarea v-model="newSlot.notes" class="form-input" rows="2" placeholder="פרטים נוספים..."></textarea>
        </div>
        <div class="modal-actions">
          <button @click="addSlot" class="btn btn-primary" :disabled="!newSlot.time || !newSlot.label">הוסף</button>
          <button @click="showAddModal = false" class="btn btn-outline">ביטול</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'yalla_timeline_v1'
const slots = ref([])
const showAddModal = ref(false)
const editing = ref(null)
const editData = ref({ time: '', label: '', notes: '' })
const newSlot = ref({ time: '', label: '', notes: '' })

const sortedSlots = computed(() =>
  [...slots.value].sort((a, b) => a.time.localeCompare(b.time))
)

const DEFAULT_SLOTS = [
  { time: '16:00', label: 'כניסת חתן', notes: 'ייחוד + תמונות' },
  { time: '17:00', label: 'קבלת פנים', notes: 'פגישה עם אורחים בכניסה' },
  { time: '18:30', label: 'חופה וקידושין', notes: 'תחת כיפת השמים' },
  { time: '19:30', label: 'כניסה לאולם', notes: 'רקוד ראשון' },
  { time: '20:00', label: 'ארוחת ערב', notes: 'שולחנות פתוחים' },
  { time: '21:30', label: 'מחרוזת ריקודים', notes: 'להקה ב-fullforce' },
  { time: '23:00', label: 'חיתוך עוגה', notes: '' },
  { time: '00:00', label: 'סיום האירוע', notes: '' },
]

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots.value))
}

function loadDefaults() {
  slots.value = DEFAULT_SLOTS.map((s, i) => ({ ...s, id: Date.now() + i }))
  save()
}

function addSlot() {
  slots.value.push({ ...newSlot.value, id: Date.now() })
  newSlot.value = { time: '', label: '', notes: '' }
  showAddModal.value = false
  save()
}

function remove(id) {
  if (!confirm('למחוק אירוע זה?')) return
  slots.value = slots.value.filter(s => s.id !== id)
  save()
}

function startEdit(slot) {
  editing.value = slot.id
  editData.value = { time: slot.time, label: slot.label, notes: slot.notes }
}

function saveEdit(slot) {
  Object.assign(slot, editData.value)
  editing.value = null
  save()
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) slots.value = JSON.parse(saved)
})
</script>

<style scoped>
.timeline-view { max-width: 700px; margin: 0 auto; padding: var(--space-6); }

.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin: 0 0 4px; }
.page-subtitle { color: var(--color-text-muted); font-size: var(--font-size-sm); margin: 0; }
.header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

.empty-state { text-align: center; padding: var(--space-12) var(--space-4); color: var(--color-text-muted); }
.empty-state h3 { color: var(--color-navy); font-weight: 700; margin: var(--space-3) 0 var(--space-2); }

.timeline-wrap { position: relative; padding-right: 40px; }
.timeline-line { position: absolute; right: 16px; top: 0; bottom: 0; width: 2px; background: var(--color-border); border-radius: var(--radius-full); }

.timeline-item { position: relative; margin-bottom: var(--space-5); }
.timeline-dot { position: absolute; right: -32px; top: 16px; width: 14px; height: 14px; background: var(--color-primary); border-radius: 50%; border: 3px solid var(--color-bg); box-shadow: 0 0 0 2px var(--color-primary); }
.timeline-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-4) var(--space-5); box-shadow: var(--shadow-sm); transition: box-shadow var(--transition-fast); }
.timeline-card:hover { box-shadow: var(--shadow); }

.slot-time { font-size: var(--font-size-sm); font-weight: 900; color: var(--color-primary); margin-bottom: var(--space-1); }

.slot-content { display: flex; align-items: flex-start; justify-content: space-between; }
.slot-label { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin: 0 0 4px; }
.slot-notes { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }
.slot-actions { display: flex; gap: var(--space-2); flex-shrink: 0; margin-right: var(--space-3); }
.btn-icon { background: none; border: none; font-size: 1rem; cursor: pointer; padding: 2px; border-radius: var(--radius-sm); transition: background var(--transition-fast); }
.btn-icon:hover { background: var(--color-bg-subtle); }
.btn-icon.danger:hover { background: var(--color-error-bg); }

.slot-edit { }
.edit-row { display: flex; gap: var(--space-3); margin-bottom: var(--space-2); }
.edit-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-primary); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); }
.time-input { width: 120px; }
.label-input { flex: 1; }
.edit-notes { width: 100%; padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); margin-bottom: var(--space-2); resize: none; }
.edit-actions { display: flex; gap: var(--space-2); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: var(--color-overlay); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-4); }
.modal-box { background: var(--color-bg-card); border-radius: var(--radius-2xl); padding: var(--space-6); width: 100%; max-width: 440px; box-shadow: var(--shadow-xl); }
.modal-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin: 0 0 var(--space-5); }
.form-group { margin-bottom: var(--space-4); }
.form-group label { display: block; font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); margin-bottom: 6px; }
.form-input { width: 100%; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.modal-actions { display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-lg); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all var(--transition); }
.btn-sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { filter: brightness(1.08); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary-bg); }

@media (max-width: 680px) {
  .timeline-view { padding: var(--space-4); }
  .page-header { flex-direction: column; }
  .edit-row { flex-direction: column; }
}
</style>
