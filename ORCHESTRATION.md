# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-02T22:22Z by Watchdog_

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
| **Freddy** | 🟢 RUNNING (28m+) | CardsGallery ✅, CardPreview 🔧 in progress |
| **freddy-fix** | ✅ DONE + MERGED | feat/fix/wa-schema-and-routes → main (22:15Z) |
| **Hamevaker** | ✅ Round 5 DONE | Reviewed WhatsApp branches — Round 6 pending (when Freddy done) |

---

## Pages Status (17 pushed / ~38 total)

### ✅ Pushed
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
| WhatsAppConnect | feat/page/whatsapp-connect | round5 ⚠️ CRITICAL (schema fixed) |
| WaTemplates | feat/page/wa-templates | round5 ⚠️ CRITICAL (schema fixed) |
| WaSend | feat/page/wa-send | round5 ⚠️ |
| WaHistory | ⚠️ main (direct push!) | round6 🔄 |
| SeatingMap | ⚠️ main (direct push!) | round6 🔄 |
| HallSettings | ⚠️ main (direct push!) | round6 🔄 |

### 🔧 In progress (Freddy, running 28m+)
- CardPreview → `feat/page/card-preview` (ACTIVE as of 22:22Z)

### 📦 Freddy-built, NOT yet merged to main (on feat/page/cards-gallery branch)
- Settings + Account + Subscription (1 commit `7ca88c8`) — pending hamevaker round 6
- Tasks + Timeline (1 commit `f48feb1`) — pending hamevaker round 6
- CardsGallery (`239ed5e`) — pending hamevaker round 6

### ⏳ Pending (after current batch)
GiftsList → GiftStats → VendorsList → VendorDetail → MyVendors → RSVP → GiftPublic → CardsExport → DashboardStats → Notifications → Profile → VendorSuggestions → PaymentStubs → PublicLanding → NotFound

---

## 🚨 Open Issues

### ⚠️ Git Workflow Violation
- WaHistory, SeatingMap, HallSettings committed **directly to main** — violates the "never push to main" rule
- Freddy briefed to use feature branches going forward

### From Round 4 (unresolved):
- **[CRITICAL]** Auth logout doesn't invalidate refresh tokens
- **[CRITICAL]** ImportView calls missing `/guests/preview` + `/guests/import` endpoints
- **[HIGH]** Budget API backend is still a stub
- **[HIGH]** Prisma schema drift across branches
- **[HIGH]** CSV formula injection risk

### From Round 5 (WhatsApp branches):
- **[CRITICAL]** Schema drift on WaTemplate/WaMessage — **partially fixed** (WaTemplate.type added in latest Freddy run)
- **[HIGH]** HTTP 200 on errors in WhatsApp routes
- **[HIGH]** No batch size cap on bulk send
- **[HIGH]** parseInt without NaN guard on template ID routes
- **[MEDIUM]** Hardcoded demo data instead of user settings

---

## Watchdog Rules
- Only 1 Freddy at a time, only 1 hamevaker at a time
- Check subagents(action=list) before spawning
- If Freddy done + pages pending → spawn Freddy for next 3 pages
- If Freddy done → spawn hamevaker-roundN for new branches
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
