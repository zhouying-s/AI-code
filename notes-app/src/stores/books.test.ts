import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/github', () => ({
  listBooks: vi.fn(),
  createBook: vi.fn(),
  deleteBook: vi.fn(),
}))

import * as github from '@/services/github'
import { useBooksStore } from './books'

describe('useBooksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(github.listBooks).mockReset()
    vi.mocked(github.createBook).mockReset()
    vi.mocked(github.deleteBook).mockReset()
  })

  it('refresh loads books and sets current to first when empty', async () => {
    vi.mocked(github.listBooks).mockResolvedValueOnce([
      { slug: 'default', name: 'Default' },
      { slug: 'react', name: 'React' },
    ])
    const s = useBooksStore()
    await s.refresh()
    expect(s.books).toHaveLength(2)
    expect(s.currentSlug).toBe('default')
  })

  it('create adds book then refreshes', async () => {
    vi.mocked(github.createBook).mockResolvedValueOnce()
    vi.mocked(github.listBooks).mockResolvedValueOnce([{ slug: 'new', name: 'New' }])
    const s = useBooksStore()
    await s.create({ slug: 'new', name: 'New' })
    expect(github.createBook).toHaveBeenCalledWith({ slug: 'new', name: 'New' })
    expect(s.books).toEqual([{ slug: 'new', name: 'New' }])
  })
})
