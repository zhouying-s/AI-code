import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { encodeUtf8Base64 } from '@/utils/base64'

// Helper for tests: UTF-8 safe base64 (replaces btoa which is latin1-only in Node).
const b64 = encodeUtf8Base64

const mockClient = {
  repos: {
    getContent: vi.fn(),
    createOrUpdateFileContents: vi.fn(),
    deleteFile: vi.fn(),
  },
  git: { getTree: vi.fn() },
  hook: { error: vi.fn() },
}

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(function MockOctokit(this: typeof mockClient) {
    Object.assign(this, mockClient)
  } as unknown as typeof Octokit),
}))

import { Octokit } from '@octokit/rest'
import {
  getOctokit,
  __resetCache,
  listBooks,
  listNotes,
  getNote,
  saveNote,
  createBook,
  deleteNote,
} from './github'

function configAuth() {
  const auth = useAuthStore()
  auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  __resetCache()
  vi.mocked(Octokit).mockClear()
  mockClient.repos.getContent.mockReset()
  mockClient.repos.createOrUpdateFileContents.mockReset()
  mockClient.repos.deleteFile.mockReset()
  mockClient.git.getTree.mockReset()
  mockClient.hook.error.mockReset()
})

describe('getOctokit', () => {
  it('creates Octokit with PAT from authStore', () => {
    configAuth()
    getOctokit()
    expect(Octokit).toHaveBeenCalledWith({ auth: 'ghp_abc' })
  })

  it('throws if not configured', () => {
    expect(() => getOctokit()).toThrow(/not configured/i)
  })
})

describe('listBooks', () => {
  it('returns books from books/ directory entries', async () => {
    configAuth()
    mockClient.repos.getContent
      .mockResolvedValueOnce({
        data: [
          { type: 'dir', name: 'default' },
          { type: 'dir', name: 'react' },
          { type: 'file', name: 'README.md' },
        ],
      })
      .mockResolvedValueOnce({
        data: { content: b64('{"name":"默认知识库","order":0}'), encoding: 'base64' },
      })
      .mockResolvedValueOnce({
        data: { content: b64('{"name":"React 学习","order":1}'), encoding: 'base64' },
      })
    const books = await listBooks()
    expect(books).toHaveLength(2)
    const names = books.map((b) => b.name).sort()
    expect(names).toEqual(['React 学习', '默认知识库'])
  })

  it('returns empty array when books/ directory does not exist (404)', async () => {
    configAuth()
    mockClient.repos.getContent.mockRejectedValueOnce({ status: 404 })
    const books = await listBooks()
    expect(books).toEqual([])
  })
})

describe('listNotes', () => {
  it('returns notes parsed from front-matter', async () => {
    configAuth()
    mockClient.git.getTree.mockResolvedValueOnce({
      data: {
        tree: [
          { path: 'books/default/welcome.md', type: 'blob', sha: 'sha1' },
          { path: 'books/default/.book.json', type: 'blob' },
          { path: 'books/default/react/hooks.md', type: 'blob', sha: 'sha2' },
        ],
      },
    })
    mockClient.repos.getContent
      .mockResolvedValueOnce({
        data: {
          content: b64(
            '---\nid: abc12345\ntitle: 欢迎\nupdatedAt: 2026-01-01T00:00:00Z\n---\nbody',
          ),
          encoding: 'base64',
          sha: 'sha1',
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: b64(
            '---\nid: def67890\ntitle: Hooks\nupdatedAt: 2026-02-01T00:00:00Z\n---\nbody',
          ),
          encoding: 'base64',
          sha: 'sha2',
        },
      })

    const notes = await listNotes('default')
    expect(notes).toHaveLength(2)
    expect(notes.map((n) => n.title).sort()).toEqual(['Hooks', '欢迎'])
  })
})

describe('getNote', () => {
  it('returns note with content + sha', async () => {
    configAuth()
    mockClient.repos.getContent.mockResolvedValueOnce({
      data: {
        content: b64('---\nid: abc\ntitle: T\n---\nbody'),
        encoding: 'base64',
        sha: 'shaXYZ',
      },
    })
    const note = await getNote('books/default/welcome.md')
    expect(note.content.trim()).toBe('body')
    expect(note.sha).toBe('shaXYZ')
    expect(note.title).toBe('T')
  })
})

describe('saveNote', () => {
  it('PUTs file with base64 content + sha', async () => {
    configAuth()
    mockClient.repos.createOrUpdateFileContents.mockResolvedValueOnce({
      data: { content: { sha: 'newSha' } },
    })
    const newSha = await saveNote({
      filePath: 'books/default/welcome.md',
      meta: { id: 'abc', title: 'Welcome' },
      content: 'body text',
      sha: 'oldSha',
    })
    expect(newSha).toBe('newSha')
    const call = mockClient.repos.createOrUpdateFileContents.mock.calls[0][0]
    expect(call.sha).toBe('oldSha')
    expect(call.path).toBe('books/default/welcome.md')
    expect(call.message).toMatch(/Welcome/)
  })

  it('throws conflict error when GitHub returns 409', async () => {
    configAuth()
    mockClient.repos.createOrUpdateFileContents.mockRejectedValueOnce({ status: 409 })
    mockClient.repos.getContent.mockResolvedValueOnce({
      data: {
        content: b64('---\ntitle: remote\n---\nremote body'),
        encoding: 'base64',
        sha: 'remoteSha',
      },
    })
    await expect(
      saveNote({
        filePath: 'books/default/x.md',
        meta: { id: 'abc', title: 'x' },
        content: 'local body',
        sha: 'staleSha',
      }),
    ).rejects.toMatchObject({ type: 'conflict', remoteSha: 'remoteSha' })
  })
})

describe('createBook', () => {
  it('writes .book.json under books/<slug>/', async () => {
    configAuth()
    mockClient.repos.createOrUpdateFileContents.mockResolvedValueOnce({
      data: { content: { sha: 's' } },
    })
    await createBook({ slug: 'react', name: 'React' })
    const call = mockClient.repos.createOrUpdateFileContents.mock.calls[0][0]
    expect(call.path).toBe('books/react/.book.json')
  })
})

describe('deleteNote', () => {
  it('calls deleteFile with sha + message', async () => {
    configAuth()
    mockClient.repos.deleteFile.mockResolvedValueOnce({ data: {} })
    await deleteNote('books/default/x.md', 'sha123')
    const call = mockClient.repos.deleteFile.mock.calls[0][0]
    expect(call.path).toBe('books/default/x.md')
    expect(call.sha).toBe('sha123')
  })
})
