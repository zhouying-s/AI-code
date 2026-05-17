import matter from 'gray-matter'

export interface NoteMeta {
  id?: string
  title?: string
  createdAt?: string
  updatedAt?: string
  tags?: string[]
  summary?: string
  source?: string
  [key: string]: unknown
}

export function parseFrontMatter(raw: string): { meta: NoteMeta; body: string } {
  const parsed = matter(raw)
  return { meta: parsed.data as NoteMeta, body: parsed.content }
}

export function stringifyFrontMatter(meta: NoteMeta, body: string): string {
  return matter.stringify(body, meta as Record<string, unknown>)
}
