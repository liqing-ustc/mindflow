---
title: "Agent-Friendly Internet: 从文档格式到语义网络"
tags: [web-agent]
status: raw
date_created: "2026-03-23"
---

## Core Idea

现有 Internet 是为人类设计的，AI agent 在上面工作本质上是 "agent browsing human's Internet"，造成大量 token 浪费、能力错配和可靠性问题。行业已开始构建 agent-friendly 的基础设施（llms.txt 解决信息获取，WebMCP 解决操作执行），但更深层的**语义理解层**仍是空白——这是本 idea 的核心研究方向。

## 问题分析：为什么现有 Internet 对 Agent 不友好

### 格式层面
- **PDF** — "数字纸张"，优化 visual layout，表格/多栏/图文混排是 parsing nightmare
- **HTML** — 有 DOM tree 但充斥 styling noise、ads、navigation，content 淹没在 boilerplate 中
- **Word/PPT** — XML-based 但 schema 极复杂，格式信息远多于语义信息

核心矛盾：**format 优化的是 human rendering，agent 需要的是 semantic understanding。**

### Token 浪费

| 内容类型 | 占比（估计） | 对 agent 的价值 |
|----------|-------------|----------------|
| Navigation / header / footer | ~15-20% | ❌ 无用 |
| CSS class names / HTML tags | ~20-30% | ❌ 几乎无用 |
| Ads / tracking scripts | ~10-15% | ❌ 完全无用 |
| Boilerplate text（cookie notice 等） | ~5-10% | ❌ 无用 |
| **实际有用内容** | **~20-40%** | ✅ |

Agent 读一个网页，**约 60-80% 的 token 是浪费的**。多轮交互（搜索→点击→阅读→返回→再点击）进一步放大浪费，一个简单查找任务可能消耗 100k+ tokens。

### 深层问题

1. **Modality mismatch** — 人类 200ms visual scanning 判断页面价值，agent 必须完整 ingest + process；人类并行处理 layout，agent 需要 serialize → LLM sequential processing → reconstruct，是一个 lossy round-trip
2. **Interaction model 错配** — 网页交互（dropdown、infinite scroll、modal、CAPTCHA）为有手有眼的人设计，agent 用 browser automation 操作如同用机械臂按计算器按钮
3. **Context window opportunity cost** — 塞满 HTML boilerplate 意味着减少 reasoning / planning / memory 的空间，直接影响 agent 认知能力
4. **Reliability** — 网页结构频繁变化（A/B testing、redesign），agent browsing pipeline 极其脆弱

## 行业现状：三层架构与缺失的中间层

```
┌─────────────────────────────────────────────────────────┐
│                  Agent-Friendly Internet                 │
├───────────────┬───────────────────┬─────────────────────┤
│  信息获取层    │    语义理解层      │    操作执行层        │
│  agent 读内容  │   agent 深度理解   │   agent 做操作      │
├───────────────┼───────────────────┼─────────────────────┤
│  llms.txt     │      ???          │    WebMCP           │
│  ✅ 已有标准   │   ❌ 仍是蓝海      │    ✅ 已有标准       │
└───────────────┴───────────────────┴─────────────────────┘
```

### 信息获取层：[[Topics/llms-txt|llms.txt]]
Jeremy Howard 提出的 Web 标准，网站根目录放置 Markdown 格式的 LLM-friendly 内容索引。
- ✅ Progressive disclosure — `llms.txt`（摘要）→ `llms-full.txt`（完整内容）→ 原始网页
- ✅ 减少 token 浪费 — 去掉 navigation、ads、CSS 等 noise
- ✅ Curated > exhaustive — 精选重要内容而非全量列表
- 已有 1,158 个网站采用（截至 2026-03），集中在 developer tools 领域

### 操作执行层：[[Topics/WebMCP|WebMCP]]
Google 提出的 Web 标准，网站通过 `navigator.modelContext` API 暴露结构化工具。
- ✅ 解决 interaction model 错配 — agent 直接调用函数而非模拟 GUI
- ✅ 与 llms.txt 互补 — 一个管"读"，一个管"做"
- 目前 Chrome 146 Canary 早期预览

### 语义理解层：❌ 缺失
**两者共同的局限：**
- 都依赖网站主动采用（opt-in），无法覆盖存量互联网
- 都停留在 Level 0→1（clean content / structured action），未涉及深层语义
- llms.txt 仍是扁平文本，无段落/论点/引用等语义标注
- 无实体链接、关系抽取、claim-level annotation

**这一层是本 idea 的核心研究空间。**

### 相关趋势：GEO（Generative Engine Optimization）
从供给侧看同一问题：内容发布者优化自身内容以被 AI 引用和推荐，是 SEO 的 AI 时代版本。2025 年前 5 个月 AI 引荐流量同比增长 527%，预测 2027 年 LLM 流量将超过传统 Google 搜索。GEO 论文：[Aggarwal et al., 2023](https://arxiv.org/abs/2311.09735)

## 理想设计：Agent-Friendly Format 的五个维度

1. **Structured semantics first** — 段落、论点、evidence、引用关系是 first-class citizens，不靠 visual cues 暗示
2. **Multi-modal anchoring** — 图表带有 caption、data source 和 surrounding text 的语义关联，而非 embedded blob
3. **Granular addressability** — agent 可精确引用 specific claim / paragraph，而非"第3页第2段"
4. **Metadata-rich** — provenance、confidence level、temporal validity 内置
5. **Progressive disclosure** — summary → details → raw data 层级结构，agent 按需深入

## 技术路线：内容转换的四个层级

```
Level 0: Raw Web (HTML/PDF/etc.)
   ↓  Extraction & Cleaning
Level 1: Clean Content (去 noise，提取正文)
         ✅ 现有技术较成熟（Trafilatura 等），~85-90% 准确率
         ✅ llms.txt 在推动网站主动提供
   ↓  Structural Parsing
Level 2: Structured Content (段落/标题/表格/引用 的 semantic tree)
         ⚠️ LLM 可行但 cost 高
   ↓  Semantic Enrichment
Level 3: Knowledge-Rich Content (实体链接、关系抽取、claim-level annotation)
         ❌ 最关键也最难的一步
   ↓  Cross-document Linking
Level 4: Agent-Ready Knowledge Web (可查询、可推理的语义网络)
         ❌ Semantic Web 的老愿景，LLM 时代的新技术栈
```

### 关键挑战

**Bootstrapping paradox**
构建 agent-friendly Internet 需要一个能理解 human Internet 的 agent — 但这正是我们要解决的问题。不过 offline batch processing 可以接受高成本，转换一次后反复使用。

**规模与成本**

| 指标 | 数量级 |
|------|--------|
| 活跃网页数量 | ~数百亿 |
| 平均页面 token（cleaned） | ~5-10k |
| LLM 处理成本（Level 2→3） | ~$0.01-0.05/page |
| 全网一次性转换成本 | ~$1-10 亿 |
| 每日更新页面 | ~数亿 |
| 持续维护成本/年 | ~$10-100 亿 |

**动态内容**
新闻、社交媒体、电商等实时变化，需要 continuous pipeline。Freshness 和 cost 之间有 fundamental tension。

**信息 fidelity**
每层转换都会丢失信息。Visual layout 有时本身就是信息（表格列对齐暗示的比较关系、信息图的空间布局），自动转换难以保留所有 implicit information。

## 实现策略

### A. On-demand conversion with caching
```
Agent 需要访问某页面
  → 先查 cache（已转换过的 agent-friendly 版本）
  → Cache miss → 实时转换 → 存入 cache
  → 热门页面逐渐被覆盖
```
类似 CDN 的 lazy evaluation 思路，避免 eager conversion 的巨大成本。

### B. 垂直领域优先
先在高价值、相对结构化的领域建立 agent-friendly layer：
- 学术论文（已有 Semantic Scholar / OpenAlex）
- 法律文书
- 医学文献
- 技术文档 / API docs
- 政府公开数据

### C. 双轨发布（Dual Publishing）
推动内容发布者在发布时同时生成 agent-friendly 版本。llms.txt 和 WebMCP 已在推动这个方向，但目前仅覆盖 Level 0→1。

### D. Browser-side agent layer
不在服务端转换，而是在 agent 的 browser 端加一个智能抽取层，类似 ad-blocker 但目的是 semantic extraction。避免全网转换的成本。

## 关键洞察

> Google Search Index 本质上就是 human Internet 的一个 "search-engine-friendly" representation。**Agent-friendly Internet 可能就是下一代 search index** — 不同的是，传统 search index 优化 keyword matching 和 ranking，而 agent-friendly layer 需要优化 semantic understanding 和 reasoning。

> 行业正在从两端推进（llms.txt 管"读"，WebMCP 管"做"），但**中间的语义理解层是真正的 hard problem，也是最大的研究机会**。

## Related Work
- **[[Topics/llms-txt|llms.txt]]** — 信息获取层标准（详见专题笔记）
- **[[Topics/WebMCP|WebMCP]]** — 操作执行层标准（详见专题笔记）
- **GEO** — 供给侧优化（[Aggarwal et al., 2023](https://arxiv.org/abs/2311.09735)）
- 待补充：HTML accessibility (`aria-*`) 作为 dual-audience 的先例
- 待补充：Semantic Web / Linked Data 的经验教训
- 待补充：Agent web browsing 论文（WebArena、MindAct 等）
- 已有 partial solutions：Common Crawl、Trafilatura、Readability、Semantic Scholar、OpenAlex、Wikidata、Schema.org / JSON-LD

## Rough Plan

1. **Benchmark token 浪费** — 量化 agent 在不同格式（raw HTML vs llms.txt vs 理想格式）上的 information extraction 效率差异
2. **语义层 prototype** — 设计 Level 2→3 的 representation format，超越 llms.txt 的纯文本
3. **On-demand conversion + caching system** — 实现策略 A 的 prototype，测量 cache hit rate 和 token 节省率
4. **垂直领域 pilot** — 选一个领域（如学术论文）端到端验证 Level 0→4 的完整 pipeline
5. **与 llms.txt / WebMCP 的集成** — 探索在现有标准上叠加语义层的可行性

## Open Questions

- Level 2→3 的语义层应该长什么样？是否可以在 llms.txt 上扩展，还是需要全新设计？
- Agent 的需求是否足够统一，能设计出 general-purpose 的格式？还是不同任务需要不同 representation？
- 与 Semantic Web 的失败经验相比，LLM 的 flexibility 是否改变了游戏规则？（Semantic Web 要求严格 ontology，LLM 可以容忍 messy input）
- 全网转换的 bootstrapping paradox 如何解决？渐进式 approach 是否足够？
- Agent-friendly layer 的经济模型是什么？谁来付费维护？
- 如果多个 agent provider 各自构建 agent-friendly layer，是否会出现碎片化？是否需要开放标准？
- llms.txt + WebMCP 的 opt-in 模式能走多远？是否最终需要 infrastructure-level 的方案来覆盖存量互联网？
