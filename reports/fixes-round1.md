# Fix Round 1 — Applied Changes Report

**Date:** 2026-04-02  
**Agent:** Freddy Fix  
**Branches:** `feat/page/app-layout`, `feat/page/landing`

---

## Branch: feat/page/app-layout
### File: `frontend/src/components/layout/AppLayout.vue`

### Fix 1 — [HIGH] Logout redirect
**Problem:** `@click="auth.logout"` — no redirect after logout  
**Fix:** Added `handleLogout()` async function that calls `await auth.logout()` then `router.push('/login')`  
Also added `useRouter` import.

### Fix 2 — [MEDIUM-RTL] Active nav indicator
**Problem:** `border-right: 3px solid var(--color-primary)` on `.nav-item.router-link-active` — wrong side for RTL  
**Fix:** Changed to `border-left: 3px solid var(--color-primary)`

### Fix 3 — [MEDIUM-A11Y] aria-label + aria-expanded on collapse button
**Problem:** Collapse button had no accessibility attributes  
**Fix:** Added `:aria-label="collapsed ? 'הרחב סרגל צד' : 'כווץ סרגל צד'"` and `:aria-expanded="!collapsed"`

### Fix 4 — [MEDIUM-A11Y] aria-label + aria-expanded on hamburger button
**Problem:** Hamburger menu button had no accessibility attributes  
**Fix:** Added `:aria-label="mobileOpen ? 'סגור תפריט' : 'פתח תפריט'"` and `:aria-expanded="mobileOpen"`

**Commit:** `f01c1e7` — "fix(app-layout): logout redirect, RTL border, aria labels"  
**Pushed:** ✅ origin/feat/page/app-layout

---

## Branch: feat/page/landing
### File: `frontend/src/views/LandingView.vue`

### Fix 1 — [HIGH] Footer links
**Problem:** `<a href="/privacy">` and `<a href="/terms">` use plain `<a>` with no matching Vue routes  
**Fix:** Removed both links entirely (routes /privacy and /terms don't exist in the router). RouterLink to /login and /register remain.

### Fix 2 — [MEDIUM] Pricing ternary
**Problem:** `plan.featured ? '/register' : '/register'` — both branches identical, featured plan didn't distinguish itself  
**Fix:** Changed to `plan.featured ? '/register?plan=premium' : '/register'`

### Fix 3 — [MEDIUM] `<main>` landmark wrapper
**Problem:** Page content lacked semantic landmark for accessibility  
**Fix:** Wrapped all sections between `</nav>` and `<footer>` with `<main>` element

### Fix 4 — [MEDIUM] prefers-reduced-motion
**Problem:** Animations (float, transitions) play regardless of user motion preferences  
**Fix:** Added at bottom of `<style scoped>`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

### Fix 5 — [LOW] Dead code removal
**Problem:** Two `<div class="step-arrow">←</div>` with `display: none` in CSS — unnecessary dead markup  
**Fix:** Removed both divs from the steps-row template

**Commit:** `4be1d21` — "fix(landing): footer links, pricing CTA, main landmark, a11y"  
**Pushed:** ✅ origin/feat/page/landing

---

## Build Verification
**Command:** `cd frontend && npm run build`  
**Result:** ✅ **0 errors** — built in ~434ms  
**Output includes:**
- `AppLayout-D2rGAhWe.js`: 1.41 kB (gzip: 0.73 kB)
- `LandingView-YcdSRTlE.js`: 13.90 kB (gzip: 4.40 kB)
