import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AiSessionMeta, ChatMessage, DeepSeekModel } from '@/types'
import * as ai from '@/services/ai'

export const useAiStore = defineStore('ai', () => {
  const sessions = ref<AiSessionMeta[]>([])
  const currentSessionId = ref<string | null>(null)
  const currentMessages = ref<ChatMessage[]>([])
  const model = ref<DeepSeekModel>('deepseek-chat')
  const streaming = ref(false)
  const error = ref<string | null>(null)
  const contextNoteIds = ref<string[]>([])

  async function refresh() {
    sessions.value = await ai.listSessions()
  }

  async function startNewSession(title?: string): Promise<AiSessionMeta> {
    const created = await ai.createSession({ title, model: model.value })
    sessions.value = [created, ...sessions.value]
    currentSessionId.value = created.id
    currentMessages.value = []
    return created
  }

  async function selectSession(id: string) {
    currentSessionId.value = id
    currentMessages.value = await ai.getMessages(id)
  }

  async function renameCurrent(title: string) {
    if (!currentSessionId.value) return
    await ai.renameSession(currentSessionId.value, title)
    sessions.value = sessions.value.map((s) =>
      s.id === currentSessionId.value ? { ...s, title } : s,
    )
  }

  async function removeSession(id: string) {
    await ai.deleteSession(id)
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = null
      currentMessages.value = []
    }
  }

  function setModel(m: DeepSeekModel) {
    model.value = m
  }

  function setContextNoteIds(ids: string[]) {
    contextNoteIds.value = ids
  }

  async function sendUserMessage(content: string, contextSnippets: ChatMessage[] = []) {
    if (!currentSessionId.value) {
      const created = await startNewSession()
      currentSessionId.value = created.id
    }
    error.value = null
    const userMsg: ChatMessage = {
      role: 'user',
      content,
      ts: new Date().toISOString(),
    }
    currentMessages.value = [...currentMessages.value, userMsg]
    await ai.appendMessage(currentSessionId.value, userMsg)

    const allMessages: ChatMessage[] = [...contextSnippets, ...currentMessages.value]

    streaming.value = true
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      ts: new Date().toISOString(),
    }
    currentMessages.value = [...currentMessages.value, assistantMsg]
    try {
      for await (const delta of ai.streamChat({ model: model.value, messages: allMessages })) {
        assistantMsg.content += delta
        currentMessages.value = [...currentMessages.value.slice(0, -1), { ...assistantMsg }]
      }
      await ai.appendMessage(currentSessionId.value, assistantMsg)
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      streaming.value = false
    }
  }

  return {
    sessions,
    currentSessionId,
    currentMessages,
    model,
    streaming,
    error,
    contextNoteIds,
    refresh,
    startNewSession,
    selectSession,
    renameCurrent,
    removeSession,
    setModel,
    setContextNoteIds,
    sendUserMessage,
  }
})
