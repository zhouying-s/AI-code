<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="memos-tree">
        <h4>📒 小记</h4>
        <p class="hint">{{ memos.list.length }} 条</p>
        <p class="hint" style="margin-top: 12px">
          小记数据当前存浏览器本地。Stage 3 上 Cloudflare Worker 后会自动同步到云端。
        </p>
      </div>
    </template>
    <template #main>
      <div class="memos-main">
        <MemoComposer />

        <EmptyState
          v-if="memos.list.length === 0"
          icon="📒"
          title="还没有小记"
          hint="上方输入框写一条试试"
        />

        <MemoCard v-for="m in memos.list" v-else :key="m.id" :memo="m" />
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import MemoComposer from '@/components/memo/MemoComposer.vue'
import MemoCard from '@/components/memo/MemoCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useMemosStore } from '@/stores/memos'

const memos = useMemosStore()
onMounted(() => memos.refresh())
</script>

<style scoped>
.memos-tree {
  padding: 24px 16px;
}
.memos-tree h4 {
  margin: 0 0 8px;
}
.hint {
  color: var(--color-text-tertiary);
  font-size: 12px;
  margin: 0;
}
.memos-main {
  padding: 32px;
  max-width: 720px;
}
</style>
