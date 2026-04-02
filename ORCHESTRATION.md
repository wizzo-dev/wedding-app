# ORCHESTRATION.md — Wedding App Build Status

_Last updated by watchdog: 2026-04-02T21:11Z_

---

## 📊 Current Status: ⚠️ PAUSED — FIXES REQUIRED

**Scheduler:** PAUSED (`paused: true`)  
**Reason:** Hamevaker Round 4 found CRITICAL bugs that must be fixed before new pages are built.  
**PM2 `yalla-api`:** ✅ ONLINE (pid 726554, uptime ~2m, 13 restarts total)  
**Active Subagents:** None (Freddy + Hamevaker both completed)

---

## 🏗️ Pages Completed (7/38 pages + AppLayout + CriticalAuth fix)

| Page | Branch | Status | Hamevaker |
|------|--------|--------|-----------|
| AppLayout | feat/page/app-layout | pushed | round1 ✅ |
| Landing | feat/page/landing | pushed | round1 ✅ |
| Login | feat/page/login | pushed | round3 ✅ |
| Register | feat/page/register | pushed | round3 ✅ |
| Dashboard | feat/page/dashboard | pushed | round3 ✅ |
| BudgetOverview | feat/page/budget-overview | pushed | round4 🔴 CRITICALs |
| BudgetCategory | feat/page/budget-overview | pushed | round4 🔴 CRITICALs |
| GuestsList | feat/page/guests-list | pushed | round4 🟠 HIGHs |
| CriticalAuth fix | feat/fix/critical-auth | pushed | round4 🟡 Conditional |

---

## 🔴 Blocking Issues (from Hamevaker Round 4)

### Budget Pages — CRITICAL (must fix before merge)
1. **CRIT-1:** Frontend calls `/budget/expenses` and `/budget/categories` — endpoints don't exist. Backend uses `/:categoryId/expenses` paths. All write operations → 404.
2. **CRIT-2:** Field name mismatch: frontend reads `totalBudget`/`remaining`, backend sends `budgetTotal`/`totalRemaining`. Donut chart permanently 0%.
3. **CRIT-3:** `saveTotal()` sends `{ totalBudget }`, backend expects `{ budgetTotal }`. Every save zeros the budget.
4. **CRIT-4:** CategoryView fetches expenses via `/budget/expenses?categoryId=` → 404. Expenses list always empty.

### Guests Page — HIGH
- **HIGH-4:** Silent delete failure — guest removed from UI on API error, no re-fetch, user confused.
- **HIGH-3:** Bulk import: no Zod validation, no record limit, can import 10k guests in one shot.

### Critical Auth — HIGH  
- **HIGH-1:** 401 refresh interceptor can infinite-loop if `/auth/refresh` itself returns 401.
- **HIGH-3:** `updateRsvp` schema missing `'maybe'` enum value → RSVP updates for "לא בטוח" rejected.
- **HIGH-4:** `createGuest` schema missing `side` field → field silently stripped when validate middleware applied.

---

## 📋 Hamevaker Review History

| Round | Branches | Verdict |
|-------|----------|---------|
| Round 1 | app-layout, landing | approved (with fixes applied in round 1) |
| Round 2 | app-layout + landing post-fixes | approved |
| Round 3 | login, register, dashboard | reviewed |
| Round 4 | budget-overview, guests-list, critical-auth | 🔴 REQUEST_CHANGES |

---

## 🚦 Watchdog Decision Log

### 2026-04-02T21:11Z
- **Freddy:** Done, not running. Scheduler `paused: true` → **NOT spawned** (paused for approval/fixes)
- **Hamevaker:** Done (round 4 just completed). No new unreviewed branches → **NOT spawned**
- **PM2:** Online ✅ — no restart needed
- **Scheduler state:** Updated — Dashboard + GuestsList were marked pending but are actually pushed
- **Next action:** Freddy needs to spawn a **fix branch** (`feat/fix/budget-api-contract`) to address CRITICALs in budget-overview before building new pages

---

## ⏭️ Next Steps (when Amitai approves)

1. **Fix sprint** (Freddy): Branch `feat/fix/budget-api-contract` — fix all 4 CRITICALs in budget pages + 2 HIGHs in guests + 3 HIGHs in critical-auth
2. **Hamevaker Round 5**: Verify fixes are correct
3. **Resume building**: GuestCard → GuestImport → GuestStats → WhatsApp flow → Seating → ...

---

## 🏗️ Remote Branches (git branch -r | grep feat)

```
origin/feat/fix/critical-auth
origin/feat/page/app-layout
origin/feat/page/budget
origin/feat/page/budget-overview
origin/feat/page/dashboard
origin/feat/page/guests-list
origin/feat/page/landing
origin/feat/page/login
origin/feat/page/register
```
