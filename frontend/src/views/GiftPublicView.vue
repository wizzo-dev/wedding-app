<template>
  <div class="gift-public-page" dir="rtl">
    <!-- Background shimmer -->
    <div class="gift-bg" aria-hidden="true">
      <div v-for="i in 10" :key="i" class="sparkle" :style="sparkleStyle(i)">✨</div>
    </div>

    <div class="gift-container">
      <!-- Loading -->
      <div v-if="loading" class="gift-card">
        <div class="skeleton-section">
          <div class="skel skel-h1" />
          <div class="skel skel-sub" />
        </div>
        <div v-for="i in 3" :key="i" class="gift-item-skel">
          <div class="skel skel-item" />
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="gift-card error-card">
        <div class="err-icon">💔</div>
        <h2>הרשימה לא נמצאה</h2>
        <p>הקישור שקיבלת אינו תקין.</p>
      </div>

      <!-- Main content -->
      <template v-else-if="data">
        <!-- Header card -->
        <div class="couple-header">
          <div class="header-icons">🎁 💍 🎁</div>
          <h1 class="couple-title">{{ data.couple.name1 }} &amp; {{ data.couple.name2 }}</h1>
          <p class="couple-sub">רשימת המשאלות לחתונה שלנו 💕</p>
          <div class="couple-meta" v-if="data.couple.weddingDate || data.couple.venue">
            <span v-if="data.couple.weddingDate" class="meta-badge">
              📅 {{ formatDate(data.couple.weddingDate) }}
            </span>
            <span v-if="data.couple.venue" class="meta-badge">
              📍 {{ data.couple.venue }}
            </span>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!data.wishes?.length" class="empty-card">
          <div class="empty-icon">🎀</div>
          <p class="empty-title">הרשימה עדיין ריקה</p>
          <p class="empty-sub">הזוג טרם הוסיף פריטים לרשימה</p>
        </div>

        <!-- Gift wish list -->
        <div v-else class="wishes-grid">
          <div
            v-for="wish in data.wishes"
            :key="wish.id"
            class="wish-card"
            :class="{ contributed: wish.isContributed }"
          >
            <!-- Status ribbon -->
            <div v-if="wish.isContributed" class="ribbon">✓ נלקח</div>

            <!-- Gift icon area -->
            <div class="wish-icon-wrap">
              <img v-if="wish.imageUrl" :src="wish.imageUrl" class="wish-img" :alt="wish.name" />
              <div v-else class="wish-icon-placeholder">
                <span class="wish-icon">{{ giftEmoji(wish.name) }}</span>
              </div>
            </div>

            <!-- Gift info -->
            <div class="wish-info">
              <h3 class="wish-name">{{ wish.name }}</h3>
              <div class="wish-amount">
                <span class="amount-label">סכום מבוקש</span>
                <span class="amount-value">₪{{ formatAmount(wish.desiredAmount) }}</span>
              </div>
              <p v-if="wish.message" class="wish-message">{{ wish.message }}</p>
            </div>

            <!-- Contribute button -->
            <button
              v-if="!wish.isContributed"
              class="btn btn-primary contribute-btn"
              @click="openContribute(wish)"
            >
              💝 תרום מתנה
            </button>
            <div v-else class="contributed-tag">
              <span>🎊 כבר נתרם</span>
            </div>
          </div>
        </div>

        <!-- Contribute modal -->
        <Teleport to="body">
          <Transition name="modal">
            <div v-if="modal.show" class="modal-overlay" @click.self="modal.show = false">
              <div class="modal-box pop-in">
                <button class="modal-close" @click="modal.show = false">✕</button>
                <div class="modal-header">
                  <div class="modal-icon">💌</div>
                  <h2 class="modal-title">תרום מתנה</h2>
                  <p class="modal-sub">{{ modal.wish?.name }} — ₪{{ formatAmount(modal.wish?.desiredAmount) }}</p>
                </div>

                <!-- Payment info -->
                <div class="payment-section">
                  <p class="payment-intro">ניתן להעביר את המתנה באחת מהדרכים הבאות:</p>

                  <div v-if="data.payment.bitPhone" class="payment-method">
                    <div class="pm-icon">📱</div>
                    <div class="pm-body">
                      <div class="pm-title">Bit</div>
                      <div class="pm-value" dir="ltr">{{ data.payment.bitPhone }}</div>
                      <a
                        :href="`https://www.bitpay.co.il/${data.payment.bitPhone.replace(/[^0-9]/g,'')}`"
                        target="_blank"
                        rel="noopener"
                        class="btn btn-primary btn-sm pm-action"
                      >שלח ב-Bit</a>
                    </div>
                  </div>

                  <div v-if="data.payment.bankInfo" class="payment-method">
                    <div class="pm-icon">🏦</div>
                    <div class="pm-body">
                      <div class="pm-title">העברה בנקאית</div>
                      <div class="pm-value bank-info">{{ data.payment.bankInfo }}</div>
                    </div>
                  </div>

                  <div v-if="!data.payment.bitPhone && !data.payment.bankInfo" class="no-payment">
                    <p>הזוג טרם הוסיף פרטי תשלום. ניתן ליצור איתם קשר ישירות.</p>
                  </div>
                </div>

                <p class="modal-note">
                  אחרי שהעברת את המתנה, הזוג יעדכן את הרשימה 💕
                </p>
                <button class="btn btn-outline w-full" @click="modal.show = false">סגור</button>
              </div>
            </div>
          </Transition>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(true)
const error   = ref(false)
const data    = ref(null)
const modal   = ref({ show: false, wish: null })

onMounted(async () => {
  const userId = route.params.userId || route.query.userId
  if (!userId) { error.value = true; loading.value = false; return }
  try {
    const res = await fetch(`/api/gifts/public/${userId}`)
    if (!res.ok) { error.value = true; return }
    data.value = await res.json()
  } catch { error.value = true }
  finally { loading.value = false }
})

function openContribute(wish) {
  modal.value = { show: true, wish }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatAmount(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('he-IL')
}

const EMOJI_MAP = {
  מצלמה: '📷', טיול: '✈️', מטבח: '🍳', כלי: '🛠️', ספר: '📚',
  שולחן: '🪑', מיטה: '🛏️', כרית: '🛋️', אמנות: '🎨', מוזיקה: '🎵',
  ספורט: '⚽', שעון: '⌚', תכשיט: '💎', בגד: '👗', נסיעה: '🚗'
}

function giftEmoji(name) {
  const lower = (name || '').toLowerCase()
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji
  }
  return '🎁'
}

function sparkleStyle(i) {
  return {
    top:  `${(i * 11) % 90}%`,
    right: `${(i * 17) % 95}%`,
    fontSize: `${12 + (i % 3) * 8}px`,
    animationDelay:    `${(i * 0.7).toFixed(1)}s`,
    animationDuration: `${4 + i % 3}s`,
    opacity: 0.1 + (i % 4) * 0.03
  }
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.gift-public-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #FFF5FB 0%, #F5F5F7 60%, #EEF2FF 100%);
  padding: var(--space-8) var(--space-4);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.gift-bg { position: absolute; inset: 0; pointer-events: none; }
.sparkle { position: absolute; animation: floatSpark linear infinite; user-select: none; }
@keyframes floatSpark {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0; }
  50%       { transform: scale(1.3) rotate(15deg); opacity: 0.15; }
}
.gift-container { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: var(--space-6); position: relative; z-index: 1; }

/* ── Couple Header ───────────────────────────────────────────────────────── */
.couple-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, #C9177A 100%);
  border-radius: var(--radius-2xl);
  color: #fff;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  box-shadow: var(--shadow-pink);
}
.header-icons { font-size: 1.8rem; margin-bottom: var(--space-3); letter-spacing: 0.5rem; }
.couple-title { font-size: var(--font-size-3xl); font-weight: 900; margin-bottom: var(--space-2); }
.couple-sub   { font-size: var(--font-size-base); opacity: 0.9; margin-bottom: var(--space-3); }
.couple-meta  { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
.meta-badge   { background: rgba(255,255,255,0.2); border-radius: var(--radius-full); padding: var(--space-1) var(--space-4); font-size: var(--font-size-sm); }

/* ── Gift card ────────────────────────────────────────────────────────────── */
.gift-card { background: var(--color-bg-card); border-radius: var(--radius-2xl); border: 1px solid var(--color-border); box-shadow: var(--shadow); overflow: hidden; }

/* ── Empty ────────────────────────────────────────────────────────────────── */
.empty-card { padding: var(--space-16) var(--space-8); text-align: center; background: var(--color-bg-card); border-radius: var(--radius-2xl); border: 1px dashed var(--color-border); }
.empty-icon  { font-size: 3rem; margin-bottom: var(--space-4); }
.empty-title { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-navy); }
.empty-sub   { color: var(--color-text-muted); font-size: var(--font-size-sm); margin-top: var(--space-2); }

/* ── Wishes grid ─────────────────────────────────────────────────────────── */
.wishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

.wish-card {
  background: var(--color-bg-card);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow var(--transition), transform var(--transition);
  position: relative;
}
.wish-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
.wish-card.contributed { opacity: 0.7; }

.ribbon {
  position: absolute;
  top: 12px; left: 12px;
  background: var(--color-success);
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  z-index: 2;
}

.wish-icon-wrap { height: 140px; overflow: hidden; }
.wish-img { width: 100%; height: 100%; object-fit: cover; }
.wish-icon-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary-light) 0%, #EEF2FF 100%); }
.wish-icon { font-size: 3.5rem; }

.wish-info { padding: var(--space-4); flex: 1; }
.wish-name { font-size: var(--font-size-base); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-2); }
.wish-amount { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-2); }
.amount-label { font-size: var(--font-size-xs); color: var(--color-text-muted); }
.amount-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-primary); }
.wish-message { font-size: var(--font-size-sm); color: var(--color-text-muted); line-height: 1.5; border-top: 1px solid var(--color-border); padding-top: var(--space-2); }

.contribute-btn { margin: 0 var(--space-4) var(--space-4); }
.contributed-tag { padding: var(--space-3) var(--space-4); text-align: center; color: var(--color-success); font-weight: 700; font-size: var(--font-size-sm); }

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: var(--color-overlay);
  display: flex; align-items: center; justify-content: center;
  padding: var(--space-4);
}
.modal-box {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  padding: var(--space-8) var(--space-6);
  max-width: 460px;
  width: 100%;
  position: relative;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.modal-close { position: absolute; top: var(--space-4); left: var(--space-4); width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-bg-subtle); border: none; cursor: pointer; font-size: var(--font-size-sm); color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
.modal-close:hover { background: var(--color-error-bg); color: var(--color-error); }
.modal-header { text-align: center; }
.modal-icon { font-size: 3rem; margin-bottom: var(--space-2); }
.modal-title { font-size: var(--font-size-xl); font-weight: 800; color: var(--color-navy); }
.modal-sub { color: var(--color-primary); font-weight: 700; margin-top: var(--space-1); }
.payment-section { display: flex; flex-direction: column; gap: var(--space-3); }
.payment-intro { font-size: var(--font-size-sm); color: var(--color-text-muted); }
.payment-method { display: flex; gap: var(--space-3); align-items: flex-start; padding: var(--space-4); border: 1.5px solid var(--color-border); border-radius: var(--radius-lg); }
.pm-icon  { font-size: 1.5rem; flex-shrink: 0; }
.pm-body  { flex: 1; }
.pm-title { font-size: var(--font-size-sm); font-weight: 700; color: var(--color-navy); margin-bottom: var(--space-1); }
.pm-value { font-size: var(--font-size-base); color: var(--color-text); font-family: monospace; }
.bank-info { white-space: pre-wrap; font-size: var(--font-size-sm); }
.pm-action { margin-top: var(--space-2); }
.no-payment { text-align: center; color: var(--color-text-muted); font-size: var(--font-size-sm); }
.modal-note { text-align: center; font-size: var(--font-size-sm); color: var(--color-text-muted); }
.modal-enter-active, .modal-leave-active { transition: opacity 200ms ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

/* ── Error card ──────────────────────────────────────────────────────────── */
.error-card { padding: var(--space-12) var(--space-6); text-align: center; }
.err-icon { font-size: 3rem; margin-bottom: var(--space-4); }

/* ── Skeletons ───────────────────────────────────────────────────────────── */
.skeleton-section { padding: var(--space-6); display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
.skel { background: linear-gradient(90deg, var(--color-border) 25%, var(--color-bg-subtle) 50%, var(--color-border) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius); }
.skel-h1 { height: 36px; width: 60%; }
.skel-sub { height: 18px; width: 40%; }
.gift-item-skel { margin: var(--space-2) var(--space-6); }
.skel-item { height: 80px; width: 100%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 480px) {
  .wishes-grid { grid-template-columns: 1fr; }
  .couple-title { font-size: var(--font-size-2xl); }
}
</style>
