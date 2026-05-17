import yaml from 'js-yaml'

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

const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function parseFrontMatter(raw: string): { meta: NoteMeta; body: string } {
  const m = raw.match(FRONT_MATTER_RE)
  if (!m) return { meta: {}, body: raw }
  const parsed = (yaml.load(m[1]) as Record<string, unknown> | null) ?? {}
  const meta: NoteMeta = {}
  for (const [key, value] of Object.entries(parsed)) {
    meta[key] = value instanceof Date ? value.toISOString() : value
  }
  return { meta, body: m[2] }
}

export function stringifyFrontMatter(meta: NoteMeta, body: string): string {
  const yamlBody = yaml
    .dump(meta as Record<string, unknown>, { skipInvalid: true, lineWidth: -1 })
    .replace(/\n$/, '')
  return `---\n${yamlBody}\n---\n\n${body}`
}
