# freddy-fix Round 10 Report

**Date:** 2026-04-03  
**Agent:** freddy-fix  
**Scope:** CRITICAL + HIGH + WARN fixes from hamevaker-round9

---

## Summary

All 5 issues fixed across 4 feature branches. Every branch builds with 0 errors and was pushed to origin. No merges to main.

---

## Fixes

### 🔴 CRITICAL — `feat/page/notifications`: No Migration File

**Problem:** `Notification` model existed in `schema.prisma` but was created via `prisma db push` only — no migration file. CI/prod deployments using `prisma migrate deploy` would fail.

**Fix:**
- Created `backend/prisma/migrations/20260403030000_add_notifications/migration.sql` with proper SQLite DDL:
  ```sql
  CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  ```
- Ran `npx prisma migrate resolve --applied 20260403030000_add_notifications` to mark as applied against the existing dev.db (table already present from `db push`)

**Commit:** `b4a05fc` on `feat/page/notifications`

---

### ⚠️ WARN — `feat/page/notifications`: `v-else"` Template Syntax Error

**Problem:** `NotificationsView.vue` line ~18 had `<span v-else">` — extraneous `"` would cause Vue template compilation warning/error.

**Fix:** `<span v-else">` → `<span v-else>`

**Commit:** `b4a05fc` on `feat/page/notifications` (same commit as migration)

---

### 🔴 HIGH — `feat/page/vendor-suggestions`: Broken "Add to My Vendors" Feature

**Problem:** `addToMyVendors()` called `POST /api/vendors/user` with `{category, name, notes}`, but that route requires a `vendorId` FK to an existing DB vendor. The vendor doesn't exist → always 400. The `catch` block **silently swallowed the error** and showed a success toast anyway. Users saw "נוסף לספקים שלכם! 🎉" but **nothing was saved**.

**Fix:**

Backend (`backend/src/routes/vendorSuggestions.js`):
- Added `POST /suggestions/add` route (accessible at `/api/vendors/suggestions/add`)
- Accepts `{category, name, notes}` — validates both fields present
- Creates a freeform `Vendor` row in the DB, then links it to the user via `UserVendor`
- Returns `201 { success, userVendor, vendor }` on success or `400` with Hebrew error on validation failure

Frontend (`frontend/src/views/app/vendors/VendorSuggestionsView.vue`):
- `addToMyVendors()` now calls `/vendors/suggestions/add`
- Removed the silent catch that faked success
- `catch(err)` now extracts `err.response.data.error` and shows a real **red error toast**
- Added `toastType` ref (`'success'` | `'error'`) and `.toast-error { background: #c0392b }` CSS class

**Commit:** `83c0699` on `feat/page/vendor-suggestions`

---

### 🟡 HIGH — `feat/page/profile`: No Backend Validation on PATCH /api/users/profile

**Problem:** The profile update endpoint accepted any values without validation:
- `profileImageUrl`: could be an arbitrary string of any length
- `name1`/`name2`: no length limits
- `weddingDate`: invalid strings like `"not-a-date"` passed to `new Date()` → `Invalid Date` → Prisma crash with 500

**Fix** (`backend/src/routes/users.js`):
- `name1`/`name2`: if provided and non-null, must be `string` and `≤ 100 chars` → `400 INVALID_NAME`
- `profileImageUrl`: if provided and non-empty, must be `string ≤ 500 chars` and a valid `http://` or `https://` URL → `400 INVALID_URL`
- `weddingDate`: if provided and non-null/non-empty, checked via `new Date(weddingDate)` + `isNaN(d.getTime())` → `400 INVALID_DATE`
- All error messages in Hebrew

**Commit:** `5b0f4d0` on `feat/page/profile`

---

### ⚠️ WARN — `feat/page/payment-stubs`: `console.log` Logging User IDs

**Problem:** The upgrade stub route logged `userId + plan` (and paymentMethod + timestamp) to stdout via `console.log`.

**Fix:** Replaced the entire `console.log(...)` call (7 lines) with `// TODO: payment integration`

**Commit:** `78013b5` on `feat/page/payment-stubs`

---

## Build Results

| Branch | Build | Time |
|--------|-------|------|
| feat/page/notifications | ✅ 0 errors | 883ms |
| feat/page/vendor-suggestions | ✅ 0 errors | 737ms |
| feat/page/profile | ✅ 0 errors | 771ms |
| feat/page/payment-stubs | ✅ 0 errors | 904ms |

---

## Constraints Checklist

- [x] All fixes on existing feature branches (no merges to main)
- [x] `npm run build` passes 0 errors on all branches before commit
- [x] `pm2 restart yalla-api` after all backend changes (vendor-suggestions, profile, payment-stubs)
- [x] Hebrew RTL text preserved
- [x] Prisma used for ALL DB access
- [x] Never pushed to main
- [x] WORKLOG.md updated
- [x] This report written to `reports/freddy-fix-round10.md`
