# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-03T01:19Z by Watchdog_

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
| **Freddy** | ✅ Round 8 DONE | RSVP + GiftPublic + CardsExport + DashboardStats |
| **Hamevaker** | ✅ Round 7 DONE | VERDICT: CRITICAL — 8 criticals across 4 branches |
| **freddy-fix** | 🟢 RUNNING | Round 9 — fixing Round 7 criticals (spawned 01:19Z) |

---

## Pages Status (29 pushed / ~38 total)

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
| CardPreview | feat/page/card-preview | round6 ⚠️ WARN (transient build, rebuilt clean) |
| GiftsList | feat/page/gifts-list | round6 ✅ |
| GiftStats | feat/page/gift-stats | round6 ✅ |
| VendorsList | feat/page/vendors-list | round6 ✅ (freddy-fix: store superset) |
| VendorDetail | feat/page/vendor-detail | round6 ✅ |
| MyVendors | feat/page/my-vendors | round6 ✅ |
| Tasks | feat/page/tasks | round6 ✅ (freddy-fix: migration + seed + isOverdue) |
| Timeline | feat/page/timeline | round8 — pending hamevaker |
| Settings | feat/page/settings | round8 — pending hamevaker |
| Account | feat/page/account | round8 — pending hamevaker |
| Subscription | feat/page/subscription | round8 — pending hamevaker |

### 🔍 Awaiting freddy-fix Round 9 (criticals found by hamevaker round7)
| Page | Branch | Issues |
|------|--------|--------|
| RSVP | `feat/page/rsvp` | Task schema conflict, missing Guest migration, import regression, useApi/validate regressions |
| GiftPublic | `feat/page/gift-public` | GiftWish model missing, bank details exposed unauthenticated, useApi/validate regressions |
| CardsExport | `feat/page/cards-export` | onMounted creates orphaned rows, download JWT broken, rsvp stubs overwrite risk |
| DashboardStats | `feat/page/dashboard-stats` | Task status conflict, error silencing, useApi/validate regressions |

### ⏳ Pending (next batch — after Round 9 fixes + hamevaker approval)
Notifications → Profile → VendorSuggestions → PaymentStubs → PublicLanding → NotFound

---

## 🚨 Open Issues

### From Round 4 (unresolved — pre-freddy-fix):
- **[CRITICAL]** Auth logout doesn't invalidate refresh tokens (cookie path bug)
- **[HIGH]** Budget API backend is still a stub
- **[HIGH]** CSV formula injection risk

### From Round 7 — Being fixed by freddy-fix Round 9:
- **[CRITICAL]** Task model schema conflict (done Boolean vs status String) — across rsvp + dashboard-stats branches
- **[CRITICAL]** mealPref + rsvpMessage columns missing from migration (db push only, not migrate dev)
- **[CRITICAL]** Bulk import handler stripped of rate limit / phone validation / per-row errors
- **[CRITICAL]** GiftWish model missing from Prisma schema — all giftWish.* calls crash
- **[CRITICAL]** Bank details (bankInfo, bitPhone) exposed to unauthenticated requests
- **[CRITICAL]** onMounted creates orphaned CardExport DB row on every page visit
- **[CRITICAL]** RSVP+GiftPublic+CardsExport stubs on wrong branches — would clobber real impls on merge
- **[CRITICAL]** useApi.js: /auth/refresh infinite-loop guard removed across all 4 branches
- **[HIGH]** Cards download via window.open() bypasses JWT interceptor — always 401
- **[HIGH]** Error silencing (.catch(() => [])) on task groupBy

### freddy-fix Round 8 — DONE (01:02Z):
- ✅ Tasks: Prisma migration added (add_tasks)
- ✅ Tasks: Seed duplication bug fixed
- ✅ Tasks: isOverdue() logic fixed
- ✅ Tasks: Priority/status enum validation added
- ✅ VendorsList: vendors store superset merge
- ✅ feat/fix/guests-endpoints merged to main
- ✅ feat/fix/budget-api-contract cherry-picked (b61502c)

---

## Watchdog Rules
- Only 1 Freddy at a time, only 1 hamevaker at a time
- Check subagents(action=list) before spawning anything
- If Freddy done + pages pending → spawn Freddy for next 4 pages
- If Freddy done → spawn hamevaker-roundN for new branches
- If hamevaker found CRITICALs → spawn freddy-fix
- If PM2 down → restart immediately
- Message Amitai on: new batch complete, blocker, PM2 crash

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
