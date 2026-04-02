# Guest Card Report

**Branch:** `feat/page/guest-card`
**Date:** 2026-04-02T21:55Z
**Status:** ✅ Complete

## Files Changed
- `frontend/src/views/app/guests/GuestView.vue` — full implementation

## UI Features (GuestView.vue)
- **Hero card** (dark navy gradient): large color-coded avatar with initials, full name, side badge, RSVP badge, table badge, contact links (phone, WhatsApp, email)
- **Read mode — 4 info cards:**
  1. Contact: name, phone, email, group
  2. Wedding: side badge, RSVP badge, numPeople, table
  3. Gift/Notes: giftAmount, notes
  4. Quick actions: WhatsApp, call, email, edit buttons + Quick RSVP 4-button grid
- **WhatsApp link:** `wa.me/972...` with leading 0 stripped
- **Edit form (2-col grid):** All fields — name, phone, email, groupName, side, rsvpStatus, numPeople, giftAmount, notes; saves via PUT /api/guests/:id
- **Quick RSVP:** 4 buttons with active state, updates via PATCH /api/guests/:id/rsvp
- **Delete with confirm:** Modal with ⚠️ warning, calls DELETE /api/guests/:id then redirects to list
- **Timestamps:** createdAt / updatedAt displayed
- **Loading skeleton, 404/error state**

## Build
- ✅ 0 errors
- GuestView: 11.9 kB gzip
