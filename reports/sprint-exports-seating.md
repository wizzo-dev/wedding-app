# Sprint Report: XLSX Exports + Konva Seating + Design Polish

**Date:** 2026-04-03  
**Branch:** main (hotfix mode)  
**Status:** ✅ COMPLETE

---

## Feature 1: XLSX Export Endpoints (Backend)

### Files Changed
- `backend/src/utils/export.js` — NEW: shared `buildXlsx(headers, rows, sheetName)` utility using `xlsx` (already installed)
- `backend/src/routes/guests.js` — Added `GET /api/guests/export`
- `backend/src/routes/gifts.js` — Added `GET /api/gifts/export`
- `backend/src/routes/seating.js` — Added `GET /api/seating/export` + `PATCH /tables/:id/position` + `DELETE /assign/:guestId`

### Adaptations from spec
- Gifts export uses actual `Gift` model (`giverName`, `giverPhone`, `amount`, `message`, `status`) — not `guest.giftAmount` (which is a separate field from the Gift tracking system)
- Seating export uses `table.guests` (direct relation via `guest.tableId`) instead of `TableAssignment` model
- `DELETE /assign/:guestId` unassigns by guestId (no separate assignment IDs exposed by existing API)
- `PATCH /tables/:id/position` actually persists to DB via `prisma.table.update`

---

## Feature 2: Export Buttons (Frontend)

### Files Changed
- `frontend/src/views/app/GuestsListView.vue` — Added "📥 ייצא XLSX" button + `exportXlsx()` function
- `frontend/src/views/app/gifts/GiftsView.vue` — Added "📊 ייצא XLSX" button + `exportXlsx()` function  
  (CSV export kept for backward compat)
- `frontend/src/views/app/guests/GuestsView.vue` — Also updated (secondary guests view)

### Implementation
Uses `api.get('/.../export', { responseType: 'blob' })` (axios) for authenticated blob download.

---

## Feature 3: Konva Drag & Drop Seating

### Files Changed
- `frontend/src/main.js` — Added `app.use(VueKonva)` global plugin
- `frontend/src/router/index.js` — Route `seating` now points to `seating/SeatingView.vue` (Konva version)
- `frontend/src/views/app/seating/SeatingView.vue` — Full rewrite with Konva canvas

### Capabilities
- 🖥️ **Konva canvas**: Tables rendered as draggable circles with name + guest count
- 🎯 **Drag & drop**: HTML5 drag from guest list → drop on canvas circle or detail panel drop-zone
- 👆 **Click-to-assign**: Click guest chip to select, then click table on canvas
- 🎨 **Visual feedback**: Tables color-coded (white=empty, green=partial, red=full, pink=hover/selected)
- 📍 **Position persistence**: Table drag positions saved to DB via `PATCH /tables/:id/position`
- 📋 **Detail panel**: Selected table shows guest list with ✕ unassign buttons
- ➕ **Add/Edit/Delete tables**: All modal actions preserved from previous version
- ✨ **Generate tables**: Bulk generation modal preserved
- 📥 **XLSX export**: Export button in header

### Adaptations from spec
- Uses `table.guests` array (not `table.assignments`) to match actual API response
- `removeGuest(guestId)` calls `PUT /assign {guestId, tableId: null}` (no assignmentId needed)
- Preserved all existing SeatingMapView.vue functionality (generate tables, settings link, etc.)

---

## Feature 4: CSS Design System Polish

### Files Changed
- `frontend/src/assets/styles/main.css` — Appended new token aliases and component styles

### Added
- Token aliases: `--color-primary-dark`, `--color-bg-white`, `--color-surface`, `--color-navy-light`, `--space-xs/sm/md/lg/xl/2xl`, `--shadow-md`
- Enhanced `.card` with hover transition
- Global `.form-input` class for consistent input styling across components

---

## Build & Deploy

```
✓ npm run build — 0 errors, 0 warnings
✓ pm2 restart yalla-api — online
✓ git push origin main — 1b823dd
```

Files changed: 12 files, +623 insertions, -253 deletions
