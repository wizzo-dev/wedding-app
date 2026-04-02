# המבקר — סיבוב 3 (Round 3 Review)

**Date:** 2026-04-02  
**Reviewer:** המבקר (devil's advocate sub-agent)  
**Round:** 3  
**Branches Reviewed:** feat/page/login · feat/page/register · feat/page/dashboard  
**Policy:** READ ONLY — no edits, no commits, no fixes.

---

## Branch: feat/page/login — LoginView.vue

### Security

**[CRITICAL] JWT accessToken stored in localStorage — XSS vector**  
`localStorage.getItem('access_token')` / `localStorage.setItem('access_token', ...)` appears in 4 places.  
Any XSS payload (injected ad, malicious dependency, Markdown render bug) can steal the token.  
The refresh token is correctly stored as httpOnly cookie — but the access token negates that protection.  
→ `frontend/src/stores/auth.js:7,14,18,24`

**[CRITICAL] Race condition — hard refresh bounces logged-in users to /login**  
```js
const isLoggedIn = computed(() => !!accessToken.value && !!user.value)
```
On page reload, `accessToken.value` is populated from localStorage, but `user.value` is `null` until `fetchMe()` resolves (called in `App.vue:onMounted`).  
The router guard `router.beforeEach` runs BEFORE the component mounts, evaluating `isLoggedIn === false`.  
Result: Any hard refresh or direct navigation to `/app/dashboard` redirects the user to `/login` even with a valid token.  
→ `frontend/src/stores/auth.js:10`, `frontend/src/router/index.js:62`

### Backend

**[HIGH] Validate middleware silently swallows non-ZodError exceptions**  
```js
} catch (err) {
  if (err instanceof z.ZodError) {
    reply.code(400).send({ ... })
  }
  // Non-ZodError falls through: route handler executes with unvalidated body
}
```
If Prisma, a transform, or any other code inside `schema.parse()` throws a non-ZodError exception, it is swallowed. The route handler then executes with the original, unvalidated `req.body`. No `return`, no re-throw.  
→ `backend/src/middleware/validate.js:17-27`

**[MEDIUM] Timing-safe dummy hash uses same BCRYPT_ROUNDS (12) — correct but slow**  
The dummy hash on user-not-found is intentional and correct security practice. No issue here — just confirming it's deliberate.  
→ `backend/src/routes/auth.js:75-77`

### RTL / Hebrew

**[MEDIUM] English placeholder text in Hebrew RTL form**  
`placeholder="your@email.com"` — while the `dir="ltr"` attribute is set on the input (correct for email), the placeholder language is English in an otherwise fully Hebrew UI. Low friction for Hebrew-speaking users but inconsistent.  
→ `frontend/src/views/auth/LoginView.vue:35`

### Accessibility

**[MEDIUM] Clickable submit button missing `aria-busy` during loading**  
The button is `:disabled="loading"` but doesn't announce loading state to screen readers via `aria-busy="true"` or `aria-label` change. The spinner is visual only.  
→ `frontend/src/views/auth/LoginView.vue:57-63`

**[LOW] Error banner transition lacks `aria-live`**  
`role="alert"` is present (good), but the parent `<transition>` wrapper may cause the alert to be missed by some screen readers depending on mount timing. Consider a persistent `aria-live="assertive"` container instead of conditionally rendering.  
→ `frontend/src/views/auth/LoginView.vue:20-24`

### Vue Quality

**[LOW] `onMounted` redirect is correct but has a flash risk**  
If `auth.isLoggedIn` is false on mount (due to the race condition above), the login form renders briefly before the redirect. Combined with the race condition, this creates a flicker.  
→ `frontend/src/views/auth/LoginView.vue:80-84`

### Design Consistency

**[LOW] Decorative side uses `var(--color-navy-mid)` — token is defined ✅**  
Checked `frontend/src/assets/styles/main.css`: `--color-navy-mid: #2D3454` exists. No missing token.  
Design tokens match spec: `--color-primary: #E91E8C`, `--color-navy: #1A1F36`. ✅

### Build Artifacts

No `console.log`, `TODO`, `FIXME`, or `HACK` found in LoginView.vue, auth.js, useApi.js, or validate.js. ✅

**VERDICT: REQUEST_CHANGES**  
Blockers: Two CRITICALs (localStorage JWT + auth race condition) and one HIGH (middleware exception swallow). The login UI itself is polished and well-structured, but the security architecture has fundamental issues that affect every authenticated page.

---

## Branch: feat/page/register — RegisterView.vue

### ⚠️ CRITICAL BRANCH INTEGRITY ISSUE

**[CRITICAL] Branch HEAD is a stub — actual implementation committed on wrong branch**  
The `feat/page/register` branch HEAD (`3b1305d`) contains only a 14-line placeholder:
```vue
<template>
  <div class="view-placeholder fade-in">
    <h1>הרשמה</h1>
    <p style="color:var(--color-text-muted)">בבנייה... 🚧</p>
  </div>
</template>
```
The full register implementation (`commit 53222d4: feat(page): register - split layout, password strength meter, validation, auto-login`) was developed on the `feat/page/app-layout` branch lineage and merged to main via `a9393eb`. The `feat/page/register` branch was **never updated** with this work.

**Git evidence:**
```
git log feat/page/register --oneline
3b1305d chore: add WORKLOG, reports, scheduler-state for AppLayout+Landing
6fe139b infra: setup dev server
b8a2081 design: update token to 10 chars
99bea8a feat: initial project structure
```

The register implementation is in `main` and NOT in `feat/page/register`. The branch name is completely misleading. Any reviewer checking out this branch would see a stub, not the feature.  
→ `git branch feat/page/register` (branch HEAD mismatch)

---

The following findings are for the **actual implementation** (commit `53222d4`) as it exists in `main`:

### Backend / Validation

**[HIGH] weddingDate input sends `"YYYY-MM-DD"` but backend schema expects ISO datetime**  
The form uses `<input type="date">` which produces `"2026-12-25"` (date-only string).  
The backend Zod schema validates:
```js
weddingDate: z.string().datetime().optional()
```
`z.string().datetime()` requires full ISO 8601 datetime (`"2026-12-25T00:00:00.000Z"`). A plain date string fails validation:
```
node: z.string().datetime().parse('2026-12-25') → FAILS: "Invalid datetime"
```
**Result:** Any user who sets a wedding date during registration gets a 400 VALIDATION_ERROR and cannot register. The field is optional, so the workaround is to leave it blank — but that's a silent data loss.  
→ `frontend/src/views/auth/RegisterView.vue` (form input) vs `backend/src/middleware/validate.js:47`

### Legal / UX

**[HIGH] No terms of service or privacy policy acceptance before account creation**  
The register form creates an account with no checkbox, no consent flow. No "I agree to Terms of Service" or "I've read the Privacy Policy". This is a GDPR violation if any EU users are served, and a legal risk generally.  
→ `frontend/src/views/auth/RegisterView.vue` (entire form — missing element)

### RTL / Hebrew

**[MEDIUM] `autocomplete="family-name"` on name2 field is semantically wrong**  
The `name2` field (כלה/bride name) uses `autocomplete="family-name"`. This is incorrect — browsers will autocomplete with the user's last name. Should be `autocomplete="off"` or a custom value.  
→ `frontend/src/views/auth/RegisterView.vue` (name2 input, line ~53 in commit 53222d4)

**[LOW] `placeholder="יוסי"` and `placeholder="מיכל"` — gender-assuming placeholders**  
Placeholders hardcode male/female name examples. If same-sex couples use the app (plausible for a wedding app), the placeholders are exclusionary. Consider neutral alternatives like "שם בן הזוג" / "שם בת הזוג" or abstract names.  
→ `frontend/src/views/auth/RegisterView.vue` (name1 placeholder: "יוסי", name2: "מיכל")

### Vue Quality

**[LOW] `successMsg` shown before redirect — 1200ms delay is jarring if backend is slow**  
```js
successMsg.value = `ברוכים הבאים...`
setTimeout(() => router.push('/app/dashboard'), 1200)
```
If the register API call takes 2s (bcrypt is slow), then 1200ms success flash + redirect creates a disorienting UX. Consider redirect immediately after success or implement a minimum time.  
→ `frontend/src/views/auth/RegisterView.vue` (handleRegister function)

### Build Artifacts

No `console.log`, `TODO`, `FIXME`, or `HACK` in the implementation commit. ✅

**VERDICT: REQUEST_CHANGES**  
The branch itself is broken (stub only) — that alone is grounds for rejection. The implementation in main has a HIGH data bug (weddingDate format) that prevents date-setting during registration.

---

## Branch: feat/page/dashboard — DashboardView.vue

### Accessibility

**[HIGH] Clickable stat cards are `<div>` elements with no keyboard accessibility**  
```html
<div class="stat-card card card-hover" @click="$router.push('/app/guests')">
```
Four stat cards have click handlers but:
- No `role="button"` or `role="link"`
- No `tabindex="0"`
- No `@keydown.enter` / `@keydown.space` handlers
- No `aria-label` describing the action

Keyboard-only users and screen reader users cannot interact with these cards.  
→ `frontend/src/views/app/DashboardView.vue:51,56,61,66` (four stat card divs)

### Data / Logic

**[HIGH] `maybe` rsvpStatus inconsistency between validate.js and guests.js**  
Dashboard displays a "לא בטוחים" (maybe) stat from `data.guests.maybe`.  
Backend guests.js defines: `const RSVP_STATUSES = ['confirmed', 'maybe', 'declined', 'pending']` ✅  
BUT the Zod schema for updateRsvp:
```js
rsvpStatus: z.enum(['pending', 'confirmed', 'declined'])  // no 'maybe'!
```
The RSVP-specific update endpoint rejects `maybe` while the guest create/update endpoints allow it.  
A guest can have `maybe` status (set via create/update), but the RSVP endpoint (e.g., for RSVP landing page updates) cannot set it. The dashboard stat card for "maybe" will only show values set via full guest updates, not RSVP links — a confusing inconsistency.  
→ `backend/src/middleware/validate.js:64`, `backend/src/routes/guests.js:3`

**[MEDIUM] `formatCurrency()` doesn't handle negative budget (overspent)**  
```js
function formatCurrency(amount) {
  if (!amount) return '₪0'
  return '₪' + Math.round(amount).toLocaleString('he-IL')
}
```
When the budget is overspent, `data.budget.remaining` is negative. `!amount` is `false` for `-50000`, so `toLocaleString` is called. The output `₪-50,000` displays with no color, warning class, or negative indicator in the UI. The `budget-pct-danger` class on `budget-pct` is the only warning — the remaining amount itself looks like a normal value.  
→ `frontend/src/views/app/DashboardView.vue` (formatCurrency function + template line ~97)

**[MEDIUM] `item.guestName.charAt(0)` in avatar — no fallback for empty string**  
```js
{{ item.guestName.charAt(0) }}
```
If a guest somehow has an empty name (edge case but possible via direct DB edit or future bug), the avatar shows nothing. No `|| '?'` fallback.  
→ `frontend/src/views/app/DashboardView.vue` (activity-avatar div)

**[MEDIUM] No API request timeout — loading skeleton can be permanent**  
`loadDashboard()` uses `api.get('/dashboard')` with no timeout. If the server hangs or network stalls, the user sees the skeleton loading state indefinitely with no way to recover (except the "נסה שוב" button which would also hang).  
→ `frontend/src/views/app/DashboardView.vue` (loadDashboard function)

### Backend

**[LOW] Dashboard backend has no pagination on activity feed**  
`take: 5` limits recent guests to 5 — this is fine as a hardcoded limit. No issue, but it should be documented.  
→ `backend/src/routes/dashboard.js:40`

**[LOW] `guestCounts.pending` accumulates ALL non-confirmed/declined/maybe statuses**  
```js
else guestCounts.pending += ppl
```
Any unknown rsvpStatus (e.g., future statuses, data corruption) silently falls into `pending`. The dashboard has no indication of "unknown" status guests. Minor but could hide data integrity issues.  
→ `backend/src/routes/dashboard.js:78`

### RTL / Hebrew

**[LOW] Arrow direction in card links is LTR**  
```html
<router-link to="/app/budget" class="card-link">לניהול תקציב ←</router-link>
```
The `←` left arrow is used in an RTL context. In RTL, the "forward" direction is to the left, so `←` might be correct visually — but using `→` or a CSS-based arrow with `dir="rtl"` would be more semantically correct and wouldn't flip unexpectedly in mixed-direction contexts.  
→ `frontend/src/views/app/DashboardView.vue` (card-link text, 2 occurrences)

### Vue Quality

**[LOW] `data.budget.remaining` uses `formatCurrency()` which fails on `null`/`undefined`**  
`!amount` handles null/undefined (returns `₪0`) but the behavior for `amount = 0` (no budget spent, all remaining) also returns `₪0`. This is correct, but a zero remaining budget and a zero-set budget are visually identical. Edge case.  
→ `frontend/src/views/app/DashboardView.vue` (formatCurrency)

### Design Consistency

Design tokens are used correctly (`var(--color-primary)`, `var(--color-navy)`). ✅  
The pink countdown badge gradient (`var(--color-primary)` → `var(--color-primary-hover)`) matches brand spec. ✅  
Skeleton loading state matches overall card structure. ✅

### Build Artifacts

No `console.log`, `TODO`, `FIXME`, or `HACK` in DashboardView.vue or dashboard.js. ✅

**VERDICT: REQUEST_CHANGES**  
Blockers: Two HIGHs (keyboard inaccessible stat cards + rsvpStatus inconsistency). The dashboard UI is the most polished of the three — good loading/error/empty states, real data, and responsive layout — but accessibility is completely broken for keyboard users.

---

## Summary Table

| Branch | CRITICAL | HIGH | MEDIUM | LOW | Verdict |
|--------|----------|------|--------|-----|---------|
| feat/page/login | 2 | 1 | 2 | 2 | REQUEST_CHANGES |
| feat/page/register | 1 (branch) + 1 (impl) | 1 (impl) | 1 | 2 | REQUEST_CHANGES |
| feat/page/dashboard | 0 | 2 | 3 | 3 | REQUEST_CHANGES |
| **Total** | **4** | **4** | **6** | **7** | **All: REQUEST_CHANGES** |

---

## Cross-Cutting Issues (affect all 3 branches)

1. **localStorage JWT** — Every authenticated page is affected. The access token stored in localStorage (`auth.js:7`) is a systemic XSS vulnerability. Should be migrated to memory-only storage with silent token refresh via the existing httpOnly cookie mechanism.

2. **Auth race condition** — The `isLoggedIn` computed depending on both `accessToken` AND `user` causes every protected page to potentially redirect on hard refresh. All three reviewed branches rely on `/app/dashboard` navigation (`router.push('/app/dashboard')`).

3. **validate.js non-ZodError swallow** — Affects ALL backend routes using the `validate()` middleware (login, register, guests, RSVP). A middleware throw that isn't a ZodError silently passes through.

4. **weddingDate format bug** — Also affects the profile/settings update if the same Zod schema is reused. The `type="date"` → `z.string().datetime()` mismatch will silently prevent wedding date from being stored anywhere it's used.

---

*Report generated by המבקר (devil's advocate) — Round 3*  
*READ ONLY. No changes were made to any files.*
