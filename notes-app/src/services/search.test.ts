import { describe, it, expect, beforeEach } from 'vitest'
import { buildIndex, search, resetIndex } from './search'
import type { SearchableNote } from './search'

const sample: SearchableNote[] = [
  {
    id: 'a',
    bookSlug: 'react',
    title: 'useEffect 详解',
    summary: '副作用机制',
    filePath: 'books/react/useeffect.md',
    tags: ['react', 'hooks'],
  },
  {
    id: 'b',
    bookSlug: 'react',
    title: 'useState 入门',
    summary: '响应式状态',
    filePath: 'books/react/usestate.md',
    tags: ['react'],
  },
  {
    id: 'c',
    bookSlug: 'vue',
    title: 'Vue 响应式原理',
    summary: 'reactivity',
    filePath: 'books/vue/reactivity.md',
    tags: ['vue'],
  },
]

beforeEach(() => resetIndex())

describe('search', () => {
  it('returns empty array when no index built', () => {
    expect(search('foo')).toEqual([])
  })

  it('matches by title', () => {
    buildIndex(sample)
    const results = search('useEffect')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].note.id).toBe('a')
  })

  it('matches by tag', () => {
    buildIndex(sample)
    const results = search('hooks')
    expect(results.some((r) => r.note.id === 'a')).toBe(true)
  })

  it('matches by summary', () => {
    buildIndex(sample)
    const results = search('reactivity')
    expect(results.some((r) => r.note.id === 'c')).toBe(true)
  })

  it('limit parameter caps results', () => {
    buildIndex(sample)
    const results = search('react', 1)
    expect(results.length).toBeLessThanOrEqual(1)
  })

  it('returns nothing for empty query', () => {
    buildIndex(sample)
    expect(search('')).toEqual([])
  })
})
