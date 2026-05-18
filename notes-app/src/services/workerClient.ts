import { useAuthStore } from '@/stores/auth'

function buildUrl(path: string): { url: string; token: string } {
  const auth = useAuthStore()
  if (!auth.workerUrl) throw new Error('Worker URL not configured')
  if (!auth.masterToken) throw new Error('Master token not configured')
  const base = auth.workerUrl.replace(/\/$/, '')
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
  return { url, token: auth.masterToken }
}

export async function workerJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const { url, token } = buildUrl(path)
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Worker ${res.status}: ${text || res.statusText}`)
  }
  return (await res.json()) as T
}

export async function workerStream(
  path: string,
  body: unknown,
): Promise<ReadableStream<Uint8Array>> {
  const { url, token } = buildUrl(path)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Worker ${res.status}: ${text || res.statusText}`)
  }
  if (!res.body) throw new Error('Worker returned empty stream')
  return res.body
}
