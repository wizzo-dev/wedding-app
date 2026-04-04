<template>
  <div class="app-shell" dir="rtl">
    <!-- ── SIDEBAR (light) ── -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon">💍</div>
        <span class="logo-text">יאללה</span>
      </div>

      <!-- Couple badge -->
      <div class="couple-badge" v-if="auth.user">
        <div class="couple-avatar">{{ initials }}</div>
        <div class="couple-info">
          <div class="couple-name">{{ auth.user.name1 }} &amp; {{ auth.user.name2 }}</div>
          <div class="couple-date" v-if="auth.user.weddingDate">{{ formattedWeddingDate }}</div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-label">ניהול</div>
          <router-link
            v-for="item in mainNav"
            :key="item.path"
            :to="item.path"
            class="nav-item"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
        <div class="nav-section">
          <div class="nav-section-label">כלי תכנון</div>
          <router-link
            v-for="item in planningNav"
            :key="item.path"
            :to="item.path"
            class="nav-item"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <router-link to="/app/settings" class="nav-item settings-link">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">הגדרות</span>
        </router-link>
        <button @click="auth.logout(); router.push('/login')" class="logout-btn">התנתק</button>
      </div>
    </aside>

    <!-- ── MAIN ── -->
    <main class="main-area">
      <!-- Page header -->
      <header class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
          <p class="page-subtitle" v-if="daysLeft !== null">
            ספירה לאחור לחתונה: <strong>{{ daysLeft }} ימים</strong> נותרו
          </p>
        </div>
        <div class="page-header-right">
          <router-link to="/app/guests/new" class="btn-new-task">+ הוסף אורח</router-link>
        </div>
      </header>

      <!-- Page content -->
      <div class="page-body">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const mainNav = [
  { icon: '🏠', label: 'סקירה כללית', path: '/app/dashboard' },
  { icon: '👥', label: 'אורחים',       path: '/app/guests' },
  { icon: '🏢', label: 'ספקים',        path: '/app/vendors' },
  { icon: '💰', label: 'תקציב',        path: '/app/budget' },
  { icon: '📋', label: 'RSVP',         path: '/app/rsvp-links' },
]

const planningNav = [
  { icon: '📅', label: 'ציר זמן',         path: '/app/timeline' },
  { icon: '🪑', label: 'מפת ישיבה',       path: '/app/seating' },
  { icon: '🃏', label: 'כרטיסי הושבה',   path: '/app/cards' },
  { icon: '✅', label: 'משימות',           path: '/app/tasks' },
  { icon: '🎁', label: 'מתנות',            path: '/app/gifts' },
  { icon: '💬', label: 'WhatsApp',         path: '/app/whatsapp/connect' },
  { icon: '🎨', label: 'עיצוב RSVP',      path: '/app/rsvp-design' },
]

const PAGE_TITLES = {
  '/app/dashboard':     'סקירה כללית',
  '/app/guests':        'אורחים',
  '/app/vendors':       'ספקים',
  '/app/budget':        'תקציב',
  '/app/rsvp-links':    'לינקי RSVP',
  '/app/timeline':      'ציר זמן',
  '/app/seating':       'מפת ישיבה',
  '/app/cards':         'כרטיסי הושבה',
  '/app/tasks':         'משימות',
  '/app/gifts':         'מתנות',
  '/app/whatsapp/connect':   'WhatsApp — חיבור',
  '/app/whatsapp/send':      'WhatsApp — שליחה',
  '/app/whatsapp/templates': 'WhatsApp — תבניות',
  '/app/whatsapp/history':   'WhatsApp — היסטוריה',
  '/app/whatsapp':           'WhatsApp',
  '/app/rsvp-design':   'עיצוב עמוד RSVP',
  '/app/invitations':   'הזמנות',
  '/app/settings':      'הגדרות',
}

const currentPageTitle = computed(() => PAGE_TITLES[route.path] || 'יאללה')

const daysLeft = computed(() => {
  if (!auth.user?.weddingDate) return null
  const ms = new Date(auth.user.weddingDate) - new Date()
  const d  = Math.ceil(ms / (1000 * 60 * 60 * 24))
  return d > 0 ? d : null
})

const initials = computed(() => {
  const n1 = auth.user?.name1?.[0] || ''
  const n2 = auth.user?.name2?.[0] || ''
  return (n1 + n2).toUpperCase()
})

const formattedWeddingDate = computed(() => {
  if (!auth.user?.weddingDate) return ''
  return new Date(auth.user.weddingDate).toLocaleDateString('he-IL', {
    month: 'short',
    year: 'numeric',
  })
})
</script>

<style scoped>
/* ─────────────────────────────────────────────
   SHELL
───────────────────────────────────────────── */
.app-shell {
  display: flex;
  min-height: 100vh;
  direction: rtl;
  background: #F0F2F5;
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
.sidebar {
  width: 240px;
  background: #FFFFFF;
  border-left: 1px solid #EAEAEA;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #EAEAEA;
  flex-shrink: 0;
}
.logo-icon { font-size: 22px; }
.logo-text {
  font-family: 'Heebo', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #FF407D;
}

/* Couple badge */
.couple-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin: 10px 12px 4px;
  background: #FFF0F5;
  border-radius: 16px;
  border: 1px solid #FFD6E7;
  flex-shrink: 0;
}
.couple-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #FF407D;
  color: white;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.couple-name { font-size: 13px; font-weight: 700; color: #1B3C73; }
.couple-date { font-size: 11px; color: #888; margin-top: 1px; }

/* Nav */
.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #EAEAEA transparent;
}
.sidebar-nav::-webkit-scrollbar { width: 3px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: #EAEAEA; border-radius: 2px; }

.nav-section { margin-bottom: 4px; }

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  color: #FF407D;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 10px 20px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px 9px 16px;
  margin: 1px 8px;
  border-radius: 10px;
  color: #4B5563;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.12s;
}
.nav-item:hover {
  background: #F5F6FA;
  color: #1B3C73;
}
.nav-item.router-link-active {
  background: #FFF0F5;
  color: #FF407D;
  font-weight: 700;
}
.nav-icon {
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}

/* Footer */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #EAEAEA;
  flex-shrink: 0;
}
.settings-link { margin-bottom: 4px; }

.logout-btn {
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  border: 1px solid #EAEAEA;
  border-radius: 10px;
  background: white;
  color: #6B7280;
  font-family: Heebo, sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s;
}
.logout-btn:hover {
  background: #F5F6FA;
  color: #374151;
}

/* ─────────────────────────────────────────────
   MAIN AREA
───────────────────────────────────────────── */
.main-area {
  flex: 1;
  margin-right: 240px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Page header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #EAEAEA;
  position: sticky;
  top: 0;
  z-index: 50;
}
.page-title {
  font-family: 'Heebo', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1B3C73;
  margin: 0 0 4px;
  line-height: 1.1;
}
.page-subtitle {
  font-size: 13px;
  color: #888;
  margin: 0;
}
.page-subtitle strong {
  color: #FF407D;
  font-weight: 700;
}

.btn-new-task {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FF407D;
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
  font-family: Heebo, sans-serif;
  text-decoration: none;
  transition: opacity 0.15s;
  white-space: nowrap;
  border: none;
}
.btn-new-task:hover { opacity: 0.88; }

/* Page body */
.page-body {
  flex: 1;
  padding: 24px 32px;
  max-width: 1200px;
  width: 100%;
}

/* ─────────────────────────────────────────────
   PAGE TRANSITION
───────────────────────────────────────────── */
.page-enter-active,
.page-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─────────────────────────────────────────────
   MOBILE — bottom nav bar
───────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 65px;
    bottom: 0;
    top: auto;
    right: 0;
    left: 0;
    border-top: 1px solid #EAEAEA;
    border-left: none;
    z-index: 200;
    padding: 0;
  }
  .sidebar-logo,
  .couple-badge,
  .sidebar-footer {
    display: none;
  }
  .sidebar-nav {
    flex-direction: row;
    display: flex;
    width: 100%;
    padding: 0;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }
  .sidebar-nav::-webkit-scrollbar { display: none; }
  .nav-section {
    display: flex;
    flex-direction: row;
    flex: 1;
  }
  .nav-section-label { display: none; }
  .nav-item {
    flex: 1;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 8px 4px;
    margin: 0;
    border-radius: 0;
    font-size: 10px;
    gap: 3px;
    min-width: 52px;
  }
  .nav-icon { font-size: 20px; min-width: unset; }
  .nav-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 52px; }

  .main-area {
    margin-right: 0;
    margin-bottom: 65px;
  }

  .page-header {
    padding: 16px 16px 12px;
  }
  .page-title { font-size: 22px; }
  .page-body { padding: 16px; }
}
</style>
