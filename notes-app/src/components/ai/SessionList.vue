<template>
  <div class="sessions">
    <header class="sessions__header">
      <span>💬 会话</span>
      <el-button text size="small" :icon="Plus" @click="$emit('new')" />
    </header>
    <ul class="sessions__list">
      <li
        v-for="s in store.sessions"
        :key="s.id"
        class="sessions__item"
        :class="{ 'sessions__item--active': store.currentSessionId === s.id }"
        @click="$emit('select', s.id)"
      >
        <div class="sessions__title">{{ s.title }}</div>
        <div class="sessions__meta">{{ s.msgCount }} 条 · {{ s.model }}</div>
        <el-icon class="sessions__del" @click.stop="$emit('delete', s.id)"><Delete /></el-icon>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete } from '@element-plus/icons-vue'
import { useAiStore } from '@/stores/ai'

const store = useAiStore()
defineEmits<{
  (e: 'new'): void
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
}>()
</script>

<style scoped>
.sessions {
  padding: 16px 8px;
}
.sessions__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 12px;
  font-weight: 600;
}
.sessions__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sessions__item {
  padding: 8px 10px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  position: relative;
}
.sessions__item:hover {
  background: var(--color-bg-hover);
}
.sessions__item:hover .sessions__del {
  opacity: 1;
}
.sessions__item--active {
  background: var(--color-primary-light-bg);
}
.sessions__title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sessions__meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
.sessions__del {
  position: absolute;
  top: 10px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.12s;
}
</style>
