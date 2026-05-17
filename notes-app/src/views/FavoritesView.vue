<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="fav-tree">
        <h4>⭐ 收藏</h4>
        <div class="fav-tabs">
          <a
            href="#"
            :class="{ 'fav-tabs__active': tab === 'notes' }"
            @click.prevent="tab = 'notes'"
          >
            笔记 ({{ favorites.noteIds.length }})
          </a>
          <a
            href="#"
            :class="{ 'fav-tabs__active': tab === 'memos' }"
            @click.prevent="tab = 'memos'"
          >
            小记 ({{ favorites.memoIds.length }})
          </a>
        </div>
      </div>
    </template>
    <template #main>
      <div class="fav-main">
        <template v-if="tab === 'notes'">
          <EmptyState
            v-if="favoriteNotes.length === 0"
            icon="⭐"
            title="还没有收藏的笔记"
            hint="在 BookView 的标题旁点星标可以收藏"
          />
          <ul v-else class="fav-list">
            <li v-for="n in favoriteNotes" :key="n.id" class="fav-list__item" @click="openNote(n)">
              <div class="fav-list__title">{{ n.title }}</div>
              <div class="fav-list__meta">{{ n.bookSlug }}</div>
            </li>
          </ul>
        </template>

        <template v-else>
          <EmptyState v-if="favoriteMemos.length === 0" icon="⭐" title="还没有收藏的小记" />
          <MemoCard v-for="m in favoriteMemos" v-else :key="m.id" :memo="m" />
        </template>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import MemoCard from '@/components/memo/MemoCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useMemosStore } from '@/stores/memos'
import { useSearchStore } from '@/stores/search'

const favorites = useFavoritesStore()
const memos = useMemosStore()
const search = useSearchStore()
const router = useRouter()
const tab = ref<'notes' | 'memos'>('notes')

onMounted(async () => {
  memos.refresh()
  await search.ensureIndex().catch(() => {})
})

interface FavNoteEntry {
  id: string
  title: string
  bookSlug: string
  filePath: string
}

const favoriteNotes = computed<FavNoteEntry[]>(() => {
  const ids = new Set(favorites.noteIds)
  return search.allIndexed
    .filter((n) => ids.has(n.id))
    .map((n) => ({
      id: n.id,
      title: n.title,
      bookSlug: n.bookSlug,
      filePath: n.filePath,
    }))
})

const favoriteMemos = computed(() => memos.list.filter((m) => favorites.memoIds.includes(m.id)))

function openNote(n: FavNoteEntry) {
  router.push(`/book/${n.bookSlug}/${n.id}`)
}
</script>

<style scoped>
.fav-tree {
  padding: 24px 16px;
}
.fav-tree h4 {
  margin: 0 0 12px;
}
.fav-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fav-tabs a {
  color: var(--color-text-secondary);
  font-size: 14px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}
.fav-tabs a:hover {
  background: var(--color-bg-hover);
}
.fav-tabs__active {
  background: var(--color-primary-light-bg) !important;
  color: var(--color-primary) !important;
}
.fav-main {
  padding: 32px;
  max-width: 720px;
}
.fav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.fav-list__item {
  padding: 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  margin-bottom: 8px;
}
.fav-list__item:hover {
  background: var(--color-bg-hover);
}
.fav-list__title {
  font-weight: 500;
}
.fav-list__meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
</style>
