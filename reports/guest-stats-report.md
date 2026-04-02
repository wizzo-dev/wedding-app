# Guest Stats Report

**Branch:** `feat/page/guest-stats`
**Date:** 2026-04-02T21:55Z
**Status:** ✅ Complete

## Files Changed
- `frontend/src/views/app/guests/StatsView.vue` — full implementation
- Uses existing `GET /api/guests/stats` endpoint

## UI Features (StatsView.vue)

### Big Number Cards (4 cards)
- Total guests + total people
- Confirmed + confirmed people (green card)
- Declined + declined people (red card)
- Pending/maybe (amber card)

### RSVP Pie Chart (CSS-only)
- `conic-gradient()` CSS pie chart with donut hole (box-shadow inset technique)
- Dynamic segments per RSVP status
- Center text: total count + "אורחים" label
- Legend: dot + label + count + horizontal progress bar + pct

### Sides Breakdown
- 3 horizontal bars (חתן/כלה/משותף) with icons
- Color-coded: blue/pink/purple
- Count + percentage

### Gift Totals
- Total ₪ received
- Count of guests with gift
- Average ₪ per gift

### Groups Breakdown
- Auto-assigned emoji icons (hash-based, 8 options)
- Per-group: count + people + mini pink progress bar + percentage
- Responsive grid (auto-fill, min 220px)

## Build
- ✅ 0 errors
- StatsView: 7.2 kB gzip
