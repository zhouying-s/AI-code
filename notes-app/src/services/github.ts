import { Octokit } from '@octokit/rest'
import { useAuthStore } from '@/stores/auth'
import { parseFrontMatter, stringifyFrontMatter, type NoteMeta } from '@/utils/frontMatter'
import { encodeUtf8Base64, decodeUtf8Base64 } from '@/utils/base64'
import type { BookMeta, GithubConflictError, Note, NoteSummary } from '@/types'

let cached: { token: string; client: Octokit } | null = null

export function getOctokit(): Octokit {
  const auth = useAuthStore()
  if (!auth.isConfigured) throw new Error('GitHub auth not configured')
  if (!cached || cached.token !== auth.githubPat) {
    const client = new Octokit({ auth: auth.githubPat })
    client.hook.error('request', async (error) => {
      const status = (error as { status?: number }).status
      if (status === 401 || status === 403) {
        useAuthStore().clear()
        const wrapped = new Error('GitHub auth invalid; please reconfigure')
        ;(wrapped as { authExpired?: boolean }).authExpired = true
        throw wrapped
      }
      throw error
    })
    cached = { token: auth.githubPat, client }
  }
  return cached.client
}

export function getRepoCoords(): { owner: string; repo: string } {
  const auth = useAuthStore()
  return { owner: auth.owner, repo: auth.repo }
}

export async function listBooks(): Promise<BookMeta[]> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  type Entry = { type: string; name: string }
  let entries: Entry[]
  try {
    const res = await octokit.repos.getContent({ owner, repo, path: 'books' })
    entries = Array.isArray(res.data) ? (res.data as unknown as Entry[]) : []
  } catch (err) {
    if ((err as { status?: number }).status === 404) return []
    throw err
  }

  const dirs = entries.filter((e) => e.type === 'dir')
  const books: BookMeta[] = await Promise.all(
    dirs.map(async (dir) => {
      try {
        const meta = await octokit.repos.getContent({
          owner,
          repo,
          path: `books/${dir.name}/.book.json`,
        })
        const data = meta.data as { content?: string; encoding?: string }
        const parsed = data.content ? JSON.parse(decodeUtf8Base64(data.content)) : {}
        return { slug: dir.name, name: parsed.name ?? dir.name, ...parsed }
      } catch {
        return { slug: dir.name, name: dir.name }
      }
    }),
  )
  return books.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export async function listNotes(bookSlug: string): Promise<NoteSummary[]> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  type TreeEntry = { path?: string; type?: string; sha?: string }
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: 'HEAD',
    recursive: 'true',
  })
  const prefix = `books/${bookSlug}/`
  const mdEntries = (tree.data.tree as TreeEntry[]).filter(
    (e) => e.type === 'blob' && e.path?.startsWith(prefix) && e.path.endsWith('.md'),
  )

  const summaries = await Promise.all(
    mdEntries.map(async (entry) => {
      const res = await octokit.repos.getContent({ owner, repo, path: entry.path! })
      const data = res.data as { content: string; sha: string }
      const raw = decodeUtf8Base64(data.content)
      const { meta } = parseFrontMatter(raw)
      const slug = entry.path!.slice(prefix.length).replace(/\.md$/, '')
      return {
        id: (meta.id as string) ?? slug,
        slug,
        title: (meta.title as string) ?? slug,
        updatedAt: meta.updatedAt as string | undefined,
        tags: meta.tags as string[] | undefined,
        summary: meta.summary as string | undefined,
        filePath: entry.path!,
      }
    }),
  )
  return summaries.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export async function getNote(filePath: string): Promise<Note> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  const res = await octokit.repos.getContent({ owner, repo, path: filePath })
  const data = res.data as { content: string; sha: string }
  const raw = decodeUtf8Base64(data.content)
  const { meta, body } = parseFrontMatter(raw)
  const slug = filePath.split('/').pop()!.replace(/\.md$/, '')
  return {
    id: (meta.id as string) ?? slug,
    slug,
    title: (meta.title as string) ?? slug,
    updatedAt: meta.updatedAt as string | undefined,
    tags: meta.tags as string[] | undefined,
    summary: meta.summary as string | undefined,
    content: body,
    sha: data.sha,
    filePath,
  }
}

export interface SaveNoteArgs {
  filePath: string
  meta: NoteMeta
  content: string
  sha?: string
}

export async function saveNote(args: SaveNoteArgs): Promise<string> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  const meta: NoteMeta = {
    ...args.meta,
    updatedAt: new Date().toISOString(),
    createdAt: args.meta.createdAt ?? new Date().toISOString(),
  }
  const fullMarkdown = stringifyFrontMatter(meta, args.content)
  const message = `note: ${meta.title ?? 'untitled'} @ ${meta.updatedAt}`

  try {
    const res = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: args.filePath,
      message,
      content: encodeUtf8Base64(fullMarkdown),
      ...(args.sha ? { sha: args.sha } : {}),
    })
    return res.data.content!.sha!
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 409 || status === 422) {
      const remote = await octokit.repos.getContent({ owner, repo, path: args.filePath })
      const data = remote.data as { content: string; sha: string }
      const conflict: GithubConflictError = {
        type: 'conflict',
        remoteSha: data.sha,
        remoteContent: decodeUtf8Base64(data.content),
      }
      throw conflict
    }
    throw err
  }
}

export interface CreateBookArgs {
  slug: string
  name: string
  icon?: string
  order?: number
}

export async function createBook(args: CreateBookArgs): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  const meta = {
    name: args.name,
    icon: args.icon,
    order: args.order ?? 0,
    createdAt: new Date().toISOString(),
  }
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `books/${args.slug}/.book.json`,
    message: `book: create ${args.slug}`,
    content: encodeUtf8Base64(JSON.stringify(meta, null, 2)),
  })
}

export async function deleteNote(filePath: string, sha: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  await octokit.repos.deleteFile({
    owner,
    repo,
    path: filePath,
    sha,
    message: `note: delete ${filePath}`,
  })
}

export async function deleteBook(bookSlug: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  type TreeEntry = { path?: string; type?: string; sha?: string }
  const tree = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: 'HEAD',
    recursive: 'true',
  })
  const prefix = `books/${bookSlug}/`
  const files = (tree.data.tree as TreeEntry[]).filter(
    (e) => e.type === 'blob' && e.path?.startsWith(prefix),
  )
  for (const f of files) {
    if (!f.path || !f.sha) continue
    await octokit.repos.deleteFile({
      owner,
      repo,
      path: f.path,
      sha: f.sha,
      message: `book: delete ${bookSlug} (cleanup)`,
    })
  }
}

export async function renameNote(
  oldFilePath: string,
  newFilePath: string,
  sha: string,
): Promise<string> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  const oldRes = await octokit.repos.getContent({ owner, repo, path: oldFilePath })
  const oldData = oldRes.data as { content: string; sha: string }
  const created = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: newFilePath,
    message: `note: rename ${oldFilePath} → ${newFilePath}`,
    content: oldData.content,
  })
  await octokit.repos.deleteFile({
    owner,
    repo,
    path: oldFilePath,
    sha,
    message: `note: rename cleanup ${oldFilePath}`,
  })
  return created.data.content!.sha!
}

/** Test helper: reset the cached Octokit client. */
export function __resetCache() {
  cached = null
}
