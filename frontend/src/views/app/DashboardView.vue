<template>
  <div class="dashboard fade-in">

    <!-- ── Stats Row ── -->
    <div class="stats-row">
      <!-- Guests -->
      <div class="stat-card" @click="$router.push('/app/guests')" role="button" tabindex="0">
        <div class="stat-header">
          <span class="stat-label">אורחים</span>
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-value">{{ guestStats.confirmed }} / {{ guestStats.total }}</div>
        <div class="stat-progress-bar">
          <div
            class="stat-progress-fill"
            :style="{ width: guestStats.total ? (guestStats.confirmed / guestStats.total * 100) + '%' : '0%' }"
          ></div>
        </div>
        <div class="stat-sub">
          אישרו הגעה {{ guestStats.total ? Math.round(guestStats.confirmed / guestStats.total * 100) : 0 }}%
        </div>
      </div>

      <!-- Budget -->
      <div class="stat-card" @click="$router.push('/app/budget')" role="button" tabindex="0">
        <div class="stat-header">
          <span class="stat-label">תקציב</span>
          <span class="stat-icon">💰</span>
        </div>
        <div class="stat-value">₪{{ budgetStats.spent?.toLocaleString('he-IL') || 0 }}</div>
        <div class="stat-meta-row">
          <div class="stat-meta-item">
            <div class="meta-label">מוקצה</div>
            <div class="meta-value">₪{{ budgetStats.total?.toLocaleString('he-IL') || 0 }}</div>
          </div>
          <div class="stat-meta-item">
            <div class="meta-label">נותר</div>
            <div class="meta-value green">
              ₪{{ ((budgetStats.total || 0) - (budgetStats.spent || 0)).toLocaleString('he-IL') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks -->
      <div class="stat-card" @click="$router.push('/app/tasks')" role="button" tabindex="0">
        <div class="stat-header">
          <span class="stat-label">משימות</span>
          <span class="stat-icon">✅</span>
        </div>
        <div class="stat-value">{{ taskStats.done }} / {{ taskStats.total }}</div>
        <div class="stat-progress-bar">
          <div
            class="stat-progress-fill green-fill"
            :style="{ width: taskStats.total ? (taskStats.done / taskStats.total * 100) + '%' : '0%' }"
          ></div>
        </div>
        <div class="stat-sub">{{ taskStats.total - taskStats.done }} משימות פתוחות</div>
      </div>
    </div>

    <!-- ── Middle: Tasks + Events ── -->
    <div class="dashboard-mid">
      <!-- Priority Tasks -->
      <div class="dash-card tasks-card">
        <div class="dash-card-header">
          <h3>משימות עדיפות</h3>
          <router-link to="/app/tasks" class="view-all-link">צפה בכל</router-link>
        </div>
        <div class="task-list">
          <div v-for="task in priorityTasks" :key="task.id" class="task-item">
            <div class="task-check" :class="{ done: task.status === 'done' }">
              <span v-if="task.status === 'done'">✓</span>
            </div>
            <div class="task-body">
              <div class="task-title" :class="{ done: task.status === 'done' }">{{ task.title }}</div>
              <div class="task-meta">
                {{ task.dueDate ? 'עד ' + formatDate(task.dueDate) : '' }}
                {{ task.priority === 'high' ? '· עדיפות גבוהה' : '' }}
              </div>
            </div>
            <span class="task-tag">{{ task.category || 'כללי' }}</span>
          </div>
          <div v-if="!priorityTasks.length" class="empty-tasks">אין משימות פתוחות 🎉</div>
        </div>
      </div>

      <!-- Upcoming Events -->
      <div class="dash-card events-card">
        <div class="dash-card-header">
          <h3>אירועים קרובים</h3>
        </div>
        <div class="events-list">
          <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
            <div class="event-date-block">
              <div class="event-month">{{ eventMonth(event.date) }}</div>
              <div class="event-day">{{ eventDay(event.date) }}</div>
            </div>
            <div class="event-body">
              <div class="event-title">{{ event.title }}</div>
              <div class="event-meta">
                {{ event.time || '' }}{{ event.location ? ' · ' + event.location : '' }}
              </div>
            </div>
          </div>
          <div v-if="!upcomingEvents.length" class="empty-events">אין אירועים קרובים</div>
        </div>
        <router-link to="/app/timeline" class="view-calendar-btn">צפה בציר הזמן</router-link>
      </div>
    </div>

    <!-- ── Recent Activity ── -->
    <div class="dash-card activity-card">
      <div class="dash-card-header">
        <h3>פעילות אחרונה</h3>
      </div>
      <div class="activity-list">
        <div v-for="item in recentRsvps" :key="item.id" class="activity-item">
          <div class="activity-icon" :class="item.rsvpStatus">
            {{ item.rsvpStatus === 'confirmed' ? '✅' : item.rsvpStatus === 'declined' ? '❌' : '🕐' }}
          </div>
          <div class="activity-body">
            <strong>{{ item.name }}</strong>
            {{
              item.rsvpStatus === 'confirmed'
                ? ` אישר/ה הגעה ל-${item.numPeople} אורחים`
                : item.rsvpStatus === 'declined'
                  ? ' לא יגיע/תגיע'
                  : ' הגיב/ה "אולי"'
            }}
          </div>
          <div class="activity-time">{{ timeAgo(item.updatedAt) }}</div>
        </div>
        <div v-if="!recentRsvps.length" class="empty-activity">
          אין פעילות עדיין. שלח הזמנות ב-WhatsApp!
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/composables/useApi'

const guestStats     = ref({ total: 0, confirmed: 0, declined: 0, pending: 0 })
const budgetStats    = ref({ total: 0, spent: 0 })
const taskStats      = ref({ total: 0, done: 0 })
const priorityTasks  = ref([])
const upcomingEvents = ref([])
const recentRsvps    = ref([])

onMounted(async () => {
  try {
    const [gs, bs, allTasksRes, pendingTasksRes, eventsRes, guestsRes] = await Promise.all([
      api.get('/guests/stats').catch(() => ({ data: {} })),
      api.get('/budget/summary').catch(() => ({ data: {} })),
      api.get('/tasks').catch(() => ({ data: [] })),
      api.get('/tasks?limit=3&status=pending').catch(() => ({ data: [] })),
      api.get('/timeline?limit=4&upcoming=true').catch(() => ({ data: [] })),
      api.get('/guests?limit=5&sort=updatedAt').catch(() => ({ data: { items: [] } })),
    ])

    guestStats.value = {
      total:     gs.data.total     || 0,
      confirmed: gs.data.confirmed || 0,
      declined:  gs.data.declined  || 0,
      pending:   gs.data.pending   || 0,
    }

    budgetStats.value = {
      total: bs.data.totalBudget || bs.data.total || 0,
      spent: bs.data.totalSpent  || bs.data.spent || 0,
    }

    const allTasks = Array.isArray(allTasksRes.data)
      ? allTasksRes.data
      : allTasksRes.data?.items || []
    taskStats.value = {
      total: allTasks.length,
      done:  allTasks.filter(t => t.status === 'done').length,
    }

    priorityTasks.value = (
      Array.isArray(pendingTasksRes.data)
        ? pendingTasksRes.data
        : pendingTasksRes.data?.items || []
    ).slice(0, 3)

    upcomingEvents.value = (
      Array.isArray(eventsRes.data)
        ? eventsRes.data
        : eventsRes.data?.items || []
    ).slice(0, 4)

    const guestItems = guestsRes.data?.items || guestsRes.data || []
    recentRsvps.value = guestItems
      .filter(g => g.rsvpStatus && g.rsvpStatus !== 'pending')
      .slice(0, 5)

  } catch (e) {
    console.error('Dashboard load error', e)
  }
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}
function eventMonth(d) {
  return new Date(d).toLocaleDateString('he-IL', { month: 'short' }).replace('.', '')
}
function eventDay(d) {
  return new Date(d).getDate()
}
function timeAgo(d) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const m  = Math.floor(ms / 60000)
  if (m < 60)  return `לפני ${m} דקות`
  const h  = Math.floor(m / 60)
  if (h < 24)  return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

/* ── Stats Row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 20px 22px;
  border: 1px solid #EAEAEA;
  cursor: pointer;
  transition: border-color 0.15s;
}
.stat-card:hover { border-color: #FF407D; }

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 11px;
  font-weight: 700;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.stat-icon { font-size: 20px; }

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #1B3C73;
  margin-bottom: 10px;
  line-height: 1;
}

.stat-progress-bar {
  height: 6px;
  background: #F0F2F5;
  border-radius: 3px;
  margin-bottom: 8px;
  overflow: hidden;
}
.stat-progress-fill {
  height: 100%;
  background: #FF407D;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.stat-progress-fill.green-fill { background: #22C55E; }

.stat-sub { font-size: 12px; color: #888; }

.stat-meta-row { display: flex; gap: 24px; margin-top: 4px; }
.meta-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 15px; font-weight: 700; color: #1B3C73; margin-top: 2px; }
.meta-value.green { color: #22C55E; }

/* ── Middle Grid ── */
.dashboard-mid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
}

/* ── Cards ── */
.dash-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid #EAEAEA;
  padding: 22px;
}

.dash-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.dash-card-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1B3C73;
  margin: 0;
}
.view-all-link {
  font-size: 13px;
  color: #FF407D;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}
.view-all-link:hover { text-decoration: underline; }

/* ── Task List ── */
.task-list { display: flex; flex-direction: column; gap: 8px; }

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #FAFAFA;
  border-radius: 12px;
  border: 1px solid #EAEAEA;
}
.task-check {
  width: 20px;
  height: 20px;
  border: 2px solid #D1D5DB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: white;
  flex-shrink: 0;
  transition: all 0.15s;
}
.task-check.done { background: #22C55E; border-color: #22C55E; }

.task-body { flex: 1; min-width: 0; }
.task-title {
  font-size: 14px;
  font-weight: 600;
  color: #1B3C73;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-title.done { text-decoration: line-through; color: #9CA3AF; }
.task-meta { font-size: 12px; color: #888; margin-top: 2px; }

.task-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 8px;
  background: #F0F2F5;
  color: #6B7280;
  white-space: nowrap;
  flex-shrink: 0;
}

.empty-tasks,
.empty-events,
.empty-activity {
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
  padding: 24px 0;
}

/* ── Events List ── */
.events-list { display: flex; flex-direction: column; gap: 14px; }

.event-item { display: flex; gap: 12px; align-items: center; }

.event-date-block {
  width: 46px;
  height: 46px;
  background: #1B3C73;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}
.event-month { font-size: 10px; opacity: 0.75; letter-spacing: 0.5px; }
.event-day { font-size: 18px; font-weight: 800; line-height: 1.1; }

.event-body { flex: 1; min-width: 0; }
.event-title {
  font-size: 14px;
  font-weight: 600;
  color: #1B3C73;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.event-meta { font-size: 12px; color: #888; margin-top: 2px; }

.view-calendar-btn {
  display: block;
  margin-top: 18px;
  padding: 12px;
  background: #1B3C73;
  color: white;
  border-radius: 14px;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  border: none;
  transition: opacity 0.15s;
}
.view-calendar-btn:hover { opacity: 0.88; }

/* ── Activity Feed ── */
.activity-card { }

.activity-list { display: flex; flex-direction: column; gap: 14px; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F0F2F5;
}
.activity-item:last-child { border-bottom: none; padding-bottom: 0; }

.activity-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }
.activity-body { flex: 1; font-size: 14px; color: #374151; }
.activity-body strong { color: #1B3C73; }
.activity-time { font-size: 12px; color: #9CA3AF; white-space: nowrap; flex-shrink: 0; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .stats-row    { grid-template-columns: repeat(2, 1fr); }
  .dashboard-mid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .stats-row    { grid-template-columns: 1fr 1fr; gap: 12px; }
  .stat-value   { font-size: 26px; }
  .dashboard-mid { gap: 12px; }
  .dash-card    { padding: 16px; }
}
</style>
