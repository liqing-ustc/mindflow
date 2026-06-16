# Projects — 笔记组织规范（所有项目共享）

本文件被 `Projects/<proj>/` 下的所有任务自动继承，定义笔记如何分类与存放。项目特有内容（repo 列表、playbook 位置、Goal）写在各自的 `Projects/<proj>/CLAUDE.md`。

## 三类笔记，按「给谁看 × 生命周期」分

| 类型 | 给谁看 | 放哪 | 写法 |
|---|---|---|---|
| **研究主线** | Owner 读 | `Projects/<proj>/{main.md, experiments/*.md, discussions/}` | 问题/假设/结果/insight/决策；TL;DR 置顶；**不内联工程细节**，只向下链接 |
| **任务记录** | agent / 调试 | `Projects/<proj>/worklog/<date>-<issue-id>.md`（**worklog/ 整体不进 git**，含 job 工件） | 这次干了啥、什么坏了怎么修、commit/job/路径、走过的死路；篇内标注碰过的 repo + commit。本机草稿，可丢——持久价值靠蒸馏进工程约定 |
| **工程约定** | agent 动手前必读 | 按范围分档（见下） | 复现性结论，去重、保持 current |

## 推荐目录结构

```
Projects/<proj>/        # ← 每个项目 = 一个独立 git 仓库（项目 notes repo），非 vault repo
├── CLAUDE.md          # 项目特有：repo 列表、约定入口、Goal 指针（通法继承本文件）
├── main.md            # 研究主笔记：Goal / Baselines / Experiments 索引 / Next Steps / Progress Log
├── experiments/       # 各实验分析（<Name>.md）
├── discussions/       # 讨论 / 思考记录（<date>.md）
├── worklog/           # 每任务记录；【整个文件夹不进 git】本机草稿
│   ├── <date>-<issue-id>.md   #    每任务一篇叙事（append-only）
│   └── jobs/                  #    job yaml + 日志 + 产物（大 / 生成物，跟着任务走）
├── engineering.md     # 工程约定：项目专属 / 跨 repo（pipeline 接线、env、踩坑）；可扩成 engineering/
└── code/              #    工程实现（各 repo），已被 notes.git 的 .gitignore 排除
    ├── <repoA>/       #    独立 git repo —— 约定见各自 CLAUDE.md（@AGENTS.md / @notes/）
    └── <repoB>/
```

非强制模板，但新项目建议照此开局；已有项目逐步对齐。

## Git 分层（三层，互相独立）

- **每个 `Projects/<proj>/` 是一个独立 git 仓库**（项目 notes repo，如 `behavior-1k → 内部 gitlab .../notes.git`）——与外层 MindFlow vault repo、与 `code/` 下的代码 repo 都不同，各自独立推送 / 协作 / 权限。
- **外层 vault repo** 的 `.gitignore` 忽略整个 `Projects/`：项目笔记不进 vault repo。
- **项目 notes repo** 内 `.gitignore` 排除 `code/`（代码各有自己的 repo）与 `worklog/`（本机草稿）。
- **新建项目**：在项目目录 `git init` + 建对应远端 notes repo，不要并进 vault repo；提交研究笔记 / engineering.md 走项目 notes repo。

## 工程约定的范围阶梯（按「知识在哪儿恒为真」归档，与任务在哪跑无关）

- **repo 专属**（某 repo 怎么用 / 它的坑）→ 该 repo 的 `CLAUDE.md`（auto-load 入口；详情可链到 `<repo>/notes/`）
- **项目专属**（跨 repo 接线、本项目 env / pipeline）→ `Projects/<proj>/engineering.md`（或 `engineering/`）
- **跨项目通用**（cloudml / juicefs / git 等）→ 全局 skill（已有）

## 纪律

- **任务可能横跨多个 repo**：worklog 跟**任务**走（项目级、一份完整），不拆进各 repo。
- **动手前先读工程约定**：相关 repo 的 `CLAUDE.md` + 本项目 `engineering.md`。
- **蒸馏**：周期性把任务记录里反复出现的经验提升进工程约定（按范围分流），剪掉过时的；研究结论进研究主线。
- **高度递减**：研究笔记顶部 ~30 行就能拿到全部重点，工程细节一律下沉到任务记录 / 工程约定。
