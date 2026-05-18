import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('workerClient', () => {
  it('throws when workerUrl missing', async () => {
    const { workerJson } = await import('./workerClient')
    await expect(workerJson('/api/memos')).rejects.toThrow(/worker.*not configured/i)
  })

  it('throws when masterToken missing', async () => {
    const auth = useAuthStore()
    auth.setConfig({
      workerUrl: 'https://x.workers.dev',
      githubPat: 'p',
      owner: 'o',
      repo: 'r',
    })
    const { workerJson } = await import('./workerClient')
    await expect(workerJson('/api/memos')).rejects.toThrow(/master token/i)
  })

  it('GET sends Authorization Bearer header', async () => {
    const auth = useAuthStore()
    auth.setConfig({
      workerUrl: 'https://x.workers.dev',
      masterToken: 'tok',
      githubPat: 'p',
      owner: 'o',
      repo: 'r',
    })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const { workerJson } = await import('./workerClient')
    await workerJson('/api/memos')
    const call = fetchSpy.mock.calls[0]
    expect(call[0]).toBe('https://x.workers.dev/api/memos')
    const headers = new Headers((call[1] as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer tok')
  })

  it('throws on non-2xx with body', async () => {
    const auth = useAuthStore()
    auth.setConfig({
      workerUrl: 'https://x.workers.dev',
      masterToken: 'tok',
      githubPat: 'p',
      owner: 'o',
      repo: 'r',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"error":"nope"}', { status: 400 }),
    )
    const { workerJson } = await import('./workerClient')
    await expect(workerJson('/api/memos')).rejects.toThrow(/nope/i)
  })
})
