<template>
  <div class="stats-page fade-in" dir="rtl">
    <div class="page-header">
      <h1 class="page-title">סטטיסטיקות</h1>
      <p class="page-sub">סיכום מקיף של כל נתוני החתונה</p>
    </div>
    <div class="loading-placeholder" v-if="loading">
      <div v-for="i in 4" :key="i" class="skel-card">
        <div class="skel skel-h" /><div class="skel skel-b" />
      </div>
    </div>
  </div>
</template>
<script setup>
const loading = false
</script>
<style scoped>
.stats-page { padding: var(--space-6); max-width: 1200px; margin: 0 auto; }
.page-title { font-size: var(--font-size-2xl); font-weight: 900; color: var(--color-navy); }
.page-sub   { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.loading-placeholder { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-6); }
.skel-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-5); }
.skel { background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius); }
.skel-h { height: 32px; width: 60%; margin-bottom: var(--space-3); }
.skel-b { height: 16px; width: 80%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
</style>
