<template>
  <div class="tasks-view fade-in" dir="rtl">

    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">משימות</h1>
        <p class="page-subtitle">עקבו אחר כל מה שצריך לעשות לחתונה</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" @click="openAdd">+ משימה חדשה</button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="store.stats && store.stats.total > 0" class="progress-card card">
      <div class="card-body progress-body">
        <div class="progress-info">
          <span class="progress-label">התקדמות</span>
          <span class="progress-pct">{{ store.stats.completionRate }}%</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: store.stats.completionRate + '%' }"></div>
          </div>
        </div>
        <div class="progress-counts">
          <span class="prog-badge todo">{{ store.stats.todo }} ממתין</span>
          <span class="prog-badge in-progress">{{ store.stats.inProgress }} בביצוע</span>
          <span class="prog-badge done">{{ store.stats.done }} הושלם</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-row">
      <!-- Status Filter -->
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: activeStatus === tab.value }"
          @click="activeStatus = tab.value"
        >{{ tab.icon }} {{ tab.label }}</button>
      </div>

      <!-- Search + Category -->
      <div class="filter-right">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input v-model="search" class="input search-input" placeholder="חיפוש..." />
          <button v-if="search" class="clear-btn" @click="search = ''">✕</button>
        </div>
        <select v-model="activeCategory" class="input cat-select">
          <option value="">כל הקטגוריות</option>
          <option v-for="cat in store.categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="store.loading" class="tasks-list">
      <div v-for="i in 5" :key="i" class="task-item card">
        <div class="card-body task-body">
          <div class="skeleton" style="width:24px;height:24px;border-radius:50%;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div class="skeleton" style="height:16px;width:55%;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:12px;width:35%;"></div>
          </div>
          <div class="skeleton" style="width:60px;height:22px;border-radius:11px;"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">{{ store.error }}</p>
      <button class="btn btn-primary" @click="store.fetchTasks()">נסה שוב</button>
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="empty-state-icon">{{ activeStatus === 'done' ? '🎉' : '✅' }}</div>
      <p class="empty-state-title">
        {{ activeStatus === 'done' && !search ? 'עדיין לא הושלמו משימות' : 'לא נמצאו משימות' }}
      </p>
      <p class="empty-state-text" v-if="search || activeStatus !== '' || activeCategory">
        נסה לשנות את הסינון
      </p>
      <button v-if="!search && activeStatus === '' && !activeCategory" class="btn btn-primary" @click="openAdd">
        + הוסף משימה ראשונה
      </button>
      <button v-else class="btn btn-ghost" @click="clearFilters">נקה סינון</button>
    </div>

    <!-- Tasks List -->
    <div v-else class="tasks-list">
      <div
        v-for="task in filtered"
        :key="task.id"
        class="task-item card"
        :class="{ 'task-done': task.status === 'done' }"
      >
        <div class="card-body task-body">
          <!-- Checkbox -->
          <button
            class="task-check"
            :class="{ checked: task.status === 'done' }"
            @click="toggle(task)"
            :disabled="toggleLoading === task.id"
          >
            <span v-if="task.status === 'done'">✓</span>
          </button>

          <!-- Task Info -->
          <div class="task-info">
            <div class="task-title-row">
              <span class="task-title">{{ task.title }}</span>
              <span class="priority-dot" :class="`prio-${task.priority}`" :title="priorityLabel(task.priority)"></span>
            </div>
            <div class="task-meta">
              <span v-if="task.category" class="task-cat">{{ task.category }}</span>
              <span v-if="task.dueDate" class="task-due" :class="{ overdue: isOverdue(task.dueDate) }">
                📅 {{ formatDate(task.dueDate) }}
              </span>
              <span v-if="task.description" class="task-desc">{{ task.description }}</span>
            </div>
          </div>

          <!-- Status Badge -->
          <div class="task-right">
            <span class="status-badge" :class="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
          </div>

          <!-- Actions -->
          <div class="task-actions">
            <button class="icon-btn" @click="openEdit(task)" title="ערוך">✏️</button>
            <button class="icon-btn danger-btn" @click="confirmDelete = task" title="מחק">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">{{ editTask ? 'ערוך משימה' : 'משימה חדשה' }}</h3>

          <div class="form-group">
            <label class="form-label">כותרת *</label>
            <input
              v-model="form.title"
              class="input"
              placeholder="כותרת המשימה..."
              ref="titleInput"
              @keydown.enter="saveTask"
            />
          </div>

          <div class="form-group">
            <label class="form-label">תיאור</label>
            <textarea v-model="form.description" class="input textarea" rows="2" placeholder="תיאור קצר..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">קטגוריה</label>
              <input v-model="form.category" class="input" placeholder="תכנון כללי, ספקים..." list="cat-list" />
              <datalist id="cat-list">
                <option v-for="cat in store.categories" :key="cat" :value="cat" />
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label">תאריך יעד</label>
              <input v-model="form.dueDate" class="input" type="date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">עדיפות</label>
              <div class="prio-opts">
                <button
                  v-for="p in priorities"
                  :key="p.value"
                  class="prio-btn"
                  :class="[`prio-${p.value}`, { active: form.priority === p.value }]"
                  @click="form.priority = p.value"
                  type="button"
                >{{ p.label }}</button>
              </div>
            </div>
            <div class="form-group" v-if="editTask">
              <label class="form-label">סטטוס</label>
              <select v-model="form.status" class="input">
                <option value="todo">ממתין</option>
                <option value="in_progress">בביצוע</option>
                <option value="done">הושלם</option>
              </select>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showModal = false">ביטול</button>
            <button class="btn btn-primary" @click="saveTask" :disabled="actionLoading">
              <span v-if="actionLoading">⏳ שומר...</span>
              <span v-else>{{ editTask ? '💾 שמור' : '+ הוסף' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="confirmDelete" class="modal-backdrop" @click.self="confirmDelete = null">
      <div class="modal card">
        <div class="card-body">
          <h3 class="modal-title">מחק משימה</h3>
          <p class="modal-text">האם למחוק את "<strong>{{ confirmDelete.title }}</strong>"?</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="confirmDelete = null">ביטול</button>
            <button class="btn btn-error" @click="doDelete" :disabled="actionLoading">מחק</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useTasksStore } from '@/stores/tasks'

const store = useTasksStore()

const activeStatus   = ref('')
const activeCategory = ref('')
const search         = ref('')
const showModal      = ref(false)
const editTask       = ref(null)
const confirmDelete  = ref(null)
const actionLoading  = ref(false)
const toggleLoading  = ref(null)
const titleInput     = ref(null)

const form = ref({
  title:       '',
  description: '',
  category:    '',
  dueDate:     '',
  priority:    'medium',
  status:      'todo',
})

const statusTabs = [
  { value: '',           label: 'הכל',      icon: '📋' },
  { value: 'todo',       label: 'ממתין',    icon: '⏳' },
  { value: 'in_progress',label: 'בביצוע',   icon: '🔄' },
  { value: 'done',       label: 'הושלם',    icon: '✅' },
]

const priorities = [
  { value: 'low',    label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high',   label: 'גבוהה' },
]

function priorityLabel(p) {
  const map = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' }
  return map[p] || p
}
function statusLabel(s) {
  const map = { todo: 'ממתין', in_progress: 'בביצוע', done: 'הושלם' }
  return map[s] || s
}
function statusClass(s) {
  const map = { todo: 'badge-neutral', in_progress: 'badge-info', done: 'badge-success' }
  return map[s] || 'badge-neutral'
}
function isOverdue(d) {
  return d && new Date(d) < new Date() && !d.startsWith('done')
}
function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const filtered = computed(() => {
  let list = store.tasks
  if (activeStatus.value)   list = list.filter(t => t.status === activeStatus.value)
  if (activeCategory.value) list = list.filter(t => t.category === activeCategory.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  }
  return list
})

function clearFilters() {
  search.value         = ''
  activeStatus.value   = ''
  activeCategory.value = ''
}

function openAdd() {
  editTask.value = null
  form.value = { title: '', description: '', category: '', dueDate: '', priority: 'medium', status: 'todo' }
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}

function openEdit(task) {
  editTask.value = task
  form.value = {
    title:       task.title,
    description: task.description || '',
    category:    task.category    || '',
    dueDate:     task.dueDate ? task.dueDate.split('T')[0] : '',
    priority:    task.priority,
    status:      task.status,
  }
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}

async function saveTask() {
  if (!form.value.title.trim()) return
  actionLoading.value = true
  try {
    const data = {
      title:       form.value.title.trim(),
      description: form.value.description || null,
      category:    form.value.category    || null,
      dueDate:     form.value.dueDate     || null,
      priority:    form.value.priority,
      status:      form.value.status,
    }
    if (editTask.value) {
      await store.updateTask(editTask.value.id, data)
    } else {
      await store.createTask(data)
      await store.fetchCategories()
    }
    showModal.value = false
  } finally {
    actionLoading.value = false
  }
}

async function toggle(task) {
  toggleLoading.value = task.id
  try {
    await store.toggleDone(task.id)
  } finally {
    toggleLoading.value = null
  }
}

async function doDelete() {
  if (!confirmDelete.value) return
  actionLoading.value = true
  try {
    await store.deleteTask(confirmDelete.value.id)
    confirmDelete.value = null
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  await store.fetchTasks()
  await Promise.all([store.fetchStats(), store.fetchCategories()])
})
</script>

<style scoped>
.tasks-view { max-width: 880px; margin: 0 auto; padding: var(--space-6); }

/* Page Header */
.page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-6); flex-wrap: wrap; }
.page-title  { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-subtitle { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }

/* Progress Card */
.progress-card { margin-bottom: var(--space-5); }
.progress-body { display: flex; flex-direction: column; gap: var(--space-3); }
.progress-info { display: flex; justify-content: space-between; align-items: center; }
.progress-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-muted); }
.progress-pct { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary); }

.progress-bar-bg { height: 10px; background: var(--color-bg-subtle); border-radius: var(--radius-full); overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), #FF6B9D); border-radius: var(--radius-full); transition: width 0.6s ease; }

.progress-counts { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.prog-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 2px var(--space-2); border-radius: var(--radius-full); }
.prog-badge.todo        { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.prog-badge.in-progress { background: var(--color-info-bg);   color: var(--color-info); }
.prog-badge.done        { background: var(--color-success-bg); color: var(--color-success); }

/* Filters Row */
.filters-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-5); flex-wrap: wrap; }
.filter-tabs { display: flex; gap: var(--space-2); flex-shrink: 0; }
.filter-tab {
  padding: var(--space-2) var(--space-3); border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border); background: #fff;
  color: var(--color-text-muted); font-size: var(--font-size-sm);
  font-family: var(--font); cursor: pointer; transition: var(--transition-fast); white-space: nowrap;
}
.filter-tab:hover  { border-color: var(--color-primary); color: var(--color-primary); }
.filter-tab.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; font-weight: 600; }

.filter-right { display: flex; gap: var(--space-2); flex: 1; min-width: 200px; }
.search-wrap { position: relative; flex: 1; display: flex; align-items: center; background: #fff; border: 1.5px solid var(--color-border); border-radius: var(--radius); padding: 0 var(--space-3); transition: var(--transition-fast); }
.search-wrap:focus-within { border-color: var(--color-primary); }
.search-icon { font-size: var(--font-size-sm); opacity: 0.5; }
.search-input { flex: 1; border: none; outline: none; font-size: var(--font-size-sm); font-family: var(--font); background: transparent; padding: var(--space-2) var(--space-1); color: var(--color-text); }
.clear-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: var(--font-size-xs); }
.cat-select { width: auto; min-width: 110px; font-size: var(--font-size-sm); }

/* Tasks List */
.tasks-list { display: flex; flex-direction: column; gap: var(--space-2); }

.task-item { transition: var(--transition); }
.task-item:hover { box-shadow: var(--shadow); }
.task-done { opacity: 0.65; }

.task-body { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); }

.task-check {
  width: 26px; height: 26px; border-radius: 50%; border: 2px solid var(--color-border);
  background: #fff; cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  transition: var(--transition-fast);
}
.task-check:hover { border-color: var(--color-primary); }
.task-check.checked { background: var(--color-success); border-color: var(--color-success); }

.task-info { flex: 1; min-width: 0; }
.task-title-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 3px; }
.task-title { font-size: var(--font-size-base); font-weight: 600; color: var(--color-navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-done .task-title { text-decoration: line-through; color: var(--color-text-muted); }

.priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.prio-high   { background: var(--color-error); }
.prio-medium { background: var(--color-warning); }
.prio-low    { background: var(--color-success); }

.task-meta { display: flex; gap: var(--space-2); flex-wrap: wrap; align-items: center; }
.task-cat  { font-size: var(--font-size-xs); background: var(--color-primary-light); color: var(--color-primary); padding: 1px var(--space-2); border-radius: var(--radius-full); font-weight: 600; }
.task-due  { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.task-due.overdue { color: var(--color-error); font-weight: 600; }
.task-desc { font-size: var(--font-size-xs); color: var(--color-text-muted); font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

.task-right { flex-shrink: 0; }
.status-badge { font-size: var(--font-size-xs); font-weight: 600; padding: 3px var(--space-2); border-radius: var(--radius-full); white-space: nowrap; }
.badge-neutral { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.badge-info    { background: var(--color-info-bg);   color: var(--color-info); }
.badge-success { background: var(--color-success-bg); color: var(--color-success); }

.task-actions { display: flex; gap: var(--space-1); flex-shrink: 0; }
.icon-btn { background: none; border: none; cursor: pointer; font-size: var(--font-size-base); padding: var(--space-1); border-radius: var(--radius-sm); transition: var(--transition-fast); }
.icon-btn:hover { background: var(--color-bg-subtle); }
.danger-btn:hover { background: var(--color-error-bg); }

/* Empty State */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-8); text-align: center; }
.empty-state-icon  { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-state-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.empty-state-text  { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }

/* Modal */
.modal-backdrop { position: fixed; inset: 0; background: var(--color-overlay); z-index: 100; display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal { max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-4); }
.modal-text  { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }
.modal-actions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-4); }

.form-group { margin-bottom: var(--space-4); }
.form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.form-label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text); margin-bottom: var(--space-1); }
.textarea   { resize: vertical; min-height: 60px; }

.prio-opts { display: flex; gap: var(--space-2); }
.prio-btn {
  flex: 1; padding: var(--space-2) var(--space-2); border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border); background: #fff;
  font-size: var(--font-size-xs); font-family: var(--font); cursor: pointer; transition: var(--transition-fast);
  color: var(--color-text-muted);
}
.prio-btn.prio-low.active    { border-color: var(--color-success); background: var(--color-success-bg); color: var(--color-success); font-weight: 700; }
.prio-btn.prio-medium.active { border-color: var(--color-warning); background: var(--color-warning-bg); color: var(--color-warning); font-weight: 700; }
.prio-btn.prio-high.active   { border-color: var(--color-error);   background: var(--color-error-bg);   color: var(--color-error);   font-weight: 700; }

.btn-error { background: var(--color-error); color: #fff; border-color: var(--color-error); }
.btn-error:hover { background: #dc2626; }

@media (max-width: 640px) {
  .tasks-view  { padding: var(--space-4); }
  .filters-row { flex-direction: column; align-items: flex-start; }
  .filter-right { width: 100%; }
  .form-row { grid-template-columns: 1fr; }
  .task-body { flex-wrap: wrap; }
}
</style>
