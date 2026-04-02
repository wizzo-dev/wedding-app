# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-02T23:42Z by Watchdog_

## Status: ACTIVE 🟢
## Goal: all pages done by morning

---

## Server
- URL: http://187.77.80.103:3001
- PM2: yalla-api (online)
- DB: SQLite (dev.db)
- Repo: https://github.com/wizzo-dev/wedding-app

---

## Active Agents
| Agent | Status | Task |
|-------|--------|------|
| **Freddy** | 🟢 SPAWNING | Timeline + Settings + Account + Subscription |
| **Hamevaker** | ✅ Round 6 DONE | No CRITICALs — all recent branches PASS |

---

## Pages Status (25 pushed / ~38 total)

### ✅ Pushed branches
| Page | Branch | Hamevaker |
|------|--------|-----------|
| AppLayout | feat/page/app-layout | round1 ✅ |
| Landing | feat/page/landing | round1 ✅ |
| Login | feat/page/login | round3 ✅ |
| Register | feat/page/register | round3 ✅ |
| Dashboard | feat/page/dashboard | round3 ✅ |
| BudgetOverview | feat/page/budget-overview | round4 ⚠️ CRITICAL |
| BudgetCategory | feat/page/budget-overview | round4 ⚠️ CRITICAL |
| GuestsList | feat/page/guests-list-new | round4 ⚠️ HIGH |
| GuestCard | feat/page/guest-card | round4 ✅ |
| GuestImport | feat/page/guest-import | round4 ⚠️ CRITICAL |
| GuestStats | feat/page/guest-stats | round4 ✅ |
| WhatsAppConnect | feat/page/whatsapp-connect | round5 → fixed ✅ |
| WaTemplates | feat/page/wa-templates | round5 → fixed ✅ |
| WaSend | feat/page/wa-send | round5 → fixed ✅ |
| WaHistory | feat/page/wa-history | round6 ✅ |
| SeatingMap | (merged to main) | round6 ✅ |
| HallSettings | feat/page/hall-settings | round6 ✅ |
| CardsGallery | feat/page/cards-gallery | round6 ✅ |
| CardPreview | feat/page/card-preview | round6 ⚠️ WARN (transient build, rebuilt clean) |
| GiftsList | feat/page/gifts-list | round6 ✅ |
| GiftStats | feat/page/gift-stats | round6 ✅ |
| VendorsList | feat/page/vendors-list | round6 ✅ |
| VendorDetail | feat/page/vendor-detail | round6 ✅ |
| MyVendors | feat/page/my-vendors | round6 ✅ |
| Tasks | feat/page/tasks | round6 ✅ |

### 🔧 In progress (Freddy, spawned 23:42Z)
- Timeline → `feat/page/timeline`
- Settings → `feat/page/settings`
- Account → `feat/page/account`
- Subscription → `feat/page/subscription`

### ⏳ Pending (after current batch)
RSVP → GiftPublic → CardsExport → DashboardStats → Notifications → Profile → VendorSuggestions → PaymentStubs → PublicLanding → NotFound

---

## 🚨 Open Issues

### From Round 4 (unresolved — pre-freddy-fix):
- **[CRITICAL]** Auth logout doesn't invalidate refresh tokens (cookie path bug)
- **[CRITICAL]** ImportView calls `/guests/preview` + `/guests/import` — backend endpoints missing
- **[HIGH]** Budget API backend is still a stub
- **[HIGH]** Prisma schema drift across branches
- **[HIGH]** CSV formula injection risk on import

### From Round 5 — ALL FIXED in `feat/fix/wa-schema-and-routes` (merged 22:15Z) ✅

### From Round 6 (no CRITICALs):
- **[WARN]** CardPreview build transient failure — rebuilt clean, recommend CI re-run
- **[WARN]** feat/page/vendors build transient install error — rebuilt clean
- Visual/RTL smoke test recommended: VendorsView, CardPreview, GiftsView, MyVendors

### Freddy build quality note:
- Round 23:24Z — VendorsList/Detail/MyVendors/Tasks were placeholder stubs. Real implementation still needed.
- Two branch divergences detected by Freddy (my-vendors, vendor-detail): local branches diverged from remote — needs reconcile before merge.

---

## Watchdog Rules
- Only 1 Freddy at a time, only 1 hamevaker at a time
- Check subagents(action=list) before spawning anything
- If Freddy done + pages pending → spawn Freddy for next 4 pages
- If Freddy done → spawn hamevaker-roundN for new branches
- If PM2 down → restart immediately
- Message Amitai only on: new batch complete, blocker found, or PM2 crash

## Morning Report
- Cron: wedding-morning-report
- Target: 04:00 UTC (06:00 Israel)
- WhatsApp to +972545852206

## Design Rules
- CSS vars: --color-primary #E91E8C, --color-navy #1A1F36
- Heebo font, RTL, Hebrew
- No localStorage for tokens
- Prisma for ALL DB access
- `npm run build` must pass 0 errors before commit
- `pm2 restart yalla-api` after backend changes
