# 🔍 המבקר (Hamevaker) — Code Review Round 1

**תאריך:** 2026-04-02  
**סבב:** Round 1  
**Reviewer:** המבקר (Devil's Advocate Agent)  
**מדיניות:** בדיקה בלבד — אין שינויי קוד

---

## Branch 1: `feat/page/app-layout`
### קובץ: `frontend/src/components/layout/AppLayout.vue`

---

### 🔴 CRITICAL

_לא נמצאו בעיות ברמה CRITICAL._

---

### 🟠 HIGH

#### HIGH-1 — Logout ללא ניתוב לאחר יציאה
- **שורה:** ~68 (template), ~115 (script — store)  
- **קובץ:** `AppLayout.vue` + `stores/auth.js`  
- **בעיה:** כפתור הלוג-אאוט קורא `@click="auth.logout"` ישירות. פונקציית `logout` בstor מוחקת את הטוקן והמשתמש, אך **לא מבצעת ניתוב** לדף login.  
  הRouter guard מופעל רק בניווט — לאחר logout המשתמש נשאר על דף `/app/dashboard` (או כל דף אחר) עם auth state ריק, מה שעלול לגרום לשגיאות API וUI שבורה.  
- **פתרון מוצע:** להוסיף handler מקומי ב-AppLayout שקורא `auth.logout()` ואז `router.push('/login')`.

---

### 🟡 MEDIUM

#### MEDIUM-1 — Active nav indicator בכיוון שגוי ל-RTL
- **שורה:** ~310 (`.nav-item.router-link-active`)  
- **בעיה:** הסגנון `border-right: 3px solid var(--color-primary)` מציב את הקו הורוד בצד הימני של nav item — כלומר בצד החיצוני של הסייבבר (הרחק מהתוכן). בלייאאוט RTL, הסייבר נמצא בצד ימין של המסך, והתוכן משמאלו. הקו האקטיבי צריך להיות `border-left` כדי לפנות לכיוון התוכן.  
- **דחיפות:** HIGH מבחינה ויזואלית, אך אין השפעה פונקציונלית.

#### MEDIUM-2 — נגישות: חסר `aria-label` על כפתור קריסת סייבר
- **שורה:** ~12 (`.collapse-btn`)  
- **בעיה:** הכפתור מכיל רק `›`/`‹` ללא `aria-label`. לקוראי מסך זה בלתי נגיש.  
- **פתרון:** `:aria-label="collapsed ? 'פתח תפריט' : 'כווץ תפריט'"` + `aria-expanded="!collapsed"`.

#### MEDIUM-3 — נגישות: חסר `aria-label` על כפתור המבורגר
- **שורה:** ~82 (`.menu-btn`)  
- **בעיה:** הכפתור מכיל רק `☰` ללא `aria-label`. בלתי נגיש לקוראי מסך.  
- **פתרון:** `aria-label="פתח תפריט"` + `aria-expanded="mobileOpen"`.

---

### 🔵 LOW

#### LOW-1 — חסר `aria-label` על `<aside>` ו-`<nav>`
- **שורות:** ~3 (`<aside>`), ~14 (`<nav>`)  
- **בעיה:** אלמנטים סמנטיים ללא label. `<aside>` צריך `aria-label="ניווט ראשי"` ו-`<nav>` צריך `aria-label="קישורי ניווט"` לנגישות מלאה.

#### LOW-2 — אנימציית transition לא מותאמת ל-RTL
- **שורה:** ~342 (`.label-enter-from, .label-leave-to`)  
- **בעיה:** `transform: translateX(6px)` מגדיר כיוון אנימציה שמאלה←ימינה. ב-RTL, הכיוון הטבעי הוא הפוך — `translateX(-6px)`. אנימציה קלה ואנטי-אינטואיטיבית.

#### LOW-3 — `navGroups` מוגדר בתוך `<script setup>` כ-plain array
- **שורה:** ~92  
- **בעיה:** `navGroups` היא data סטטית שמוגדרת בתוך setup אך לא צריכה להיות שם — ניתן להגדיר אותה מחוץ לקומפוננט לבהירות. לא בעיה פונקציונלית.

#### LOW-4 — אין `lang="he"` על root element
- **שורה:** כל הקובץ  
- **בעיה:** `<html lang>` מוגדר ב-index.html (לא נבדק כאן), אך אם הוא חסר — קוראי מסך לא ידעו שהשפה עברית. יש לוודא.

---

### ✅ טוב לציין — AppLayout

- שימוש נרחב ב-CSS variables (`--color-primary`, `--space-*`, `--font-size-*`, `--sidebar-width`, `--topbar-height`, `--transition`, etc.)
- Mobile responsive מלא עם `@media (max-width: 767px)` ✅
- RTL direction על `.app-shell` ✅
- `onMounted`/`onUnmounted` לניהול event listener ✅
- `computed` לtitle דינמי ולinitials ✅
- Page transitions ✅
- ספריית nav items מלאה — כל ה-RouterLinks קיימים בrouter ✅
- אין hardcoded secrets ✅
- אין console.log ✅

---

## **ציון Branch 1: ⚠️ NEEDS_FIXES**

בעיית logout ללא ניתוב (HIGH-1) ובעיית border-right (MEDIUM-1) חייבות תיקון לפני merge.

---
---

## Branch 2: `feat/page/landing`
### קובץ: `frontend/src/views/LandingView.vue`

---

### 🔴 CRITICAL

_לא נמצאו בעיות ברמה CRITICAL._

---

### 🟠 HIGH

#### HIGH-1 — קישורים שבורים לדפי `/privacy` ו-/`terms`
- **שורות:** ~237, ~238 (footer)  
- **קטעי קוד:**
  ```html
  <a href="/privacy" class="lfoot-link">פרטיות</a>
  <a href="/terms" class="lfoot-link">תנאים</a>
  ```
- **בעיה:** שני הקישורים הם `<a href>` רגילים (לא `RouterLink`) ומפנים לנתיבים `/privacy` ו-`/terms` שאינם מוגדרים ב-router. כל לחיצה תגרום לפריסה מחדש מלאה של הדף ו-404. בנוסף — שאר קישורי הfooter משתמשים ב-RouterLink. אי-עקביות.
- **פתרון:** להמיר ל-`RouterLink` ולהוסיף routes בrouter, או להסיר את הקישורים עד שהדפים קיימים.

#### HIGH-2 — Hero floating badges עלולים להיקטע ע"י `overflow: hidden`
- **שורות:** ~56 (`.hero { overflow: hidden }`), ~60 (`.badge-guests { bottom: -20px; right: -20px }`), ~65 (`.badge-whatsapp { top: -16px; left: -16px }`)  
- **בעיה:** ה-badges מוצאות מחוץ ל-`.hero-visual` עם offsets שליליים. `.hero` מוגדר עם `overflow: hidden`. על מסכים קטנים, ה-padding הפנימי עלול לא להספיק כדי למנוע חיתוך (clipping) של הbadges.  
- **הערה:** על דסקטופ כנראה עובד, אך דורש בדיקה על מסך קטן (<480px).

---

### 🟡 MEDIUM

#### MEDIUM-1 — נגישות: חסר `<main>` landmark element
- **שורה:** כל הtemplate  
- **בעיה:** הדף מכיל `<nav>`, sections ו-`<footer>` אך אין `<main>` שעוטף את התוכן הראשי. כלי נגישות לא יוכלו לזהות ולנווט לתוכן הראשי.

#### MEDIUM-2 — נגישות: חסר `aria-label` על `mobile-menu-btn`
- **שורה:** ~17 (`.mobile-menu-btn`)  
- **בעיה:** `<button class="mobile-menu-btn">☰</button>` — ללא טקסט נגיש לקוראי מסך. חסר `aria-label` ו-`aria-expanded`.

#### MEDIUM-3 — לוגיקת תמחור: ternary מיותר ומוטעה
- **שורה:** ~181  
- **קוד:**
  ```html
  <RouterLink :to="plan.featured ? '/register' : '/register'" ...>
  ```
- **בעיה:** שני ענפי הternary זהים — `/register`. ככל הנראה היה מתוכנן להפנות תכנית premium לflow שונה (כמו `/checkout` או `/register?plan=premium`). זה נראה כ-placeholder שנשכח. גם לא מנצל את `plan.cta` שמוגדר בdata.

#### MEDIUM-4 — אנימציית `float` ללא `prefers-reduced-motion`
- **שורה:** ~כ-390 (`@keyframes float`)  
- **בעיה:** אנימציה אינסופית (3 שניות loop) על floating badges ללא `@media (prefers-reduced-motion: reduce)`. יכול לגרום לבחילה (motion sickness) ולהיות בעיית נגישות, ובנוסף מבזבז battery על מכשירים ניידים.

---

### 🔵 LOW

#### LOW-1 — חסר `aria-label` על `<nav class="lnav">`
- **שורה:** ~3  
- **בעיה:** `<nav>` ללא label. קוראי מסך יציגו "navigation" גנרי.  
- **פתרון:** `aria-label="ניווט ראשי"`.

#### LOW-2 — חסר `aria-expanded` על mobile menu button
- **שורה:** ~17  
- **בעיה:** `@click="mobileMenu = !mobileMenu"` בלי `:aria-expanded="mobileMenu"`. קוראי מסך לא יודעים אם התפריט פתוח.

#### LOW-3 — `step-arrow` elements — dead code
- **שורות:** ~135, ~136  
- **קוד:**
  ```html
  <div class="step-arrow">←</div>
  <div class="step-arrow second">←</div>
  ```
- **CSS:** `.step-arrow { display: none; }` — אף פעם לא מוצגים. פיצ'ר חצאי-מומש שנשכח. יש להסיר או להשלים.

#### LOW-4 — Inline style בtemplate
- **שורה:** ~22  
- **קוד:** `style="margin-top:8px"` על RouterLink במובייל מנו  
- **בעיה:** אי-עקביות עם מערכת העיצוב. יש להשתמש ב-`var(--space-2)` דרך class.

#### LOW-5 — חסר `aria-label`/`role` על section elements
- **שורות:** ~32, ~96, ~121, ~149, ~193, ~215  
- **בעיה:** sections בלי `aria-labelledby` — קוראי מסך לא יכולים לנווט ביניהם לפי כותרת.

#### LOW-6 — Reviewer data הוא fake/placeholder בלי הגנה
- **שורות:** ~data (reviews array) — שמות ותאריכים קונקרטיים  
- **בעיה:** ביקורות עם שמות אמיתיים לכאורה (`נועה ואיתי כהן`, `מיכל ורון לוי`, `שירה ואלון דוד`) ומספרי פאנץ' (`500+ זוגות`, `50K+ אורחים`). ב-production אלה עשויים להיראות כהטעיה אם לא מציינים שהם לדוגמה.

---

### ✅ טוב לציין — LandingView

- שימוש נרחב ומסודר ב-CSS variables ✅
- RTL מלא: `dir="rtl"` בtemplate + `direction: rtl` ב-CSS ✅
- Mobile responsive מקיף (breakpoints ב-1024px ו-768px) ✅
- כפתורי navbar נעלמים במובייל ומתחלפים ב-mobile menu ✅
- `clamp()` על hero h1 לresponsive typography ✅
- ה-RouterLinks הראשיים (`/login`, `/register`, `/`) קיימים בrouter ✅
- `script setup` נקי עם `ref` בלבד — data סטטית מחוץ לreactivity (✓ performance) ✅
- אין hardcoded secrets/tokens ✅
- אין console.log ✅
- עיצוב מרשים: gradient-text, floating badges, mockup ✅

---

## **ציון Branch 2: ⚠️ NEEDS_FIXES**

קישורים שבורים `/privacy` ו-`/terms` (HIGH-1) חייבים תיקון. לוגיקת pricing (MEDIUM-3) צריכה הבהרה.

---

## סיכום כולל

| Branch | ציון |
|--------|------|
| `feat/page/app-layout` | ⚠️ NEEDS_FIXES |
| `feat/page/landing` | ⚠️ NEEDS_FIXES |

### בעיות Priority לפי דחיפות:

**HIGH (חייבים תיקון לפני merge):**
1. `AppLayout.vue` — Logout ללא redirect לאחר יציאה
2. `LandingView.vue` — קישורים `/privacy` ו-`/terms` לא קיימים
3. `AppLayout.vue` — Active nav item עם `border-right` שגוי ב-RTL (visual)

**MEDIUM (מומלץ תיקון לפני release):**
4. נגישות: חסרים aria-labels על כפתורי פעולה קריטיים (שני הקבצים)
5. `LandingView.vue` — חסר `<main>` landmark
6. `LandingView.vue` — Pricing ternary מוטעה
7. `LandingView.vue` — אנימציות ללא prefers-reduced-motion

---
*המבקר סיים. אין שינויי קוד — דוח בלבד.*
