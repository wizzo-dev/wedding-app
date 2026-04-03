# Freddy Round 9 — Profile

## Branch
`feat/page/profile`

## Date
2026-04-03

## What Was Built

### Backend
- **PATCH /api/users/profile** added to `backend/src/routes/users.js`
  - Updates: name1, name2, weddingDate, venue, venueAddress, profileImageUrl
  - Partial update (undefined fields skipped)
  - Returns updated user profile fields

### Frontend
- **View**: `frontend/src/views/app/ProfileView.vue`
  - Profile card with couple avatar (image or initials)
  - Couple names hero display with wedding date badge
  - Info grid: חתן/כלה names, wedding date, venue, address
  - Inline edit form (toggle)
  - Avatar preview via URL input
  - Image load error handling
  - Sync with `useAuthStore` on save
  - Success/error alerts with auto-dismiss
  - Wedding countdown card (days remaining with gradient number)
  - Loading spinner
- **Router**: `/app/profile` registered as `Profile`
- **AppLayout sidebar**: Added 💍 פרופיל שלנו to ניהול group
- **routeTitles**: Added `'/app/profile': 'הפרופיל שלנו'`

## Build
✅ 0 errors, 0 warnings

## Design
- Hebrew RTL, Heebo font
- Primary pink gradient avatar placeholder
- Large countdown number with pink gradient text
- Clean card layout with info grid
