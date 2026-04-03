# 🔍 המבקר - Round 2 Report
**Date:** 2026-04-03  
**Branch:** feat/invitation-builder  
**Score: 9.5 / 10**

---

## ✅ ROUND 1 FIXES — ALL VERIFIED

| Issue | Status |
|-------|--------|
| C1: SeatingMapView not in router | ✅ FIXED — route `seating/map` added |
| C2: WhatsappView not in router | ✅ FIXED — route `whatsapp/overview` added |
| C3: guests/:id before static routes | ✅ FIXED — static routes now first |
| W2: category-card:hover box-shadow | ✅ FIXED — uses border-color now |
| W3: Route ordering convention | ✅ FIXED |

---

## 🚨 CRITICAL ISSUES

### C1: PaymentView.vue has hardcoded box-shadow
**File:** `frontend/src/views/app/PaymentView.vue`  
**Line:** `.plan-card.selected:not(.current) { box-shadow: 0 0 0 3px var(--color-primary-light); }`  
**Severity:** This IS a visible screen in the app (payment/subscription flow).  
**Fix:** Replace with `border: 3px solid var(--color-primary);`

---

## ⚠️ WARNINGS

### W1: CardsView.vue and PreviewView.vue box-shadows
**Files:** `cards/CardsView.vue`, `cards/PreviewView.vue`  
These are canvas-based invitation views with intentional depth shadows. The shadow is technically valid for canvas UI (simulating paper depth). Lower priority.  
**Recommendation:** Change to border if strict design system compliance is needed.

### W2: GuestsView.vue still unrouted
**File:** `frontend/src/views/app/guests/GuestsView.vue`  
A full-featured guest list view with card UI exists but is not accessible from any route. Consider either:
- Adding route `guests/cards` → GuestsView.vue
- Or marking the file as deprecated and eventually removing it  

### W3: SubscriptionView upgrade button lacks `:disabled`
**File:** `frontend/src/views/app/settings/SubscriptionView.vue:150`  
The btn-upgrade opens a modal (`@click="showUpgradeModal = true"`) which is fine, but the modal's confirmation button should be checked for `:disabled` state.  

### W4: `GiftsView.vue` summary-card uses `.card` class with `box-shadow: var(--shadow-sm)`
Since all shadow CSS variables = `none`, this has no visual effect, but semantically inconsistent with the "no shadows" rule.

### W5: `SeatingView.vue` uses raw `fetch()` with manual token — no auto-refresh
**File:** `frontend/src/views/app/seating/SeatingView.vue:404`  
The export API call uses raw `fetch()` with manually injected token. If token is expired, the auth interceptor in `useApi.js` won't trigger a refresh. For blob downloads specifically, this is acceptable since `api.get()` with responseType blob works fine.  
**Recommendation:** Migrate to `api.get('/seating/export', { responseType: 'blob' })`.

---

## ✅ NEW COMPLIANCE CHECKS

| Check | Status |
|-------|--------|
| QR box 24px radius | ✅ `.qr-container { border-radius: var(--radius-xl) }` |
| All input try/catch in InvitationsListView | ✅ All wrapped |
| RsvpLinksView try/catch | ✅ 2 try blocks |
| NotificationsView primary color usage | ✅ Uses var(--color-primary) |
| Backend timeline userId scoping | ✅ All queries scoped to userId |
| Backend register validation | ✅ Uses schema validation preHandler |
| All card hovers now use border not shadow | ✅ Verified |
| Build status | ✅ Clean, no warnings |

---

## 📊 Final Summary

| Category | R1 Score | R2 Score |
|----------|----------|----------|
| Design System | 7/10 | 9/10 |
| Router Completeness | 6/10 | 10/10 |
| Backend Quality | 9/10 | 9/10 |
| Code Quality | 9/10 | 10/10 |
| Build | 10/10 | 10/10 |
| **Total** | **8.5/10** | **9.5/10** |

**Improvement: +1.0 points from Round 1**

Only remaining CRITICAL: PaymentView.vue box-shadow. All other issues are warnings or informational.
