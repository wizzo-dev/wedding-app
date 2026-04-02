<template>
  <div class="page">
    <div class="header">
      <h1>ספקים</h1>
      <input v-model="q" placeholder="חפש ספקים" @keyup.enter="load" />
    </div>

    <div class="grid">
      <div v-for="v in vendors" :key="v.id" class="card">
        <h3>{{ v.name }}</h3>
        <p class="muted">{{ v.category }} • {{ v.city }}</p>
        <p class="desc">{{ v.description || 'אין תיאור' }}</p>
        <div class="actions">
          <a :href="`/vendors/${v.id}`">פרטים</a>
        </div>
      </div>
    </div>

    <div v-if="loading" class="muted">טוען...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const vendors = ref([])
const q = ref('')
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const url = `/api/vendors?${q.value ? 'q='+encodeURIComponent(q.value) : ''}`
    const res = await fetch(url, { credentials: 'include' })
    vendors.value = await res.json()
  } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.header { display:flex; gap:12px; align-items:center; margin-bottom:16px }
.header h1 { color: var(--color-navy) }
.grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr)); gap:12px }
.card { border:1px solid #eee; padding:12px; border-radius:8px; background: #fff }
.muted { color: var(--color-text-muted) }
.desc { margin-top:8px; color:#333 }
.actions { margin-top:12px }
</style>
