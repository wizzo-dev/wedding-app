<template>
  <div class="invitation-public" dir="rtl">
    <div v-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">💌</div>
      <h2>ההזמנה לא נמצאה</h2>
      <p>הקישור אינו תקין או שההזמנה הוסרה</p>
    </div>

    <div v-else class="invitation-wrapper">
      <!-- Konva canvas with template + text overlay -->
      <div class="invitation-canvas-container" ref="canvasContainer">
        <div class="stage-wrap" :style="{ width: displayW + 'px', height: displayH + 'px' }">
          <v-stage :config="stageConfig">
            <v-layer>
              <v-image v-if="bgImage" :config="bgImageConfig" />
              <v-text
                v-for="(node, i) in textNodes"
                :key="i"
                :config="node"
              />
            </v-layer>
          </v-stage>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="invitation-actions" v-if="!isExportMode">
        <button class="action-btn" @click="handleRsvp">✅ אשר הגעה</button>
        <button class="action-btn secondary" @click="share">📤 שתף</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/composables/useApi'

const route = useRoute()
const loading = ref(true)
const error = ref(false)
const invitation = ref(null)
const bgImage = ref(null)
const canvasContainer = ref(null)
const scale = ref(1)

const CANVAS_W = 600
const CANVAS_H = 850

const isExportMode = computed(() => route.query.export === '1')

const displayW = computed(() => Math.round(CANVAS_W * scale.value))
const displayH = computed(() => Math.round(CANVAS_H * scale.value))

const stageConfig = computed(() => ({
  width: displayW.value,
  height: displayH.value,
  scaleX: scale.value,
  scaleY: scale.value,
}))

const bgImageConfig = computed(() => ({
  image: bgImage.value,
  x: 0, y: 0,
  width: CANVAS_W,
  height: CANVAS_H,
}))

function getFieldText(field) {
  if (!invitation.value) return ''
  const f = invitation.value.fields
  const map = {
    groomName:    f.groomName || '',
    brideName:    f.brideName || '',
    groomParents: f.groomParents || '',
    brideParents: f.brideParents || '',
    date:         f.date ? formatDate(f.date) : '',
    time:         f.time ? f.time.slice(0, 5) : '',
    venue:        f.venue || '',
    address:      f.address || '',
    blessing:     f.blessing || '',
    extraText:    f.extraText || '',
    andSign:      '&',
  }
  return map[field] ?? ''
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return d }
}

const textNodes = computed(() => {
  if (!invitation.value?.template?.textZones) return []
  const zones = invitation.value.template.textZones
  const font = invitation.value.font || 'Heebo'

  return zones.map(zone => {
    const text = getFieldText(zone.field)
    if (!text) return null
    const maxW = Math.round(zone.maxWidth * CANVAS_W)
    return {
      text,
      x: zone.x * CANVAS_W - maxW / 2,
      y: zone.y * CANVAS_H,
      width: maxW,
      fontSize: zone.fontSize,
      fontFamily: font,
      fill: zone.color,
      align: 'center',
      listening: false,
    }
  }).filter(Boolean)
})

function computeScale() {
  if (!canvasContainer.value) return
  const maxW = canvasContainer.value.clientWidth || window.innerWidth - 32
  scale.value = Math.min(1, (maxW - 16) / CANVAS_W)
}

async function loadInvitation() {
  try {
    const id = route.params.id
    const res = await api.get(`/invitations/${id}/public`)
    invitation.value = res.data

    // Load bg image
    if (invitation.value.template?.imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { bgImage.value = img }
      img.onerror = () => { bgImage.value = null }
      img.src = invitation.value.template.imageUrl
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function handleRsvp() {
  window.location.href = '/rsvp'
}

async function share() {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title: 'הזמנה לחתונה', url })
    } catch {}
  } else {
    navigator.clipboard.writeText(url)
    alert('הקישור הועתק!')
  }
}

onMounted(async () => {
  computeScale()
  window.addEventListener('resize', computeScale)
  await loadInvitation()
})

import { onUnmounted } from 'vue'
onUnmounted(() => window.removeEventListener('resize', computeScale))
</script>

<style scoped>
.invitation-public {
  min-height: 100vh;
  background: #f5f0eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  direction: rtl;
}

.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.error-state {
  text-align: center;
  padding: var(--space-12);
}
.error-icon { font-size: 4rem; margin-bottom: var(--space-4); }
.error-state h2 { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--space-2); }
.error-state p { color: #666; }

.invitation-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  width: 100%;
  max-width: 640px;
}

.invitation-canvas-container {
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.stage-wrap {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  margin: 0 auto;
}

.invitation-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: var(--space-3) var(--space-8);
  border-radius: 50px;
  font-size: var(--font-size-base);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
  background: #E91E8C;
  color: #fff;
  box-shadow: 0 4px 16px rgba(233, 30, 140, 0.4);
}
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(233, 30, 140, 0.5); }
.action-btn.secondary {
  background: #fff;
  color: #333;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.action-btn.secondary:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
</style>
