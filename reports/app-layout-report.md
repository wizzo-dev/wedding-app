# AppLayout - Report

**Branch:** feat/page/app-layout
**Timestamp:** 2026-04-02T20:00Z
**Status:** ✅ Built & Pushed

## Description
Full sidebar navigation layout component for the wedding app. Replaces placeholder topbar layout with a production-grade RTL sidebar.

## Design Decisions
- Dark navy sidebar (`--color-navy`) with pink active accent (`--color-primary`)
- Collapsible on desktop (72px icon-only mode ↔ 260px full)
- Mobile: slides in from right with overlay
- User mini-card with initials avatar and wedding date countdown
- Navigation grouped into 3 sections (ניהול / יום החתונה / תקשורת)
- Page title in topbar reads from route path

## Files Changed
| File | Change |
|------|--------|
| `frontend/src/components/layout/AppLayout.vue` | Complete rewrite (+515 lines) |

## Routes used by AppLayout
All `/app/*` routes use this layout (via router's nested route structure).

## Test URLs
- http://localhost:3001/app/dashboard (auth required)
- Register first: http://localhost:3001/register

## Build Output
- `AppLayout-*.js`: ~5 kB (gzip: ~2 kB)
- Build time: 769ms
- No TypeScript errors, no console warnings
