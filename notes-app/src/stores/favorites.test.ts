import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from './favorites'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('useFavoritesStore', () => {
  it('starts with empty lists', () => {
    const s = useFavoritesStore()
    expect(s.noteIds).toEqual([])
    expect(s.memoIds).toEqual([])
  })

  it('toggleNote adds then removes', () => {
    const s = useFavoritesStore()
    s.toggleNote('n1')
    expect(s.noteIds).toEqual(['n1'])
    s.toggleNote('n1')
    expect(s.noteIds).toEqual([])
  })

  it('toggleMemo independent of notes', () => {
    const s = useFavoritesStore()
    s.toggleMemo('m1')
    expect(s.memoIds).toEqual(['m1'])
    expect(s.noteIds).toEqual([])
  })

  it('isNoteFavorite is reactive', () => {
    const s = useFavoritesStore()
    expect(s.isNoteFavorite('n1')).toBe(false)
    s.toggleNote('n1')
    expect(s.isNoteFavorite('n1')).toBe(true)
  })
})
