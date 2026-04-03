<template>
  <div class="payment-view fade-in" dir="rtl">

    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">תוכניות ומנוי 👑</h1>
      <p class="page-sub">בחרו את התוכנית שמתאימה לכם הכי טוב</p>
      <div class="demo-banner">
        🔒 מצב דמו — לא יבוצע חיוב אמיתי
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען תוכניות...</p>
    </div>

    <template v-else>
      <!-- Plans Grid -->
      <div class="plans-grid">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="plan-card card"
          :class="{
            popular: plan.popular,
            current: plan.id === currentPlan,
            selected: selectedPlan === plan.id
          }"
          @click="selectPlan(plan)"
        >
          <!-- Popular badge -->
          <div v-if="plan.popular" class="popular-badge">⭐ הכי פופולרי</div>
          <!-- Current badge -->
          <div v-if="plan.id === currentPlan" class="current-badge">✓ תוכנית נוכחית</div>

          <div class="card-body">
            <div class="plan-icon">{{ plan.icon }}</div>
            <h2 class="plan-name">{{ plan.name }}</h2>

            <!-- Price -->
            <div class="plan-price">
              <span v-if="plan.price === 0" class="price-amount free">חינם</span>
              <template v-else>
                <span class="price-amount" :style="{ color: plan.color }">{{ plan.price }}{{ plan.currency }}</span>
                <span class="price-period">/ {{ plan.period }}</span>
              </template>
            </div>

            <!-- Features -->
            <ul class="feature-list">
              <li v-for="f in plan.features" :key="f" class="feature-item">
                <span class="feature-check">✓</span>
                {{ f }}
              </li>
              <li v-for="l in plan.limitations" :key="l" class="feature-item limitation">
                <span class="feature-x">✗</span>
                {{ l }}
              </li>
            </ul>

            <!-- CTA Button -->
            <button
              class="btn plan-btn"
              :class="{
                'btn-current': plan.id === currentPlan,
                'btn-primary': plan.id !== currentPlan && plan.popular,
                'btn-outline': plan.id !== currentPlan && !plan.popular
              }"
              :disabled="plan.id === currentPlan"
              :style="plan.popular && plan.id !== currentPlan ? { background: plan.color, borderColor: plan.color } : {}"
              @click.stop="openUpgradeModal(plan)"
            >
              {{ plan.id === currentPlan ? '✓ תוכנית נוכחית' : plan.cta }}
            </button>
          </div>
        </div>
      </div>

      <!-- Feature comparison note -->
      <div class="comparison-note card">
        <div class="card-body">
          <div class="note-header">
            <span class="note-icon">💡</span>
            <h3 class="note-title">למה לשדרג?</h3>
          </div>
          <div class="note-points">
            <div class="note-point">
              <span>💌</span>
              <p>שלחו הודעות WhatsApp מותאמות אישית לכל האורחים בלחיצה אחת</p>
            </div>
            <div class="note-point">
              <span>🖨️</span>
              <p>ייצאו כרטיסי הושבה מעוצבים כ-PDF להדפסה מקצועית</p>
            </div>
            <div class="note-point">
              <span>📊</span>
              <p>סטטיסטיקות מתקדמות על הכנסות, מנות ותגובות האורחים</p>
            </div>
            <div class="note-point">
              <span>🏪</span>
              <p>נהלו ספקים, חוזים ותשלומים ממקום אחד</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Upgrade Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal pop-in" dir="rtl">
          <div class="modal-header">
            <h3 class="modal-title">שדרוג לתוכנית {{ selectedPlanObj?.name }} {{ selectedPlanObj?.icon }}</h3>
            <button class="modal-close" @click="showModal = false">✕</button>
          </div>

          <div class="modal-body">
            <!-- Demo disclaimer -->
            <div class="demo-disclaimer">
              <span class="disclaimer-icon">⚠️</span>
              <div>
                <strong>מצב דמו - לא יבוצע חיוב</strong>
                <p>זוהי גרסת הדגמה. בגרסה הסופית, כאן תתבצע פעולת תשלום אמיתית.</p>
              </div>
            </div>

            <!-- Plan summary -->
            <div class="plan-summary">
              <div class="summary-row">
                <span>תוכנית:</span>
                <strong>{{ selectedPlanObj?.name }}</strong>
              </div>
              <div class="summary-row">
                <span>מחיר:</span>
                <strong>{{ selectedPlanObj?.price }}{{ selectedPlanObj?.currency }} / {{ selectedPlanObj?.period }}</strong>
              </div>
            </div>

            <!-- Payment method (stub UI) -->
            <div class="payment-section">
              <label class="form-label">שיטת תשלום (הדגמה)</label>
              <div class="payment-options">
                <label class="payment-option" :class="{ selected: payMethod === 'card' }">
                  <input type="radio" v-model="payMethod" value="card" />
                  <span>💳 כרטיס אשראי</span>
                </label>
                <label class="payment-option" :class="{ selected: payMethod === 'paypal' }">
                  <input type="radio" v-model="payMethod" value="paypal" />
                  <span>🅿️ PayPal</span>
                </label>
              </div>
              <p class="stub-note">* שדות תשלום לא מופעלים בגרסת הדמו</p>
            </div>

            <!-- Success result -->
            <div v-if="upgradeResult" class="upgrade-result">
              <div class="result-icon">🎉</div>
              <div class="result-text">
                <strong>{{ upgradeResult.message }}</strong>
                <p>{{ upgradeResult.note }}</p>
              </div>
            </div>

            <div v-if="upgradeError" class="error-alert">⚠️ {{ upgradeError }}</div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" @click="showModal = false">ביטול</button>
            <button
              v-if="!upgradeResult"
              class="btn btn-primary"
              :disabled="upgrading"
              @click="confirmUpgrade"
            >
              <span v-if="upgrading">מעבד...</span>
              <span v-else>אשר שדרוג (דמו)</span>
            </button>
            <button v-else class="btn btn-ghost" @click="showModal = false">סגור</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/composables/useApi'

const loading = ref(true)
const plans = ref([])
const currentPlan = ref('free')
const selectedPlan = ref(null)
const showModal = ref(false)
const upgrading = ref(false)
const upgradeResult = ref(null)
const upgradeError = ref(null)
const payMethod = ref('card')

const selectedPlanObj = computed(() => plans.value.find(p => p.id === selectedPlan.value))

async function loadPlans() {
  loading.value = true
  try {
    const res = await api.get('/subscription/plans')
    plans.value = res.data.plans || []
    currentPlan.value = res.data.currentPlan || 'free'
  } catch {
    plans.value = []
  } finally {
    loading.value = false
  }
}

function selectPlan(plan) {
  if (plan.id !== currentPlan.value) {
    selectedPlan.value = plan.id
  }
}

function openUpgradeModal(plan) {
  if (plan.id === currentPlan.value) return
  selectedPlan.value = plan.id
  upgradeResult.value = null
  upgradeError.value = null
  showModal.value = true
}

async function confirmUpgrade() {
  upgrading.value = true
  upgradeError.value = null
  try {
    const res = await api.post('/subscription/upgrade', {
      plan: selectedPlan.value,
      paymentMethod: payMethod.value
    })
    upgradeResult.value = res.data
  } catch (e) {
    upgradeError.value = e.response?.data?.message || 'שגיאה בשדרוג המנוי'
  } finally {
    upgrading.value = false
  }
}

onMounted(loadPlans)
</script>

<style scoped>
.payment-view {
  padding: var(--space-6);
  max-width: 1000px;
}

.page-header { margin-bottom: var(--space-6); }
.page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--color-navy); margin-bottom: 4px; }
.page-sub { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-4); }

.demo-banner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: #fef3c7;
  border: 1.5px solid #fde68a;
  color: #92400e;
  font-size: var(--font-size-sm);
  font-weight: 700;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
}

/* Loading */
.loading-state {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
  padding: var(--space-12); color: var(--color-text-muted);
}
.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--color-border); border-top-color: var(--color-primary);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Plans grid */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  margin-bottom: var(--space-6);
  align-items: start;
}

/* Plan card */
.plan-card {
  position: relative;
  cursor: pointer;
  transition: all var(--transition);
  border: 2px solid var(--color-border);
}
.plan-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.plan-card.popular {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light), var(--shadow-lg);
  transform: scale(1.02);
}
.plan-card.current { border-color: var(--color-success); }
.plan-card.selected:not(.current) { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-light); }

.popular-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 800;
  padding: 4px 16px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.current-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-success);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 800;
  padding: 4px 16px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.plan-icon { font-size: 2.5rem; text-align: center; margin-bottom: var(--space-3); }
.plan-name {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-navy);
  text-align: center;
  margin-bottom: var(--space-3);
}
.plan-price {
  text-align: center;
  margin-bottom: var(--space-5);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.price-amount {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--color-navy);
}
.price-amount.free { color: #6B7280; font-size: 1.8rem; }
.price-period { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-right: 4px; }

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.5;
}
.feature-item.limitation { color: var(--color-text-muted); }
.feature-check { color: var(--color-success); font-weight: 800; flex-shrink: 0; }
.feature-x { color: var(--color-error); font-weight: 800; flex-shrink: 0; }

.plan-btn { width: 100%; justify-content: center; }

/* Comparison note */
.comparison-note { margin-top: var(--space-2); }
.note-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); }
.note-icon { font-size: 1.5rem; }
.note-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }
.note-points {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}
.note-point {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  line-height: 1.6;
}
.note-point span { font-size: 1.3rem; flex-shrink: 0; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 11px var(--space-5); border-radius: var(--radius-full);
  font-size: var(--font-size-sm); font-weight: 700; cursor: pointer; border: none;
  transition: all var(--transition); font-family: var(--font); white-space: nowrap;
}
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow-pink); }
.btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text); }
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-current { background: var(--color-bg-subtle); color: var(--color-text-muted); cursor: not-allowed; }
.btn-ghost { background: transparent; color: var(--color-text-muted); }
.btn-ghost:hover { background: var(--color-bg-subtle); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: var(--color-overlay-dark);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: var(--space-4);
}
.modal {
  background: #fff; border-radius: var(--radius-xl);
  width: 100%; max-width: 500px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.modal-title { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-navy); }
.modal-close {
  background: none; border: none; font-size: 18px; cursor: pointer;
  color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--color-bg-subtle); }
.modal-body { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}

.demo-disclaimer {
  display: flex; gap: var(--space-3); align-items: flex-start;
  background: #fef3c7; border: 1px solid #fde68a;
  border-radius: var(--radius-lg); padding: var(--space-4);
  font-size: var(--font-size-sm);
}
.disclaimer-icon { font-size: 1.3rem; flex-shrink: 0; }
.demo-disclaimer strong { color: #92400e; display: block; margin-bottom: 4px; }
.demo-disclaimer p { color: #78350f; margin: 0; line-height: 1.5; }

.plan-summary {
  background: var(--color-bg-subtle); border-radius: var(--radius-lg);
  padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2);
}
.summary-row { display: flex; justify-content: space-between; font-size: var(--font-size-sm); }
.summary-row span { color: var(--color-text-muted); }
.summary-row strong { color: var(--color-navy); }

.payment-section { display: flex; flex-direction: column; gap: var(--space-3); }
.form-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-navy); }
.payment-options { display: flex; gap: var(--space-3); }
.payment-option {
  flex: 1; display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border); border-radius: var(--radius);
  cursor: pointer; font-size: var(--font-size-sm); font-weight: 600;
  transition: all var(--transition-fast);
}
.payment-option.selected { border-color: var(--color-primary); background: var(--color-primary-light); }
.payment-option input { accent-color: var(--color-primary); }
.stub-note { font-size: var(--font-size-xs); color: var(--color-text-muted); margin: 0; }

.upgrade-result {
  display: flex; align-items: flex-start; gap: var(--space-3);
  background: var(--color-success-bg); border: 1px solid var(--color-success);
  border-radius: var(--radius-lg); padding: var(--space-4);
}
.result-icon { font-size: 1.8rem; flex-shrink: 0; }
.result-text strong { display: block; color: #16a34a; margin-bottom: 4px; font-size: var(--font-size-base); }
.result-text p { font-size: var(--font-size-sm); color: #166534; margin: 0; }

.error-alert {
  padding: var(--space-3) var(--space-4); background: var(--color-error-bg);
  border: 1px solid var(--color-error); border-radius: var(--radius);
  color: var(--color-error); font-size: var(--font-size-sm); font-weight: 600;
}

/* Pop-in animation */
@keyframes popIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.pop-in { animation: popIn 0.2s ease forwards; }

@media (max-width: 768px) {
  .payment-view { padding: var(--space-4); }
  .plans-grid { grid-template-columns: 1fr; }
  .plan-card.popular { transform: none; }
  .note-points { grid-template-columns: 1fr; }
}
</style>
