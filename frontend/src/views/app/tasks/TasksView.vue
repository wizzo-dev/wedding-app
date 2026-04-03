<template>
  <div class="tasks-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">צ'קליסט חתונה ✅</h1>
        <p class="page-sub">{{ completedCount }} / {{ DEFAULT_TASKS.length }} משימות הושלמו</p>
      </div>
      <button class="btn btn-outline" @click="resetAll" title="אפס הכל">🔄 אפס הכל</button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section card card-body">
      <div class="progress-header">
        <span>התקדמות כוללת</span>
        <span>{{ progressPct }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="`width: ${progressPct}%`"></div>
      </div>
      <div class="progress-chips">
        <span class="chip done">{{ completedCount }} הושלמו</span>
        <span class="chip pending">{{ DEFAULT_TASKS.length - completedCount }} נותרו</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs-row">
      <button
        class="tab-btn"
        :class="{ active: activeCategory === null }"
        @click="activeCategory = null"
      >הכל ({{ DEFAULT_TASKS.length }})</button>
      <button
        v-for="cat in categories"
        :key="cat"
        class="tab-btn"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ cat }} ({{ tasksByCategory(cat).length }})</button>
    </div>

    <!-- Tasks List -->
    <div class="tasks-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-card card card-body"
        :class="{ completed: isCompleted(task.id) }"
        @click="toggle(task.id)"
      >
        <div class="task-check">
          <div class="checkbox" :class="{ checked: isCompleted(task.id) }">
            <span v-if="isCompleted(task.id)">✓</span>
          </div>
        </div>
        <div class="task-info">
          <div class="task-text">{{ task.text }}</div>
          <div class="task-meta">
            <span class="task-cat-badge">{{ task.category }}</span>
            <span class="task-days">{{ task.daysBefore }} יום לפני</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'wedding_tasks_done'

const DEFAULT_TASKS = [
  { id:1, category:'אולם', text:'הזמינו והפקידו מקום באולם', daysBefore: 365 },
  { id:2, category:'קייטרינג', text:'בחרו ספק קייטרינג', daysBefore: 300 },
  { id:3, category:'צילום', text:'הזמינו צלם/צלמת', daysBefore: 270 },
  { id:4, category:'לבוש', text:'קנו שמלת כלה', daysBefore: 240 },
  { id:5, category:'לבוש', text:'הזמינו חליפה לחתן', daysBefore: 180 },
  { id:6, category:'הזמנות', text:'עצבו והזמינו הזמנות', daysBefore: 120 },
  { id:7, category:'הזמנות', text:'שלחו הזמנות לאורחים', daysBefore: 90 },
  { id:8, category:'פרחים', text:'בחרו עיצוב פרחים', daysBefore: 90 },
  { id:9, category:'אורחים', text:'אספו RSVPs מכולם', daysBefore: 30 },
  { id:10, category:'שונות', text:'ארגנו ירח דבש', daysBefore: 60 },
  { id:11, category:'שונות', text:'קנו טבעות', daysBefore: 120 },
  { id:12, category:'אולם', text:'פגישת תיאום סופית עם האולם', daysBefore: 14 },
  { id:13, category:'שונות', text:'הכינו תכנית ישיבה', daysBefore: 7 },
  { id:14, category:'שונות', text:'הכינו מתנות להורים', daysBefore: 7 },
  { id:15, category:'שונות', text:'נוחו לפני החתונה 😴', daysBefore: 1 },
]

const activeCategory = ref(null)
const completedIds = ref(new Set())

const categories = computed(() => {
  return [...new Set(DEFAULT_TASKS.map(t => t.category))]
})

const filteredTasks = computed(() => {
  if (!activeCategory.value) return DEFAULT_TASKS
  return DEFAULT_TASKS.filter(t => t.category === activeCategory.value)
})

const completedCount = computed(() => completedIds.value.size)

const progressPct = computed(() => Math.round((completedCount.value / DEFAULT_TASKS.length) * 100))

function tasksByCategory(cat) {
  return DEFAULT_TASKS.filter(t => t.category === cat)
}

function isCompleted(id) {
  return completedIds.value.has(id)
}

function toggle(id) {
  const newSet = new Set(completedIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  completedIds.value = newSet
  save()
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedIds.value]))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) completedIds.value = new Set(JSON.parse(raw))
  } catch {}
}

function resetAll() {
  if (!confirm('לאפס את כל המשימות?')) return
  completedIds.value = new Set()
  save()
}

onMounted(load)
</script>

<style scoped>
.tasks-view { padding: var(--space-6); max-width: 800px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); margin-top: var(--space-1); }

.progress-section { margin-bottom: var(--space-6); }
.progress-header { display: flex; justify-content: space-between; font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); font-weight: 600; }
.progress-bar { height: 12px; background: var(--color-bg); border-radius: var(--radius-full); overflow: hidden; margin-bottom: var(--space-3); }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), #ff6fb8); border-radius: var(--radius-full); transition: width 0.5s ease; }
.progress-chips { display: flex; gap: var(--space-3); }
.chip { padding: 4px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.chip.done { background: var(--color-success-bg); color: var(--color-success); }
.chip.pending { background: var(--color-bg); color: var(--color-text-muted); }

.tabs-row { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-5); }
.tab-btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); border: 1.5px solid var(--color-border); background: white; font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-fast); color: var(--color-text); white-space: nowrap; }
.tab-btn:hover, .tab-btn.active { border-color: var(--color-primary); background: var(--color-primary); color: white; }

.tasks-list { display: flex; flex-direction: column; gap: var(--space-3); }

.task-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}
.task-card:hover { transform: translateX(-2px); box-shadow: var(--shadow); }
.task-card.completed { opacity: 0.6; background: var(--color-success-bg); }

.checkbox {
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  font-size: 0.85rem;
  font-weight: 700;
}
.checkbox.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.task-info { flex: 1; }
.task-text { font-size: var(--font-size-base); color: var(--color-navy); font-weight: 500; margin-bottom: var(--space-1); }
.task-card.completed .task-text { text-decoration: line-through; }
.task-meta { display: flex; align-items: center; gap: var(--space-2); }
.task-cat-badge { padding: 2px 8px; background: var(--color-primary-light); color: var(--color-primary); border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600; }
.task-days { font-size: var(--font-size-xs); color: var(--color-text-muted); }

.btn { padding: var(--space-3) var(--space-5); border-radius: var(--radius-xl); border: none; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
</style>
