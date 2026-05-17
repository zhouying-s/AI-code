# Stage 1 验收清单

- 日期：2026-05-17
- 范围：Stage 0（脚手架）+ Stage 1（笔记 MVP）

## 自动化检查（已通过）

| 检查 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors |
| `npm test` | ✅ 10 files / 41 tests passed |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 生产构建成功（含 gray-matter eval 警告，无害） |
| `notes-extension` build | ✅ 通过 |

## 手动端到端验证（请你做）

**前置准备**

1. 在 GitHub 建一个**空的私有仓库**（比如 `notes-db`，**不要**勾 README/license）。
2. 在 [GitHub Settings → Developer settings → Personal access tokens (classic)](https://github.com/settings/tokens) 生成一个 PAT：
   - Note: `notes-app dev`
   - Expiration: 90 天
   - Scopes: 勾 `repo`（包括所有子项）
   - Generate → 复制 token

**操作步骤**

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm run dev
```

打开 `http://localhost:5173`：

| # | 操作 | 期望 |
|---|---|---|
| 1 | 打开 `/` | 自动跳到 `/setup` |
| 2 | 在向导页填 PAT / owner / repo → 点保存 | toast "已保存"，跳到 `/`，再跳到 EmptyState |
| 3 | 左侧 "知识库" 旁点 + | 弹"新建知识库"对话框 |
| 4 | 名称填"默认"→ 创建 | 弹 toast "已创建"，自动跳到 `/book/默认` |
| 5 | 打开 GitHub 网页看仓库 | 应见 `books/默认/.book.json` |
| 6 | 点左侧"默认"book，文档树为空，点 + | 弹输入框 |
| 7 | 输入标题"第一篇" → 创建 | 自动跳到 `/book/默认/<id>`，编辑器打开 |
| 8 | GitHub 网页应见 `books/默认/第一篇.md` | front-matter 含 id/title/createdAt/updatedAt |
| 9 | 在编辑器写点内容 | 头部状态从"未保存"→等 2 秒→"已保存" |
| 10 | 修改标题 | 同 #9 自动保存 |
| 11 | 浏览器刷新 | 内容仍在 |
| 12 | 文档树点 ... → 删除 → 二次确认 | GitHub 上文件消失 |
| 13 | 文档树点 ... → 重命名 | GitHub 上文件移到新路径 |
| 14 | 进 `/settings`，改某项 → 保存 | 凭据持久化 |
| 15 | `/settings` 点"清空本地凭据" | 跳回 `/setup` |

**冲突解决（可选验证）**

- 在 App 里改一段内容（不要保存）
- 同时在 GitHub 网页上编辑同一文件并提交
- 回到 App 点保存 → 应弹冲突对话框，可选"接受远端"或"覆盖远端"

**401 拦截（可选验证）**

- 进 `/settings`，把 PAT 改成乱七八糟的字符串保存
- 操作任何会调 GitHub 的功能（比如新建 book） → 应 toast "凭据失效，请重新配置"并跳 `/setup`

## 已知偏差（相对计划）

| 计划 | 实际 | 备注 |
|---|---|---|
| TypeScript 5.5 | TypeScript 6.0 | Vite 模板默认；加了 `ignoreDeprecations` 抑制 baseUrl 警告 |
| Pinia 2 | Pinia 3 | v2 与 @pinia/testing peer dep 冲突 |
| ESLint 9 默认 | ESLint 8 + ts-eslint 7 | 保留传统 `.eslintrc.cjs`，避免 flat config 重写 |
| 计划未提 | 加了 `src/test/setup.ts` localStorage polyfill | Vitest 4 + jsdom 29 兼容性 |
| 网络重试串到 service | 未串 | retry util 已实现并测试通过；service 用未调用。Stage 2 接入 |
| create-cloudflare `--framework=hono` | 手动 npm init | v2.68 已移除 hono framework |

## Stage 1 已知遗留（移到 Stage 2 处理）

- 网络层 retry 包裹（`retry()` util 已就绪）
- 全局搜索（Ctrl+J）
- 小记 / 收藏 / 首页完整内容
