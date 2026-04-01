---
name: idea-generate
description: >
   Generate and rank research ideas given a broad direction. Use when user says "找idea", "brainstorm ideas", "generate research ideas", or "what can we work on".
argument-hint: "<source> [constraints]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

## Purpose

给定一个方向，它先发散生成 8-12 个候选 idea，再经过粗筛和深度评估，最终保留 top 2-3 个可证伪的研究 idea，按 `Templates/Idea.md` 格式写入 `Ideas/`。它是从"发现问题"到"提出假设"的桥梁——将文献分析的输出（空白、矛盾、未解决问题）转化为可操作的研究假设。

## Steps

### Step 1：解析指令

解析核心意图：涉及什么任务（VLA/VLN/其他）、什么约束（few-shot / no-GPU / 理论向等）、期望的改进方向（性能提升、效率、泛化……）。

### Step 2：读取 DomainMaps，锚定领域已知边界

1. 用 Read 读取 `DomainMaps/_index.md`，找到相关的 domain（如 VLA、VLN、RL 等）。
2. 用 Read 读取对应的 `DomainMaps/{Name}.md`，重点关注：
   - `## Established Knowledge`：已有共识，生成 idea 时可以利用，但不应作为 contribution 点（除非有明确突破）。
   - `## Active Debates`：领域内仍有争议的问题，是生成 idea 的高价值区域——可以针对某个 debate 设计决定性实验或提出新框架。
   - `## Open Questions`：领域显式列出的未解决问题，可直接对应生成 idea。
3. 将 DomainMaps 的内容整合进 idea 生成时的"背景约束"：生成的 idea 要建立在 Established Knowledge 之上，要么解决 Open Questions，要么推进 Active Debates。

### Step 3：生成候选 idea

综合 Step 1-2 的材料，生成 **8-12 个** 候选 novel ideas。**BE CREATIVE and BOLD!**

每个候选 idea 须包含以下要素（对应 `Templates/Idea.md` 的 section）：

- **Hypothesis**：一句话的可证伪断言，格式建议为"若……则……"或"我们假设……"。判断标准：这句话能否在合理资源范围内被实验证伪？
- **Motivation**：为什么这个方向值得研究？参考三个维度：（1）它解决了哪个知识空白或 Active Debate；（2）成功的话对领域有什么影响；（3）为什么现在是做这个的好时机（相关工具/数据已成熟？）。
- **Approach sketch**：初步的方法思路，不需要完整，但要有足够细节能判断可行性。说明核心技术路径（例如：用 LoRA fine-tuning + synthetic data augmentation 解决 few-shot adaptation）。
- **Expected outcome**：若 hypothesis 成立，实验应该观察到什么？用具体的 benchmark 或 metric 描述（如"在 LIBERO-Spatial 上 few-shot success rate 提升 >10%"）。

多个候选 idea 之间应有足够差异度，避免生成本质相同的变体：
- 可以在方法层面求变（不同技术路径解决同一问题）；
- 可以在问题层面求变（同一方法应用到不同开放问题）；
- 避免仅在超参或实现细节上差异的"伪多样性"。

### Step 4：粗筛（First-Pass Filtering）

对每个候选 idea 快速评估：

1. **约束检查**：若 `constraints` 参数被指定（如"不需要 GPU""偏理论"），检查是否符合。
2. **可行性检查**：现有资源能否实际开展实验？
   - 数据可获取性
   - 算力需求（估算 GPU-hours）
3. **影响力估算**：审稿人会在意这个结果吗？
   - "So what?" 测试：若实验成功，是否改变人们对该问题的认知？
   - 结论是 actionable 的，还是仅仅 interesting？

淘汰未通过任一检查的 idea，通常剩余 4-6 个。

### Step 5：深度验证（Deep Validation）

1. 对粗筛后存活的每个 idea，调用 `idea-evaluate` skill 根据 idea 的完整描述进行评估。
2. 根据评估结果选出 top 2-3 idea，并根据评估反馈对 idea 做进一步改进。

### Step 6：按模板写入 Ideas/ 文件

1. 读取 `Templates/Idea.md`，了解模板字段结构（frontmatter + sections）。
2. 为每个候选 idea 创建独立的 `Ideas/` 文件：
   - **文件名**：用描述性 CamelCase 名称，2-4 个关键词，体现 idea 的核心主张，如 `Cross-Domain-VLA-Transfer.md`、`FewShot-VLA-LoRA.md`。避免用 `Idea1.md` 此类无意义命名。
   - **去重检查**：用 Glob 扫描 `Ideas/` 目录，若已存在内容相近的文件（文件名或标题高度重叠），停止创建该 idea 并告知 Human，不覆盖已有文件。
   - 用 Write 将每个 idea 按模版保存到文件中。

### Step 7：追加日志

用 Edit（若文件不存在则用 Write）将以下格式的 log entry 追加到 `Workbench/logs/YYYY-MM-DD.md`（日期为今天）：

```markdown
### [HH:MM] idea-generate
- **input**: <source 参数内容>
- **output**: [[Ideas/Idea1Name]], [[Ideas/Idea2Name]], ...
- **observation**: <一句话描述本次生成的 idea 共同指向的研究方向>
```

## Verify

- [ ] `Ideas/*.md` 已创建（至少 1 个文件）
- [ ] 每个 idea 文件严格遵循 `Templates/Idea.md` 的 section 结构
- [ ] 日志已追加到 `Workbench/logs/YYYY-MM-DD.md`

## Guard

- **不修改任何已有 Idea 文件**：若 `Ideas/` 下已存在内容相近的文件，停止执行并告知 Human；不得覆盖或追加已有 Idea 文件的内容。
- **不捏造文献支持**：`## Hypothesis` 中 `closest works` 引用必须指向 vault 中 `Papers/` 目录下已存在的笔记（`[[Papers/YYMM-ShortTitle]]`）；若尚无相关 Paper 笔记，写"暂无相关笔记，建议先 paper-digest X"，不得引用不存在的链接。
- **不直接修改 agenda.md**：idea-generate 的产出只写入 `Ideas/`；是否将某个 idea 纳入 agenda 的 direction，由 agenda-evolve skill 或 Supervisor 决策，idea-generate 不擅自修改 `Workbench/agenda.md`。
- **hypothesis 必须可证伪**：若某个候选 idea 的假设无法在合理实验条件下被证伪（如过于宽泛的"改进 VLA 的泛化能力"），不得写入文件；须拒绝该候选，并在输出中说明原因，改换更具体的方向。
- **语言规范**：正文用中文撰写，英文技术术语（模型名、方法名、benchmark 名、任务名）保持英文，不做翻译。

## Examples
```
想个 idea：怎么让 VLN agent 在没见过的环境中泛化得更好
```

执行过程摘要：

1. **Step 1**：解析意图 → 任务=VLN，方向=unseen environment generalization；Grep `Papers/` 搜索 `VLN`、`generalization`、`unseen`，了解已有论文覆盖
2. **Step 2**：Read DomainMaps/VLN.md → Established Knowledge（预训练 vision-language 特征有效）、Active Debates（topological vs. metric map）、Open Questions（zero-shot transfer 到新环境）
3. **Step 3**：生成 10 个候选 idea（每个含 Hypothesis / Motivation / Approach sketch / Expected outcome / Risk），覆盖 environment augmentation、world model imagination、topological pre-training、cross-environment retrieval 等路径
4. **Step 4 粗筛**：排除需要大规模 3D 数据采集的方向，剩余 5 个
5. **Step 5 深度验证**：对 5 个 idea 调用 idea-evaluate，获取 Novelty 评分和 closest works，选出 top 3
6. **Step 6**：按模板写入 `Ideas/WorldModel-VLN-EnvTransfer.md`、`Ideas/TopoPretraining-UnseenNav.md`、`Ideas/CrossEnvRetrieval-VLN.md`，每个文件的 `## Hypothesis` 含 Novelty 评分
7. **Step 7**：追加日志到 `Workbench/logs/` 当天文件
