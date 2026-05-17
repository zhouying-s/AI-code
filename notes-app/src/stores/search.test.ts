import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/github', () => ({
  listBooks: vi.fn(),
  listNotes: vi.fn(),
}))

vi.mock('@/services/search', () => ({
  buildIndex: vi.fn(),
  search: vi.fn(),
  resetIndex: vi.fn(),
}))

import * as github from '@/services/github'
import * as searchSvc from '@/services/search'
import { useSearchStore } from './search'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.mocked(github.listBooks).mockReset()
  vi.mocked(github.listNotes).mockReset()
  vi.mocked(searchSvc.buildIndex).mockReset()
  vi.mocked(searchSvc.search).mockReset()
  vi.mocked(searchSvc.resetIndex).mockReset()
})

describe('useSearchStore', () => {
  it('ensureIndex loads all notes across books and builds index', async () => {
    vi.mocked(github.listBooks).mockResolvedValueOnce([
      { slug: 'react', name: 'React' },
      { slug: 'vue', name: 'Vue' },
    ])
    vi.mocked(github.listNotes)
      .mockResolvedValueOnce([
        {
          id: 'a',
          slug: 'a',
          title: 'A',
          filePath: 'books/react/a.md',
          summary: 's',
          tags: ['t'],
        },
      ])
      .mockResolvedValueOnce([{ id: 'b', slug: 'b', title: 'B', filePath: 'books/vue/b.md' }])

    const s = useSearchStore()
    await s.ensureIndex()
    expect(s.indexBuilt).toBe(true)
    expect(searchSvc.buildIndex).toHaveBeenCalledOnce()
    const passed = vi.mocked(searchSvc.buildIndex).mock.calls[0][0]
    expect(passed).toHaveLength(2)
    expect(passed[0]).toMatchObject({ id: 'a', bookSlug: 'react' })
  })

  it('query records into recentQueries (capped 5, dedupe)', () => {
    vi.mocked(searchSvc.search).mockReturnValue([])
    const s = useSearchStore()
    s.query('a')
    s.query('b')
    s.query('a') // dedupe → moves to front
    expect(s.recentQueries).toEqual(['a', 'b'])
  })

  it('query produces results from search service', () => {
    vi.mocked(searchSvc.search).mockReturnValue([
      { note: { id: 'x', bookSlug: 'r', title: 'X', filePath: 'p' }, score: 0.1 },
    ])
    const s = useSearchStore()
    s.query('x')
    expect(s.results).toHaveLength(1)
    expect(s.results[0].note.id).toBe('x')
  })

  it('invalidate resets index and results', () => {
    const s = useSearchStore()
    s.$patch({
      indexBuilt: true,
      results: [{ note: { id: 'x', bookSlug: 'r', title: 'X', filePath: 'p' }, score: 0.1 }],
    })
    s.invalidate()
    expect(s.indexBuilt).toBe(false)
    expect(s.results).toEqual([])
    expect(searchSvc.resetIndex).toHaveBeenCalledOnce()
  })

  it('exposes allIndexed after ensureIndex', async () => {
    vi.mocked(github.listBooks).mockResolvedValueOnce([{ slug: 'b', name: 'B' }])
    vi.mocked(github.listNotes).mockResolvedValueOnce([
      { id: 'x', slug: 'x', title: 'X', filePath: 'p' },
    ])
    const s = useSearchStore()
    await s.ensureIndex()
    expect(s.allIndexed).toHaveLength(1)
    expect(s.allIndexed[0].id).toBe('x')
  })
})
