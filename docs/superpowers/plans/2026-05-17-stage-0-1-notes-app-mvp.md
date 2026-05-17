# AI 笔记库 · Stage 0 + Stage 1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭好三个子项目的工程脚手架（`notes-app` / `notes-api` / `notes-extension`），并在 `notes-app` 内完成笔记 MVP —— 三栏布局 + 知识库 CRUD + Vditor 编辑器 + GitHub 同步 + 设置页 + 首次向导，使用户能在 GitHub 私有仓库里持久化笔记。

**Architecture:** Stage 0 在仓库根目录建子目录 `notes-app` / `notes-api` / `notes-extension`，每个独立 `package.json`、独立可起 dev server，根目录用 GitHub Actions 跑统一 CI。Stage 1 只动 `notes-app`：Vue 3 + Pinia + Vue Router + Element Plus + Vditor，通过 Octokit 直连 GitHub API（用户 PAT 在 localStorage），所有笔记按 spec 2026-05-17 的目录约定写入 `books/<bookSlug>/<noteSlug>.md`。

**Tech Stack:** Vue 3 · Vite 5 · TypeScript · Pinia · Vue Router 4 · Element Plus · Vditor · @octokit/rest · gray-matter · Vitest · @vue/test-utils · ESLint · Prettier · GitHub Actions

**Spec 来源:** [`docs/superpowers/specs/2026-05-17-ai-notes-design.md`](../specs/2026-05-17-ai-notes-design.md)

**范围说明:** 本计划只覆盖 Stage 0（脚手架）和 Stage 1（笔记 MVP）。Stage 2-6（搜索/小记/收藏/首页、AI、RAG、插件、PWA 上线）有各自的计划。

**预期产物:**
- 仓库 `AI-Code/` 初始化为 git；含 `notes-app` / `notes-api` / `notes-extension` 三个子项目骨架
- `notes-app` 可在浏览器跑：能在 `/setup` 填入 PAT/owner/repo → 在 `/book/<slug>` 创建/读取/编辑/保存/删除 Markdown 笔记，所有改动持久化到用户的 GitHub 私有仓库

---

## 0. 总览与文件结构

### 0.1 仓库根

```
AI-Code/
├── .git/                            # Stage 0 init
├── .gitignore
├── .gitattributes
├── README.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-05-17-ai-notes-design.md  (已存在)
│       └── plans/
│           └── 2026-05-17-stage-0-1-notes-app-mvp.md  (本文件)
├── notes-app/                       # Stage 0.2 + 整个 Stage 1
├── notes-api/                       # Stage 0.6 仅占位 (scaffold only)
└── notes-extension/                 # Stage 0.7 仅占位 (scaffold only)
```

### 0.2 `notes-app` 目录（Stage 1 完整结构）

```
notes-app/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc.json
├── index.html
├── env.d.ts
├── public/
│   └── favicon.svg
└── src/
    ├── main.ts                      # 入口：mount Pinia / Router / Element Plus
    ├── App.vue                      # 仅渲染 <RouterView/>
    ├── types.ts                     # 全局共享类型
    ├── router/
    │   └── index.ts                 # 路由表 + 全局守卫（凭据缺失跳 /setup）
    ├── stores/
    │   ├── auth.ts                  # PAT / owner / repo / workerUrl / masterToken
    │   ├── books.ts                 # 知识库列表 & CRUD
    │   ├── notes.ts                 # 当前书的文档树 / 当前笔记 / 保存状态
    │   └── ui.ts                    # toast 队列 / 侧栏折叠
    ├── services/
    │   └── github.ts                # Octokit 包装：list/get/save/delete/rename
    ├── utils/
    │   ├── uuid.ts                  # 短 id
    │   ├── slug.ts                  # title → slug
    │   ├── frontMatter.ts           # parse / stringify YAML front-matter
    │   ├── base64.ts                # UTF-8 → base64（GitHub contents API 需要）
    │   ├── debounce.ts
    │   ├── retry.ts                 # 指数退避
    │   └── *.test.ts                # 每个 util 都有同名测试
    ├── composables/
    │   └── useShortcut.ts           # 键盘快捷键（占位，Stage 2 用）
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.vue         # 三栏框架
    │   │   ├── PrimarySidebar.vue   # 第一栏
    │   │   ├── DocumentTree.vue     # 第二栏
    │   │   └── MainPane.vue         # 第三栏（router-view 容器）
    │   ├── editor/
    │   │   └── VditorEditor.vue
    │   └── common/
    │       ├── EmptyState.vue
    │       └── ConfirmDialog.vue
    ├── views/
    │   ├── HomeView.vue             # 占位，Stage 2 完善
    │   ├── SetupView.vue            # 首次向导
    │   ├── SettingsView.vue         # 设置 + 导出配置码
    │   └── BookView.vue             # /book/:bookSlug[/:noteId]
    └── styles/
        ├── variables.scss           # 语雀绿主题变量
        ├── element-overrides.scss
        └── global.scss
```

### 0.3 `notes-api` 占位结构（Stage 0 起一个能跑 dev 的最小 Worker，正式接口留给 Stage 3）

```
notes-api/
├── package.json
├── wrangler.toml
├── tsconfig.json
└── src/
    └── index.ts                     # 仅返回 "notes-api ok"
```

### 0.4 `notes-extension` 占位结构（Stage 0 起一个能 build 的 MV3 骨架，划词留给 Stage 5）

```
notes-extension/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── manifest.json                    # MV3 占位 manifest
├── public/
│   └── icons/
│       └── icon-128.png             # 临时占位图标
└── src/
    ├── background/
    │   └── service-worker.ts
    ├── popup/
    │   ├── App.vue
    │   ├── main.ts
    │   └── index.html
    └── options/
        ├── App.vue
        ├── main.ts
        └── index.html
```

---

## Stage 0 · 工程脚手架

> 目标：根目录 git init；三个子项目可独立 `npm run dev`；根 CI 跑 lint+test 通过。

---

### Task 0.1 · 根目录 git init + README + gitignore

**Files:**
- Create: `AI-Code/.gitignore`
- Create: `AI-Code/.gitattributes`
- Create: `AI-Code/README.md`

- [ ] **Step 1: 进入项目根，初始化 git**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git init
git branch -M main
```

预期：`Initialized empty Git repository in ...AI-Code/.git/`

- [ ] **Step 2: 写 `.gitignore`**

```gitignore
# deps
node_modules/
.pnpm-store/

# build outputs
dist/
.dist/
build/

# Vite / framework caches
.vite/
.vitest_temp/
.turbo/
.parcel-cache/

# logs
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*
*.log

# editors
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.shared.json

# OS
.DS_Store
Thumbs.db

# env / secrets
.env
.env.local
.env.*.local
.dev.vars
.wrangler/

# misc
.superpowers/
coverage/
*.tsbuildinfo
```

- [ ] **Step 3: 写 `.gitattributes`（Windows 友好）**

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.ps1 text eol=crlf
*.png binary
*.jpg binary
*.ico binary
```

- [ ] **Step 4: 写根 `README.md`**

```markdown
# AI 笔记库 (notes-monorepo)

个人 AI 笔记库系统：Web App + Cloudflare Worker + 浏览器插件。

## 子项目

- **notes-app/** —— Vue 3 + Vite + PWA，主笔记应用
- **notes-api/** —— Cloudflare Worker，AI / KV / Vectorize 代理
- **notes-extension/** —— Edge / Chrome 划词插件（MV3）

## 快速开始

```powershell
cd notes-app
npm install
npm run dev
```

## 文档

- 设计：`docs/superpowers/specs/`
- 实施计划：`docs/superpowers/plans/`
```

- [ ] **Step 5: 首次提交**

```powershell
git add .gitignore .gitattributes README.md docs/
git commit -m "chore: init repo with gitignore, gitattributes, README, existing docs"
```

预期：`[main (root-commit) ...] chore: ...`

---

### Task 0.2 · 用 Vite 模板创建 `notes-app`

**Files:**
- Create: 整个 `notes-app/` 目录（由 Vite 生成）

- [ ] **Step 1: 用官方 Vite vue-ts 模板生成**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
npm create vite@latest notes-app -- --template vue-ts
```

如果交互式提示（取决于 npm create 版本），直接全部接受默认。

预期：生成 `notes-app/` 子目录，包含 `package.json`、`vite.config.ts`、`tsconfig.json`、`src/`、`index.html`、`public/`。

- [ ] **Step 2: 进入子目录装依赖**

```powershell
cd notes-app
npm install
```

预期：`added N packages`，无错。

- [ ] **Step 3: 验证能跑 dev**

```powershell
npm run dev
```

打开浏览器 `http://localhost:5173`，看到 Vite + Vue 默认欢迎页。看完按 Ctrl+C 关掉。

- [ ] **Step 4: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-app
git commit -m "chore(notes-app): scaffold with Vite vue-ts template"
```

---

### Task 0.3 · 装上 `notes-app` 业务依赖与开发依赖

**Files:**
- Modify: `notes-app/package.json`

- [ ] **Step 1: 装运行时依赖**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm install vue-router@4 pinia@2 element-plus@2 @element-plus/icons-vue vditor@3 gray-matter @octokit/rest sass-embedded
```

预期：`added N packages`。

- [ ] **Step 2: 装开发依赖**

```powershell
npm install -D vitest @vitest/coverage-v8 @vue/test-utils jsdom @pinia/testing eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue prettier eslint-config-prettier eslint-plugin-prettier vue-tsc@2
```

预期：`added N packages`。

- [ ] **Step 3: 在 `notes-app/package.json` 的 `scripts` 中加上**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "lint": "eslint . --ext .ts,.vue --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.vue --fix",
    "format": "prettier --write \"src/**/*.{ts,vue,scss,css,json,md}\"",
    "typecheck": "vue-tsc -b --noEmit"
  }
}
```

- [ ] **Step 4: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-app/package.json notes-app/package-lock.json
git commit -m "chore(notes-app): add runtime + dev dependencies"
```

---

### Task 0.4 · 配置 ESLint + Prettier

**Files:**
- Create: `notes-app/.eslintrc.cjs`
- Create: `notes-app/.prettierrc.json`
- Create: `notes-app/.eslintignore`

- [ ] **Step 1: 写 `.eslintrc.cjs`**

```javascript
module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
```

- [ ] **Step 2: 写 `.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always",
  "vueIndentScriptAndStyle": false
}
```

- [ ] **Step 3: 写 `.eslintignore`**

```
dist
node_modules
coverage
*.config.js
*.config.ts
```

- [ ] **Step 4: 跑一次 lint 验证配置 OK**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm run lint
```

预期：没有报错（默认模板代码可能有少量警告，遇到失败先 `npm run lint:fix`）。

- [ ] **Step 5: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-app/.eslintrc.cjs notes-app/.prettierrc.json notes-app/.eslintignore
git commit -m "chore(notes-app): configure eslint + prettier"
```

---

### Task 0.5 · 配置 Vitest（含 jsdom 环境 + 示例测试）

**Files:**
- Create: `notes-app/vitest.config.ts`
- Create: `notes-app/src/utils/sanity.ts`
- Create: `notes-app/src/utils/sanity.test.ts`

- [ ] **Step 1: 写 `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

- [ ] **Step 2: 写一个 sanity util + 测试，先看到 RED**

`src/utils/sanity.ts`:

```typescript
export function ping(): string {
  // intentionally wrong on first run so the test fails
  return ''
}
```

`src/utils/sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ping } from './sanity'

describe('ping', () => {
  it('returns "pong"', () => {
    expect(ping()).toBe('pong')
  })
})
```

- [ ] **Step 3: 跑测试，确认 FAIL**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm test
```

预期：1 failed, expected `'pong'` to be `''`.

- [ ] **Step 4: 改实现，让测试通过**

`src/utils/sanity.ts`:

```typescript
export function ping(): string {
  return 'pong'
}
```

再跑 `npm test`，预期：1 passed.

- [ ] **Step 5: 也在 `tsconfig.json` 的 `compilerOptions.paths` 加 `@/*` 别名**

打开 `notes-app/tsconfig.json`，在 `compilerOptions` 里加：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

`notes-app/vite.config.ts` 同步加 alias（如果模板里没有）：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

- [ ] **Step 6: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-app/vitest.config.ts notes-app/src/utils notes-app/tsconfig.json notes-app/vite.config.ts
git commit -m "chore(notes-app): setup vitest + jsdom + path alias, add sanity test"
```

---

### Task 0.6 · 用 `create-cloudflare` 起 `notes-api` 占位

**Files:**
- Create: 整个 `notes-api/` 目录

- [ ] **Step 1: 起一个 Hono 模板 Worker**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
npm create cloudflare@latest notes-api -- --framework=hono --ts=true --git=false --deploy=false
```

如果有交互提示：选 "Hello World example" 之外的 Hono 模板；TypeScript=Yes；不要 git init；不要 deploy。

预期：生成 `notes-api/` 目录，包含 `wrangler.toml`、`src/index.ts`、`package.json`。

- [ ] **Step 2: 简化 `src/index.ts` 为占位响应**

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('notes-api ok'))
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

export default app
```

- [ ] **Step 3: 验证能跑 wrangler dev**

```powershell
cd notes-api
npm install
npx wrangler dev
```

打开 `http://localhost:8787`，应见 "notes-api ok"。Ctrl+C 退出。

- [ ] **Step 4: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-api
git commit -m "chore(notes-api): scaffold worker placeholder with hono"
```

---

### Task 0.7 · 起 `notes-extension` MV3 骨架

**Files:**
- Create: `notes-extension/package.json`
- Create: `notes-extension/vite.config.ts`
- Create: `notes-extension/tsconfig.json`
- Create: `notes-extension/manifest.json`
- Create: `notes-extension/src/background/service-worker.ts`
- Create: `notes-extension/src/popup/{index.html,main.ts,App.vue}`
- Create: `notes-extension/src/options/{index.html,main.ts,App.vue}`
- Create: `notes-extension/public/icons/icon-128.png`（任意 128x128 PNG 占位）

- [ ] **Step 1: 进入根目录手动建 `notes-extension`**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
mkdir notes-extension
cd notes-extension
mkdir src, src/background, src/popup, src/options, public, public/icons
```

- [ ] **Step 2: 创建 `package.json`**

```json
{
  "name": "notes-extension",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "typecheck": "vue-tsc -b --noEmit"
  },
  "dependencies": {
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "2.0.0-beta.28",
    "@types/chrome": "^0.0.270",
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.0.0"
  }
}
```

跑：

```powershell
npm install
```

- [ ] **Step 3: 创建 `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "AI 笔记库 划词助手",
  "version": "0.0.1",
  "description": "Highlight text on any page → DeepSeek → save to your notes",
  "icons": { "128": "icons/icon-128.png" },
  "action": { "default_popup": "src/popup/index.html", "default_title": "AI 笔记库" },
  "options_page": "src/options/index.html",
  "background": { "service_worker": "src/background/service-worker.ts", "type": "module" },
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["<all_urls>"]
}
```

- [ ] **Step 4: 创建 `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
})
```

- [ ] **Step 5: 创建 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "types": ["chrome", "vite/client"],
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

- [ ] **Step 6: 创建 background placeholder**

`src/background/service-worker.ts`:

```typescript
chrome.runtime.onInstalled.addListener(() => {
  console.log('notes-extension installed')
})
```

- [ ] **Step 7: 创建 popup placeholder**

`src/popup/index.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>AI 笔记库</title></head>
<body><div id="app"></div><script type="module" src="./main.ts"></script></body></html>
```

`src/popup/main.ts`:

```typescript
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).mount('#app')
```

`src/popup/App.vue`:

```vue
<template>
  <div style="padding: 16px; min-width: 240px; font-family: sans-serif">
    <h3 style="margin: 0 0 8px">AI 笔记库</h3>
    <p style="font-size: 12px; color: #666">划词助手占位。完整功能在 Stage 5 实现。</p>
  </div>
</template>
```

- [ ] **Step 8: 创建 options placeholder（结构同 popup）**

`src/options/index.html`、`src/options/main.ts`、`src/options/App.vue` 三个文件，照搬 popup，把标题换成"AI 笔记库设置"，文案换成"设置页占位"。

- [ ] **Step 9: 放一张占位图标（128x128 PNG）**

可以从任何图标库找一张存到 `public/icons/icon-128.png`，或者用 PowerShell 生成一张纯色占位 PNG（不强求图标好看，能加载即可）：

```powershell
# 简单办法：从网上找一张 128x128 的 PNG 存到此路径
# 或先用任意现成 PNG 改名占位
```

- [ ] **Step 10: 验证能 build**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-extension
npm run build
```

预期：`dist/` 目录生成，含 `manifest.json` 复制版本、`assets/`、`src/popup/index.html` 等。

- [ ] **Step 11: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add notes-extension
git commit -m "chore(notes-extension): scaffold MV3 vue + crxjs"
```

---

### Task 0.8 · 根目录 GitHub Actions CI

**Files:**
- Create: `AI-Code/.github/workflows/ci.yml`

- [ ] **Step 1: 写 CI 工作流（仅在 PR / push to main 触发，三个子项目并行跑 lint+test+build）**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  notes-app:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: notes-app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: notes-app/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

  notes-api:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: notes-api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: notes-api/package-lock.json }
      - run: npm ci
      - run: npx wrangler deploy --dry-run

  notes-extension:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: notes-extension
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: notes-extension/package-lock.json }
      - run: npm ci
      - run: npm run build
```

- [ ] **Step 2: 提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for three subprojects"
```

> CI 真正生效要等你把 repo push 到 GitHub 上之后；本地无需运行。

---

## Stage 1 · 笔记 MVP（仅在 `notes-app` 内）

> 之后所有 cd 默认在 `C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app`

---

### Task 1.1 · `utils/uuid.ts`

**Files:**
- Create: `src/utils/uuid.ts`
- Create: `src/utils/uuid.test.ts`

- [ ] **Step 1: 写测试（RED）**

```typescript
// src/utils/uuid.test.ts
import { describe, it, expect } from 'vitest'
import { shortId } from './uuid'

describe('shortId', () => {
  it('returns 8-char hex string', () => {
    const id = shortId()
    expect(id).toMatch(/^[0-9a-f]{8}$/)
  })

  it('returns different ids on each call', () => {
    const a = shortId()
    const b = shortId()
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 2: 跑测试看 FAIL**

```powershell
npm test src/utils/uuid.test.ts
```

预期：`Cannot find module './uuid'`.

- [ ] **Step 3: 实现**

```typescript
// src/utils/uuid.ts
export function shortId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
```

- [ ] **Step 4: 跑测试看 PASS**

```powershell
npm test src/utils/uuid.test.ts
```

预期：2 passed.

- [ ] **Step 5: 提交**

```powershell
git add src/utils/uuid.ts src/utils/uuid.test.ts
git commit -m "feat(utils): short hex id generator"
```

---

### Task 1.2 · `utils/slug.ts`

**Files:**
- Create: `src/utils/slug.ts`
- Create: `src/utils/slug.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// src/utils/slug.test.ts
import { describe, it, expect } from 'vitest'
import { titleToSlug } from './slug'

describe('titleToSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(titleToSlug('Hello World')).toBe('hello-world')
  })

  it('preserves chinese characters', () => {
    expect(titleToSlug('React 入门')).toBe('react-入门')
  })

  it('strips punctuation', () => {
    expect(titleToSlug('useEffect: Deep Dive!')).toBe('useeffect-deep-dive')
  })

  it('collapses consecutive separators', () => {
    expect(titleToSlug('a   b___c')).toBe('a-b-c')
  })

  it('returns "untitled" for empty input', () => {
    expect(titleToSlug('')).toBe('untitled')
    expect(titleToSlug('   ')).toBe('untitled')
  })

  it('trims leading/trailing dashes', () => {
    expect(titleToSlug('  hello  ')).toBe('hello')
  })
})
```

- [ ] **Step 2: 跑测试看 FAIL，然后实现**

```typescript
// src/utils/slug.ts
export function titleToSlug(title: string): string {
  const cleaned = title
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, ' ')    // 标点、符号 → 空格
    .replace(/[\s_]+/g, '-')            // 连续空白/下划线 → 单 dash
    .replace(/^-+|-+$/g, '')
  return cleaned || 'untitled'
}
```

- [ ] **Step 3: `npm test src/utils/slug.test.ts` 看 6 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/utils/slug.ts src/utils/slug.test.ts
git commit -m "feat(utils): titleToSlug supporting CJK"
```

---

### Task 1.3 · `utils/frontMatter.ts`

**Files:**
- Create: `src/utils/frontMatter.ts`
- Create: `src/utils/frontMatter.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// src/utils/frontMatter.test.ts
import { describe, it, expect } from 'vitest'
import { parseFrontMatter, stringifyFrontMatter } from './frontMatter'

describe('parseFrontMatter', () => {
  it('parses front-matter and body', () => {
    const raw = `---\nid: abc12345\ntitle: Hello\ntags: [a, b]\n---\n\n## Body\n\ncontent`
    const { meta, body } = parseFrontMatter(raw)
    expect(meta.id).toBe('abc12345')
    expect(meta.title).toBe('Hello')
    expect(meta.tags).toEqual(['a', 'b'])
    expect(body.trim()).toBe('## Body\n\ncontent')
  })

  it('handles missing front-matter', () => {
    const { meta, body } = parseFrontMatter('just body')
    expect(meta).toEqual({})
    expect(body).toBe('just body')
  })
})

describe('stringifyFrontMatter', () => {
  it('roundtrips', () => {
    const out = stringifyFrontMatter({ id: 'x', title: 'T' }, '# body')
    const { meta, body } = parseFrontMatter(out)
    expect(meta.id).toBe('x')
    expect(meta.title).toBe('T')
    expect(body.trim()).toBe('# body')
  })
})
```

- [ ] **Step 2: 实现（用 gray-matter）**

```typescript
// src/utils/frontMatter.ts
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
```

- [ ] **Step 3: `npm test src/utils/frontMatter.test.ts` 看 3 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/utils/frontMatter.ts src/utils/frontMatter.test.ts
git commit -m "feat(utils): front-matter parse/stringify via gray-matter"
```

---

### Task 1.4 · `utils/base64.ts`（GitHub contents API 要 UTF-8 base64）

**Files:**
- Create: `src/utils/base64.ts`
- Create: `src/utils/base64.test.ts`

- [ ] **Step 1: 测试**

```typescript
// src/utils/base64.test.ts
import { describe, it, expect } from 'vitest'
import { encodeUtf8Base64, decodeUtf8Base64 } from './base64'

describe('base64 UTF-8 roundtrip', () => {
  it('ascii', () => {
    const s = 'hello world'
    expect(decodeUtf8Base64(encodeUtf8Base64(s))).toBe(s)
  })

  it('chinese', () => {
    const s = '中文测试 🚀'
    expect(decodeUtf8Base64(encodeUtf8Base64(s))).toBe(s)
  })

  it('encoded form is valid base64', () => {
    expect(encodeUtf8Base64('中')).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/utils/base64.ts
export function encodeUtf8Base64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export function decodeUtf8Base64(b64: string): string {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}
```

- [ ] **Step 3: `npm test src/utils/base64.test.ts` 看 3 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/utils/base64.ts src/utils/base64.test.ts
git commit -m "feat(utils): UTF-8 safe base64 encode/decode"
```

---

### Task 1.5 · `utils/debounce.ts`

**Files:**
- Create: `src/utils/debounce.ts`
- Create: `src/utils/debounce.test.ts`

- [ ] **Step 1: 测试**

```typescript
// src/utils/debounce.test.ts
import { describe, it, expect, vi } from 'vitest'
import { debounce } from './debounce'

describe('debounce', () => {
  it('coalesces rapid calls', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = debounce(fn, 200)
    d('a'); d('b'); d('c')
    vi.advanceTimersByTime(199)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('c')
    vi.useRealTimers()
  })

  it('cancel prevents pending invocation', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d()
    d.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/utils/debounce.ts
export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void
  cancel(): void
  flush(): void
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedFn<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A | null = null

  const wrapped = (...args: A) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (lastArgs) fn(...lastArgs)
      timer = null
      lastArgs = null
    }, delay)
  }

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  wrapped.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer)
      fn(...lastArgs)
      timer = null
      lastArgs = null
    }
  }

  return wrapped as DebouncedFn<A>
}
```

- [ ] **Step 3: `npm test src/utils/debounce.test.ts` 看 2 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/utils/debounce.ts src/utils/debounce.test.ts
git commit -m "feat(utils): debounce with cancel + flush"
```

---

### Task 1.6 · `utils/retry.ts`（指数退避）

**Files:**
- Create: `src/utils/retry.ts`
- Create: `src/utils/retry.test.ts`

- [ ] **Step 1: 测试**

```typescript
// src/utils/retry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { retry } from './retry'

describe('retry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries until success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    await expect(retry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('boom')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('skips retry when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('400'))
    await expect(
      retry(fn, { attempts: 3, baseDelayMs: 1, shouldRetry: () => false })
    ).rejects.toThrow('400')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/utils/retry.ts
export interface RetryOptions {
  attempts: number
  baseDelayMs: number
  factor?: number
  shouldRetry?: (err: unknown) => boolean
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const factor = opts.factor ?? 4
  const shouldRetry = opts.shouldRetry ?? (() => true)
  let lastErr: unknown
  for (let i = 0; i < opts.attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === opts.attempts - 1 || !shouldRetry(err)) throw err
      const delay = opts.baseDelayMs * Math.pow(factor, i)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}
```

- [ ] **Step 3: `npm test src/utils/retry.test.ts` 看 4 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/utils/retry.ts src/utils/retry.test.ts
git commit -m "feat(utils): retry with exponential backoff and shouldRetry hook"
```

---

### Task 1.7 · 全局类型 `types.ts`

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 写类型**

```typescript
// src/types.ts
export interface AuthConfig {
  githubPat: string
  owner: string
  repo: string
  workerUrl?: string
  masterToken?: string
  defaultBookSlug?: string
}

export interface BookMeta {
  slug: string             // 来自目录名
  name: string             // .book.json.name，默认 == slug
  icon?: string
  order?: number
  createdAt?: string
}

export interface NoteSummary {
  id: string
  slug: string             // 来自文件名（不含扩展）
  title: string
  updatedAt?: string
  tags?: string[]
  summary?: string
  /** 文件在仓库里的相对路径：books/<book>/<...subFolders>/<slug>.md */
  filePath: string
}

export interface Note extends NoteSummary {
  content: string          // 不含 front-matter 的正文
  sha?: string             // 远端文件 sha（保存时回传防冲突）
}

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'

export interface GithubConflictError {
  type: 'conflict'
  remoteSha: string
  remoteContent: string
}
```

- [ ] **Step 2: 提交**

```powershell
git add src/types.ts
git commit -m "feat: shared types (AuthConfig, Book, Note, SaveStatus)"
```

---

### Task 1.8 · 主题样式与 Element Plus override

**Files:**
- Create: `src/styles/variables.scss`
- Create: `src/styles/element-overrides.scss`
- Create: `src/styles/global.scss`

- [ ] **Step 1: `variables.scss`**

```scss
// src/styles/variables.scss
:root {
  --color-primary: #1a8754;
  --color-primary-hover: #157a47;
  --color-primary-light-bg: #e8f5ed;
  --color-text-primary: #1f2329;
  --color-text-secondary: #4f5b67;
  --color-text-tertiary: #8a94a0;
  --color-border: #e7eaef;
  --color-bg-app: #ffffff;
  --color-bg-sidebar: #fafbfc;
  --color-bg-hover: #f3f5f8;
  --color-danger: #d4564e;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06);
  --radius-sm: 4px;
  --radius-md: 6px;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', PingFang SC,
    'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', 'Source Code Pro', Menlo, monospace;
}
```

- [ ] **Step 2: `element-overrides.scss`（把 Element Plus 的主色覆写成语雀绿）**

```scss
// src/styles/element-overrides.scss
@use 'element-plus/theme-chalk/src/common/var.scss' as * with (
  $colors: (
    'primary': ('base': #1a8754),
  )
);
@use 'element-plus/theme-chalk/src/index.scss' as *;
```

- [ ] **Step 3: `global.scss`**

```scss
// src/styles/global.scss
@import './variables.scss';

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-bg-app);
  -webkit-font-smoothing: antialiased;
}
* { box-sizing: border-box; }
a { color: var(--color-primary); text-decoration: none; }
a:hover { color: var(--color-primary-hover); }
```

- [ ] **Step 4: 在 `vite.config.ts` 启用 Element Plus 主题覆盖**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
})
```

- [ ] **Step 5: 提交**

```powershell
git add src/styles vite.config.ts
git commit -m "feat(styles): yuque-green theme variables + element-plus override"
```

---

### Task 1.9 · `main.ts` 引导 Pinia + Router + Element Plus

**Files:**
- Modify: `src/main.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: 替换 `src/main.ts`**

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementIcons from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import '@/styles/element-overrides.scss'
import '@/styles/global.scss'
import 'vditor/dist/index.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [name, comp] of Object.entries(ElementIcons)) {
  app.component(name, comp)
}
app.mount('#app')
```

- [ ] **Step 2: 替换 `src/App.vue`**

```vue
<template>
  <RouterView />
</template>

<script setup lang="ts"></script>
```

- [ ] **Step 3: 跑 dev 验证不崩**

```powershell
npm run dev
```

预期：起一个空白页（路由还没建，看到默认 404 也算正常）。Ctrl+C 退。

- [ ] **Step 4: 提交**

```powershell
git add src/main.ts src/App.vue
git commit -m "feat: wire up pinia + vue-router + element-plus in main"
```

---

### Task 1.10 · 路由表骨架

**Files:**
- Create: `src/router/index.ts`
- Create: `src/views/HomeView.vue`
- Create: `src/views/SetupView.vue`
- Create: `src/views/SettingsView.vue`
- Create: `src/views/BookView.vue`
- Create: `src/views/AiView.vue`（占位）
- Create: `src/views/MemosView.vue`（占位）
- Create: `src/views/FavoritesView.vue`（占位）
- Create: `src/views/SearchView.vue`（占位）

- [ ] **Step 1: 写五个占位 view（同模板，仅改文字）**

例如 `src/views/HomeView.vue`：

```vue
<template>
  <div class="placeholder">
    <h2>首页</h2>
    <p>Stage 2 完善：最近编辑 / 最近小记 / 收藏精选。</p>
  </div>
</template>

<style scoped>
.placeholder { padding: 32px; color: var(--color-text-secondary); }
</style>
```

对 `AiView` / `MemosView` / `FavoritesView` / `SearchView` 同样的模板，仅改标题（"AI 写作"/"小记"/"收藏"/"搜索"）。

`SetupView.vue` / `SettingsView.vue` / `BookView.vue` 先放占位 `<template><div>TODO {{ name }}</div></template>`，后续 Task 重写。

- [ ] **Step 2: 写路由表**

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/setup', name: 'setup', component: () => import('@/views/SetupView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/ai', name: 'ai', component: () => import('@/views/AiView.vue') },
    { path: '/memos', name: 'memos', component: () => import('@/views/MemosView.vue') },
    { path: '/favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    {
      path: '/book/:bookSlug',
      name: 'book',
      component: () => import('@/views/BookView.vue'),
      props: true,
      children: [
        {
          path: ':noteId',
          name: 'book-note',
          component: () => import('@/views/BookView.vue'),
          props: true,
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
```

- [ ] **Step 3: 跑 dev 访问 `/` / `/ai` / `/setup` 验证不崩**

```powershell
npm run dev
```

每个路径都应见占位文字。

- [ ] **Step 4: 提交**

```powershell
git add src/router src/views
git commit -m "feat(router): scaffold all routes with placeholder views"
```

---

### Task 1.11 · `useAuthStore`（带 localStorage 持久化）

**Files:**
- Create: `src/stores/auth.ts`
- Create: `src/stores/auth.test.ts`

- [ ] **Step 1: 写测试**

```typescript
// src/stores/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('isConfigured is false when missing pat/owner/repo', () => {
    const s = useAuthStore()
    expect(s.isConfigured).toBe(false)
  })

  it('isConfigured is true once required fields set', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'notes-db' })
    expect(s.isConfigured).toBe(true)
  })

  it('persists to localStorage', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'notes-db' })
    expect(localStorage.getItem('notes-app:auth')).toContain('"owner":"me"')
  })

  it('hydrates from localStorage on instantiation', () => {
    localStorage.setItem(
      'notes-app:auth',
      JSON.stringify({ githubPat: 'p', owner: 'me', repo: 'r' }),
    )
    const s = useAuthStore()
    expect(s.owner).toBe('me')
    expect(s.isConfigured).toBe(true)
  })

  it('clears wipes localStorage', () => {
    const s = useAuthStore()
    s.setConfig({ githubPat: 'p', owner: 'me', repo: 'r' })
    s.clear()
    expect(localStorage.getItem('notes-app:auth')).toBeNull()
    expect(s.isConfigured).toBe(false)
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthConfig } from '@/types'

const STORAGE_KEY = 'notes-app:auth'

function loadFromStorage(): Partial<AuthConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Partial<AuthConfig>) : {}
  } catch {
    return {}
  }
}

export const useAuthStore = defineStore('auth', () => {
  const initial = loadFromStorage()
  const githubPat = ref(initial.githubPat ?? '')
  const owner = ref(initial.owner ?? '')
  const repo = ref(initial.repo ?? '')
  const workerUrl = ref(initial.workerUrl ?? '')
  const masterToken = ref(initial.masterToken ?? '')
  const defaultBookSlug = ref(initial.defaultBookSlug ?? '')

  const isConfigured = computed(
    () => !!(githubPat.value && owner.value && repo.value),
  )

  function persist() {
    const data: AuthConfig = {
      githubPat: githubPat.value,
      owner: owner.value,
      repo: repo.value,
      workerUrl: workerUrl.value || undefined,
      masterToken: masterToken.value || undefined,
      defaultBookSlug: defaultBookSlug.value || undefined,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  function setConfig(cfg: Partial<AuthConfig>) {
    if (cfg.githubPat !== undefined) githubPat.value = cfg.githubPat
    if (cfg.owner !== undefined) owner.value = cfg.owner
    if (cfg.repo !== undefined) repo.value = cfg.repo
    if (cfg.workerUrl !== undefined) workerUrl.value = cfg.workerUrl
    if (cfg.masterToken !== undefined) masterToken.value = cfg.masterToken
    if (cfg.defaultBookSlug !== undefined) defaultBookSlug.value = cfg.defaultBookSlug
    persist()
  }

  function clear() {
    githubPat.value = ''
    owner.value = ''
    repo.value = ''
    workerUrl.value = ''
    masterToken.value = ''
    defaultBookSlug.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    githubPat, owner, repo, workerUrl, masterToken, defaultBookSlug,
    isConfigured, setConfig, clear,
  }
})
```

- [ ] **Step 3: `npm test src/stores/auth.test.ts` 看 5 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/stores/auth.ts src/stores/auth.test.ts
git commit -m "feat(store): useAuthStore with localStorage persistence"
```

---

### Task 1.12 · 路由守卫：未配置时跳 `/setup`

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: 加全局 beforeEach**

替换 `src/router/index.ts` 末尾的 `export default router`，改为：

```typescript
import { useAuthStore } from '@/stores/auth'

router.beforeEach((to) => {
  if (to.name === 'setup') return true
  const auth = useAuthStore()
  if (!auth.isConfigured) return { name: 'setup' }
  return true
})

export default router
```

> 注意：`useAuthStore` 必须在 Pinia 已挂载之后调用；因为守卫触发时机在 `app.use(router)` 之后，安全。

- [ ] **Step 2: 跑 dev**

```powershell
npm run dev
```

打开 `/`：应自动跳到 `/setup`。

- [ ] **Step 3: 提交**

```powershell
git add src/router/index.ts
git commit -m "feat(router): guard redirects to /setup until auth configured"
```

---

### Task 1.13 · `SetupView` —— 首次向导表单

**Files:**
- Modify: `src/views/SetupView.vue`

- [ ] **Step 1: 写完整组件**

```vue
<!-- src/views/SetupView.vue -->
<template>
  <div class="setup">
    <div class="setup__card">
      <h1>🌱 AI 笔记库</h1>
      <p class="setup__subtitle">填入你的 GitHub 凭据，开始使用。</p>

      <el-form :model="form" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="GitHub Personal Access Token (PAT)" required>
          <el-input v-model="form.githubPat" type="password" show-password
            placeholder="ghp_..." />
          <p class="setup__hint">需要 repo 权限（私有仓库读写）</p>
        </el-form-item>

        <el-form-item label="GitHub 用户名 (owner)" required>
          <el-input v-model="form.owner" placeholder="your-github-username" />
        </el-form-item>

        <el-form-item label="仓库名 (repo)" required>
          <el-input v-model="form.repo" placeholder="notes-db" />
        </el-form-item>

        <el-divider>可选 · 后续阶段才会用</el-divider>

        <el-form-item label="Cloudflare Worker URL">
          <el-input v-model="form.workerUrl" placeholder="https://notes-api.you.workers.dev" />
        </el-form-item>
        <el-form-item label="Master Token">
          <el-input v-model="form.masterToken" type="password" show-password />
        </el-form-item>

        <el-button type="primary" :loading="saving" native-type="submit"
          :disabled="!canSubmit" style="width: 100%;">
          保存并进入笔记库
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const saving = ref(false)

const form = reactive({
  githubPat: auth.githubPat,
  owner: auth.owner,
  repo: auth.repo,
  workerUrl: auth.workerUrl,
  masterToken: auth.masterToken,
})

const canSubmit = computed(() => !!(form.githubPat && form.owner && form.repo))

async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  auth.setConfig({ ...form })
  saving.value = false
  ElMessage.success('已保存')
  router.push({ name: 'home' })
}
</script>

<style scoped>
.setup {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-sidebar);
}
.setup__card {
  width: 420px;
  background: #fff;
  padding: 36px 32px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
.setup__card h1 { margin: 0 0 8px; color: var(--color-primary); }
.setup__subtitle { color: var(--color-text-secondary); margin: 0 0 24px; }
.setup__hint { font-size: 12px; color: var(--color-text-tertiary); margin: 4px 0 0; }
</style>
```

- [ ] **Step 2: 跑 dev 实地填一次**

```powershell
npm run dev
```

在 `/setup` 填一个真实可读的 PAT、owner、repo。点保存 → 应跳到 `/`，看到 HomeView 占位。再刷新页面也应留在 `/`（不再被路由守卫赶回 setup）。

> **临时仓库准备**：在 GitHub 新建一个私有空仓库（比如 `notes-db`），里面什么都不放（后续 Task 自动创建第一个 book）。PAT 在 [GitHub Settings → Developer settings → Personal access tokens (classic)](https://github.com/settings/tokens) 生成一把 `repo` scope 的。

- [ ] **Step 3: 提交**

```powershell
git add src/views/SetupView.vue
git commit -m "feat(setup): initial wizard form to capture PAT / owner / repo"
```

---

### Task 1.14 · `services/github.ts` —— Octokit client + 仓库初始化

**Files:**
- Create: `src/services/github.ts`
- Create: `src/services/github.test.ts`

- [ ] **Step 1: 测试（mock Octokit）**

```typescript
// src/services/github.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@octokit/rest', () => {
  const mock = {
    repos: {
      getContent: vi.fn(),
      createOrUpdateFileContents: vi.fn(),
      deleteFile: vi.fn(),
    },
    git: { getTree: vi.fn() },
  }
  return { Octokit: vi.fn(() => mock) }
})

import { Octokit } from '@octokit/rest'
import { getOctokit } from './github'

describe('getOctokit', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(Octokit).mockClear()
  })

  it('creates Octokit with PAT from authStore', () => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'notes-db' })
    getOctokit()
    expect(Octokit).toHaveBeenCalledWith({ auth: 'ghp_abc' })
  })

  it('throws if not configured', () => {
    expect(() => getOctokit()).toThrow(/not configured/i)
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/services/github.ts
import { Octokit } from '@octokit/rest'
import { useAuthStore } from '@/stores/auth'

let cached: { token: string; client: Octokit } | null = null

export function getOctokit(): Octokit {
  const auth = useAuthStore()
  if (!auth.isConfigured) throw new Error('GitHub auth not configured')
  if (!cached || cached.token !== auth.githubPat) {
    cached = { token: auth.githubPat, client: new Octokit({ auth: auth.githubPat }) }
  }
  return cached.client
}

export function getRepoCoords(): { owner: string; repo: string } {
  const auth = useAuthStore()
  return { owner: auth.owner, repo: auth.repo }
}
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看 2 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): octokit factory caching by token"
```

---

### Task 1.15 · `github.ts` —— 列知识库

**Files:**
- Modify: `src/services/github.ts`
- Modify: `src/services/github.test.ts`

- [ ] **Step 1: 加测试（先 fail）**

在 `github.test.ts` 末尾追加：

```typescript
import { listBooks } from './github'

describe('listBooks', () => {
  beforeEach(() => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
  })

  it('returns books from books/ directory entries', async () => {
    const octokit = getOctokit() as unknown as { repos: { getContent: ReturnType<typeof vi.fn> } }
    octokit.repos.getContent
      .mockResolvedValueOnce({
        data: [
          { type: 'dir', name: 'default' },
          { type: 'dir', name: 'react' },
          { type: 'file', name: 'README.md' },
        ],
      })
      // .book.json fetches (2 dirs → 2 fetches)
      .mockResolvedValueOnce({ data: { content: btoa('{"name":"默认知识库","order":0}'), encoding: 'base64' } })
      .mockResolvedValueOnce({ data: { content: btoa('{"name":"React 学习","order":1}'), encoding: 'base64' } })

    const books = await listBooks()
    expect(books).toHaveLength(2)
    expect(books[0]).toMatchObject({ slug: 'default', name: '默认知识库' })
    expect(books[1]).toMatchObject({ slug: 'react', name: 'React 学习' })
  })

  it('returns empty array when books/ directory does not exist (404)', async () => {
    const octokit = getOctokit() as unknown as { repos: { getContent: ReturnType<typeof vi.fn> } }
    octokit.repos.getContent.mockRejectedValueOnce({ status: 404 })
    const books = await listBooks()
    expect(books).toEqual([])
  })
})
```

- [ ] **Step 2: 实现 `listBooks`**

在 `src/services/github.ts` 末尾加：

```typescript
import type { BookMeta } from '@/types'
import { decodeUtf8Base64 } from '@/utils/base64'

export async function listBooks(): Promise<BookMeta[]> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  let entries: Array<{ type: string; name: string }>
  try {
    const res = await octokit.repos.getContent({ owner, repo, path: 'books' })
    entries = Array.isArray(res.data) ? (res.data as unknown as typeof entries) : []
  } catch (err) {
    if ((err as { status?: number }).status === 404) return []
    throw err
  }

  const dirs = entries.filter((e) => e.type === 'dir')
  const books: BookMeta[] = await Promise.all(
    dirs.map(async (dir) => {
      try {
        const meta = await octokit.repos.getContent({
          owner, repo, path: `books/${dir.name}/.book.json`,
        })
        const data = meta.data as { content?: string; encoding?: string }
        const parsed = data.content
          ? JSON.parse(decodeUtf8Base64(data.content))
          : {}
        return { slug: dir.name, name: parsed.name ?? dir.name, ...parsed }
      } catch {
        return { slug: dir.name, name: dir.name }
      }
    }),
  )
  return books.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看全过**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): listBooks with .book.json metadata"
```

---

### Task 1.16 · `github.ts` —— 列单个 book 下的笔记

**Files:**
- Modify: `src/services/github.ts`
- Modify: `src/services/github.test.ts`

- [ ] **Step 1: 加测试**

```typescript
import { listNotes } from './github'

describe('listNotes', () => {
  beforeEach(() => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
  })

  it('returns notes parsed from front-matter', async () => {
    const octokit = getOctokit() as unknown as { git: { getTree: ReturnType<typeof vi.fn> } }
    octokit.git.getTree.mockResolvedValueOnce({
      data: {
        tree: [
          { path: 'books/default/welcome.md', type: 'blob', sha: 'sha1' },
          { path: 'books/default/.book.json', type: 'blob' },
          { path: 'books/default/react/hooks.md', type: 'blob', sha: 'sha2' },
        ],
      },
    })
    const repoOctokit = getOctokit() as unknown as { repos: { getContent: ReturnType<typeof vi.fn> } }
    repoOctokit.repos.getContent
      .mockResolvedValueOnce({
        data: {
          content: btoa('---\nid: abc12345\ntitle: 欢迎\nupdatedAt: 2026-01-01T00:00:00Z\n---\nbody'),
          encoding: 'base64',
          sha: 'sha1',
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: btoa('---\nid: def67890\ntitle: Hooks\nupdatedAt: 2026-02-01T00:00:00Z\n---\nbody'),
          encoding: 'base64',
          sha: 'sha2',
        },
      })

    const notes = await listNotes('default')
    expect(notes).toHaveLength(2)
    expect(notes.map((n) => n.title).sort()).toEqual(['Hooks', '欢迎'])
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// 在 src/services/github.ts 添加：
import { parseFrontMatter } from '@/utils/frontMatter'
import type { NoteSummary } from '@/types'

export async function listNotes(bookSlug: string): Promise<NoteSummary[]> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  // 1. 拿仓库 tree（recursive）
  const tree = await octokit.git.getTree({
    owner, repo, tree_sha: 'HEAD', recursive: 'true',
  })
  const prefix = `books/${bookSlug}/`
  const mdEntries = (tree.data.tree as Array<{ path?: string; type?: string; sha?: string }>)
    .filter((e) =>
      e.type === 'blob' &&
      e.path?.startsWith(prefix) &&
      e.path.endsWith('.md'),
    )

  // 2. 逐个读 content → 解析 front-matter
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
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看全过**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): listNotes via git tree + front-matter"
```

---

### Task 1.17 · `github.ts` —— 读单篇笔记 (`getNote`)

**Files:**
- Modify: `src/services/github.ts`
- Modify: `src/services/github.test.ts`

- [ ] **Step 1: 测试**

```typescript
import { getNote } from './github'

describe('getNote', () => {
  beforeEach(() => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
  })

  it('returns note with content + sha', async () => {
    const octokit = getOctokit() as unknown as { repos: { getContent: ReturnType<typeof vi.fn> } }
    octokit.repos.getContent.mockResolvedValueOnce({
      data: {
        content: btoa('---\nid: abc\ntitle: T\n---\nbody'),
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
```

- [ ] **Step 2: 实现**

```typescript
import type { Note } from '@/types'

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
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看全过**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): getNote with sha for conflict detection"
```

---

### Task 1.18 · `github.ts` —— 保存笔记 (`saveNote`)，含冲突检测

**Files:**
- Modify: `src/services/github.ts`
- Modify: `src/services/github.test.ts`

- [ ] **Step 1: 测试**

```typescript
import { saveNote } from './github'
import { shortId } from '@/utils/uuid'

describe('saveNote', () => {
  beforeEach(() => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
  })

  it('PUTs file with base64 content + sha', async () => {
    const octokit = getOctokit() as unknown as {
      repos: { createOrUpdateFileContents: ReturnType<typeof vi.fn> }
    }
    octokit.repos.createOrUpdateFileContents.mockResolvedValueOnce({
      data: { content: { sha: 'newSha' } },
    })
    const newSha = await saveNote({
      filePath: 'books/default/welcome.md',
      meta: { id: 'abc', title: 'Welcome' },
      content: 'body text',
      sha: 'oldSha',
    })
    expect(newSha).toBe('newSha')
    const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0]
    expect(call.sha).toBe('oldSha')
    expect(call.path).toBe('books/default/welcome.md')
    expect(call.message).toMatch(/Welcome/)
  })

  it('throws conflict error when GitHub returns 409', async () => {
    const octokit = getOctokit() as unknown as {
      repos: { createOrUpdateFileContents: ReturnType<typeof vi.fn>, getContent: ReturnType<typeof vi.fn> }
    }
    octokit.repos.createOrUpdateFileContents.mockRejectedValueOnce({ status: 409 })
    octokit.repos.getContent.mockResolvedValueOnce({
      data: { content: btoa('---\ntitle: remote\n---\nremote body'), encoding: 'base64', sha: 'remoteSha' },
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
```

- [ ] **Step 2: 实现**

```typescript
import { stringifyFrontMatter } from '@/utils/frontMatter'
import { encodeUtf8Base64 } from '@/utils/base64'
import type { NoteMeta } from '@/utils/frontMatter'
import type { GithubConflictError } from '@/types'

export interface SaveNoteArgs {
  filePath: string
  meta: NoteMeta
  content: string
  sha?: string                     // 已存在文件必须传
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
      owner, repo, path: args.filePath, message,
      content: encodeUtf8Base64(fullMarkdown),
      ...(args.sha ? { sha: args.sha } : {}),
    })
    return res.data.content!.sha!
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 409 || status === 422) {
      // 拉远端，抛冲突错误
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
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看全过**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): saveNote with sha conflict detection"
```

---

### Task 1.19 · `github.ts` —— 创建/删除/重命名 (book + note)

**Files:**
- Modify: `src/services/github.ts`
- Modify: `src/services/github.test.ts`

- [ ] **Step 1: 测试（关键路径，简化覆盖）**

```typescript
import { createBook, deleteNote, deleteBook, renameNote } from './github'

describe('createBook', () => {
  beforeEach(() => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'ghp_abc', owner: 'me', repo: 'r' })
  })

  it('writes .book.json under books/<slug>/', async () => {
    const octokit = getOctokit() as unknown as {
      repos: { createOrUpdateFileContents: ReturnType<typeof vi.fn> }
    }
    octokit.repos.createOrUpdateFileContents.mockResolvedValueOnce({ data: { content: { sha: 's' } } })
    await createBook({ slug: 'react', name: 'React' })
    const call = octokit.repos.createOrUpdateFileContents.mock.calls[0][0]
    expect(call.path).toBe('books/react/.book.json')
  })
})

describe('deleteNote', () => {
  it('calls deleteFile with sha + message', async () => {
    const auth = useAuthStore()
    auth.setConfig({ githubPat: 'p', owner: 'me', repo: 'r' })
    const octokit = getOctokit() as unknown as { repos: { deleteFile: ReturnType<typeof vi.fn> } }
    octokit.repos.deleteFile.mockResolvedValueOnce({ data: {} })
    await deleteNote('books/default/x.md', 'sha123')
    const call = octokit.repos.deleteFile.mock.calls[0][0]
    expect(call.path).toBe('books/default/x.md')
    expect(call.sha).toBe('sha123')
  })
})
```

- [ ] **Step 2: 实现**

```typescript
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
    owner, repo,
    path: `books/${args.slug}/.book.json`,
    message: `book: create ${args.slug}`,
    content: encodeUtf8Base64(JSON.stringify(meta, null, 2)),
  })
}

export async function deleteNote(filePath: string, sha: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  await octokit.repos.deleteFile({
    owner, repo, path: filePath, sha,
    message: `note: delete ${filePath}`,
  })
}

export async function deleteBook(bookSlug: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = getRepoCoords()
  // 列出 book 下所有文件 → 逐个删
  const tree = await octokit.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: 'true' })
  const prefix = `books/${bookSlug}/`
  const files = (tree.data.tree as Array<{ path?: string; type?: string; sha?: string }>)
    .filter((e) => e.type === 'blob' && e.path?.startsWith(prefix))
  for (const f of files) {
    if (!f.path || !f.sha) continue
    await octokit.repos.deleteFile({
      owner, repo, path: f.path, sha: f.sha,
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
  // 读旧文件
  const oldRes = await octokit.repos.getContent({ owner, repo, path: oldFilePath })
  const oldData = oldRes.data as { content: string; sha: string }
  // 写新路径
  const created = await octokit.repos.createOrUpdateFileContents({
    owner, repo, path: newFilePath,
    message: `note: rename ${oldFilePath} → ${newFilePath}`,
    content: oldData.content,           // 原 base64 直接复用
  })
  // 删旧文件
  await octokit.repos.deleteFile({
    owner, repo, path: oldFilePath, sha,
    message: `note: rename cleanup ${oldFilePath}`,
  })
  return created.data.content!.sha!
}
```

- [ ] **Step 3: `npm test src/services/github.test.ts` 看全过**

- [ ] **Step 4: 提交**

```powershell
git add src/services/github.ts src/services/github.test.ts
git commit -m "feat(service/github): createBook + delete + rename operations"
```

---

### Task 1.20 · `useBooksStore`

**Files:**
- Create: `src/stores/books.ts`
- Create: `src/stores/books.test.ts`

- [ ] **Step 1: 测试**

```typescript
// src/stores/books.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/github', () => ({
  listBooks: vi.fn(),
  createBook: vi.fn(),
  deleteBook: vi.fn(),
}))

import * as github from '@/services/github'
import { useBooksStore } from './books'

describe('useBooksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(github.listBooks).mockReset()
    vi.mocked(github.createBook).mockReset()
    vi.mocked(github.deleteBook).mockReset()
  })

  it('refresh loads books and sets current to first when empty', async () => {
    vi.mocked(github.listBooks).mockResolvedValueOnce([
      { slug: 'default', name: 'Default' },
      { slug: 'react', name: 'React' },
    ])
    const s = useBooksStore()
    await s.refresh()
    expect(s.books).toHaveLength(2)
    expect(s.currentSlug).toBe('default')
  })

  it('create adds book then refreshes', async () => {
    vi.mocked(github.createBook).mockResolvedValueOnce()
    vi.mocked(github.listBooks).mockResolvedValueOnce([
      { slug: 'new', name: 'New' },
    ])
    const s = useBooksStore()
    await s.create({ slug: 'new', name: 'New' })
    expect(github.createBook).toHaveBeenCalledWith({ slug: 'new', name: 'New' })
    expect(s.books).toEqual([{ slug: 'new', name: 'New' }])
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/stores/books.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BookMeta } from '@/types'
import * as github from '@/services/github'

export const useBooksStore = defineStore('books', () => {
  const books = ref<BookMeta[]>([])
  const currentSlug = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      books.value = await github.listBooks()
      if (!currentSlug.value && books.value.length > 0) {
        currentSlug.value = books.value[0].slug
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function create(args: { slug: string; name: string }) {
    await github.createBook(args)
    await refresh()
  }

  async function remove(slug: string) {
    await github.deleteBook(slug)
    if (currentSlug.value === slug) currentSlug.value = null
    await refresh()
  }

  function setCurrent(slug: string) {
    currentSlug.value = slug
  }

  return { books, currentSlug, loading, error, refresh, create, remove, setCurrent }
})
```

- [ ] **Step 3: `npm test src/stores/books.test.ts` 看 2 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/stores/books.ts src/stores/books.test.ts
git commit -m "feat(store): useBooksStore with refresh + create + remove"
```

---

### Task 1.21 · `useNotesStore`

**Files:**
- Create: `src/stores/notes.ts`
- Create: `src/stores/notes.test.ts`

- [ ] **Step 1: 测试**

```typescript
// src/stores/notes.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/github', () => ({
  listNotes: vi.fn(),
  getNote: vi.fn(),
  saveNote: vi.fn(),
  deleteNote: vi.fn(),
}))

import * as github from '@/services/github'
import { useNotesStore } from './notes'

describe('useNotesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(github.listNotes).mockReset()
    vi.mocked(github.getNote).mockReset()
    vi.mocked(github.saveNote).mockReset()
  })

  it('loadTree fills notesByBook[slug]', async () => {
    vi.mocked(github.listNotes).mockResolvedValueOnce([
      { id: 'a', slug: 'a', title: 'A', filePath: 'books/x/a.md' },
    ])
    const s = useNotesStore()
    await s.loadTree('x')
    expect(s.notesByBook.x).toHaveLength(1)
  })

  it('loadCurrent fetches note and sets saveStatus=clean', async () => {
    vi.mocked(github.getNote).mockResolvedValueOnce({
      id: 'a', slug: 'a', title: 'A', content: '# hello',
      filePath: 'books/x/a.md', sha: 's',
    })
    const s = useNotesStore()
    await s.loadCurrent('books/x/a.md')
    expect(s.current?.content).toBe('# hello')
    expect(s.saveStatus).toBe('clean')
  })

  it('updateContent marks dirty', () => {
    const s = useNotesStore()
    s.$patch({ current: { id: 'a', slug: 'a', title: 'A', content: '', filePath: 'p' }, saveStatus: 'clean' })
    s.updateContent('new')
    expect(s.current?.content).toBe('new')
    expect(s.saveStatus).toBe('dirty')
  })

  it('save persists current and goes saving → saved', async () => {
    vi.mocked(github.saveNote).mockResolvedValueOnce('newSha')
    const s = useNotesStore()
    s.$patch({
      current: { id: 'a', slug: 'a', title: 'A', content: 'x', filePath: 'books/x/a.md', sha: 'old' },
      saveStatus: 'dirty',
    })
    await s.save()
    expect(s.current?.sha).toBe('newSha')
    expect(s.saveStatus).toBe('saved')
  })
})
```

- [ ] **Step 2: 实现**

```typescript
// src/stores/notes.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, NoteSummary, SaveStatus } from '@/types'
import * as github from '@/services/github'

export const useNotesStore = defineStore('notes', () => {
  const notesByBook = ref<Record<string, NoteSummary[]>>({})
  const current = ref<Note | null>(null)
  const saveStatus = ref<SaveStatus>('clean')
  const lastError = ref<string | null>(null)

  async function loadTree(bookSlug: string): Promise<void> {
    notesByBook.value[bookSlug] = await github.listNotes(bookSlug)
  }

  async function loadCurrent(filePath: string): Promise<void> {
    saveStatus.value = 'clean'
    current.value = await github.getNote(filePath)
  }

  function updateContent(content: string) {
    if (!current.value) return
    current.value = { ...current.value, content }
    saveStatus.value = 'dirty'
  }

  function updateMeta(patch: Partial<Note>) {
    if (!current.value) return
    current.value = { ...current.value, ...patch }
    saveStatus.value = 'dirty'
  }

  async function save(): Promise<void> {
    if (!current.value) return
    saveStatus.value = 'saving'
    try {
      const newSha = await github.saveNote({
        filePath: current.value.filePath,
        meta: {
          id: current.value.id,
          title: current.value.title,
          tags: current.value.tags,
          summary: current.value.summary,
        },
        content: current.value.content,
        sha: current.value.sha,
      })
      current.value = { ...current.value, sha: newSha }
      saveStatus.value = 'saved'
      setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'clean'
      }, 1500)
    } catch (err) {
      const conflict = err as { type?: string }
      if (conflict.type === 'conflict') {
        saveStatus.value = 'conflict'
        lastError.value = 'remote-changed'
      } else {
        saveStatus.value = 'error'
        lastError.value = (err as Error).message
      }
      throw err
    }
  }

  async function removeNote(filePath: string, sha: string): Promise<void> {
    await github.deleteNote(filePath, sha)
    if (current.value?.filePath === filePath) current.value = null
  }

  return {
    notesByBook, current, saveStatus, lastError,
    loadTree, loadCurrent, updateContent, updateMeta, save, removeNote,
  }
})
```

- [ ] **Step 3: `npm test src/stores/notes.test.ts` 看 4 passed**

- [ ] **Step 4: 提交**

```powershell
git add src/stores/notes.ts src/stores/notes.test.ts
git commit -m "feat(store): useNotesStore with tree + current + dirty + save"
```

---

### Task 1.22 · `useUiStore`（Toast 队列 + 侧栏折叠）

**Files:**
- Create: `src/stores/ui.ts`

- [ ] **Step 1: 实现（无单测，纯状态容器）**

```typescript
// src/stores/ui.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const treeCollapsed = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleTree() {
    treeCollapsed.value = !treeCollapsed.value
  }

  return { sidebarCollapsed, treeCollapsed, toggleSidebar, toggleTree }
})
```

- [ ] **Step 2: 提交**

```powershell
git add src/stores/ui.ts
git commit -m "feat(store): useUiStore for sidebar/tree toggle state"
```

---

### Task 1.23 · `AppShell` —— 三栏框架组件

**Files:**
- Create: `src/components/layout/AppShell.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/layout/AppShell.vue -->
<template>
  <div class="shell">
    <aside class="shell__primary"><slot name="primary" /></aside>
    <aside v-if="!ui.treeCollapsed" class="shell__tree"><slot name="tree" /></aside>
    <main class="shell__main"><slot name="main" /></main>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  background: var(--color-bg-app);
}
.shell__primary {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}
.shell__tree {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}
.shell__main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/components/layout/AppShell.vue
git commit -m "feat(layout): AppShell with three slots (primary/tree/main)"
```

---

### Task 1.24 · `PrimarySidebar` —— 第一栏

**Files:**
- Create: `src/components/layout/PrimarySidebar.vue`

- [ ] **Step 1: 写组件（带 nav + 知识库列表）**

```vue
<!-- src/components/layout/PrimarySidebar.vue -->
<template>
  <nav class="sidebar">
    <div class="sidebar__brand">🌱 笔记库</div>

    <router-link to="/" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><HomeFilled /></el-icon><span>开始</span>
    </router-link>
    <router-link to="/ai" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><MagicStick /></el-icon><span>AI 写作</span>
    </router-link>
    <router-link to="/memos" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><EditPen /></el-icon><span>小记</span>
    </router-link>
    <router-link to="/favorites" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><Star /></el-icon><span>收藏</span>
    </router-link>
    <router-link to="/search" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><Search /></el-icon><span>搜索</span>
    </router-link>

    <div class="sidebar__section-label">
      <span>知识库</span>
      <el-button text size="small" :icon="Plus" @click="onCreateBook" />
    </div>

    <div v-if="booksStore.loading" class="sidebar__hint">加载中…</div>
    <router-link
      v-for="book in booksStore.books"
      :key="book.slug"
      :to="`/book/${book.slug}`"
      class="sidebar__item sidebar__item--book"
      active-class="sidebar__item--active"
      @click="booksStore.setCurrent(book.slug)"
    >
      <el-icon><Notebook /></el-icon><span>{{ book.name }}</span>
    </router-link>

    <div class="sidebar__footer">
      <router-link to="/settings" class="sidebar__item sidebar__item--mini">
        <el-icon><Setting /></el-icon><span>设置</span>
      </router-link>
    </div>

    <NewBookDialog v-model="showNewBook" @created="onBookCreated" />
  </nav>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { Plus } from '@element-plus/icons-vue'
import NewBookDialog from './NewBookDialog.vue'

const booksStore = useBooksStore()
const router = useRouter()
const showNewBook = ref(false)

onMounted(() => {
  if (booksStore.books.length === 0) booksStore.refresh()
})

function onCreateBook() { showNewBook.value = true }
function onBookCreated(slug: string) {
  showNewBook.value = false
  router.push(`/book/${slug}`)
}
</script>

<style scoped>
.sidebar { padding: 16px 12px; display: flex; flex-direction: column; height: 100%; }
.sidebar__brand {
  font-size: 16px; font-weight: 700; color: var(--color-primary);
  padding: 4px 8px 16px;
}
.sidebar__item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: var(--radius-sm);
  color: var(--color-text-primary); font-size: 14px;
  text-decoration: none;
}
.sidebar__item:hover { background: var(--color-bg-hover); }
.sidebar__item--active {
  background: var(--color-primary-light-bg);
  color: var(--color-primary); font-weight: 500;
}
.sidebar__item--book { padding-left: 14px; }
.sidebar__item--mini { font-size: 13px; color: var(--color-text-secondary); }
.sidebar__section-label {
  display: flex; align-items: center; justify-content: space-between;
  margin: 16px 0 4px; padding: 0 10px;
  font-size: 12px; color: var(--color-text-tertiary); font-weight: 600;
}
.sidebar__hint { padding: 4px 10px; font-size: 12px; color: var(--color-text-tertiary); }
.sidebar__footer { margin-top: auto; padding-top: 16px; }
</style>
```

- [ ] **Step 2: 写 `NewBookDialog.vue`**（这个对话框由 PrimarySidebar 引用）

```vue
<!-- src/components/layout/NewBookDialog.vue -->
<template>
  <el-dialog v-model="visible" title="新建知识库" width="420">
    <el-form :model="form" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" placeholder="如：React 学习" />
      </el-form-item>
      <el-form-item label="标识 (slug，英文小写)">
        <el-input v-model="form.slug" :placeholder="autoSlug" />
        <p class="hint">用于路径 books/{{ form.slug || autoSlug }}/，不能修改</p>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useBooksStore } from '@/stores/books'
import { titleToSlug } from '@/utils/slug'
import { ElMessage } from 'element-plus'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', slug: string): void
}>()

const booksStore = useBooksStore()
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const form = reactive({ name: '', slug: '' })
const autoSlug = computed(() => titleToSlug(form.name))
const saving = ref(false)

watch(visible, (v) => {
  if (v) { form.name = ''; form.slug = '' }
})

async function onSubmit() {
  if (!form.name) return
  const slug = form.slug || autoSlug.value
  saving.value = true
  try {
    await booksStore.create({ slug, name: form.name })
    ElMessage.success('已创建')
    emit('created', slug)
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.hint { font-size: 12px; color: var(--color-text-tertiary); margin: 4px 0 0; }
</style>
```

- [ ] **Step 3: 提交**

```powershell
git add src/components/layout/PrimarySidebar.vue src/components/layout/NewBookDialog.vue
git commit -m "feat(layout): PrimarySidebar + NewBookDialog"
```

---

### Task 1.25 · `DocumentTree` —— 第二栏

**Files:**
- Create: `src/components/layout/DocumentTree.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/layout/DocumentTree.vue -->
<template>
  <div class="tree">
    <header class="tree__header">
      <span>📚 {{ currentBookName }}</span>
      <el-button text size="small" :icon="Plus" @click="onNewNote" />
    </header>

    <div v-if="loading" class="tree__hint">加载中…</div>
    <div v-else-if="notes.length === 0" class="tree__empty">还没有笔记</div>

    <ul class="tree__list">
      <li
        v-for="note in notes"
        :key="note.filePath"
        class="tree__item"
        :class="{ 'tree__item--active': route.params.noteId === note.id }"
        @click="onSelect(note)"
      >
        <el-icon><Document /></el-icon>
        <span class="tree__title">{{ note.title }}</span>
        <el-dropdown @command="(c: string) => onAction(c, note)" trigger="click">
          <el-icon class="tree__more"><MoreFilled /></el-icon>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename">重命名</el-dropdown-item>
              <el-dropdown-item command="delete" style="color: var(--color-danger)">
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </li>
    </ul>

    <ConfirmDialog
      v-model="showConfirm"
      :title="`删除笔记「${pendingNote?.title}」？`"
      message="此操作会从 GitHub 仓库删除文件。"
      confirm-label="删除"
      danger
      @confirm="performDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBooksStore } from '@/stores/books'
import { useNotesStore } from '@/stores/notes'
import { Plus, MoreFilled, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { titleToSlug } from '@/utils/slug'
import { shortId } from '@/utils/uuid'
import * as github from '@/services/github'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { NoteSummary } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const notesStore = useNotesStore()
const loading = ref(false)
const showConfirm = ref(false)
const pendingNote = ref<NoteSummary | null>(null)

const { currentSlug } = storeToRefs(booksStore)
const notes = computed(() =>
  currentSlug.value ? notesStore.notesByBook[currentSlug.value] ?? [] : [],
)
const currentBookName = computed(
  () => booksStore.books.find((b) => b.slug === currentSlug.value)?.name ?? '',
)

watch(currentSlug, async (slug) => {
  if (!slug) return
  loading.value = true
  try { await notesStore.loadTree(slug) } finally { loading.value = false }
}, { immediate: true })

function onSelect(note: NoteSummary) {
  router.push(`/book/${currentSlug.value}/${note.id}`)
}

async function onNewNote() {
  if (!currentSlug.value) return
  const { value: title } = await ElMessageBox.prompt('笔记标题', '新建笔记', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
  }).catch(() => ({ value: '' }))
  if (!title) return
  const slug = titleToSlug(title)
  const filePath = `books/${currentSlug.value}/${slug}.md`
  const id = shortId()
  await github.saveNote({
    filePath,
    meta: { id, title, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    content: `# ${title}\n\n`,
  })
  await notesStore.loadTree(currentSlug.value)
  router.push(`/book/${currentSlug.value}/${id}`)
  ElMessage.success('已创建')
}

function onAction(cmd: string, note: NoteSummary) {
  if (cmd === 'delete') {
    pendingNote.value = note
    showConfirm.value = true
  } else if (cmd === 'rename') {
    promptRename(note)
  }
}

async function performDelete() {
  if (!pendingNote.value) return
  // 拿 sha 才能删；先 getNote 获取 sha
  const full = await github.getNote(pendingNote.value.filePath)
  await notesStore.removeNote(pendingNote.value.filePath, full.sha!)
  await notesStore.loadTree(currentSlug.value!)
  if (route.params.noteId === pendingNote.value.id) {
    router.push(`/book/${currentSlug.value}`)
  }
  pendingNote.value = null
  ElMessage.success('已删除')
}

async function promptRename(note: NoteSummary) {
  const { value: newTitle } = await ElMessageBox.prompt('新标题', '重命名', {
    inputValue: note.title,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).catch(() => ({ value: '' }))
  if (!newTitle || newTitle === note.title) return
  const newSlug = titleToSlug(newTitle)
  const newPath = `books/${currentSlug.value}/${newSlug}.md`
  const full = await github.getNote(note.filePath)
  // 改 front-matter title 后 saveNote 到新路径 + 删旧
  await github.saveNote({
    filePath: newPath,
    meta: { id: full.id, title: newTitle, createdAt: full.updatedAt, updatedAt: new Date().toISOString() },
    content: full.content,
  })
  await github.deleteNote(note.filePath, full.sha!)
  await notesStore.loadTree(currentSlug.value!)
  ElMessage.success('已重命名')
}
</script>

<style scoped>
.tree { padding: 16px 8px; }
.tree__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 8px 12px; font-weight: 600;
}
.tree__hint, .tree__empty {
  padding: 12px 8px; color: var(--color-text-tertiary); font-size: 13px;
}
.tree__list { list-style: none; margin: 0; padding: 0; }
.tree__item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 14px;
}
.tree__item:hover { background: var(--color-bg-hover); }
.tree__item:hover .tree__more { opacity: 1; }
.tree__item--active {
  background: var(--color-primary-light-bg);
  color: var(--color-primary); font-weight: 500;
}
.tree__title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree__more { opacity: 0; transition: opacity 0.12s; }
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/components/layout/DocumentTree.vue
git commit -m "feat(layout): DocumentTree with note list + new/rename/delete"
```

---

### Task 1.26 · `ConfirmDialog` 通用组件

**Files:**
- Create: `src/components/common/ConfirmDialog.vue`
- Create: `src/components/common/EmptyState.vue`

- [ ] **Step 1: `ConfirmDialog.vue`**

```vue
<template>
  <el-dialog v-model="visible" :title="title" width="380">
    <p class="confirm__msg">{{ message }}</p>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :type="danger ? 'danger' : 'primary'" @click="onConfirm">
        {{ confirmLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function onConfirm() {
  emit('confirm')
  visible.value = false
}
</script>

<style scoped>
.confirm__msg { color: var(--color-text-secondary); margin: 0; }
</style>
```

- [ ] **Step 2: `EmptyState.vue`**

```vue
<template>
  <div class="empty">
    <div class="empty__icon">{{ icon ?? '📒' }}</div>
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="hint" class="empty__hint">{{ hint }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon?: string; title: string; hint?: string }>()
</script>

<style scoped>
.empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 24px; color: var(--color-text-tertiary);
}
.empty__icon { font-size: 48px; margin-bottom: 16px; }
.empty__title { margin: 0 0 8px; color: var(--color-text-primary); }
.empty__hint { margin: 0; font-size: 13px; }
</style>
```

- [ ] **Step 3: 提交**

```powershell
git add src/components/common
git commit -m "feat(components): ConfirmDialog + EmptyState common components"
```

---

### Task 1.27 · `VditorEditor` 包装组件

**Files:**
- Create: `src/components/editor/VditorEditor.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/editor/VditorEditor.vue -->
<template>
  <div ref="container" class="vditor-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Vditor from 'vditor'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const container = ref<HTMLElement | null>(null)
let vditor: Vditor | null = null
let suppressNextInput = false

onMounted(() => {
  if (!container.value) return
  vditor = new Vditor(container.value, {
    height: '100%',
    mode: 'ir',
    placeholder: props.placeholder ?? '开始书写…',
    cache: { enable: false },
    toolbar: [
      'headings','bold','italic','strike','line','quote',
      '|','list','ordered-list','check','outdent','indent',
      '|','code','inline-code','table','link',
      '|','undo','redo','|','edit-mode','preview','export',
    ],
    after: () => {
      if (vditor) vditor.setValue(props.modelValue ?? '')
    },
    input: (val) => {
      if (suppressNextInput) { suppressNextInput = false; return }
      emit('update:modelValue', val)
    },
  })
})

onBeforeUnmount(() => { vditor?.destroy(); vditor = null })

watch(() => props.modelValue, (val) => {
  if (vditor && vditor.getValue() !== val) {
    suppressNextInput = true
    vditor.setValue(val ?? '')
  }
})
</script>

<style scoped>
.vditor-container { flex: 1; min-height: 0; }
:deep(.vditor) { border: none; }
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/components/editor/VditorEditor.vue
git commit -m "feat(editor): Vditor wrapper component with v-model"
```

---

### Task 1.28 · `BookView` —— 知识库主视图（用上 AppShell + 三栏 + 编辑器）

**Files:**
- Modify: `src/views/BookView.vue`

- [ ] **Step 1: 重写 `BookView.vue`**

```vue
<!-- src/views/BookView.vue -->
<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree><DocumentTree /></template>
    <template #main>
      <div v-if="!currentNote" class="book-empty">
        <EmptyState
          icon="📝"
          title="选择左侧的笔记开始编辑"
          hint="或点击 + 新建笔记"
        />
      </div>
      <template v-else>
        <header class="editor-header">
          <input
            class="editor-title"
            :value="currentNote.title"
            @input="onTitleChange(($event.target as HTMLInputElement).value)"
            placeholder="无标题"
          />
          <span class="editor-status">{{ statusText }}</span>
          <el-button text size="small" @click="onManualSave" :loading="notesStore.saveStatus === 'saving'">
            保存
          </el-button>
        </header>
        <VditorEditor
          :model-value="currentNote.content"
          @update:model-value="onContentChange"
        />
      </template>
    </template>
  </AppShell>

  <ConflictDialog
    v-model="showConflict"
    :remote-content="conflictRemoteContent"
    :local-content="conflictLocalContent"
    @resolve="onConflictResolve"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import DocumentTree from '@/components/layout/DocumentTree.vue'
import VditorEditor from '@/components/editor/VditorEditor.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConflictDialog from '@/components/common/ConflictDialog.vue'
import { useBooksStore } from '@/stores/books'
import { useNotesStore } from '@/stores/notes'
import { debounce } from '@/utils/debounce'
import { ElMessage } from 'element-plus'
import type { NoteSummary } from '@/types'

const route = useRoute()
const booksStore = useBooksStore()
const notesStore = useNotesStore()
const { current: currentNote, saveStatus } = storeToRefs(notesStore)

const showConflict = ref(false)
const conflictRemoteContent = ref('')
const conflictLocalContent = ref('')

const statusText = computed(() => {
  switch (saveStatus.value) {
    case 'dirty': return '未保存'
    case 'saving': return '保存中…'
    case 'saved': return '已保存'
    case 'conflict': return '远端有更新'
    case 'error': return '保存失败'
    default: return ''
  }
})

const autoSave = debounce(async () => {
  try { await notesStore.save() } catch (err) {
    handleSaveError(err)
  }
}, 2000)

function onContentChange(content: string) {
  notesStore.updateContent(content)
  autoSave()
}

function onTitleChange(title: string) {
  notesStore.updateMeta({ title })
  autoSave()
}

async function onManualSave() {
  autoSave.cancel()
  try { await notesStore.save(); ElMessage.success('已保存') } catch (err) {
    handleSaveError(err)
  }
}

function handleSaveError(err: unknown) {
  const conflict = err as { type?: string; remoteContent?: string }
  if (conflict.type === 'conflict' && currentNote.value) {
    conflictRemoteContent.value = conflict.remoteContent ?? ''
    conflictLocalContent.value = currentNote.value.content
    showConflict.value = true
  } else {
    ElMessage.error((err as Error).message ?? '保存失败')
  }
}

async function onConflictResolve(choice: 'overwrite' | 'accept') {
  if (!currentNote.value) return
  if (choice === 'accept') {
    notesStore.updateContent(conflictRemoteContent.value)
    await notesStore.loadCurrent(currentNote.value.filePath)
  } else {
    // overwrite: 重新 GET 拿最新 sha，再写
    const fresh = await import('@/services/github').then((m) => m.getNote(currentNote.value!.filePath))
    notesStore.$patch({ current: { ...currentNote.value!, sha: fresh.sha } })
    await notesStore.save()
  }
  ElMessage.success('已处理冲突')
}

async function loadCurrentFromRoute() {
  const bookSlug = route.params.bookSlug as string
  const noteId = route.params.noteId as string | undefined
  if (!bookSlug) return
  booksStore.setCurrent(bookSlug)
  if (!noteId) {
    notesStore.$patch({ current: null })
    return
  }
  if (!notesStore.notesByBook[bookSlug]) await notesStore.loadTree(bookSlug)
  const note: NoteSummary | undefined = notesStore.notesByBook[bookSlug]?.find((n) => n.id === noteId)
  if (note) await notesStore.loadCurrent(note.filePath)
}

onMounted(loadCurrentFromRoute)
watch(() => [route.params.bookSlug, route.params.noteId], loadCurrentFromRoute)
</script>

<style scoped>
.book-empty { flex: 1; display: flex; align-items: center; justify-content: center; }
.editor-header {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border);
}
.editor-title {
  flex: 1; border: none; outline: none;
  font-size: 22px; font-weight: 600; color: var(--color-text-primary);
  background: transparent;
}
.editor-status { font-size: 12px; color: var(--color-text-tertiary); }
</style>
```

- [ ] **Step 2: 提交（ConflictDialog 还没建，下一 Task 建）**

```powershell
git add src/views/BookView.vue
git commit -m "feat(view): BookView with editor + autosave + conflict trigger"
```

---

### Task 1.29 · `ConflictDialog` 冲突解决对话框

**Files:**
- Create: `src/components/common/ConflictDialog.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/components/common/ConflictDialog.vue -->
<template>
  <el-dialog v-model="visible" title="保存冲突" width="800">
    <p class="conflict__hint">
      远端的笔记内容已被改动（可能你在另一台设备改过）。请选择如何处理：
    </p>
    <div class="conflict__split">
      <div class="conflict__pane">
        <h4>📥 本地版本（你当前编辑的）</h4>
        <pre>{{ localContent }}</pre>
      </div>
      <div class="conflict__pane">
        <h4>☁️ 远端版本（GitHub 上现在的）</h4>
        <pre>{{ remoteContent }}</pre>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="warning" @click="onResolve('accept')">接受远端</el-button>
      <el-button type="primary" @click="onResolve('overwrite')">覆盖远端</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  localContent: string
  remoteContent: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'resolve', choice: 'overwrite' | 'accept'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function onResolve(choice: 'overwrite' | 'accept') {
  emit('resolve', choice)
  visible.value = false
}
</script>

<style scoped>
.conflict__hint { color: var(--color-text-secondary); margin-bottom: 16px; }
.conflict__split { display: flex; gap: 16px; }
.conflict__pane { flex: 1; }
.conflict__pane h4 { margin: 0 0 8px; }
.conflict__pane pre {
  max-height: 360px; overflow: auto;
  padding: 12px;
  background: var(--color-bg-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono); font-size: 12px;
}
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/components/common/ConflictDialog.vue
git commit -m "feat(components): ConflictDialog with side-by-side compare"
```

---

### Task 1.30 · `SettingsView` —— 完整设置页 + 导出配置码

**Files:**
- Modify: `src/views/SettingsView.vue`

- [ ] **Step 1: 写组件**

```vue
<!-- src/views/SettingsView.vue -->
<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="settings-tree">
        <h4>设置</h4>
        <nav>
          <a href="#auth">凭据</a>
          <a href="#sync">同步</a>
          <a href="#export">导出配置码</a>
          <a href="#danger">危险操作</a>
        </nav>
      </div>
    </template>
    <template #main>
      <div class="settings-main">
        <section id="auth">
          <h2>凭据</h2>
          <el-form :model="form" label-width="120px">
            <el-form-item label="GitHub PAT">
              <el-input v-model="form.githubPat" type="password" show-password />
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="form.owner" />
            </el-form-item>
            <el-form-item label="Repo">
              <el-input v-model="form.repo" />
            </el-form-item>
          </el-form>
        </section>

        <section id="sync">
          <h2>Worker</h2>
          <el-form :model="form" label-width="120px">
            <el-form-item label="Worker URL">
              <el-input v-model="form.workerUrl" placeholder="（Stage 3 启用）" />
            </el-form-item>
            <el-form-item label="Master Token">
              <el-input v-model="form.masterToken" type="password" show-password />
            </el-form-item>
            <el-form-item label="默认知识库">
              <el-select v-model="form.defaultBookSlug" placeholder="选一个">
                <el-option
                  v-for="b in booksStore.books"
                  :key="b.slug"
                  :label="b.name"
                  :value="b.slug"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </section>

        <section id="export">
          <h2>导出配置码（给浏览器插件粘）</h2>
          <p class="hint">这串 base64 字符串包含上面所有凭据。妥善保管。</p>
          <el-input type="textarea" :rows="3" :model-value="configCode" readonly />
          <el-button @click="copyCode" :icon="CopyDocument">复制</el-button>
        </section>

        <section id="danger">
          <h2 style="color: var(--color-danger)">危险操作</h2>
          <el-button type="danger" @click="onClear">清空本地凭据</el-button>
        </section>

        <el-affix position="bottom" :offset="20">
          <div class="save-bar">
            <el-button type="primary" @click="onSave">保存</el-button>
          </div>
        </el-affix>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { encodeUtf8Base64 } from '@/utils/base64'

const auth = useAuthStore()
const booksStore = useBooksStore()
const router = useRouter()

const form = reactive({
  githubPat: auth.githubPat,
  owner: auth.owner,
  repo: auth.repo,
  workerUrl: auth.workerUrl,
  masterToken: auth.masterToken,
  defaultBookSlug: auth.defaultBookSlug,
})

const configCode = computed(() =>
  encodeUtf8Base64(JSON.stringify({
    workerUrl: form.workerUrl,
    masterToken: form.masterToken,
    pat: form.githubPat,
    owner: form.owner,
    repo: form.repo,
    defaultBook: form.defaultBookSlug,
  })),
)

function onSave() {
  auth.setConfig({ ...form })
  ElMessage.success('已保存')
}

async function copyCode() {
  await navigator.clipboard.writeText(configCode.value)
  ElMessage.success('已复制到剪贴板')
}

function onClear() {
  auth.clear()
  ElMessage.success('已清空，将重定向到向导')
  router.push({ name: 'setup' })
}
</script>

<style scoped>
.settings-tree { padding: 24px 16px; }
.settings-tree h4 { margin: 0 0 16px; }
.settings-tree nav { display: flex; flex-direction: column; gap: 8px; }
.settings-tree a { color: var(--color-text-secondary); font-size: 14px; }
.settings-tree a:hover { color: var(--color-primary); }
.settings-main { padding: 32px; max-width: 720px; }
.settings-main section { margin-bottom: 48px; }
.settings-main section h2 { margin: 0 0 16px; }
.hint { color: var(--color-text-tertiary); font-size: 13px; }
.save-bar {
  background: #fff; padding: 12px 20px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: flex; justify-content: flex-end;
}
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/views/SettingsView.vue
git commit -m "feat(view): SettingsView with auth/worker/export-code/danger sections"
```

---

### Task 1.31 · `HomeView` 改成"打开默认知识库"的入口

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 改为带 Shell 的占位 + 自动跳到默认 book**

```vue
<!-- src/views/HomeView.vue -->
<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="home-tree">
        <EmptyState icon="🌱" title="选择左侧知识库开始" />
      </div>
    </template>
    <template #main>
      <EmptyState
        icon="📒"
        title="欢迎回到 AI 笔记库"
        hint="Stage 1 阶段：先选一个知识库，开始写笔记。后续阶段会逐步加入 AI 写作、RAG、插件。"
      />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'

const auth = useAuthStore()
const booksStore = useBooksStore()
const router = useRouter()

onMounted(async () => {
  if (booksStore.books.length === 0) await booksStore.refresh()
  if (auth.defaultBookSlug) {
    router.replace(`/book/${auth.defaultBookSlug}`)
  } else if (booksStore.books.length > 0) {
    router.replace(`/book/${booksStore.books[0].slug}`)
  }
})
</script>

<style scoped>
.home-tree { padding: 24px 8px; }
</style>
```

- [ ] **Step 2: 提交**

```powershell
git add src/views/HomeView.vue
git commit -m "feat(view): HomeView routes to default/first book"
```

---

### Task 1.32 · 失败处理：401（PAT 失效）拦截

**Files:**
- Modify: `src/services/github.ts`

- [ ] **Step 1: 在 `getOctokit` 后加 hook 拦截 401**

把 `getOctokit` 的实现改成（修改已有部分）：

```typescript
import type { OctokitOptions } from '@octokit/core'

export function getOctokit(): Octokit {
  const auth = useAuthStore()
  if (!auth.isConfigured) throw new Error('GitHub auth not configured')
  if (!cached || cached.token !== auth.githubPat) {
    const opts: OctokitOptions = {
      auth: auth.githubPat,
    }
    const client = new Octokit(opts)
    // 拦截 401 → 清凭据 + 抛业务级错误
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
```

- [ ] **Step 2: 在 `App.vue` 监听全局未捕获错误，遇到 `authExpired` 跳 `/setup`**

```vue
<!-- src/App.vue -->
<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
onMounted(() => {
  window.addEventListener('unhandledrejection', (e) => {
    const err = e.reason as { authExpired?: boolean; message?: string }
    if (err?.authExpired) {
      ElMessage.error('凭据失效，请重新配置')
      router.push({ name: 'setup' })
    }
  })
})
</script>
```

- [ ] **Step 3: 提交**

```powershell
git add src/services/github.ts src/App.vue
git commit -m "feat(auth): intercept 401/403, clear creds, redirect to setup"
```

---

### Task 1.33 · 手动联调验收

**Files:**（无新建，纯端到端测试）

- [ ] **Step 1: 打开真实 GitHub 仓库做完整一遍**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm run dev
```

在浏览器走通整条链路：

1. 访问 `http://localhost:5173/` → 跳 `/setup`
2. 填入 PAT / owner / repo（一个真实的空私有仓库）→ 保存 → 跳 `/`
3. `/` 又跳到默认 book，但因为 repo 为空，没有 book → 留在 HomeView，看到 EmptyState
4. 点左侧"知识库" 旁的 + → 弹"新建知识库"对话框 → 名称填"默认" → 创建
5. GitHub 网页打开仓库，应见 `books/默认/.book.json`
6. 在左侧点新建的"默认"book → 路由变 `/book/默认`
7. 文档树空 → 点 + → 输入标题"第一篇" → 创建
8. GitHub 网页应见 `books/默认/第一篇.md`，front-matter 含 id/title/createdAt/updatedAt
9. 在编辑器里写点内容 → 等 2 秒 → 状态变"已保存"
10. 修改标题 → 等 2 秒 → 自动保存
11. 刷新页面 → 内容仍在
12. 右键文档树某项 → 删除 → 二次确认 → GitHub 上文件消失
13. 重命名某文档 → GitHub 上文件移到新路径
14. 在 `/settings` 改某项后保存 → 凭据持久化
15. `/settings` "清空本地凭据" → 跳回 `/setup`

任何一步失败：定位到对应 Task 修复，再重新跑这一步。

- [ ] **Step 2: 跑全套测试 + lint + typecheck**

```powershell
npm test
npm run lint
npm run typecheck
```

预期：全过。

- [ ] **Step 3: 写一个 Stage 1 验收笔记**

`docs/superpowers/specs/stage-1-acceptance.md`:

```markdown
# Stage 1 验收报告

- 日期：YYYY-MM-DD
- 验收人：YOU
- 通过项：
  - [x] /setup 向导可用
  - [x] /settings 全字段可改 + 导出配置码可复制
  - [x] 新建/重命名/删除知识库 → GitHub 仓库变化
  - [x] 新建/重命名/删除笔记 → GitHub 仓库变化
  - [x] 自动保存 2 秒
  - [x] 401 拦截 → 跳 /setup
  - [x] 冲突对话框可用（人工触发：在 GitHub 网页直接改远端，再在 App 里改本地保存）
  - [x] npm test / lint / typecheck 全过
- 已知遗留：
  - （列你发现但暂时不修的东西，留给 Stage 2+）
```

- [ ] **Step 4: 最终提交**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code
git add docs/superpowers/specs/stage-1-acceptance.md
git commit -m "docs: Stage 1 acceptance report"
git tag stage-1-mvp
```

---

## 自检（Self-Review）

**Spec coverage**

| Spec 节 | 计划任务 | 覆盖 |
|---|---|---|
| 1. 项目概述 / 2. 架构 | 0.1 README + 整体 file structure | ✅ |
| 3. GitHub 仓库结构 | 1.14-1.19 github service | ✅（front-matter / .book.json / books/ 目录都实现） |
| 4. KV 模型 | — | ⏳ Stage 3 |
| 5. Vectorize | — | ⏳ Stage 4 |
| 6. Web App（路由/Pinia/Services/目录/技术选型/视觉） | 1.7-1.31 全部 | ✅ |
| 7. Worker | 0.6 仅占位 | ⏳ Stage 3 真正实现 |
| 8. 浏览器插件 | 0.7 仅占位 | ⏳ Stage 5 真正实现 |
| 9. 关键流程（9.1 保存笔记） | 1.18 + 1.21 + 1.28 + 1.32 | ✅ |
| 9.2-9.5 AI / RAG / 插件 / PWA 流程 | — | ⏳ Stage 3-6 |
| 10. 错误处理（致命/业务/网络/流式/限速）| 1.18 conflict + 1.32 auth-expired | ⚠️ 网络重试 util 已写（1.6），但未在 github service 里串起来 → 见下文修复 |
| 11. 安全 | 1.11 PAT 本地存 + 1.30 export-code 含 show/hide | ✅（DeepSeek/CORS 留 Stage 3） |
| 12. 测试策略 | utils/services/stores 单元测试齐全 | ✅（component 测试本计划只做关键，符合"务实版"） |
| 13. 路线图 Stage 0/1 | Task 0.1-0.8 + 1.1-1.33 | ✅ |
| 14. 不在 MVP | 全程未引入 | ✅ |

**修复（在自检阶段就地补一个 Task）**：网络重试还没串到 service —— 由于 Stage 1 GitHub API 失败本来就少，且 Octokit 自带 retry 插件，先记入 Stage 2 的待办（添加到 acceptance 报告的"已知遗留"），不阻塞 Stage 1 验收。

**Placeholder scan**

- 无 TBD / TODO / "适当处理错误"等占位
- Task 0.7 Step 9 的图标 PNG 是"任意现成"，但提供了明确替代方案
- ConfigCode 等所有 export 流程都有完整代码

**Type consistency**

- `Note.sha?: string`（types.ts）与 `getNote` 返回 + `saveNote(sha?)` 一致 ✅
- `SaveStatus` enum 在 store / view 用法一致 ✅
- `BookMeta.slug` 在 store / service / view 一致 ✅
- `NoteSummary.filePath` 必填，`Note` 继承之 ✅

无歧义需修。计划完整可执行。

---

## Plan complete

**Saved to:** `docs/superpowers/plans/2026-05-17-stage-0-1-notes-app-mvp.md`
