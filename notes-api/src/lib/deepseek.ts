import type { ChatMessage } from '../types'

export interface DeepSeekChatArgs {
  apiKey: string
  model: string
  messages: ChatMessage[]
}

/**
 * Call DeepSeek's chat completions (OpenAI compatible) with stream=true.
 * Returns the raw upstream Response so the caller can pipe the body directly.
 */
export async function chatStream(args: DeepSeekChatArgs): Promise<Response> {
  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })
  return upstream
}
