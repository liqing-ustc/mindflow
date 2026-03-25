---
title: "llms.txt: 让网站对 LLM 可读的新标准"
tags: [LLM, web-agent]
date_created: "2026-03-23"
---
# llms.txt

## 是什么
`llms.txt` 是由 Jeremy Howard（fast.ai 创始人）提出的 Web 标准提案，在网站根目录放置一个 Markdown 格式的文件，为 LLM 和 AI agent 提供网站的结构化概览。

核心理念：**LLM 的 context window 无法处理整个网站，而将复杂 HTML 转换为 LLM-friendly 纯文本既困难又有损** — 不如让网站主动提供一份精炼的、专为 LLM 设计的内容索引。

官网：[llmstxt.org](https://llmstxt.org/)

## 类比定位

| 文件 | 服务对象 | 作用 |
|------|---------|------|
| `robots.txt` | 搜索引擎爬虫 | 定义抓取权限 |
| `sitemap.xml` | 搜索引擎 | 列出所有页面供索引 |
| **`llms.txt`** | **LLM / AI agent** | **精选重要页面 + 摘要，供 LLM 快速理解网站** |

## 文件格式

使用 Markdown（而非 XML），因为"这些文件本身就预期会被 LLM 阅读"，同时也可被传统程序解析。

### 结构规范

```markdown
# 项目/网站名称                    ← H1（必需）

> 一句话简介，包含关键信息           ← Blockquote（可选）

详细说明段落、列表等正文内容...      ← 正文（可选，不能用额外标题）

## Section Name                    ← H2 分隔的"文件列表"（可选）

- [页面标题](url): 页面内容说明
- [另一个页面](url): 说明

## Optional                        ← 特殊 section，表示次要内容

- [次要页面](url): 在 context 不够时可跳过
```

### 示例
```markdown
# FastHTML

> FastHTML is a python library which brings together Starlette, Uvicorn, HTMX, and fastcore's FT "FastTags" into a library for creating server-rendered hypermedia applications.

## Docs

- [Getting Started](https://docs.fastht.ml/tutorials/quickstart.html.md): Overview of FastHTML features
- [Components](https://docs.fastht.ml/api/components.html.md): FT component reference

## Optional

- [Examples](https://docs.fastht.ml/examples/index.html.md): Example applications
```

## 配套机制

### `.md` 版本页面
网站应为每个页面提供对应的 `.md` 版本：
- `example.com/page.html` → `example.com/page.html.md`
- `example.com/docs/` → `example.com/docs/index.html.md`

### `llms-full.txt`
将 `llms.txt` 中引用的所有页面内容合并成一个文件，预格式化供 LLM 直接消费。免去 agent 多次抓取的开销。

### `llms_txt2ctx` 工具
自动生成处理后的版本：
- `llms-ctx.txt` — 去掉 URL，纯内容
- `llms-ctx-full.txt` — 展开所有 URL 的内容

## 采用现状

### 规模
[llms.txt Hub](https://llmstxthub.com/) 是目前最大的采用目录，已收录 **1,158 个网站**（截至 2026-03）。

### 知名采用者
- **AI/ML 领域**：LangChain、Anthropic、Cursor — AI 公司自己先 dogfood
- **开发者基础设施**：Docker、Cloudflare、Vercel
- **构建工具**：Turbo

采用者高度集中在 **Developer Tools 和 AI/ML 领域**，其他行业（金融、电商、媒体等）渗透率仍低。

### 工具生态
已形成配套工具链：
- Chrome 扩展（llms.txt Checker）— 检查网站是否有 llms.txt
- VS Code 扩展
- MCP Explorer — 与 Claude MCP 协议对接
- Raycast 扩展
- CLI 工具（npm 包）

### 观察
- 1,158 个网站相对于整个互联网是沧海一粟，但在 developer tools 垂直领域渗透率已不低
- 完全 supply-side driven（依赖网站主动采用），存量互联网的问题未解决
- 与 GEO（Generative Engine Optimization）趋势高度吻合

## Notes
- 设计哲学类似 `robots.txt` — 极简、低门槛、依赖网站主动配合
- 局限性：依赖内容发布者自愿采用，无法解决"存量互联网"的问题
- 有趣的张力：`llms.txt` 是 opt-in 的"给 AI 看"，而 `robots.txt` 传统上是 opt-out 的"不给爬虫看"
