<template>
  <div class="tree">
    <header class="tree__header">
      <span>📚 {{ currentBookName }}</span>
      <el-button text size="small" :icon="Plus" @click="onNewNote" />
    </header>

    <div v-if="loading" class="tree__hint">加载中…</div>
    <div v-else-if="notes.length === 0" class="tree__empty">还没有笔记</div>

    <ul class="tree__list">
      <li
        v-for="note in notes"
        :key="note.filePath"
        class="tree__item"
        :class="{ 'tree__item--active': route.params.noteId === note.id }"
        @click="onSelect(note)"
      >
        <el-icon><Document /></el-icon>
        <span class="tree__title">{{ note.title }}</span>
        <el-dropdown trigger="click" @command="(c: string) => onAction(c, note)">
          <el-icon class="tree__more" @click.stop><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">重命名</el-dropdown-item>
              <el-dropdown-item command="delete" style="color: var(--color-danger)">
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </li>
    </ul>

    <ConfirmDialog
      v-model="showConfirm"
      :title="`删除笔记「${pendingNote?.title}」？`"
      message="此操作会从 GitHub 仓库删除文件。"
      confirm-label="删除"
      danger
      @confirm="performDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBooksStore } from '@/stores/books'
import { useNotesStore } from '@/stores/notes'
import { Plus, MoreFilled, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { titleToSlug } from '@/utils/slug'
import { shortId } from '@/utils/uuid'
import * as github from '@/services/github'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { NoteSummary } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const notesStore = useNotesStore()
const loading = ref(false)
const showConfirm = ref(false)
const pendingNote = ref<NoteSummary | null>(null)

const { currentSlug } = storeToRefs(booksStore)
const notes = computed(() =>
  currentSlug.value ? (notesStore.notesByBook[currentSlug.value] ?? []) : [],
)
const currentBookName = computed(
  () => booksStore.books.find((b) => b.slug === currentSlug.value)?.name ?? '',
)

watch(
  currentSlug,
  async (slug) => {
    if (!slug) return
    loading.value = true
    try {
      await notesStore.loadTree(slug)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function onSelect(note: NoteSummary) {
  router.push(`/book/${currentSlug.value}/${note.id}`)
}

async function onNewNote() {
  if (!currentSlug.value) return
  const result = await ElMessageBox.prompt('笔记标题', '新建笔记', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
  }).catch(() => null)
  if (!result || !result.value) return
  const title = result.value
  const slug = titleToSlug(title)
  const filePath = `books/${currentSlug.value}/${slug}.md`
  const id = shortId()
  await github.saveNote({
    filePath,
    meta: {
      id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    content: `# ${title}\n\n`,
  })
  await notesStore.loadTree(currentSlug.value)
  router.push(`/book/${currentSlug.value}/${id}`)
  ElMessage.success('已创建')
}

function onAction(cmd: string, note: NoteSummary) {
  if (cmd === 'delete') {
    pendingNote.value = note
    showConfirm.value = true
  } else if (cmd === 'rename') {
    promptRename(note)
  }
}

async function performDelete() {
  if (!pendingNote.value) return
  const full = await github.getNote(pendingNote.value.filePath)
  await notesStore.removeNote(pendingNote.value.filePath, full.sha!)
  await notesStore.loadTree(currentSlug.value!)
  if (route.params.noteId === pendingNote.value.id) {
    router.push(`/book/${currentSlug.value}`)
  }
  pendingNote.value = null
  ElMessage.success('已删除')
}

async function promptRename(note: NoteSummary) {
  const result = await ElMessageBox.prompt('新标题', '重命名', {
    inputValue: note.title,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).catch(() => null)
  if (!result || !result.value || result.value === note.title) return
  const newTitle = result.value
  const newSlug = titleToSlug(newTitle)
  const newPath = `books/${currentSlug.value}/${newSlug}.md`
  const full = await github.getNote(note.filePath)
  await github.saveNote({
    filePath: newPath,
    meta: {
      id: full.id,
      title: newTitle,
      createdAt: full.updatedAt,
      updatedAt: new Date().toISOString(),
    },
    content: full.content,
  })
  await github.deleteNote(note.filePath, full.sha!)
  await notesStore.loadTree(currentSlug.value!)
  ElMessage.success('已重命名')
}
</script>

<style scoped>
.tree {
  padding: 16px 8px;
}
.tree__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 12px;
  font-weight: 600;
}
.tree__hint,
.tree__empty {
  padding: 12px 8px;
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.tree__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tree__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.tree__item:hover {
  background: var(--color-bg-hover);
}
.tree__item:hover .tree__more {
  opacity: 1;
}
.tree__item--active {
  background: var(--color-primary-light-bg);
  color: var(--color-primary);
  font-weight: 500;
}
.tree__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree__more {
  opacity: 0;
  transition: opacity 0.12s;
}
</style>
