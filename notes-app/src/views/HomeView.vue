<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="home-tree">
        <EmptyState icon="🌱" title="选择左侧知识库开始" />
      </div>
    </template>
    <template #main>
      <EmptyState
        icon="📒"
        title="欢迎回到 AI 笔记库"
        hint="Stage 1 阶段：先选一个知识库，开始写笔记。后续阶段会逐步加入 AI 写作、RAG、插件。"
      />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'

const auth = useAuthStore()
const booksStore = useBooksStore()
const router = useRouter()

onMounted(async () => {
  if (booksStore.books.length === 0) await booksStore.refresh()
  if (auth.defaultBookSlug) {
    router.replace(`/book/${auth.defaultBookSlug}`)
  } else if (booksStore.books.length > 0) {
    router.replace(`/book/${booksStore.books[0].slug}`)
  }
})
</script>

<style scoped>
.home-tree {
  padding: 24px 8px;
}
</style>
