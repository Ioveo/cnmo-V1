
# NEXUS Audio Lab (v5)

NEXUS Audio Lab 是一个基于 AI 的下一代音频分析与复刻工作站。

## 🚀 部署指南 (必读)

### 1. 为什么之前会报错？
Cloudflare Pages 默认只部署静态文件。要启用 API 功能，必须将后端代码 (`worker.js`) 放入 `dist/_worker.js`。
本项目已更新 `package.json`，在构建时自动完成此操作。

### 2. 部署步骤

**本地部署 (推荐)**:
```bash
# 1. 安装依赖
npm install

# 2. 一键构建并部署
# 此命令会自动打包前端 -> 注入后端 Worker -> 上传到 Cloudflare
npm run deploy
```

**Cloudflare Dashboard 自动部署**:
如果通过连接 GitHub 部署，请确保 **Build Settings** 设置如下：
*   **Build Command**: `npm run build`
    *   (注意：不要只填 `vite build`，必须是 `npm run build` 以执行 worker 复制脚本)
*   **Build Output Directory**: `dist`

---

## 环境变量配置 (Dashboard)

部署成功后，请在 Cloudflare Dashboard (Settings -> Variables & Secrets) 配置：

| 变量名 | 示例值 | 说明 |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | `123456` | 创作者中心管理员密码 |
| `GEMINI_API_KEY` | `AIzaSy...` | (可选) 内置 AI Key |

## 资源绑定 (Functions)

请在 Cloudflare Pages 的 **Settings -> Functions** 中配置绑定：

| 绑定名 | 资源类型 | 说明 |
| :--- | :--- | :--- |
| `SONIC_KV` | KV Namespace | 数据库 (需先在 Workers & Pages -> KV 创建) |
| `SONIC_BUCKET` | R2 Bucket | 文件存储 (需先在 R2 创建) |