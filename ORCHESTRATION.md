# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-02T22:15Z by Watchdog_

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
| **Freddy** | 🟢 RUNNING | WaHistory + SeatingMap + HallSettings |
| **freddy-fix** | ✅ DONE + MERGED | feat/fix/wa-schema-and-routes → main (22:15Z) |
| **Hamevaker** | ✅ Round 5 DONE | Reviewed WhatsApp branches |

---

## Pages Status (14 pushed / ~38 total)

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
| WhatsAppConnect | feat/page/whatsapp-connect | round5 ⚠️ CRITICAL |
| WaTemplates | feat/page/wa-templates | round5 ⚠️ CRITICAL |
| WaSend | feat/page/wa-send | round5 ⚠️ CRITICAL |

| WaHistory | feat/page/wa-history-seating | round6 ⏳ |
| SeatingMap | feat/page/wa-history-seating | round6 ⏳ |
| HallSettings | feat/page/hall-settings | round6 ⏳ |
| CardsGallery | feat/page/card-preview | round6 ⏳ |

### 🔧 In progress (Freddy batch 6, 2026-04-02 22:xx Z)
- Concurrent agents building: Tasks, Timeline, Settings, Vendors, Gifts

### ⏳ Pending
CardPreview → RSVP → GiftPublic → CardsExport → DashboardStats → Notifications → Profile → VendorSuggestions → PaymentStubs → PublicLanding → NotFound

---

## 🚨 Open Issues

### From Round 4 (unresolved):
- **[CRITICAL]** Auth logout doesn't invalidate refresh tokens (cookie path bug)
- **[CRITICAL]** ImportView calls `/guests/preview` + `/guests/import` — backend endpoints missing
- **[HIGH]** Budget API backend is still a stub
- **[HIGH]** Prisma schema drift across branches
- **[HIGH]** CSV formula injection risk on import

### 🔜 Round 6 (pending — when Freddy finishes current batch):
- Settings/Account/Subscription, Tasks/Timeline, CardsGallery, CardPreview — unreviewed
- Also: fix branches feat/fix/budget-api-contract, feat/fix/critical-auth, feat/fix/guests-endpoints (unreviewed, not yet merged)

### From Round 5 (WhatsApp branches):
- ~~**[CRITICAL]** Schema drift — `WaTemplate.type`, `WaMessage.message/results` missing~~ ✅ FIXED in `feat/fix/wa-schema-and-routes`
- ~~**[HIGH]** HTTP 200 returned on 400/404 errors across all WhatsApp routes~~ ✅ FIXED in `feat/fix/wa-schema-and-routes`
- ~~**[HIGH]** No batch size cap on bulk send~~ ✅ FIXED in `feat/fix/wa-schema-and-routes` (cap: 200)
- ~~**[HIGH]** `parseInt` without NaN validation on template ID routes~~ ✅ FIXED in `feat/fix/wa-schema-and-routes`
- ~~**[HIGH]** `/app/whatsapp` UI stub~~ ✅ FIXED in `feat/fix/wa-schema-and-routes` (redirect to /connect)
- **[MEDIUM]** Hardcoded demo data instead of pulling from user settings
- **[MEDIUM]** `/app/whatsapp/history` UI stub (minor, low priority)

### Fix branch — MERGED to main (22:15Z):
- `feat/fix/wa-schema-and-routes` — all 4 CRITICAL + 2 HIGH from Round 5 fixed, build ✅, PM2 restarted ✅
- `feat/page/gifts` — spurious duplicate commit ef16ba3 reverted (1be981a) ✅

---

## Watchdog Rules
- Only 1 Freddy at a time, only 1 hamevaker at a time
- Check subagents(action=list) before spawning anything
- If Freddy done + pages pending → spawn Freddy for next 3 pages
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
