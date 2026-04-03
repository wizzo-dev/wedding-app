<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-text">יאללה</div>
        <div class="logo-sub">Wedding Management</div>
      </div>

      <!-- Navigation -->
      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.path" class="nav-item">
          <RouterLink
            :to="item.path"
            :title="item.label"
            @click="mobileOpen = false"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-info" v-if="auth.user">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-email-wrap">
            <div class="user-names-small">{{ auth.user.name1 }} &amp; {{ auth.user.name2 }}</div>
            <div class="user-email">{{ auth.user.email }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">יציאה מהמערכת</button>
      </div>
    </aside>

    <!-- ── Mobile overlay ── -->
    <div class="sidebar-overlay" @click="mobileOpen = false" v-if="mobileOpen" />

    <!-- ── Main ── -->
    <div class="main-content">
      <!-- Top bar -->
      <header class="topbar">
        <button
          class="menu-btn"
          @click="mobileOpen = !mobileOpen"
          aria-label="פתח תפריט"
        >☰</button>
        <div class="topbar-title">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="topbar-actions">
          <RouterLink to="/app/notifications" class="notif-btn" aria-label="התראות">
            <span class="bell-icon">🔔</span>
            <span v-if="unreadNotifCount > 0" class="notif-badge">{{ unreadNotifCount > 9 ? '9+' : unreadNotifCount }}</span>
          </RouterLink>
          <div v-if="auth.user" class="topbar-user">
            <div class="topbar-avatar">{{ initials }}</div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content">
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/composables/useApi'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(false)
const unreadNotifCount = ref(0)

const navItems = [
  { icon: '🏠', label: 'לוח בקרה',      path: '/app/dashboard' },
  { icon: '👥', label: 'רשימת אורחים',   path: '/app/guests' },
  { icon: '💬', label: 'שליחת WhatsApp', path: '/app/whatsapp' },
  { icon: '🎴', label: 'הזמנות',          path: '/app/invitations' },
  { icon: '🔗', label: 'לינקי RSVP',     path: '/app/rsvp-links' },
  { icon: '🪑', label: 'מפת ישיבה',      path: '/app/seating' },
  { icon: '💰', label: 'תקציב',           path: '/app/budget' },
  { icon: '✅', label: 'משימות',           path: '/app/tasks' },
  { icon: '🎁', label: 'מתנות',            path: '/app/gifts' },
  { icon: '🏢', label: 'ספקים',            path: '/app/vendors' },
  { icon: '⚙️', label: 'הגדרות',           path: '/app/settings' },
]

const routeTitles = {
  '/app/dashboard':            'לוח בקרה',
  '/app/guests':               'רשימת אורחים',
  '/app/budget':               'תקציב',
  '/app/gifts':                'מתנות',
  '/app/seating':              'מפת ישיבה',
  '/app/cards':                'כרטיסי הושבה',
  '/app/tasks':                'משימות',
  '/app/timeline':             'ציר זמן',
  '/app/whatsapp':             'WhatsApp',
  '/app/whatsapp/send':        'שליחת WhatsApp',
  '/app/vendors':              'ספקים',
  '/app/notifications':        'התראות',
  '/app/profile':              'הפרופיל שלנו',
  '/app/vendors/suggestions':  'הצעות ספקים',
  '/app/subscription/payment': 'תוכניות ומנוי',
  '/app/settings':             'הגדרות',
  '/app/settings/account':     'פרטי חשבון',
  '/app/settings/subscription':'מנוי',
  '/app/invitations':          'הזמנות',
  '/app/invitations/new':      'בחר תבנית',
  '/app/rsvp-links':           'לינקי RSVP',
}

const currentPageTitle = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return routeTitles[path] || 'יאללה'
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

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) collapsed.value = false
}

async function fetchUnreadCount() {
  try {
    const res = await api.get('/notifications')
    unreadNotifCount.value = res.data.unreadCount || 0
  } catch {}
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  fetchUnreadCount()
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
  overflow-x: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-bg-sidebar);
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  z-index: 200;
  transition: transform var(--transition);
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Logo ── */
.sidebar-logo {
  padding: 28px 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px;
  font-weight: 700;
  color: #C8116B;
  letter-spacing: -0.5px;
  line-height: 1;
}

.logo-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  margin-top: 4px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 400;
}

/* ── Navigation ── */
.nav-list {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(200,17,107,0.3) transparent;
}

.nav-list::-webkit-scrollbar { width: 3px; }
.nav-list::-webkit-scrollbar-thumb { background: rgba(200,17,107,0.3); border-radius: 2px; }

.nav-item {
  margin: 0;
}

.nav-item a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  margin: 2px 8px;
  transition: all 0.15s ease;
}

.nav-item a:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
}

.nav-item a.router-link-active {
  background: rgba(200,17,107,0.18);
  color: #F7D6E8;
}

.nav-icon {
  font-size: 16px;
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Sidebar Footer ── */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  overflow: hidden;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(200,17,107,0.25);
  color: #F7D6E8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  border: 1.5px solid rgba(200,17,107,0.4);
}

.user-email-wrap {
  overflow: hidden;
}

.user-names-small {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.55);
  border: none;
  border-radius: 8px;
  font-family: 'Heebo', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.logout-btn:hover {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85);
}

/* ── Main Content ── */
.main-content {
  flex: 1;
  margin-right: var(--sidebar-width);
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

/* ── Top Bar ── */
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
  box-shadow: var(--shadow-sm);
}

.menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 1.3rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.menu-btn:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.topbar-title {
  flex: 1;
}

.page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-navy);
  line-height: 1;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.notif-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius);
  transition: background var(--transition-fast);
  text-decoration: none;
}
.notif-btn:hover { background: var(--color-bg-subtle); }
.bell-icon { font-size: 1.1rem; line-height: 1; }
.notif-badge {
  position: absolute;
  top: -2px;
  left: -2px;
  min-width: 17px;
  height: 17px;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  box-shadow: 0 0 0 2px var(--color-bg-card);
}

.topbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

/* ── Page Content ── */
.page-content {
  flex: 1;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 32px 24px;
  width: 100%;
}

/* ── Mobile Overlay ── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 150;
}

/* ── Page Transition ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Mobile: bottom tab bar ── */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: 60px;
    bottom: 0;
    top: auto;
    right: 0;
    left: 0;
    flex-direction: row;
    overflow: visible;
    transform: none !important;
  }

  .sidebar-logo,
  .sidebar-footer {
    display: none;
  }

  .nav-list {
    flex-direction: row;
    display: flex;
    padding: 0;
    overflow-x: auto;
    overflow-y: hidden;
    align-items: center;
    flex: 1;
    width: 100%;
    scrollbar-width: none;
  }

  .nav-list::-webkit-scrollbar { display: none; }

  .nav-item {
    flex-shrink: 0;
  }

  .nav-item a {
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    font-size: 10px;
    margin: 0;
    border-radius: 0;
    min-width: 56px;
    text-align: center;
  }

  .nav-icon { font-size: 18px; min-width: unset; }

  .main-content {
    margin-right: 0;
    margin-bottom: 60px;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .page-content {
    padding: 16px;
  }
}
</style>
