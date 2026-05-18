import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/ai', () => ({
  listSessions: vi.fn(),
  createSession: vi.fn(),
  renameSession: vi.fn(),
  deleteSession: vi.fn(),
  getMessages: vi.fn(),
  appendMessage: vi.fn(),
  streamChat: vi.fn(),
}))

import * as ai from '@/services/ai'
import { useAiStore } from './ai'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.mocked(ai.listSessions).mockReset()
  vi.mocked(ai.createSession).mockReset()
  vi.mocked(ai.getMessages).mockReset()
  vi.mocked(ai.appendMessage).mockReset()
  vi.mocked(ai.streamChat).mockReset()
})

describe('useAiStore', () => {
  it('refresh loads sessions', async () => {
    vi.mocked(ai.listSessions).mockResolvedValueOnce([
      {
        id: 'a',
        title: 'T',
        model: 'deepseek-chat',
        createdAt: '',
        updatedAt: '',
        msgCount: 0,
      },
    ])
    const s = useAiStore()
    await s.refresh()
    expect(s.sessions).toHaveLength(1)
  })

  it('startNewSession creates session and sets currentId', async () => {
    vi.mocked(ai.createSession).mockResolvedValueOnce({
      id: 'x',
      title: '新会话',
      model: 'deepseek-chat',
      createdAt: '',
      updatedAt: '',
      msgCount: 0,
    })
    const s = useAiStore()
    const created = await s.startNewSession()
    expect(s.currentSessionId).toBe('x')
    expect(created.id).toBe('x')
  })

  it('selectSession loads messages', async () => {
    vi.mocked(ai.getMessages).mockResolvedValueOnce([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ])
    const s = useAiStore()
    await s.selectSession('a')
    expect(s.currentMessages).toHaveLength(2)
    expect(s.currentSessionId).toBe('a')
  })

  it('sendUserMessage appends user msg then streams assistant delta', async () => {
    vi.mocked(ai.getMessages).mockResolvedValueOnce([])
    vi.mocked(ai.appendMessage).mockResolvedValue()
    async function* fakeStream() {
      yield 'hel'
      yield 'lo'
    }
    vi.mocked(ai.streamChat).mockReturnValueOnce(fakeStream())
    const s = useAiStore()
    await s.selectSession('a')
    await s.sendUserMessage('say hi')
    expect(s.currentMessages.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(s.currentMessages[1].content).toBe('hello')
    expect(ai.appendMessage).toHaveBeenCalledTimes(2)
  })
})
