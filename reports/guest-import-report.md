# Guest Import Report

**Branch:** `feat/page/guest-import`
**Date:** 2026-04-02T21:55Z
**Status:** ✅ Complete

## Files Changed
- `backend/src/routes/guests.js` — added `/import` (JSON rows) + `/preview` (multipart xlsx parse)
- `frontend/src/views/app/guests/ImportView.vue` — 3-step wizard

## Backend Endpoints
- `POST /api/guests/preview` — multipart, returns `{ headers, preview[0..19], total }`
- `POST /api/guests/import` — JSON `{ rows: [...] }`, auto-maps fields, returns `{ imported, skipped, errors }`

Column mapping for import: supports Hebrew (`שם`, `טלפון`, `מייל`, `קבוצה`, `צד`, `נפשות`, `הערות`) and English field names.

## 3-Step Wizard

### Step 1: Upload
- Drag & drop zone (xlsx/xls/csv, max 5MB)
- Click-to-select fallback
- File type validation
- CSV template download (with BOM for Hebrew)

### Step 2: Column Mapping
- Auto-detects Hebrew/English column names and pre-fills selects
- Manual override per field (required: שם; optional: all others)
- Preview table: first 5 rows of uploaded file
- Total row count displayed

### Step 3: Confirm + Results
- Summary of mappings
- Sends mapped rows as JSON to `/api/guests/import`
- Results: imported count (big green number), skipped count, error list
- "ייבוא נוסף" resets wizard; "לרשימת אורחים" navigates back

## Build
- ✅ 0 errors
- ImportView: 9.8 kB gzip
