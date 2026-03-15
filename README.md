# ClawOS Plugin

招聘平台 CLI 自动化 — 将 BOSS 直聘、猎聘、脉脉、TTC 人才库变成命令行 API。

Recruitment platform CLI automation — turn BOSS Zhipin, Liepin, Maimai, and TTC into command-line APIs.

## 安装 / Install

### 前置条件 / Prerequisites

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Chrome 浏览器

### 从源码安装 / Install from source

```bash
git clone https://github.com/ottin4ttc/clawos-plugin.git
cd clawos-plugin
pnpm install
pnpm build
npm install -g .
```

### 安装 Chrome 扩展 / Install Chrome Extension

1. 在 `clawos-plugin/extension/` 目录找到构建好的扩展
2. 打开 `chrome://extensions/` → 启用开发者模式
3. 点击 "加载已解压的扩展程序" → 选择 `extension/` 目录

## 快速开始 / Quick Start

```bash
# 启动 daemon（首次使用时自动启动，通常不需要手动操作）
clawos daemon

# 查看所有内置 adapter
clawos site list

# BOSS 直聘：查看你发布的职位
clawos site boss/jobs

# BOSS 直聘：获取推荐牛人
clawos site boss/recommend <jobId>

# 猎聘：搜索候选人
clawos site liepin/search2 --keyword "golang" --city "上海"

# 脉脉：搜索人才
clawos site maimai/search "前端工程师"

# TTC 人才库：搜索
clawos site ttc/search "产品经理"
```

## 四平台功能清单 / Adapter List

### BOSS 直聘 (11 adapters)

| Adapter | 描述 |
|---------|------|
| `accept` | 接受候选人发来的交换请求（简历/电话/微信） |
| `batch-greet` | 批量打招呼：获取推荐牛人并逐个打招呼 |
| `candidate` | 获取候选人详细信息 (read-only) |
| `conversations` | 获取沟通页面的对话列表 (read-only) |
| `detail` | 获取职位详情（JD、公司信息）(read-only) |
| `exchange` | 向候选人发起交换请求（求简历/换电话/换微信） |
| `greet` | 给推荐牛人打招呼 |
| `history` | 获取与候选人的聊天记录 (read-only) |
| `jobs` | 列出你发布的所有在线职位 (read-only) |
| `recommend` | 获取某个职位的推荐牛人列表 (read-only) |
| `search` | 搜索职位 (read-only) |

### 猎聘 Liepin (14 adapters)

| Adapter | 描述 |
|---------|------|
| `askfor` | 向候选人索要信息（手机号/微信号/简历） |
| `batch-recruit` | 搜索+智能筛选+批量打招呼 |
| `chat-history` | 获取与候选人的聊天记录 (read-only) |
| `conversations` | 获取沟通页面的对话列表 (read-only) |
| `download-resume` | 下载候选人的附件简历 PDF (read-only) |
| `harvest` | 扫描所有对话，收集已分享的简历/手机号/微信号 (read-only) |
| `jobs` | 列出你发布的所有在线职位 (read-only) |
| `recommend` | 获取某个职位的推荐候选人列表 (read-only) |
| `resume` | 获取候选人的简历详情 (read-only) |
| `search2` | 搜索候选人 |
| `send-greet` | 向候选人打招呼 |
| `stats` | 获取账户统计数据 (read-only) |
| `tasks` | 获取每日任务列表和完成进度 (read-only) |

### 脉脉 Maimai (4 adapters)

| Adapter | 描述 |
|---------|------|
| `batch-greet` | 批量搜索+打招呼 |
| `greet` | 立即沟通（打招呼） |
| `search` | 搜索人才 |
| `user` | 获取当前登录用户信息 |

### TTC 人才库 (4 adapters)

| Adapter | 描述 |
|---------|------|
| `detail` | 候选人详情（基本信息+画像） |
| `lists` | 名单列表（智能名单+自定义名单） |
| `resume` | 获取简历附件列表 |
| `search` | 人才库搜索 |

## 更新 / Update

```bash
cd clawos-plugin
git pull
pnpm install
pnpm build
npm install -g .
```

## MCP Server

ClawOS 内置 MCP server，可集成到 Claude Code / Cursor 等 AI 工具：

```json
{
  "mcpServers": {
    "clawos": {
      "command": "clawos-mcp"
    }
  }
}
```

## 架构 / Architecture

基于 [bb-browser](https://github.com/epiral/bb-browser) (MIT) fork，感谢原作者。

```
clawos CLI ──HTTP──▶ clawos daemon ──SSE──▶ Chrome Extension ──▶ 浏览器页面
```

- **CLI**: 命令行工具，发送指令到 daemon
- **Daemon**: HTTP 服务器，桥接 CLI 和 Chrome Extension
- **Extension**: Chrome 扩展，在浏览器中执行操作
- **Site Adapters**: JavaScript 函数，在页面上下文中运行，调用平台 API

## License

MIT
