# המבקר — Round 4 Critical Review

**Date:** 2026-04-02  
**Reviewer:** המבקר (Devil's Advocate)  
**Branches reviewed:**
- `feat/page/budget-overview` — BudgetView.vue + CategoryView.vue + backend/src/routes/budget.js
- `feat/page/guests-list` — GuestsListView.vue (actual impl.) + backend/src/routes/guests.js
- `feat/fix/critical-auth` — tokenRegistry.js + auth.js + useApi.js + router/index.js + middleware/validate.js

---

## Branch 1: `feat/page/budget-overview`

### Files reviewed:
- `frontend/src/views/app/budget/BudgetView.vue`
- `frontend/src/views/app/budget/CategoryView.vue`
- `backend/src/routes/budget.js`

---

### 🔴 CRITICAL

**[CRIT-1]** `frontend/src/views/app/budget/BudgetView.vue` — script, ~lines 255–290  
**API endpoint mismatch: frontend calls endpoints that DO NOT EXIST in the backend.**

The frontend calls all of the following — none exist in `backend/src/routes/budget.js`:
- `api.get('/budget/expenses', { params: { limit: 20 } })` → 404 (no global expenses endpoint)
- `api.post('/budget/expenses', {...})` → 404 (backend requires categoryId in path: `POST /:categoryId/expenses`)
- `api.delete('/budget/expenses/${id}')` → 404 (backend has `DELETE /:categoryId/expenses/:expenseId`)
- `api.post('/budget/categories', {...})` → 404 (backend endpoint is `POST /`)
- `api.delete('/budget/categories/${id}')` → 404 (backend endpoint is `DELETE /:categoryId`)

**Result:** The Recent Expenses section, Add Expense modal, Add Category button — all permanently broken. Budget page renders but all mutations throw 404.

---

**[CRIT-2]** `frontend/src/views/app/budget/BudgetView.vue` — `budget` ref initialization + `load()`, lines ~250–265  
**Field name mismatch: backend returns `budgetTotal` and `totalRemaining`, frontend reads `totalBudget` and `remaining`.**

Backend response (`GET /api/budget`):
```json
{ "budgetTotal": 50000, "totalSpent": 12000, "totalRemaining": 38000, ... }
```

Frontend state:
```js
const budget = ref({ totalBudget: 0, totalSpent: 0, remaining: 0, categories: [] })
```

- `budget.value.totalBudget` → always `undefined` (server sends `budgetTotal`)
- `budget.value.remaining` → always `undefined` (server sends `totalRemaining`)
- `spentPercent` computed → always returns `0` because `!budget.value.totalBudget` is truthy when undefined
- Donut chart permanently empty

---

**[CRIT-3]** `frontend/src/views/app/budget/BudgetView.vue` — `saveTotal()`, line ~275  
**PUT /total payload field name mismatch.**

Frontend sends: `{ totalBudget: totalInput.value }`  
Backend expects: `const { budgetTotal } = req.body` (`PUT /total`)

Saving total budget silently saves `undefined` → `Number(undefined) || 0 = 0`. Every save resets the budget to 0.

---

**[CRIT-4]** `frontend/src/views/app/budget/CategoryView.vue` — `load()`, lines ~155–165  
**Same `/budget/expenses` API mismatch applies to CategoryView.**

`api.get('/budget/expenses', { params: { categoryId: id, limit: 200 } })` → 404.
The category detail page loads the category meta correctly (by fetching all categories and filtering client-side), but the expenses list always returns an error. All expenses in the category are invisible.

---

### 🟠 HIGH

**[HIGH-1]** `backend/src/routes/budget.js` — ALL routes  
**Zero Zod validation. Raw `req.body` access with manual casts.**

- `Number(allocatedAmount) || 0` — `NaN || 0` silently swallows bad input
- `name.trim()` — no max length check; can insert arbitrarily long strings into DB
- `color` field — no hex format validation; can store arbitrary strings
- `icon` field — no length limit; emoji sequences can be multi-codepoint
- `Number(amount)` on expense — negative amounts accepted (budgets can go negative silently)
- `new Date(date)` — user-supplied date string not validated; `new Date("not-a-date")` returns Invalid Date and Prisma will throw a raw 500

No input validation on ANY of the 9 routes.

---

**[HIGH-2]** `backend/src/routes/budget.js` — `POST /:categoryId/expenses`, line ~167  
**No input sanitization on `vendorName`.**

`vendorName: vendorName.trim()` is the only processing done. No length limit, no XSS sanitization. If the frontend ever renders `exp.vendorName` without escaping (unlikely with Vue's template binding, but potential in future server-side renders or PDF exports), this is a vector.

---

**[HIGH-3]** `backend/src/routes/budget.js` — all routes  
**No global error handling. Prisma errors bubble as raw 500s.**

All route handlers use `async` with no try/catch. If Prisma throws (connection error, constraint violation, invalid ID coercion), Fastify catches it but the error may leak DB schema details in development mode. No consistent error envelope.

---

**[HIGH-4]** `frontend/src/views/app/budget/CategoryView.vue` — `load()`, lines ~155–168  
**Inefficient: fetches ALL categories to find one.**

`api.get('/budget')` fetches every category with expenses for the user, then does:
```js
category.value = budgetRes.data.categories.find(c => c.id === parseInt(id)) || null
```

The backend has a correct `GET /:categoryId` endpoint that returns just the category with its expenses. This endpoint is completely unused. The current approach:
- Downloads all categories unnecessarily
- Does NOT include the category's expenses (the budget overview endpoint only returns expense counts, not individual expenses)
- Means the expenses table is always populated from the broken `/budget/expenses` call rather than the working `GET /:categoryId` response

---

**[HIGH-5]** `frontend/src/views/app/budget/BudgetView.vue` — modal templates  
**No focus trap in modals. Modal does not respond to ESC key.**

The Add Expense and Add Category modals have no focus trap — keyboard users can Tab out of the modal into the background. The `@click.self` on the overlay handles mouse dismiss, but there is no `@keydown.escape` handler on the overlay or document level. Violates WCAG 2.1 SC 2.1.2 (No Keyboard Trap — must be able to close modal via keyboard).

---

### 🟡 MEDIUM

**[MED-1]** `frontend/src/views/app/budget/BudgetView.vue` — delete buttons  
**`confirm()` dialogs are accessibility anti-patterns.**

`deleteCategory` and `deleteExpense` use `window.confirm()`. Native `confirm()` dialogs:
- Block the main thread
- Cannot be styled to match the RTL Hebrew UI
- Receive no focus management
- Fail in some browser extensions and PWA contexts

Replace with an inline confirmation or a custom confirm modal.

---

**[MED-2]** `frontend/src/views/app/budget/BudgetView.vue` — template, delete buttons  
**Icon-only buttons have no accessible label.**

```html
<button class="btn btn-ghost btn-icon btn-sm cat-delete-btn"
  @click.stop="deleteCategory(cat.id)" title="מחק קטגוריה">🗑️</button>
```

`title` attribute is not reliable for screen readers. Should be `aria-label="מחק קטגוריה"` in addition to or instead of `title`.

Same issue on expense delete buttons.

---

**[MED-3]** `frontend/src/views/app/budget/BudgetView.vue` — `saveTotal()` error handling  
**Uses `alert()` for error display — inaccessible.**

`alert(e?.response?.data?.message || 'שגיאה')` is not keyboard/screen reader accessible and has no RTL styling. Should display inline error near the form.

---

**[MED-4]** `frontend/src/views/app/budget/CategoryView.vue` — expenses table  
**Table implemented with CSS grid divs, not semantic `<table>` elements.**

The `.exp-table-header` and `.exp-table-row` are `<div>` elements, not `<th>` and `<td>`. Screen readers cannot interpret column structure. Headers have no `scope` attribute. Violates WCAG 1.3.1 (Info and Relationships).

---

**[MED-5]** `frontend/src/views/app/budget/CategoryView.vue` — `add-exp-form`  
**Inline expense form inputs lack `<label>` elements.**

```html
<input v-model="newExp.vendorName" class="input" placeholder="שם ספק *" />
```

`placeholder` is not a substitute for `<label>`. Placeholder text disappears when user types, leaving no accessible name for the field. Violates WCAG 1.3.1 and 3.3.2.

---

**[MED-6]** `backend/src/routes/budget.js` — `GET /`, line ~8  
**N+1 query risk: `user.findUnique` + `budgetCategory.findMany` executed sequentially.**

```js
const user = await prisma.user.findUnique({ where: { id: userId } })
const categories = await prisma.budgetCategory.findMany({ ... })
```

These can be parallelized with `Promise.all`. As the category list grows, this adds latency.

---

**[MED-7]** `backend/src/routes/budget.js` — `PUT /:categoryId/expenses/:expenseId`, line ~210  
**Missing ownership check on categoryId.**

The route verifies `expense.userId === userId` when looking up the expense, but does NOT verify that `req.params.categoryId` matches the expense's actual `categoryId`. A malicious user with a valid expenseId could supply any `categoryId` in the path without rejection.

---

### 🟢 LOW

**[LOW-1]** `frontend/src/views/app/budget/BudgetView.vue` — `totalInput` number input  
No `min="0"` attribute. User can type negative total budget. Backend does `Number(budgetTotal) || 0` which accepts negatives.

**[LOW-2]** `frontend/src/views/app/budget/BudgetView.vue` — SVG donut chart  
SVG has no `<title>` or `aria-label`. Screen readers will try to read the SVG text nodes but get no context. Add `role="img"` and `aria-label="גרף עוגה: X% הוצא"`.

**[LOW-3]** `frontend/src/views/app/budget/BudgetView.vue` — `load()` error catcher  
`catch (e)` shadows the outer `error` ref variable name (also named `e` in template). While not a functional bug, it's a naming collision that reduces readability.

**[LOW-4]** `backend/src/routes/budget.js` — `POST /` create category  
`allocatedPercent` is accepted and stored but never recomputed when `budgetTotal` changes. Over time, `allocatedPercent` becomes stale/incorrect.

---

## VERDICT (Budget): 🔴 REQUEST_CHANGES

The branch ships with two CRITICAL API contract mismatches that render all write operations broken. The frontend and backend were built with different field names and different endpoint paths. The views will render (with zero budget totals) but no mutations work.

---

---

## Branch 2: `feat/page/guests-list`

### Files reviewed:
- `frontend/src/views/app/GuestsListView.vue` (the actual implementation — router points here)
- `frontend/src/views/app/guests/GuestsView.vue` (exists as placeholder only — see LOW-1)
- `backend/src/routes/guests.js`

---

### 🟠 HIGH

**[HIGH-1]** `backend/src/routes/guests.js` — GET /, lines ~13–30  
**Two separate DB queries per GET /guests: all filtered guests + all unfiltered guests for stats.**

```js
const [guests, all] = await Promise.all([
  prisma.guest.findMany({ where, ... }),  // filtered
  prisma.guest.findMany({ where: { userId } })  // ALL - for stats
])
```

The second query fetches ALL guests with no limit. For a user with 500 guests, this fetches and deserializes all 500 every time the list is loaded (even when just searching). Stats should be computed in a single aggregation query or cached.

---

**[HIGH-2]** `backend/src/routes/guests.js` — GET /, line ~18  
**Case-sensitive search on SQLite.**

```js
where.OR = [
  { name: { contains: search } },
  ...
]
```

Prisma's `contains` on SQLite is case-sensitive by default. Searching "ישראל" won't match "ישראל " (trailing space), and searching "cohen" won't match "Cohen". Prisma 4.7+ supports `{ contains: search, mode: 'insensitive' }` but requires the `insensitiveFilters` preview feature on SQLite, or use `{ contains: search.toLowerCase() }` after normalizing stored data. **Hebrew names are particularly affected** — Hebrew has no case but mixing with Latin characters in names is common.

---

**[HIGH-3]** `backend/src/routes/guests.js` — POST /bulk, lines ~96–125  
**No per-guest validation in bulk import. Malicious data passes through.**

```js
const created = await prisma.guest.createMany({
  data: list.filter(g => g.name && g.name.trim()).map(g => ({...}))
})
```

- Phone numbers are not validated against the regex in `schemas.createGuest`
- Email addresses not validated
- `numPeople` not range-checked (can be negative or 999)
- `name` not length-capped (can be >100 chars)
- `notes` field not included, but could be injected via extra fields if parsing changes

The Zod `schemas.createGuest` middleware is not applied to this route.

---

**[HIGH-4]** `frontend/src/views/app/GuestsListView.vue` — `deleteGuest()`, line ~380  
**Errors in delete are silently swallowed.**

```js
} catch {
  // silent
}
```

If the delete fails (network error, 404, 403), the guest visually disappears from `guests.value` (array filter runs before confirmation that delete succeeded) but is then re-fetched in the stats call. This leads to a confusing flicker: guest disappears, then reappears in stats but not in list. The guest list is not re-fetched on delete failure.

Actually worse: `guests.value = guests.value.filter(g => g.id !== id)` runs before the catch block is reached, but `deletingId` resets, so after the silent failure the guest is gone from the UI but still in the DB. No error notification to the user.

---

### 🟡 MEDIUM

**[MED-1]** `backend/src/routes/guests.js` — GET /, line ~27  
**`side` filter accepts user input without encoding risk, but the allowed values include Hebrew.**

```js
if (side && SIDES.includes(side)) {
  where.side = side
}
```

`SIDES = ['חתן', 'כלה', 'משותף']`. The `includes()` check is correct for preventing injection. However, URL encoding of Hebrew characters in query strings (e.g., `?side=%D7%97%D7%AA%D7%9F`) must be properly decoded by Fastify. Fastify does decode query params by default, so this is an informational note rather than a bug.

---

**[MED-2]** `frontend/src/views/app/GuestsListView.vue` — `submitForm()`, lines ~355–375  
**On successful edit, stats are fetched via a second full API call.**

```js
const statsRes = await api.get('/guests')
stats.value = statsRes.data.stats
```

After edit, the full guest list is re-fetched just to get updated stats. The edited guest is already updated in-place in `guests.value[idx]` but stats are fetched separately. This means 2 API calls per save (PUT + GET). Stats could be computed locally from `guests.value` to avoid the extra call.

---

**[MED-3]** `frontend/src/views/app/GuestsListView.vue` — `submitImport()`, lines ~400–420  
**Bulk import textarea has no max length. No limit on number of guests per import.**

A malicious or careless user could paste a 10,000-row CSV into the textarea, causing the browser to freeze parsing and the backend to execute `createMany` with thousands of records in one transaction. No `maxlength` on the `<textarea>`, no count check before submitting.

---

**[MED-4]** `frontend/src/views/app/GuestsListView.vue` — search input, line ~90  
**No `aria-label` on search input.**

```html
<input v-model="search" class="input search-input" placeholder="חפש לפי שם, טלפון, קבוצה..." />
```

No `id`/`for` label pairing, no `aria-label`. Placeholder is not a label. Screen readers announce the input type without context.

---

**[MED-5]** `frontend/src/views/app/GuestsListView.vue` — guest row actions  
**Action buttons for each guest row lack `aria-label` with the guest name context.**

```html
<button class="btn btn-ghost btn-icon btn-sm" @click="openEditModal(guest)" title="ערוך אורח">✏️</button>
```

`title` is unreliable for accessibility. When a screen reader user navigates through multiple "edit" buttons in a list, they all read as "button" with no context about which guest. Should be `aria-label="ערוך אורח: {{ guest.name }}"`.

---

**[MED-6]** `backend/src/routes/guests.js` — no PATCH /rsvp endpoint  
The `schemas.updateRsvp` Zod schema is defined in `validate.js` but there is no PATCH route for RSVP in the guests route file. The GuestsView.vue sends full PUT requests for RSVP updates. The schema exists but is unused, suggesting a planned endpoint was never implemented.

---

**[MED-7]** `frontend/src/views/app/GuestsListView.vue` — modal, no focus management  
Modal opens via `showGuestModal = true` but focus is not moved to the modal. A keyboard user would need to Tab through the entire page to reach the modal content. No `autofocus` on the first input, no `focus()` call in `openAddModal()`. Same missing ESC handler issue as budget modals.

---

### 🟢 LOW

**[LOW-1]** `frontend/src/views/app/guests/GuestsView.vue` — PLACEHOLDER FILE EXISTS  
**Two competing `GuestsView` implementations exist simultaneously:**
- `frontend/src/views/app/GuestsListView.vue` — full working implementation, used by router
- `frontend/src/views/app/guests/GuestsView.vue` — placeholder stub (`בבנייה... 🚧`)

The placeholder at `guests/GuestsView.vue` should be removed or completed. It's dead code that will confuse future developers. The naming (`GuestsListView.vue` vs `GuestsView.vue`) is also inconsistent with the rest of the view structure.

**[LOW-2]** `backend/src/routes/guests.js` — validate middleware not applied  
None of the guest routes use `preHandler: [validate(schemas.createGuest)]` even though schemas are defined. All validation is manual if/else checks.

**[LOW-3]** `backend/src/routes/guests.js` — POST /, line ~87  
`numPeople: Number(numPeople) || 1` — if user sends `numPeople: 0` intentionally (e.g., "RSVP declined, 0 people"), it silently becomes `1`. The `||` operator treats `0` as falsy. Use `numPeople !== undefined ? Number(numPeople) : 1` with explicit range check.

**[LOW-4]** `frontend/src/views/app/GuestsListView.vue` — `openWhatsApp()`, line ~305  
WhatsApp link opens with `window.open(..., '_blank')` with no `rel="noopener noreferrer"` — this is equivalent to opening a tab with access to `window.opener`. Not catastrophic (it's calling `window.open`, not an `<a>` tag), but should still be aware of opener access.

---

## VERDICT (Guests): 🔴 REQUEST_CHANGES

The backend is solid (auth-guarded, ownership-checked), but the silent delete failure, bulk import with no validation/limit, and missing focus management prevent approval. The duplicate placeholder view file is a maintenance hazard.

---

---

## Branch 3: `feat/fix/critical-auth`

### Files reviewed:
- `frontend/src/lib/tokenRegistry.js`
- `frontend/src/stores/auth.js`
- `frontend/src/composables/useApi.js`
- `frontend/src/router/index.js`
- `backend/src/middleware/validate.js`

---

### Checklist: Is the fix complete and correct?

#### ✅ tokenRegistry.js — used everywhere?

`tokenRegistry.js` is correctly implemented as a simple in-memory singleton:
```js
let _token = null
export const tokenRegistry = { get, set, clear }
```

`useApi.js` uses `tokenRegistry.get()` in the request interceptor ✅  
`auth.js` uses `tokenRegistry.set()`/`tokenRegistry.clear()` via `_setToken()` ✅  
`git grep localStorage` confirms no remaining `localStorage.getItem('access_token')` calls ✅

**Assessment: COMPLETE**

---

#### ✅ Auth race condition — does the router guard fix work?

```js
if (!auth.authReady) {
  await new Promise(resolve => {
    const stop = watch(() => auth.authReady, (ready) => {
      if (ready) { stop(); resolve() }
    })
  })
}
```

- `stop()` is called before `resolve()` — no watcher leak ✅
- `auth.init()` always sets `authReady = true` in `finally {}` block ✅
- Multiple navigations: subsequent guards check `if (!auth.authReady)` which will be `false` after first resolution ✅

**Assessment: FUNCTIONALLY CORRECT** (but see HIGH-1 below)

---

#### ✅ validate.js — non-ZodError re-throw fixed?

```js
} else {
  throw err  // re-throw non-validation errors so Fastify handles them
}
```

Non-ZodError exceptions are now re-thrown ✅. Previously they were swallowed. Fix is correct.

**Assessment: COMPLETE**

---

#### ✅ weddingDate fix — accepts YYYY-MM-DD?

```js
weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לא תקין (YYYY-MM-DD)').optional().nullable()
```

Accepts the format returned by `<input type="date">` ✅  
`optional().nullable()` allows omission or null ✅

**Assessment: COMPLETE**

---

### 🟠 HIGH (Critical Auth branch)

**[HIGH-1]** `frontend/src/router/index.js` — `beforeEach` guard  
**No timeout on `authReady` watch. If `auth.init()` is never called, the app hangs forever.**

`App.vue` calls `auth.init()` in `onMounted()`. But `router.beforeEach` fires when Vue Router resolves the initial route, which can happen BEFORE `App.vue` is mounted. There is a window where:
1. User navigates to `/app/dashboard`
2. Router guard fires, `authReady = false`
3. Watch is set up, waiting for `authReady`
4. `App.vue` mounts, calls `auth.init()`
5. `authReady` becomes `true`, guard resolves

This generally works. BUT: if a network timeout causes `auth.init()` to hang (e.g., server is down), the app shows a blank screen with no feedback, no timeout fallback, no error message. The `init()` itself has no timeout mechanism.

**Recommendation:** Add a 10-second timeout to the Promise in the router guard:
```js
await Promise.race([
  waitForAuthReady(),
  new Promise(r => setTimeout(r, 10000)) // timeout fallback
])
```

---

**[HIGH-2]** `backend/src/middleware/validate.js` — `validate()` preHandler  
**Missing `return` before `reply.code(400).send()`.**

```js
if (err instanceof z.ZodError) {
  reply.code(400).send({ ... })
  // ← no return here!
} else {
  throw err
}
```

In Fastify, calling `reply.send()` without returning from an async `preHandler` is technically handled (Fastify checks `reply.sent` before running the route handler), but the preHandler function itself continues executing after the `send()` call. Any code after the `if` block — including async operations — would still run. Currently there is no code after the if/else, so this isn't a functional bug today. But it's a latent hazard: if a developer adds logging or cleanup code after the try/catch, it will run even after a 400 has been sent.

Fix: `return reply.code(400).send({ ... })`

---

**[HIGH-3]** `backend/src/middleware/validate.js` — `schemas.updateRsvp`  
**`updateRsvp` schema is missing `'maybe'` from the enum.**

```js
updateRsvp: z.object({
  ...
  body: z.object({
    rsvpStatus: z.enum(['pending', 'confirmed', 'declined']),  // ← missing 'maybe'!
    ...
  })
})
```

The system defines 4 RSVP statuses: `['pending', 'confirmed', 'declined', 'maybe']`. The `updateRsvp` schema only allows 3. Any PATCH/PUT with `rsvpStatus: 'maybe'` would fail Zod validation with a 400 error. The frontend GuestsListView.vue allows setting "לא בטוח" (maybe) status.

---

**[HIGH-4]** `backend/src/middleware/validate.js` — `schemas.createGuest`  
**Missing `side` field in `createGuest` schema.**

```js
createGuest: z.object({
  body: z.object({
    name: ...,
    phone: ...,
    email: ...,
    groupName: ...,
    numPeople: ...,
    notes: ...
    // ← no 'side' field!
  })
})
```

The guests backend `POST /` handler destructures and validates `side` manually via `SIDES.includes(side)`, but if `validate(schemas.createGuest)` is ever applied as preHandler, the `side` field would be stripped from `req.body` by Zod's default behavior (unknown keys are stripped by `z.object()`). Guests would always be created with the default side (`'חתן'`), even if the user specified otherwise.

---

### 🟡 MEDIUM (Critical Auth branch)

**[MED-1]** `frontend/src/composables/useApi.js` — 401 refresh loop  
**The refresh-queue mechanism has an untested edge case: if the refresh endpoint itself returns 401.**

```js
if (err.response?.status === 401 && !original._retry) {
  ...
  try {
    const res = await api.post('/auth/refresh')  // ← uses same axios instance
    ...
  } catch (refreshErr) {
    queue.forEach(p => p.reject(refreshErr))
    queue = []
    tokenRegistry.clear()
    window.location.href = '/login'
  }
}
```

If `POST /auth/refresh` returns 401 (expired refresh token), it triggers the response interceptor again. The `original._retry = true` only prevents the ORIGINAL failed request from retrying — it doesn't prevent the `/auth/refresh` call itself from looping. The `/auth/refresh` call doesn't set `_retry`, so if `/auth/refresh` gets a 401, it would try to refresh again, causing an infinite recursive loop before eventually hitting the catch.

**Fix:** Set `original._retry = true` and also skip the interceptor for refresh requests:
```js
if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/refresh')) {
```

---

**[MED-2]** `frontend/src/stores/auth.js` — `logout()`  
**`logout()` is not `async` but calls `api.post('/auth/logout').catch(() => {})` fire-and-forget.**

If the logout request is in-flight when the user navigates, the request may be cancelled. The refresh token cookie may not be invalidated on the server. The user appears logged out client-side but the refresh token remains valid on the server until it expires naturally.

**Recommendation:** Either await the logout request or ensure the server-side refresh token TTL is short enough that this is acceptable.

---

**[MED-3]** `frontend/src/router/index.js` — route ordering  
**Static guest sub-routes defined AFTER dynamic `:id` route.**

```js
{ path: 'guests/:id',      name: 'GuestCard',   ... },
{ path: 'guests/import',   name: 'GuestImport', ... },
{ path: 'guests/stats',    name: 'GuestStats',  ... },
```

Vue Router 4 uses a scoring algorithm that gives static segments higher priority than dynamic ones regardless of declaration order. So `guests/import` correctly beats `guests/:id`. **However**, this is non-obvious to developers and can cause confusion. Convention is to declare static routes before dynamic ones.

---

**[MED-4]** `frontend/src/stores/auth.js` — `init()`, no timeout  
**`api.post('/auth/refresh')` in `init()` has no timeout.**

If the server is down or slow, the `init()` call hangs indefinitely (blocked on the axios request). This keeps `authReady = false`, which combined with HIGH-1 means the entire app shows a blank screen until the request times out (browser default: ~30–60 seconds). Should add an AbortController or axios `timeout` config.

---

### 🟢 LOW (Critical Auth branch)

**[LOW-1]** `backend/src/routes/budget.js` in `feat/fix/critical-auth`  
**Budget routes are a STUB in this branch.**

`feat/fix/critical-auth:backend/src/routes/budget.js` contains only:
```js
// TODO: implement budget routes
export default async function budgetRoutes(app) {
  app.get('/', ...) { return { message: 'budget routes - coming soon' } }
}
```

This is fine if the branch focuses only on auth, but merging this branch to main BEFORE `feat/page/budget-overview` would break budget entirely. Branch ordering must be enforced: budget-overview must merge before or with critical-auth.

**[LOW-2]** `frontend/src/lib/tokenRegistry.js`  
Token in module-level variable `_token` will be shared across all imports. In SSR environments (future Nuxt migration), this would be a cross-request data leak. Not a current issue, but worth documenting.

**[LOW-3]** `frontend/src/router/index.js` — missing route types  
`/rsvp/:token`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token` all point to view files that likely don't exist yet (no commit creates them). Build will fail with dynamic import errors for these routes on navigation.

**[LOW-4]** `backend/src/middleware/validate.js` — `schemas.pagination`  
Defined but never used in any route handler. Dead code.

---

## VERDICT (Critical Auth): 🟡 CONDITIONAL APPROVE

The core auth fix is correct and complete:
- ✅ tokenRegistry: no localStorage, proper in-memory storage  
- ✅ auth race condition: watch properly resolves, no leak  
- ✅ validate.js error handling: non-ZodError re-thrown  
- ✅ weddingDate: regex fix correct

**However, cannot fully approve due to:**
- HIGH-1: Potential infinite loop in 401 refresh interceptor if `/auth/refresh` itself 401s
- HIGH-3: `updateRsvp` schema missing `'maybe'` — will break RSVP updates
- HIGH-4: `createGuest` schema missing `side` — will silently strip it when middleware is applied
- LOW-1: This branch has stub budget routes — merge order MATTERS

Fix HIGH-3 and HIGH-4 at minimum before merge.

---

## Cross-Branch Summary

| ID | Severity | Branch | Issue |
|----|----------|--------|-------|
| CRIT-1 | CRITICAL | budget-overview | `/budget/expenses` + `/budget/categories` endpoints don't exist |
| CRIT-2 | CRITICAL | budget-overview | `budgetTotal` vs `totalBudget` field name mismatch — donut always 0% |
| CRIT-3 | CRITICAL | budget-overview | `saveTotal()` sends wrong field name — silently zeros budget |
| CRIT-4 | CRITICAL | budget-overview | CategoryView expenses always 404 |
| HIGH-4 (guest) | HIGH | guests-list | Silent delete failure — guest disappears UI but stays in DB |
| HIGH-3 (guest) | HIGH | guests-list | Bulk import: no validation, no limit |
| HIGH-1 (auth) | HIGH | critical-auth | No timeout on authReady watch — blank screen on network failure |
| HIGH-1 (auth) | HIGH | critical-auth | 401 refresh loop if /auth/refresh itself returns 401 |
| HIGH-3 (auth) | HIGH | critical-auth | `updateRsvp` schema missing `'maybe'` |

**Overall: Do not merge any of these branches to main without addressing CRITICAL and HIGH items.**

---

*Report generated by המבקר — read-only review, no changes made.*
