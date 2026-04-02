# Guests List Page Report

**Branch:** `feat/page/guests-list-new`
**Date:** 2026-04-02T21:55Z
**Status:** ✅ Complete

## Files Changed
- `backend/src/routes/guests.js` — added PATCH rsvp, /stats, /import, /preview
- `frontend/src/router/index.js` — updated guests route to GuestsView + fixed route order (import/stats before :id)
- `frontend/src/views/app/guests/GuestsView.vue` — full implementation

## Backend Additions
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/api/guests/:id/rsvp` | Quick RSVP update |
| GET | `/api/guests/stats` | Aggregated stats (sides, groups, gifts) |
| POST | `/api/guests/import` | JSON row import |
| POST | `/api/guests/preview` | xlsx parse → preview (no DB write) |

## UI Features (GuestsView.vue)
- **Stats bar:** 6 clickable chips — total, confirmed, maybe, pending, declined, totalPeople
- **Search:** Real-time client-side search by name/phone/email/group with clear button
- **Side filters:** 3 pills (חתן/כלה/משותף) — combinable with tab filter
- **Tabs:** הכל / מגיעים / לא בטוחים / לא מגיעים / ממתינים with live counts
- **Table columns:** Avatar (color-coded initials), name+email, phone, group chip, side badge, RSVP select (inline update), numPeople, table name, actions
- **RSVP select:** Color-coded inline dropdown (confirmed=green, declined=red, maybe=amber, pending=gray)
- **Row actions:** WhatsApp link, Edit modal, Delete with confirm
- **Add/Edit modal:** All fields (name, phone, email, group, side, rsvp, numPeople, giftAmount, notes)
- **Pagination:** 20/page with prev/next
- **Router fix:** `guests/import` and `guests/stats` placed before `guests/:id` to prevent route clash

## Build
- ✅ 0 errors
- GuestsView: 14.4 kB gzip
