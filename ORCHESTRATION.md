# Wedding App יאללה — Orchestration State

_Last updated: 2026-04-03T03:13Z by Watchdog_

## Status: COMPLETE 🎉
## All 36 pages live. Demo account created. Amitai notified.

---

## Server
- URL: http://187.77.80.103:3001
- PM2: yalla-api (online)
- DB: SQLite (dev.db)
- Repo: https://github.com/wizzo-dev/wedding-app

## Demo Account
- Email: demo@yalla.wedding
- Password: Demo1234
- Couple: אמיתי ומיכל | Wedding: 15/10/2026 | Venue: אולם הגן הקסום, רמת גן

---

## Final Status — ALL DONE ✅

| Milestone | Status | Time |
|-----------|--------|------|
| All 36 pages built | ✅ | ~02:48Z |
| All hamevaker reviews passed | ✅ | ~02:51Z |
| All branches merged to main | ✅ | ~02:51Z |
| Design polish | ✅ | ~02:59Z |
| Demo account created | ✅ | 02:59Z |
| Amitai notified (WhatsApp) | ✅ | 02:59Z |

---

## Incident Log

| Time | Event |
|------|-------|
| 03:13Z | PM2 crash-loop (107+ restarts) — FST_ERR_DUPLICATED_ROUTE on /api/timeline and /api/stats. Fixed: removed duplicate `app.register()` lines in `backend/src/index.js`. Pushed to main. API back online. |

## Design Changes Applied
- Landing: step-connector CSS (pink dashed line), auth redirect guard, feature card hover lift
- AppLayout: pink accent sidebar scrollbar
- Dashboard: quick action hover fill, mobile 375px fix
- Full report: `reports/design-agent-report.md`
