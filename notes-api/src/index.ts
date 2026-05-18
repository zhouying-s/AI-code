import { Hono } from 'hono'
import type { Bindings } from './types'
import { authMiddleware } from './middleware/auth'
import { corsMiddleware } from './middleware/cors'
import { rateLimitMiddleware } from './middleware/rateLimit'

const app = new Hono<{ Bindings: Bindings }>()

// 全局 middleware（顺序很重要：CORS 在最外、然后限速、最后鉴权）
app.use('*', corsMiddleware())

// 健康检查不走鉴权
app.get('/', (c) => c.text('notes-api ok'))
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

// /api/* 走完整 middleware 栈
app.use('/api/*', rateLimitMiddleware({ limit: 60, windowSec: 60 }))
app.use('/api/*', authMiddleware)

// 占位响应（路由组下一阶段填）
app.all('/api/*', (c) => c.json({ error: 'not implemented yet' }, 501))

export default app
