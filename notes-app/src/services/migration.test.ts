import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import * as memoStorage from './memoStorage'
import * as fav from './favoritesStorage'

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

describe('migrateToWorker', () => {
  it('uploads memos + favorites and reports counts', async () => {
    memoStorage.createMemo({ content: 'm1' })
    memoStorage.createMemo({ content: 'm2' })
    fav.toggle('note', 'n1')
    fav.toggle('memo', memoStorage.listMemos()[0].id)

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response('{"ok":true}', { status: 200 })))

    const { migrateToWorker } = await import('./migration')
    const result = await migrateToWorker()
    expect(result.memos).toBe(2)
    expect(result.favorites.notes).toBe(1)
    expect(result.favorites.memos).toBe(1)
    expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(4)
  })

  it('reports errors for failing items but does not abort the rest', async () => {
    memoStorage.createMemo({ content: 'good' })
    memoStorage.createMemo({ content: 'bad' })

    let callIdx = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      callIdx++
      if (callIdx === 1) {
        return Promise.resolve(new Response('{"error":"boom"}', { status: 500 }))
      }
      return Promise.resolve(new Response('{"ok":true}', { status: 200 }))
    })

    const { migrateToWorker } = await import('./migration')
    const result = await migrateToWorker()
    expect(result.memos).toBe(1)
    expect(result.errors.length).toBe(1)
  })
})
