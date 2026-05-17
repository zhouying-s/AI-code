# AI 笔记库设计文档

- 日期：2026-05-17
- 作者：与 Claude Code 协作 brainstorm 产出
- 状态：待用户最终审查

## 1. 项目概述

一个**单用户**的个人 AI 笔记库系统，由三块组成：

| 组件 | 形态 | 部署位置 |
|---|---|---|
| **Web App** | Vue 3 + Vite + Element Plus + Vditor，PWA | Cloudflare Pages |
| **Cloudflare Worker** | 单 Worker，提供 `/api/*` 接口 | Cloudflare Workers |
| **浏览器插件** | Manifest V3，Vue 3 写法 | Edge / Chrome 本地安装 |

核心交互：
- 在 Web App 里管理多个"知识库"，写 / 看 / 搜 Markdown 笔记；可发起 AI 写作、跨笔记 RAG 问答。
- 在任意网页上选中文字 → 插件浮窗 → 用 DeepSeek 总结/翻译/解释/改写/问答 → 可保存到知识库。
- 所有笔记最终以 Markdown 形式存到用户自己的 **GitHub 私有仓库**；高频小数据存 **Cloudflare KV**；RAG 向量索引存 **Cloudflare Vectorize**。
- 视觉参考语雀（截图：三栏布局、绿色主调、浅色）。

## 2. 总体架构

### 2.1 部署拓扑

```
┌──────────────────────────────┐      ┌────────────────────────────┐
│  浏览器扩展 (Edge / Chrome)   │      │  Web App (PWA)              │
│  Manifest V3 · Vue 3 · 轻量   │      │  Vue 3 + Vite + Element     │
│  • 划词 → 浮窗 → AI 菜单      │      │  + Vditor + Pinia + PWA     │
│  • 保存到笔记库 / 剪藏        │      │  访问 https://<your>.pages  │
│  • 设置：PAT / Worker / Token │      │  设置 → PAT / Worker / Token│
└──────────┬───────────────────┘      └───────────┬─────────────────┘
           │                                      │
           │   GitHub API (PAT, 前端直连)         │
           ├──────────────────────────────────────┤
           ▼                                      ▼
           ┌───────────────────────────────────────┐
           │       GitHub 私有仓库 (notes-db)      │
           │  • books/<book>/<note>.md             │
           │  • clippings/<YYYY-MM>/<slug>.md      │
           │  • .meta/*.json                       │
           └───────────────────────────────────────┘

           │                                      │
           │  /api/* (走 Master Token 鉴权)       │
           └────────────────┬─────────────────────┘
                            ▼
       ┌──────────────────────────────────────────────────┐
       │       Cloudflare Worker (notes-api)              │
       │  /api/ai/chat        → 代理 DeepSeek             │
       │  /api/ai/embed       → 走 Workers AI embedding   │
       │  /api/memos          → KV CRUD                   │
       │  /api/favorites      → KV CRUD                   │
       │  /api/ai/sessions    → KV CRUD                   │
       │  /api/rag/query      → Vectorize + KV            │
       │  /api/rag/reindex    → 拉 GitHub → 切片 → 嵌入    │
       └──────────┬──────────────────────────┬────────────┘
                  ▼                          ▼
        ┌──────────────────┐     ┌────────────────────────┐
        │  Cloudflare KV   │     │  Cloudflare Vectorize  │
        │  memos / favs /  │     │  notes-index           │
        │  ai-sessions     │     │  (笔记 chunk embedding) │
        └──────────────────┘     └────────────────────────┘
```

### 2.2 关键架构决策

- **唯一后端是 Cloudflare Worker**。Web App 与插件都调它的 `/api/*`。
- **鉴权用 Master Token**：用户自己设的一个长字符串，存在 Worker 环境变量；客户端请求带 `Authorization: Bearer <token>`。
- **GitHub PAT 放前端**：仅 `repo` scope（私有仓库读写）；走 GitHub API 原生 CORS，前端直连。
- **DeepSeek key 放 Worker 环境变量**：客户端永远拿不到。
- **数据分层**：
  - 知识库 Markdown 文档 → GitHub（版本控制天然就有）
  - 小记 / 收藏 / AI 会话 / 索引状态 → Cloudflare KV
  - RAG 向量 → Cloudflare Vectorize
- **PWA 范围**：静态资源 + 笔记列表 + 已访问笔记 可离线浏览；写笔记 / AI 必须在线（B 方案：不做离线编辑队列）。
- **同步策略**：插件和 Web App 配置不自动同步；Web App 设置页提供"导出配置码"（base64 JSON），插件设置页粘贴导入。

### 2.3 浏览器扩展定位

只做 **AI 划词工具**，不做完整笔记 UI。完整笔记管理交给 Web App（响应式设计，手机和电脑浏览器都可用）。

## 3. GitHub 仓库结构

### 3.1 目录布局（仓库名 `notes-db`）

```
notes-db/
├── books/                            ← 所有"知识库"
│   ├── default/                      ← 默认知识库（首次创建）
│   │   ├── .book.json                ← 元数据：name、icon、createdAt、order
│   │   ├── welcome.md
│   │   └── react/                    ← 可选子文件夹
│   │       ├── .folder.json
│   │       ├── hooks-useeffect.md
│   │       └── hooks-usememo.md
│   └── easypan/
│       ├── .book.json
│       └── overview.md
│
├── clippings/                        ← 浏览器插件"整页剪藏"产物
│   ├── 2026-05/
│   │   ├── how-vue-reactivity-works.md
│   │   └── tailwind-color-tips.md
│   └── 2026-06/
│
└── .meta/
    ├── repo.json                     ← schema 版本
    └── books-order.json              ← 知识库顺序、归档状态
```

### 3.2 笔记文件格式（Markdown + YAML front-matter）

```markdown
---
id: 9f2a8b1c                          # 短 uuid，跨重命名稳定
title: useEffect 详解
createdAt: 2026-05-17T10:23:45Z
updatedAt: 2026-05-17T18:02:11Z
tags: [react, hooks]
summary: 副作用机制、依赖数组、清理函数三件事讲清楚
source: https://...                   # 仅 clippings 有此字段
---

## 副作用机制
...
```

### 3.3 设计理由

- `id` 在 front-matter 而不是文件名 → 重命名不破坏 RAG 索引和收藏引用。
- slug（文件名）用 `kebab-case`、`.book.json`/`.folder.json` 记录顺序、图标等。
- `clippings/<YYYY-MM>/` 按年月归档，避免和知识库混在一起。
- `.meta/repo.json` 保留 schema version 字段，便于将来升级数据格式。

## 4. Cloudflare KV 数据模型

Namespace：`notes-kv`。键命名约定 `<domain>:<id>` 或 `<domain>:list`。

| Key 形式 | Value | 说明 |
|---|---|---|
| `memos:list` | `[{id, createdAt, preview, tags}]` JSON 数组（按时间倒序） | 小记列表索引，最多 200 条，溢出归档到 `memos:archive:<YYYY-MM>` |
| `memos:<id>` | `{id, content, createdAt, updatedAt, tags, linkedNoteId?}` | 单条小记完整内容 |
| `favorites:notes` | `[noteId, ...]` | 收藏的笔记 id 列表 |
| `favorites:memos` | `[memoId, ...]` | 收藏的小记 id 列表 |
| `ai-sessions:list` | `[{id, title, model, updatedAt, msgCount}]` | AI 会话列表 |
| `ai-sessions:<id>` | `{id, title, model, createdAt, contextNoteIds?}` | 单会话元数据 |
| `ai-sessions:<id>:messages` | `[{role, content, ts, tokens?}]` | 单会话消息历史 |
| `settings:user` | `{defaultBook, theme, ...}` | 用户偏好（同步给插件用） |
| `rag:status` | `{lastIndexAt, totalChunks, dirtyNoteIds[]}` | 索引状态 |

## 5. Cloudflare Vectorize 索引

- Index 名：`notes-rag`
- 维度：768（首选 `@cf/baai/bge-m3`，中英双语；落地时按真实效果可换 `bge-base-en-v1.5`）
- 切片：每篇笔记按 ~600 token 切分，重叠 ~80 token
- 每个 vector 的 metadata：

```json
{
  "noteId": "9f2a8b1c",
  "bookSlug": "default",
  "filePath": "books/default/react/hooks-useeffect.md",
  "chunkIndex": 0,
  "title": "useEffect 详解",
  "updatedAt": "2026-05-17T18:02:11Z"
}
```

- 增量更新：笔记保存成功后，noteId 进 `rag:status.dirtyNoteIds`；Worker Cron 每 5 分钟扫一遍 → 重新切片 + embed + upsert。
- 全量重建：设置页"重建全部索引"按钮 → `POST /api/rag/reindex { full: true }`。

## 6. Web App 设计

### 6.1 路由表（Vue Router）

| 路径 | 页面 | 备注 |
|---|---|---|
| `/` | 首页（最近编辑 / 最近小记 / 收藏精选） | 模块 7 |
| `/ai` | AI 写作页（聊天 + 会话列表） | 模块 3 |
| `/memos` | 小记流 | 模块 4 |
| `/favorites` | 收藏汇总 | 模块 5 |
| `/search?q=...` | 全局搜索结果页（Ctrl+J 也走 CommandPalette 浮层） | 模块 6 |
| `/book/:bookSlug` | 单个知识库视图（第三栏空状态） | 模块 1 |
| `/book/:bookSlug/:noteId` | 知识库 + 选中文档（编辑器） | 模块 1+2 |
| `/settings` | 设置页（PAT / Worker URL / Master Token / 默认知识库 / 主题 / 导出配置码） | 模块 8 |
| `/setup` | 首次进入向导（凭据缺失时跳到这里） | – |

### 6.2 三栏布局

- **第一栏（240px 固定）**：主导航 + 知识库列表
- **第二栏（自适应）**：当前知识库的文档树
- **第三栏（剩余空间）**：编辑器 / 列表 / AI 聊天，按路由切

`AppShell` + `PrimarySidebar` + `DocumentTree` + `MainPane`，MainPane 内容随路由变化，前两栏不重渲（切换不闪）。

### 6.3 Pinia Stores

| Store | 关注点 |
|---|---|
| `useAuthStore` | PAT、Worker URL、Master Token、当前 GitHub 仓库（owner/repo） |
| `useBooksStore` | 知识库列表、当前选中、加载/重命名/新建/删除 |
| `useNotesStore` | 当前知识库的文档树、单文档内容缓存、保存状态 (dirty/saving/saved) |
| `useMemosStore` | 小记列表（从 KV）+ 新增/编辑/删除 |
| `useFavoritesStore` | 收藏的笔记/小记 id 集合 |
| `useAiStore` | AI 会话列表、当前会话消息、模型选择、流式响应缓冲区 |
| `useSearchStore` | Fuse.js 内存索引（标题+摘要+前 500 字）、最近搜索 |
| `useUiStore` | 侧边栏折叠、Toast 队列、当前主题等 UI 状态 |

### 6.4 Services 层

```
src/services/
├── github.ts          ← Octokit 封装：listBooks / getNote / saveNote / deleteNote / renameNote
├── workerClient.ts    ← 调 Cloudflare Worker（自动带 Master Token）
├── ai.ts              ← chat(stream) / embed / sessionCRUD
├── memos.ts           ← KV: memos CRUD
├── favorites.ts       ← KV: favorites CRUD
├── rag.ts             ← /api/rag/query, /api/rag/reindex
└── search.ts          ← 本地 Fuse 索引构建 + 查询
```

两条保存路径泾渭分明：
- 写笔记 → `github.ts`（直连 GitHub）
- 写小记 / 收藏 / AI 消息 → `workerClient.ts`（走 Worker → KV）

### 6.5 项目目录结构

```
AI-Code/
└── notes-app/
    ├── public/
    │   ├── icons/                ← PWA 图标 192/512
    │   └── manifest.webmanifest
    ├── src/
    │   ├── main.ts
    │   ├── App.vue
    │   ├── router/
    │   │   └── index.ts
    │   ├── stores/               ← 上面 Pinia stores
    │   ├── services/             ← 上面 Services
    │   ├── views/
    │   │   ├── HomeView.vue
    │   │   ├── AiView.vue
    │   │   ├── MemosView.vue
    │   │   ├── FavoritesView.vue
    │   │   ├── SearchView.vue
    │   │   ├── BookView.vue      ← /book/:bookSlug[/:noteId]
    │   │   ├── SettingsView.vue
    │   │   └── SetupView.vue
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppShell.vue
    │   │   │   ├── PrimarySidebar.vue
    │   │   │   ├── DocumentTree.vue
    │   │   │   └── MainPane.vue
    │   │   ├── editor/
    │   │   │   ├── VditorEditor.vue
    │   │   │   └── InlineAiMenu.vue
    │   │   ├── ai/
    │   │   │   ├── ChatPanel.vue
    │   │   │   ├── MessageBubble.vue
    │   │   │   └── ModelSwitcher.vue
    │   │   ├── memo/
    │   │   │   └── MemoCard.vue
    │   │   └── common/
    │   │       ├── CommandPalette.vue
    │   │       ├── EmptyState.vue
    │   │       └── ConfirmDialog.vue
    │   ├── composables/          ← useShortcut, usePwaUpdate, useStreamingAi 等
    │   ├── utils/                ← markdown 解析、front-matter、slug、debounce
    │   └── styles/
    │       ├── variables.scss    ← 语雀绿主题变量
    │       └── element-overrides.scss
    ├── index.html
    ├── vite.config.ts            ← vite-plugin-pwa 配置
    ├── tsconfig.json
    └── package.json
```

### 6.6 关键技术选型

- **TypeScript**：默认启用
- **Markdown 编辑器**：Vditor（即时渲染 + 所见即所得 + 源码三模式可切，最接近语雀体验）
- **PWA**：`vite-plugin-pwa` + Workbox
- **搜索**：Fuse.js（内存索引，启动时拉所有笔记 front-matter + 摘要构建）
- **图标**：自带 SVG + Element Plus 图标
- **主题**：单一浅色 + 语雀绿 (#1a8754) 主色调，CSS 变量定义在 `variables.scss`

### 6.7 视觉风格

- 三栏布局，与语雀截图一致
- 主色 #1a8754；激活态背景 #e8f5ed
- 字体：系统默认 sans + 等宽（代码块用 JetBrains Mono / Source Code Pro）
- 浅色单主题（暂不做深色，开发量 -20%）

## 7. Cloudflare Worker 设计（`notes-api`）

### 7.1 项目目录

```
notes-api/
├── wrangler.toml
├── src/
│   ├── index.ts              ← Hono 路由入口
│   ├── middleware/
│   │   ├── auth.ts           ← 校验 Authorization: Bearer <MASTER_TOKEN>
│   │   ├── cors.ts           ← 严格白名单
│   │   └── rateLimit.ts      ← IP 维度滑窗，60 req/min
│   ├── routes/
│   │   ├── ai.ts             ← /api/ai/*
│   │   ├── memos.ts          ← /api/memos/*
│   │   ├── favorites.ts      ← /api/favorites/*
│   │   ├── sessions.ts       ← /api/ai/sessions/*
│   │   └── rag.ts            ← /api/rag/query, /api/rag/reindex
│   ├── lib/
│   │   ├── kv.ts             ← KV CRUD 工具
│   │   ├── vectorize.ts      ← upsert / query 包装
│   │   ├── github.ts         ← reindex 时 Worker 端拉 GitHub
│   │   └── chunker.ts        ← Markdown → chunks
│   └── types.ts
└── package.json
```

### 7.2 绑定与 Secret

| 名字 | 类型 | 用途 |
|---|---|---|
| `MASTER_TOKEN` | Secret | 鉴权 |
| `DEEPSEEK_API_KEY` | Secret | 调 DeepSeek |
| `GITHUB_PAT` | Secret | reindex 时 Worker 端读 GitHub（与前端 PAT 同一把，部署时 `wrangler secret put` 设置） |
| `GITHUB_OWNER` / `GITHUB_REPO` | Var | 仓库定位 |
| `NOTES_KV` | KV Namespace | 短数据 |
| `NOTES_VEC` | Vectorize Index | 向量索引 |
| `AI` | Workers AI Binding | embedding 调用 |

### 7.3 API 表

| 方法 + 路径 | 入参 | 返回 |
|---|---|---|
| `POST /api/ai/chat` | `{model, messages, sessionId?, contextNoteIds?}` | SSE 流（OpenAI 兼容格式） |
| `POST /api/ai/embed` | `{texts: string[]}` | `{vectors: number[][]}` |
| `GET /api/ai/sessions` | – | `[{id, title, model, updatedAt, msgCount}]` |
| `GET /api/ai/sessions/:id` | – | `{...meta, messages: [...]}` |
| `POST /api/ai/sessions` | `{title?, model}` | `{id, ...}` |
| `PATCH /api/ai/sessions/:id` | `{title?, ...}` | `{ok}` |
| `DELETE /api/ai/sessions/:id` | – | `{ok}` |
| `GET /api/memos` | `?cursor=&limit=` | `{items, nextCursor}` |
| `POST /api/memos` | `{content, tags?, linkedNoteId?}` | `{id, ...}` |
| `PATCH /api/memos/:id` | `{content?, tags?}` | `{ok}` |
| `DELETE /api/memos/:id` | – | `{ok}` |
| `GET /api/favorites` | – | `{notes:[], memos:[]}` |
| `POST /api/favorites` | `{type:'note'\|'memo', id, op:'add'\|'remove'}` | `{ok}` |
| `POST /api/rag/query` | `{question, topK?, bookSlug?}` | `{chunks:[{text, noteId, score}]}` |
| `POST /api/rag/reindex` | `{noteIds?: string[], full?: boolean}` | `{queued, total}` |

- 所有路径都要 `Authorization: Bearer <MASTER_TOKEN>`，否则 401。
- AI chat 使用 SSE（`text/event-stream`），前端走 `fetch` ReadableStream。

### 7.4 Cron 任务

`*/5 * * * *`：每 5 分钟扫 `rag:status.dirtyNoteIds`，逐个拉笔记 → 切片 → embed → upsert 到 Vectorize → 从 dirty 列表移除。

## 8. 浏览器插件设计（`notes-extension`）

### 8.1 项目目录

```
notes-extension/
├── manifest.json             ← Manifest V3
├── public/
│   └── icons/                ← 16/32/48/128
├── src/
│   ├── background/
│   │   └── service-worker.ts ← 调 Worker / GitHub、转发消息
│   ├── content/
│   │   ├── injector.ts       ← 注入到所有页面
│   │   ├── FloatingButton.vue
│   │   ├── ActionMenu.vue
│   │   └── ResultCard.vue
│   ├── popup/
│   │   ├── App.vue           ← 设置入口 + 最近 5 条剪藏 + 全局开关
│   │   └── main.ts
│   ├── options/
│   │   ├── App.vue           ← 完整设置页
│   │   └── main.ts
│   ├── shared/
│   │   ├── storage.ts        ← chrome.storage.sync 封装
│   │   ├── workerClient.ts
│   │   ├── github.ts
│   │   └── messaging.ts
│   └── types.ts
├── vite.config.ts            ← @crxjs/vite-plugin
└── package.json
```

### 8.2 关键点

- **注入**：`content_scripts.matches = ["<all_urls>"]`；浮窗仅在有 selection 时显示，可在 popup 一键关全局开关。
- **触发模型**：划词即出现浮窗（不需快捷键），打扰最小化在于浮窗本身设计成小图标，不抢视觉。
- **跨域**：所有外部请求都从 background service worker 发，content script 通过 `chrome.runtime.sendMessage` 转发。
- **存储**：`chrome.storage.sync`（跨设备同步配置，8KB 限制对配置足够）。

### 8.3 动作集（8 个）

| 动作 | 说明 |
|---|---|
| 总结 | 选中段落 → 输出要点 |
| 翻译 | 中↔英自动判断；options 里可加目标语言 |
| 解释 | 把选中术语/代码片段解释一遍 |
| 改写/润色 | 改成更专业 / 更口语 / 更精简 |
| 问问题 | 把选中文当上下文，自由提问 |
| 保存到笔记库 | 一键存为知识库笔记（指定 bookSlug） |
| 保存整页（剪藏） | Readability.js 提取正文 → turndown 转 markdown → 存到 clippings/<YYYY-MM>/ |
| 快捷栏自定义 | options 页 drag-sort 选哪些动作显示在浮窗 |

### 8.4 与 Web App 的配置同步

- Web App 设置页有"复制配置码"按钮 → 输出 `base64(JSON{workerUrl, masterToken, pat, owner, repo, defaultBook})`。
- 插件 options 页有"粘贴配置码"输入框 → 解码后写入 `chrome.storage.sync`。

## 9. 关键流程

### 9.1 保存笔记（GitHub）

1. Vditor 抛出 content
2. NotesStore 生成 / 沿用 front-matter（`id` 不变，`updatedAt = now`）
3. `services/github.ts`：GET 文件 SHA → PUT contents（带 message、base64 内容、sha）
4. 成功 → toast "已保存"；NotesStore 标记 clean；noteId 进 `rag:status.dirtyNoteIds`
5. 失败：
   - 409 冲突 → 弹"冲突解决"对话框（覆盖远端 / 接受远端，MVP 不做手动合并）
   - 网络错误 → 指数退避重试 3 次（200ms / 800ms / 3.2s）

**自动保存**：编辑器空闲 2 秒触发一次（debounce），设置可关。

### 9.2 AI 写作（聊天 + 流式 + 上下文）

1. ChatPanel 收集消息 → `useAiStore.send()`
2. 组装 messages：system prompt + 历史消息（从 KV） + contextNoteIds 涉及笔记内容拼接 + 用户提问
3. `POST /api/ai/chat`（stream），sessionId 存在则 KV append 消息
4. Worker 调 DeepSeek（stream=true），SSE 转发；流结束写回 KV
5. 前端 MessageBubble 增量 append；底部按钮"插入到当前文档"把回答塞进 Vditor 当前光标处

**编辑器内嵌 AI**：选中文字 → `InlineAiMenu` 弹出 → 选动作 → 模板化 messages → `/api/ai/chat` → 流式浮卡 → 插入/追加。

### 9.3 RAG 查询

1. `POST /api/rag/query { question, topK: 6 }`
2. Worker：embed(question) → `NOTES_VEC.query(vector, topK)` → 返回 chunks（含 noteId / title / score）
3. 前端拼成"参考资料"system message：
   ```
   以下是用户的笔记片段，回答时引用：
   [1] (笔记: useEffect 详解) <chunk text>
   [2] (笔记: useState 入门) <chunk text>
   ```
4. 走 9.2 常规 chat，AI 回答含 [1][2] 引用，渲染时变可点击 → 跳到对应笔记

### 9.4 RAG 增量索引

- 笔记保存成功 → noteId append 到 `rag:status.dirtyNoteIds`
- Worker Cron 每 5 分钟扫一遍 → 拉 markdown → 切片 → embed → upsert → 从 dirty 移除

### 9.5 浏览器插件划词

1. content/injector 监听 `selectionchange`
2. 显示 FloatingButton（贴选区右上）
3. 用户点 → 弹 ActionMenu（按 storage 配置的顺序）
4. 选动作 → content 发消息给 background → background 调 Worker 或 GitHub
5. 流式回传 → content 端 ResultCard 增量渲染
6. ResultCard 底部按钮：复制 / 存为小记（→ Worker `/api/memos`）/ 存为知识库笔记（→ GitHub PUT clippings/）/ 关闭

### 9.6 PWA 离线

- Workbox 策略：
  - HTML / JS / CSS / 字体：StaleWhileRevalidate
  - 笔记列表 / 文档树 JSON：NetworkFirst（timeout 3 秒回退缓存）
  - 单篇笔记 Markdown：NetworkFirst，缓存所有访问过的笔记
- 离线时：可开 App、看侧栏、看曾访问的笔记和小记列表；新建/编辑/AI 操作禁用并提示

## 10. 错误处理

| 级别 | 类别 | 处理 |
|---|---|---|
| 致命 | GitHub PAT 失效 / Worker 不可达 / Master Token 错 | 全局拦截 → 跳 `/setup` 或 banner "请检查设置" |
| 业务 | GitHub 409 冲突、文件不存在、KV miss | 局部 toast + 重试入口 |
| 网络 | timeout / 5xx | 指数退避重试 3 次（200ms / 800ms / 3.2s），仍失败抛业务级 |
| 流式中断 | DeepSeek SSE 中途断 | 显示"AI 回答中断，重试 ↻"；已写入 KV 不丢 |
| AI 风控/限速 | DeepSeek 429 / 余额不足 | toast "API 限速，30 秒后重试" + 倒计时 |

**离线检测**：`navigator.onLine` + Worker 健康检查 ping；UI 右下角小灯（绿/黄/红），点击展开诊断。

## 11. 安全

| 风险 | 缓解 |
|---|---|
| Master Token 泄露 | 用户自设 32+ 字符；Worker 端 IP 滑窗限速 60 req/min；设置页一键轮换（生效需手动 `wrangler secret put` 同步） |
| GitHub PAT 泄露 | 仅 `repo` scope；前端只放 localStorage；导出配置码默认带"显示/隐藏"切换 |
| CORS | Worker 严格白名单：`https://*.pages.dev` + `chrome-extension://<extid>` + `moz-extension://<extid>` + 开发期 `localhost:5173` |
| DeepSeek 密钥 | 永不下放客户端；Worker 仅暴露 chat / embed 端点 |
| Vectorize 隐私 | 私人 index，仅 Worker 读写 |
| 依赖供应链 | 锁 `package-lock.json`；CI 跑 `npm audit` |

## 12. 测试策略

| 层 | 工具 | 覆盖 |
|---|---|---|
| 单元 | Vitest | utils（slug / front-matter / chunker / Markdown）、stores、services（MSW mock HTTP）|
| 组件 | Vitest + @vue/test-utils | VditorEditor / ChatPanel / MemoCard / DocumentTree 关键交互 |
| Worker 集成 | Vitest + `@cloudflare/vitest-pool-workers` | miniflare 跑路由，KV/Vectorize 用 mock binding |
| 端到端 | Playwright（仅核心路径） | 新建知识库 → 写笔记 → 保存 → AI 写作 → 流式 → 插入 |
| 手动验收 | 浏览器实测 | 插件划词（多网站）、PWA 离线、Edge & Chrome 兼容 |

**不做**：100% 行覆盖、E2E 跑所有边界、视觉回归。

## 13. 路线图（MVP → 增量）

| 阶段 | 关键产物 | 验收标准 | 预估周次 |
|---|---|---|---|
| **0. 工程脚手架** | 三个仓库初始化：`notes-app` / `notes-api` / `notes-extension`；wrangler/Vite 配置打通；CI 跑 lint+test | `npm run dev` 三处都能起 | 1 |
| **1. 笔记 MVP** | 三栏布局、知识库 CRUD、Vditor、GitHub 同步、设置页（PAT/Worker/Token）、`/setup` 向导 | 能新建知识库 → 写笔记 → 保存到 GitHub → 刷新后能读 | 2 |
| **2. 周边模块** | 全局搜索（Ctrl+J + Fuse 索引）、小记、收藏、首页 | 4 个模块都能用、跨知识库搜得到 | 2 |
| **3. AI 第一版** | Worker `/api/ai/*` + KV 会话存储 + ChatPanel 流式 + ModelSwitcher + 编辑器内嵌 AI + 插入到文档 | 用 DeepSeek 聊天、流式可见、会话历史持久 | 2 |
| **4. RAG + AI 增强** | Vectorize 索引、`/api/rag/*`、Cron 增量、AI 自动标题/摘要/标签 | 提问"我笔记里 X" 能命中 chunk、新笔记自动入索引 | 2 |
| **5. 浏览器插件** | Manifest V3、划词浮窗、8 个动作、保存到库/小记、整页剪藏、配置码导入 | Edge & Chrome 都能装、划词链路全通 | 2 |
| **6. PWA + 上线** | `vite-plugin-pwa` + Workbox 策略、Pages 部署、Worker 部署、域名 / HTTPS | 手机加到主屏、离线读笔记、生产 URL 可达 | 1 |

**总计 ~12 周**（个人项目节奏估算，全职可压缩 40%）。每阶段产出独立可上线，遇阻可任意阶段叉断。

## 14. 不在 MVP 范围（明确排除）

- 多人协作（破坏单用户假设）
- 版本回滚 UI（git history 已经能看）
- 网盘 / 图床（图片暂内嵌或外链；要本地化时再加 Cloudflare R2）
- 移动端原生 App（PWA 够用）
- 联网搜索（需要时另起阶段）
- 离线编辑队列（PWA-B 方案：只允许离线读）
- 深色主题（开发量 -20%，需要时再加）

## 15. 待实施（在 writing-plans 阶段细化）

- 顶层项目初始化的具体命令序列（Vite 模板、`create-cloudflare`、`@crxjs/vite-plugin` 等）
- 每个阶段任务的细颗粒度分解
- 部署 Cloudflare 的具体步骤（账号、Pages 绑定、Worker 部署、KV/Vectorize 创建）
- DeepSeek API 接入与 SSE 转发的具体代码骨架
- Vditor 配置项（工具栏、上传、主题适配）
- 各阶段的 Definition of Done 检查表
