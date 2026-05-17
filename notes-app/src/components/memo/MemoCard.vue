<template>
  <div class="card">
    <div v-if="!editing" class="card__view">
      <div class="card__content">{{ memo.preview }}</div>
      <div class="card__meta">
        <time class="card__time">{{ formatTime(memo.createdAt) }}</time>
        <span v-for="t in memo.tags" :key="t" class="card__tag">#{{ t }}</span>
      </div>
      <div class="card__actions">
        <el-button
          text
          size="small"
          :type="isFavorite ? 'primary' : 'default'"
          :icon="StarFilled"
          @click="toggleFav"
        />
        <el-button text size="small" :icon="Edit" @click="startEdit" />
        <el-button text size="small" :icon="Delete" @click="onDelete" />
      </div>
    </div>

    <div v-else class="card__edit">
      <textarea v-model="editText" rows="3" class="card__textarea" />
      <div class="card__edit-bar">
        <el-button size="small" @click="cancel">取消</el-button>
        <el-button type="primary" size="small" @click="save">保存</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { StarFilled, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useMemosStore } from '@/stores/memos'
import { useFavoritesStore } from '@/stores/favorites'
import type { MemoListItem } from '@/services/memoStorage'

const props = defineProps<{ memo: MemoListItem }>()
const memos = useMemosStore()
const favorites = useFavoritesStore()

const isFavorite = computed(() => favorites.memoIds.includes(props.memo.id))
const editing = ref(false)
const editText = ref('')

function startEdit() {
  memos.loadDetail(props.memo.id)
  editText.value = memos.currentDetail?.content ?? props.memo.preview.replace(/…$/, '')
  editing.value = true
}

function cancel() {
  editing.value = false
  editText.value = ''
}

function save() {
  if (!editText.value.trim()) return
  memos.update(props.memo.id, { content: editText.value.trim() })
  editing.value = false
  ElMessage.success('已保存')
}

async function onDelete() {
  try {
    await ElMessageBox.confirm('删除这条小记？', '确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  memos.remove(props.memo.id)
  ElMessage.success('已删除')
}

function toggleFav() {
  favorites.toggleMemo(props.memo.id)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 12px;
}
.card__content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: var(--color-text-primary);
}
.card__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.card__tag {
  background: var(--color-bg-hover);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}
.card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}
.card__textarea {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px;
  resize: vertical;
}
.card__edit-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
