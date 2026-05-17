import { describe, it, expect } from 'vitest'
import { titleToSlug } from './slug'

describe('titleToSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(titleToSlug('Hello World')).toBe('hello-world')
  })

  it('preserves chinese characters', () => {
    expect(titleToSlug('React 入门')).toBe('react-入门')
  })

  it('strips punctuation', () => {
    expect(titleToSlug('useEffect: Deep Dive!')).toBe('useeffect-deep-dive')
  })

  it('collapses consecutive separators', () => {
    expect(titleToSlug('a   b___c')).toBe('a-b-c')
  })

  it('returns "untitled" for empty input', () => {
    expect(titleToSlug('')).toBe('untitled')
    expect(titleToSlug('   ')).toBe('untitled')
  })

  it('trims leading/trailing dashes', () => {
    expect(titleToSlug('  hello  ')).toBe('hello')
  })
})
