<template>
  <div class="subscription-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">מנוי ותוכנית 👑</h1>
        <p class="page-sub">בחרו את התוכנית המתאימה לחתונת חלומותיכם</p>
      </div>
    </div>

    <!-- Sub-nav -->
    <div class="subnav">
      <router-link to="/app/settings" class="subnav-link" active-class="active" exact>🎉 פרטי החתונה</router-link>
      <router-link to="/app/settings/account" class="subnav-link" active-class="active">🔐 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="subnav-link" active-class="active">👑 מנוי</router-link>
    </div>

    <!-- Current plan banner -->
    <div class="current-plan-banner" :class="isPremium ? 'banner-premium' : 'banner-free'">
      <div class="banner-icon">{{ isPremium ? '👑' : '🆓' }}</div>
      <div class="banner-content">
        <div class="banner-label">התוכנית הנוכחית שלכם</div>
        <div class="banner-plan">{{ isPremium ? 'פרמיום' : 'חינמי' }}</div>
        <div class="banner-desc" v-if="!isPremium">שדרגו לפרמיום ותיהנו מכל הפיצ'רים ללא הגבלה</div>
        <div class="banner-desc" v-else>אתם נהנים מגישה מלאה לכל הפיצ'רים! 🎊</div>
      </div>
      <div v-if="isPremium" class="banner-badge">פעיל</div>
    </div>

    <!-- Plans grid -->
    <div class="plans-grid">

      <!-- Free Plan -->
      <div class="plan-card card" :class="{ 'plan-current': !isPremium }">
        <div class="card-body">
          <div class="plan-header">
            <div class="plan-icon">🆓</div>
            <div class="plan-name">חינמי</div>
            <div class="plan-price">
              <span class="price-amount">₪0</span>
              <span class="price-period">לתמיד</span>
            </div>
            <p class="plan-tagline">כל מה שצריך כדי להתחיל</p>
          </div>

          <ul class="feature-list">
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>עד 150 אורחים</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>ניהול תקציב בסיסי</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>ספר הכנסות מתנות</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>לוח יום האירוע</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>תבנית הזמנה אחת</span>
            </li>
            <li class="feature-item excluded">
              <span class="feat-icon">—</span>
              <span>WhatsApp בלתי מוגבל</span>
            </li>
            <li class="feature-item excluded">
              <span class="feat-icon">—</span>
              <span>ייצוא לאקסל / PDF</span>
            </li>
            <li class="feature-item excluded">
              <span class="feat-icon">—</span>
              <span>מפת ישיבה מתקדמת</span>
            </li>
            <li class="feature-item excluded">
              <span class="feat-icon">—</span>
              <span>תמיכה עדיפות</span>
            </li>
          </ul>

          <div v-if="!isPremium" class="plan-cta">
            <div class="current-badge">התוכנית שלכם</div>
          </div>
          <div v-else class="plan-cta">
            <button class="btn btn-outline" disabled>תוכנית קיימת</button>
          </div>
        </div>
      </div>

      <!-- Premium Plan -->
      <div class="plan-card plan-featured card" :class="{ 'plan-current': isPremium }">
        <div class="plan-ribbon">הכי פופולרי</div>
        <div class="card-body">
          <div class="plan-header">
            <div class="plan-icon">👑</div>
            <div class="plan-name plan-name-premium">פרמיום</div>
            <div class="plan-price">
              <span class="price-amount">₪199</span>
              <span class="price-period">חד-פעמי</span>
            </div>
            <p class="plan-tagline">הכל כלול — ללא הגבלות</p>
          </div>

          <ul class="feature-list">
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>אורחים ללא הגבלה</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>ניהול תקציב מלא</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>ספר הכנסות מתנות</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>לוח יום האירוע</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>כל תבניות ההזמנות</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>WhatsApp בלתי מוגבל</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>ייצוא לאקסל / PDF</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>מפת ישיבה מתקדמת</span>
            </li>
            <li class="feature-item included">
              <span class="feat-icon">✅</span>
              <span>תמיכה עדיפות 24/7</span>
            </li>
          </ul>

          <div class="plan-cta">
            <div v-if="isPremium" class="current-badge current-badge-premium">התוכנית שלכם ✓</div>
            <button v-else class="btn btn-primary btn-upgrade" @click="showUpgradeModal = true">
              👑 שדרגו עכשיו
            </button>
            <p v-if="!isPremium" class="cta-note">תשלום חד-פעמי, גישה לכל החיים</p>
          </div>
        </div>
      </div>

    </div>

    <!-- FAQ -->
    <div class="faq-section">
      <h2 class="faq-title">שאלות נפוצות</h2>
      <div class="faq-list">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="faq-item card"
          @click="toggleFaq(idx)"
        >
          <div class="faq-question">
            <span>{{ faq.q }}</span>
            <span class="faq-arrow" :class="{ open: openFaq === idx }">›</span>
          </div>
          <div class="faq-answer" v-show="openFaq === idx">{{ faq.a }}</div>
        </div>
      </div>
    </div>

    <!-- Upgrade Modal (stub) -->
    <teleport to="body">
      <div v-if="showUpgradeModal" class="modal-overlay" @click.self="showUpgradeModal = false">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3>👑 שדרוג לפרמיום</h3>
            <button class="modal-close" @click="showUpgradeModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="upgrade-illustration">💍</div>
            <p class="upgrade-text">
              אנחנו עובדים על מערכת תשלומים מאובטחת!<br/>
              בינתיים, צרו איתנו קשר לשדרוג ידני.
            </p>
            <div class="upgrade-contact">
              <a href="mailto:support@yallawedding.co.il" class="btn btn-primary">
                📧 צרו קשר לשדרוג
              </a>
              <a href="https://wa.me/972500000000" target="_blank" class="btn btn-whatsapp">
                💬 WhatsApp
              </a>
            </div>
            <p class="upgrade-note">
              התשלום החד-פעמי הוא ₪199 בלבד, עם גישה לצמיתות לכל הפיצ'רים.
            </p>
          </div>
        </div>
      </div>
    </teleport>

  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const isPremium = computed(() => auth.user?.plan === 'premium')
const showUpgradeModal = ref(false)
const openFaq = ref(null)

const faqs = [
  {
    q: 'האם ניתן לשדרג בכל שלב?',
    a: 'כן! ניתן לשדרג מהתוכנית החינמית לפרמיום בכל זמן, וכל הנתונים שלכם נשמרים.'
  },
  {
    q: 'מה ההבדל בין חינמי לפרמיום?',
    a: 'התוכנית החינמית מספיקה לאירועים קטנים עם עד 150 אורחים. הפרמיום מסיר את כל ההגבלות ומוסיף פיצ\'רים מתקדמים כמו WhatsApp ללא הגבלה, ייצוא לאקסל ו-PDF, ותמיכה עדיפות.'
  },
  {
    q: 'האם יש עלות חודשית?',
    a: 'לא! הפרמיום הוא תשלום חד-פעמי של ₪199 בלבד, וגישה לכל החיים — גם לעדכונים עתידיים.'
  },
  {
    q: 'האם יש ביטול עסקה?',
    a: 'כן, ניתן לבקש החזר כספי מלא תוך 14 ימים מהרכישה, ללא שאלות.'
  }
]

function toggleFaq(idx) {
  openFaq.value = openFaq.value === idx ? null : idx
}
</script>
<style scoped>
.subscription-view {
  padding: var(--space-6);
  max-width: 860px;
}

/* Header */
.page-header { margin-bottom: var(--space-5); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: 4px; }

/* Sub-nav */
.subnav {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-6);
  overflow-x: auto;
}
.subnav-link {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  text-decoration: none;
}
.subnav-link:hover { color: var(--color-navy); }
.subnav-link.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

/* Current plan banner */
.current-plan-banner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-6);
  border: 2px solid;
}
.banner-free {
  background: linear-gradient(135deg, var(--color-bg-subtle), #fff);
  border-color: var(--color-border);
}
.banner-premium {
  background: linear-gradient(135deg, #fdf4ff, #fce7f3);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-pink);
}
.banner-icon { font-size: 2.5rem; flex-shrink: 0; }
.banner-content { flex: 1; }
.banner-label { font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.banner-plan { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); }
.banner-premium .banner-plan { color: var(--color-primary); }
.banner-desc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: 4px; }
.banner-badge {
  background: var(--color-primary);
  color: #fff;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

/* Plans grid */
.plans-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}

.plan-card {
  position: relative;
  overflow: hidden;
  transition: transform var(--transition);
}
.plan-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}
.plan-current {
  border-color: var(--color-primary) !important;
}
.plan-featured {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-pink);
}

.plan-ribbon {
  position: absolute;
  top: 18px;
  left: -30px;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 40px;
  transform: rotate(-45deg);
  white-space: nowrap;
}

.plan-header {
  text-align: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.plan-icon { font-size: 2rem; margin-bottom: var(--space-2); }
.plan-name {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-2);
}
.plan-name-premium { color: var(--color-primary); }
.plan-price {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  justify-content: center;
  margin-bottom: var(--space-2);
}
.price-amount {
  font-size: var(--font-size-4xl);
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1;
}
.price-period {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}
.plan-tagline {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
}
.feature-item.included { color: var(--color-navy); }
.feature-item.excluded { color: var(--color-text-muted); text-decoration: line-through; opacity: 0.6; }
.feat-icon { font-size: 15px; flex-shrink: 0; width: 20px; text-align: center; }

/* CTA */
.plan-cta { text-align: center; }
.current-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-3) var(--space-6);
  background: var(--color-bg-subtle);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-muted);
}
.current-badge-premium {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.cta-note {
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 11px var(--space-6);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all var(--transition);
  font-family: var(--font);
  text-decoration: none;
  white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-2px); }
.btn-outline { background: transparent; color: var(--color-text-muted); border: 1.5px solid var(--color-border); cursor: default; }
.btn-upgrade { width: 100%; font-size: var(--font-size-base); padding: 14px var(--space-8); }
.btn-whatsapp { background: #25d366; color: #fff; }
.btn-whatsapp:hover { background: #1da851; }

/* FAQ */
.faq-section { margin-top: var(--space-4); }
.faq-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  margin-bottom: var(--space-4);
}
.faq-list { display: flex; flex-direction: column; gap: var(--space-3); }
.faq-item {
  padding: 0;
  cursor: pointer;
  transition: transform var(--transition);
}
.faq-item:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  font-weight: 600;
  color: var(--color-navy);
  font-size: var(--font-size-sm);
  gap: var(--space-4);
}
.faq-arrow {
  font-size: 1.4rem;
  color: var(--color-primary);
  transition: transform var(--transition);
  flex-shrink: 0;
}
.faq-arrow.open { transform: rotate(90deg); }
.faq-answer {
  padding: 0 var(--space-5) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.7;
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}
.modal {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 100%;
  max-width: 460px;
  box-shadow: var(--shadow-xl);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-5);
}
.modal-header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close {
  background: none; border: none; font-size: 18px; cursor: pointer;
  color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--color-bg-subtle); }
.modal-body { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); text-align: center; }

.upgrade-illustration { font-size: 4rem; }
.upgrade-text {
  font-size: var(--font-size-base);
  color: var(--color-navy);
  line-height: 1.7;
}
.upgrade-contact { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; width: 100%; }
.upgrade-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .subscription-view { padding: var(--space-4); }
  .plans-grid { grid-template-columns: 1fr; }
  .current-plan-banner { flex-direction: column; text-align: center; }
}
</style>
