<template>
  <div class="notfound" dir="rtl">
    <div class="box">
      <div class="emoji">💍</div>
      <h1>העמוד לא נמצא</h1>
      <p>סליחה, העמוד שחיפשת לא קיים.</p>
      <router-link to="/" class="btn btn-primary">חזור לעמוד הבית</router-link>
    </div>
  </div>
</template>
<script setup>
</script>
<style scoped>
.notfound{display:flex;align-items:center;justify-content:center;padding:var(--space-8)}
.box{text-align:center;background:var(--color-bg-card);padding:var(--space-6);border-radius:var(--radius-xl)}
.emoji{font-size:4rem;margin-bottom:var(--space-3)}
</style>