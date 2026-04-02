<template>
  <div class="landing" dir="rtl">
    <!-- ── Navbar ── -->
    <nav class="lnav">
      <div class="lnav-inner">
        <RouterLink to="/" class="lnav-brand">
          <span class="brand-logo">💍</span>
          <span class="brand-name">יאללה חתונה</span>
        </RouterLink>
        <div class="lnav-links">
          <a href="#features" class="lnav-link">תכונות</a>
          <a href="#pricing" class="lnav-link">מחירים</a>
        </div>
        <div class="lnav-actions">
          <RouterLink to="/login" class="btn btn-ghost btn-sm">כניסה</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">התחלה חינמית</RouterLink>
        </div>
        <button class="mobile-menu-btn" @click="mobileMenu = !mobileMenu">☰</button>
      </div>
      <!-- Mobile menu -->
      <div class="mobile-menu" v-if="mobileMenu">
        <a href="#features" class="mobile-link" @click="mobileMenu = false">תכונות</a>
        <a href="#pricing" class="mobile-link" @click="mobileMenu = false">מחירים</a>
        <RouterLink to="/login" class="mobile-link" @click="mobileMenu = false">כניסה</RouterLink>
        <RouterLink to="/register" class="btn btn-primary" @click="mobileMenu = false" style="margin-top:8px">התחלה חינמית</RouterLink>
      </div>
    </nav>

    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-badge">✨ ניהול חתונה חכם</div>
          <h1 class="hero-h1">
            הצד הכי יפה בחתונה?<br>
            <span class="gradient-text">שאתם נהנים ממנה.</span>
          </h1>
          <p class="hero-sub">
            יאללה חתונה מרכזת את כל הניהול במקום אחד — אורחים, תקציב, הושבה,
            WhatsApp ועוד. אתם מתמקדים באהבה, אנחנו בפרטים.
          </p>
          <div class="hero-ctas">
            <RouterLink to="/register" class="btn btn-primary btn-lg">
              התחילו חינם 💕
            </RouterLink>
            <a href="#features" class="btn btn-outline btn-lg">
              גלו איך זה עובד
            </a>
          </div>
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-num">500+</span>
              <span class="stat-label">זוגות</span>
            </div>
            <div class="stat-sep" />
            <div class="stat-item">
              <span class="stat-num">50K+</span>
              <span class="stat-label">אורחים</span>
            </div>
            <div class="stat-sep" />
            <div class="stat-item">
              <span class="stat-num">4.9 ⭐</span>
              <span class="stat-label">דירוג</span>
            </div>
          </div>
        </div>

        <!-- Hero visual -->
        <div class="hero-visual">
          <div class="hero-mockup">
            <div class="mockup-topbar">
              <span class="mockup-dot red" />
              <span class="mockup-dot yellow" />
              <span class="mockup-dot green" />
            </div>
            <div class="mockup-body">
              <div class="mockup-sidebar">
                <div v-for="item in mockNavItems" :key="item" class="mockup-nav-item" :class="{ active: item === mockNavItems[0] }">
                  <span class="mockup-dot-small" />
                  <div class="mockup-nav-line" />
                </div>
              </div>
              <div class="mockup-content">
                <div class="mockup-header-row">
                  <div class="mockup-title-block">
                    <div class="mockup-line w70 dark" />
                    <div class="mockup-line w40 muted" />
                  </div>
                </div>
                <div class="mockup-cards-grid">
                  <div class="mockup-card pink">
                    <div class="mockup-card-icon">👥</div>
                    <div class="mockup-line w60 white" />
                    <div class="mockup-line w40 white-muted" />
                  </div>
                  <div class="mockup-card navy">
                    <div class="mockup-card-icon">💰</div>
                    <div class="mockup-line w60 white" />
                    <div class="mockup-line w40 white-muted" />
                  </div>
                  <div class="mockup-card purple">
                    <div class="mockup-card-icon">🪑</div>
                    <div class="mockup-line w60 white" />
                    <div class="mockup-line w40 white-muted" />
                  </div>
                  <div class="mockup-card green">
                    <div class="mockup-card-icon">✅</div>
                    <div class="mockup-line w60 white" />
                    <div class="mockup-line w40 white-muted" />
                  </div>
                </div>
                <div class="mockup-table">
                  <div class="mockup-table-row header">
                    <div class="mockup-line w25 muted" />
                    <div class="mockup-line w20 muted" />
                    <div class="mockup-line w15 muted" />
                  </div>
                  <div v-for="i in 4" :key="i" class="mockup-table-row">
                    <div class="mockup-line w35 dark" />
                    <div class="mockup-line w20 muted" />
                    <div class="mockup-chip" :class="chipColors[i-1]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Floating badges -->
          <div class="float-badge badge-guests">
            <span>🎉</span>
            <div>
              <div class="fb-num">312</div>
              <div class="fb-label">אורחים אישרו</div>
            </div>
          </div>
          <div class="float-badge badge-whatsapp">
            <span>💬</span>
            <div>
              <div class="fb-num">הזמנות נשלחו</div>
              <div class="fb-label">100% פתיחה</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section class="features" id="features">
      <div class="section-inner">
        <div class="section-badge">🛠️ תכונות</div>
        <h2 class="section-h2">כל מה שצריך לחתונה מושלמת</h2>
        <p class="section-sub">מהאורח הראשון ועד ריקוד החתן — הכל במקום אחד</p>

        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-card card card-hover">
            <div class="card-body">
              <div class="feature-icon" :style="{ background: feature.bg }">{{ feature.icon }}</div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.desc }}</p>
              <ul class="feature-bullets">
                <li v-for="b in feature.bullets" :key="b">✓ {{ b }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ── -->
    <section class="how-it-works">
      <div class="section-inner">
        <div class="section-badge">🚀 איך זה עובד</div>
        <h2 class="section-h2">שלושה צעדים לחתונה מנוהלת</h2>
        <div class="steps-row">
          <div v-for="(step, i) in steps" :key="i" class="step-item">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-icon">{{ step.icon }}</div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
          <div class="step-arrow">←</div>
          <div class="step-arrow second">←</div>
        </div>
      </div>
    </section>

    <!-- ── Pricing ── -->
    <section class="pricing" id="pricing">
      <div class="section-inner">
        <div class="section-badge">💎 מחירים</div>
        <h2 class="section-h2">תכנית שמתאימה לכם</h2>
        <p class="section-sub">מתחילים בחינם, משדרגים כשרוצים</p>

        <div class="pricing-grid">
          <div class="pricing-card card" v-for="plan in plans" :key="plan.name" :class="{ featured: plan.featured }">
            <div class="card-body">
              <div class="plan-badge" v-if="plan.featured">הכי פופולרי 🔥</div>
              <div class="plan-name">{{ plan.name }}</div>
              <div class="plan-price">
                <span class="price-num">{{ plan.price }}</span>
                <span class="price-period" v-if="plan.period">{{ plan.period }}</span>
              </div>
              <p class="plan-desc">{{ plan.desc }}</p>
              <ul class="plan-features">
                <li v-for="f in plan.features" :key="f" class="plan-feature">
                  <span class="feature-check">✓</span> {{ f }}
                </li>
              </ul>
              <RouterLink :to="plan.featured ? '/register' : '/register'" class="btn w-full" :class="plan.featured ? 'btn-primary' : 'btn-outline'">
                {{ plan.cta }}
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ── -->
    <section class="testimonials">
      <div class="section-inner">
        <div class="section-badge">💬 ביקורות</div>
        <h2 class="section-h2">מה הזוגות אומרים</h2>
        <div class="reviews-grid">
          <div v-for="review in reviews" :key="review.name" class="review-card card">
            <div class="card-body">
              <div class="review-stars">⭐⭐⭐⭐⭐</div>
              <p class="review-text">"{{ review.text }}"</p>
              <div class="reviewer">
                <div class="reviewer-avatar">{{ review.initials }}</div>
                <div>
                  <div class="reviewer-name">{{ review.name }}</div>
                  <div class="reviewer-date">{{ review.date }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA banner ── -->
    <section class="cta-banner">
      <div class="section-inner text-center">
        <h2 class="cta-h2">מוכנים להתחיל לתכנן?</h2>
        <p class="cta-sub">הצטרפו ל-500+ זוגות שמנהלים את החתונה שלהם עם יאללה</p>
        <div class="cta-btns">
          <RouterLink to="/register" class="btn btn-primary btn-lg">
            התחלה חינמית — ללא כרטיס אשראי 💕
          </RouterLink>
        </div>
        <p class="cta-note">ניסיון חינמי מלא. אין צורך בכרטיס אשראי.</p>
      </div>
    </section>

    <!-- ── Footer ── -->
    <footer class="lfoot">
      <div class="lfoot-inner">
        <div class="lfoot-brand">
          <span class="brand-logo">💍</span>
          <span class="brand-name">יאללה חתונה</span>
        </div>
        <p class="lfoot-tagline">ניהול חתונה חכם לזוגות ישראלים</p>
        <div class="lfoot-links">
          <a href="/privacy" class="lfoot-link">פרטיות</a>
          <a href="/terms" class="lfoot-link">תנאים</a>
          <RouterLink to="/login" class="lfoot-link">כניסה</RouterLink>
          <RouterLink to="/register" class="lfoot-link">הרשמה</RouterLink>
        </div>
        <p class="lfoot-copy">© 2026 יאללה חתונה. כל הזכויות שמורות.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenu = ref(false)

const mockNavItems = ['dashboard', 'guests', 'budget', 'seating', 'whatsapp']
const chipColors = ['chip-green', 'chip-green', 'chip-orange', 'chip-red']

const features = [
  {
    icon: '👥',
    title: 'ניהול אורחים',
    desc: 'רשימת אורחים מלאה עם RSVP דיגיטלי, סינון, חיפוש, ייבוא מאקסל.',
    bg: 'rgba(233,30,140,0.1)',
    bullets: ['RSVP אוטומטי בלינק אישי', 'ייבוא מ-Excel', 'סטטיסטיקות אורחים', 'קבוצות משפחה']
  },
  {
    icon: '💰',
    title: 'ניהול תקציב',
    desc: 'עקבו אחרי כל הוצאה, ראו סטטוס חריגה בזמן אמת.',
    bg: 'rgba(26,31,54,0.08)',
    bullets: ['קטגוריות מותאמות אישית', 'גרפים ואנליטיקה', 'מעקב ספקים', 'ייצוא PDF']
  },
  {
    icon: '💬',
    title: 'WhatsApp חכם',
    desc: 'שלחו הזמנות, תזכורות ועדכונים ישירות דרך WhatsApp.',
    bg: 'rgba(34,197,94,0.1)',
    bullets: ['תבניות מותאמות', 'שליחה מרובה', 'היסטוריית הודעות', 'תזמון הודעות']
  },
  {
    icon: '🪑',
    title: 'סידורי הושבה',
    desc: 'גרור ושחרר שולחנות, שבצו אורחים ויצרו כרטיסי הושבה יפים.',
    bg: 'rgba(59,130,246,0.1)',
    bullets: ['תצוגת אולם אינטראקטיבית', 'ייצוא כרטיסים ל-PDF', 'עיצובים מוכנים', 'גרירה ושחרור']
  },
  {
    icon: '🎁',
    title: 'מעקב מתנות',
    desc: 'רשמו מתנות, עקבו אחרי מי נתן מה, ראו סכומים.',
    bg: 'rgba(245,158,11,0.1)',
    bullets: ['רישום בזמן אמת', 'סטטיסטיקות מתנות', 'ייצוא לאקסל', 'מתנות לפי קבוצה']
  },
  {
    icon: '🏪',
    title: 'ספקים',
    desc: 'מצאו ספקים מומלצים, השוו, שמרו מועדפים.',
    bg: 'rgba(168,85,247,0.1)',
    bullets: ['ספריית ספקים', 'ביקורות ודירוגים', 'ניהול חוזים', 'תקציב לספקים']
  }
]

const steps = [
  {
    icon: '📝',
    title: 'נרשמים',
    desc: 'פותחים חשבון חינם בשלוש שניות — ללא כרטיס אשראי.'
  },
  {
    icon: '🎯',
    title: 'מגדירים',
    desc: 'מוסיפים תאריך, מיקום, תקציב ומתחילים להוסיף אורחים.'
  },
  {
    icon: '💕',
    title: 'נהנים',
    desc: 'יאללה מנהלת הכל — אתם פשוט נהנים מהדרך.'
  }
]

const plans = [
  {
    name: 'חינמי',
    price: '₪0',
    period: '/ תמיד',
    desc: 'לזוגות שמתחילים לתכנן',
    cta: 'התחלה חינמית',
    featured: false,
    features: [
      'עד 100 אורחים',
      'ניהול תקציב בסיסי',
      'RSVP דיגיטלי',
      '1 תבנית WhatsApp',
      'סידורי הושבה'
    ]
  },
  {
    name: 'פרמיום',
    price: '₪59',
    period: '/ חודש',
    desc: 'לחתונה ללא פשרות',
    cta: 'נסו פרמיום',
    featured: true,
    features: [
      'אורחים ללא הגבלה',
      'ניהול תקציב מתקדם',
      'WhatsApp ללא הגבלה',
      'כרטיסי הושבה פרמיום',
      'ייצוא PDF מותאם',
      'ספריית ספקים מלאה',
      'ציר זמן אוטומטי',
      'תמיכה מועדפת'
    ]
  }
]

const reviews = [
  {
    name: 'נועה ואיתי כהן',
    initials: 'נא',
    date: 'מרץ 2026',
    text: 'ניהלנו 250 אורחים ו-12 ספקים בלי לאבד את השפיות. יאללה חתונה הצילה אותנו!'
  },
  {
    name: 'מיכל ורון לוי',
    initials: 'מר',
    date: 'פברואר 2026',
    text: 'שליחת הזמנות בWhatsApp ב-10 דקות לכל האורחים. מדהים, מהפכה גמורה.'
  },
  {
    name: 'שירה ואלון דוד',
    initials: 'שא',
    date: 'ינואר 2026',
    text: 'סידורי ההושבה הדיגיטליים חסכו לנו שעות של עבודה. ממליצים בחום!'
  }
]
</script>

<style scoped>
/* ── Base ── */
.landing {
  direction: rtl;
  background: var(--color-bg);
  overflow-x: hidden;
}

/* ── Navbar ── */
.lnav {
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
}

.lnav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  height: 64px;
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.lnav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 800;
  font-size: var(--font-size-xl);
  color: var(--color-navy);
  text-decoration: none;
}

.brand-logo { font-size: 1.5rem; }
.brand-name { color: var(--color-navy); }

.lnav-links {
  display: flex;
  gap: var(--space-6);
  flex: 1;
}

.lnav-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
  text-decoration: none;
}

.lnav-link:hover { color: var(--color-navy); }

.lnav-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.mobile-menu-btn {
  display: none;
  font-size: 1.3rem;
  cursor: pointer;
  background: none;
  border: none;
  margin-right: auto;
}

.mobile-menu {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mobile-link {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

/* ── Shared section layout ── */
.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 6px var(--space-4);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-4);
  letter-spacing: 0.03em;
}

.section-h2 {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
  line-height: 1.2;
}

.section-sub {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin-bottom: var(--space-12);
  max-width: 560px;
}

/* ── Hero ── */
.hero {
  background: linear-gradient(160deg, var(--color-primary-bg) 0%, #fff 60%);
  padding: var(--space-20) 0 var(--space-16);
  overflow: hidden;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-16);
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  padding: 6px var(--space-4);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-5);
}

.hero-h1 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1.15;
  margin-bottom: var(--space-5);
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary) 0%, #ff6bca 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: var(--space-8);
  max-width: 500px;
}

.hero-ctas {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-8);
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.stat-sep {
  width: 1px;
  height: 36px;
  background: var(--color-border);
}

/* ── Hero Mockup ── */
.hero-visual {
  position: relative;
}

.hero-mockup {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.mockup-topbar {
  background: #f0f0f3;
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  gap: 6px;
  border-bottom: 1px solid var(--color-border);
}

.mockup-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.mockup-dot.red { background: #ff5f57; }
.mockup-dot.yellow { background: #ffbd2e; }
.mockup-dot.green { background: #28c840; }

.mockup-body {
  display: flex;
  min-height: 320px;
}

.mockup-sidebar {
  width: 52px;
  background: var(--color-navy);
  padding: var(--space-3) var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mockup-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: 6px;
}

.mockup-nav-item.active { background: rgba(233,30,140,0.2); }

.mockup-dot-small {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  flex-shrink: 0;
}

.mockup-nav-item.active .mockup-dot-small { background: var(--color-primary); }

.mockup-nav-line {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.12);
}

.mockup-nav-item.active .mockup-nav-line { background: rgba(255,255,255,0.3); }

.mockup-content {
  flex: 1;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mockup-header-row {
  margin-bottom: var(--space-2);
}

.mockup-title-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mockup-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mockup-card {
  padding: 10px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mockup-card.pink { background: linear-gradient(135deg, #e91e8c, #ff6bca); }
.mockup-card.navy { background: linear-gradient(135deg, #1a1f36, #2d3454); }
.mockup-card.purple { background: linear-gradient(135deg, #7c3aed, #a855f7); }
.mockup-card.green { background: linear-gradient(135deg, #16a34a, #22c55e); }

.mockup-card-icon { font-size: 1.1rem; }

.mockup-table {
  background: var(--color-bg-subtle);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.mockup-table-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border);
}

.mockup-table-row:last-child { border-bottom: none; }
.mockup-table-row.header { opacity: 0.5; }

.mockup-chip {
  width: 48px;
  height: 16px;
  border-radius: var(--radius-full);
}

.chip-green { background: var(--color-success-bg); }
.chip-orange { background: var(--color-warning-bg); }
.chip-red { background: var(--color-error-bg); }

.mockup-line {
  height: 8px;
  border-radius: var(--radius-full);
}

.mockup-line.w15 { width: 15%; }
.mockup-line.w20 { width: 20%; }
.mockup-line.w25 { width: 25%; }
.mockup-line.w35 { width: 35%; }
.mockup-line.w40 { width: 40%; }
.mockup-line.w60 { width: 60%; }
.mockup-line.w70 { width: 70%; }
.mockup-line.dark { background: var(--color-navy); opacity: 0.7; }
.mockup-line.muted { background: var(--color-border); }
.mockup-line.white { background: rgba(255,255,255,0.9); }
.mockup-line.white-muted { background: rgba(255,255,255,0.4); }

/* ── Floating badges ── */
.float-badge {
  position: absolute;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 1.2rem;
  animation: float 3s ease-in-out infinite;
}

.badge-guests {
  bottom: -20px;
  right: -20px;
  animation-delay: 0s;
}

.badge-whatsapp {
  top: -16px;
  left: -16px;
  animation-delay: 1.5s;
}

.fb-num {
  font-size: var(--font-size-sm);
  font-weight: 800;
  color: var(--color-navy);
}

.fb-label {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 600;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* ── Features ── */
.features {
  padding: var(--space-20) 0;
  background: var(--color-bg-card);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.feature-card { height: 100%; }

.feature-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: var(--space-4);
}

.feature-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-2);
}

.feature-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: var(--space-4);
}

.feature-bullets {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feature-bullets li {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.feature-bullets li::marker { display: none; }

/* ── How it works ── */
.how-it-works {
  padding: var(--space-20) 0;
  background: linear-gradient(160deg, #f0e6ff 0%, var(--color-primary-bg) 100%);
}

.steps-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
  position: relative;
}

.step-item {
  text-align: center;
  padding: var(--space-8);
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.step-num {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--font-size-sm);
  margin: 0 auto var(--space-4);
}

.step-icon {
  font-size: 2.5rem;
  margin-bottom: var(--space-4);
}

.step-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}

.step-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.step-arrow {
  display: none;
}

/* ── Pricing ── */
.pricing {
  padding: var(--space-20) 0;
  background: var(--color-bg);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}

.pricing-card {
  position: relative;
  transition: transform var(--transition);
}

.pricing-card.featured {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-pink);
  transform: scale(1.02);
}

.plan-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 4px var(--space-4);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.plan-name {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-2);
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.price-num {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: var(--color-navy);
}

.price-period {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 600;
}

.plan-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.plan-feature {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  display: flex;
  gap: var(--space-2);
}

.feature-check {
  color: var(--color-success);
  font-weight: 700;
  flex-shrink: 0;
}

.w-full { width: 100%; }

/* ── Testimonials ── */
.testimonials {
  padding: var(--space-20) 0;
  background: var(--color-bg-card);
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.review-stars {
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-3);
}

.review-text {
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: 1.7;
  margin-bottom: var(--space-5);
  font-style: italic;
}

.reviewer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--color-primary), #ff6bca);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: var(--font-size-sm);
  color: #fff;
  flex-shrink: 0;
}

.reviewer-name {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-navy);
}

.reviewer-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── CTA Banner ── */
.cta-banner {
  padding: var(--space-20) 0;
  background: linear-gradient(135deg, var(--color-navy) 0%, #2d3454 100%);
}

.text-center { text-align: center; }

.cta-h2 {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: #fff;
  margin-bottom: var(--space-4);
}

.cta-sub {
  font-size: var(--font-size-lg);
  color: rgba(255,255,255,0.7);
  margin-bottom: var(--space-8);
}

.cta-btns {
  margin-bottom: var(--space-4);
}

.cta-note {
  font-size: var(--font-size-sm);
  color: rgba(255,255,255,0.4);
}

/* ── Footer ── */
.lfoot {
  background: var(--color-navy);
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: var(--space-10) 0;
}

.lfoot-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.lfoot-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.lfoot-brand .brand-name {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: #fff;
}

.lfoot-tagline {
  font-size: var(--font-size-sm);
  color: rgba(255,255,255,0.4);
}

.lfoot-links {
  display: flex;
  gap: var(--space-6);
}

.lfoot-link {
  font-size: var(--font-size-sm);
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.lfoot-link:hover { color: #fff; }

.lfoot-copy {
  font-size: var(--font-size-xs);
  color: rgba(255,255,255,0.25);
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: var(--space-10);
  }

  .hero-visual {
    order: -1;
  }

  .hero-h1 {
    font-size: var(--font-size-3xl);
  }

  .features-grid,
  .steps-row,
  .reviews-grid {
    grid-template-columns: 1fr;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-card.featured {
    transform: none;
  }

  .lnav-links,
  .lnav-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .section-h2 {
    font-size: var(--font-size-3xl);
  }

  .cta-h2 {
    font-size: var(--font-size-3xl);
  }
}
</style>
