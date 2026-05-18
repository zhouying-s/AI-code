import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../types'

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const header = c.req.header('Authorization') ?? ''
  const expected = c.env.MASTER_TOKEN
  if (!expected) {
    return c.json({ error: 'server misconfigured: MASTER_TOKEN not set' }, 500)
  }
  if (!header.startsWith('Bearer ')) {
    return c.json({ error: 'missing bearer token' }, 401)
  }
  const token = header.slice('Bearer '.length).trim()
  if (token !== expected) {
    return c.json({ error: 'invalid token' }, 401)
  }
  await next()
}
