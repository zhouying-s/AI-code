# Stage 2 验收清单

- 日期：2026-05-18
- 范围：搜索 + 小记 + 收藏 + 首页 + GitHub retry

## 自动化检查（已通过）

| 检查 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm test` | ✅ 18 files / 84 tests passed |
| `npm run typecheck` | ✅ 通过 |
| `npm run build` | ✅ 生产构建成功（dist 已生成） |

## 新增能力清单

| 能力 | 实现位置 | 提交 |
|---|---|---|
| GitHub read retry（5xx + 网络错重试 3 次，4xx 不重试） | `services/github.ts` | `498d23d` |
| `utils/storage.ts` 通用 localStorage 包装 | `utils/storage.ts` | `5e6...` 等 |
| 全局搜索（Fuse 索引、CommandPalette Ctrl+J 浮层、`SearchView` 独立页） | `services/search.ts` / `stores/search.ts` / `composables/useShortcut.ts` / `components/common/CommandPalette.vue` / `views/SearchView.vue` | `b3bbcc5`、`7583be4` |
| 小记（localStorage CRUD + Composer + Card） | `services/memoStorage.ts` / `stores/memos.ts` / `components/memo/*` / `views/MemosView.vue` | `20490e6` |
| 收藏（笔记 + 小记 tab） | `services/favoritesStorage.ts` / `stores/favorites.ts` / `views/FavoritesView.vue` | `451715e` |
| BookView 笔记标题星标 | `views/BookView.vue` | `00ba986` |
| HomeView 三栏聚合（最近编辑/小记/收藏） | `views/HomeView.vue` | `f117011` |

## 手动验证（请你做）

前置：已有 Stage 1 的 `notes-db` 数据。

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm run dev
```

打开 `http://localhost:5180/`：

| # | 操作 | 期望 |
|---|---|---|
| 1 | 在任何页面按 **Ctrl+J** | 弹出搜索浮层（顶部输入框聚焦） |
| 2 | 输入笔记标题关键字（比如 `react`） | 实时显示匹配 |
| 3 | ↑↓ 切换 → Enter 打开 | 跳到对应笔记 |
| 4 | 输入"asdf123"等不存在关键词 | "没有匹配的笔记" |
| 5 | 关浮层 → 重开 | 显示"最近搜索"区，点条目即可回填 |
| 6 | 直接访问 `/search?q=hooks` | 独立搜索页打开并预填 |
| 7 | 进 `/memos` 写一条小记 → 点"添加"或按 Ctrl+Enter | 卡片出现在上方，toast "已添加" |
| 8 | 写超过 80 字的内容 | preview 截断到 80 字 + … |
| 9 | 点小记卡片 ✏️ 编辑 → 改内容 → 保存 | 卡片 preview 更新 |
| 10 | 点小记卡片 ⭐ | 进 `/favorites` "小记" tab 应出现 |
| 11 | 点小记卡片 🗑️ → 二次确认 | 卡片消失 |
| 12 | 进任意 BookView → 点标题旁星标 | `/favorites` "笔记" tab 应出现 |
| 13 | 进 `/` 首页 | 三个 section 显示最近 5 条；点条目可跳 |
| 14 | 浏览器刷新 | 小记/收藏不丢（localStorage 持久化） |
| 15 | DevTools Network → Offline 5 秒 → 在线 → 操作笔记 | retry 自动重试（5xx 路径） |

## 已知偏差（相对计划）

| 计划 | 实际 | 备注 |
|---|---|---|
| 搜索索引含正文前 500 字 | 仅索引标题/摘要/标签 | 节省 N 次 GitHub API 调用；Stage 4 RAG 来语义搜索 |
| CommandPalette 多行 @click 表达式 | 拆成 `pickRecent()` 方法 | Vue 编译器对内嵌多行表达式不友好 |

## Stage 2 已知遗留（移到 Stage 3 处理）

- 小记/收藏数据迁移到 Cloudflare KV（需要 Worker 落地）
- AI 写作页（路由 `/ai` 仍占位）
- 编辑器内嵌 AI 划词菜单
