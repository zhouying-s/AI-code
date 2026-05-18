import { Hono } from 'hono'
import type { Bindings } from './types'
import { authMiddleware } from './middleware/auth'
import { corsMiddleware } from './middleware/cors'
import { rateLimitMiddleware } from './middleware/rateLimit'
import memos from './routes/memos'
import favorites from './routes/favorites'
import sessions from './routes/sessions'
import ai from './routes/ai'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', corsMiddleware())

app.get('/', (c) => c.text('notes-api ok'))
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

app.use('/api/*', rateLimitMiddleware({ limit: 60, windowSec: 60 }))
app.use('/api/*', authMiddleware)

app.route('/api/memos', memos)
app.route('/api/favorites', favorites)
app.route('/api/ai/sessions', sessions)
app.route('/api/ai', ai)

export default app
