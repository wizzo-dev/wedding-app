<template>
  <div class="import-view fade-in" dir="rtl">

    <!-- Back -->
    <div class="back-row">
      <button class="btn-back" @click="$router.push('/app/guests')">← חזרה לאורחים</button>
    </div>

    <!-- Page title -->
    <div class="page-header">
      <h1 class="page-title">ייבוא אורחים 📥</h1>
      <p class="page-sub">ייבא רשימת אורחים מקובץ Excel או CSV</p>
    </div>

    <!-- Step indicator -->
    <div class="steps-indicator">
      <div v-for="(step, i) in STEPS" :key="i" class="step-item" :class="{ active: currentStep === i, done: currentStep > i }">
        <div class="step-circle">{{ currentStep > i ? '✓' : i + 1 }}</div>
        <div class="step-label">{{ step }}</div>
      </div>
      <div class="step-line" v-for="i in STEPS.length - 1" :key="`line-${i}`" :class="{ done: currentStep >= i }"></div>
    </div>

    <!-- ────────────────────────────────────────────────────────────────────── -->
    <!-- STEP 0: Upload file -->
    <!-- ────────────────────────────────────────────────────────────────────── -->
    <div v-if="currentStep === 0" class="step-content">
      <div class="card">
        <h2 class="card-title">שלב 1: העלאת קובץ</h2>
        <p class="card-desc">קובצי Excel (.xlsx, .xls) או CSV מקובלים. הקובץ צריך להכיל לפחות עמודת <strong>שם</strong>.</p>

        <!-- Drag & drop zone -->
        <div
          class="drop-zone"
          :class="{ dragover: isDragging, uploaded: !!file }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
          @click="fileInput.click()"
        >
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="onFileChange" style="display:none" />
          <template v-if="!file">
            <div class="drop-icon">📁</div>
            <p class="drop-text">גרור ושחרר קובץ כאן</p>
            <p class="drop-sub">או לחץ לבחירת קובץ</p>
            <span class="drop-formats">xlsx · xls · csv</span>
          </template>
          <template v-else>
            <div class="drop-icon">✅</div>
            <p class="drop-text">{{ file.name }}</p>
            <p class="drop-sub">{{ (file.size / 1024).toFixed(1) }} KB</p>
            <button class="btn-remove-file" @click.stop="removeFile">✕ הסר</button>
          </template>
        </div>

        <!-- Template download hint -->
        <div class="template-hint">
          <span>💡 הורד</span>
          <a href="#" class="template-link" @click.prevent="downloadTemplate">תבנית Excel לדוגמה</a>
          <span>עם העמודות הנכונות</span>
        </div>

        <!-- Error -->
        <div v-if="uploadError" class="error-msg">⚠️ {{ uploadError }}</div>

        <div class="step-footer">
          <span></span>
          <button class="btn btn-primary" :disabled="!file || loading" @click="uploadPreview">
            <span v-if="loading">⏳ מעבד...</span>
            <span v-else>המשך → תצוגה מקדימה</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ────────────────────────────────────────────────────────────────────── -->
    <!-- STEP 1: Preview + column mapping -->
    <!-- ────────────────────────────────────────────────────────────────────── -->
    <div v-if="currentStep === 1" class="step-content">
      <div class="card">
        <h2 class="card-title">שלב 2: מיפוי עמודות</h2>
        <p class="card-desc">התאם את עמודות הקובץ לשדות המערכת. נמצאו <strong>{{ previewData.total }}</strong> אורחים בקובץ.</p>

        <!-- Column mapping -->
        <div class="mapping-grid">
          <div v-for="field in FIELDS" :key="field.key" class="mapping-row">
            <div class="mapping-field">
              <span class="field-name">{{ field.label }}</span>
              <span v-if="field.required" class="required-mark">*</span>
            </div>
            <span class="mapping-arrow">←</span>
            <select v-model="columnMap[field.key]" class="form-input mapping-select">
              <option value="">{{ field.required ? '— חובה לבחור —' : '— לא ממופה —' }}</option>
              <option v-for="h in previewData.headers" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>

        <!-- Preview table -->
        <div class="preview-section">
          <h3 class="preview-title">תצוגה מקדימה ({{ Math.min(previewData.preview.length, 5) }} שורות ראשונות)</h3>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="h in previewData.headers" :key="h">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in previewData.preview.slice(0, 5)" :key="i">
                  <td v-for="h in previewData.headers" :key="h">{{ row[h] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="preview-note" v-if="previewData.preview.length > 5">... ועוד {{ previewData.preview.length - 5 }} שורות</p>
        </div>

        <div class="step-footer">
          <button class="btn btn-outline" @click="currentStep = 0">← חזרה</button>
          <button class="btn btn-primary" :disabled="!columnMap.name" @click="currentStep = 2">
            המשך → אישור ייבוא
          </button>
        </div>
      </div>
    </div>

    <!-- ────────────────────────────────────────────────────────────────────── -->
    <!-- STEP 2: Confirm + results -->
    <!-- ────────────────────────────────────────────────────────────────────── -->
    <div v-if="currentStep === 2" class="step-content">
      <div v-if="!importResult" class="card">
        <h2 class="card-title">שלב 3: אישור ייבוא</h2>
        <p class="card-desc">עומד לייבא <strong>{{ previewData.total }}</strong> אורחים לרשימה.</p>

        <!-- Summary -->
        <div class="confirm-summary">
          <div v-for="field in FIELDS.filter(f => columnMap[f.key])" :key="field.key" class="summary-row">
            <span class="summary-field">{{ field.label }}</span>
            <span class="summary-col">עמודה: <strong>{{ columnMap[field.key] }}</strong></span>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn btn-outline" @click="currentStep = 1">← חזרה</button>
          <button class="btn btn-primary" :disabled="loading" @click="doImport">
            <span v-if="loading">⏳ מייבא...</span>
            <span v-else>✅ ייבא {{ previewData.total }} אורחים</span>
          </button>
        </div>
      </div>

      <!-- Import results -->
      <div v-else class="card results-card">
        <div class="results-icon" :class="importResult.imported > 0 ? 'success' : 'warn'">
          {{ importResult.imported > 0 ? '🎉' : '⚠️' }}
        </div>
        <h2 class="results-title">ייבוא הושלם!</h2>
        <div class="results-stats">
          <div class="result-stat">
            <span class="stat-num success-num">{{ importResult.imported }}</span>
            <span class="stat-label">אורחים יובאו</span>
          </div>
          <div class="result-stat" v-if="importResult.skipped > 0">
            <span class="stat-num warn-num">{{ importResult.skipped }}</span>
            <span class="stat-label">דולגו</span>
          </div>
        </div>
        <div v-if="importResult.errors?.length" class="results-errors">
          <h4>שגיאות:</h4>
          <ul>
            <li v-for="e in importResult.errors" :key="e">{{ e }}</li>
          </ul>
        </div>
        <div class="results-actions">
          <button class="btn btn-outline" @click="resetWizard">ייבוא נוסף</button>
          <button class="btn btn-primary" @click="$router.push('/app/guests')">← לרשימת אורחים</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/composables/useApi'

const STEPS = ['העלאת קובץ', 'מיפוי עמודות', 'אישור ייבוא']
const FIELDS = [
  { key: 'name',       label: 'שם מלא',    required: true },
  { key: 'phone',      label: 'טלפון',     required: false },
  { key: 'email',      label: 'מייל',      required: false },
  { key: 'groupName',  label: 'קבוצה',     required: false },
  { key: 'side',       label: 'צד',        required: false },
  { key: 'rsvpStatus', label: 'RSVP',      required: false },
  { key: 'numPeople',  label: 'נפשות',     required: false },
  { key: 'notes',      label: 'הערות',     required: false }
]

const currentStep = ref(0)
const loading = ref(false)
const isDragging = ref(false)
const uploadError = ref('')
const file = ref(null)
const fileInput = ref(null)

const previewData = ref({ headers: [], preview: [], total: 0 })
const columnMap = reactive({})
const importResult = ref(null)

function onDrop(e) {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f) setFile(f)
}

function onFileChange(e) {
  const f = e.target.files[0]
  if (f) setFile(f)
}

function setFile(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    uploadError.value = 'סוג קובץ לא נתמך. אנא העלה xlsx, xls, או csv.'
    return
  }
  uploadError.value = ''
  file.value = f
}

function removeFile() {
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadPreview() {
  if (!file.value) return
  loading.value = true
  uploadError.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    const res = await api.post('/guests/preview', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    previewData.value = res.data

    // Auto-map known column names
    const headers = res.data.headers
    FIELDS.forEach(field => {
      const match = headers.find(h => {
        const hl = h.toLowerCase()
        if (field.key === 'name') return hl.includes('שם') || hl.includes('name')
        if (field.key === 'phone') return hl.includes('טל') || hl.includes('phone') || hl.includes('נייד')
        if (field.key === 'email') return hl.includes('מייל') || hl.includes('email') || hl.includes('mail')
        if (field.key === 'groupName') return hl.includes('קבוצ') || hl.includes('group')
        if (field.key === 'side') return hl.includes('צד') || hl.includes('side')
        if (field.key === 'numPeople') return hl.includes('נפש') || hl.includes('כמה') || hl.includes('people')
        if (field.key === 'notes') return hl.includes('הערות') || hl.includes('note')
        return false
      })
      columnMap[field.key] = match || ''
    })

    currentStep.value = 1
  } catch (e) {
    uploadError.value = e.response?.data?.message || 'שגיאה בעיבוד הקובץ'
  } finally {
    loading.value = false
  }
}

async function doImport() {
  loading.value = true
  try {
    // Transform preview rows using the column map
    const rows = previewData.value.preview.map(row => {
      const mapped = {}
      FIELDS.forEach(field => {
        if (columnMap[field.key]) {
          mapped[field.key] = row[columnMap[field.key]]
        }
      })
      return mapped
    })

    // For large files, we need to re-upload. Here we send the mapped rows as JSON.
    // For full file import (more than preview), send the file again with mapping.
    const fd = new FormData()
    fd.append('file', file.value)
    // We'll use the JSON import endpoint with mapped rows
    const res = await api.post('/guests/import', { rows }, {
      headers: { 'Content-Type': 'application/json' }
    })
    importResult.value = res.data
  } catch (e) {
    alert(e.response?.data?.message || 'שגיאה בייבוא')
  } finally {
    loading.value = false
  }
}

function resetWizard() {
  currentStep.value = 0
  file.value = null
  previewData.value = { headers: [], preview: [], total: 0 }
  FIELDS.forEach(f => { columnMap[f.key] = '' })
  importResult.value = null
  uploadError.value = ''
}

function downloadTemplate() {
  // Create a simple CSV template
  const headers = 'שם מלא,טלפון,מייל,קבוצה,צד,נפשות,הערות'
  const sample = 'ישראל ישראלי,0501234567,israel@example.com,משפחה,חתן,2,'
  const csv = `${headers}\n${sample}`
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-guests.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.import-view { padding: var(--space-6); max-width: 800px; }

.back-row { margin-bottom: var(--space-4); }
.btn-back { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); }
.btn-back:hover { text-decoration: underline; }

.page-header { margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Steps indicator */
.steps-indicator { display: flex; align-items: center; gap: 0; margin-bottom: var(--space-8); position: relative; }
.step-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); flex: 1; position: relative; z-index: 1; }
.step-circle { width: 36px; height: 36px; border-radius: 50%; border: 2.5px solid var(--color-border); background: #fff; display: flex; align-items: center; justify-content: center; font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-muted); transition: var(--transition); }
.step-item.active .step-circle { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
.step-item.done .step-circle { border-color: var(--color-success); background: var(--color-success); color: #fff; }
.step-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
.step-item.active .step-label { color: var(--color-primary); }
.step-item.done .step-label { color: var(--color-success); }
.step-line { flex: 1; height: 2px; background: var(--color-border); margin-top: -var(--space-2); margin-bottom: auto; position: absolute; top: 17px; width: calc(100% / 3 - 20px); left: calc(var(--space-5) + 18px); }
/* This approach is complex; let's just do it simpler */

/* Card */
.card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.card-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.card-desc { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-5); line-height: 1.6; }

/* Drop zone */
.drop-zone { border: 2.5px dashed var(--color-border); border-radius: var(--radius-xl); padding: var(--space-12) var(--space-8); text-align: center; cursor: pointer; transition: var(--transition); display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
.drop-zone:hover, .drop-zone.dragover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.drop-zone.uploaded { border-style: solid; border-color: var(--color-success); background: var(--color-success-bg); }
.drop-icon { font-size: 52px; }
.drop-text { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }
.drop-sub { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.drop-formats { font-size: var(--font-size-xs); color: var(--color-text-light); background: var(--color-bg-subtle); padding: 2px 10px; border-radius: var(--radius-full); }
.btn-remove-file { background: var(--color-error-bg); color: var(--color-error); border: 1.5px solid var(--color-error); border-radius: var(--radius); padding: 4px 14px; font-family: var(--font); font-size: var(--font-size-xs); font-weight: 600; cursor: pointer; margin-top: var(--space-2); }

.template-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); display: flex; gap: var(--space-1); align-items: center; flex-wrap: wrap; }
.template-link { color: var(--color-primary); text-decoration: underline; cursor: pointer; }
.error-msg { background: var(--color-error-bg); color: var(--color-error); border-radius: var(--radius); padding: var(--space-3) var(--space-4); font-size: var(--font-size-sm); font-weight: 600; margin-top: var(--space-3); }

/* Mapping */
.mapping-grid { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-5); }
.mapping-row { display: flex; align-items: center; gap: var(--space-3); }
.mapping-field { width: 100px; display: flex; align-items: center; gap: var(--space-1); flex-shrink: 0; }
.field-name { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.required-mark { color: var(--color-primary); font-weight: 900; }
.mapping-arrow { color: var(--color-text-muted); font-size: 18px; }
.mapping-select { flex: 1; }

/* Preview table */
.preview-section { margin-top: var(--space-5); }
.preview-title { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-3); }
.preview-table-wrap { overflow-x: auto; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); }
.preview-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-xs); }
.preview-table th { padding: var(--space-2) var(--space-3); background: var(--color-bg-subtle); border-bottom: 1.5px solid var(--color-border); font-weight: 700; text-align: right; color: var(--color-text-muted); white-space: nowrap; }
.preview-table td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); text-align: right; white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
.preview-table tr:last-child td { border-bottom: none; }
.preview-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: var(--space-2); text-align: center; }

/* Confirm summary */
.confirm-summary { background: var(--color-bg-subtle); border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
.summary-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); }
.summary-field { font-weight: 600; color: var(--color-navy); }
.summary-col { color: var(--color-text-muted); }

/* Results */
.results-card { text-align: center; padding: var(--space-10); }
.results-icon { font-size: 64px; margin-bottom: var(--space-4); }
.results-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: var(--space-5); }
.results-stats { display: flex; justify-content: center; gap: var(--space-8); margin-bottom: var(--space-5); }
.result-stat { text-align: center; }
.stat-num { display: block; font-size: var(--font-size-4xl); font-weight: 900; }
.stat-num.success-num { color: var(--color-success); }
.stat-num.warn-num { color: var(--color-warning); }
.stat-label { font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: 600; }
.results-errors { background: var(--color-error-bg); border-radius: var(--radius); padding: var(--space-4); margin-bottom: var(--space-5); text-align: right; }
.results-errors h4 { color: var(--color-error); font-size: var(--font-size-sm); margin-bottom: var(--space-2); }
.results-errors ul { list-style: none; font-size: var(--font-size-xs); color: var(--color-error); display: flex; flex-direction: column; gap: 4px; }
.results-actions { display: flex; justify-content: center; gap: var(--space-3); }

/* Footer */
.step-footer { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-6); padding-top: var(--space-5); border-top: 1px solid var(--color-border); }
.step-content { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-5); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; border: none; transition: var(--transition-fast); }
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-outline { background: transparent; color: var(--color-navy); border: 1.5px solid var(--color-border); }
.btn-outline:hover { border-color: var(--color-navy); }

.form-input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-family: var(--font); font-size: var(--font-size-sm); background: var(--color-bg); color: var(--color-navy); outline: none; transition: var(--transition-fast); text-align: right; width: 100%; }
.form-input:focus { border-color: var(--color-primary); }

@media (max-width: 600px) {
  .import-view { padding: var(--space-4); }
  .mapping-row { flex-direction: column; align-items: flex-start; }
  .mapping-arrow { display: none; }
}
</style>
