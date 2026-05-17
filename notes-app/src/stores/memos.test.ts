import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMemosStore } from './memos'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('useMemosStore', () => {
  it('refresh loads list from storage', () => {
    const s = useMemosStore()
    s.create({ content: 'a' })
    s.create({ content: 'b' })
    s.refresh()
    expect(s.list).toHaveLength(2)
  })

  it('create adds to list and returns the new memo', () => {
    const s = useMemosStore()
    const m = s.create({ content: 'hi', tags: ['t'] })
    expect(s.list[0].id).toBe(m.id)
    expect(s.list[0].preview).toBe('hi')
  })

  it('loadDetail populates currentDetail', () => {
    const s = useMemosStore()
    const m = s.create({ content: 'full' })
    s.loadDetail(m.id)
    expect(s.currentDetail?.content).toBe('full')
  })

  it('update changes content and refreshes list', () => {
    const s = useMemosStore()
    const m = s.create({ content: 'old' })
    s.update(m.id, { content: 'new' })
    expect(s.list[0].preview).toBe('new')
  })

  it('remove deletes from list', () => {
    const s = useMemosStore()
    const m = s.create({ content: 'gone' })
    s.remove(m.id)
    expect(s.list).toEqual([])
  })
})
