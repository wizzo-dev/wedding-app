# Design Agent Task — יאללה חתונה

## Mission
Polish the visual design of the app across all key pages. Focus on consistency, delight, and mobile quality. The goal is a production-ready product that looks and feels premium — not a prototype.

## Design System (non-negotiable)
- **Primary:** `#E91E8C` (pink) via `--color-primary`
- **Navy:** `#1A1F36` via `--color-navy`
- **Font:** Heebo (Hebrew-first), weights 400/500/600/700
- **Direction:** RTL, Hebrew text
- **Tokens:** All colors via CSS vars in `frontend/src/assets/styles/main.css`

## Scope of Work

### 1. Global Design Polish (`main.css` + `AppLayout.vue`)
- Ensure sidebar nav items have smooth hover/active states with pink left-border indicator
- Add subtle page-enter transitions (fade + slide up) using Vue `<Transition>`
- Topbar: ensure mobile hamburger menu works, breadcrumb looks clean
- Scrollbar styling for sidebar (thin, pink accent)
- Card shadows: use consistent `box-shadow` tokens

### 2. Landing Page (`LandingView.vue`) — Highest Priority
- Fix the `.step-connector` CSS (missing — add a pink dashed line or gradient connector between the how-it-works steps)
- Add a redirect guard: if user is already logged in (has valid JWT), auto-redirect from `/` to `/app/dashboard`
- Ensure the hero section looks stunning on mobile (320px–768px)
- Feature cards: add subtle lift on hover (`transform: translateY(-4px)`)

### 3. Dashboard (`DashboardView.vue`)
- Ensure stat cards have consistent padding, rounded corners, and shadow
- Quick action buttons: pink outline → fill on hover

### 4. Budget pages
- Progress bars: smooth CSS transitions when values load
- Color-coded category icons render with proper contrast

### 5. Guests pages
- Table rows: zebra striping or subtle hover highlight
- Guest status badges (מגיע / לא מגיע / לא ידוע): distinct colors (green/red/gray)

### 6. Mobile Responsiveness Audit
Walk through these pages at 375px width and fix any obvious overflow/layout breaks:
- Dashboard, GuestsList, BudgetOverview, SeatingMap, LandingView

## Workflow
- Work directly on `main` branch for CSS-only changes (no feature branches needed for pure styling)
- If Vue component changes are needed, use `feat/design/<name>` branches
- `npm run build` must pass 0 errors after each change batch
- `pm2 restart yalla-api` NOT needed (frontend-only changes)
- Commit with prefix `style:` or `fix(design):`
- Push after each logical batch

## Output
- Write a report to `reports/design-agent-report.md` with what was changed and what was skipped (with reasons)
- Update `WORKLOG.md`
- End your final message with exactly: `design-agent: DONE`
