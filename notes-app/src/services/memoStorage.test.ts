import { describe, it, expect, beforeEach } from 'vitest'
import * as memoStorage from './memoStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('memoStorage', () => {
  it('listMemos returns [] when empty', () => {
    expect(memoStorage.listMemos()).toEqual([])
  })

  it('createMemo persists and returns id', () => {
    const memo = memoStorage.createMemo({ content: 'hello', tags: ['life'] })
    expect(memo.id).toMatch(/^[0-9a-f]{8}$/)
    const list = memoStorage.listMemos()
    expect(list).toHaveLength(1)
    expect(list[0].preview).toBe('hello')
  })

  it('getMemo returns full memo by id', () => {
    const created = memoStorage.createMemo({ content: 'full content', tags: ['x'] })
    const fetched = memoStorage.getMemo(created.id)
    expect(fetched?.content).toBe('full content')
    expect(fetched?.tags).toEqual(['x'])
  })

  it('updateMemo updates content and updatedAt', () => {
    const created = memoStorage.createMemo({ content: 'old' })
    const oldUpdatedAt = created.updatedAt
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        memoStorage.updateMemo(created.id, { content: 'new' })
        const updated = memoStorage.getMemo(created.id)
        expect(updated?.content).toBe('new')
        expect(updated?.updatedAt).not.toBe(oldUpdatedAt)
        resolve()
      }, 10)
    })
  })

  it('deleteMemo removes from list + item store', () => {
    const created = memoStorage.createMemo({ content: 'gone' })
    memoStorage.deleteMemo(created.id)
    expect(memoStorage.listMemos()).toEqual([])
    expect(memoStorage.getMemo(created.id)).toBeNull()
  })

  it('preview truncates long content to 80 chars', () => {
    const long = 'a'.repeat(200)
    memoStorage.createMemo({ content: long })
    const list = memoStorage.listMemos()
    expect(list[0].preview.length).toBeLessThanOrEqual(83) // 80 + '…'
  })

  it('listMemos returns newest first', () => {
    return new Promise<void>((resolve) => {
      const a = memoStorage.createMemo({ content: 'a' })
      setTimeout(() => {
        const b = memoStorage.createMemo({ content: 'b' })
        const list = memoStorage.listMemos()
        expect(list[0].id).toBe(b.id)
        expect(list[1].id).toBe(a.id)
        resolve()
      }, 10)
    })
  })
})
