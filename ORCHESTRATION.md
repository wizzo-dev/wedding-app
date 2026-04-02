# ORCHESTRATION.md — Wedding App Build Status

**Last updated:** 2026-04-02T20:41Z (Watchdog check)

---

## 🏗️ Active Agents

| Agent | Status | Runtime | Doing |
|-------|--------|---------|-------|
| **freddy** | ✅ Running | 19m | Building next pages (post-Dashboard) |
| **hamevaker** | ✅ Done (Round 3) | 1m | Reviewed Login / Register / Dashboard |

---

## 📦 PM2

| Service | Status | PID | Uptime | Memory |
|---------|--------|-----|--------|--------|
| yalla-api | ✅ online | 723967 | 20m | 90.4 MB |

---

## 🌿 Git Branches (Remote)

| Branch | Status |
|--------|--------|
| origin/feat/page/app-layout | ✅ Pushed + Merged to main |
| origin/feat/page/landing | ✅ Pushed + Merged to main |
| origin/feat/page/login | ✅ Pushed + Merged to main |
| origin/feat/page/register | ⚠️ Pushed + Merged — but branch HEAD is a STUB (implementation in main, not on branch) |
| origin/feat/page/dashboard | ✅ Pushed + Merged to main |

---

## 📋 Scheduler State (⚠️ STALE)

- `paused: true`, `currentIndex: 2`, `lastCompleted: "Landing"`
- **Reality:** 5 pages built (AppLayout + Landing + Login + Register + Dashboard)
- Scheduler JSON has not been updated since Landing completed — needs resync
- 34 pages remain pending

---

## 🔴 Blockers Found — Hamevaker Round 3

> All branches: REQUEST_CHANGES

### CRITICAL
1. **JWT in localStorage** (auth.js:7,14,18,24) — XSS attack vector. Access token should be memory-only; refresh via httpOnly cookie. Affects ALL authenticated pages.
2. **Auth race condition** (auth.js:10 + router/index.js:62) — Hard refresh on any `/app/*` route redirects to `/login` because `user.value` is null until `fetchMe()` resolves. isLoggedIn computed is false on page load. Breaks all protected routes.
3. **Register branch HEAD is a stub** — `feat/page/register` tip contains 14-line placeholder. Actual implementation was committed on wrong branch (merged to main via app-layout lineage). Branch name is completely misleading.

### HIGH
4. **validate.js swallows non-ZodError exceptions** — middleware `catch` has no re-throw. Any non-Zod error in schema.parse() silently passes through to route handler with unvalidated body.
5. **weddingDate format mismatch** — `<input type="date">` produces `"YYYY-MM-DD"`, Zod expects `datetime()`. Registration with a wedding date fails with 400.
6. **Dashboard stat cards not keyboard accessible** — `<div @click>` with no role/tabindex/keydown. Keyboard and screen reader users cannot use.
7. **RSVP "maybe" status inconsistency** — guests.js allows `maybe`, validate.js rsvpStatus enum rejects it. Guests set to `maybe` via full update can never be updated via RSVP endpoint.

### Cross-cutting (all branches)
- Issues 1, 2, 4, 5 affect every authenticated feature built from now on.

---

## 📊 Pages Progress

| Total | Built | Merged | Pending |
|-------|-------|--------|---------|
| 38 | 5 | 5 | 33 |

Built: AppLayout, Landing, Login, Register, Dashboard

---

## 🔁 Watchdog Actions This Run

- No new spawn needed (Freddy running, PM2 healthy)
- No hamevaker spawn needed (just finished Round 3)
- ⚠️ WhatsApp alert sent to Amitai — CRITICAL blockers in auth architecture

---

## 📝 Next Recommended Actions

1. **Amitai decision needed:** Migrate JWT to memory-only or accept localStorage? Affects all pages.
2. **Fix auth race condition** before building more app pages — broken on hard refresh.
3. **Resync scheduler-state.json** — advance Login/Register/Dashboard to `pushed`.
4. **Fix register branch** — tag correct commit or recreate branch from correct base.
5. **Fix validate.js** — add `else { throw err }` after ZodError check.
6. **Fix weddingDate** — change Zod to `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` or coerce to datetime.
