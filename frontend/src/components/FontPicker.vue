<template>
  <div class="font-picker">
    <!-- Tabs: עברית / English -->
    <div class="font-tabs">
      <button :class="{ active: tab === 'he' }" @click="tab = 'he'">עברית</button>
      <button :class="{ active: tab === 'en' }" @click="tab = 'en'">English</button>
    </div>

    <!-- Font grid: each item rendered in its own font -->
    <div class="font-grid">
      <button
        v-for="font in currentFonts"
        :key="font.name"
        class="font-item"
        :class="{ selected: modelValue === font.name }"
        :style="{ fontFamily: `'${font.name}', sans-serif` }"
        @click="$emit('update:modelValue', font.name)"
        :title="font.name"
      >
        <span class="font-preview">{{ tab === 'he' ? 'אבגד' : 'Abcd' }}</span>
        <span class="font-label">{{ font.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HEBREW_FONTS, ENGLISH_FONTS } from '@/composables/useFonts'

defineProps({
  modelValue: {
    type: String,
    default: 'Heebo',
  },
})
defineEmits(['update:modelValue'])

const tab = ref('he')

const currentFonts = computed(() =>
  tab.value === 'he' ? HEBREW_FONTS : ENGLISH_FONTS
)
</script>

<style scoped>
.font-picker {
  background: var(--color-bg, #f9f9f9);
  border-radius: 12px;
  padding: 12px;
}

/* Tabs */
.font-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.font-tabs button {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  background: white;
  cursor: pointer;
  font-size: 13px;
  font-family: Heebo, sans-serif;
  transition: all 0.15s;
  color: var(--color-text, #333);
}
.font-tabs button.active {
  border-color: var(--color-primary, #E91E8C);
  color: var(--color-primary, #E91E8C);
  font-weight: 700;
}
.font-tabs button:hover:not(.active) {
  border-color: #ddd;
  background: #fafafa;
}

/* Grid */
.font-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
}

/* Font item */
.font-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border-radius: 10px;
  border: 2px solid transparent;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.font-item:hover {
  border-color: #ddd;
  background: #fafafa;
}
.font-item.selected {
  border-color: var(--color-primary, #E91E8C);
  background: #fdf0f8;
}

/* Preview text — inherits fontFamily from :style binding */
.font-preview {
  font-size: 22px;
  line-height: 1;
  color: #222;
}

/* Label always in Heebo for readability */
.font-label {
  font-size: 11px;
  color: #888;
  font-family: Heebo, sans-serif;
}
</style>
