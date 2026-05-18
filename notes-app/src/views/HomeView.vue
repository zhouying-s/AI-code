<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="home-tree">
        <h4>🌱 开始</h4>
        <p class="hint">最近编辑、最近小记、收藏的入口都在这里。</p>
      </div>
    </template>
    <template #main>
      <div class="home-main">
        <section>
          <h3>🕒 最近编辑</h3>
          <ul v-if="recentNotes.length > 0" class="list">
            <li v-for="n in recentNotes" :key="n.id" class="list__item" @click="openNote(n)">
              <span class="list__title">{{ n.title }}</span>
              <span class="list__meta"> {{ n.bookSlug }} · {{ formatTime(n.updatedAt) }} </span>
            </li>
          </ul>
          <p v-else class="empty-hint">还没有笔记 — 左侧"知识库"创建一个开始</p>
        </section>

        <section>
          <h3>📒 最近小记</h3>
          <ul v-if="memos.list.length > 0" class="list">
            <li v-for="m in memos.list.slice(0, 5)" :key="m.id" class="list__item list__item--memo">
              <span class="list__title">{{ m.preview }}</span>
              <span class="list__meta">{{ formatTime(m.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="empty-hint">
            还没有小记 — <router-link to="/memos">去添加</router-link>
          </p>
        </section>

        <section>
          <h3>⭐ 收藏精选</h3>
          <ul v-if="favoriteNotes.length > 0" class="list">
            <li
              v-for="n in favoriteNotes.slice(0, 5)"
              :key="n.id"
              class="list__item"
              @click="openNote(n)"
            >
              <span class="list__title">{{ n.title }}</span>
              <span class="list__meta">{{ n.bookSlug }}</span>
            </li>
          </ul>
          <p v-else class="empty-hint">
            没有收藏的笔记 — 进
            <router-link to="/favorites">收藏页</router-link>看看
          </p>
        </section>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import { useMemosStore } from '@/stores/memos'
import { useFavoritesStore } from '@/stores/favorites'
import { useSearchStore } from '@/stores/search'

const router = useRouter()
const memos = useMemosStore()
const favorites = useFavoritesStore()
const search = useSearchStore()

interface IndexEntry {
  id: string
  bookSlug: string
  title: string
  filePath: string
  updatedAt?: string
}

onMounted(async () => {
  memos.refresh()
  await search.ensureIndex().catch(() => {})
})

const recentNotes = computed<IndexEntry[]>(() =>
  [...search.allIndexed]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 5),
)

const favoriteNotes = computed<IndexEntry[]>(() => {
  const ids = new Set(favorites.noteIds)
  return search.allIndexed.filter((n) => ids.has(n.id))
})

function openNote(n: IndexEntry) {
  router.push(`/book/${n.bookSlug}/${n.id}`)
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.home-tree {
  padding: 24px 16px;
}
.home-tree h4 {
  margin: 0 0 8px;
}
.hint {
  color: var(--color-text-tertiary);
  font-size: 12px;
  margin: 0;
}
.home-main {
  padding: 32px;
  max-width: 800px;
}
.home-main section {
  margin-bottom: 32px;
}
.home-main section h3 {
  margin: 0 0 12px;
  font-size: 16px;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.list__item {
  padding: 10px 12px;
  cursor: pointer;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.list__item:hover {
  background: var(--color-bg-hover);
}
.list__item--memo {
  cursor: default;
}
.list__item--memo:hover {
  background: transparent;
}
.list__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.list__meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
  flex-shrink: 0;
}
.empty-hint {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
</style>
