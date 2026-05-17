export function titleToSlug(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'untitled'
}
