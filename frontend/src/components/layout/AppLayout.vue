<template>
  <div class="app-shell">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="topbar-brand">
        <span class="brand-logo">💍</span>
        <span class="brand-name">יאללה</span>
      </div>
      <nav class="topbar-nav">
        <RouterLink to="/app/dashboard" class="nav-item">דאשבורד</RouterLink>
        <RouterLink to="/app/guests" class="nav-item">אורחים</RouterLink>
        <RouterLink to="/app/budget" class="nav-item">תקציב</RouterLink>
        <RouterLink to="/app/seating" class="nav-item">הושבה</RouterLink>
        <RouterLink to="/app/whatsapp" class="nav-item">WhatsApp</RouterLink>
      </nav>
      <div class="topbar-actions">
        <button class="btn btn-ghost btn-sm" @click="auth.logout">יציאה</button>
      </div>
    </header>
    <!-- Main Content -->
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.topbar {
  height: var(--topbar-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-brand { display: flex; align-items: center; gap: var(--space-2); }
.brand-logo { font-size: 1.5rem; }
.brand-name { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.topbar-nav { display: flex; gap: var(--space-2); flex: 1; }
.nav-item {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  transition: all var(--transition);
}
.nav-item:hover { background: var(--color-bg-subtle); color: var(--color-text); }
.nav-item.router-link-active { background: var(--color-primary-light); color: var(--color-primary); }
.app-main { flex: 1; padding: var(--space-8) var(--space-6); max-width: var(--content-max); margin: 0 auto; width: 100%; }
</style>
