import { describe, it, expect } from 'vitest'
import { shortId } from './uuid'

describe('shortId', () => {
  it('returns 8-char hex string', () => {
    const id = shortId()
    expect(id).toMatch(/^[0-9a-f]{8}$/)
  })

  it('returns different ids on each call', () => {
    const a = shortId()
    const b = shortId()
    expect(a).not.toBe(b)
  })
})
