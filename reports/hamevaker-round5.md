# 🔍 דוח המבקר — Round 5
**תאריך:** 2026-04-02  
**סבב:** Round 5  
**בודק:** המבקר (hamevaker subagent)

---

## סיכום מהיר

| Branch | ציון |
|--------|------|
| feat/page/budget | NEEDS_FIXES |
| feat/page/guests-list-new | NEEDS_FIXES |
| feat/page/guest-card | NEEDS_FIXES |
| feat/page/guest-import | NEEDS_FIXES |
| feat/page/guest-stats | NEEDS_FIXES |

---

## 1. feat/page/budget

### backend/src/routes/budget.js

**✅ SECURITY — כל endpoint מוגן:**
כל 8 endpoints מכילים `preHandler: [app.authenticate]`:
- GET /, PUT /total, POST /categories, PUT /categories/:id, DELETE /categories/:id, POST /expenses, GET /expenses, DELETE /expenses/:id

**✅ PRISMA — אין raw SQL, כל query עם userId:**
- `prisma.user.findUnique({ where: { id: userId } })`
- `prisma.budgetCategory.findMany({ where: { userId } })`
- `prisma.budgetExpense.findFirst({ where: { id, userId } })`
- בדיקת ownership לפני הוספת הוצאה לקטגוריה (שורה ~175)

**⚠️ MEDIUM — אין Zod validation middleware:**
ה-validate.js קיים אבל לא משומש ב-budget.js. ולידציה ידנית בלבד:
```js
if (!name || String(name).trim().length === 0) { ... }
```
`backend/src/routes/budget.js` שורות 81–82, 95–97, 134–136

**🐛 LOW — Dead code: importRateMap / checkImportRateLimit:**
`backend/src/routes/budget.js` שורות 3–13:
```js
const importRateMap = new Map()
function checkImportRateLimit(userId) { ... }
```
אין endpoint של import ב-budget. זה קוד שנשאר בטעות (כנראה copy-paste מ-guests). לא נזק אבל מבלבל.

**✅ ERROR HANDLING:** כל שגיאות backend מחזירות תגובה מובנית עם error code + message בעברית.

---

### frontend/src/views/app/budget/BudgetView.vue

**✅ RTL/Hebrew:** `dir="rtl"` על ה-root div. כל טקסטים בעברית.

**❌ HIGH — Hardcoded colors בכמות גבוהה:**

בתוך `<style scoped>` (BudgetView.vue):
- שורה ~462+: `background: #fff`, `stroke="#e5e7eb"`, `border-top: 3px solid #3b82f6`, `border-top-color: #f59e0b`, `border-top-color: #10b981`, `border-top-color: #ef4444`
- שורות summary-card: `color: #64748b`, `color: #1e293b`, `color: #64748b`
- spinner: `border: 3px solid #e5e7eb; border-top-color: #3b82f6`

בתוך `<template>` (inline legend):
```html
<span class="legend-dot" style="background:#3b82f6"></span>
<span class="legend-dot" style="background:#e5e7eb"></span>
```
שורות ~72–76.

צריך להחליף הכל ב-`var(--color-primary)`, `var(--color-border)` וכו'.

**⚠️ LOW — alert() בשגיאת delete:**
```js
alert(e?.response?.data?.message || 'שגיאה במחיקת קטגוריה')
```
`BudgetView.vue` פונקציה `deleteCategory`, ב-catch. שאר השגיאות מוצגות ב-UI תקין.

**✅ MOBILE:** `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`, `flex-wrap: wrap`

**✅ API CONTRACT:** Frontend קורא `GET /budget`, `PUT /budget/total`, `POST /budget/categories`, `PUT /budget/categories/:id`, `DELETE /budget/categories/:id` — כולם קיימים ב-backend.

**✅ VUE BEST PRACTICES:** `onMounted` בלבד, אין `onUnmounted` נדרש (אין watchers/intervals), אין DOM manipulation ישיר.

---

### frontend/src/views/app/budget/CategoryView.vue

**✅ RTL/Hebrew:** `dir="rtl"`, כל טקסטים בעברית.

**❌ HIGH — Hardcoded colors בכמות גבוהה:**

`<style scoped>` ב-CategoryView.vue:
- `.btn-back { color: #3b82f6 }` שורה ~241
- `.page-title { color: #1e293b }` שורה ~247
- `.spent-badge { background: #fef3c7; color: #92400e }` שורה ~250
- `.alloc-badge { background: #dbeafe; color: #1e40af }` שורה ~251
- `.remaining-badge { background: #d1fae5; color: #065f46 }` שורה ~252
- `.remaining-badge.over { background: #fee2e2; color: #991b1b }` שורה ~253
- `.progress-bar { background: #e5e7eb }` שורה ~257
- `.progress-pct { color: #374151 }` שורה ~259
- `.section-title { color: #1e293b }` שורה ~263
- `.expense-note { color: #64748b }` שורה ~268
- `.spinner { border: ... #e5e7eb; border-top-color: #3b82f6 }` שורה ~278
- `.form-label { color: #374151 }` שורה ~286
- `.form-error { color: #dc2626 }` שורה ~287
- `.btn-icon.danger:hover { background: #fee2e2 }` שורה ~294

**⚠️ MEDIUM — CategoryView לא טוענת category ישירות:**
קוראת `GET /budget` (כל הקטגוריות) ומסננת client-side לפי ID. לא הגדרה, אבל:
1. אין endpoint `GET /budget/categories/:id`
2. כל GET /budget מחזיר categories + expenses aggregate — צריך `GET /budget/expenses?categoryId=X` בנפרד

Frontend עושה שני קריאות: `/budget` + `/budget/expenses?categoryId=X`. עובד אבל לא אופטימלי.

**✅ ERROR HANDLING:** error מוצג ל-user.

---

## 2. feat/page/guests-list-new

### backend/src/routes/guests.js

**✅ SECURITY:** כל 8 endpoints מוגנים (כולל PATCH /:id/rsvp, GET /stats).

**✅ PRISMA:** כל queries עם `where: { userId }` או `where: { id, userId }`.

**⚠️ MEDIUM — אין Zod middleware:**
ולידציה ידנית. ה-validate.js קיים עם schemas מוכנים (כולל `createGuest`, `updateRsvp`) אבל לא מחובר ל-guests.js.

**⚠️ LOW — Zod schema inconsistency:**
`validate.js` שורה ~52: `side: z.enum(['groom', 'bride', 'mutual'])` — ערכים באנגלית
אבל guests.js שורה ~3: `SIDES = ['חתן', 'כלה', 'משותף']` — ערכים בעברית.
אם יחברו את ה-Zod validation בעתיד — תהיה קריסה.

---

### frontend/src/views/app/guests/GuestsView.vue (599 שורות)

**✅ RTL/Hebrew:** `dir="rtl"`, תוכן עברי מלא.

**❌ HIGH — Hardcoded colors:**

בתוך `<style scoped>`:
- שורות 522–524:
  ```css
  .side-groom { background: #DBEAFE; color: #1D4ED8; }
  .side-bride { background: var(--color-primary-light); color: var(--color-primary); }
  .side-both  { background: var(--color-bg-subtle); color: var(--color-text-muted); }
  ```
  `.side-groom` הוא hardcoded, `.side-bride` + `.side-both` תקינים.

בתוך `<script setup>`:
- שורה ~440:
  ```js
  const AVATAR_COLORS = ['#E91E8C','#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2','#9333EA']
  ```
  8 צבעים hardcoded לאווטאר. מקובל טכנית (צבעים דינמיים לחישוב), אבל עדיף `var(--color-primary)` וכו'.

**⚠️ LOW — alert() ב-4 מקומות:**
```js
alert(e.response?.data?.message || 'שגיאה בעדכון')   // שורה ~369
alert('שם אורח נדרש')                                // שורה ~402
alert(e.response?.data?.message || 'שגיאה בשמירה')  // שורה ~416
alert(e.response?.data?.message || 'שגיאה במחיקה')  // שורה ~433
```
שגיאות מוצגות ל-user (זה החיובי), אבל alert() הוא UX גרוע. כבר יש modal לdelete — אפשר להשתמש בו גם לשגיאות.

**✅ API CONTRACT:** קריאות `PATCH /guests/:id/rsvp`, `DELETE /guests/:id`, `PUT /guests/:id`, `POST /guests`, `GET /guests` — כולן קיימות ב-guests-list-new backend.

**✅ VUE:** אין memory leaks. Modal מובנה לconfirm delete (לא browser confirm).

---

## 3. feat/page/guest-card

### frontend/src/views/app/guests/GuestView.vue (496 שורות)

**✅ RTL/Hebrew:** `dir="rtl"`, כל טקסטים בעברית.

**❌ HIGH — Hardcoded colors:**

ב-`<style scoped>`:
- שורות 399–401:
  ```css
  .side-groom { background: #DBEAFE; color: #1D4ED8; }
  .side-both  { background: #f0f0f5; color: #6B7280; }
  ```
- שורה 408: `.table-badge { background: rgba(255,255,255,.15) }`
- שורות 410, 435: `rgba(255,255,255,.9)`, `rgba(255,255,255,.12)`, `#22c55e`, `#dcfce7`, `#16a34a`

ב-`<script setup>`:
- שורה ~359: `AVATAR_COLORS = ['#E91E8C','#7C3AED',...]` — זהה ל-GuestsView

**⚠️ LOW — alert() ב-4 מקומות:**
```js
alert('שם אורח נדרש')                                // שורה ~311
alert(e.response?.data?.message || 'שגיאה בשמירה')  // שורה ~328
alert(e.response?.data?.message || 'שגיאה בעדכון')  // שורה ~340
alert(e.response?.data?.message || 'שגיאה במחיקה')  // שורה ~352
```

**✅ API CONTRACT:** `GET /guests/:id`, `PUT /guests/:id`, `PATCH /guests/:id/rsvp`, `DELETE /guests/:id` — כולם קיימים ב-guests-list-new backend. **אבל ראה הערה ב-feat/page/guest-stats.**

**✅ WhatsApp link:** מחושב נכון — `https://wa.me/${phone}`.

**✅ VUE:** Modal delete confirm מובנה בתוך ה-template. אין memory leaks.

---

## 4. feat/page/guest-import

### מצב הbranch

**❌ CRITICAL — הbranch מכיל placeholder בלבד:**

`feat/page/guest-import:frontend/src/views/app/guests/ImportView.vue` (14 שורות):
```html
<template>
  <div class="view-placeholder fade-in">
    <h1>ייבוא אורחים</h1>
    <p style="color:var(--color-text-muted)">בבנייה... 🚧</p>
  </div>
</template>
```

הfeature **לא מומשה** בbranch זה. הtip של הbranch (f95d70a) הוא commit של guest-card.

הממשק הריאלי (ImportView.vue עם 432 שורות) נמצא רק ב-`feat/page/guest-stats`.

---

## 5. feat/page/guest-stats

### 🚨 CRITICAL — Missing Backend Endpoints (guests.js)

**זהו הממצא הכי חמור בכל הround.**

Commit `b61502c` ("fix(api-contract)") שינה את `backend/src/routes/guests.js` — אחרי השינוי, הקובץ מכיל **6 endpoints בלבד:**
```
GET /        POST /        POST /bulk
GET /:id     PUT /:id      DELETE /:id
```

**Missing endpoints vs. frontend calls:**

| Endpoint חסר | מי קורא | מה יקרה בריצה |
|-------------|---------|---------------|
| `PATCH /guests/:id/rsvp` | GuestsView.vue שורה ~364, GuestView.vue שורה ~337 | 404 — כפתור RSVP מהיר שבור לחלוטין |
| `GET /guests/stats` | StatsView.vue שורה ~166 | 404 — דף הסטטיסטיקות לא יטען |
| `POST /guests/preview` | ImportView.vue שורה ~245 | 404 — שלב 1 של wizard שבור |
| `POST /guests/import` | ImportView.vue שורה ~294 | 404 — ייבוא אורחים שבור לחלוטין |

**ראיה:**
```bash
git show feat/page/guest-stats:backend/src/routes/guests.js | grep "app\."
# מחזיר רק 6 routes
```

**שורש הבעיה:**
- Commit `9ad99f2` תייג את עצמו "backend /import + /preview endpoints" אבל לא שינה את guests.js
- Commit `ec27525` (StatsView) לא הוסיף GET /stats
- Commit `b61502c` (fix) שינה את guests.js אבל לא שחזר את הendpoints החסרים

---

### frontend/src/views/app/guests/ImportView.vue (432 שורות, ב-guest-stats)

**✅ RTL/Hebrew:** `dir="rtl"`, כל טקסטים בעברית.

**✅ Design Tokens:** שימוש נרחב ב-CSS vars.

**❌ CRITICAL — קורא endpoints שלא קיימים:**
- שורה 245: `api.post('/guests/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })`
- שורה 294: `api.post('/guests/import', { rows }, { headers: { 'Content-Type': 'application/json' } })`

**⚠️ HIGH — Frontend שולח FormData אבל backend לא מוכן:**
גם אם יוסיפו /preview, הfastify backend צריך `multipart` plugin לטיפול בfile uploads. לא בדוק.

**✅ MOBILE:** responsive layout, flex.

---

### frontend/src/views/app/guests/StatsView.vue (334 שורות)

**✅ RTL/Hebrew:** `dir="rtl"`, כל טקסטים בעברית.

**✅ Design Tokens:** רוב ה-CSS משתמש ב-`var(--color-*)`.

**⚠️ MEDIUM — Hardcoded chart colors ב-JS:**
שורות ~177–180, 202, 219:
```js
confirmed: '#22C55E', declined: '#EF4444', maybe: '#F59E0B', pending: '#94A3B8'
'חתן': '#3B82F6', 'כלה': '#E91E8C', 'משותף': '#8B5CF6'
```
אלה משמשים לבניית `conic-gradient` — לא ניתן להשתמש ב-CSS vars בJS. נסלח, אבל עדיף להגדיר כconstants מדוקמנטים.

ב-CSS: שורה ~314: `.skeleton { background: linear-gradient(90deg,#f0f0f5 25%,...) }` — hardcoded.

**❌ CRITICAL:** `api.get('/guests/stats')` (שורה 166) — endpoint לא קיים (ראה מעלה).

**✅ ERROR HANDLING:** `error.value` מוצג ב-template עם כפתור "נסה שוב".

**✅ VUE:** `onMounted` בלבד, אין cleanup נדרש.

---

### backend/src/routes/budget.js (ב-guest-stats branch)

✅ זהה לניתוח ב-feat/page/budget — תקין.

---

## סיכום ממצאים לפי חומרה

### 🔴 CRITICAL

1. **feat/page/guest-stats: guests.js חסר 4 endpoints שהfrontend מצפה להם**
   - `PATCH /:id/rsvp` — GuestsView.vue שורה ~364, GuestView.vue שורה ~337
   - `GET /stats` — StatsView.vue שורה ~166
   - `POST /preview` — ImportView.vue שורה ~245
   - `POST /import` — ImportView.vue שורה ~294
   - **כל הפונקציונליות הזו שבורה בריצה**

2. **feat/page/guest-import: branch מכיל placeholder בלבד — feature לא מומשה**

### 🟠 HIGH

3. **feat/page/budget: BudgetView.vue + CategoryView.vue — עשרות hardcoded hex colors**
   - BudgetView.vue: inline legend colors, spinner colors, summary card borders
   - CategoryView.vue: כמעט כל צבע ב-CSS הוא hardcoded

4. **feat/page/guests-list-new: GuestsView.vue — hardcoded colors**
   - `.side-groom { background: #DBEAFE; color: #1D4ED8 }` — צריך design token

5. **feat/page/guest-card: GuestView.vue — hardcoded colors**
   - hero section rgba values, `.side-groom`, `.side-both`, WhatsApp hover colors

6. **feat/page/guest-stats: ImportView.vue שולח multipart/form-data — backend לא מוכן**
   - Fastify דורש plugin `@fastify/multipart` לטיפול בfile uploads

### 🟡 MEDIUM

7. **כל branches: אין Zod middleware על guest/budget routes**
   - `validate.js` קיים עם schemas מוכנים אבל לא מחובר
   - ולידציה ידנית בלבד

8. **feat/page/guests-list-new: validate.js schema inconsistency**
   - Zod: `side: z.enum(['groom', 'bride', 'mutual'])` (אנגלית)
   - Runtime: `SIDES = ['חתן', 'כלה', 'משותף']` (עברית)
   - אם יחברו Zod — תהיה קריסה

9. **feat/page/guest-stats: StatsView.vue hardcoded chart colors ב-JS**

### 🟢 LOW

10. **BudgetView.vue: alert() בshgiat delete** (בonClick)
11. **GuestsView.vue + GuestView.vue: alert() ב-4 מקומות** (שגיאות מוצגות אבל UX גרוע)
12. **budget.js: dead code `importRateMap`** (שורות 3–13)

---

## מה טוב (לא לשנות!)

- ✅ **אבטחה מלאה** — כל endpoint מוגן, כל query מסנן userId
- ✅ **אין raw SQL** — Prisma בכל מקום
- ✅ **כפל אימות ownership** — בדיקה שהresource שייך ל-user לפני update/delete
- ✅ **Rate limiting ב-/bulk** — מניעת DDoS ב-import
- ✅ **RTL בכל הviews** — `dir="rtl"` על root div
- ✅ **עברית מלאה** — כל error messages, labels, placeholders
- ✅ **אין memory leaks** — לא נמצאו event listeners ללא cleanup, לא נמצאו setIntervals
- ✅ **API קריאות מוגנות ב-useApi.js** — auto refresh token, 401 handling
- ✅ **GuestsView: Modal delete confirm** (לא browser confirm)
- ✅ **CategoryView: בדיקת ownership לפני הוצאה**

---

## BUILD STATUS

לא נמצא build report חדש ב-reports/. לא ניתן לאמת build pass/fail לround זה.

---

ROUND5_STATUS: 0_APPROVED / 5_NEEDS_FIXES
