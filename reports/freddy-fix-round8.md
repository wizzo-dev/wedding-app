# Freddy Fix — Round 8 Report
**Date:** 2026-04-03  
**Agent:** freddy-fix  
**Branches touched:** `feat/page/tasks`, `feat/page/vendors-list`

---

## Fixes Applied

### 1. 🔴 CRITICAL — Missing Prisma migration for Task model
**Branch:** `feat/page/tasks`  
**Commit:** `0feedcf`

The `Task` model existed in `prisma/schema.prisma` but no migration file existed for it, meaning the `tasks` table was absent from the database. All task routes would fail with Prisma error P2021.

**Fix:** Ran `prisma migrate dev --name add_tasks` to generate and apply migration `20260403003740_add_tasks`. The migration creates the `tasks` table with all correct columns (`id`, `user_id`, `title`, `description`, `due_date`, `priority`, `status`, `category`, `sort_order`, `created_at`, `updated_at`) plus the foreign key constraint to `users`.

---

### 2. 🟠 HIGH — Seed duplication bug
**Branch:** `feat/page/tasks`  
**Commit:** `0feedcf`  
**File:** `backend/src/routes/tasks.js`

The seed check `if (tasks.length === 0)` ran against the *filtered* query result. A user with tasks but no tasks matching the current filter (e.g., `?status=done`) would get 12 seed tasks inserted again.

**Fix:** Replaced filtered check with an unfiltered total count:
```js
const totalCount = await prisma.task.count({ where: { userId } })
if (totalCount === 0) { /* seed */ }
```

---

### 3. 🟠 HIGH — Store version conflict (vendors-list vs my-vendors)
**Branch:** `feat/page/vendors-list`  
**Commit:** `96295b1`  
**File:** `frontend/src/stores/vendors.js`

`feat/page/vendors-list` shipped an older `vendors.js` store missing `fetchMyVendors`, `updateMyVendor`, `myVendors`, `bookedVendors`, and `totalBudget`. If merged after `feat/page/my-vendors`, it would silently overwrite the extended store and break `MyVendorsView`.

**Fix:** Replaced the vendors-list store with the superset version from `feat/page/my-vendors`, which includes all properties from both branches. Added `computed` import, `myVendors` ref, `totalBudget`/`bookedVendors` computeds, `fetchMyVendors`, and `updateMyVendor` function.

---

### 4. 🟡 MEDIUM — `isOverdue()` logic bug
**Branch:** `feat/page/tasks`  
**Commit:** `0feedcf`  
**File:** `frontend/src/views/app/tasks/TasksView.vue`

`!d.startsWith('done')` checked whether an ISO date string started with the word "done" — always false, making the "done" guard meaningless.

**Fix:**
- Changed function signature from `isOverdue(d)` to `isOverdue(task)`
- Updated template call from `isOverdue(task.dueDate)` to `isOverdue(task)`
- Fixed logic: `task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()`

---

### 5. 🟡 MEDIUM — No enum validation for priority/status
**Branch:** `feat/page/tasks`  
**Commit:** `0feedcf`  
**File:** `backend/src/routes/tasks.js`

POST and PATCH routes accepted any string for `priority` and `status`, allowing invalid values into the database.

**Fix:** Added constants and validation at the top of the file and in both POST and PATCH handlers:
```js
const VALID_PRIORITY = ['low', 'medium', 'high']
const VALID_STATUS   = ['todo', 'in_progress', 'done']
```
Returns `{ statusCode: 400, error: 'Invalid priority/status' }` for invalid values.

> Note: Status values use `todo`/`in_progress`/`done` matching the actual frontend implementation, not the abstract `pending`/`in-progress`/`done` mentioned in the issue report.

---

## Verification

| Branch | Build | Tests |
|--------|-------|-------|
| `feat/page/tasks` | ✅ `npm run build` — 0 errors | tasks table exists in DB |
| `feat/page/vendors-list` | ✅ `npm run build` — 0 errors | store superset confirmed |

- PM2 restarted: `yalla-api` status `online`
- Server responding: `http://187.77.80.103:3001` ✅

---

## Commit Hashes

| Branch | Commit | Description |
|--------|--------|-------------|
| `feat/page/tasks` | `0feedcf` | Migration + seed fix + isOverdue + enum validation |
| `feat/page/vendors-list` | `96295b1` | Vendors store superset merge |
