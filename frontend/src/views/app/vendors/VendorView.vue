<template>
  <div class="page">
    <button @click="goBack">חזור</button>
    <div v-if="loading">טוען...</div>
    <div v-else-if="vendor">
      <h1>{{ vendor.name }}</h1>
      <p class="muted">{{ vendor.category }} • {{ vendor.city }}</p>
      <p>{{ vendor.description }}</p>
      <p>טלפון: {{ vendor.phone || 'אין' }}</p>
      <p>אתר: <a :href="vendor.website" target="_blank">{{ vendor.website }}</a></p>
      <button @click="save">שמור ברשימות שלי</button>
      <div v-if="savedMessage" class="muted">{{ savedMessage }}</div>
    </div>
    <div v-else class="muted">ספק לא נמצא</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const vendor = ref(null)
const loading = ref(false)
const savedMessage = ref('')

async function load() {
  loading.value = true
  try {
    const res = await fetch(`/api/vendors/${route.params.id}`, { credentials: 'include' })
    vendor.value = await res.json()
  } finally { loading.value = false }
}

async function save() {
  const res = await fetch(`/api/vendors/${route.params.id}/save`, { method: 'POST', credentials: 'include' })
  if (res.ok) savedMessage.value = 'נשמר בהצלחה'
  else {
    const j = await res.json()
    savedMessage.value = j.message || 'שגיאה'
  }
}

function goBack(){ router.back() }
onMounted(load)
</script>

<style scoped>
.muted { color: var(--color-text-muted) }
</style>
