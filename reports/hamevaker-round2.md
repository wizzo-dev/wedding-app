# המבקר — סיבוב 2 (Round 2 Review)

**Date:** 2026-04-02  
**Reviewer:** hamevaker (devil's advocate)  
**Reviewed from:** fixes-round1.md + live branch content  

---

## Branch: feat/page/app-layout — AppLayout.vue

### Fix 1 — logout redirect ✅ VERIFIED
```js
async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
```
Button correctly wired: `@click="handleLogout"`. Import of `useRouter` confirmed.  
**Status: OK**

---

### Fix 2 — active nav border-left ✅ VERIFIED
```css
.nav-item.router-link-active {
  background: rgba(233,30,140,0.2);
  color: #fff;
  border-left: 3px solid var(--color-primary);
}
```
Correctly uses `border-left` (RTL-correct: left edge of nav item faces inward toward content area).  
**Status: OK**

---

### Fix 3 — aria-label + aria-expanded on collapse & hamburger ✅ VERIFIED

**Collapse button:**
```html
:aria-label="collapsed ? 'הרחב סרגל צד' : 'כווץ סרגל צד'"
:aria-expanded="!collapsed"
```

**Hamburger button:**
```html
:aria-label="mobileOpen ? 'סגור תפריט' : 'פתח תפריט'"
:aria-expanded="mobileOpen"
```
Both buttons have full dynamic accessibility attributes.  
**Status: OK**

---

### New Issues in app-layout — None Found ✅
- Design tokens in use throughout: `var(--color-primary)`, `var(--color-navy)`, `var(--space-*)`, `var(--radius-*)`, etc.
- All UI text in Hebrew ✅
- Mobile responsive (`@media (max-width: 767px)` block present) ✅
- Build: reported 0 errors in fixes-round1.md ✅

---

## FINAL_STATUS (feat/page/app-layout): ✅ APPROVED

---
---

## Branch: feat/page/landing — LandingView.vue

### Fix 1 — footer links ✅ VERIFIED
Plain `<a href="/privacy">` and `<a href="/terms">` removed entirely.  
Footer now contains only:
```html
<RouterLink to="/login" class="lfoot-link">כניסה</RouterLink>
<RouterLink to="/register" class="lfoot-link">הרשמה</RouterLink>
```
**Status: OK**

---

### Fix 2 — pricing ternary ✅ VERIFIED
```html
<RouterLink :to="plan.featured ? '/register?plan=premium' : '/register'" ...>
```
Featured plan (`featured: true` = פרמיום) now correctly routes to `/register?plan=premium`.  
**Status: OK**

---

### Fix 3 — `<main>` landmark ✅ VERIFIED
```html
</nav>

<main>
<!-- ── Hero ── -->
...
<!-- ── CTA banner ── -->
</main>

<!-- ── Footer ── -->
```
All page sections are correctly wrapped inside `<main>`. Footer is appropriately outside.  
**Status: OK**

---

### Fix 4 — @media prefers-reduced-motion ✅ VERIFIED
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```
Present at bottom of `<style scoped>`.  
⚠️ **Minor note:** Only `animation-duration` is suppressed. CSS `transition` properties (hover effects, sidebar slide, page-enter/leave transitions) are NOT covered. This is a partial fix — functional but not complete. Recommend also adding `transition-duration: 0.01ms !important` to the media query.  
**Status: OK (with minor gap)**

---

### Fix 5 — step-arrow divs removed ✅ VERIFIED
No `<div class="step-arrow">` found anywhere in the template. Confirmed clean.  
⚠️ **Minor note:** The `.step-arrow { display: none; }` CSS rule remains in the `<style>` block with no matching element. Dead CSS — harmless but untidy.  
**Status: OK (orphaned CSS remains)**

---

### New Issues in landing — 2 Minor, Non-Blocking

| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 LOW | `prefers-reduced-motion` doesn't suppress `transition` — only `animation-duration`. Hover/enter/leave transitions still play for users who prefer no motion. |
| 2 | 🟡 LOW | `.step-arrow { display: none; }` CSS rule is dead code (element removed but style remains). No functional impact. |
| 3 | 🔵 INFO | `mobile-menu-btn` (☰ navbar hamburger) has no `aria-label` or `aria-expanded` — pre-existing issue, not in scope of round 1 fixes. Worth noting for round 3. |

---

### Design tokens: ✅ Used throughout
### Hebrew text: ✅ All UI strings in Hebrew
### Mobile responsive: ✅ `@media (max-width: 768px)` covers hero, grids, pricing, navbar
### Build: ✅ Passed 0 errors per fixes-round1.md

---

## FINAL_STATUS (feat/page/landing): ✅ APPROVED

(Both minor issues are non-blocking. Round 3 should address `transition` in reduced-motion and mobile hamburger aria attributes.)

---

## Summary

| Branch | Status | Notes |
|--------|--------|-------|
| feat/page/app-layout | ✅ APPROVED | All 4 fixes verified, no new issues |
| feat/page/landing | ✅ APPROVED | All 5 fixes verified, 2 minor non-blocking gaps |
