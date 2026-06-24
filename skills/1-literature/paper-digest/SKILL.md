---
name: paper-digest
description: Use when user asks to "read paper", "analyze paper", "summarize paper", "读论文", "分析文献", "帮我看一下这篇paper", "论文笔记", or provides a PDF file that appears to be an academic paper.
argument-hint: "[URL / PDF path / title]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

## Purpose

给定一篇论文或技术 blog 的来源（URL、PDF 路径、论文标题或者关键词），它获取或读取内容、提炼核心信息，生成结构化笔记。

支持两种内容类型：
- **paper**：学术论文
- **blog**：所有 blog 类文章（tech blog，product blog 等）

## Operating Modes

- **Local / offline claim workflow**：当论文正文、PDF、markdown 源文件、已在当前上下文中提供全文的 URL 内容、URL 的本地抓取结果、或已有 `Papers/` 笔记已经可被 agent 读取时，可以直接进入 Step 3 写作或补写 `## Claims`。这种模式不要求 WebSearch、WebFetch、Semantic Scholar、Hugging Face、GitHub API 或任何 paper-fetch 步骤；这些能力不是从本地材料抽取 / 校验 `## Claims` 的前置条件。
- **Acquisition / enrichment workflow**：当输入只有标题、关键词、缺失的 URL、或源材料不完整时，执行 Step 2 的官方源发现、抓取和 metrics enrichment。WebSearch/API/paper-fetch 是寻找缺失源材料和补充影响力指标的获取 / 增强选项，保留原有能力；失败按 Step 2.4 和 Step 5 记录，不阻塞 `## Claims` 从已读文本中生成。

已有 paper note 之后，claim extraction 和 `cross-paper-analysis` 都只消费本地 markdown：`paper-digest` 写入的 `## Claims` section 可在离线状态下被 `cross-paper-analysis` 读取、聚合和对比，不需要网络、外部 API、数据库或 vector index。

## Steps

### Step 1：Dedup 预检

先扫一遍 `Papers/`，避免对一篇已有笔记重复 digest。若找到对应笔记 → **立刻停止**，告知用户已有笔记 [[xxx]]，询问是否需要 覆盖 / 更新 / 取消

### Step 2：Fetch / Acquisition（仅在源材料缺失时）

若 Step 1 命中已有 note，或用户提供了 agent 可直接读取的本地 PDF / markdown / 已 materialized 的 URL 内容或源文本，则不要为了 claim extraction 重新跑 WebSearch 或 API；直接使用这些本地材料进入 Step 3。若需要生成完整新笔记但 metrics 无法联网获取，按 Step 2.4 写 `null` 和 Step 5 `issues`，不要让 metrics 阻塞 `## Claims`。

#### Step 2.1：寻找官方源

一篇内容常有**三类官方源**：
- **paper**：arXiv 或者 PDF URL，论文的权威文本来源
- **website**：project page、官方博客文章等
- **github**：代码仓库的 README

根据输入信息寻找这三类官方源
**Acquisition / enrichment workflow 中用 WebSearch 兜底，不可跳过；Local / offline claim workflow 中不要求 WebSearch**
综合判断找到的源是否来自于官方，若不是，则丢弃

#### Step 2.2：抓取源、生成源文件

对上一步发现的每类源，按下表抓取到 **`/tmp/{ShortTitle}/`** 目录下。先创建目录。

| 源       | 抓取方式                                                                                                                                                                                                                                                                                                                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| paper   | **arxiv**: Bash `node {skill_dir}/scripts/defuddle_parse.mjs <url> -o /tmp/{ShortTitle}/paper.json`（同时写 sibling `paper.md`）。先试 `"https://arxiv.org/html/{arxiv_id}"`，失败则 `"https://ar5iv.labs.arxiv.org/html/{arxiv_id}"`。<br>**PDF**: Bash `curl -sL <url> -o /tmp/{ShortTitle}/paper.pdf && uv run {skill_dir}/scripts/pdf_to_md.py /tmp/{ShortTitle}/paper.pdf` → 输出 `paper.md` + `images/`。 |
| website | Bash `node {skill_dir}/scripts/defuddle_parse.mjs "<url>" -o /tmp/{ShortTitle}/website.json`（同时写 sibling `website.md`）                                                                                                                                                                                                                                                                                                       |
| github  | Bash `curl -sL https://raw.githubusercontent.com/<org>/<repo>/main/README.md -o /tmp/{ShortTitle}/github.md`。若 main 分支不存在，试 master。                                                                                                                                                                                                                                                   |

**记下每类 source 的 `local_path`。**

#### Step 2.3：检查生成的源文件

读取生成的源文件，检查是否出现以下问题：

| 问题                                                                                                                                                                                                                                            | 应用源                | 失败处理                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 文件不完整                                                                                                                                                                                                                                         | 全部                 | 返回上一步，重新抓取                                                                                                                      |
| video 和 figure 的 URL 丢失或者不完整                                                                                                                                                                                                                  | website            | 用 `curl` 抓取 raw HTML，找到完整 URL 后补充到源文件                                                                                           |
| **多 panel figure 只抓到第一张**：arxiv HTML 把 multi-panel 图包成 `<figure class="ltx_figure"><div class="ltx_flex_figure"><div class="ltx_flex_cell"><img></div>×N</div></figure>`，defuddle 默认只取第一张。逐 figure 检查源里 `ltx_flex_figure` 块的 sub-image 数量是否齐全 | paper (arxiv html) | 用 `curl` 抓 raw HTML 把同 figure 所有 `<img src=...>` URL 补全；嵌入时按 [[references/obsidian-syntax \| obsidian-syntax]] §2.3 的 flex 写法并排 |

#### Step 2.4：影响力指标

按源存在性抓取，产 `/tmp/{ShortTitle}/metrics.json`。缺失源对应块 `null`，不省略字段。

**Citation** — Semantic Scholar `/paper/batch` POST 匿名模式（单篇也用 batch，避免 429 累积 IP 惩罚）：

```bash
curl -sX POST 'https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount,influentialCitationCount,publicationDate' \
  -H 'Content-Type: application/json' -d '{"ids":["arXiv:<arxiv_id>"]}'
```

匿名模式共享 IP 配额，偶发 429 正常 —— retry 1 次 + 30s backoff；仍失败则 fallback：WebFetch `https://scholar.google.com/scholar?q=arxiv+<arxiv_id>` 取 top hit 的 "Cited by N"，**单发间隔 ≥30s**（并发必 CAPTCHA），`citation_source="scholar"` + `influential_citations=null`。两路都失败则 `paper` 块置 `null`，不阻塞 digest。批量复核（≥10 篇）时 S2 极易触发 >24h IP 锁定，优先串行 + 每篇间隔 ≥3s，并准备好接受中途降级为 Scholar-only 或 `null`。

**HF upvotes** — `curl -s "https://huggingface.co/api/papers/<arxiv_id>"` 取 `.upvotes`，404 → null。

**GitHub** — 优先 `gh api "repos/<owner>/<repo>"` + `gh api "repos/<owner>/<repo>/commits?since=<90d ago ISO>&per_page=100"`（5000/hr）；未登录时 fallback `curl https://api.github.com/...`（60/hr，≥30 repo 会 403）。取 `stargazers_count` / `forks_count` / `open_issues_count` / `pushed_at`；commits 数组长度即 90d commits（上限 100 标 `"100+"`）。派生 `pushed_days_ago`，`is_stale = pushed_days_ago > 180 AND commits_last_90d == 0`。

**Schema**：

```json
{
  "measured_at": "YYYY-MM-DD",
  "paper":  {"citation_count": N, "influential_citations": N, "citation_velocity_per_month": N.N, "months_since_publish": N, "citation_source": "s2"|"scholar"},
  "hf":     {"upvotes": N},
  "github": {"stars": N, "forks": N, "open_issues": N, "pushed_days_ago": N, "commits_last_90d": "N"|"100+", "is_stale": bool}
}
```

`citation_velocity_per_month = citationCount / max(months_since_publish, 1)`。单 API 失败 → 对应块 `null`，原因记 Step 5 log 的 `issues`，不阻塞 digest。

各 API 单独失败（网络错、404、schema 变化）→ 对应块置 `null` 并把原因记入 Step 5 log 的 `issues`，不因此阻塞整个 digest。

---

### Step 3：笔记生成与保存

仔细阅读生成的所有源文件，生成笔记。

**读取两个参考文件**：
- **模板**：`{skill_dir}/references/paper-note-template.md`
- **Syntax 参考**：vault 根目录 `references/obsidian-syntax.md` —— 公式 / 图 / 视频 / 表格的 Obsidian-specific 语法 quirks（全局，写任何笔记都应遵守）
- **Claim 参考**：vault 根目录 `references/claim-protocol.md` —— `## Claims` 的结构化 claim/evidence/counterevidence/contradictions 协议

#### 笔记结构

**模版顺序**：Frontmatter → `## Summary` → `## Claims` → **Body**（内容解读） → `## 关联工作` → `## 论文点评`

**撰写顺序**：Body → Claims → 关联工作 → 论文点评 → Summary → Frontmatter

**撰写逻辑**：每一步的产出都依赖前面已写的内容，倒序写以保证每个判断都 grounded 在已有内容上，而不是凭印象先填。
- **Body**：论文本身的解读，不依赖其他段落。
- **Claims**：从 Body 和源文件中抽取 3-8 条结构化 claim，必须符合 `references/claim-protocol.md`。
- **关联工作**：论文在 landscape 中的位置，需先理解论文本身。
- **论文点评**：价值判断，依赖对论文本身的解读、和关联工作之间的关系、论文影响力指标。
- **Summary**：笔记全文总结，依赖对论文本身的理解以及其点评。
- **Frontmatter**：根据笔记内容的简单回填。

**Body**（内容解读）：
- **批判性阅读**：综合源文件内容和你自己的理解，生成笔记，不要机械翻译
- 综合参考源文件的结构确定层级结构，**要保留源内容的核心结构和要素**，不要过于简略和压缩内容
- 从所有源文件中，按需挑选 figures / equations / tables / videos 嵌入合适位置
- 加入你自己的理解，标出有疑问的地方：`> ❓ ...`

**Claims**（结构化主张）：
- 可以从当前笔记 Body、已有本地源文件、或已有 `Papers/` note 中离线抽取；只要 evidence 能指向具体 source section / figure / table / experiment，就不需要 WebSearch/API/paper-fetch 参与。
- 在 `## Summary` 之后、Body 之前写且只写一个 `## Claims` section。
- 写 3-8 个 `### Claim: <short title>` block；每个 claim 必须是可证伪的一句话，不写泛泛 summary。
- 每个 block 必须按 `references/claim-protocol.md` 的 canonical fields 精确顺序填写：`claim_id`, `claim`, `type`, `scope`, `stance`, `confidence`, `grounding`, `evidence`, `counterevidence`, `contradictions`, `impact`, `status`, `provenance`。
- `evidence` 必须至少包含一个指向具体 source section / figure / table / experiment 的 Obsidian wikilink，不能写 `none`；`counterevidence` 和 `contradictions` 若未知可写 `none`，否则写 claim_id 或 wikilink。
- `claim_id` 使用 `C-YYYYMM-<slug>`，`status` 初始通常为 `raw`，`provenance` 记录 `source=paper-digest; extracted_from=...; captured_at=YYYY-MM-DD; method=direct extraction`。
- 不保留模板里的 claim 注释，不输出未替换的待填标记或占位 claim block。

**Teaser 处理**：若某类源文件里存在明确是 overview / concept / motivation 用途的 figure 或 video（通常在 intro / abstract 段），嵌入到笔记 `## Summary` 下。

#### 不变的硬规

- **装饰性图片**：OG image / social card / banner / favicon 一律不嵌入。
- **模板注释**：模板里的 `%% ... %%` 提示必须全部替换或整块删除，禁止外泄到正文。
- **PDF 源的 images**：把需要嵌入的图从 `/tmp/{ShortTitle}/images/` 拷到 `Papers/assets/{ShortTitle}/`，**拷贝时重命名为 `fig{N}-{FigureTitle}.{ext}`**——`N` 是图在论文中的编号，`FigureTitle` 是从 caption 提炼的短标题。笔记中用 `![](Papers/assets/{ShortTitle}/fig{N}-{FigureTitle}.{ext})` 引用。

#### 文件名 + Tag + Write

**文件名格式**：`YYMM-ShortTitle.md`

- `YYMM`：取自 `date_publish` 的年份后两位 + 月份，如 `2603`（2026年3月）
- `ShortTitle`：标题的 CamelCase 缩写，2-4 个关键词，如 `EvoScientist`、`RoboClaw`、`DiffusionPolicy`
- Blog 同理，如一篇 2026 年 2 月的 blog 关于 scaling laws → `2602-ScalingLaws.md`

**Tag 选择**：阅读 vault 目录下的 `{vault_root}/references/tags.md`，按照规范选择 tag。

**写入文件**：将笔记保存到 `Papers/{笔记文件名}.md`。

---

### Step 4：Wikilink 注入

扫描写出的笔记正文，识别技术术语，把能在 vault 找到对应笔记的 term 就地升级成 `[[...|term]]` wikilink。

**⚠️注意**：
1. **只处理笔记正文**，跳过 frontmatter、代码块
2. **识别候选术语**：论文（`π0`、`RT-2`），核心方法 / 算法（`Flow Matching`、`FAST tokenizer`、`Action Chunking`）， 数据集（`DROID`），模型（`PaliGemma`、`Gemma-2B`、`SigLIP`）。 **排除**：宽泛类别词（`VLA`、`world model`、`RL`、`transformer`）、论文自己的术语
3. 对每个候选 term 执行 **Concept Glob 协议**
4. 把所有**未命中**的 term 汇总成一个 dead-link inventory
5. **（必须做！！！）检查所有插入的 wikilink，修正所有不合理的情况** 

#### Concept Glob 协议

vault 的笔记命名约定是 `YYMM-CamelCase.md`（如 `2411-WorldModelSurvey.md`、`2410-Pi0.md`、`2604-GEN1.md`），**不是** `2411-World Model Survey.md`。所以朴素的 `Glob Papers/*<term>*.md` 对多词术语**几乎一定漏匹配**。

**匹配规则**：把 term 折叠成 CamelCase（去掉空格和 `-`），然后 Glob 三个可能的目录：

```
Glob Papers/*<TermCamelCase>*.md
Glob Concepts/*<TermCamelCase>*.md     # 若目录存在
Glob DomainMaps/*<TermCamelCase>*.md   # 若目录存在
```

例：
- `"Flow Matching"` → `*FlowMatching*.md`
- `"GEN-1"` → `*GEN1*.md`
- `"π0.5"` → `*Pi05*.md`（Unicode / 特殊字符按读音或常用 ASCII 折叠）

任一目录命中即视为存在。命中后 Read 文件 frontmatter 的 `title:` 字段**确认主题相关**再注入——Glob 可能有无关的子串 false positive（如 `*Flow*` 匹配 `SnapFlow`）。

---

### Step 5：日志记录

用 Edit（或 Write 若文件不存在）将以下格式的 log entry 追加到 `Workbench/logs/YYYY-MM-DD.md`（日期为今天）：

   ```markdown
   ### [HH:MM] paper-digest
   - **input**: <source 的原始内容>
   - **output**: [[Papers/{笔记文件名}]]
   - **observation**: <一句话描述论文核心贡献>
   - **extracted**: figures=<N>, tables=<N>, equations=<N>, videos=<N>  # Step 2 所有源文件里各类元素的总数（跨源去重后的 ceiling，即笔记最多能嵌多少）
   - **embedded**: figures=<N>, tables=<N>, equations=<N>, videos=<N>, wikilinks=<N>  # 最终笔记里实际出现的各类元素条目数
   - **dead_links**: term1, term2, ...  # Step 4 未命中的 term
   - **issues**: <执行过程中遇到的问题，如源获取失败、defuddle 解析失败；无问题则写 "none">
   ```

若日志文件不存在，先创建文件（包含一级标题 `# YYYY-MM-DD`），再追加 entry。

## Verify

### Step 2 (Fetch) 自检
- [ ] 若执行 Acquisition / enrichment workflow：三类源（paper / website / github）均已尝试发现；WebSearch 兜底已对每一类跑过（不可跳过）
- [ ] 若执行 Local / offline claim workflow：已记录使用的本地 PDF / markdown / 已有 note / 已 materialized URL 内容；未把 WebSearch、WebFetch、Semantic Scholar、Hugging Face、GitHub API 或 paper-fetch 当作 `## Claims` 的前置条件
- [ ] 若执行 Acquisition / enrichment workflow：paper / website 源已通过 defuddle 抓到 `/tmp/{ShortTitle}/paper.json` 或 `website.json`；github 源已通过 `curl` 抓到同目录下的 `github.md`
- [ ] 若执行 Acquisition / enrichment workflow：Step 2.3 两项检查（文件完整性；website 的 video/figure URL 完整性）均已过；未过的已记入 Step 5 log 的 `issues`
- [ ] 若执行 Acquisition / enrichment workflow：Step 2.4 已产出 `/tmp/{ShortTitle}/metrics.json`，含 `measured_at`；存在的源对应 metrics 块非 null；缺失源对应块为 null；API 失败已记入 Step 5 log 的 `issues`

### Step 3 (Compose & Save) 自检
- [ ] `Papers/{笔记文件名}.md` 已创建
- [ ] 笔记含且仅含一个 `## Claims` section，位置在 `## Summary` 之后、正文 Body / `## 关联工作` 之前
- [ ] `## Claims` 中有 3-8 个 `### Claim:` block，且每个 block 都含有 canonical fields：`claim_id`, `claim`, `type`, `scope`, `stance`, `confidence`, `grounding`, `evidence`, `counterevidence`, `contradictions`, `impact`, `status`, `provenance`
- [ ] 每个 claim block 的字段顺序与 `references/claim-protocol.md` 完全一致，`claim_id` 符合 `C-YYYYMM-<slug>`，无重复 ID
- [ ] 每个 `evidence` 字段至少有一个具体 Obsidian wikilink；`counterevidence` / `contradictions` 要么是 `none`，要么是 claim_id 或 wikilink
- [ ] `## Claims` 可从已有本地材料离线抽取和验证；after-note `cross-paper-analysis` 只读取本地 `## Claims` sections，不要求网络/API
- [ ] 没有遗留模板注释、未替换的待填标记，也没有占位 claim block
- [ ] 笔记中所有 URL / 数字 / 公式 / 表格 **均可在 Step 2 的某类源文件里 grep 到**，无新增
- [ ] 笔记 body 的 prose（方法名、技术 claim、数值）**均可追溯到主文本源文件对应 section 的原文**，无凭印象补写
- [ ] 每个 figure / equation / table / video **就近放置**——放在相关讨论的段落附近
- [ ] Teaser 媒体（若存在）嵌在 `## Summary` 段内
- [ ] 未嵌入 OG image / social card / banner 等装饰性图片
- [ ] **每个嵌入元素都有紧邻的描述**，说明这张图/表/视频在展示什么，而不是光秃秃嵌入或重复 section 标题
- [ ] **每个元素的嵌入位置与其描述在语境上一致**：元素不应被放在会误导读者的上下文（例：一段讲 "zero-shot 失败" 的文字下方不能紧接一个展示成功的视频）。若描述和周围文字冲突，更换嵌入的位置
- [ ] **Rating 三处一致**：Summary 里的 Rating、frontmatter 的 `rating` 字段、`### Rating` 段的分数完全对应
- [ ] **Rating 段有 Metrics 行**：`### Rating` 段首行是 `**Metrics** (as of YYYY-MM-DD): ...`，数字来自 `/tmp/{ShortTitle}/metrics.json`，缺失源对应字段写 "N/A（原因）"
- [ ] `#### Claim 可验证性` 已明确从 `## Claims` 派生或逐条 cross-check 结构化 claim 的 evidence/counterevidence/contradictions

### Step 4 (Wikilink 注入) 自检 

**Read 最终写入的笔记文件**，肉眼逐个检查每个 `[[...]]` occurrence 是否合法。对每个 wikilink 过一遍下面的问题，任一 "否" 即需修复：

- [ ] **结构合法**：是 `[[文件名|显示文本]]` 形式，`[[` 和 `]]` 成对，`|` 恰好一个（表格 cell 内的 alias 分隔符已用 `\|` 转义）
- [ ] **无嵌套**：`|` 之后到 `]]` 之间是纯文本，不含另一个 `[[` —— 没有 `[[...|[[...|term]]]]` 这种双重嵌套
- [ ] **未污染路径**：wikilink 没有出现在 `Papers/xxxx-xxx.md` 这类文件路径字符串的中间（即路径里的 term 没有被错误包装成 `Papers/2405-[[2405-Octo|Octo]].md`）
- [ ] **未污染更长术语**：短 term（如 `π0`）的注入没有破坏更长术语的 alias（如 `[[2504-Pi05|π0.5]]` 里的 `π0` 没有被再次包装）

### Step 5 (Log) 自检
- [ ] 日志已追加到 `Workbench/logs/YYYY-MM-DD.md`
