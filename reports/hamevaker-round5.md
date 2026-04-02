# 🔍 דוח המבקר — Round 5 (WhatsApp Features)
**תאריך:** 2026-04-02  
**סבב:** Round 5  
**בודק:** המבקר (hamevaker subagent)  
**ענפים:** feat/page/whatsapp-connect | feat/page/wa-templates | feat/page/wa-send

---

## סיכום מהיר

| Branch | ציון |
|--------|------|
| feat/page/whatsapp-connect | NEEDS_FIXES |
| feat/page/wa-templates | CRITICAL_BUGS |
| feat/page/wa-send | CRITICAL_BUGS |

---

## 1. feat/page/whatsapp-connect

### [MEDIUM] נתיב ברירת מחדל `/app/whatsapp` הוא stub — לא מוביל לדף החיבור
**קובץ:** `frontend/src/views/app/whatsapp/WhatsappView.vue`  
**קובץ Router:** `frontend/src/router/index.js`

הנתיב `/app/whatsapp` מוביל ל-`WhatsappView.vue` שמכיל רק "בבנייה... 🚧".  
הדף הפונקציונלי הוא `/app/whatsapp/connect` → `WhatsAppConnectView.vue`.  
ניווט מהתפריט הצדי יפגוש stub ולא את הדף האמיתי.

**תיקון נדרש:** להפנות `/app/whatsapp` → `redirect: '/app/whatsapp/connect'` או להחליף את WhatsappView.vue בתוכן אמיתי.

---

### [MEDIUM] mockConnect שולח מספר טלפון רנדומלי ל-API — לא עקבי
**קובץ:** `frontend/src/views/app/whatsapp/WhatsAppConnectView.vue`, שורה ~186

```js
const res = await api.post('/whatsapp/connect', { phone: '050-' + Math.floor(Math.random() * 9000000 + 1000000) })
```

מספר הטלפון נוצר רנדומלית בכל לחיצה. אין validation של פורמט. בנוסף, הכפתור מוצג ב-UI ללא הסבר ברור שמדובר בדמו.  
**תיקון:** להוסיף `// [MOCK]` label בולט ב-UI, ולהגדיר מספר demo קבוע.

---

### [MEDIUM] Quick links arrow ← בכיוון שגוי
**קובץ:** `WhatsAppConnectView.vue`, שורה 128-144, CSS שורה 590

```css
.quick-link-btn:hover .ql-arrow { transform: translateX(-3px); }
```

בממשק RTL, החץ הוא ← (שמאלה) ואנימציית hover מזיזה שמאלה (translateX(-3px)).  
זה נכון לניווט RTL (חיצים שמאלה = קדימה), אבל `.ql-arrow { margin-right: auto; }` דוחף את החץ ימינה פיזית בpretty layout, בעוד שלוגיקת RTL מצפה שהחץ יהיה בצד שמאל (סוף).  
**תיקון:** להשתמש ב-`margin-inline-start: auto` במקום `margin-right: auto`.

---

### [LOW] אין aria-labels על כפתורי icon
**קובץ:** `WhatsAppConnectView.vue` — כפתורי חיבור ונתוק

`<button class="btn btn-primary btn-connect" @click="mockConnect">` — אין `aria-label`.  
`<button class="btn btn-outline btn-danger-outline" @click="disconnectWa">` — אין `aria-label`.

---

### [LOW] confirm() לניתוק — לא accessible
**קובץ:** `WhatsAppConnectView.vue`, שורה ~196

```js
if (!confirm('האם אתה בטוח שברצונך לנתק את חשבון WhatsApp?')) return
```

`window.confirm()` חוסם את ה-UI, אינו מסוגנן, ואינו accessible. יש להחליף ב-modal מאושש.

---

### [LOW] Build לא מתועד בWORKLOG לענף זה
**קובץ:** `WORKLOG.md`

WORKLOG מציין `npm run build → ✅` רק לענף `feat/fix/critical-auth`. לא תועד build לענפי WA.  
(Build נבדק ידנית ועבר: ✅ 0 errors, 157 modules)

---

## 2. feat/page/wa-templates

### [CRITICAL] שדה `type` לא קיים ב-Prisma schema של WaTemplate — קריסה בזמן ריצה
**קובץ schema:** `backend/prisma/schema.prisma`  
**קובץ routes:** `backend/src/routes/whatsapp.js`, שורות 159-170 (create), 185-198 (update)

**model WaTemplate בschema:**
```
name, content, variables, isDefault, createdAt
```
`type` — לא קיים!

**Backend מנסה:**
```js
prisma.waTemplate.create({ data: { userId, name, type: type || 'custom', content, variables } })
```

Prisma יזרוק `PrismaClientValidationError: Unknown arg 'type'` בכל יצירת תבנית.  
כל POST ל-`/api/whatsapp/templates` → קריסה.  
כל PUT ל-`/api/whatsapp/templates/:id` → קריסה.

**WORKLOG אמר** "Updated Prisma schema: added `type` field to WaTemplate" — אך השינוי **לא הוּגָשׁ ל-git**.  
`prisma db push` אולי רץ מקומית אך ה-schema.prisma לא עודכן בcommit.

**תיקון:** להוסיף לschema:
```prisma
type String @default("custom")
```
ולהריץ `prisma db push` + לcommit.

---

### [MEDIUM] RSVP link preview חושף guest ID
**קובץ:** `frontend/src/views/app/whatsapp/TemplatesView.vue`, בfunction `applyVars`

```js
const SAMPLE = { ..., link: 'https://yalla.wedding/rsvp/abc', ... }
```

בTemplatesView preview נוצר עם נתוני sample סטטיים (בסדר). אבל ב-SendView (ראה פירוט שם), ה-preview בנוי עם:
```js
.replace(/\{קישור_RSVP\}/g, `https://yalla.wedding/rsvp/${g.id}`)
```
חשיפת ID מספרי של guest ב-URL ציבורי. יש להשתמש ב-token/slug.

---

### [MEDIUM] icon-buttons ב-template list אינם accessible
**קובץ:** `TemplatesView.vue`, שורות ~57-60

```html
<button class="icon-btn" @click="copyTemplate(tmpl)" title="העתק">📋</button>
<button class="icon-btn" @click="openEditModal(tmpl)" title="ערוך">✏️</button>
<button class="icon-btn icon-btn-danger" @click="deleteTemplate(tmpl)" title="מחק">🗑️</button>
```

יש `title` (tooltip בhover), אין `aria-label`. Screen readers יקראו רק את האמוג'י.  
**תיקון:** `aria-label="העתק תבנית"` וכד'.

---

### [MEDIUM] נתוני demo הסתרה לא עקביים בין TemplatesView ל-SendView
**קובץ:** `TemplatesView.vue` vs `SendView.vue`

TemplatesView משתמש בנתונים סטטיים: `שם_זוג: 'דנה ויוסי'`, `שם_מקום: 'אולם הרקפות'`, תאריך: `12/06/2026`.  
SendView משתמש באותם נתונים סטטיים hardcoded.  
שניהם לא מושכים נתוני חתונה אמיתיים מה-user settings.  
**תיקון:** לשלוף `weddingDate`, `venueName`, `coupleName` מה-wedding settings API.

---

### [LOW] modal-footer `justify-content: flex-start` — כפתורי ביטול/שמור בסדר הפוך מ-RTL convention
**קובץ:** `TemplatesView.vue`, CSS שורה ~668

```css
.modal-footer { justify-content: flex-start; }
```

בRTL, "ביטול" צריך להיות בצד ימין ו"שמור" בצד שמאל (כי שמאל = forward).  
כרגע שניהם aligned ל-right (flex-start ב-RTL). נראה נכון אבל לא מנוהל עם `flex-end`/`gap` לוגי.

---

### [LOW] char-counter `text-align: left` — שימוש בlogical properties עדיף
**קובץ:** `TemplatesView.vue`, CSS שורה ~647

```css
.char-counter { text-align: left; }
```

בRTL context, `text-align: left` = visual right (בסדר פונקציונלית). אבל semantic ל-RTL apps:  
```css
.char-counter { text-align: end; }
```

---

## 3. feat/page/wa-send

### [CRITICAL] שדות `message` ו-`results` לא קיימים ב-Prisma schema של WaMessage — קריסה בזמן ריצה
**קובץ schema:** `backend/prisma/schema.prisma`  
**קובץ routes:** `backend/src/routes/whatsapp.js`, שורות 249-262 (send), שורות 281-285 (history)

**model WaMessage בschema:**
```
userId, templateId, recipientIds, scheduledAt, sentAt, status, error, createdAt
```
`message` — לא קיים!  
`results` — לא קיים!

**Backend מנסה:**
```js
prisma.waMessage.create({
  data: {
    userId,
    templateId: ...,
    recipientIds: ...,
    message: templateContent,    // ← UNKNOWN FIELD
    results: JSON.stringify(results), // ← UNKNOWN FIELD
    status: ...,
    sentAt: new Date()
  }
})
```

כל POST ל-`/api/whatsapp/send` → `PrismaClientValidationError` → קריסה.  
לא נשמרת שום הודעה ב-DB.  
כל GET ל-`/api/whatsapp/history` → מחזיר נתונים ריקים לעולם.  
`GET /api/whatsapp/status` → stats תמיד 0 (`msg.results` תמיד undefined).

**תיקון:** להוסיף לschema של WaMessage:
```prisma
message String?
results String?  @default("[]")
```
ולהריץ `prisma db push` + לcommit.

---

### [HIGH] POST /api/whatsapp/send מחזיר status 200 על validation error
**קובץ:** `backend/src/routes/whatsapp.js`, שורה 219

```js
if (guestIds.length === 0) {
  return { statusCode: 400, error: 'יש לבחור לפחות אורח אחד' }
}
```

Fastify לא מסיק status code מ-body. הtrue HTTP status יהיה 200.  
Frontend ב-`sendMessages()` בודק `catch` — שגיאה זו לא תיכנס ל-catch ואת ה-alert לא יראה.

**תיקון:** להשתמש ב-`reply.code(400).send(...)` או לזרוק error:
```js
throw app.httpErrors.badRequest('יש לבחור לפחות אורח אחד')
```

---

### [HIGH] גודל batch בלתי מוגבל — אין cap על מספר האורחים בשליחה
**קובץ:** `backend/src/routes/whatsapp.js`, routes `/send`

אין הגבלה על `guestIds.length`. חתונה עם 500 אורחים → 500 Prisma queries + 500 mock sends בפנייה אחת.  
אין rate limit ייעודי לנתיב זה מעבר לglobal (100/min).

**תיקון:** להוסיף `if (guestIds.length > 200) { throw badRequest('מקסימום 200 אורחים בשליחה אחת') }` ו/או rate limit נמוך יותר לנתיב זה.

---

### [HIGH] parseInt ללא NaN validation — נתיב template/delete
**קובץ:** `backend/src/routes/whatsapp.js`, שורות 176, 202

```js
const id = parseInt(req.params.id)
// לא בודק אם id === NaN
const existing = await prisma.waTemplate.findFirst({ where: { id, userId } })
```

`parseInt('abc')` = `NaN`.  
`prisma.waTemplate.findFirst({ where: { id: NaN } })` → Prisma validation error.  
אמנם frontend לא ישלח NaN, אבל API חשוף לקריסה ממשתמש זדוני.

**תיקון:**
```js
const id = parseInt(req.params.id)
if (isNaN(id)) return reply.code(400).send({ error: 'ID לא תקין' })
```

---

### [MEDIUM] PUT /templates/:id — שגיאת 404 לא נזרקת כשורה
**קובץ:** `backend/src/routes/whatsapp.js`, שורות 181-182

```js
req.server.httpErrors?.notFound('תבנית לא נמצאה')  // מחזיר error object, לא זורק/מחזיר
return { statusCode: 404, error: 'תבנית לא נמצאה' }  // status 200 עם body של 404
```

`req.server.httpErrors?.notFound(...)` לא זורק — הוא רק יוצר. `return { statusCode: 404 }` שולח HTTP 200.  
Frontend לא ייכנס ל-catch, שגיאת "תבנית לא נמצאה" תישלח ב-200 OK.

**תיקון:**
```js
throw app.httpErrors.notFound('תבנית לא נמצאה')
```

---

### [MEDIUM] HistoryView.vue — stub בלבד; כפתורי quick link מוליכים ל"בבנייה"
**קובץ:** `frontend/src/views/app/whatsapp/HistoryView.vue`  
**קובץ Router:** `frontend/src/router/index.js`

הנתיב `/app/whatsapp/history` מוביל ל-`HistoryView.vue` שמכיל stub "בבנייה 🚧".  
ב-`WhatsAppConnectView.vue` יש quick link ל-`/app/whatsapp/history`.  
ב-`SendView.vue` מוצגת היסטוריה מוטמעת בתוך הדף (פתרון workable אבל inconsistent עם routing).

**תיקון:** להחליט — האם HistoryView.vue הוא דף עצמאי? אם כן, לממש. אם לא, להסיר את הroute ואת הquick link.

---

### [MEDIUM] SendView: preview מוגש לאורח הראשון הנבחר בלבד — ללא indication
**קובץ:** `SendView.vue`, computed `previewMessage` + UI

ה-preview מציג את ההודעה עבור `firstSelectedGuest`. כשבוחרים 50 אורחים, ה-preview מראה רק את הראשון.  
אין הסבר ברור בUI. משתמש עלול לחשוב שכולם מקבלים אותה הודעה בדיוק (נכון) בלי להבין שה-preview הוא לאורח ספציפי.

---

### [LOW] alert() בגישת SendView.sendMessages — לא accessible
**קובץ:** `SendView.vue`, שורה ~246

```js
alert(err?.response?.data?.error || 'שגיאה בשליחת ההודעות')
```

יש להחליף ב-toast/banner שגיאה מסוגנן.

---

### [LOW] SendView history מוגבל ל-5 פריטים בצד frontend, 10 בbackend
**קובץ:** `SendView.vue`, שורה `history.value = (res.data || []).slice(0, 5)`  
**קובץ:** `whatsapp.js` routes, `take: 10`

חוסר עקביות בין ה-backend שמחזיר 10 לבין ה-frontend שמציג 5. מבלבל.

---

## 🔗 ממצאים Cross-Branch

### [CRITICAL] Schema drift — WORKLOG שקרי, שינויי schema לא committed
**WORKLOG מ-2026-04-02T21:27Z אמר:**
> "Updated Prisma schema: added `type` field to WaTemplate, added `message` and `results` to WaMessage — `prisma db push` applied"

**אבל** `backend/prisma/schema.prisma` ב-HEAD של `feat/page/wa-send` **לא מכיל** את השדות האלה.  
ה-`prisma generate` הפיק types ללא שדות אלה:  
- `WaTemplateCreateInput` — אין `type`  
- `WaMessageCreateInput` — אין `message`, אין `results`

**זה אומר:** `prisma db push` רץ מקומית ועדכן את ה-DB אבל ה-schema.prisma **לא נכלל בcommit**.  
כל deployment חדש (CI/CD, staging, production) → schema.prisma ≠ runtime code → קריסה.

---

### [HIGH] כל 3 ענפים — אין aria-labels על כפתורי icon
שלושת הדפים (Connect, Templates, Send) לא מכילים `aria-label` כלל על אף כפתור. Screen readers יקראו emoji בלבד.

---

### [HIGH] שגיאות HTTP 400/404 נשלחות כHTTP 200 — backend pattern פגום
ב-POST /templates, POST /send, PUT /templates/:id — כולם מחזירים objects עם `statusCode` ב-body אבל HTTP status 200.  
Frontend שמסתמך על `catch(err)` לא יתפוס את השגיאות האלה.  
דפוס זה חוזר על עצמו מדיי בקוד — יש לתקן ברמת הarchitecture.

---

### [MEDIUM] HistoryView + WhatsappView — שני stub views מחוברים ל-router
`/app/whatsapp` → stub  
`/app/whatsapp/history` → stub  
שניהם נגישים משאר הדפים דרך quick links.

---

### [MEDIUM] Build status
`npm run build` ✅ עובר בהצלחה (157 modules, 0 errors).  
אבל: Vite לא בודק types, ו-Prisma schema mismatch לא נחשף ב-build.

---

## 🚨 Top 3 Must-Fix Before Proceeding

### 1. [CRITICAL] הוסף `type` ל-WaTemplate ו-`message`+`results` ל-WaMessage בschema.prisma וcommit
**קובץ:** `backend/prisma/schema.prisma`

ללא זה — POST /templates, POST /send — כולם קורסים. המוצר לא עובד.

```prisma
// WaTemplate — להוסיף:
type     String  @default("custom")

// WaMessage — להוסיף:
message  String?
results  String? @default("[]")
```

אחרי השינוי: `npx prisma db push` + commit.

---

### 2. [HIGH] תקן HTTP response codes בכל routes — אל תשתמש ב-`return { statusCode: 400 }`
**קובץ:** `backend/src/routes/whatsapp.js`, שורות 155, 182, 219, 206

כל המקומות שמחזירים `{ statusCode: 4xx }` צריכים להשתמש ב:
```js
throw app.httpErrors.badRequest('...')
throw app.httpErrors.notFound('...')
```
או `reply.code(400).send({ error: '...' })`.

---

### 3. [MEDIUM/HIGH] תקן `/app/whatsapp` stub → redirect, ו-HistoryView → ממש או הסר
**קובץ:** `frontend/src/router/index.js`, `frontend/src/views/app/whatsapp/WhatsappView.vue`, `HistoryView.vue`

משתמש שנוחת על `/app/whatsapp` רואה "בבנייה". Quick link ל-History מוביל ל-"בבנייה".  
הממשק נשבר מבחינת UX גם אם ה-backend יתוקן.

---

*דוח זה הוכן ע"י המבקר (hamevaker). לא בוצעו שינויים בקוד.*
