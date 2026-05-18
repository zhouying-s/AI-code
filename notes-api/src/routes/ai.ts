import { Hono } from 'hono'
import { z } from 'zod'
import type { Bindings, ChatMessage } from '../types'
import { chatStream } from '../lib/deepseek'

const chatSchema = z.object({
  model: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
})

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/chat', async (c) => {
  const parsed = chatSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    return c.json({ error: 'invalid body', detail: parsed.error.message }, 400)
  }

  const apiKey = c.env.DEEPSEEK_API_KEY
  if (!apiKey) return c.json({ error: 'DEEPSEEK_API_KEY not configured' }, 500)

  const upstream = await chatStream({
    apiKey,
    model: parsed.data.model,
    messages: parsed.data.messages as ChatMessage[],
  })

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '')
    return c.json({ error: 'upstream error', status: upstream.status, detail }, 502)
  }

  // SSE 透传
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})

export default ai
