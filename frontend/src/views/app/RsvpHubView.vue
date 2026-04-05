<template>
  <div class="rsvp-hub fade-in" dir="rtl">
    <!-- Page Header -->
    <div class="hub-header">
      <div>
        <h1 class="hub-title">📋 אישורי הגעה</h1>
        <p class="hub-sub">ניהול לינקי RSVP ועיצוב עמוד האישור</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="hub-tabs" role="tablist">
      <button
        class="hub-tab"
        :class="{ active: activeTab === 'links' }"
        role="tab"
        :aria-selected="activeTab === 'links'"
        @click="activeTab = 'links'"
      >🔗 לינקים</button>
      <button
        class="hub-tab"
        :class="{ active: activeTab === 'design' }"
        role="tab"
        :aria-selected="activeTab === 'design'"
        @click="activeTab = 'design'"
      >🎨 עיצוב</button>
    </div>

    <!-- Tab content -->
    <div class="hub-content">
      <KeepAlive>
        <component :is="activeTab === 'links' ? LinksView : DesignView" />
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LinksView from './RsvpLinksView.vue'
import DesignView from './RsvpDesignView.vue'

const activeTab = ref('links')
</script>

<style scoped>
.rsvp-hub {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.hub-header {
  margin-bottom: var(--space-5);
}
.hub-title {
  font-size: var(--font-size-2xl);
  font-weight: 800;
  color: var(--color-navy);
  line-height: 1.2;
}
.hub-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.hub-tabs {
  display: flex;
  gap: var(--space-2);
  border-bottom: 2px solid var(--color-border);
  margin-bottom: var(--space-5);
}
.hub-tab {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: var(--font-size-base);
  font-weight: 700;
  font-family: var(--font);
  color: var(--color-text-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all var(--transition-fast);
}
.hub-tab:hover {
  color: var(--color-navy);
}
.hub-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.hub-content {
  min-height: 200px;
}

@media (max-width: 600px) {
  .rsvp-hub { padding: var(--space-4); }
  .hub-tab { padding: 8px 14px; font-size: var(--font-size-sm); }
}
</style>
