import { describe, it, expect } from 'vitest'
import { parseFrontMatter, stringifyFrontMatter } from './frontMatter'

describe('parseFrontMatter', () => {
  it('parses front-matter and body', () => {
    const raw = `---\nid: abc12345\ntitle: Hello\ntags: [a, b]\n---\n\n## Body\n\ncontent`
    const { meta, body } = parseFrontMatter(raw)
    expect(meta.id).toBe('abc12345')
    expect(meta.title).toBe('Hello')
    expect(meta.tags).toEqual(['a', 'b'])
    expect(body.trim()).toBe('## Body\n\ncontent')
  })

  it('handles missing front-matter', () => {
    const { meta, body } = parseFrontMatter('just body')
    expect(meta).toEqual({})
    expect(body).toBe('just body')
  })
})

describe('stringifyFrontMatter', () => {
  it('roundtrips', () => {
    const out = stringifyFrontMatter({ id: 'x', title: 'T' }, '# body')
    const { meta, body } = parseFrontMatter(out)
    expect(meta.id).toBe('x')
    expect(meta.title).toBe('T')
    expect(body.trim()).toBe('# body')
  })
})
