import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from '../types'

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const allowed = (c.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const handler = cors({
      origin: (origin) => {
        if (!origin) return ''
        if (allowed.includes(origin)) return origin
        // 通配 pages.dev 子域 + 任意 chrome-extension://
        if (origin.endsWith('.pages.dev') && allowed.some((a) => a.endsWith('.pages.dev'))) {
          return origin
        }
        if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
          return origin
        }
        return ''
      },
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
      credentials: false,
    })
    return handler(c, next)
  }
}
