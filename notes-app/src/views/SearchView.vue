<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="search-tree">
        <h4>搜索</h4>
        <p class="hint">提示：在任何页面按 Ctrl + J 唤起搜索浮层</p>
        <div v-if="searchStore.recentQueries.length > 0">
          <div class="label">最近搜索</div>
          <a
            v-for="recent in searchStore.recentQueries"
            :key="recent"
            href="#"
            class="recent"
            @click.prevent="goTo(recent)"
          >
            {{ recent }}
          </a>
        </div>
      </div>
    </template>
    <template #main>
      <div class="search-main">
        <header>
          <input
            v-model="q"
            placeholder="搜笔记标题、标签或摘要 …"
            class="search-input"
            @input="onInput"
          />
        </header>

        <div v-if="searchStore.loading" class="empty">建立索引中…</div>
        <div v-else-if="!q" class="empty">输入关键词开始搜索</div>
        <div v-else-if="searchStore.results.length === 0" class="empty">没有匹配</div>

        <ul v-else class="results">
          <li
            v-for="r in searchStore.results"
            :key="r.note.id"
            class="result"
            @click="open(r.note)"
          >
            <div class="result__title">{{ r.note.title }}</div>
            <div class="result__meta">
              <span class="result__book">{{ r.note.bookSlug }}</span>
              <span v-if="r.note.summary" class="result__summary">
                {{ r.note.summary }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import { useSearchStore } from '@/stores/search'
import type { SearchableNote } from '@/services/search'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()
const q = ref((route.query.q as string) ?? '')

onMounted(async () => {
  await searchStore.ensureIndex().catch(() => {})
  if (q.value) searchStore.query(q.value)
})

watch(
  () => route.query.q,
  (val) => {
    q.value = (val as string) ?? ''
    if (q.value) searchStore.query(q.value)
  },
)

function onInput() {
  router.replace({ query: { q: q.value || undefined } })
  searchStore.query(q.value)
}

function goTo(qq: string) {
  router.push({ path: '/search', query: { q: qq } })
}

function open(note: SearchableNote) {
  router.push(`/book/${note.bookSlug}/${note.id}`)
}
</script>

<style scoped>
.search-tree {
  padding: 24px 16px;
}
.search-tree h4 {
  margin: 0 0 8px;
}
.hint {
  color: var(--color-text-tertiary);
  font-size: 12px;
  margin: 0 0 16px;
}
.label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 12px 0 6px;
  text-transform: uppercase;
}
.recent {
  display: block;
  padding: 4px 0;
  font-size: 13px;
}
.search-main {
  padding: 24px 32px;
}
.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 15px;
  outline: none;
}
.search-input:focus {
  border-color: var(--color-primary);
}
.empty {
  padding: 32px 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.results {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
}
.result {
  padding: 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.result:hover {
  background: var(--color-bg-hover);
}
.result__title {
  font-weight: 500;
}
.result__meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.result__book {
  background: var(--color-bg-hover);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}
</style>
