<template>
  <div>
    <h1>הספקים שלי</h1>
    <div v-if="loading">טוען...</div>
    <ul v-else>
      <li v-for="it in items" :key="it.id">
        <strong>{{ it.vendor.name }}</strong> — {{ it.status }} — {{ it.vendor.city }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const items = ref([])
const loading = ref(false)
async function load(){
  loading.value = true
  try{
    const res = await fetch('/api/vendors/mine/list', { credentials: 'include' })
    items.value = await res.json()
  }finally{ loading.value=false }
}
onMounted(load)
</script>

<style scoped>
h1 { color: var(--color-navy) }
</style>
