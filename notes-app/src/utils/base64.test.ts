import { describe, it, expect } from 'vitest'
import { encodeUtf8Base64, decodeUtf8Base64 } from './base64'

describe('base64 UTF-8 roundtrip', () => {
  it('ascii', () => {
    const s = 'hello world'
    expect(decodeUtf8Base64(encodeUtf8Base64(s))).toBe(s)
  })

  it('chinese', () => {
    const s = '中文测试 🚀'
    expect(decodeUtf8Base64(encodeUtf8Base64(s))).toBe(s)
  })

  it('encoded form is valid base64', () => {
    expect(encodeUtf8Base64('中')).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })
})
