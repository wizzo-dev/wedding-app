<template>
  <div>
    <h1>משימות</h1>
    <p class="muted">ניהול המשימות נמצא בעבודה — כאן תוכל לראות רשימת משימות ותאריכי יעד</p>
    <ul>
      <li v-for="t in tasks" :key="t.id">{{ t.title }} — {{ t.due || 'ללא תאריך' }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const tasks = ref([
  { id:1, title: 'בחירת אולם', due: '2026-06-01' },
  { id:2, title: 'הזמנת צלם', due: null }
])
</script>

<style scoped>
.muted { color: var(--color-text-muted) }
h1 { color:var(--color-navy) }
</style>
