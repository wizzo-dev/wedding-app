# Freddy Round 9 — Notifications

## Branch
`feat/page/notifications`

## Date
2026-04-03

## What Was Built

### Backend
- **Prisma model**: `Notification` (id, userId, type, title, body, isRead, createdAt)
  - types: `rsvp_received`, `gift_received`, `task_due`, `system`
  - Added to `User` relation
  - Applied via `prisma db push`
- **Route**: `backend/src/routes/notifications.js`
  - `GET /api/notifications` → list with unreadCount
  - `PATCH /api/notifications/:id/read` → mark single read
  - `PATCH /api/notifications/read-all` → mark all read
  - `POST /api/notifications` → create (dev/testing)
- Registered at `/api/notifications` in `backend/src/index.js`

### Frontend
- **View**: `frontend/src/views/app/NotificationsView.vue`
  - Groups notifications by date (היום, אתמול, full date)
  - Pink dot indicator for unread items
  - Mark-read on click
  - Mark-all-read button showing unread count
  - Empty state with 🔕 icon
  - Loading spinner
  - Error alert
- **AppLayout**: Bell icon 🔔 in topbar with pink animated badge showing unread count
  - Fetches unread count on mount via `GET /api/notifications`
- **Router**: `/app/notifications` registered as `Notifications`
- **routeTitles**: Added `'/app/notifications': 'התראות'`

## Build
✅ 0 errors, 0 warnings

## Design
- Hebrew RTL, Heebo font
- Primary pink #E91E8C badge
- Navy #1A1F36 headers
- Grouped date sections with subtle borders
- Unread gradient background
