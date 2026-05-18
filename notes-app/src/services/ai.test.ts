import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  const auth = useAuthStore()
  auth.setConfig({
    workerUrl: 'https://x.workers.dev',
    masterToken: 'tok',
    githubPat: 'p',
    owner: 'o',
    repo: 'r',
  })
  vi.restoreAllMocks()
})

describe('ai.listSessions', () => {
  it('returns items from worker', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'a',
              title: 'T',
              model: 'deepseek-chat',
              createdAt: '',
              updatedAt: '',
              msgCount: 0,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const { listSessions } = await import('./ai')
    const sessions = await listSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].id).toBe('a')
  })
})

describe('ai.streamChat', () => {
  it('parses SSE chunks into delta strings', async () => {
    const sseBody =
      'data: {"choices":[{"delta":{"content":"hel"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n' +
      'data: [DONE]\n\n'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(sseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )
    const { streamChat } = await import('./ai')
    const chunks: string[] = []
    for await (const delta of streamChat({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'hi' }],
    })) {
      chunks.push(delta)
    }
    expect(chunks.join('')).toBe('hello')
  })
})
