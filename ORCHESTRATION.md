# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-03T01:41Z by Watchdog_

## Status: ACTIVE 🟢
## Goal: all pages done by morning

---

## Server
- URL: http://187.77.80.103:3001
- PM2: yalla-api (online, restarted 01:41Z after Round 8 merges)
- DB: SQLite (dev.db)
- Repo: https://github.com/wizzo-dev/wedding-app

---

## Active Agents
| Agent | Status | Task |
|-------|--------|------|
| **Freddy** | 🟢 RUNNING | Round 9 — Notifications + Profile + VendorSuggestions + PaymentStubs |
| **Hamevaker** | ✅ Round 7 DONE | VERDICT: CRITICAL — 8 criticals found + fixed |
| **freddy-fix** | ✅ Round 9 DONE | Fixed all Round 7 criticals across 4 branches |

---

## Pages Status (33 pushed / ~38 total)

### ✅ Pushed & merged to main
| Page | Branch | Hamevaker |
|------|--------|-----------|
| AppLayout | feat/page/app-layout | round1 ✅ |
| Landing | feat/page/landing | round1 ✅ |
| Login | feat/page/login | round3 ✅ |
| Register | feat/page/register | round3 ✅ |
| Dashboard | feat/page/dashboard | round3 ✅ |
| BudgetOverview | feat/page/budget-overview | round4 ⚠️ |
| BudgetCategory | feat/page/budget-overview | round4 ⚠️ |
| GuestsList | feat/page/guests-list-new | round4 ⚠️ |
| GuestCard | feat/page/guest-card | round4 ✅ |
| GuestImport | feat/page/guest-import | round4 ⚠️ |
| GuestStats | feat/page/guest-stats | round4 ✅ |
| WhatsAppConnect | feat/page/whatsapp-connect | round5 → fixed ✅ |
| WaTemplates | feat/page/wa-templates | round5 → fixed ✅ |
| WaSend | feat/page/wa-send | round5 → fixed ✅ |
| WaHistory | feat/page/wa-history | round6 ✅ |
| SeatingMap | (merged to main) | round6 ✅ |
| HallSettings | feat/page/hall-settings | round6 ✅ |
| CardsGallery | feat/page/cards-gallery | round6 ✅ |
| CardPreview | feat/page/card-preview | round6 ⚠️ WARN |
| GiftsList | feat/page/gifts-list | round6 ✅ |
| GiftStats | feat/page/gift-stats | round6 ✅ |
| VendorsList | feat/page/vendors-list | round6 ✅ (freddy-fix: store superset) |
| VendorDetail | feat/page/vendor-detail | round6 ✅ |
| MyVendors | feat/page/my-vendors | round6 ✅ |
| Tasks | feat/page/tasks | round6 ✅ (freddy-fix: migration + seed + isOverdue) |
| Timeline | feat/page/timeline | pending hamevaker |
| Settings | feat/page/settings | pending hamevaker |
| Account | feat/page/account | pending hamevaker |
| Subscription | feat/page/subscription | pending hamevaker |
| RSVP | feat/page/rsvp | round7 → fixed ✅ merged |
| GiftPublic | feat/page/gift-public | round7 → fixed ✅ merged |
| CardsExport | feat/page/cards-export | round7 → fixed ✅ merged |
| DashboardStats | feat/page/dashboard-stats | round7 → fixed ✅ merged |

### 🔧 In progress (Freddy Round 9, spawned 01:41Z)
- Notifications → `feat/page/notifications`
- Profile → `feat/page/profile`
- VendorSuggestions → `feat/page/vendor-suggestions`
- PaymentStubs → `feat/page/payment-stubs`

### ⏳ Pending (final batch)
PublicLanding → NotFound

---

## 🚨 Open Issues

### From Round 4 (unresolved):
- **[CRITICAL]** Auth logout doesn't invalidate refresh tokens (cookie path bug)
- **[HIGH]** Budget API backend is still a stub
- **[HIGH]** CSV formula injection risk

### Resolved in Round 7 → freddy-fix Round 9 ✅ ALL FIXED:
- Task model schema conflict (done Boolean vs status String) → standardized to status String
- mealPref + rsvpMessage Guest migration → proper migration added
- Bulk import rate limit/validation stripped → restored
- GiftWish model missing → added to schema + migration
- Bank details exposed unauthenticated → guestToken protection added
- onMounted creates orphaned CardExport rows → fixed to POST /start trigger
- RSVP/GiftPublic/CardsExport stubs on wrong branches → deleted
- useApi.js /auth/refresh infinite loop guard → restored on all 4 branches
- Cards download JWT bypass → axios blob fetch + anchor click

---

## Watchdog Rules
- Only 1 Freddy at a time, only 1 hamevaker at a time
- Check subagents(action=list) before spawning anything
- If Freddy done + pages pending → spawn Freddy for next 4 pages
- If Freddy done → spawn hamevaker-roundN for new branches
- If hamevaker found CRITICALs → spawn freddy-fix
- If PM2 down → restart immediately
- Message Amitai on: all-pages-done, design-done, demo-ready, blocker

## Morning Report
- Cron: wedding-morning-report / 04:00 UTC (06:00 Israel)
- WhatsApp to +972545852206

## Design Rules
- CSS vars: --color-primary #E91E8C, --color-navy #1A1F36
- Heebo font, RTL, Hebrew
- No localStorage for tokens
- Prisma for ALL DB access
- `npm run build` must pass 0 errors before commit
- `pm2 restart yalla-api` after backend changes
- **NEVER push directly to main — always use feat/page/<name> branches**
- **git worktree recommended for multi-agent workflows** (noted by Freddy Round 8)
