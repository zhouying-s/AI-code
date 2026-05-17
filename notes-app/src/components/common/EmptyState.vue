<template>
  <div class="empty">
    <div class="empty__icon">{{ icon ?? '📒' }}</div>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="hint" class="empty__hint">{{ hint }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; title: string; hint?: string }>()
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: var(--color-text-tertiary);
}
.empty__icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty__title {
  margin: 0 0 8px;
  color: var(--color-text-primary);
}
.empty__hint {
  margin: 0;
  font-size: 13px;
}
</style>
