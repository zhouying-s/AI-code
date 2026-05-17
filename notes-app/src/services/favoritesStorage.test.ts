import { describe, it, expect, beforeEach } from 'vitest'
import * as fav from './favoritesStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('favoritesStorage', () => {
  it('loadAll returns empty by default', () => {
    expect(fav.loadAll()).toEqual({ notes: [], memos: [] })
  })

  it('toggle adds an id if not present', () => {
    fav.toggle('note', 'abc')
    expect(fav.loadAll().notes).toEqual(['abc'])
  })

  it('toggle removes an id if already present', () => {
    fav.toggle('note', 'abc')
    fav.toggle('note', 'abc')
    expect(fav.loadAll().notes).toEqual([])
  })

  it('notes and memos are independent', () => {
    fav.toggle('note', 'a')
    fav.toggle('memo', 'b')
    const all = fav.loadAll()
    expect(all.notes).toEqual(['a'])
    expect(all.memos).toEqual(['b'])
  })

  it('isFavorite reflects state', () => {
    expect(fav.isFavorite('note', 'a')).toBe(false)
    fav.toggle('note', 'a')
    expect(fav.isFavorite('note', 'a')).toBe(true)
  })
})
