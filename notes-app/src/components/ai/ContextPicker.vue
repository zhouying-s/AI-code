<template>
  <el-popover :width="320" trigger="click" placement="top-start">
    <template #reference>
      <el-button text size="small" :icon="Promotion">
        @ {{ pickedCount }} 篇笔记作上下文
      </el-button>
    </template>
    <div class="picker">
      <el-input v-model="filter" size="small" placeholder="搜笔记标题" />
      <ul class="picker__list">
        <li
          v-for="n in filtered"
          :key="n.id"
          class="picker__item"
          :class="{ 'picker__item--sel': picked.has(n.id) }"
          @click="toggle(n.id)"
        >
          <span>{{ n.title }}</span>
          <span class="picker__meta">{{ n.bookSlug }}</span>
        </li>
      </ul>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Promotion } from '@element-plus/icons-vue'
import { useSearchStore } from '@/stores/search'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

const search = useSearchStore()
const filter = ref('')
const picked = computed(() => new Set(props.modelValue))

const filtered = computed(() => {
  const all = search.allIndexed
  if (!filter.value.trim()) return all.slice(0, 30)
  const q = filter.value.toLowerCase()
  return all.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 30)
})

const pickedCount = computed(() => props.modelValue.length)

function toggle(id: string) {
  const set = new Set(props.modelValue)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  emit('update:modelValue', Array.from(set))
}

watch(
  () => search.indexBuilt,
  async (built) => {
    if (!built) await search.ensureIndex().catch(() => {})
  },
  { immediate: true },
)
</script>

<style scoped>
.picker__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
}
.picker__item {
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.picker__item:hover {
  background: var(--color-bg-hover);
}
.picker__item--sel {
  background: var(--color-primary-light-bg);
  color: var(--color-primary);
}
.picker__meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
</style>
