<template>
  <div class="import-view fade-in" dir="rtl">
    <div class="back-row">
      <button class="btn-back" @click="$router.push('/app/guests')">← חזרה לאורחים</button>
    </div>

    <div class="page-header">
      <h1 class="page-title">ייבוא אורחים 📥</h1>
      <p class="page-sub">ייבא רשימת אורחים מקובץ Excel או CSV</p>
    </div>

    <div class="card">
      <div v-if="currentStep === 0">
        <h2 class="card-title">שלב 1: העלאת קובץ</h2>
        <div class="drop-zone" :class="{ dragover: isDragging, uploaded: !!file }" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="onDrop" @click="fileInput.click()">
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

        <div v-if="uploadError" class="error-msg">⚠️ {{ uploadError }}</div>

        <div class="step-footer">
          <span></span>
          <button class="btn btn-primary" :disabled="!file || loading" @click="uploadPreview">
            <span v-if="loading">⏳ מעבד...</span>
            <span v-else>המשך ← תצוגה מקדימה</span>
          </button>
        </div>
      </div>

      <div v-if="currentStep === 1">
        <h2 class="card-title">שלב 2: תצוגה מקדימה</h2>
        <p class="card-desc">נמצאו <strong>{{ previewData.totalRows }}</strong> שורות בקובץ. מוצגות עד 5 שורות ראשונות.</p>

        <div class="preview-table-wrap">
          <table class="preview-table">
            <thead>
              <tr><th v-for="h in previewData.headers" :key="h">{{ h }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in previewData.preview" :key="i">
                <td v-for="h in previewData.headers" :key="h">{{ row[h] ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="step-footer">
          <button class="btn btn-outline" @click="currentStep = 0">← חזרה</button>
          <button class="btn btn-primary" :disabled="loading" @click="doImport">✅ ייבא {{ previewData.totalRows }} אורחים</button>
        </div>
      </div>

      <div v-if="currentStep === 2">
        <div class="results-card">
          <div class="results-icon">{{ importResult.imported > 0 ? '🎉' : '⚠️' }}</div>
          <h2 class="results-title">ייבוא הושלם!</h2>
          <div class="results-stats">
            <div class="result-stat"><span class="stat-num success-num">{{ importResult.imported }}</span><span class="stat-label">אורחים יובאו</span></div>
            <div class="result-stat" v-if="importResult.skipped > 0"><span class="stat-num warn-num">{{ importResult.skipped }}</span><span class="stat-label">דולגו</span></div>
          </div>
          <div v-if="importResult.errors?.length" class="results-errors">
            <h4>שגיאות:</h4>
            <ul><li v-for="e in importResult.errors" :key="e.name">{{ e.name }}: {{ e.error }}</li></ul>
          </div>
          <div class="results-actions">
            <button class="btn btn-outline" @click="resetWizard">ייבוא נוסף</button>
            <button class="btn btn-primary" @click="$router.push('/app/guests')">← לרשימת אורחים</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/composables/useApi'

const currentStep = ref(0)
const loading = ref(false)
const isDragging = ref(false)
const uploadError = ref('')
const file = ref(null)
const fileInput = ref(null)
const previewData = ref({ headers: [], preview: [], totalRows: 0 })
const importResult = ref(null)

function setFile(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext)) { uploadError.value = 'סוג קובץ לא נתמך. אנא העלה xlsx, xls, או csv.'; return }
  uploadError.value = ''
  file.value = f
}
function onDrop(e) { isDragging.value = false; const f = e.dataTransfer.files[0]; if (f) setFile(f) }
function onFileChange(e) { const f = e.target.files[0]; if (f) setFile(f) }
function removeFile() { file.value = null; if (fileInput.value) fileInput.value.value = '' }

async function uploadPreview() {
  if (!file.value) return
  loading.value = true
  try {
    const fd = new FormData(); fd.append('file', file.value)
    const res = await api.post('/guests/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    previewData.value = res.data
    currentStep.value = 1
  } catch (e) { uploadError.value = e.response?.data?.message || 'שגיאה בעיבוד הקובץ' }
  finally { loading.value = false }
}

async function doImport() {
  loading.value = true
  try {
    const fd = new FormData(); fd.append('file', file.value)
    const res = await api.post('/guests/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    importResult.value = res.data
    currentStep.value = 2
  } catch (e) { uploadError.value = e.response?.data?.message || 'שגיאה בייבוא' }
  finally { loading.value = false }
}

function resetWizard() { currentStep.value = 0; file.value = null; previewData.value = { headers: [], preview: [], totalRows: 0 }; importResult.value = null; uploadError.value = '' }
</script>

<style scoped>
.import-view { padding: var(--space-6); max-width: 800px; }
.back-row { margin-bottom: var(--space-4); }
.btn-back { background: none; border: none; cursor: pointer; font-family: var(--font); font-size: var(--font-size-sm); font-weight: 600; color: var(--color-primary); }
.card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1.5px solid var(--color-border); }
.drop-zone { border: 2.5px dashed var(--color-border); border-radius: var(--radius-xl); padding: var(--space-12) var(--space-8); text-align: center; cursor: pointer; }
.preview-table-wrap { overflow-x: auto; border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); margin-bottom: var(--space-5); }
.preview-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-xs); }
.preview-table th { padding: var(--space-2) var(--space-3); background: var(--color-bg-subtle); border-bottom: 1.5px solid var(--color-border); font-weight: 700; text-align: right; color: var(--color-text-muted); }
.preview-table td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border); text-align: right; }
.step-footer { display: flex; justify-content: space-between; margin-top: var(--space-4); }
.results-card { text-align: center; padding: var(--space-8); }
.results-actions { display: flex; justify-content: center; gap: var(--space-3); }
</style>