<template>
  <div class="notfound-page" dir="rtl">
    <!-- Animated background -->
    <div class="bg-floats" aria-hidden="true">
      <div
        v-for="(item, i) in floatItems"
        :key="i"
        class="float-item"
        :style="floatStyle(i)"
      >{{ item }}</div>
    </div>

    <!-- Center card -->
    <div class="notfound-card">
      <!-- 404 number -->
      <div class="num-wrap">
        <span class="num-4 num">4</span>
        <span class="num-ring">💍</span>
        <span class="num-4 num">4</span>
      </div>

      <h1 class="nf-title">אופס! העמוד לא נמצא</h1>
      <p class="nf-sub">נראה שהדף הזה ברח לחתונה אחרת 😄</p>

      <div class="nf-actions">
        <router-link to="/" class="nf-btn nf-btn-navy">
          🏠 חזרה לדף הבית
        </router-link>
        <a href="mailto:support@yallawedding.co.il" class="nf-btn nf-btn-outline">
          ✉️ צור קשר
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const floatItems = ['💍', '💒', '💕', '🌸', '💍', '🎊', '💕', '🌹', '💍', '🎉', '💕', '💒', '🌸', '💍', '🎊']

function floatStyle(i) {
  const left = ((i / floatItems.length) * 100) + (Math.random() * 6 - 3)
  const delay = (i * 0.7) % 10
  const duration = 10 + (i % 5) * 2.5
  const size = 1.2 + (i % 4) * 0.4
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    fontSize: `${size}rem`,
    opacity: 0.15 + (i % 3) * 0.07
  }
}
</script>

<style scoped>
/* ── Page ── */
.notfound-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #fff5fb 0%, #fff 40%, #f0f4ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  font-family: var(--font);
  position: relative;
  overflow: hidden;
}

/* ── Floating background elements ── */
.bg-floats {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.float-item {
  position: absolute;
  top: 110%;
  animation: floatUp ease-in-out infinite;
  user-select: none;
}
@keyframes floatUp {
  0%   { transform: translateY(0) rotate(-5deg) scale(0.9); opacity: 0; }
  10%  { opacity: 1; }
  50%  { transform: translateY(-55vh) rotate(8deg) scale(1.05); }
  90%  { opacity: 0.7; }
  100% { transform: translateY(-115vh) rotate(-5deg) scale(0.9); opacity: 0; }
}

/* ── Card ── */
.notfound-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-12) var(--space-8);
  max-width: 520px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* ── 404 number ── */
.num-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.num {
  font-size: 6rem;
  font-weight: 900;
  color: var(--color-navy);
  line-height: 1;
  letter-spacing: -4px;
}
.num-ring {
  font-size: 5rem;
  animation: ringWobble 3s ease-in-out infinite;
  display: inline-block;
}
@keyframes ringWobble {
  0%   { transform: rotate(-8deg) scale(1); }
  25%  { transform: rotate(8deg) scale(1.1); }
  50%  { transform: rotate(-5deg) scale(1.05); }
  75%  { transform: rotate(6deg) scale(1.08); }
  100% { transform: rotate(-8deg) scale(1); }
}

/* ── Text ── */
.nf-title {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
}
.nf-sub {
  font-size: var(--font-size-lg);
  color: var(--color-text-muted);
  margin-bottom: var(--space-8);
  line-height: 1.6;
}

/* ── Action buttons ── */
.nf-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}
.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-8);
  border-radius: var(--radius-full);
  font-size: var(--font-size-base);
  font-weight: 700;
  font-family: var(--font);
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition);
  white-space: nowrap;
}
.nf-btn-navy {
  background: var(--color-navy);
  color: #fff;
  border: 2px solid var(--color-navy);
  box-shadow: var(--shadow);
}
.nf-btn-navy:hover {
  background: var(--color-navy-mid);
  border-color: var(--color-navy-mid);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.nf-btn-outline {
  background: transparent;
  color: var(--color-navy);
  border: 2px solid var(--color-border);
}
.nf-btn-outline:hover {
  border-color: var(--color-navy);
  background: var(--color-bg-subtle);
  transform: translateY(-2px);
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .notfound-card { padding: var(--space-8) var(--space-4); }
  .num { font-size: 4rem; }
  .num-ring { font-size: 3.5rem; }
  .nf-title { font-size: var(--font-size-2xl); }
  .nf-actions { flex-direction: column; align-items: center; }
  .nf-btn { width: 100%; justify-content: center; }
}
</style>
