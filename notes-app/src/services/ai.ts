import { workerJson, workerStream } from './workerClient'
import type { AiSessionMeta, ChatMessage } from '@/types'

export async function listSessions(): Promise<AiSessionMeta[]> {
  const res = await workerJson<{ items: AiSessionMeta[] }>('/api/ai/sessions')
  return res.items
}

export async function createSession(args: {
  title?: string
  model: string
}): Promise<AiSessionMeta> {
  return workerJson<AiSessionMeta>('/api/ai/sessions', {
    method: 'POST',
    body: JSON.stringify(args),
  })
}

export async function renameSession(id: string, title: string): Promise<void> {
  await workerJson(`/api/ai/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export async function deleteSession(id: string): Promise<void> {
  await workerJson(`/api/ai/sessions/${id}`, { method: 'DELETE' })
}

export async function getMessages(id: string): Promise<ChatMessage[]> {
  const res = await workerJson<{ messages: ChatMessage[] }>(
    `/api/ai/sessions/${id}/messages`,
  )
  return res.messages
}

export async function appendMessage(id: string, msg: ChatMessage): Promise<void> {
  await workerJson(`/api/ai/sessions/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role: msg.role, content: msg.content }),
  })
}

export interface StreamChatArgs {
  model: string
  messages: ChatMessage[]
}

/** Async generator that yields content deltas as they arrive from the Worker SSE stream. */
export async function* streamChat(args: StreamChatArgs): AsyncGenerator<string> {
  const stream = await workerStream('/api/ai/chat', args)
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const segments = buffer.split('\n\n')
      buffer = segments.pop() ?? ''
      for (const seg of segments) {
        const line = seg.trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        try {
          const obj = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = obj.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {
          // 忽略坏帧
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
