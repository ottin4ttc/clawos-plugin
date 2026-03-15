# ClawOS Plugin

**招聘平台 CLI 自动化** — 基于 Chrome DevTools Protocol，用你的真实浏览器登录态，把 BOSS 直聘、猎聘、脉脉、TTC 人才库变成命令行 API。

[OpenClaw](https://github.com/openclaw) 生态的招聘自动化组件。

## 工作原理

ClawOS 通过 Chrome DevTools Protocol (CDP) 直接与你的浏览器通信。你在浏览器里已经登录的招聘平台，ClawOS 可以直接调用它们的内部 API — 就像你在页面上手动操作一样，但全部通过命令行完成。

```
你的终端 ──▶ ClawOS CLI ──▶ 本地 Daemon (CDP) ──▶ Chrome 扩展 ──▶ 招聘平台
```

所有数据在你本地流转，不经过任何第三方服务器。

## 相比传统方案的优势

| | 传统爬虫 / Selenium / Playwright | ClawOS (CDP) |
|---|---|---|
| **登录态** | 需要手动提取 Cookie、Token，过期后重新获取 | 直接用浏览器已有的登录态，无需管理 Cookie |
| **反爬检测** | 频繁被风控拦截，需要不断更新绕过策略 | 在真实浏览器中执行，平台无法区分人工和自动操作 |
| **环境依赖** | 需要 headless Chrome、复杂的 driver 管理 | 一个 Chrome 扩展 + 轻量 CLI，几分钟装好 |
| **维护成本** | 页面改版就要重写 DOM 解析逻辑 | 直接调用平台内部 API，不依赖 DOM 结构 |
| **数据安全** | Cookie/Token 可能泄露到服务器 | 所有操作在本地完成，数据不离开你的电脑 |

## 安装

### 前置条件

- Node.js >= 18
- pnpm (`npm install -g pnpm`)
- Chrome 浏览器

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/ottin4ttc/clawos-plugin.git
cd clawos-plugin

# 2. 安装依赖并构建
pnpm install
pnpm build

# 3. 全局安装 CLI
npm install -g .

# 4. 安装 Chrome 扩展
#    打开 chrome://extensions/ → 启用开发者模式
#    点击 "加载已解压的扩展程序" → 选择 clawos-plugin/extension/ 目录
```

安装完成后，在浏览器里正常登录你要操作的招聘平台，然后就可以用 CLI 了。

## 使用

```bash
# 查看所有可用命令
clawos site list

# ── BOSS 直聘 ──
clawos site boss/jobs                           # 查看你发布的职位
clawos site boss/recommend <jobId>              # 获取某职位的推荐牛人
clawos site boss/batch-greet <jobId>            # 批量打招呼
clawos site boss/conversations                  # 查看沟通列表
clawos site boss/history <candidateId>          # 查看与某人的聊天记录
clawos site boss/accept --uid <uid>             # 接受候选人的简历/电话交换请求

# ── 猎聘 ──
clawos site liepin/jobs                         # 查看你发布的职位
clawos site liepin/recommend <jobId>            # 获取推荐候选人
clawos site liepin/search2 --keyword "golang"   # 搜索候选人
clawos site liepin/batch-recruit                # 搜索+筛选+批量打招呼
clawos site liepin/harvest                      # 收集已分享的简历/手机/微信
clawos site liepin/download-resume <id>         # 下载候选人简历 PDF

# ── 脉脉 ──
clawos site maimai/search "前端工程师"            # 搜索人才
clawos site maimai/batch-greet                  # 批量搜索+打招呼

# ── TTC 人才库 ──
clawos site ttc/search "产品经理"                # 搜索人才库
clawos site ttc/lists                           # 查看名单列表
clawos site ttc/detail <candidateId>            # 查看候选人详情
```

### 配合 AI Agent 使用

ClawOS 内置 MCP server，可以接入 Claude Code / Cursor 等 AI 工具，让 AI 直接操作招聘平台：

```json
{
  "mcpServers": {
    "clawos": {
      "command": "clawos-mcp"
    }
  }
}
```

### JSON 输出

所有命令都支持 `--json` 参数，方便程序化处理：

```bash
clawos site boss/jobs --json
clawos site boss/recommend <jobId> --json --jq ".list[:5]"
```

## 完整命令清单

### BOSS 直聘 (11)

| 命令 | 说明 | 只读 |
|------|------|------|
| `boss/jobs` | 查看你发布的所有在线职位 | ✅ |
| `boss/recommend` | 获取某职位的推荐牛人列表 | ✅ |
| `boss/search` | 搜索职位 | ✅ |
| `boss/detail` | 获取职位详情（JD、公司信息） | ✅ |
| `boss/conversations` | 获取沟通页面的对话列表 | ✅ |
| `boss/candidate` | 获取候选人详细信息 | ✅ |
| `boss/history` | 获取与候选人的聊天记录 | ✅ |
| `boss/greet` | 给推荐牛人打招呼 | |
| `boss/batch-greet` | 批量打招呼 | |
| `boss/exchange` | 向候选人发起交换请求（简历/电话/微信） | |
| `boss/accept` | 接受候选人发来的交换请求 | |

### 猎聘 (14)

| 命令 | 说明 | 只读 |
|------|------|------|
| `liepin/jobs` | 查看你发布的所有在线职位 | ✅ |
| `liepin/recommend` | 获取某职位的推荐候选人列表 | ✅ |
| `liepin/search2` | 搜索候选人 | ✅ |
| `liepin/resume` | 获取候选人的简历详情 | ✅ |
| `liepin/conversations` | 获取沟通页面的对话列表 | ✅ |
| `liepin/chat-history` | 获取与候选人的聊天记录 | ✅ |
| `liepin/download-resume` | 下载候选人的附件简历 PDF | ✅ |
| `liepin/harvest` | 扫描所有对话，收集已分享的简历/手机/微信 | ✅ |
| `liepin/stats` | 获取账户统计数据 | ✅ |
| `liepin/tasks` | 获取每日任务列表和完成进度 | ✅ |
| `liepin/send-greet` | 向候选人打招呼 | |
| `liepin/askfor` | 向候选人索要信息（手机号/微信号/简历） | |
| `liepin/batch-recruit` | 搜索+智能筛选+批量打招呼 | |

### 脉脉 (4)

| 命令 | 说明 | 只读 |
|------|------|------|
| `maimai/search` | 搜索人才 | ✅ |
| `maimai/user` | 获取当前登录用户信息 | ✅ |
| `maimai/greet` | 立即沟通（打招呼） | |
| `maimai/batch-greet` | 批量搜索+打招呼 | |

### TTC 人才库 (4)

| 命令 | 说明 | 只读 |
|------|------|------|
| `ttc/search` | 人才库搜索 | ✅ |
| `ttc/lists` | 名单列表（智能名单+自定义名单） | ✅ |
| `ttc/detail` | 候选人详情（基本信息+画像） | ✅ |
| `ttc/resume` | 获取简历附件列表 | ✅ |

## 更新

```bash
cd clawos-plugin
git pull
pnpm install && pnpm build
npm install -g .
```

## 致谢

浏览器通信层参考了 [bb-browser](https://github.com/epiral/bb-browser) 的实现。

## License

MIT
