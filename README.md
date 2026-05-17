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
