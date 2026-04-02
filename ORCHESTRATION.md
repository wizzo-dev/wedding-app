# Wedding App - Orchestration State

## Status: ACTIVE
## Started: 2026-04-02 ~22:00 Israel time
## Amitai: sleeping, wants morning update

## Freddy Session
- Key: agent:main:subagent:ee2f168d-a6fa-4938-b933-ffd2d477b3ab
- Label: freddy
- Task: Build pages one by one, 15min each
- Push branches, create reports

## Pages Queue (ordered)
1. [🔄] AppLayout + Landing - IN PROGRESS
2. [ ] Login + Register
3. [ ] Dashboard
4. [ ] Budget Overview
5. [ ] Budget Category
6. [ ] Guests List
7. [ ] Guest Card + Edit
8. [ ] Guest Import (Excel)
9. [ ] Guest Stats
10. [ ] WhatsApp Connect (QR)
11. [ ] WA Templates
12. [ ] WA Send
13. [ ] WA History
14. [ ] Seating Map (canvas)
15. [ ] Hall Settings
16. [ ] Cards Gallery
17. [ ] Card Preview + PDF
18. [ ] Gifts List + Stats
19. [ ] Vendors List + Detail
20. [ ] My Vendors
21. [ ] Tasks + Timeline
22. [ ] Settings + Account + Subscription
23. [ ] RSVP Public page
24. [ ] Gift Public page (WhatsApp button)
25. [ ] 404

## Server
- URL: http://187.77.80.103:3001
- PM2: yalla-api (online)
- Redis: running on localhost:6379
- DB: SQLite (dev.db)

## Review Process
- After each page: המבקר reviews x2 rounds
- Only after approval → next page
- All reports in: /reports/<page>-report.md

## Morning Report
- Scheduled: 06:00 Israel time (03:00 UTC)
- Deliver to Amitai via WhatsApp
