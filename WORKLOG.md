# WORKLOG - Freddy Dev Agent

## 2026-04-02T21:00Z | GuestsList | feat/page/guests-list

**Summary:** Full Hebrew RTL guests management page with Prisma migration for `side` field, complete CRUD backend, and polished Vue 3 table UI.

**What was built:**

### Backend
- Updated `schema.prisma`: added `side String @default("חתן")` to Guest model
- Migration `20260402205126_add_guest_side` — full table recreation with `side` column
- Full guests CRUD (`backend/src/routes/guests.js`):
  - `GET /api/guests` — list with optional `search`, `status`, `side` filters + stats
  - `POST /api/guests` — create guest
  - `POST /api/guests/bulk` — bulk import (CSV-like format)
  - `GET /api/guests/:id` — single guest with table name
  - `PUT /api/guests/:id` — update any field
  - `DELETE /api/guests/:id` — delete

### GuestsListView.vue
- Page header with "הוסף אורח" + "ייבוא מרובה" buttons
- Stats badges: total / מגיעים / לא בטוחים / לא מגיעים / ממתינים / נפשות (clickable filters)
- Search bar with clear button (client-side instant filtering)
- Filter pills: all/confirmed/maybe/declined/pending
- Side filter pills: כולם / צד חתן / צד כלה / משותף
- Responsive data table:
  - Avatar with initials (color-coded by name)
  - Name + phone link
  - Side badge (blue=חתן, pink=כלה, gray=משותף)
  - RSVP badge (color-coded: green/red/amber/gray)
  - Table name chip
  - People count
  - Actions: WhatsApp 💬 / Edit ✏️ / Delete 🗑️
- Add/Edit modal: name, phone, email, group, side, RSVP status, people count, notes
- Bulk import modal: paste CSV (name, phone, side per line)
- Loading skeleton (8 rows), error state, empty state with CTA
- Result count footer
- Hebrew RTL throughout, fully mobile responsive

**Files changed:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260402205126_add_guest_side/migration.sql`
- `backend/src/routes/guests.js`
- `frontend/src/router/index.js` (updated guests route)
- `frontend/src/views/app/GuestsListView.vue` (new, ~550 lines)

**Branch:** `feat/page/guests-list`
**Build:** ✅ Passes (GuestsListView: 15.27kB gzip:5.14kB)
**Route:** `/app/guests` → GuestsListView

---


## 2026-04-02T20:30Z | BudgetOverview + BudgetCategory | feat/page/budget-overview

**Summary:** Full Hebrew RTL budget management pages with Prisma migrations, complete backend CRUD, and polished Vue 3 UI.

**What was built:**

### Backend
- Updated `schema.prisma`: added `budgetTotal` to User, `isPaid` to BudgetExpense
- Applied migration `20260402202132_add_budget_total` + created `20260402202653_add_budget_fields_expense_paid`
- Full budget routes (`backend/src/routes/budget.js`):
  - `GET /api/budget` — categories with spent/allocated/pct + totals
  - `POST /api/budget` — create category
  - `PUT /api/budget/total` — update total wedding budget
  - `GET /api/budget/:categoryId` — detail + expenses list
  - `PUT /api/budget/:categoryId` — update name/allocated amount
  - `DELETE /api/budget/:categoryId` — delete category
  - `POST /api/budget/:categoryId/expenses` — add expense
  - `PUT /api/budget/:categoryId/expenses/:id` — edit expense
  - `DELETE /api/budget/:categoryId/expenses/:id` — delete expense

### BudgetOverviewView.vue
- 4 stat cards: total budget / allocated / spent / remaining
- Pink gradient progress bar with pct
- Category cards grid: icon, name, allocated, spent, % bar, over-budget alert
- Color-coded status (red = over budget, amber = near limit, green = ok)
- Add category modal with icon picker
- Edit total budget modal
- Loading skeleton, error state, empty state CTA
- Hebrew RTL, fully responsive

### BudgetCategoryView.vue
- Category header: inline name edit, inline allocated amount edit
- Stats row: spent, remaining, % mini progress bar
- Add expense form: vendor name, amount, date, isPaid toggle, notes
- Expense list: paid status dot, vendor name, amount, date, notes, badge
- Inline expense edit mode (per-row)
- Delete with confirm
- Loading skeleton, error state, empty state
- Hebrew RTL, fully responsive

**Files changed:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260402202653_*/migration.sql`
- `backend/src/routes/budget.js`
- `frontend/src/router/index.js` (updated to use new file paths)
- `frontend/src/views/app/BudgetOverviewView.vue` (new, 380 lines)
- `frontend/src/views/app/BudgetCategoryView.vue` (new, 520 lines)

**Branch:** `feat/page/budget-overview`
**Build:** ✅ Passes (BudgetOverviewView: 10.49kB, BudgetCategoryView: 12.69kB)
**Routes:** `/app/budget` → BudgetOverview, `/app/budget/:categoryId` → BudgetCategory

---


## 2026-04-02T19:55Z | AppLayout | feat/page/app-layout

**Summary:** Full sidebar navigation layout with RTL support for the wedding app.

**What was built:**
- Full RTL sidebar (260px) with dark navy background
- Collapsible sidebar with smooth transitions (desktop only)
- Mobile responsive with hamburger menu + overlay
- Navigation groups: ניהול / יום החתונה / תקשורת
- User avatar with initials + wedding countdown
- Active route highlighting
- Logout button
- Page title in topbar
- Smooth page transitions (fade + slide)

**Files changed:**
- `frontend/src/components/layout/AppLayout.vue` (complete rewrite, 515 lines)

**Branch:** `feat/page/app-layout`
**Build:** ✅ Passes (AppLayout-*.js: 5.0 kB gzip:2.0 kB)
**Test URL:** http://localhost:3001/app/dashboard (requires auth)

---

## 2026-04-02T20:00Z | Landing | feat/page/landing

**Summary:** Full Hebrew landing page for yalla-wedding SaaS.

**What was built:**
- Sticky glassmorphism navbar with mobile hamburger
- Hero section: H1 with gradient text, CTA buttons, stats, UI mockup with floating badges
- Features section: 6 feature cards (Guests, Budget, WhatsApp, Seating, Gifts, Vendors)
- How it works: 3-step walkthrough
- Pricing: Free vs Premium plans
- Testimonials: 3 customer reviews
- CTA banner (dark navy gradient)
- Footer with links

**Files changed:**
- `frontend/src/views/LandingView.vue` (complete rewrite, 1211 lines)

**Branch:** `feat/page/landing`
**Build:** ✅ Passes (LandingView-*.js: 14 kB gzip:4.4 kB)
**Test URL:** http://localhost:3001/

---

## 2026-04-02T20:25Z | FIX ROUND 1 APPLIED | feat/page/app-layout + feat/page/landing

**Summary:** Applied all fixes identified by המבקר (code reviewer) in both branches.

**AppLayout fixes (feat/page/app-layout):**
- [HIGH] Logout redirect: added `handleLogout()` that calls `auth.logout()` then `router.push('/login')`
- [MEDIUM-RTL] Active nav indicator: changed `border-right` → `border-left` on `.nav-item.router-link-active`
- [MEDIUM-A11Y] Collapse button: added `aria-label` (dynamic) + `aria-expanded` (dynamic)
- [MEDIUM-A11Y] Hamburger button: added `aria-label` (dynamic) + `aria-expanded` (dynamic)

**Landing fixes (feat/page/landing):**
- [HIGH] Footer links: removed dead `<a href="/privacy">` and `<a href="/terms">` (routes don't exist)
- [MEDIUM] Pricing CTA: fixed `plan.featured ? '/register' : '/register'` → `plan.featured ? '/register?plan=premium' : '/register'`
- [MEDIUM] Added `<main>` landmark wrapper around page content (between nav and footer)
- [MEDIUM] Added `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }`
- [LOW] Removed dead code: deleted 2 divs with `class="step-arrow"` (display:none)

**Build:** ✅ 0 errors (feat/page/landing - both AppLayout + LandingView bundled)

---

## 2026-04-02T20:30Z | Dashboard Page | feat/page/dashboard

**Summary:** Full real-data dashboard with backend update.

**Backend updated:**
- `backend/src/routes/dashboard.js`: GET /api/dashboard — real Prisma queries
  - User info (name1, name2, weddingDate)
  - Guest stats grouped by rsvpStatus (confirmed/maybe/declined/pending)
  - Budget totals (allocatedAmount sum vs expenses sum)
  - Last 5 guests as recent activity feed
  - Wedding countdown computed in days

**Frontend built:**
- Greeting: "שלום [חתן] ו[כלה]! 💍" with dynamic subtitle
- Big countdown badge (pink gradient) — pulses when ≤30 days
- "הגדר תאריך חתונה" CTA if no date set
- 4-card stats row: אורחים מאושרים / לא בטוחים / לא מגיעים / סה"כ
- Budget card: big remaining number + progress bar + overspent state
- Quick-actions grid: 8 navigation shortcuts
- Recent activity feed: last 5 guests with avatar, RSVP badge, relative time
- Loading skeleton + error state
- Mobile responsive

**Files changed:**
- `backend/src/routes/dashboard.js` (real Prisma data)
- `frontend/src/views/app/DashboardView.vue` (complete rewrite, ~450 lines)

**Branch:** `feat/page/dashboard`
**Build:** ✅ Passes (DashboardView-*.js: 8.88 kB gzip:3.08 kB)
**Test URL:** http://localhost:3001/app/dashboard (requires auth)

---

## 2026-04-02T20:45Z | Critical Security + Auth Fixes | feat/fix/critical-auth

**Summary:** Addressed 5 security and correctness issues before continuing feature development.

### CRITICAL FIX 1: JWT memory-only (XSS mitigation)
- **Problem:** `accessToken` was stored in `localStorage` — exposed to XSS attacks.
- **Fix:** Removed all `localStorage.setItem/getItem/removeItem` for `access_token` from `auth.js` and `useApi.js`.
- **Architecture:** Created `frontend/src/lib/tokenRegistry.js` — a tiny in-memory module that holds the token without circular dependency issues.
  - `auth.js` imports `tokenRegistry` to keep the Pinia ref and registry in sync via `_setToken()`.
  - `useApi.js` imports `tokenRegistry` to attach the token to outgoing requests.
- The httpOnly `refresh_token` cookie is still used for silent refresh.

### CRITICAL FIX 2: Auth race condition on hard reload
- **Problem:** Direct navigation to `/app/dashboard` redirected to `/login` because `router.beforeEach` evaluated `isLoggedIn` before `init()` completed.
- **Fix:** Added `authReady = ref(false)` to auth store + exported it.
- Added `async init()` to auth store: tries `/auth/refresh` then `/auth/me`, sets `authReady = true` in `finally`.
- `App.vue`: `onMounted(async () => { await auth.init() })`.
- `router/index.js`: `beforeEach` now awaits `authReady` via a one-shot `watch()` before evaluating guards.

### CRITICAL FIX 3: weddingDate Zod validation
- **Problem:** `weddingDate: z.string().datetime()` rejected `input[type=date]` values (`YYYY-MM-DD`).
- **Fix:** Changed to `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()`.

### HIGH FIX 4: validate.js swallowing non-ZodError exceptions
- **Problem:** `catch(err)` only handled `ZodError` — other exceptions were silently swallowed.
- **Fix:** Added `else { throw err }` to re-throw non-validation errors to Fastify's error handler.

### HIGH FIX 5: RSVP 'maybe' → 'pending' consistency
- **Problem:** `dashboard.js` computed a `maybe` counter that could never be populated (DB uses `'pending'`).
- **Fix:** Removed `maybe` from `guestCounts` in `dashboard.js`; all non-confirmed/non-declined guests accumulate in `pending`.
- Updated `DashboardView.vue`: replaced `{{ data.guests.maybe }}` stat card with `{{ data.guests.pending }}` ("ממתינים לאישור").
- Removed `maybe` entries from `rsvpLabel` and `rsvpBadgeClass` maps.

### Build & Verification
- `npm run build` → ✅ 0 errors, 157 modules transformed
- `pm2 restart yalla-api` → ✅ online
- `GET /health` → `{"status":"ok"}`

**Branch:** `feat/fix/critical-auth`
**PR:** https://github.com/wizzo-dev/wedding-app/pull/new/feat/fix/critical-auth

---
