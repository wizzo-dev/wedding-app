<template>
  <div class="wa-history fade-in" dir="rtl">
    <template v-if="loading && !items.length">
      <div class="page-header">
        <div class="skeleton" style="width:220px;height:32px;border-radius:8px;"></div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div class="skeleton" style="width:160px;height:40px;border-radius:8px;"></div>
        <div class="skeleton" style="width:160px;height:40px;border-radius:8px;"></div>
      </div>
      <div v-for="i in 5" :key="i" class="skeleton" style="height:80px;margin-bottom:12px;border-radius:12px;"></div>
    </template>
    <div v-else-if="error" class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3 class="empty-title">שגיאה בטעינת ההיסטוריה</h3>
      <p class="empty-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadHistory">נסה שוב</button>
    </div>
    <template v-else>
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 היסטוריית שליחות</h1>
          <p class="page-sub">כל ההודעות שנשלחו דרך WhatsApp</p>
        </div>
        <router-link to="/app/whatsapp/send" class="btn btn-primary btn-sm">➕ שלח הודעה חדשה</router-link>
      </div>
      <div class="filters-bar card">
        <div class="filter-group">
          <label class="filter-label">מתאריך</label>
          <input type="date" v-model="filters.dateFrom" class="form-input" @change="applyFilters" />
        </div>
        <div class="filter-group">
          <label class="filter-label">עד תאריך</label>
          <input type="date" v-model="filters.dateTo" class="form-input" @change="applyFilters" />
        </div>
        <div class="filter-group">
          <label class="filter-label">סטטוס</label>
          <select v-model="filters.status" class="form-input" @change="applyFilters">
            <option value="">הכל</option>
            <option value="sent">הושלם ✅</option>
            <option value="partial">חלקי ⚠️</option>
            <option value="failed">נכשל ❌</option>
          </select>
        </div>
        <button v-if="hasActiveFilters" class="btn btn-ghost btn-sm" @click="clearFilters">✕ נקה פילטרים</button>
      </div>
      <div v-if="!items.length" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3 class="empty-title">אין היסטוריית שליחות</h3>
        <p class="empty-text" v-if="hasActiveFilters">לא נמצאו תוצאות לפי הפילטרים שנבחרו</p>
        <p class="empty-text" v-else>שלח הודעות WhatsApp לאורחים ותוצאות השליחה יופיעו כאן</p>
        <div class="empty-actions">
          <button v-if="hasActiveFilters" class="btn btn-outline" @click="clearFilters">נקה פילטרים</button>
          <router-link v-else to="/app/whatsapp/send" class="btn btn-primary">🚀 שלח הודעה ראשונה</router-link>
        </div>
      </div>
      <div v-else class="history-list">
        <div v-for="batch in items" :key="batch.id" class="batch-card card">
          <div class="batch-header" @click="toggleExpand(batch.id)">
            <div class="batch-main">
              <div class="batch-date">
                <span class="date-day">{{ formatDate(batch.sentAt) }}</span>
                <span class="date-time">{{ formatTime(batch.sentAt) }}</span>
              </div>
              <div class="batch-info">
                <span class="template-name">{{ batch.templateName }}</span>
                <span class="badge" :class="typeClass(batch.templateType)">{{ typeLabel(batch.templateType) }}</span>
              </div>
            </div>
            <div class="batch-stats">
              <span class="stat stat-total">👥 {{ batch.total }}</span>
              <span class="stat stat-sent">✅ {{ batch.sent }}</span>
              <span class="stat stat-failed" v-if="batch.failed > 0">❌ {{ batch.failed }}</span>
              <span class="status-badge" :class="statusClass(batch.status)">{{ statusLabel(batch.status) }}</span>
            </div>
            <div class="batch-actions" @click.stop>
              <button v-if="batch.failed > 0" class="btn btn-sm btn-outline-danger" :disabled="resending[batch.id]" @click="resendFailed(batch)">
                <span v-if="resending[batch.id]">⏳ שולח...</span>
                <span v-else>🔄 שלח מחדש ({{ batch.failed }})</span>
              </button>
              <button class="expand-btn" :class="{ expanded: expandedIds.has(batch.id) }">▾</button>
            </div>
          </div>
          <div class="batch-progress">
            <div class="progress-fill sent" :style="{ width: batch.total ? (batch.sent / batch.total * 100) + '%' : '0%' }"></div>
            <div class="progress-fill failed" :style="{ width: batch.total ? (batch.failed / batch.total * 100) + '%' : '0%' }"></div>
          </div>
          <transition name="expand">
            <div v-if="expandedIds.has(batch.id)" class="batch-results">
              <div class="results-header">
                <h4>תוצאות לפי אורח</h4>
                <div class="results-filter">
                  <button class="filter-tab" :class="{ active: !resultFilter[batch.id] || resultFilter[batch.id] === 'all' }" @click="setResultFilter(batch.id, 'all')">הכל ({{ batch.results?.length || 0 }})</button>
                  <button class="filter-tab" :class="{ active: resultFilter[batch.id] === 'sent' }" @click="setResultFilter(batch.id, 'sent')">✅ נשלח ({{ batch.sent }})</button>
                  <button class="filter-tab filter-tab-fail" :class="{ active: resultFilter[batch.id] === 'failed' }" @click="setResultFilter(batch.id, 'failed')" v-if="batch.failed > 0">❌ נכשל ({{ batch.failed }})</button>
                </div>
              </div>
              <div class="results-table-wrap">
                <table class="results-table">
                  <thead><tr><th>שם אורח</th><th>טלפון</th><th>סטטוס</th></tr></thead>
                  <tbody>
                    <tr v-for="r in filteredResults(batch)" :key="r.guestId" :class="{ 'row-failed': r.status === 'failed' }">
                      <td class="guest-name-cell">{{ r.guestName }}</td>
                      <td class="phone-cell" dir="ltr">{{ r.phone }}</td>
                      <td><span class="result-badge" :class="r.status === 'sent' ? 'badge-sent' : 'badge-failed'">{{ r.status === 'sent' ? '✅ נשלח' : '❌ נכשל' }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </transition>
        </div>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">&#x2039;</button>
        <button v-for="p in visiblePages" :key="p" class="page-btn" :class="{ active: p === currentPage, dots: p === '...' }" :disabled="p === '...'" @click="p !== '...' && goToPage(p)">{{ p }}</button>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">&#x203A;</button>
      </div>
    </template>
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.type">{{ toast.message }}</div>
    </transition>
  </div>
</template>
<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import axios from 'axios'
const items = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const expandedIds = ref(new Set())
const resending = reactive({})
const resultFilter = reactive({})
const toast = ref(null)
const filters = reactive({ dateFrom: '', dateTo: '', status: '' })
const hasActiveFilters = computed(() => filters.dateFrom || filters.dateTo || filters.status)
const visiblePages = computed(() => {
  const pages = [], tot = totalPages.value, cur = currentPage.value
  if (tot <= 7) { for (let i = 1; i <= tot; i++) pages.push(i) }
  else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(tot - 1, cur + 1); i++) pages.push(i)
    if (cur < tot - 2) pages.push('...')
    pages.push(tot)
  }
  return pages
})
async function loadHistory() {
  loading.value = true; error.value = null
  try {
    const params = { page: currentPage.value, limit: 20 }
    if (filters.status)   params.status   = filters.status
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo)   params.dateTo   = filters.dateTo
    const { data } = await axios.get('/api/whatsapp/history', { params })
    items.value = data.items; totalPages.value = data.totalPages
  } catch (e) { error.value = e.response?.data?.error || e.message || 'שגיאה בטעינת הנתונים' }
  finally { loading.value = false }
}
function applyFilters() { currentPage.value = 1; loadHistory() }
function clearFilters() { filters.dateFrom = ''; filters.dateTo = ''; filters.status = ''; applyFilters() }
function goToPage(page) { currentPage.value = page; loadHistory() }
function toggleExpand(id) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  expandedIds.value = next
}
function setResultFilter(batchId, filter) { resultFilter[batchId] = filter }
function filteredResults(batch) {
  const f = resultFilter[batch.id], r = batch.results || []
  if (f === 'sent') return r.filter(x => x.status === 'sent')
  if (f === 'failed') return r.filter(x => x.status === 'failed')
  return r
}
async function resendFailed(batch) {
  resending[batch.id] = true
  try {
    const { data } = await axios.post('/api/whatsapp/resend/' + batch.id)
    showToast('נשלחו מחדש ' + data.resent + ' הודעות בהצלחה', 'success')
    await loadHistory()
  } catch (e) { showToast(e.response?.data?.error || 'שגיאה בשליחה מחדש', 'error') }
  finally { resending[batch.id] = false }
}
function showToast(message, type = 'success') { toast.value = { message, type }; setTimeout(() => { toast.value = null }, 3500) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '' }
function formatTime(d) { return d ? new Date(d).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '' }
function statusClass(s) { return { 'status-sent': s === 'sent', 'status-failed': s === 'failed', 'status-partial': s === 'partial' } }
function statusLabel(s) { return { sent: 'הושלם', failed: 'נכשל', partial: 'חלקי' }[s] || s }
function typeClass(t) { return { rsvp_invite: 'badge-pink', reminder: 'badge-orange', thank_you: 'badge-green', custom: 'badge-gray' }[t] || 'badge-gray' }
function typeLabel(t) { return { rsvp_invite: 'הזמנה', reminder: 'תזכורת', thank_you: 'תודה', custom: 'מותאם' }[t] || t }
onMounted(loadHistory)
</script>
<style scoped>
.wa-history { padding: var(--space-8); max-width: var(--content-max); margin: 0 auto; direction: rtl; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }
.filters-bar { display: flex; align-items: flex-end; gap: var(--space-4); padding: var(--space-4) var(--space-6); margin-bottom: var(--space-6); flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); }
.form-input { height: 40px; padding: 0 12px; border-radius: var(--radius); border: 1.5px solid var(--color-border); background: var(--color-bg-subtle); font-size: var(--font-size-sm); font-family: var(--font); color: var(--color-text); transition: border-color var(--transition-fast); }
.form-input:focus { outline: none; border-color: var(--color-primary); }
.history-list { display: flex; flex-direction: column; gap: var(--space-4); }
.batch-card { border-radius: var(--radius-lg); overflow: hidden; transition: box-shadow var(--transition); }
.batch-card:hover { box-shadow: var(--shadow-lg); }
.batch-header { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-5) var(--space-6); cursor: pointer; user-select: none; flex-wrap: wrap; }
.batch-main { display: flex; align-items: center; gap: var(--space-4); flex: 1; min-width: 0; }
.batch-date { display: flex; flex-direction: column; align-items: flex-end; min-width: 90px; }
.date-day { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.date-time { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.batch-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.template-name { font-size: var(--font-size-base); font-weight: 600; color: var(--color-navy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; }
.badge-pink { background: var(--color-primary-light); color: var(--color-primary); }
.badge-orange { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-green { background: var(--color-success-bg); color: var(--color-success); }
.badge-gray { background: #F3F4F6; color: var(--color-text-muted); }
.batch-stats { display: flex; align-items: center; gap: var(--space-3); margin-right: auto; }
.stat { font-size: var(--font-size-sm); font-weight: 600; }
.stat-total { color: var(--color-navy-light); }
.stat-sent { color: var(--color-success); }
.stat-failed { color: var(--color-error); }
.status-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; }
.status-sent { background: var(--color-success-bg); color: var(--color-success); }
.status-failed { background: var(--color-error-bg); color: var(--color-error); }
.status-partial { background: var(--color-warning-bg); color: var(--color-warning); }
.batch-actions { display: flex; align-items: center; gap: var(--space-3); }
.btn-outline-danger { border: 1.5px solid var(--color-error); color: var(--color-error); background: transparent; padding: 6px 12px; border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 700; transition: all var(--transition-fast); cursor: pointer; }
.btn-outline-danger:hover:not(:disabled) { background: var(--color-error-bg); }
.expand-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--color-bg-subtle); font-size: 14px; transition: transform var(--transition-fast), background var(--transition-fast); cursor: pointer; border: none; }
.expand-btn:hover { background: var(--color-border); }
.expand-btn.expanded { transform: rotate(180deg); }
.batch-progress { height: 4px; background: var(--color-border); display: flex; overflow: hidden; }
.progress-fill { height: 100%; transition: width 0.4s ease; }
.progress-fill.sent { background: var(--color-success); }
.progress-fill.failed { background: var(--color-error); }
.batch-results { border-top: 1px solid var(--color-border); padding: var(--space-5) var(--space-6); }
.results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-3); }
.results-header h4 { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.results-filter { display: flex; gap: var(--space-2); }
.filter-tab { padding: 4px 12px; border-radius: var(--radius-full); border: 1.5px solid var(--color-border); font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); background: transparent; cursor: pointer; transition: all var(--transition-fast); }
.filter-tab.active { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light); }
.filter-tab-fail.active { border-color: var(--color-error); color: var(--color-error); background: var(--color-error-bg); }
.results-table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--color-border); }
.results-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.results-table th { background: var(--color-bg-subtle); padding: 10px 14px; text-align: right; font-weight: 700; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
.results-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.results-table tr:last-child td { border-bottom: none; }
.row-failed { background: #FFF5F5; }
.guest-name-cell { font-weight: 600; color: var(--color-navy); }
.phone-cell { color: var(--color-text-muted); font-size: var(--font-size-xs); font-family: monospace; }
.result-badge { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; }
.badge-sent { background: var(--color-success-bg); color: var(--color-success); }
.badge-failed { background: var(--color-error-bg); color: var(--color-error); }
.pagination { display: flex; justify-content: center; gap: var(--space-2); margin-top: var(--space-8); }
.page-btn { width: 36px; height: 36px; border-radius: var(--radius); border: 1.5px solid var(--color-border); background: var(--color-bg-card); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; }
.page-btn:hover:not(:disabled):not(.dots) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn.dots { cursor: default; border-color: transparent; }
.empty-state { text-align: center; padding: var(--space-16) var(--space-8); }
.empty-icon { font-size: 56px; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-3); }
.empty-text { color: var(--color-text-muted); margin-bottom: var(--space-6); }
.empty-actions { display: flex; justify-content: center; gap: var(--space-3); flex-wrap: wrap; }
.skeleton { background: linear-gradient(90deg, #f0f0f5 25%, #e0e0ea 50%, #f0f0f5 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius); }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.toast { position: fixed; bottom: var(--space-8); left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; z-index: 1000; box-shadow: var(--shadow-lg); color: #fff; }
.toast.success { background: var(--color-success); }
.toast.error { background: var(--color-error); }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
.expand-enter-active, .expand-leave-active { transition: all 0.25s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { max-height: 0; opacity: 0; }
.expand-enter-to, .expand-leave-from { max-height: 800px; opacity: 1; }
.card { background: var(--color-bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--color-border); }
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: 10px var(--space-5); border-radius: var(--radius-full); font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none; transition: all var(--transition); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-navy); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-ghost { background: transparent; color: var(--color-text-muted); }
.btn-ghost:hover { background: var(--color-border); color: var(--color-navy); }
.btn-sm { padding: 6px var(--space-4); font-size: var(--font-size-xs); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.fade-in { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@media (max-width: 640px) {
  .wa-history { padding: var(--space-4); }
  .filters-bar { flex-direction: column; }
}
</style>
