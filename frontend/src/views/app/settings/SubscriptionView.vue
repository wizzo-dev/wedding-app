<template>
  <div class="settings-view" dir="rtl">
    <header class="page-header"><div><h1 class="page-title">⚙️ הגדרות</h1><p class="page-subtitle">ניהול מנוי</p></div></header>
    <div class="settings-tabs">
      <router-link to="/app/settings" class="tab-link" exact-active-class="active">👫 פרופיל</router-link>
      <router-link to="/app/settings/account" class="tab-link" active-class="active">🔒 חשבון</router-link>
      <router-link to="/app/settings/subscription" class="tab-link active">💎 מנוי</router-link>
    </div>
    <div class="plan-card" :class="plan">
      <div class="plan-header">
        <div class="plan-icon">{{ plan==='premium'?'👑':'🆓' }}</div>
        <div><h2 class="plan-name">{{ plan==='premium'?'פרמיום':'חינמי' }}</h2><p class="plan-sub">{{ plan==='premium'?'גישה מלאה לכל הפיצ׳רים':'גישה בסיסית' }}</p></div>
        <span class="plan-badge" :class="plan">{{ plan==='premium'?'✓ פעיל':'חינמי' }}</span>
      </div>
    </div>
    <div class="features-section">
      <h3 class="features-title">מה כלול?</h3>
      <div class="features-grid">
        <div class="feat-card free">
          <h4 class="feat-plan-name">🆓 חינמי</h4>
          <ul class="feat-list">
            <li v-for="f in freeFeatures" :key="f" class="feat-item included">✓ {{ f }}</li>
          </ul>
        </div>
        <div class="feat-card premium" :class="{current:plan==='premium'}">
          <div v-if="plan!=='premium'" class="popular-badge">⭐ הכי פופולרי</div>
          <h4 class="feat-plan-name">👑 פרמיום</h4>
          <ul class="feat-list">
            <li v-for="f in freeFeatures" :key="f" class="feat-item included">✓ {{ f }}</li>
            <li v-for="f in premiumFeatures" :key="f" class="feat-item premium-only">💎 {{ f }}</li>
          </ul>
          <div class="feat-price">₪99 לחודש</div>
        </div>
      </div>
    </div>
    <div v-if="plan!=='premium'" class="upgrade-section">
      <h3 class="upgrade-title">🚀 שדרג לפרמיום!</h3>
      <p class="upgrade-sub">גישה מלאה לכל הכלים לחתונה המושלמת</p>
      <a :href="upgradeLink" target="_blank" class="btn-upgrade">💬 שדרג עכשיו בוואטסאפ</a>
    </div>
    <div v-else class="premium-active">👑 אתם נהנים מפרמיום! תודה.</div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const plan = ref('free')
const upgradeLink = 'https://wa.me/972545852206?text=%D7%94%D7%99%D7%99%2C+%D7%A8%D7%95%D7%A6%D7%94+%D7%9C%D7%A9%D7%93%D7%A8%D7%92+%D7%9C%D7%99%D7%90%D7%9C%D7%94+%D7%A4%D7%A8%D7%9E%D7%99%D7%95%D7%9D'
const freeFeatures = ['ניהול אורחים (עד 150)','מעקב RSVP','תקציב בסיסי','משימות ולוח זמנים','ספקים']
const premiumFeatures = ['אורחים ללא הגבלה','שליחת WhatsApp','עיצוב הזמנה דיגיטלית','סידור הושבה','סטטיסטיקות מתקדמות','תמיכה אישית']
async function load() { try { const res=await fetch('/api/users/profile',{headers:{Authorization:`Bearer ${auth.token}`}}); const data=await res.json(); plan.value=data.plan||'free' } catch {} }
onMounted(load)
</script>
<style scoped>
.settings-view{max-width:700px;margin:0 auto;padding:var(--space-6);}
.page-header{margin-bottom:var(--space-5);}
.page-title{font-size:var(--font-size-2xl);font-weight:800;color:var(--color-navy);margin:0 0 4px;}
.page-subtitle{color:var(--color-text-muted);font-size:var(--font-size-sm);margin:0;}
.settings-tabs{display:flex;gap:var(--space-2);border-bottom:2px solid var(--color-border);margin-bottom:var(--space-6);}
.tab-link{display:block;padding:var(--space-3) var(--space-4);font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-muted);text-decoration:none;border-bottom:2px solid transparent;margin-bottom:-2px;}
.tab-link:hover{color:var(--color-navy);}
.tab-link.active{color:var(--color-primary);border-bottom-color:var(--color-primary);}
.plan-card{background:var(--color-bg-card);border-radius:var(--radius-xl);padding:var(--space-5);box-shadow:var(--shadow-sm);margin-bottom:var(--space-6);border:2px solid var(--color-border);}
.plan-card.premium{border-color:var(--color-primary);}
.plan-header{display:flex;align-items:center;gap:var(--space-4);}
.plan-icon{font-size:2.5rem;}
.plan-name{font-size:var(--font-size-xl);font-weight:900;color:var(--color-navy);margin:0 0 2px;}
.plan-sub{font-size:var(--font-size-sm);color:var(--color-text-muted);margin:0;}
.plan-badge{margin-right:auto;padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);font-size:var(--font-size-xs);font-weight:700;}
.plan-badge.premium{background:var(--color-primary);color:#fff;}
.plan-badge.free{background:var(--color-bg-subtle);color:var(--color-text-muted);}
.features-section{margin-bottom:var(--space-6);}
.features-title{font-size:var(--font-size-lg);font-weight:800;color:var(--color-navy);margin:0 0 var(--space-4);}
.features-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);}
.feat-card{background:var(--color-bg-card);border-radius:var(--radius-xl);padding:var(--space-5);box-shadow:var(--shadow-sm);border:2px solid var(--color-border);position:relative;}
.feat-card.premium{border-color:var(--color-primary);}
.popular-badge{position:absolute;top:-12px;right:50%;transform:translateX(50%);background:var(--color-primary);color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:var(--radius-full);white-space:nowrap;}
.feat-plan-name{font-size:var(--font-size-base);font-weight:800;color:var(--color-navy);margin:0 0 var(--space-3);}
.feat-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--space-2);}
.feat-item{font-size:var(--font-size-xs);color:var(--color-navy);}
.feat-item.premium-only{color:var(--color-primary);font-weight:600;}
.feat-price{margin-top:var(--space-4);font-size:var(--font-size-sm);font-weight:700;color:var(--color-primary);border-top:1px solid var(--color-border);padding-top:var(--space-3);}
.upgrade-section{background:linear-gradient(135deg,var(--color-primary) 0%,#9d174d 100%);border-radius:var(--radius-xl);padding:var(--space-6);text-align:center;color:#fff;}
.upgrade-title{font-size:var(--font-size-xl);font-weight:900;margin:0 0 var(--space-2);}
.upgrade-sub{margin:0 0 var(--space-5);opacity:.9;font-size:var(--font-size-sm);}
.btn-upgrade{display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-3) var(--space-6);background:#fff;color:var(--color-primary);border-radius:var(--radius-full);font-family:var(--font);font-size:var(--font-size-base);font-weight:800;text-decoration:none;}
.btn-upgrade:hover{transform:translateY(-2px);}
.premium-active{background:var(--color-success-bg);color:#065f46;border-radius:var(--radius-xl);padding:var(--space-5);text-align:center;font-weight:700;}
@media(max-width:560px){.settings-view{padding:var(--space-4);}.features-grid{grid-template-columns:1fr;}}
</style>