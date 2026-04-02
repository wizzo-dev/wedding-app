# Wedding App יאללה — Orchestration State

## Status: ACTIVE 🟢
## Amitai: SLEEPING — wants full update at 06:00 Israel time
## Goal: all pages done by morning

---

## Server
- URL: http://187.77.80.103:3001
- PM2: yalla-api (online)
- Redis: localhost:6379
- DB: SQLite (dev.db)
- Repo: https://github.com/wizzo-dev/wedding-app

---

## Pages Status

### ✅ Done & merged to main (7 pages + layout + auth fix):
- AppLayout (sidebar RTL, mobile, countdown)
- Landing page
- Login
- Register
- Dashboard (real Prisma data)
- BudgetOverview
- BudgetCategory
- GuestsList
- Critical Auth Fix (JWT memory-only, race condition, weddingDate)

### 🔧 In fix sprint now:
- feat/fix/budget-api-contract (freddy-fix agent running)
  Fixes: budget endpoints, guests delete/import, auth loop, validation

### ⏳ Pending pages (in order):
1. GuestCard
2. GuestImport (Excel wizard)
3. GuestStats
4. WhatsAppConnect (QR)
5. WaTemplates
6. WaSend
7. WaHistory
8. SeatingMap (Konva canvas drag & drop)
9. HallSettings
10. CardsGallery
11. CardPreview + PDF export
12. GiftsList
13. GiftStats
14. VendorsList
15. VendorDetail
16. MyVendors
17. Tasks + checklist
18. Timeline (wedding day)
19. Settings
20. Account
21. Subscription (premium)
22. RSVP Public (/rsvp/:token + /rsvp/:token/:guestToken)
23. Gift Public (/gift/:token - WhatsApp button only)
24. 404 page

---

## Watchdog Rules (runs every 10 min)
- If freddy-fix is done + pages pending → spawn Freddy for next 4 pages
- If Freddy is done → spawn hamevaker to review new branches
- If hamevaker approves → merge to main, rebuild, spawn Freddy for next batch
- If hamevaker finds CRITICAL → spawn freddy-fix, pause Freddy
- If PM2 down → restart immediately
- DO NOT message Amitai unless: blocker found, or major milestone

## Watchdog: DO NOT spawn multiple Freddy instances
- Only 1 Freddy at a time
- Only 1 hamevaker at a time
- Check subagents(action=list) before spawning

## Design Rules for Freddy:
- ALWAYS use CSS vars: --color-primary #E91E8C, --color-navy #1A1F36
- Heebo font, RTL, Hebrew
- No localStorage for tokens
- Prisma for ALL DB access
- npm run build must pass 0 errors before commit
- pm2 restart yalla-api after backend changes

## Morning Report (04:00 UTC = 06:00 Israel):
- Cron: wedding-morning-report
- Report pages done, server URL, any blockers
- WhatsApp to +972545852206
