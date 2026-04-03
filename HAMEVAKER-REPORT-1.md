# 🔍 המבקר - Round 1 Report
**Date:** 2026-04-03  
**Branch:** feat/invitation-builder  
**Score: 8.5 / 10**

---

## ✅ PASSED CHECKS

1. **No hardcoded box-shadows** in the 35 target screens — all removed or using CSS variables  
2. **No raw `import axios from 'axios'`** in any Vue component (only in useApi.js composable as intended)  
3. **All api.get/post calls** already use `@/composables/useApi` composable  
4. **No `/api/` prefix issues** in axios api calls (only in native `fetch()` calls which correctly need the full path)  
5. **Prisma import format** correct: `import { prisma } from '../models/db.js'`  
6. **No duplicate route registrations** — vendorRoutes + vendorSuggestionsRoutes share `/api/vendors` prefix with non-conflicting paths  
7. **Submit buttons** have `:disabled="loading/saving"` on all critical forms  
8. **v-for :key** present on all loops (multi-line format, confirmed)  
9. **RTL dir** present on 50+ view containers  
10. **Hebrew placeholders** on all inputs  
11. **Build passes** clean with no errors or warnings  

---

## 🚨 CRITICAL ISSUES

### C1: `SeatingMapView.vue` is NOT in the router
**File:** `frontend/src/router/index.js`  
**Issue:** `SeatingMapView.vue` exists (in the target 35-screen list) but has no route entry. Users cannot navigate to it.  
**Fix:** Add route: `{ path: 'seating/map', name: 'SeatingMap', component: () => import('@/views/app/SeatingMapView.vue') }`

### C2: `WhatsappView.vue` is NOT in the router  
**File:** `frontend/src/router/index.js`  
**Issue:** `WhatsappView.vue` (batch 4 target) has no route. Unreachable.  
**Fix:** Add route: `{ path: 'whatsapp/overview', name: 'WhatsappOverview', component: () => import('@/views/app/whatsapp/WhatsappView.vue') }`  
**OR** redirect `whatsapp` to `whatsapp/overview` instead of `whatsapp/connect`

### C3: `GuestsView.vue` route mismatch
**File:** `frontend/src/router/index.js`  
**Issue:** Router shows `guests` → `GuestsListView.vue`, but there's also `GuestsView.vue` in `views/app/guests/GuestsView.vue` which is NOT routed. Two separate guest list views exist.  
**Fix:** Verify which view should be the canonical guest list. If GuestsView.vue is the card-based mobile view and GuestsListView.vue is the table-based desktop view, consider merging or removing the unused one.

---

## ⚠️ WARNINGS

### W1: `box-shadow` still present in non-target files
**Files:** `PaymentView.vue`, `cards/CardsView.vue`, `cards/PreviewView.vue`  
These files are NOT in the 35 target screens but still have hardcoded box-shadows. If these pages are visible to users, they violate the design system.  
**Recommendation:** Remove box-shadows in future batch.

### W2: `category-card:hover` uses `box-shadow: var(--shadow)` in BudgetView.vue
**File:** `frontend/src/views/app/budget/BudgetView.vue` line ~298  
CSS variable `--shadow` is set to `none` so it has no visual effect, but semantically inconsistent.  
**Fix:** Change to `border-color: var(--color-primary)` hover effect.

### W3: Router route ordering — `guests/:id` before `guests/stats` and `guests/import`
**File:** `frontend/src/router/index.js`  
Static paths (`guests/import`, `guests/stats`) are defined AFTER the dynamic `guests/:id`. Vue Router 4 handles this correctly (static > dynamic priority), but convention suggests defining static routes first.  
**Fix:** Reorder routes for clarity.

### W4: `timeline.js` backend route missing `userId` scope
**File:** `backend/src/routes/timeline.js`  
Need to verify that all timeline queries scope to `req.user.userId`. 

### W5: `form-input` in settings/vendor views uses `var(--radius)` (10px) instead of specified 12px
**Files:** Vendor settings, settings forms  
Design spec says 12px for inputs, but `var(--radius)` = 10px. Minor discrepancy.

### W6: `SeatingView.vue` uses raw `fetch('/api/seating/export')` with manual token
**File:** `frontend/src/views/app/seating/SeatingView.vue` line ~404-696  
Auth token obtained manually. If token expires, no auto-refresh. Should use `api` composable for non-blob calls.

---

## 📊 Summary

| Category | Status |
|----------|--------|
| Design System (box-shadow) | ✅ Clean (target screens) |
| API Consistency | ✅ Clean |
| Backend Validation | ✅ Good |
| Router Completeness | ❌ 2 unrouted views |
| Backend Duplicates | ✅ None |
| Build Status | ✅ Pass |

**Score: 8.5 / 10**  
*Deductions: -1 missing routes (C1+C2), -0.5 GuestsView confusion (C3)*
