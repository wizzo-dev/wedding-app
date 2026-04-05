# Final Notes for Freddy — Yalla Wedding App

**Status:** Fixed seating + known bugs to address

---

## 🪑 Seating Fixes (סידורי הושבה)

### Active Issues
1. **Rectangular table setting broken** — toggle not working, need to fix shape logic
2. **Missing square table option** — add as alternative to rect/circle
3. **"Hall Element" placement** — move to same row as "Create Tables" + "Settings" buttons
4. **Hall element duplication in SeatingView** — currently shows 2 chips, should merge into one "Add Element" button with dropdown (Table, Stage, etc.)

### Data Sync
- **Seating cards showing "no guests assigned"** — BAG: contradicts existing RSVP data. Need to query DB correctly and refresh card state after guest assignment.

---

## 📋 Tasks (משימות)

### Bug
- **Modal opening → gray screen (half page)** — fix z-index or modal positioning when new task opens

### Feature Request
- **Timeline auto-populate** — when task is created, add to timeline automatically
- **Timeline ordering** — sort chronologically by date/time (ascending)

---

## 💬 WhatsApp Integration

### Bugs
- **"Add Template" button broken** — returns "not found". Check route `/api/whatsapp/templates` and button logic

---

## 🎨 RSVP Design Column

### Features
1. **"No Thanks" button color** — set red by default, **non-editable** by user (always red)
2. **Consolidate RSVP UI** — create single "Confirmations" column containing:
   - Response links
   - Design customization
   - Status tracking

---

## 💰 Budget → Hall Category

### Feature
- **Price-per-person calculation** — add option to set budget as:
  - Price per guest × estimated final count
  - Show total dynamically

---

## 📊 Dashboard (סקירה כללית)

### Bugs
1. **Events not showing** — "Upcoming Events" section empty despite events existing
2. **Tasks not showing** — "Open Tasks" section empty despite tasks existing
3. **Couple info not syncing** — names & date from Settings not reflecting in Dashboard

---

## 👥 Guest Import

### Feature
- **Mobile contact picker** — access device contacts during import
- **Reduces typos** — auto-fill from phone contacts

---

## 🗂️ RSVP Organization

Currently: "RSVPs" spread across multiple areas
Requested: **Single "Confirmations" (אישורי הגעה) column** consolidating:
- Links
- Design
- Status

---

## ⚠️ Known Stable Areas
- Seating view (Konva) dragging fixed ✅
- Heebo font applied globally ✅
- Sidebar navigation ✅

---

**Amitai's request:** Address these before final shipping. Order of priority: seating bugs > dashboard sync > features.
