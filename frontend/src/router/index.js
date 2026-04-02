import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ── Public ──────────────────────────────────────────────────────────────────
  { path: '/',           name: 'Landing',     component: () => import('@/views/LandingView.vue'), meta: { public: true } },
  { path: '/rsvp/:token', name: 'Rsvp',       component: () => import('@/views/RsvpView.vue'),    meta: { public: true } },

  // ── Auth ─────────────────────────────────────────────────────────────────────
  { path: '/login',          name: 'Login',         component: () => import('@/views/auth/LoginView.vue'),    meta: { guest: true } },
  { path: '/register',       name: 'Register',      component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
  { path: '/forgot-password',name: 'ForgotPassword',component: () => import('@/views/auth/ForgotView.vue'),   meta: { guest: true } },
  { path: '/reset-password/:token', name: 'ResetPassword', component: () => import('@/views/auth/ResetView.vue'), meta: { guest: true } },
  { path: '/verify-email/:token',   name: 'VerifyEmail',   component: () => import('@/views/auth/VerifyView.vue'), meta: { public: true } },

  // ── App (requires auth) ──────────────────────────────────────────────────────
  {
    path: '/app',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',           redirect: '/app/dashboard' },
      { path: 'dashboard',  name: 'Dashboard',  component: () => import('@/views/app/DashboardView.vue') },

      // Budget
      { path: 'budget',                 name: 'Budget',         component: () => import('@/views/app/budget/BudgetView.vue') },
      { path: 'budget/category/:id',    name: 'BudgetCategory', component: () => import('@/views/app/budget/CategoryView.vue') },

      // Guests
      { path: 'guests',                 name: 'Guests',         component: () => import('@/views/app/guests/GuestsView.vue') },
      { path: 'guests/:id',             name: 'GuestCard',      component: () => import('@/views/app/guests/GuestView.vue') },
      { path: 'guests/import',          name: 'GuestImport',    component: () => import('@/views/app/guests/ImportView.vue') },
      { path: 'guests/stats',           name: 'GuestStats',     component: () => import('@/views/app/guests/StatsView.vue') },

      // WhatsApp
      { path: 'whatsapp',               name: 'Whatsapp',       component: () => import('@/views/app/whatsapp/WhatsappView.vue') },
      { path: 'whatsapp/templates',     name: 'WaTemplates',    component: () => import('@/views/app/whatsapp/TemplatesView.vue') },
      { path: 'whatsapp/send',          name: 'WaSend',         component: () => import('@/views/app/whatsapp/SendView.vue') },
      { path: 'whatsapp/history',       name: 'WaHistory',      component: () => import('@/views/app/whatsapp/HistoryView.vue') },

      // Seating
      { path: 'seating',                name: 'Seating',        component: () => import('@/views/app/seating/SeatingView.vue') },
      { path: 'seating/settings',       name: 'HallSettings',   component: () => import('@/views/app/seating/HallSettingsView.vue') },

      // Cards
      { path: 'cards',                  name: 'Cards',          component: () => import('@/views/app/cards/CardsView.vue') },
      { path: 'cards/preview/:id',      name: 'CardPreview',    component: () => import('@/views/app/cards/PreviewView.vue') },

      // Gifts
      { path: 'gifts',                  name: 'Gifts',          component: () => import('@/views/app/gifts/GiftsView.vue') },
      { path: 'gifts/stats',            name: 'GiftStats',      component: () => import('@/views/app/gifts/GiftStatsView.vue') },

      // Vendors
      { path: 'vendors',                name: 'Vendors',        component: () => import('@/views/app/vendors/VendorsView.vue') },
      { path: 'vendors/:id',            name: 'VendorDetail',   component: () => import('@/views/app/vendors/VendorView.vue') },
      { path: 'vendors/mine',           name: 'MyVendors',      component: () => import('@/views/app/vendors/MyVendorsView.vue') },

      // Tasks & Timeline
      { path: 'tasks',                  name: 'Tasks',          component: () => import('@/views/app/tasks/TasksView.vue') },
      { path: 'timeline',               name: 'Timeline',       component: () => import('@/views/app/tasks/TimelineView.vue') },

      // Settings
      { path: 'settings',               name: 'Settings',       component: () => import('@/views/app/settings/SettingsView.vue') },
      { path: 'settings/account',       name: 'Account',        component: () => import('@/views/app/settings/AccountView.vue') },
      { path: 'settings/subscription',  name: 'Subscription',   component: () => import('@/views/app/settings/SubscriptionView.vue') },
    ]
  },

  // ── 404 ──────────────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue'), meta: { public: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return next('/login')
  if (to.meta.guest && auth.isLoggedIn) return next('/app/dashboard')
  next()
})

export default router
