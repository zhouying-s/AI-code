<template>
  <el-dialog v-model="visible" :show-close="false" width="640" top="10vh" class="palette">
    <template #header>
      <div class="palette__header">
        <el-icon><Search /></el-icon>
        <input
          ref="inputRef"
          v-model="query"
          class="palette__input"
          placeholder="搜笔记标题、标签或摘要 …"
          @input="onInput"
          @keydown.escape="visible = false"
          @keydown.enter.prevent="onEnter"
          @keydown.down.prevent="moveSel(1)"
          @keydown.up.prevent="moveSel(-1)"
        />
        <span class="palette__hint">Esc 关闭 · ↑↓ 切换 · Enter 打开</span>
      </div>
    </template>

    <div v-if="searchStore.loading" class="palette__msg">建立索引中…</div>

    <ul v-else-if="results.length > 0" class="palette__list">
      <li
        v-for="(r, i) in results"
        :key="r.note.id"
        class="palette__item"
        :class="{ 'palette__item--sel': i === selected }"
        @click="open(r)"
        @mouseenter="selected = i"
      >
        <div class="palette__title">{{ r.note.title }}</div>
        <div class="palette__meta">
          <span class="palette__book">{{ r.note.bookSlug }}</span>
          <span v-if="r.note.summary" class="palette__summary">
            {{ r.note.summary }}
          </span>
        </div>
      </li>
    </ul>

    <div v-else-if="query" class="palette__msg">没有匹配的笔记</div>

    <div v-else-if="searchStore.recentQueries.length > 0" class="palette__msg">
      <div class="palette__recent-label">最近搜索</div>
      <div
        v-for="q in searchStore.recentQueries"
        :key="q"
        class="palette__recent"
        @click="pickRecent(q)"
      >
        {{ q }}
      </div>
    </div>

    <div v-else class="palette__msg">输入关键词搜索全部知识库</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useSearchStore } from '@/stores/search'
import { storeToRefs } from 'pinia'
import type { SearchResult } from '@/services/search'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const router = useRouter()
const searchStore = useSearchStore()
const { results } = storeToRefs(searchStore)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const query = ref('')
const selected = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

watch(visible, async (v) => {
  if (v) {
    try {
      await searchStore.ensureIndex()
    } catch {
      /* error already in store */
    }
    await nextTick()
    inputRef.value?.focus()
    if (query.value) onInput()
  } else {
    query.value = ''
    selected.value = 0
  }
})

function onInput() {
  searchStore.query(query.value)
  selected.value = 0
}

function pickRecent(q: string) {
  query.value = q
  onInput()
}

function moveSel(delta: number) {
  if (results.value.length === 0) return
  selected.value = (selected.value + delta + results.value.length) % results.value.length
}

function onEnter() {
  if (results.value[selected.value]) open(results.value[selected.value])
}

function open(r: SearchResult) {
  visible.value = false
  router.push(`/book/${r.note.bookSlug}/${r.note.id}`)
}
</script>

<style scoped>
.palette :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid var(--color-border);
}
.palette :deep(.el-dialog__body) {
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
}
.palette__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}
.palette__input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  background: transparent;
}
.palette__hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
.palette__msg {
  padding: 24px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.palette__list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.palette__item {
  padding: 8px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.palette__item--sel {
  background: var(--color-primary-light-bg);
  border-left-color: var(--color-primary);
}
.palette__title {
  font-weight: 500;
}
.palette__meta {
  display: flex;
  gap: 10px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.palette__book {
  background: var(--color-bg-hover);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}
.palette__recent-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 0 0 8px;
}
.palette__recent {
  padding: 4px 8px;
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.palette__recent:hover {
  background: var(--color-bg-hover);
}
</style>
