export interface RetryOptions {
  attempts: number
  baseDelayMs: number
  factor?: number
  shouldRetry?: (err: unknown) => boolean
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  const factor = opts.factor ?? 4
  const shouldRetry = opts.shouldRetry ?? (() => true)
  let lastErr: unknown
  for (let i = 0; i < opts.attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === opts.attempts - 1 || !shouldRetry(err)) throw err
      const delay = opts.baseDelayMs * Math.pow(factor, i)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}
