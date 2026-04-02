<template>
  <div class="wa-templates fade-in" dir="rtl">
    <!-- ── Loading skeleton ─────────────────────────────────────────── -->
    <div v-if="loading" class="tmpl-loading">
      <div class="skeleton sk-header"></div>
      <div class="skeleton-grid">
        <div class="skeleton sk-list"></div>
        <div class="skeleton sk-preview"></div>
      </div>
    </div>

    <!-- ── Error ─────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <p class="empty-state-title">שגיאה בטעינת התבניות</p>
      <p class="empty-state-text">{{ error }}</p>
      <button class="btn btn-primary" @click="loadTemplates">נסה שוב</button>
    </div>

    <!-- ── Main content ──────────────────────────────────────────────── -->
    <template v-else>
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📝 תבניות הודעות WhatsApp</h1>
          <p class="page-sub">נהל תבניות לשליחת הודעות לאורחים</p>
        </div>
        <button class="btn btn-primary" @click="openAddModal">+ הוסף תבנית</button>
      </div>

      <!-- ── Layout: list + preview ────────────────────────────────── -->
      <div class="tmpl-layout">

        <!-- Template list -->
        <div class="tmpl-list-col">
          <!-- Empty state -->
          <div v-if="templates.length === 0" class="empty-state card">
            <div class="empty-state-icon">📄</div>
            <p class="empty-state-title">אין תבניות עדיין</p>
            <p class="empty-state-text">צור תבנית ראשונה לשליחת הזמנות ותזכורות</p>
            <button class="btn btn-primary" @click="openAddModal">צור תבנית ראשונה</button>
          </div>

          <!-- List items -->
          <div v-else class="tmpl-list">
            <div
              v-for="tmpl in templates"
              :key="tmpl.id"
              class="tmpl-item card"
              :class="{ 'tmpl-item-active': selectedTemplate?.id === tmpl.id }"
              @click="selectTemplate(tmpl)"
            >
              <div class="tmpl-item-header">
                <div class="tmpl-item-title">{{ tmpl.name }}</div>
                <span class="badge" :class="typeBadgeClass(tmpl.type)">
                  {{ typeLabel(tmpl.type) }}
                </span>
              </div>
              <p class="tmpl-item-preview">{{ tmpl.content.substring(0, 80) }}{{ tmpl.content.length > 80 ? '...' : '' }}</p>
              <div class="tmpl-item-footer">
                <span class="tmpl-chars">{{ tmpl.content.length }} תווים</span>
                <div class="tmpl-actions" @click.stop>
                  <button class="icon-btn" @click="copyTemplate(tmpl)" title="העתק">📋</button>
                  <button class="icon-btn" @click="openEditModal(tmpl)" title="ערוך">✏️</button>
                  <button class="icon-btn icon-btn-danger" @click="deleteTemplate(tmpl)" title="מחק">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview pane -->
        <div class="tmpl-preview-col">
          <div class="card tmpl-preview-card">
            <div class="preview-header">
              <h3 class="preview-title">👁️ תצוגה מקדימה</h3>
              <span v-if="selectedTemplate" class="badge" :class="typeBadgeClass(selectedTemplate.type)">
                {{ typeLabel(selectedTemplate.type) }}
              </span>
            </div>

            <div v-if="!selectedTemplate" class="preview-empty">
              <div class="preview-empty-icon">👈</div>
              <p>בחר תבנית מהרשימה</p>
            </div>

            <div v-else class="preview-content">
              <!-- WhatsApp bubble mockup -->
              <div class="wa-phone-mock">
                <div class="wa-header">
                  <div class="wa-avatar">💍</div>
                  <div class="wa-contact">
                    <div class="wa-contact-name">{{ selectedTemplate.name }}</div>
                    <div class="wa-contact-sub">WhatsApp Business</div>
                  </div>
                </div>
                <div class="wa-messages">
                  <div class="wa-bubble">
                    <p class="wa-bubble-text">{{ previewContent }}</p>
                    <span class="wa-bubble-time">{{ nowTime }}</span>
                  </div>
                </div>
              </div>

              <!-- Variables used -->
              <div class="preview-vars" v-if="usedVars.length > 0">
                <h4 class="vars-title">משתנים בתבנית:</h4>
                <div class="vars-list">
                  <span v-for="v in usedVars" :key="v" class="var-tag">{{ '{' + v + '}' }}</span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="preview-btns">
                <button class="btn btn-primary btn-sm" @click="openEditModal(selectedTemplate)">✏️ ערוך</button>
                <button class="btn btn-outline btn-sm" @click="copyTemplate(selectedTemplate)">📋 העתק</button>
                <router-link to="/app/whatsapp/send" class="btn btn-outline btn-sm">🚀 שלח</router-link>
              </div>
            </div>
          </div>

          <!-- Variables help card -->
          <div class="card vars-help-card">
            <div class="vars-help-pad">
              <h4 class="vars-help-title">💡 משתנים זמינים</h4>
              <p class="vars-help-sub">לחץ להוסיף לתבנית בעריכה</p>
              <div class="vars-chips">
                <button
                  v-for="v in availableVars"
                  :key="v.key"
                  class="var-chip"
                  @click="insertVariableToCurrentEdit(v.key)"
                  :title="v.desc"
                  type="button"
                >
                  <span class="var-chip-key">{{ '{' + v.key + '}' }}</span>
                  <span class="var-chip-desc">{{ v.desc }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Add/Edit Modal ────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal" dir="rtl">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingTemplate ? 'ערוך תבנית' : 'הוסף תבנית חדשה' }}</h2>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>
          <div class="modal-body">
            <!-- Name -->
            <div class="form-group">
              <label class="form-label">שם התבנית *</label>
              <input
                v-model="form.name"
                type="text"
                class="form-input"
                placeholder="לדוגמה: הזמנה לחתונה"
                maxlength="100"
              />
            </div>

            <!-- Type -->
            <div class="form-group">
              <label class="form-label">סוג התבנית</label>
              <select v-model="form.type" class="form-input">
                <option value="rsvp_invite">הזמנת RSVP</option>
                <option value="reminder">תזכורת</option>
                <option value="thank_you">תודה</option>
                <option value="custom">מותאם אישית</option>
              </select>
            </div>

            <!-- Content -->
            <div class="form-group">
              <label class="form-label">תוכן ההודעה *</label>
              <div class="textarea-toolbar">
                <button
                  v-for="v in availableVars"
                  :key="v.key"
                  class="var-insert-btn"
                  @click="insertToForm(v.key)"
                  :title="v.desc"
                  type="button"
                >{{ '{' + v.key + '}' }}</button>
              </div>
              <textarea
                ref="contentTextarea"
                v-model="form.content"
                class="form-textarea"
                rows="6"
                placeholder="שלום {שם_אורח}, אנו שמחים להזמין אתכם לחתונה שלנו ביום {תאריך_חתונה}..."
                maxlength="1000"
              ></textarea>
              <div class="char-counter" :class="{ 'char-warning': form.content.length > 800 }">
                {{ form.content.length }} / 1000 תווים
              </div>
            </div>

            <!-- Live preview -->
            <div class="modal-preview" v-if="form.content">
              <h4 class="modal-preview-title">תצוגה מקדימה (עם נתוני דוגמה):</h4>
              <div class="modal-preview-bubble">{{ previewFormContent }}</div>
            </div>

            <p v-if="formError" class="form-error">{{ formError }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="closeModal">ביטול</button>
            <button class="btn btn-primary" @click="saveTemplate" :disabled="saving">
              {{ saving ? 'שומר...' : editingTemplate ? 'שמור שינויים' : 'הוסף תבנית' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Copy toast -->
    <Teleport to="body">
      <div v-if="copyToast" class="copy-toast">✅ הועתק ללוח!</div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const error = ref('')
const templates = ref([])
const selectedTemplate = ref(null)
const showModal = ref(false)
const editingTemplate = ref(null)
const saving = ref(false)
const formError = ref('')
const copyToast = ref(false)
const contentTextarea = ref(null)

const form = ref({ name: '', type: 'custom', content: '' })

const SAMPLE = { name: 'ישראל ישראלי', date: '12/06/2026', link: 'https://yalla.wedding/rsvp/abc', venue: 'אולם הרקפות', couple: 'דנה ויוסי' }

const availableVars = [
  { key: 'שם_אורח',     desc: 'שם האורח' },
  { key: 'תאריך_חתונה', desc: 'תאריך החתונה' },
  { key: 'קישור_RSVP',  desc: 'קישור לאישור הגעה' },
  { key: 'שם_מקום',     desc: 'שם מקום האירוע' },
  { key: 'שם_זוג',      desc: 'שמות הזוג' },
]

const nowTime = computed(() => {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
})

const usedVars = computed(() => {
  if (!selectedTemplate.value) return []
  const m = selectedTemplate.value.content.match(/\{([^}]+)\}/g) || []
  return [...new Set(m.map(v => v.replace(/[{}]/g, '')))]
})

function applyVars(text) {
  return text
    .replace(/\{שם_אורח\}/g, SAMPLE.name)
    .replace(/\{תאריך_חתונה\}/g, SAMPLE.date)
    .replace(/\{קישור_RSVP\}/g, SAMPLE.link)
    .replace(/\{שם_מקום\}/g, SAMPLE.venue)
    .replace(/\{שם_זוג\}/g, SAMPLE.couple)
}

const previewContent = computed(() => selectedTemplate.value ? applyVars(selectedTemplate.value.content) : '')
const previewFormContent = computed(() => applyVars(form.value.content))

onMounted(() => loadTemplates())

async function loadTemplates() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/whatsapp/templates')
    templates.value = res.data
  } catch (err) {
    error.value = err?.response?.data?.error || 'שגיאה בטעינת תבניות'
  } finally {
    loading.value = false
  }
}

function selectTemplate(tmpl) { selectedTemplate.value = tmpl }

function openAddModal() {
  editingTemplate.value = null
  form.value = { name: '', type: 'custom', content: '' }
  formError.value = ''
  showModal.value = true
}

function openEditModal(tmpl) {
  editingTemplate.value = tmpl
  form.value = { name: tmpl.name, type: tmpl.type || 'custom', content: tmpl.content }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTemplate.value = null
  formError.value = ''
}

async function saveTemplate() {
  formError.value = ''
  if (!form.value.name.trim()) { formError.value = 'שם התבנית הוא שדה חובה'; return }
  if (!form.value.content.trim()) { formError.value = 'תוכן ההודעה הוא שדה חובה'; return }

  saving.value = true
  try {
    if (editingTemplate.value) {
      const res = await api.put(`/whatsapp/templates/${editingTemplate.value.id}`, form.value)
      const idx = templates.value.findIndex(t => t.id === editingTemplate.value.id)
      if (idx !== -1) templates.value[idx] = res.data
      if (selectedTemplate.value?.id === editingTemplate.value.id) selectedTemplate.value = res.data
    } else {
      const res = await api.post('/whatsapp/templates', form.value)
      templates.value.unshift(res.data)
      selectedTemplate.value = res.data
    }
    closeModal()
  } catch (err) {
    formError.value = err?.response?.data?.error || 'שגיאה בשמירת התבנית'
  } finally {
    saving.value = false
  }
}

async function deleteTemplate(tmpl) {
  if (!confirm(`האם למחוק את התבנית "${tmpl.name}"?`)) return
  try {
    await api.delete(`/whatsapp/templates/${tmpl.id}`)
    templates.value = templates.value.filter(t => t.id !== tmpl.id)
    if (selectedTemplate.value?.id === tmpl.id) selectedTemplate.value = null
  } catch (err) {
    alert(err?.response?.data?.error || 'שגיאה במחיקת התבנית')
  }
}

function copyTemplate(tmpl) {
  navigator.clipboard.writeText(tmpl.content).catch(() => {})
  copyToast.value = true
  setTimeout(() => { copyToast.value = false }, 2000)
}

function insertToForm(varKey) {
  const el = contentTextarea.value
  const text = `{${varKey}}`
  if (el) {
    const s = el.selectionStart
    const e = el.selectionEnd
    form.value.content = form.value.content.substring(0, s) + text + form.value.content.substring(e)
    nextTick(() => {
      el.focus()
      el.setSelectionRange(s + text.length, s + text.length)
    })
  } else {
    form.value.content += text
  }
}

function insertVariableToCurrentEdit(varKey) {
  if (!showModal.value) {
    if (selectedTemplate.value) openEditModal(selectedTemplate.value)
    else openAddModal()
    nextTick(() => insertToForm(varKey))
  } else {
    insertToForm(varKey)
  }
}

function typeBadgeClass(type) {
  const map = { rsvp_invite: 'badge-primary', reminder: 'badge-warning', thank_you: 'badge-success', custom: 'badge-neutral' }
  return map[type] || 'badge-neutral'
}

function typeLabel(type) {
  const map = { rsvp_invite: 'הזמנת RSVP', reminder: 'תזכורת', thank_you: 'תודה', custom: 'מותאם' }
  return map[type] || type
}
</script>

<style scoped>
.wa-templates {
  padding: var(--space-6) var(--space-8);
  max-width: var(--content-max);
  margin: 0 auto;
}

/* ── Loading ─────────────────────────────────────────────── */
.tmpl-loading { display: flex; flex-direction: column; gap: var(--space-5); }
.sk-header { height: 60px; border-radius: var(--radius-lg); }
.skeleton-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-5); }
.sk-list    { height: 400px; border-radius: var(--radius-xl); }
.sk-preview { height: 400px; border-radius: var(--radius-xl); }

/* ── Page header ─────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.page-title { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub   { font-size: var(--font-size-sm); color: var(--color-text-muted); }

/* ── Layout ──────────────────────────────────────────────── */
.tmpl-layout {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: var(--space-5);
  align-items: start;
}

/* ── Template list ───────────────────────────────────────── */
.tmpl-list { display: flex; flex-direction: column; gap: var(--space-3); }

.tmpl-item {
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  transition: all var(--transition);
  border: 2px solid transparent;
}
.tmpl-item:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.tmpl-item-active { border-color: var(--color-primary) !important; box-shadow: var(--shadow-pink) !important; }

.tmpl-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}
.tmpl-item-title  { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); }
.tmpl-item-preview { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; margin-bottom: var(--space-3); }
.tmpl-item-footer { display: flex; align-items: center; justify-content: space-between; }
.tmpl-chars { font-size: var(--font-size-xs); color: var(--color-text-light); }

.tmpl-actions { display: flex; gap: var(--space-1); }
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius);
  transition: background var(--transition);
}
.icon-btn:hover { background: var(--color-bg-subtle); }
.icon-btn-danger:hover { background: var(--color-error-bg); }

/* ── Preview col ─────────────────────────────────────────── */
.tmpl-preview-col { display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: var(--space-4); }
.tmpl-preview-card { overflow: hidden; }
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.preview-title { font-size: var(--font-size-base); font-weight: 800; color: var(--color-navy); }

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.preview-empty-icon { font-size: 2.5rem; }

.preview-content { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }

/* WA Mock */
.wa-phone-mock { background: #e5ddd5; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
.wa-header { background: #075e54; padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3); }
.wa-avatar { width: 36px; height: 36px; background: #128c7e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.wa-contact-name { font-size: var(--font-size-sm); font-weight: 700; color: #fff; }
.wa-contact-sub  { font-size: var(--font-size-xs); color: rgba(255,255,255,0.7); }
.wa-messages { padding: var(--space-4); min-height: 80px; }
.wa-bubble {
  background: #fff;
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  max-width: 90%;
  box-shadow: var(--shadow-xs);
}
.wa-bubble-text { font-size: var(--font-size-sm); color: #1A1A1A; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.wa-bubble-time { font-size: 10px; color: #999; display: block; text-align: left; margin-top: var(--space-1); }

/* Preview vars */
.preview-vars { }
.vars-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.vars-list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.var-tag {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  padding: 2px var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
.preview-btns { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.preview-btns .btn { text-decoration: none; display: inline-flex; align-items: center; }

/* Variables help card */
.vars-help-card { overflow: hidden; }
.vars-help-pad { padding: var(--space-4) var(--space-5); }
.vars-help-title { font-size: var(--font-size-sm); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-1); }
.vars-help-sub { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-3); }
.vars-chips { display: flex; flex-direction: column; gap: var(--space-2); }
.var-chip {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: right;
  transition: all var(--transition);
  font-size: var(--font-size-sm);
  width: 100%;
}
.var-chip:hover { background: var(--color-primary-bg); border-color: var(--color-primary); }
.var-chip-key  { font-weight: 700; color: var(--color-primary); font-family: monospace; font-size: var(--font-size-xs); }
.var-chip-desc { color: var(--color-text-muted); font-size: var(--font-size-xs); }

/* ── Empty card ──────────────────────────────────────────── */
.empty-state.card { padding: var(--space-10); }

/* ── Modal ───────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(26,31,54,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg-card);
  z-index: 1;
}
.modal-title { font-size: var(--font-size-xl); font-weight: 900; color: var(--color-navy); }
.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius);
  transition: all var(--transition);
}
.modal-close:hover { background: var(--color-error-bg); color: var(--color-error); }
.modal-body { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
}

/* Form */
.form-group { display: flex; flex-direction: column; gap: var(--space-2); }
.form-label { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); }
.form-input {
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font);
  outline: none;
  transition: border-color var(--transition);
  background: var(--color-bg-card);
  color: var(--color-text);
  text-align: right;
}
.form-input:focus { border-color: var(--color-primary); }
.textarea-toolbar { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.var-insert-btn {
  padding: 2px var(--space-2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}
.var-insert-btn:hover { background: var(--color-primary); color: #fff; }
.form-textarea {
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: var(--font);
  outline: none;
  resize: vertical;
  transition: border-color var(--transition);
  text-align: right;
  direction: rtl;
  line-height: 1.6;
}
.form-textarea:focus { border-color: var(--color-primary); }
.char-counter { font-size: var(--font-size-xs); color: var(--color-text-muted); text-align: left; }
.char-warning  { color: var(--color-warning); font-weight: 700; }
.form-error    { color: var(--color-error); font-size: var(--font-size-sm); font-weight: 600; }
.modal-preview { background: var(--color-bg-subtle); border-radius: var(--radius-lg); padding: var(--space-4); }
.modal-preview-title { font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-muted); margin-bottom: var(--space-2); }
.modal-preview-bubble {
  background: #fff;
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  color: #1A1A1A;
  border-right: 3px solid var(--color-primary);
}

/* Copy toast */
.copy-toast {
  position: fixed;
  bottom: var(--space-8);
  right: 50%;
  transform: translateX(50%);
  background: var(--color-navy);
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  z-index: 2000;
  box-shadow: var(--shadow-lg);
  animation: toast-in 0.2s ease;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateX(50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(50%) translateY(0); }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .tmpl-layout { grid-template-columns: 1fr; }
  .tmpl-preview-col { position: static; }
  .skeleton-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .wa-templates { padding: var(--space-4); }
  .modal { max-width: 100%; border-radius: var(--radius-xl) var(--radius-xl) 0 0; }
  .modal-backdrop { align-items: flex-end; }
}
</style>
