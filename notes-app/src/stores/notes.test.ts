import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/github', () => ({
  listNotes: vi.fn(),
  getNote: vi.fn(),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
}))

import * as github from '@/services/github'
import { useNotesStore } from './notes'

describe('useNotesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(github.listNotes).mockReset()
    vi.mocked(github.getNote).mockReset()
    vi.mocked(github.saveNote).mockReset()
  })

  it('loadTree fills notesByBook[slug]', async () => {
    vi.mocked(github.listNotes).mockResolvedValueOnce([
      { id: 'a', slug: 'a', title: 'A', filePath: 'books/x/a.md' },
    ])
    const s = useNotesStore()
    await s.loadTree('x')
    expect(s.notesByBook.x).toHaveLength(1)
  })

  it('loadCurrent fetches note and sets saveStatus=clean', async () => {
    vi.mocked(github.getNote).mockResolvedValueOnce({
      id: 'a',
      slug: 'a',
      title: 'A',
      content: '# hello',
      filePath: 'books/x/a.md',
      sha: 's',
    })
    const s = useNotesStore()
    await s.loadCurrent('books/x/a.md')
    expect(s.current?.content).toBe('# hello')
    expect(s.saveStatus).toBe('clean')
  })

  it('updateContent marks dirty', () => {
    const s = useNotesStore()
    s.$patch({
      current: { id: 'a', slug: 'a', title: 'A', content: '', filePath: 'p' },
      saveStatus: 'clean',
    })
    s.updateContent('new')
    expect(s.current?.content).toBe('new')
    expect(s.saveStatus).toBe('dirty')
  })

  it('save persists current and goes saving → saved', async () => {
    vi.mocked(github.saveNote).mockResolvedValueOnce('newSha')
    const s = useNotesStore()
    s.$patch({
      current: {
        id: 'a',
        slug: 'a',
        title: 'A',
        content: 'x',
        filePath: 'books/x/a.md',
        sha: 'old',
      },
      saveStatus: 'dirty',
    })
    await s.save()
    expect(s.current?.sha).toBe('newSha')
    expect(s.saveStatus).toBe('saved')
  })
})
