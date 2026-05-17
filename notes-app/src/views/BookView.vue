<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree><DocumentTree /></template>
    <template #main>
      <div v-if="!currentNote" class="book-empty">
        <EmptyState icon="📝" title="选择左侧的笔记开始编辑" hint="或点击 + 新建笔记" />
      </div>
      <template v-else>
        <header class="editor-header">
          <input
            class="editor-title"
            :value="currentNote.title"
            placeholder="无标题"
            @input="onTitleChange(($event.target as HTMLInputElement).value)"
          />
          <span class="editor-status">{{ statusText }}</span>
          <el-button
            text
            size="small"
            :loading="notesStore.saveStatus === 'saving'"
            @click="onManualSave"
          >
            保存
          </el-button>
        </header>
        <VditorEditor :model-value="currentNote.content" @update:model-value="onContentChange" />
      </template>
    </template>
  </AppShell>

  <ConflictDialog
    v-model="showConflict"
    :remote-content="conflictRemoteContent"
    :local-content="conflictLocalContent"
    @resolve="onConflictResolve"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import DocumentTree from '@/components/layout/DocumentTree.vue'
import VditorEditor from '@/components/editor/VditorEditor.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConflictDialog from '@/components/common/ConflictDialog.vue'
import { useBooksStore } from '@/stores/books'
import { useNotesStore } from '@/stores/notes'
import { debounce } from '@/utils/debounce'
import { ElMessage } from 'element-plus'
import type { NoteSummary } from '@/types'

const route = useRoute()
const booksStore = useBooksStore()
const notesStore = useNotesStore()
const { current: currentNote, saveStatus } = storeToRefs(notesStore)

const showConflict = ref(false)
const conflictRemoteContent = ref('')
const conflictLocalContent = ref('')

const statusText = computed(() => {
  switch (saveStatus.value) {
    case 'dirty':
      return '未保存'
    case 'saving':
      return '保存中…'
    case 'saved':
      return '已保存'
    case 'conflict':
      return '远端有更新'
    case 'error':
      return '保存失败'
    default:
      return ''
  }
})

const autoSave = debounce(async () => {
  try {
    await notesStore.save()
  } catch (err) {
    handleSaveError(err)
  }
}, 2000)

function onContentChange(content: string) {
  notesStore.updateContent(content)
  autoSave()
}

function onTitleChange(title: string) {
  notesStore.updateMeta({ title })
  autoSave()
}

async function onManualSave() {
  autoSave.cancel()
  try {
    await notesStore.save()
    ElMessage.success('已保存')
  } catch (err) {
    handleSaveError(err)
  }
}

function handleSaveError(err: unknown) {
  const conflict = err as { type?: string; remoteContent?: string }
  if (conflict.type === 'conflict' && currentNote.value) {
    conflictRemoteContent.value = conflict.remoteContent ?? ''
    conflictLocalContent.value = currentNote.value.content
    showConflict.value = true
  } else {
    ElMessage.error((err as Error).message ?? '保存失败')
  }
}

async function onConflictResolve(choice: 'overwrite' | 'accept') {
  if (!currentNote.value) return
  if (choice === 'accept') {
    notesStore.updateContent(conflictRemoteContent.value)
    await notesStore.loadCurrent(currentNote.value.filePath)
  } else {
    const fresh = await import('@/services/github').then((m) =>
      m.getNote(currentNote.value!.filePath),
    )
    notesStore.$patch({ current: { ...currentNote.value!, sha: fresh.sha } })
    await notesStore.save()
  }
  ElMessage.success('已处理冲突')
}

async function loadCurrentFromRoute() {
  const bookSlug = route.params.bookSlug as string
  const noteId = route.params.noteId as string | undefined
  if (!bookSlug) return
  booksStore.setCurrent(bookSlug)
  if (!noteId) {
    notesStore.$patch({ current: null })
    return
  }
  if (!notesStore.notesByBook[bookSlug]) await notesStore.loadTree(bookSlug)
  const note: NoteSummary | undefined = notesStore.notesByBook[bookSlug]?.find(
    (n) => n.id === noteId,
  )
  if (note) await notesStore.loadCurrent(note.filePath)
}

onMounted(loadCurrentFromRoute)
watch(() => [route.params.bookSlug, route.params.noteId], loadCurrentFromRoute)
</script>

<style scoped>
.book-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.editor-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border);
}
.editor-title {
  flex: 1;
  border: none;
  outline: none;
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
  background: transparent;
}
.editor-status {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
