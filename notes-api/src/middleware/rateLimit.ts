import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../types'

export interface RateLimitOpts {
  limit: number
  windowSec: number
}

export function rateLimitMiddleware(
  opts: RateLimitOpts,
): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const ip =
      c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown'
    const key = `ratelimit:${ip}`
    const kv = c.env.NOTES_KV
    const raw = await kv.get(key)
    const count = raw ? parseInt(raw, 10) : 0
    if (count >= opts.limit) {
      return c.json({ error: 'rate limited', retryAfterSec: opts.windowSec }, 429)
    }
    await kv.put(key, String(count + 1), { expirationTtl: opts.windowSec })
    await next()
  }
}
