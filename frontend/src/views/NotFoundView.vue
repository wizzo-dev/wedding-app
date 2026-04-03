<template>
  <div class="notfound-page" dir="rtl">
    <!-- Floating background decorations -->
    <div class="bg-floats" aria-hidden="true">
      <span
        v-for="(item, i) in floatItems"
        :key="i"
        class="float-item"
        :style="floatStyle(i)"
      >{{ item }}</span>
    </div>

    <!-- Main card -->
    <div class="notfound-card">
      <!-- Big 404 with ring in the middle -->
      <div class="code-wrap" aria-label="404">
        <span class="code-digit">4</span>
        <span class="code-ring">💍</span>
        <span class="code-digit">4</span>
      </div>

      <!-- Illustration -->
      <div class="illustration" aria-hidden="true">
        <div class="illustration-inner">
          <span class="ill-emoji ill-left">💒</span>
          <span class="ill-emoji ill-center">🤷</span>
          <span class="ill-emoji ill-right">💒</span>
        </div>
        <div class="ill-road">
          <div class="road-dashes">
            <span v-for="n in 5" :key="n" class="road-dash" />
          </div>
        </div>
      </div>

      <!-- Text -->
      <h1 class="nf-heading">הדף שחיפשת לא נמצא</h1>
      <p class="nf-sub">
        נראה שהעמוד הזה ברח לחתונה אחרת.<br>
        אל דאגה — הדף הבית ממתין לכם.
      </p>

      <!-- Actions -->
      <div class="nf-actions">
        <RouterLink to="/" class="nf-btn nf-btn-primary">
          🏠 חזרה לדף הבית
        </RouterLink>
        <RouterLink to="/login" class="nf-btn nf-btn-outline">
          כניסה לחשבון
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const floatItems = ['💍', '💒', '💕', '🌸', '🎊', '🎉', '🌹', '✨', '💐', '💫']

function floatStyle(i) {
  const positions = [
    { top: '8%',  left: '5%'  },
    { top: '15%', left: '88%' },
    { top: '25%', left: '12%' },
    { top: '35%', left: '92%' },
    { top: '55%', left: '3%'  },
    { top: '65%', left: '85%' },
    { top: '75%', left: '15%' },
    { top: '80%', left: '78%' },
    { top: '90%', left: '40%' },
    { top: '45%', left: '95%' },
  ]
  const pos = positions[i % positions.length]
  return {
    ...pos,
    fontSize: `${1.2 + (i % 3) * 0.5}rem`,
    animationDelay: `${i * 0.4}s`,
    animationDuration: `${3 + (i % 3)}s`,
    opacity: 0.3 + (i % 4) * 0.1,
  }
}
</script>

<style scoped>
/* ── Page wrapper ── */
.notfound-page {
  direction: rtl;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, var(--color-primary-bg) 0%, #fff 60%);
  padding: var(--space-8) var(--space-4);
  position: relative;
  overflow: hidden;
}

/* ── Floating background items ── */
.bg-floats {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.float-item {
  position: absolute;
  animation: floatUp var(--dur, 4s) var(--delay, 0s) ease-in-out infinite alternate;
  user-select: none;
}

@keyframes floatUp {
  from { transform: translateY(0) rotate(0deg); }
  to   { transform: translateY(-20px) rotate(10deg); }
}

/* ── Card ── */
.notfound-card {
  position: relative;
  z-index: 1;
  background: var(--color-bg-card);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  padding: var(--space-12) var(--space-16);
  text-align: center;
  max-width: 520px;
  width: 100%;
  animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── 404 Code ── */
.code-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  line-height: 1;
}

.code-digit {
  font-size: clamp(5rem, 15vw, 7rem);
  font-weight: 900;
  color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary), #ff6bca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -4px;
  filter: drop-shadow(0 4px 12px rgba(233,30,140,0.25));
}

.code-ring {
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  animation: spin 8s linear infinite;
  display: inline-block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Illustration ── */
.illustration {
  margin-bottom: var(--space-6);
}

.illustration-inner {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.ill-emoji {
  font-size: 2rem;
  display: inline-block;
}

.ill-left {
  transform: translateY(-4px);
  animation: tilt 3s 0s ease-in-out infinite alternate;
}

.ill-right {
  transform: translateY(-4px);
  animation: tilt 3s 0.5s ease-in-out infinite alternate;
}

.ill-center {
  font-size: 2.5rem;
  animation: tilt 2s 0.25s ease-in-out infinite alternate;
}

@keyframes tilt {
  from { transform: rotate(-8deg) translateY(-4px); }
  to   { transform: rotate(8deg)  translateY(4px); }
}

.ill-road {
  height: 8px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  position: relative;
  overflow: hidden;
}

.road-dashes {
  display: flex;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  height: 100%;
  align-items: center;
  animation: roadSlide 1s linear infinite;
}

@keyframes roadSlide {
  from { transform: translateX(0); }
  to   { transform: translateX(-40px); }
}

.road-dash {
  width: 24px;
  height: 3px;
  background: #fff;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* ── Text ── */
.nf-heading {
  font-size: var(--font-size-3xl);
  font-weight: 900;
  color: var(--color-navy);
  margin-bottom: var(--space-3);
  line-height: 1.3;
}

.nf-sub {
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  line-height: 1.7;
  margin-bottom: var(--space-8);
}

/* ── Actions ── */
.nf-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--font-size-sm);
  text-decoration: none;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  white-space: nowrap;
}

.nf-btn-primary {
  background: linear-gradient(135deg, var(--color-primary), #ff6bca);
  color: #fff;
  box-shadow: var(--shadow-pink);
}

.nf-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(233,30,140,0.4);
}

.nf-btn-outline {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

.nf-btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-2px);
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .notfound-card {
    padding: var(--space-8) var(--space-6);
  }

  .nf-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .nf-btn {
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
</style>
