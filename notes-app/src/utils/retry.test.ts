import { describe, it, expect, vi } from 'vitest'
import { retry } from './retry'

describe('retry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries until success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    await expect(retry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('boom')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('skips retry when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('400'))
    await expect(
      retry(fn, { attempts: 3, baseDelayMs: 1, shouldRetry: () => false }),
    ).rejects.toThrow('400')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
