# Stage 3 验收清单

- 日期：2026-05-18
- 范围：Cloudflare Worker 后端 + DeepSeek SSE 接入 + AI 写作页 `/ai` + 编辑器内嵌 AI 划词菜单
- 部署：`https://notes-api.2748728905.workers.dev`（Worker 版本 `d7e4e8c2-1315-4fbe-b040-94bd7b5d432c`）

## 自动化检查（已通过）

### notes-app（前端）

| 检查 | 结果 |
|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run typecheck` | ✅ 通过 |
| `npm test` | ✅ 22 files / 96 tests passed |
| `npm run build` | ✅ 生产构建成功（dist 已生成，Vditor 主 chunk ~1.3 MB / gzip 409 KB） |

### notes-api（Worker）

| 检查 | 结果 |
|---|---|
| `npm run typecheck` | ✅ tsc --noEmit 通过 |
| `npm test` | ✅ 6 files / 24 tests passed（FakeKV 内存 mock） |
| `npx wrangler deploy` | ✅ 推到生产，绑定 `NOTES_KV`（`3eb6...e03b`） + `ALLOWED_ORIGINS` |

### 部署烟雾测试（生产 URL）

| 路径 | 期望 | 实测 |
|---|---|---|
| `GET /health` | 200 | ✅ 200 |
| `GET /api/memos`（无 Bearer） | 401 | ✅ 401 |
| `GET /api/memos`（错 Bearer） | 401 | ✅ 401 |

## 新增能力清单

| 能力 | 实现位置 | 提交 |
|---|---|---|
| Worker 共享类型（Bindings / Memo / Favorites / ChatMessage） | `notes-api/src/types.ts` | `030dedc` |
| Bearer Master Token 鉴权 + FakeKV 测试桩 | `notes-api/src/middleware/auth.ts` / `tests/fakeKV.ts` | `876c19b` |
| CORS 白名单（localhost + pages.dev + chrome-extension） | `notes-api/src/middleware/cors.ts` | `1f162fe` |
| IP 维度限速（60 req/min，KV TTL 计数器） | `notes-api/src/middleware/rateLimit.ts` | `ef12990` |
| KV 通用 helpers + shortId | `notes-api/src/lib/kv.ts` | `e3d7a18` |
| `/api/memos` CRUD over KV | `notes-api/src/routes/memos.ts` | `9240e20` |
| `/api/favorites` add/remove over KV | `notes-api/src/routes/favorites.ts` | `457614b` |
| `/api/ai/sessions` CRUD + 消息历史 | `notes-api/src/routes/sessions.ts` | `b317788` |
| DeepSeek SSE 反向代理（`https://api.deepseek.com/chat/completions`） | `notes-api/src/lib/deepseek.ts` | `173003a` |
| `/api/ai/chat` 流式端点 | `notes-api/src/routes/ai.ts` | `d8ec864` |
| 路由总装（CORS → rateLimit → auth → routes） | `notes-api/src/index.ts` | `74c22ed` |
| 真实 KV ID + account_id 写回 wrangler.toml | `notes-api/wrangler.toml` | `2d5bacd` |
| 前端 fetch 包装（Bearer 注入 + Stream 变种） | `notes-app/src/services/workerClient.ts` | `b517676` |
| 类型新增（`ChatMessage` / `AiSessionMeta` / `DeepSeekModel`） | `notes-app/src/types.ts` | `f5dc818` |
| AI services（会话 CRUD + `streamChat` async generator 解 SSE delta） | `notes-app/src/services/ai.ts` | `9b0cbce` |
| `useAiStore`（会话列表 / 当前消息 / 流式增量缓冲） | `notes-app/src/stores/ai.ts` | `2658df4` |
| localStorage → KV 一次性迁移工具 | `notes-app/src/services/migration.ts` | `9fb4ae6` |
| `SettingsView` 连接测试 + 上传到云端按钮 | `notes-app/src/views/SettingsView.vue` | `ac36fd5` |
| `ModelSwitcher`（deepseek-chat / deepseek-reasoner 下拉） | `notes-app/src/components/ai/ModelSwitcher.vue` | `c592c36` |
| `MessageBubble`（复制 + 插入到当前文档） | `notes-app/src/components/ai/MessageBubble.vue` | `61c2952` |
| `SessionList` + `ContextPicker`（@某篇笔记当上下文） | `notes-app/src/components/ai/*.vue` | `31f1df3` |
| `ChatPanel`（流式增量渲染 + 上下文注入 + insert 到当前文档） | `notes-app/src/components/ai/ChatPanel.vue` | `ce28da7` |
| `AiView` 三栏（PrimarySidebar / SessionList / ChatPanel） + needs-setup 守卫 | `notes-app/src/views/AiView.vue` | `55712fc` |
| `InlineAiMenu`（改写 / 总结 / 翻译 / 续写 浮层菜单 + 流式回写） | `notes-app/src/components/editor/InlineAiMenu.vue` | `700b268` |
| VditorEditor 接入划词菜单（selectionchange 监听 + replace/append 落笔） | `notes-app/src/components/editor/VditorEditor.vue` | `c8633dd` |

## 手动验证（请你做）

前置：
- 已完成 Stage 1 / 2 验收（`notes-db` 仓库可读写、本地有数据）
- 设置页填好 `Worker URL = https://notes-api.2748728905.workers.dev`、`Master Token = <你的 MASTER_TOKEN>`

```powershell
cd C:\Users\螭竹\Desktop\Codex_test\AI-Code\notes-app
npm run dev
```

打开 `http://localhost:5180/`：

| # | 操作 | 期望 |
|---|---|---|
| 1 | 设置页点"测试 Worker 连接" | 弹出"Worker 健康 ✅" |
| 2 | 设置页点"上传到云端"（已有小记/收藏的话） | 进度条跑完，弹出"已上传 X 条小记 / Y 条收藏" |
| 3 | 顶部"AI"图标进入 `/ai` | 三栏布局：左边主侧栏 / 中间会话列表（首次为空） / 右边聊天区（提示新建会话） |
| 4 | 中栏 ⊕ 新建会话 | 列表多出一条"新会话"，右侧聊天区可输入 |
| 5 | 右上切模型 `deepseek-chat` ↔ `deepseek-reasoner` | 下方"模型: xxx"显示同步变化 |
| 6 | 输入"用三句话介绍 Vue 3" → 回车 | 出现流式光标 ▍，AI 回复一字一字增长，3-10 秒内完成 |
| 7 | AI 消息底下点"复制" | 系统提示"已复制"，剪贴板含完整内容 |
| 8 | 点"插入到当前文档"（先在 BookView 打开一篇笔记） | 该笔记末尾被追加 AI 内容 |
| 9 | ContextPicker：勾两篇笔记 → 再问一句"基于上面那两篇说说" | AI 回复体现两篇内容（system role 注入） |
| 10 | 左侧会话列表 hover 出现 🗑 → 点删 → 确认 | 该会话消失，右侧切回空提示 |
| 11 | BookView 编辑器内选中一段文字 | 选区下方浮出"改写 / 总结 / 翻译 / 续写"四按钮 |
| 12 | 点"总结" | 浮层内流式显示 AI 总结结果 + ▍ 光标 |
| 13 | 流完点"替换选区" | 选中那段被 AI 结果替换，编辑器内容同步 |
| 14 | 重新选一段 → 点"续写" → 点"追加到下方" | AI 续写内容追加到全文末尾，原文不动 |
| 15 | 点编辑器空白处 / 点浮层"关闭" | 浮层消失 |
| 16 | 关掉设置页 Worker URL / Master Token，刷新 `/ai` | 显示"需要先配置 Worker"占位 + "去设置"按钮 |

## 已知遗留 / Stage 4+ 跟进

- notes-api 没配 `npm run lint`（stage-0 遗漏，不影响功能，下个 stage 补）
- `index-CWAOWKNF.js` 主 chunk 1.3 MB（Vditor 自身体量），未做 dynamic split，性能足够 MVP 用
- 暂未做 Vectorize / Workers AI / `/api/ai/embed` 实做（spec 中已标记 Stage 4 跟进）
- 暂未做 GitHub PAT 服务端代理（Stage 5）
- Worker 速率限制是 IP 维度滑窗，多人共用同一出口 IP 会互相挤压（单用户 MVP 可接受）

## Tag

```
git tag stage-3-ai
```
