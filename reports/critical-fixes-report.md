# Critical Fixes Report
**Branch:** `feat/fix/critical-auth`  
**Date:** 2026-04-02T20:45Z  
**Build:** ✅ 0 errors | **Backend:** ✅ online | **Health:** `{"status":"ok"}`

---

## CRITICAL FIX 1 — JWT memory-only (XSS mitigation)

| | Before | After |
|---|---|---|
| Token storage | `localStorage.setItem('access_token', ...)` | In-memory only (`tokenRegistry.js` + Pinia ref) |
| XSS exposure | ✗ Token readable by any JS on the page | ✓ Token inaccessible to injected scripts |

**Files changed:**
- `frontend/src/lib/tokenRegistry.js` *(new)* — tiny in-memory token holder, no circular deps
- `frontend/src/stores/auth.js` — removed all localStorage calls; added `_setToken()` helper that syncs ref + registry
- `frontend/src/composables/useApi.js` — request interceptor reads from `tokenRegistry.get()` instead of `localStorage`

**Architecture note:** A dedicated `tokenRegistry` module was introduced to break the circular dependency between `useApi.js` (which auth.js imports) and `auth.js` (which useApi.js would need to import).

---

## CRITICAL FIX 2 — Auth race condition on page load

| | Before | After |
|---|---|---|
| Hard reload to `/app/dashboard` | Redirected to `/login` (user=null, init not done) | Waits for `authReady`, then evaluates guard correctly |

**Files changed:**
- `frontend/src/stores/auth.js` — added `authReady = ref(false)`, exported it; added `async init()` that runs silent refresh → fetchMe → sets `authReady=true` in `finally`
- `frontend/src/App.vue` — `onMounted(async () => { await auth.init() })`
- `frontend/src/router/index.js` — `beforeEach` is now `async`; awaits `authReady` via one-shot `watch()` before evaluating `requiresAuth` / `guest` guards

**Sequence after fix:**
1. App mounts → `auth.init()` starts
2. Router guard fires → sees `authReady=false` → waits
3. `init()` completes (refresh + fetchMe or silent fail) → `authReady=true`
4. Watch fires → guard resumes → correct redirect decision

---

## CRITICAL FIX 3 — weddingDate Zod validation

| | Before | After |
|---|---|---|
| Schema | `z.string().datetime().optional()` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()` |
| `input[type=date]` value `"2025-06-15"` | ❌ ZodError (not ISO datetime) | ✅ Passes |

**File changed:** `backend/src/middleware/validate.js`

---

## HIGH FIX 4 — validate.js swallowing non-ZodError exceptions

| | Before | After |
|---|---|---|
| Non-ZodError thrown by handler | Silently swallowed — request hangs or returns wrong status | Re-thrown to Fastify's global error handler |

**File changed:** `backend/src/middleware/validate.js`

```js
// Added else branch:
} else {
  throw err  // re-throw non-validation errors!
}
```

---

## HIGH FIX 5 — RSVP 'maybe' → 'pending' consistency

| | Before | After |
|---|---|---|
| `dashboard.js` guestCounts | Included `maybe: 0` field (dead code — DB never has this status) | Removed `maybe`; all pending-ish guests accumulate in `pending` |
| Dashboard stat card | Showed `data.guests.maybe` ("לא בטוחים") — always 0 | Shows `data.guests.pending` ("ממתינים לאישור") |
| `rsvpLabel` / `rsvpBadgeClass` | Included `maybe` entries | Removed `maybe` entries |

**Valid statuses enforced everywhere:** `'pending' | 'confirmed' | 'declined'`

**Files changed:**
- `backend/src/routes/dashboard.js`
- `frontend/src/views/app/DashboardView.vue`

---

## Verification

```
npm run build        → ✅ 157 modules transformed, 0 errors
pm2 restart yalla-api → ✅ status: online
curl /health          → {"status":"ok","ts":...}
git push              → feat/fix/critical-auth pushed to origin
```

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `frontend/src/lib/tokenRegistry.js` | new | In-memory token store |
| `frontend/src/stores/auth.js` | modified | Memory-only token, authReady, init() |
| `frontend/src/composables/useApi.js` | modified | tokenRegistry instead of localStorage |
| `frontend/src/App.vue` | modified | await auth.init() on mount |
| `frontend/src/router/index.js` | modified | Async guard, wait for authReady |
| `backend/src/middleware/validate.js` | modified | weddingDate regex, re-throw non-Zod errors |
| `backend/src/routes/dashboard.js` | modified | Remove 'maybe' from guestCounts |
| `frontend/src/views/app/DashboardView.vue` | modified | Remove 'maybe' refs |
