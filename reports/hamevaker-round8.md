# Hamevaker Round 8
**Reviewer:** המבקר (Critical Code Review — Devil's Advocate)
**Date:** 2026-04-03
**Branches reviewed:** feat/page/vendors-list · feat/page/vendor-detail · feat/page/my-vendors · feat/page/tasks

---

## Branch: feat/page/vendors-list
**Commit:** 814e971 — VendorsView.vue + frontend/src/stores/vendors.js

### Issues

- [MEDIUM] **Misleading remove-button label** — When `vendor.myStatus` is truthy the button renders "✓ שמור" ("Save"), but clicking it *removes* the vendor from the user's list. The label should be "❤️ שמור" or "הסר". Causes user confusion and potential accidental removal. (`VendorsView.vue:100`)

- [MEDIUM] **Redundant fetch on remove** — `removeVendor()` fires a separate `GET /vendors/${vendor.id}` call solely to obtain `myVendor.id`. The list-endpoint `/api/vendors` already enriches each vendor with `myStatus` but *not* the userVendor row ID, creating a forced double-fetch on every remove click. Fix: add `myVendorId` to the list response (backend: `vendors.js` GET `/`, store: surface it in `vendors.value`). (`VendorsView.vue:117-127` + `backend/src/routes/vendors.js` GET `/`)

- [LOW] **Silent error on add/remove** — `addVendor()` and `removeVendor()` do not catch errors from `store.addToMyList` / `store.removeFromMyList` and display no feedback if the API call fails. User sees nothing. (`VendorsView.vue:131-145`)

- [WARN] **Category icons/gradients hardcoded in component** — `CAT_ICONS` and `CAT_GRADIENTS` are duplicated verbatim in VendorsView, VendorView, and MyVendorsView. Should be extracted to a shared `useVendorUtils.js` composable. Not a bug but a DRY violation that will cause maintenance pain. (3 files)

### Build
✅ `npm run build` passes (766ms)

### Security
✅ No localStorage token usage  
✅ Auth delegated to `app.authenticate` preHandler server-side  
✅ No XSS vectors in this view (vendor data is system-seeded, not user HTML input)

### RTL / Design
✅ `dir="rtl"` on root  
✅ `--color-primary`, `--color-navy`, `font-family: var(--font)` (Heebo) used  
✅ Responsive grid, mobile breakpoint at 640px

### Summary
- CRITICALs: 0
- HIGHs: 0
- MEDIUMs: 2
- LOWs: 1
- WARNs: 1
- **Verdict: APPROVED (minor fixes recommended)**

---

## Branch: feat/page/vendor-detail
**Commit:** 479d550 — VendorView.vue + frontend/src/stores/vendors.js

### Issues

- [MEDIUM] **Silent API errors in action handlers** — `addToList()`, `updateVendor()`, and `removeFromList()` have no `catch` block. If the API returns an error, the UI shows no feedback. `actionLoading` resets, `confirmRemove` clears, but the user doesn't know the operation failed. (`VendorView.vue` — script section, async functions)

- [LOW] **XSS via `vendor.website` href** — `<a :href="vendor.website">` renders whatever URL is stored on the vendor. If a vendor admin could set `website = "javascript:alert(1)"`, this would execute. Currently the only write path is Prisma seed data (safe), but if any future admin panel allows setting `website`, this becomes a stored XSS. Recommend sanitizing with a `safeUrl()` helper that strips non-http(s) schemes. (`VendorView.vue:~61`)

- [LOW] **`rel="noopener"` but no `noreferrer`** — External link has `rel="noopener"` but misses `noreferrer`. Combined `rel="noopener noreferrer"` is the correct defence for external links. (`VendorView.vue:~63`)

- [WARN] **`myVendor.id` used without guard after `addToList` failure** — After `addToList`, if the response unexpectedly omits `id`, subsequent `updateVendor` / `removeFromList` calls would use `undefined` as the record ID. Low risk given the backend always returns the full row, but defensive check is missing. (`VendorView.vue:~addToList`)

### Build
✅ `npm run build` passes

### Security
✅ No localStorage  
✅ All mutations gated behind authenticated endpoints  
✅ Authorization check in backend: PATCH/DELETE `/vendors/user/:id` verifies `userId` ownership before updating

### RTL / Design
✅ `dir="rtl"`, Heebo via CSS var, color system correct  
✅ Modal accessible (backdrop click closes)

### Summary
- CRITICALs: 0
- HIGHs: 0
- MEDIUMs: 1
- LOWs: 2
- WARNs: 1
- **Verdict: APPROVED (minor fixes recommended)**

---

## Branch: feat/page/my-vendors
**Commit:** 75c4908 — MyVendorsView.vue + extended vendors store

### Issues

- [HIGH] **Merge-order dependency: store version must be my-vendors, not vendors-list** — `feat/page/vendors-list` ships an *older* version of `frontend/src/stores/vendors.js` that is missing: `myVendors`, `fetchMyVendors()`, `updateMyVendor()`, `bookedVendors`, `totalBudget`. If `feat/page/vendors-list` is merged to main *after* `feat/page/my-vendors`, it will overwrite the extended store and **break MyVendorsView entirely** (all calls to those methods would throw at runtime). Merge order must be enforced: vendors-list → my-vendors. Ideally the extended store lives in its own PR/file. (`frontend/src/stores/vendors.js` diff between the two branches)

- [MEDIUM] **Silent error on `changeStatus`** — `changeStatus()` has an empty `catch {}` block. If the PATCH call fails (e.g. network error), the dropdown visually resets but no error is shown to the user. (`MyVendorsView.vue:~changeStatus`)

- [LOW] **`formatPrice(n)` with null/0 input** — `formatPrice(0)` returns `₪0` which may display on stat card if no price was agreed. Cosmetically confusing ("₪0 total budget" vs "no price set"). Should display `—` or hide when `null`. (`MyVendorsView.vue:~formatPrice`)

- [WARN] **`countByStatus` scans the full array on every render** — Called in `v-for` on the tab list; no memoization. For typical wedding (5-20 vendors) this is fine, but worth noting as a reactive performance anti-pattern if the list grows. (`MyVendorsView.vue:~countByStatus`)

### Build
✅ `npm run build` passes (on its own branch)

### Security
✅ No localStorage  
✅ `removeFromMyList` / `updateMyVendor` hit authenticated, ownership-verified backend endpoints  
✅ No user HTML rendered

### RTL / Design
✅ `dir="rtl"`, Heebo, CSS vars  
✅ Stats row, filter tabs, empty states all clean  
✅ Inline status `<select>` + modal edit — good UX pattern

### Summary
- CRITICALs: 0
- HIGHs: 1 (merge-order hazard — data loss if merged wrong order)
- MEDIUMs: 1
- LOWs: 1
- WARNs: 1
- **Verdict: NEEDS_FIXES — HIGH must be resolved before merge (enforce merge order or separate the store into its own PR)**

---

## Branch: feat/page/tasks
**Commit:** 8b94fac — TasksView.vue + backend/src/routes/tasks.js + Prisma Task model

### Issues

- [CRITICAL] **Missing Prisma migration for Task model** — `backend/prisma/schema.prisma` defines `model Task` and the `tasks` relation on `User`, but **no migration file exists** for it. All three existing migrations (`20260402194228_init`, `20260402204555_add_guest_side`, `20260402205126_add_guest_side`) contain zero references to `tasks`. Without a migration, the `tasks` table does not exist in the production database. Every `/api/tasks` route will throw a Prisma `P2021 – table does not exist` error on first request. **Must run `prisma migrate dev --name add_tasks` before merging.** (`backend/prisma/schema.prisma`, `backend/prisma/migrations/`)

- [HIGH] **Seed-on-filtered-empty causes duplicate task insertion** — The GET `/api/tasks` handler applies `status`, `category`, `priority` query filters to the `where` clause *before* checking `tasks.length === 0` to decide whether to seed. If a user already has tasks but queries with a filter returning 0 results (e.g. `GET /api/tasks?status=done` when none are done), the backend inserts 12 seed tasks again — duplicating the user's task list on every filtered-empty request.  
  Fix: replace `tasks.length === 0` with `await prisma.task.count({ where: { userId } }) === 0`.  
  (`backend/src/routes/tasks.js:31-38`)

- [MEDIUM] **No enum validation for `priority` and `status` fields** — POST and PATCH `/api/tasks` accept any string for `priority` and `status`. Values like `"critical"` or `"pending"` will be silently stored and later break frontend status mapping. Add validation:
  ```js
  const VALID_PRIORITY = ['low', 'medium', 'high']
  const VALID_STATUS   = ['todo', 'in_progress', 'done']
  if (priority && !VALID_PRIORITY.includes(priority)) return { statusCode: 400, error: 'עדיפות לא תקינה' }
  ```
  (`backend/src/routes/tasks.js` — POST and PATCH handlers)

- [MEDIUM] **`isOverdue` logic bug — checks date string for "done"** — The frontend function `isOverdue(d)` contains:
  ```js
  return d && new Date(d) < new Date() && !d.startsWith('done')
  ```
  `d` is an ISO datetime string like `"2026-04-01T00:00:00.000Z"` — it never starts with `"done"`. The intent was to exclude completed tasks. Fix: pass `task` instead of `task.dueDate` and check `task.status !== 'done'`. As written, all overdue tasks display the red overdue style even when status is `done`. (`TasksView.vue:~isOverdue`)

- [LOW] **`parseInt(NaN)` not guarded in route handlers** — `parseInt(req.params.id)` returns `NaN` for non-numeric IDs (e.g. `/api/tasks/abc`). Prisma will throw an internal error when passed `id: NaN` rather than returning a clean 400. Add: `if (isNaN(id)) return { statusCode: 400, error: 'ID לא תקין' }` after every `parseInt`. Affects GET `/:id`, PATCH `/:id`, DELETE `/:id`. (`backend/src/routes/tasks.js`)

- [LOW] **`PATCH /bulk/reorder` missing result of ownership verification per item** — The bulk reorder uses `prisma.task.updateMany({ where: { id, userId } })` which safely scopes to the user. However, it silently skips items that don't belong to the user (returns count=0) without reporting back which IDs were rejected. Not a security issue (ownership is enforced), but the client has no way to detect a partial failure. (`backend/src/routes/tasks.js:~PATCH /bulk/reorder`)

- [WARN] **Free-text category field creates inconsistency** — The add/edit task modal uses a free-text `<input>` with a `<datalist>` for categories. Users can type arbitrary category names, leading to near-duplicates (`"ספקים"` vs `" ספקים"` with a leading space). Consider a strict `<select>` or server-side normalization (`.trim()`). (`TasksView.vue:~form`)

- [WARN] **No `updatedAt` usage in Prisma PATCH** — The `@@updatedAt` field on the Task model will auto-update correctly via Prisma. No issue, but noting that the PATCH handler reconstructs all fields individually (not using spread). This is fine but verbose. (`backend/src/routes/tasks.js:~PATCH /:id`)

### Prisma Task Model — Analysis
```
model Task {
  id          Int       @id @default(autoincrement()) ✅
  userId      Int       @map("user_id")               ✅
  title       String                                   ✅
  description String?                                  ✅
  dueDate     DateTime? @map("due_date")              ✅
  priority    String    @default("medium")             ⚠️ should be enum
  status      String    @default("todo")               ⚠️ should be enum
  category    String?                                  ✅
  sortOrder   Int       @default(0) @map("sort_order") ✅
  createdAt   DateTime  @default(now()) @map("created_at") ✅
  updatedAt   DateTime  @updatedAt @map("updated_at") ✅
  user User @relation(...)  onDelete: Cascade          ✅
  @@map("tasks")                                       ✅
}
```
Model structure is correct. The `priority` and `status` fields should ideally be Prisma enums (`enum Priority { low medium high }`), but string with app-level validation is acceptable.

### CRUD Routes Completeness
| Endpoint                    | Auth | Status |
|-----------------------------|------|--------|
| GET /api/tasks              | ✅   | ✅     |
| GET /api/tasks/categories   | ✅   | ✅     |
| GET /api/tasks/stats        | ✅   | ✅     |
| GET /api/tasks/:id          | ✅   | ✅     |
| POST /api/tasks             | ✅   | ✅     |
| PATCH /api/tasks/:id        | ✅   | ✅     |
| DELETE /api/tasks/:id       | ✅   | ✅     |
| PATCH /api/tasks/bulk/reorder | ✅ | ✅     |

All routes have `preHandler: [app.authenticate]`. ✅

### Seed Tasks — Analysis
12 tasks covering: תכנון כללי, אורחים, תקציב, ספקים, תכנון יום האירוע. All with valid priority/status defaults. Content is appropriate for a wedding planning app. ✅ (but see HIGH seed-duplication bug)

### Build
✅ `npm run build` passes — TasksView and tasks store compile cleanly

### Security
✅ No localStorage  
✅ All routes authenticated  
✅ Ownership verified before GET/PATCH/DELETE of individual tasks (`findFirst({ where: { id, userId } })`)  
✅ Bulk reorder uses `updateMany({ where: { id, userId } })` — scoped to user  
✅ No raw SQL

### RTL / Design
✅ `dir="rtl"` on root  
✅ Heebo via `font-family: var(--font)`  
✅ `--color-primary` (#E91E8C) used in progress bar, category badges  
✅ `--color-navy` (#1A1F36) used for titles  
✅ Mobile-responsive layout with column stacking at 640px  
✅ Progress bar animation, skeleton loading states, empty states — all present

### Summary
- CRITICALs: 1 (missing migration — tasks table doesn't exist)
- HIGHs: 1 (seed duplication on filtered-empty)
- MEDIUMs: 2 (no enum validation, isOverdue bug)
- LOWs: 2 (parseInt NaN, bulk reorder feedback)
- WARNs: 2
- **Verdict: NEEDS_FIXES — CRITICAL blocker (missing migration) must be resolved before any testing or merging**

---

## Round 8 — Overall Summary

| Branch                    | CRITICALs | HIGHs | MEDIUMs | Verdict          |
|---------------------------|-----------|-------|---------|------------------|
| feat/page/vendors-list    | 0         | 0     | 2       | ✅ APPROVED       |
| feat/page/vendor-detail   | 0         | 0     | 1       | ✅ APPROVED       |
| feat/page/my-vendors      | 0         | 1     | 1       | ⚠️ NEEDS_FIXES   |
| feat/page/tasks           | 1         | 1     | 2       | ❌ NEEDS_FIXES   |

### Top Blockers to Fix Before Merge

1. **[CRITICAL] tasks branch** — Run `prisma migrate dev --name add_tasks` to generate the missing migration. Without this, the entire tasks feature is non-functional in production.

2. **[HIGH] tasks branch** — Fix the seed-on-filtered-empty bug in `GET /api/tasks` (use `count({ where: { userId } })` not `filtered tasks.length === 0`).

3. **[HIGH] my-vendors branch** — Document and enforce the merge order: `vendors-list` must be merged before `my-vendors`. Consider extracting the vendors store extension into a dedicated store update PR to eliminate the overwrite risk.

### Overall Round Verdict: ❌ NEEDS_FIXES
Two branches (tasks, my-vendors) have HIGH+ issues that must be resolved. vendors-list and vendor-detail are clean and can be merged immediately.
