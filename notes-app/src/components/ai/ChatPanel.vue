<template>
  <div class="chat">
    <header class="chat__header">
      <ModelSwitcher v-model="model" />
      <ContextPicker v-model="contextNoteIds" />
    </header>

    <div ref="streamRef" class="chat__stream">
      <EmptyState
        v-if="store.currentMessages.length === 0 && !store.streaming"
        icon="💬"
        title="开始一段对话"
        hint="输入框写下你的问题，或者 @ 一篇笔记作上下文"
      />
      <MessageBubble
        v-for="(m, i) in store.currentMessages"
        :key="i"
        :msg="m"
        :streaming="
          store.streaming && i === store.currentMessages.length - 1 && m.role === 'assistant'
        "
        @insert="onInsert"
      />
    </div>

    <footer class="chat__input">
      <textarea
        v-model="text"
        class="chat__textarea"
        placeholder="给 AI 说点什么…（Ctrl+Enter 发送）"
        rows="3"
        :disabled="store.streaming"
        @keydown.ctrl.enter.prevent="onSend"
        @keydown.meta.enter.prevent="onSend"
      />
      <el-button type="primary" :loading="store.streaming" :disabled="!text.trim()" @click="onSend">
        发送
      </el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAiStore } from '@/stores/ai'
import { useNotesStore } from '@/stores/notes'
import * as github from '@/services/github'
import { useSearchStore } from '@/stores/search'
import { ElMessage } from 'element-plus'
import ModelSwitcher from './ModelSwitcher.vue'
import MessageBubble from './MessageBubble.vue'
import ContextPicker from './ContextPicker.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import type { ChatMessage, DeepSeekModel } from '@/types'

const store = useAiStore()
const notesStore = useNotesStore()
const search = useSearchStore()
const text = ref('')
const streamRef = ref<HTMLElement | null>(null)

const model = computed<DeepSeekModel>({
  get: () => store.model,
  set: (v) => store.setModel(v),
})

const contextNoteIds = computed<string[]>({
  get: () => store.contextNoteIds,
  set: (v) => store.setContextNoteIds(v),
})

async function buildContextSnippets(): Promise<ChatMessage[]> {
  if (contextNoteIds.value.length === 0) return []
  const snippets: string[] = []
  for (const id of contextNoteIds.value) {
    const meta = search.allIndexed.find((n) => n.id === id)
    if (!meta) continue
    try {
      const full = await github.getNote(meta.filePath)
      snippets.push(`# ${full.title}\n${full.content.slice(0, 2000)}`)
    } catch {
      // ignore — 单篇取不到不影响整体
    }
  }
  if (snippets.length === 0) return []
  return [
    {
      role: 'system',
      content: '以下是用户选定的笔记内容，回答问题时请参考：\n\n' + snippets.join('\n\n---\n\n'),
    },
  ]
}

async function onSend() {
  if (!text.value.trim() || store.streaming) return
  const userInput = text.value.trim()
  text.value = ''
  const contextSnippets = await buildContextSnippets()
  try {
    await store.sendUserMessage(userInput, contextSnippets)
  } catch (e) {
    ElMessage.error((e as Error).message ?? '发送失败')
  }
}

function onInsert(content: string) {
  if (!notesStore.current) {
    ElMessage.warning('请先在 BookView 打开一篇笔记')
    return
  }
  notesStore.updateContent(notesStore.current.content + '\n\n' + content)
  ElMessage.success('已插入到当前笔记（记得保存）')
}

watch(
  () => store.currentMessages.length,
  async () => {
    await nextTick()
    streamRef.value?.scrollTo({
      top: streamRef.value.scrollHeight,
      behavior: 'smooth',
    })
  },
)
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.chat__header {
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
}
.chat__stream {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 820px;
  width: 100%;
  margin: 0 auto;
}
.chat__input {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-sidebar);
}
.chat__textarea {
  flex: 1;
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  resize: none;
  outline: none;
}
.chat__textarea:focus {
  border-color: var(--color-primary);
}
</style>
