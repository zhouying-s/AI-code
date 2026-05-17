export interface AuthConfig {
  githubPat: string
  owner: string
  repo: string
  workerUrl?: string
  masterToken?: string
  defaultBookSlug?: string
}

export interface BookMeta {
  slug: string
  name: string
  icon?: string
  order?: number
  createdAt?: string
}

export interface NoteSummary {
  id: string
  slug: string
  title: string
  updatedAt?: string
  tags?: string[]
  summary?: string
  /** 文件在仓库里的相对路径：books/<book>/<...subFolders>/<slug>.md */
  filePath: string
}

export interface Note extends NoteSummary {
  content: string
  sha?: string
}

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'

export interface GithubConflictError {
  type: 'conflict'
  remoteSha: string
  remoteContent: string
}
