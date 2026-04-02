# Budget API Fixes Report

**Branch:** feat/fix/budget-api-contract  
**Date:** 2026-04-02  
**Status:** ✅ All fixes applied, build passing, endpoints verified

---

## Summary of All 7 Fixes

---

### CRITICAL FIX 1 — Budget API Contract Mismatch

**Problem:** `backend/src/routes/budget.js` was a single TODO stub. All budget endpoints were non-functional.

**Fix:** Built complete budget routes:

| Endpoint | Method | Behavior |
|----------|--------|----------|
| `/api/budget` | GET | Returns `{totalBudget, totalSpent, remaining, categories[...]}` |
| `/api/budget/total` | PUT | Receives `{totalBudget}`, updates `users.total_budget`, returns user |
| `/api/budget/categories` | POST | `{name, allocatedPercent, allocatedAmount, icon, color}` |
| `/api/budget/categories/:id` | PUT | Partial update |
| `/api/budget/categories/:id` | DELETE | Auth + ownership |
| `/api/budget/expenses` | POST | `{categoryId, vendorName, amount, note, date}` |
| `/api/budget/expenses` | GET | All user expenses, optional `?categoryId=X` filter |
| `/api/budget/expenses/:id` | DELETE | Auth + ownership |

**Schema change:** Added `totalBudget Float @default(0) @map("total_budget")` to `User` model.  
**Migration:** `20260402211626_add_total_budget`

---

### CRITICAL FIX 2 — CategoryView Expenses Always Empty

**Problem:** `CategoryView.vue` was a "בבנייה" placeholder. Even if it called an endpoint, `?categoryId=X` wasn't supported.

**Fix:**
- Backend `GET /api/budget/expenses` now accepts optional `?categoryId=X` and filters correctly
- `CategoryView.vue` fully built: loads via `api.get('/budget/expenses', { params: { categoryId } })` using the correct parameter name

---

### HIGH FIX 3 — Guests: Silent Delete Failure

**Problem:** `GuestsListView.vue` `deleteGuest()` had `// silent` — errors were swallowed.

**Fix:** Changed `catch { // silent }` to `catch (e) { alert(msg) }` — user now sees an error message if delete fails.

---

### HIGH FIX 4 — Guests: Bulk Import Without Validation

**Problem:** `POST /api/guests/bulk` saved all rows directly with minimal filtering. No rate limit. No cap.

**Fix:**
- **Rate limit:** 3 imports per hour per user (in-memory map, 1-hour window)
- **Hard cap:** 500 guests per import request → 400 if exceeded
- **Per-row validation:**
  - `name` is required → skip row with `שם חובה` error
  - `phone` regex: `/^[+\d\s\-()\u200f]{7,20}$/` → skip row with phone error
- **Response:** `{count, message, skipped, invalidRows: [{row, name, errors}]}` — no crash

---

### HIGH FIX 5 — Auth: 401 Refresh Loop Risk

**Problem:** If `/api/auth/refresh` returned 401, the interceptor would try to refresh again → infinite loop.

**Fix:** Added early exit at top of error handler:
```js
if (original.url?.includes('/auth/refresh')) {
  queue.forEach(p => p.reject(err))
  queue = []
  refreshing = false
  tokenRegistry.clear()
  window.location.href = '/login'
  return Promise.reject(err)
}
```

---

### HIGH FIX 6 — createGuest Schema Missing `side` Field

**Problem:** `schemas.createGuest` in `validate.js` had no `side` field — requests including `side` would pass it unvalidated or stripped.

**Fix:** Added:
```js
side: z.enum(['groom', 'bride', 'mutual']).optional()
```

---

### HIGH FIX 7 — updateRsvp Missing `maybe` Status

**Problem:** `schemas.updateRsvp` had `z.enum(['pending', 'confirmed', 'declined'])` — missing `'maybe'`.  
`guests.js` routes and frontend both use `'maybe'`, so the schema was inconsistent.

**Grep result:** `maybe` used in:
- `backend/src/routes/guests.js` — `RSVP_STATUSES = [..., 'maybe']`
- `frontend/src/views/app/GuestsListView.vue` — stats + filter tabs

**Fix:** Updated schema to:
```js
rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe'])
```

---

## Verification

```
npm run build    ✅ 0 errors, 157 modules
pm2 restart      ✅ online
/health          ✅ {"status":"ok"}
GET /api/budget  ✅ correct shape
PUT /budget/total ✅ updates + returns user
POST /budget/categories ✅
POST /budget/expenses   ✅
GET /budget/expenses?categoryId=X ✅
DELETE /budget/categories/:id ✅
DELETE /budget/expenses/:id ✅
DELETE /api/guests/9999 ✅ → 404 NOT_FOUND
Bulk import with invalid rows ✅ → reports skipped rows
```
