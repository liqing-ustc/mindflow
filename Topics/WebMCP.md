---
title: "WebMCP: 让网站成为 AI Agent 的结构化工具"
tags: [web-agent]
date_created: "2026-03-23"
---
# WebMCP

## 是什么
Google 提出的 Web 标准提案，让网站主动声明自己能执行哪些操作，AI agent 可以直接调用结构化的 tool，而不需要解析 UI 或模拟人类交互。

核心理念：**网站不再是 agent 需要"看"的页面，而是可以直接"调用"的服务。**

- 官方博客：[Chrome Developers Blog](https://developer.chrome.com/blog/webmcp-epp)
- GitHub：[webmachinelearning/webmcp](https://github.com/webmachinelearning/webmcp)

## 核心机制

通过浏览器新 API `navigator.modelContext`，网站暴露一组结构化工具：

```javascript
// 网站声明：我能做这些事
navigator.modelContext.tools = [
  { name: "buyTicket", params: { destination: "string", date: "date" } },
  { name: "searchFlights", params: { from: "string", to: "string" } }
]
```

Agent 直接调用函数，而不是模拟点击按钮、填表单、处理 dropdown。

## 两种 API

| | Declarative API | Imperative API |
|---|---|---|
| 适用场景 | 标准动作（HTML 表单可描述） | 复杂动态交互（需 JS 执行） |
| 实现方式 | 直接在 HTML 中声明 | JavaScript 注册 |
| 复杂度 | 低 | 高 |

## 与 Anthropic MCP 的关系

| | MCP（Anthropic） | WebMCP（Google） |
|---|---|---|
| 运行位置 | **后端** — AI 平台连接服务提供商 | **客户端** — 浏览器内运行 |
| 连接方式 | AI ↔ hosted server | AI agent ↔ 网页 |
| 定位 | 通用 tool protocol | Web-specific protocol |

**互补而非替代**：MCP 解决后端服务集成，WebMCP 解决前端网页交互。

## 当前状态
- Chrome 146 Canary 中可用（需开启 "WebMCP for testing" flag）
- 尚处于早期预览阶段（Early Preview Program）
- 开发者可申请加入获取文档和 demo

## 解决的问题
当前 agent 与网页交互的方式是 **browser automation**（模拟点击、填表单），本质上是"用 API 模拟 GUI 操作"：
- 脆弱 — 网页结构一变就 break
- 低效 — 需要 ingest 整个页面才能找到交互元素
- 错误率高 — dropdown、infinite scroll、modal、CAPTCHA 都是障碍

WebMCP 让网站直接暴露 **structured API**，agent 不再需要"假装是人"来操作网页。

## Notes
- 设计哲学：与 [[Topics/llms-txt|llms.txt]] 类似，依赖网站主动采用（opt-in）
- `llms.txt` 解决 **信息获取**（agent 读内容），WebMCP 解决 **操作执行**（agent 做事情），两者互补
- 与 GEO 趋势一致：网站越来越需要"对 AI 友好"
- 待观察：采用率能否突破 developer tools 领域，进入主流网站
