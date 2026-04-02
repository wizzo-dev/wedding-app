<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed, 'sidebar-mobile-open': mobileOpen }">
    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <span class="brand-logo">💍</span>
          <Transition name="label">
            <span v-if="!collapsed" class="brand-name">יאללה חתונה</span>
          </Transition>
        </div>
        <button
          class="collapse-btn btn btn-icon btn-ghost"
          @click="collapsed = !collapsed"
          v-if="!isMobile"
          :aria-label="collapsed ? 'הרחב סרגל צד' : 'כווץ סרגל צד'"
          :aria-expanded="!collapsed"
        >
          <span class="icon">{{ collapsed ? '›' : '‹' }}</span>
        </button>
      </div>

      <!-- User mini card -->
      <div class="sidebar-user" v-if="auth.user">
        <div class="user-avatar">{{ initials }}</div>
        <Transition name="label">
          <div v-if="!collapsed" class="user-info">
            <div class="user-names">{{ auth.user.name1 }} &amp; {{ auth.user.name2 }}</div>
            <div class="user-date" v-if="auth.user.weddingDate">
              {{ daysUntilWedding }} ימים לחתונה 💕
            </div>
          </div>
        </Transition>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <Transition name="label">
            <div v-if="!collapsed" class="nav-group-label">{{ group.label }}</div>
          </Transition>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :title="collapsed ? item.label : ''"
            @click="mobileOpen = false"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <Transition name="label">
              <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
            </Transition>
            <Transition name="label">
              <span v-if="!collapsed && item.badge" class="nav-badge" :class="`badge-${item.badgeType || 'pink'}`">
                {{ item.badge }}
              </span>
            </Transition>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom actions -->
      <div class="sidebar-footer">
        <RouterLink to="/app/settings" class="nav-item" @click="mobileOpen = false">
          <span class="nav-icon">⚙️</span>
          <Transition name="label">
            <span v-if="!collapsed" class="nav-label">הגדרות</span>
          </Transition>
        </RouterLink>
        <button class="nav-item logout-btn" @click="auth.logout">
          <span class="nav-icon">🚪</span>
          <Transition name="label">
            <span v-if="!collapsed" class="nav-label">יציאה</span>
          </Transition>
        </button>
      </div>
    </aside>

    <!-- ── Mobile overlay ── -->
    <div class="sidebar-overlay" @click="mobileOpen = false" v-if="mobileOpen" />

    <!-- ── Main ── -->
    <div class="app-body">
      <!-- Top bar (mobile + breadcrumbs) -->
      <header class="topbar">
        <button class="menu-btn btn btn-icon btn-ghost" @click="mobileOpen = !mobileOpen">
          <span class="icon">☰</span>
        </button>
        <div class="topbar-title">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <div v-if="auth.user" class="topbar-user">
            <div class="user-avatar sm">{{ initials }}</div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)

const navGroups = [
  {
    label: 'ניהול',
    items: [
      { to: '/app/dashboard',  icon: '🏠', label: 'דאשבורד' },
      { to: '/app/guests',     icon: '👥', label: 'אורחים' },
      { to: '/app/budget',     icon: '💰', label: 'תקציב' },
      { to: '/app/gifts',      icon: '🎁', label: 'מתנות' },
    ]
  },
  {
    label: 'יום החתונה',
    items: [
      { to: '/app/seating',    icon: '🪑', label: 'סידורי הושבה' },
      { to: '/app/cards',      icon: '🃏', label: 'כרטיסי הושבה' },
      { to: '/app/tasks',      icon: '✅', label: 'משימות' },
      { to: '/app/timeline',   icon: '📅', label: 'ציר זמן' },
    ]
  },
  {
    label: 'תקשורת',
    items: [
      { to: '/app/whatsapp',   icon: '💬', label: 'WhatsApp' },
      { to: '/app/vendors',    icon: '🏪', label: 'ספקים' },
    ]
  }
]

const routeTitles = {
  '/app/dashboard':            'דאשבורד',
  '/app/guests':               'רשימת אורחים',
  '/app/budget':               'תקציב',
  '/app/gifts':                'מתנות',
  '/app/seating':              'סידורי הושבה',
  '/app/cards':                'כרטיסי הושבה',
  '/app/tasks':                'משימות',
  '/app/timeline':             'ציר זמן',
  '/app/whatsapp':             'WhatsApp',
  '/app/vendors':              'ספקים',
  '/app/settings':             'הגדרות',
  '/app/settings/account':     'פרטי חשבון',
  '/app/settings/subscription':'מנוי',
}

const currentPageTitle = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return routeTitles[path] || 'יאללה חתונה'
})

const initials = computed(() => {
  if (!auth.user) return '?'
  const n1 = auth.user.name1?.[0] || ''
  const n2 = auth.user.name2?.[0] || ''
  return (n1 + n2).toUpperCase()
})

const daysUntilWedding = computed(() => {
  if (!auth.user?.weddingDate) return null
  const diff = new Date(auth.user.weddingDate) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) collapsed.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => window.removeEventListener('resize', checkMobile))
</script>

<style scoped>
/* ── Shell Layout ── */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
  direction: rtl;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-navy);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  transition: width var(--transition), transform var(--transition);
  overflow: hidden;
}

.app-shell.sidebar-collapsed .sidebar {
  width: 72px;
}

/* ── Sidebar Header ── */
.sidebar-header {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  overflow: hidden;
}

.brand-logo {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.brand-name {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: #fff;
  white-space: nowrap;
}

.collapse-btn {
  color: rgba(255,255,255,0.5);
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.1) !important;
}

.collapse-btn .icon {
  font-size: 1.2rem;
  line-height: 1;
}

/* ── User card ── */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary), #ff6b9d);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--font-size-sm);
  color: #fff;
  flex-shrink: 0;
}

.user-avatar.sm {
  width: 34px;
  height: 34px;
  font-size: var(--font-size-xs);
}

.user-info {
  overflow: hidden;
}

.user-names {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-date {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  margin-top: 2px;
  white-space: nowrap;
}

/* ── Navigation ── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-4) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-group {
  margin-bottom: var(--space-4);
}

.nav-group-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px var(--space-3);
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: rgba(255,255,255,0.65);
  transition: all var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  background: none;
  border: none;
  width: 100%;
  text-align: right;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-item.router-link-active {
  background: rgba(233,30,140,0.2);
  color: #fff;
  border-right: 3px solid var(--color-primary);
}

.nav-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.badge-pink {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* ── Sidebar footer ── */
.sidebar-footer {
  padding: var(--space-3);
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.logout-btn {
  color: rgba(255,100,100,0.7) !important;
}

.logout-btn:hover {
  color: #ff6b6b !important;
  background: rgba(255,100,100,0.1) !important;
}

/* ── App Body ── */
.app-body {
  flex: 1;
  margin-right: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-right var(--transition);
}

.app-shell.sidebar-collapsed .app-body {
  margin-right: 72px;
}

/* ── Topbar ── */
.topbar {
  height: var(--topbar-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  gap: var(--space-4);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-xs);
}

.menu-btn {
  display: none;
  color: var(--color-text);
}

.menu-btn .icon {
  font-size: 1.2rem;
}

.topbar-title {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.topbar-user {
  display: flex;
  align-items: center;
}

/* ── Main content ── */
.app-main {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: var(--content-max);
  margin: 0 auto;
  width: 100%;
}

/* ── Overlay (mobile) ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 150;
}

/* ── Label transition ── */
.label-enter-active,
.label-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.label-enter-from,
.label-leave-to {
  opacity: 0;
  transform: translateX(6px);
}

/* ── Page transition ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .sidebar {
    transform: translateX(100%);
    width: var(--sidebar-width) !important;
  }

  .sidebar-mobile-open .sidebar {
    transform: translateX(0);
  }

  .app-body {
    margin-right: 0 !important;
  }

  .menu-btn {
    display: flex;
  }

  .app-main {
    padding: var(--space-4);
  }
}
</style>
