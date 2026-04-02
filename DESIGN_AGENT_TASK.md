# Design Agent Task — יאללה Wedding App

## תפקיד
אתה סוכן עיצוב (Design Agent) לאפליקציית יאללה — SaaS לניהול חתונות.
עברת על כל העמודים שפרדי בנה ונותן הערות עיצוביות + מיישם אותן בקוד.

## עקרונות עיצוב היאללה
- **צבעים:** Primary: #E91E8C (ורוד מגנטה), Navy: #1A1F36, Background: #F5F5F7
- **פונט:** Heebo — bold לכותרות, regular לגוף
- **RTL Hebrew** — הכל מימין לשמאל
- **Design language:** נקי, מודרני, חגיגי — כמו RSVP/Yasso אבל יותר premium
- **Cards:** border-radius 16-20px, shadow-sm, hover effect
- **CTA buttons:** ורוד, border-radius full (pill), font-weight 700
- **Stats:** מספרים גדולים ובולטים, label קטן מתחת

## Repo: /home/pico/.openclaw/workspace/wedding-app
## Branch: feat/design/polish (מ-main)
## Build: cd frontend && npm run build
## Deploy: ~/.npm-global/bin/pm2 restart yalla-api

## מה לעשות בכל עמוד:

### 1. Landing Page (LandingView.vue)
- Hero: gradient text על "יאללה" — הוסף sparkle/glow effect
- Feature cards: הוסף hover lift + subtle gradient border
- Pricing: כרטיס ה-premium יבלוט יותר (ring, scale, badge "הכי פופולרי")
- Testimonials: הוסף avatar initials בצבע, star rating ויזואלי
- CTA section: background gradient עז, לא flat navy

### 2. Auth (Login + Register)
- Split layout: הצד הדקורטיבי — הוסף pattern/texture (CSS circles, dots, waves)
- Form fields: focus ring בורוד יפה, floating label animation
- Password strength meter (register): צבעים חדים ואנימציה חלקה
- Error state: shake animation על הform

### 3. Dashboard
- Stat cards: הוסף trend arrow (↑↓), subtle gradient background לכל כרטיס
- Countdown badge: pulse animation אם פחות מ-30 יום
- Budget progress bar: gradient fill (ורוד-לורוד כהה), animated on load
- Activity feed: avatar initials בצבע לפי שם, timestamp relative ("לפני 3 דקות")
- Quick actions: icon + label, hover scale + color tint

### 4. Budget
- Donut chart: הוסף center label (% spent), smooth stroke-dashoffset animation on load
- Category cards: gradient border בצבע הקטגוריה, hover shadow
- Add expense: modal עם backdrop blur, smooth enter animation
- Progress bars: gradient fill, label % בצד

### 5. Guests List
- Table rows: hover highlight עדין, cursor pointer
- RSVP badges: pill shape, dot indicator לפני הטקסט
- Search bar: הוסף search icon בפנים (RTL)
- Empty state: illustration (CSS/emoji) + CTA לייבוא

### 6. Guest Card
- Hero: gradient based on side (groom=blue, bride=pink, mutual=purple)
- WhatsApp button: ירוק, icon, hover glow
- RSVP quick buttons: 3 כפתורים גדולים, colored, selected state prominent

### 7. RSVP Public Page
- עמוד חגיגי — הזמנה גדולה במרכז
- Background: subtle floral/geometric pattern (CSS)
- RSVP buttons: גדולים, עגולים, עם emoji
- Confetti animation אחרי אישור (CSS keyframes)

## כללי עיצוב:
- כל animation: duration 200-400ms, ease-out
- כל hover: transform translateY(-2px) + shadow
- כל card: transition: all 220ms
- אין hardcoded colors — רק CSS vars
- Skeleton loading states בכל מקום שיש async data
- Empty states — לא blank, תמיד יש illustration + text + CTA

## אחרי כל עמוד:
git add . && git commit -m "design(<page>): polish UI, animations, hover states"

## בסוף הכל:
npm run build (0 errors)
pm2 restart yalla-api
git push origin feat/design/polish
כתוב: reports/design-report.md — מה שיפרת בכל עמוד
