# Research Workspace Design Spec

## Overview

基于 Obsidian 构建一个 AI 研究领域的知识管理工作区，用 markdown 格式记录论文笔记、研究 idea、项目进展、文献综述和会议记录。完全替代 Notion 的论文管理功能。

## Design Decisions

- **混合结构（Folder + Tag + Link）**：文件夹做大分类，tags 做跨类别筛选，双向链接做细粒度关联
- **AI 辅助工作流**：模板设计 AI-friendly，AI（Claude）作为初稿生成工具，用户阅读后修改
- **中英混用**：模板结构用英文，内容中英混用，专有名词保留英文
- **Obsidian 中级用户**：使用核心模板功能，不依赖 Dataview 等高级插件

## Folder Structure

```
Research/
├── Papers/              — 论文笔记，文件名：AuthorYear-ShortTitle.md
├── Ideas/               — 研究灵感和 idea
├── Projects/            — 研究项目追踪
├── Topics/              — 主题综述/文献对比
├── Meetings/            — 会议/讨论记录
├── Templates/           — Obsidian 模板文件
├── Attachments/         — 图片、PDF、截图等附件
├── Resources/           — AI Prompts 等参考资料
├── Daily/               — 每日研究日志（可选）
└── README.md            — Workspace 入口和使用指南
```

### 文件命名规范

| 文件夹 | 命名格式 | 示例 |
|--------|---------|------|
| Papers | `AuthorYear-ShortTitle.md` | `Vaswani2017-Attention.md` |
| Ideas | 自由命名，简短描述 | `LLM-SelfCorrection.md` |
| Projects | 项目名称 | `Multimodal-RAG.md` |
| Topics | 主题名称 | `RLHF-Overview.md` |
| Meetings | `YYYY-MM-DD-Description.md` | `2026-03-23-LabMeeting.md` |
| Daily | `YYYY-MM-DD.md` | `2026-03-23.md` |

## Templates

### 1. Paper Note (`Templates/Paper.md`)

```yaml
---
title:
authors: []
year:
venue:          # e.g. NeurIPS 2025, arXiv
tags: []        # e.g. [transformer, LLM, RLHF]
arxiv:          # arXiv ID, e.g. 2301.12345
url:            # 论文链接
code:           # GitHub repo 链接
status: unread  # unread / reading / finished
rating:         # 1-5 整数（1=一般, 3=不错, 5=必读）
date_added: "{{date}}"
---

## Summary
一句话概括这篇论文解决了什么问题、怎么解决的。

## Problem & Motivation
作者要解决什么问题？为什么重要？

## Method
核心方法/架构描述。

## Key Results
主要实验结果和 takeaway。

## Strengths & Weaknesses
个人评价。

## Mind Map
```mermaid
mindmap
  root((Paper Title))
    Problem
    Method
    Results
```

## Connections
- Related papers:
- Related ideas:
- Related projects:

## Notes
其他想法、疑问、启发。
```

### 2. Idea (`Templates/Idea.md`)

```yaml
---
title:
tags: []
status: raw     # raw / developing / validated / archived
date_created: "{{date}}"
---

## Core Idea
一句话描述这个 idea。

## Motivation
为什么觉得这个方向值得做？

## Related Work
- [[]]  — 链接到相关论文笔记

## Rough Plan
初步的实现思路或实验设计。

## Open Questions
还没想清楚的问题。
```

### 3. Project (`Templates/Project.md`)

```yaml
---
title:
tags: []
status: planning  # planning / active / paused / completed
date_started: "{{date}}"
---

## Goal
这个项目要达成什么？

## Papers
- [[]]  — 核心参考论文

## Ideas
- [[]]  — 关联的 idea

## Progress Log
- {{date}}:

## TODOs
- [ ]

## Results & Findings

## Notes
```

### 4. Topic (`Templates/Topic.md`)

```yaml
---
title:
tags: []
status: draft   # draft / active / stable
date_updated: "{{date}}"
---

## Overview
这个主题的背景和核心问题。

## Paper Comparison

| Paper | Year | Method | Key Contribution |
|-------|------|--------|-----------------|
| [[]]  |      |        |                 |

## Key Takeaways
主要结论和趋势。

## Open Problems
该领域尚未解决的问题。
```

### 5. Meeting (`Templates/Meeting.md`)

```yaml
---
title:
date: "{{date}}"
attendees: []
tags: []
---

## Agenda

## Discussion Notes

## Action Items
- [ ]

## Follow-ups
- [[]]  — 链接到相关论文/项目
```

### 6. Daily Note (`Templates/Daily.md`)

```yaml
---
date: "{{date}}"
---

## Focus
今天计划做什么。

## Reading Log
- [[]]  — 今天读了什么

## Quick Notes
随手记录的想法和发现。

## Tomorrow
明天要跟进的事项。
```

### 7. AI Prompt (`Resources/AI-Prompts.md`)

放在 `Resources/` 文件夹（非 Templates，避免出现在模板选择器中）。收录常用 prompt，方便在 Claudian 或外部 Claude 对话中使用。

```markdown
# AI Prompts for Research

## 论文总结 Prompt

请按照以下格式总结这篇论文，用中英混用的风格（专有名词用英文）：

---

## Summary
一句话概括。

## Problem & Motivation
作者要解决什么问题？为什么重要？

## Method
核心方法/架构描述。

## Key Results
主要实验结果和 takeaway。

## Strengths & Weaknesses
你的评价。

## Connections
可能相关的研究方向或论文。

---

论文信息：[在此粘贴论文标题/链接/关键内容]
```

## Tag System

### 标签分类

| 类别 | 示例 | 用途 |
|------|------|------|
| 领域 | `LLM`, `CV`, `RL`, `multimodal`, `diffusion` | 研究方向 |
| 方法 | `transformer`, `RLHF`, `distillation`, `RAG` | 技术方法 |
| 会议 | `NeurIPS`, `ICML`, `ICLR`, `ACL`, `CVPR`, `arXiv` | 论文出处（可选，`venue` 字段已记录详细信息） |
| 任务 | `text-generation`, `image-classification`, `alignment` | 具体任务 |

### 标签规范

- 使用术语的通用写法（如 `LLM`, `RAG`, `NeurIPS`, `diffusion`, `alignment`）
- 不嵌套，保持扁平
- 自由创建新标签，定期在 Tag pane 整理合并

## Linking Strategy

| 场景 | 做法 |
|------|------|
| 论文之间有关联 | Paper Connections 区域用 `[[AuthorYear-ShortTitle]]` 互链 |
| Idea 来自某篇论文 | Idea 的 Related Work 链接到 Paper |
| Project 基于 idea/paper | Project 的 Papers 和 Ideas 区域链接 |
| Topic 综述汇总论文 | Topic 对比表格中用 `[[]]` 链接每篇论文 |
| Meeting 讨论了某个项目 | Meeting 的 Follow-ups 链接到 Project 或 Paper |

核心原则：笔记通过 `[[]]` 链接形成网络，通过 tags 做跨类别筛选。Graph view 展示知识图谱。

## AI-Assisted Workflow

### 工作流

1. **读论文**：把论文关键词、链接或 PDF 发给 AI（Claude），附上论文总结 prompt
2. **AI 生成初稿**：AI 按 Paper 模板格式输出笔记内容
3. **粘贴到 Obsidian**：用 Paper 模板新建笔记，粘贴 AI 输出
4. **阅读修改**：阅读 AI 生成的内容，手动修改或让 AI 修改
5. **补充关联**：填写 frontmatter 元数据、添加双向链接和 tags

### 使用渠道

- **Obsidian 内**：通过 Claudian 插件（已安装的社区插件，提供 Obsidian 内 Claude 对话功能）直接在笔记中调用 AI
- **外部对话**：在 Claude 网页/API 中使用 Resources/AI-Prompts.md 里的 prompt

## Daily Workflow Summary

| 场景 | 操作 |
|------|------|
| 读论文 | AI 生成初稿 → Paper 模板 → 阅读修改 → 加链接和 tags |
| 有新想法 | Idea 模板 → 记录 → 链接触发灵感的论文 |
| 开始新项目 | Project 模板 → 链接 paper 和 idea → Progress Log 持续更新 |
| 整理主题 | Topic 模板 → 对比表格汇总论文 → 更新 takeaways |
| 开会后 | Meeting 模板 → 记录 → Action Items 列待办 → Follow-ups 链接 |

## Obsidian Settings

需要配置的 Obsidian 设置：

- **Attachments folder**: 设为 `Attachments/`
- **Templates plugin**: 开启核心模板插件，模板文件夹设为 `Templates/`
- **Tags pane**: 开启，方便浏览和管理标签

## README.md

根目录的 README.md 包含：
- Workspace 结构说明
- 各模板的使用方法
- 标签规范速查
- AI 辅助工作流说明
- 常用 prompt 速查（或链接到 Resources/AI-Prompts.md）
