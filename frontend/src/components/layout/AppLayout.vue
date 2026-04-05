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

    <!-- ── MOBILE BOTTOM NAV ── -->
    <nav class="mobile-bottom-nav">
      <router-link :to="mobileFixedLeft.path" class="mob-nav-item">
        <span class="mob-nav-icon">{{ mobileFixedLeft.icon }}</span>
        <span class="mob-nav-label">{{ mobileFixedLeft.label }}</span>
      </router-link>

      <button class="mob-nav-center" @click="showMobileMenu = !showMobileMenu" :class="{ open: showMobileMenu }">
        <span class="center-icon">{{ showMobileMenu ? '✕' : '💍' }}</span>
      </button>

      <router-link :to="mobileFixedRight.path" class="mob-nav-item">
        <span class="mob-nav-icon">{{ mobileFixedRight.icon }}</span>
        <span class="mob-nav-label">{{ mobileFixedRight.label }}</span>
      </router-link>
    </nav>

    <!-- Mobile Bottom Sheet -->
    <Transition name="sheet">
      <div v-if="showMobileMenu" class="mobile-sheet-overlay" @click.self="showMobileMenu = false">
        <div class="mobile-sheet">
          <div class="sheet-handle"></div>
          <div class="sheet-grid">
            <router-link
              v-for="item in mobileMoreItems"
              :key="item.path"
              :to="item.path"
              class="sheet-item"
              @click="showMobileMenu = false"
            >
              <span class="sheet-item-icon">{{ item.icon }}</span>
              <span class="sheet-item-label">{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </Transition>

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
          <!-- Removed: was linking to non-existent /app/guests/new route -->
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

// Mobile: 2 fixed tabs + center button + 2 more in bottom sheet
const mobileFixedLeft = { icon: '🏠', label: 'בית', path: '/app/dashboard' }
const mobileFixedRight = { icon: '👥', label: 'אורחים', path: '/app/guests' }
const mobileMoreItems = [
  { icon: '💰', label: 'תקציב', path: '/app/budget' },
  { icon: '🪑', label: 'מפת ישיבה', path: '/app/seating' },
  { icon: '✅', label: 'משימות', path: '/app/tasks' },
  { icon: '🎁', label: 'מתנות', path: '/app/gifts' },
  { icon: '📅', label: 'ציר זמן', path: '/app/timeline' },
  { icon: '🃏', label: 'כרטיסי הושבה', path: '/app/cards' },
  { icon: '🏢', label: 'ספקים', path: '/app/vendors' },
  { icon: '💬', label: 'WhatsApp', path: '/app/whatsapp/connect' },
  { icon: '⚙️', label: 'הגדרות', path: '/app/settings' },
]
const showMobileMenu = ref(false)

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
/* ── Mobile bottom nav (new) ── */
.mobile-bottom-nav {
  display: none;
}

.mobile-sheet-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .mobile-bottom-nav {
    display: flex;
    align-items: center;
    justify-content: space-around;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: calc(65px + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: #FFFFFF;
    border-top: 1px solid #EAEAEA;
    z-index: 200;
  }

  .mob-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    text-decoration: none;
    color: #6B7280;
    font-size: 10px;
    font-weight: 600;
    padding: 8px 16px;
    transition: color 0.15s;
  }
  .mob-nav-item.router-link-active {
    color: #FF407D;
  }
  .mob-nav-icon { font-size: 22px; }
  .mob-nav-label { font-size: 10px; }

  .mob-nav-center {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF407D, #FF6AC1);
    border: 3px solid #FFFFFF;
    box-shadow: 0 4px 16px rgba(255,64,125,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-top: -20px;
    transition: transform 0.2s, box-shadow 0.2s;
    z-index: 1;
  }
  .mob-nav-center:active { transform: scale(0.95); }
  .mob-nav-center.open { background: #1B3C73; box-shadow: 0 4px 16px rgba(27,60,115,0.4); }
  .center-icon { font-size: 24px; line-height: 1; }

  /* Bottom Sheet */
  .mobile-sheet-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 190;
    align-items: flex-end;
  }

  .mobile-sheet {
    width: 100%;
    background: #FFFFFF;
    border-radius: 24px 24px 0 0;
    padding: var(--space-4) var(--space-5) calc(80px + env(safe-area-inset-bottom, 0px));
    max-height: 60vh;
    overflow-y: auto;
  }

  .sheet-handle {
    width: 40px;
    height: 4px;
    background: #DDD;
    border-radius: 2px;
    margin: 0 auto var(--space-4);
  }

  .sheet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
  }

  .sheet-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: var(--space-4) var(--space-2);
    border-radius: 16px;
    background: #F8F9FB;
    text-decoration: none;
    color: #1B3C73;
    transition: background 0.15s;
  }
  .sheet-item:active { background: #FFF0F5; }
  .sheet-item-icon { font-size: 24px; }
  .sheet-item-label { font-size: 12px; font-weight: 600; }

  /* Sheet transition */
  .sheet-enter-active, .sheet-leave-active { transition: all 0.3s ease; }
  .sheet-enter-from .mobile-sheet, .sheet-leave-to .mobile-sheet { transform: translateY(100%); }
  .sheet-enter-from, .sheet-leave-to { background: rgba(0,0,0,0); }

  .main-area {
    margin-right: 0;
    margin-bottom: calc(65px + env(safe-area-inset-bottom, 0px));
  }

  .page-header {
    padding: 16px 16px 12px;
  }
  .page-title { font-size: 22px; }
  .page-body { padding: 16px; }
}
</style>
