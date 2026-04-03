<template>
  <div class="gift-public-page" dir="rtl">
    <div class="gift-container">
      <div v-if="loading" class="loading-state">
        <p>טוען רשימת מתנות...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <h2>💔 הדף לא נמצא</h2>
        <p>הקישור שקיבלת אינו תקין.</p>
      </div>
      <div v-else-if="data" class="content">
        <div class="couple-header">
          <h1>{{ data.couple.name1 }} &amp; {{ data.couple.name2 }}</h1>
          <p class="sub">רשימת המשאלות לחתונה שלנו 💕</p>
        </div>
        <div v-if="!data.wishes?.length" class="empty">
          <p>🎀 הרשימה עדיין ריקה</p>
        </div>
        <div v-else class="wishes-list">
          <div v-for="wish in data.wishes" :key="wish.id" class="wish-item card card-hover">
            <div class="wish-icon">{{ wish.isContributed ? '✅' : '🎁' }}</div>
            <div class="wish-body">
              <h3 class="wish-name">{{ wish.name }}</h3>
              <p class="wish-amount">₪{{ wish.desiredAmount?.toLocaleString('he-IL') }}</p>
              <p v-if="wish.message" class="wish-msg">{{ wish.message }}</p>
            </div>
            <button v-if="!wish.isContributed" class="btn btn-primary btn-sm" @click="openContribute(wish)">💝 תרום</button>
            <span v-else class="contributed">נלקח</span>
          </div>
        </div>
      </div>

      <!-- Contribute modal -->
      <Teleport to="body">
        <div v-if="modal.show" class="modal-overlay" @click.self="modal.show = false">
          <div class="modal-box">
            <h2>💌 פרטי תשלום</h2>
            <p class="modal-gift">{{ modal.wish?.name }}</p>
            <div v-if="data?.payment?.bitPhone" class="pm-row">
              <strong>Bit:</strong> {{ data.payment.bitPhone }}
            </div>
            <div v-if="data?.payment?.bankInfo" class="pm-row">
              <strong>העברה בנקאית:</strong><br>{{ data.payment.bankInfo }}
            </div>
            <div v-if="!data?.payment?.bitPhone && !data?.payment?.bankInfo">
              <p>צור קשר עם הזוג ישירות.</p>
            </div>
            <button class="btn btn-outline w-full" @click="modal.show = false">סגור</button>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const loading = ref(true), error = ref(false), data = ref(null)
const modal = ref({ show: false, wish: null })
onMounted(async () => {
  const userId = route.params.userId || route.query.userId
  if (!userId) { error.value = true; loading.value = false; return }
  try {
    const res = await fetch(`/api/gifts/public/${userId}`)
    if (!res.ok) { error.value = true; return }
    data.value = await res.json()
  } catch { error.value = true } finally { loading.value = false }
})
function openContribute(wish) { modal.value = { show: true, wish } }
</script>
<style scoped>
.gift-public-page { min-height: 100vh; background: linear-gradient(135deg, var(--color-primary-bg), #F5F5F7); padding: var(--space-8) var(--space-4); }
.gift-container { max-width: 680px; margin: 0 auto; }
.couple-header { text-align: center; background: linear-gradient(135deg, var(--color-primary), #C9177A); color: #fff; border-radius: var(--radius-2xl); padding: var(--space-8) var(--space-6); margin-bottom: var(--space-6); }
.couple-header h1 { font-size: var(--font-size-3xl); font-weight: 900; }
.sub { opacity: 0.9; margin-top: var(--space-2); }
.wishes-list { display: flex; flex-direction: column; gap: var(--space-3); }
.wish-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); }
.wish-icon { font-size: 1.5rem; flex-shrink: 0; }
.wish-body { flex: 1; }
.wish-name { font-weight: 700; color: var(--color-navy); }
.wish-amount { font-size: var(--font-size-lg); font-weight: 800; color: var(--color-primary); }
.wish-msg { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.contributed { font-size: var(--font-size-xs); color: var(--color-success); font-weight: 700; }
.empty { text-align: center; padding: var(--space-12); color: var(--color-text-muted); }
.modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: var(--space-4); }
.modal-box { background: var(--color-bg-card); border-radius: var(--radius-2xl); padding: var(--space-8); max-width: 400px; width: 100%; display: flex; flex-direction: column; gap: var(--space-4); }
.modal-gift { color: var(--color-primary); font-weight: 700; }
.pm-row { background: var(--color-bg-subtle); border-radius: var(--radius); padding: var(--space-3); font-size: var(--font-size-sm); }
</style>
