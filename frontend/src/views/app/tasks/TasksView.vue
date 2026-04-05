<template>
  <div class="tasks-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header-row">
      <div>
        <h1 class="page-title">משימות ✅</h1>
        <p class="page-sub" v-if="!loading">{{ doneCount }} / {{ tasks.length }} הושלמו</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openAdd">➕ הוסף משימה</button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-card card">
      <div class="progress-header">
        <span>התקדמות כוללת</span>
        <span class="pct-text">{{ progressPct }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="`width: ${progressPct}%`"></div>
      </div>
      <div class="progress-chips">
        <span class="chip done">{{ doneCount }} הושלמו ✓</span>
        <span class="chip pending">{{ tasks.length - doneCount }} נותרו</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs-row" v-if="categories.length > 0">
      <button class="tab-btn" :class="{ active: !activeCategory }" @click="activeCategory = null">
        הכל ({{ tasks.length }})
      </button>
      <button
        v-for="cat in categories" :key="cat"
        class="tab-btn"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ cat }} ({{ tasks.filter(t => t.category === cat).length }})</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="tasks-list">
      <div v-for="i in 5" :key="i" class="skeleton" style="height:72px;border-radius:12px;"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0 && tasks.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <h3 class="empty-title">אין משימות עדיין</h3>
      <p class="empty-text">הוסף משימות לניהול ההכנות לחתונה</p>
      <button class="btn btn-primary" @click="openAdd">➕ הוסף משימה ראשונה</button>
    </div>

    <!-- Tasks List -->
    <div v-else class="tasks-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card card"
        :class="{ done: task.status === 'done' }"
      >
        <button class="task-toggle" @click="toggleTask(task)" :title="task.status === 'done' ? 'סמן כלא הושלם' : 'סמן כהושלם'">
          <div class="checkbox" :class="{ checked: task.status === 'done' }">
            <span v-if="task.status === 'done'">✓</span>
          </div>
        </button>

        <div class="task-body" @click="openEdit(task)" style="cursor:pointer">
          <div class="task-title" :class="{ strikethrough: task.status === 'done' }">{{ task.title }}</div>
          <div class="task-meta" v-if="task.category || task.dueDate || task.priority">
            <span class="task-badge" v-if="task.category">{{ task.category }}</span>
            <span class="task-badge priority" :class="`p-${task.priority}`" v-if="task.priority !== 'medium'">
              {{ priorityLabel(task.priority) }}
            </span>
            <span class="task-date" v-if="task.dueDate">📅 {{ formatDate(task.dueDate) }}</span>
          </div>
          <div class="task-desc" v-if="task.description">{{ task.description }}</div>
        </div>

        <button class="task-delete" @click.stop="deleteTask(task)" title="מחק">🗑️</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box card" dir="rtl">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingTask ? 'עריכת משימה' : 'משימה חדשה' }}</h3>
            <button class="modal-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">כותרת *</label>
              <input v-model="form.title" class="form-input" placeholder="לדוגמה: לבחור מסעדה לאחר החתונה" ref="titleInput" @keyup.enter="saveTask" />
            </div>
            <div class="form-group">
              <label class="form-label">קטגוריה</label>
              <input v-model="form.category" class="form-input" placeholder="לדוגמה: אולם, קייטרינג, פרחים..." list="cat-suggestions" />
              <datalist id="cat-suggestions">
                <option v-for="c in categories" :key="c" :value="c" />
              </datalist>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">עדיפות</label>
                <select v-model="form.priority" class="form-input">
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">תאריך יעד</label>
                <input v-model="form.dueDate" type="date" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">הערות</label>
              <textarea v-model="form.description" class="form-input form-textarea" placeholder="פרטים נוספים..." rows="2" />
            </div>
            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" @click="closeModal">ביטול</button>
            <button class="btn btn-primary btn-sm" :disabled="saving" @click="saveTask">
              {{ saving ? 'שומר...' : (editingTask ? 'שמור שינויים' : 'הוסף משימה') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import api from '@/composables/useApi'

// ── State ──────────────────────────────────────────────────────────────────────
const tasks         = ref([])
const loading       = ref(true)
const showModal     = ref(false)
const editingTask   = ref(null)
const saving        = ref(false)
const formError     = ref('')
const toast         = ref(null)
const activeCategory = ref(null)
const titleInput    = ref(null)

const form = ref({ title: '', category: '', priority: 'medium', dueDate: '', description: '' })

// ── Computed ───────────────────────────────────────────────────────────────────
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)
const progressPct = computed(() => tasks.value.length ? Math.round((doneCount.value / tasks.value.length) * 100) : 0)
const categories = computed(() => [...new Set(tasks.value.map(t => t.category).filter(Boolean))])
const filteredTasks = computed(() => {
  if (!activeCategory.value) return tasks.value
  return tasks.value.filter(t => t.category === activeCategory.value)
})

// ── Load ───────────────────────────────────────────────────────────────────────
async function loadTasks() {
  loading.value = true
  try {
    const { data } = await api.get('/tasks')
    tasks.value = data.tasks
  } catch (e) {
    showToast('שגיאה בטעינת המשימות', 'error')
  } finally {
    loading.value = false
  }
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
async function toggleTask(task) {
  const prevStatus = task.status
  task.status = task.status === 'done' ? 'todo' : 'done' // optimistic
  try {
    const { data } = await api.patch(`/tasks/${task.id}/toggle`)
    task.status = data.status
  } catch {
    task.status = prevStatus
    showToast('שגיאה בעדכון', 'error')
  }
}

// ── Add / Edit ─────────────────────────────────────────────────────────────────
function openAdd() {
  editingTask.value = null
  form.value = { title: '', category: '', priority: 'medium', dueDate: '', description: '' }
  formError.value = ''
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}

function openEdit(task) {
  editingTask.value = task
  form.value = {
    title:       task.title,
    category:    task.category || '',
    priority:    task.priority || 'medium',
    dueDate:     task.dueDate ? task.dueDate.substring(0, 10) : '',
    description: task.description || ''
  }
  formError.value = ''
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}

function closeModal() {
  showModal.value = false
  editingTask.value = null
}

async function saveTask() {
  formError.value = ''
  if (!form.value.title.trim()) { formError.value = 'כותרת המשימה היא שדה חובה'; return }

  saving.value = true
  try {
    const payload = {
      title:       form.value.title.trim(),
      category:    form.value.category.trim() || null,
      priority:    form.value.priority,
      dueDate:     form.value.dueDate || null,
      description: form.value.description.trim() || null
    }

    if (editingTask.value) {
      const { data } = await api.put(`/tasks/${editingTask.value.id}`, payload)
      const idx = tasks.value.findIndex(t => t.id === editingTask.value.id)
      if (idx !== -1) tasks.value[idx] = data
      showToast('משימה עודכנה', 'success')
    } else {
      const { data } = await api.post('/tasks', payload)
      tasks.value.push(data)
      showToast('משימה נוספה', 'success')
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.error || 'שגיאה בשמירה'
  } finally {
    saving.value = false
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────────
async function deleteTask(task) {
  if (!confirm(`למחוק את "${task.title}"?`)) return
  try {
    await api.delete(`/tasks/${task.id}`)
    tasks.value = tasks.value.filter(t => t.id !== task.id)
    showToast('משימה נמחקה', 'success')
  } catch {
    showToast('שגיאה במחיקה', 'error')
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function priorityLabel(p) {
  return p === 'high' ? '🔴 גבוהה' : p === 'low' ? '🟢 נמוכה' : 'בינונית'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function showToast(message, type = 'success') {
  toast.value = { message, type }
  setTimeout(() => { toast.value = null }, 3000)
}

onMounted(loadTasks)
</script>

<style scoped>
.tasks-view { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

/* Header */
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.page-title  { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub    { color: var(--color-text-muted); margin-top: 4px; font-size: var(--font-size-sm); }

/* Progress */
.progress-card {
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}
.progress-header  { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); font-weight: 600; }
.pct-text         { font-weight: 800; color: var(--color-navy); font-size: var(--font-size-base); }
.progress-bar     { height: 10px; background: var(--color-bg); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-3); border: 1px solid var(--color-border); }
.progress-fill    { height: 100%; background: linear-gradient(90deg, var(--color-primary), #ff6fb8); border-radius: var(--radius-full); transition: width 0.5s ease; }
.progress-chips   { display: flex; gap: var(--space-3); }
.chip             { padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.chip.done        { background: var(--color-success-bg); color: var(--color-success); }
.chip.pending     { background: var(--color-bg); color: var(--color-text-muted); border: 1px solid var(--color-border); }

/* Tabs */
.tabs-row { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
.tab-btn { padding: 7px 16px; border-radius: var(--radius-full); border: 1.5px solid var(--color-border); background: white; font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-fast); color: var(--color-text); white-space: nowrap; font-family: 'Heebo', sans-serif; }
.tab-btn:hover, .tab-btn.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }

/* Tasks List */
.tasks-list { display: flex; flex-direction: column; gap: var(--space-3); }

.task-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  transition: all var(--transition-fast);
}
.task-card:hover { border-color: var(--color-primary); }
.task-card.done  { opacity: 0.65; background: var(--color-success-bg); border-color: var(--color-success); }

.task-toggle  { flex-shrink: 0; background: none; border: none; cursor: pointer; padding: 2px; }
.checkbox {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  font-size: 0.85rem; font-weight: 700;
}
.checkbox.checked { background: var(--color-primary); border-color: var(--color-primary); color: white; }

.task-body   { flex: 1; min-width: 0; }
.task-title  { font-size: var(--font-size-base); color: var(--color-navy); font-weight: 600; margin-bottom: var(--space-1); }
.strikethrough { text-decoration: line-through; color: var(--color-text-muted); }
.task-meta   { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-1); }
.task-badge  { padding: 2px 8px; background: var(--color-primary-light); color: var(--color-primary); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.task-badge.priority.p-high { background: var(--color-error-bg); color: var(--color-error); }
.task-badge.priority.p-low  { background: var(--color-success-bg); color: var(--color-success); }
.task-date   { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.task-desc   { font-size: var(--font-size-sm); color: var(--color-text-muted); }

.task-delete { flex-shrink: 0; background: none; border: none; cursor: pointer; opacity: 0; font-size: 16px; padding: 4px; transition: opacity var(--transition-fast); border-radius: var(--radius-sm); }
.task-card:hover .task-delete { opacity: 1; }
.task-delete:hover { background: var(--color-error-bg); }

/* Empty state */
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }
.empty-icon  { font-size: 56px; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-text  { color: var(--color-text-muted); margin-bottom: var(--space-6); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(27,60,115,0.45); z-index: 200; display: flex; align-items: flex-start; justify-content: center; padding: var(--space-4); overflow-y: auto; -webkit-overflow-scrolling: touch; padding-top: env(safe-area-inset-top, 16px); }
.modal-box     { width: 100%; max-width: 500px; margin: auto 0; max-height: calc(100vh - 32px); display: flex; flex-direction: column; overflow: hidden; }
.modal-body    { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); overflow-y: auto; flex: 1; min-height: 0; }
.modal-header  { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); flex-shrink: 0; }
.modal-title   { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-navy); }
.modal-close   { width: 32px; height: 32px; border-radius: 50%; font-size: 20px; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); cursor: pointer; transition: background var(--transition-fast); border: none; background: none; }
.modal-close:hover { background: var(--color-border); }
.modal-footer  { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: var(--space-3); flex-shrink: 0; }

.form-row     { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-group   { display: flex; flex-direction: column; gap: 6px; }
.form-label   { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); }
.form-input   { width: 100%; padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: var(--font-size-sm); font-family: 'Heebo', sans-serif; background: var(--color-bg-card); color: var(--color-text); transition: border-color var(--transition-fast); direction: rtl; }
.form-input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }
.form-textarea { resize: vertical; min-height: 72px; }
.form-error   { font-size: var(--font-size-sm); color: var(--color-error); }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 10px var(--space-5); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none; transition: all var(--transition); text-decoration: none; font-family: 'Heebo', sans-serif; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-sm { padding: 7px var(--space-4); font-size: var(--font-size-xs); }

/* Card */
.card { background: var(--color-bg-card); border-radius: var(--radius-lg); border: 1px solid var(--color-border); }

/* Toast */
.toast { position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; z-index: 1000; color: #fff; white-space: nowrap; }
.toast.success { background: var(--color-success); }
.toast.error   { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(8px); }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box { transform: scale(0.96) translateY(-8px); }

/* Skeleton */
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e8e8f0 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

/* Fade */
.fade-in { animation: fadeIn 0.3s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Responsive */
@media (max-width: 640px) {
  .tasks-view { padding: var(--space-4); }
  .form-row { grid-template-columns: 1fr; }
}
</style>
