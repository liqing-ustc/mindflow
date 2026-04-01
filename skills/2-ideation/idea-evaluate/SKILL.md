---
name: idea-evaluate
description: >
  当用户说"评估一下这个 idea""这个可行吗"，
  从 novelty/feasibility/impact/risk/evidence 五维评估研究 idea
argument-hint: "<idea> [criteria]"
allowed-tools: Read, Edit, Glob, Grep, WebSearch
---

## Purpose

给定一个研究 idea，它系统性地从五个维度进行评估：

| 维度 | 含义 |
| :--- | :--- |
| **Novelty** | 与已有工作的差异化程度——这个 idea 是否真的新？ |
| **Feasibility** | 当前资源条件下能否执行——有没有致命工程障碍？ |
| **Impact** | 若成功，对领域的贡献——有多少人会在意这个结果？ |
| **Risk** | 主要失败模式和概率——分越高代表风险越低 |
| **Evidence** | 当前支撑假设的证据强度——有多少先验支撑这个方向？ |

评估结果包含五维评分、总分、Reasoning 和可选 Suggestions，供调用方决策使用。

## 输入格式

idea-evaluate 支持两种输入：

1. **文件路径**: 如`[[Ideas/xxx.md]]`，用 Read 打开文件，提取信息。
2. **结构化文本**：候选 idea 描述。

## Steps

### Step 1：读取相关 Paper 笔记

根据输入类型获取相关论文：
- 若输入为文件路径，从提取Related Work的wikilinks，逐一 Read 对应的 Paper 笔记。
- 若输入为结构化文本，根据 idea描述 中的关键词，用 Grep 在 `Papers/` 中搜索最相关的 2-4 篇笔记并读取。

从每篇笔记中提取：

- **Summary**：论文核心贡献一句话
- **Method**：方法要点（判断与 idea 的差异化）
- **Key Results**：主要实验结果（判断 idea 的 Novelty 和 Evidence）
- **Strengths & Weaknesses**：先前工作的局限（判断 idea 的 Feasibility 和 Impact）

### Step 2：WebSearch 补充外部证据

用 WebSearch 搜索与 idea 核心假设相关的最新工作（vault 外的论文、博客、技术报告）：
- 搜索关键词从 hypothesis 和 approach sketch 中提取
- 重点关注：是否已有非常相似的工作（影响 Novelty）、是否有新的实验证据支持或反驳假设（影响 Evidence 和 Risk）
- 将发现整合到后续评分中，若发现高度相似的已有工作需在 Novelty 说明中注明

### Step 3：读取 DomainMaps 上下文

1. 用 Read 打开 `DomainMaps/_index.md`，定位与该 idea 相关的 domain（依据 tags 或 hypothesis 中的关键词）。
2. 用 Read 打开对应的 `DomainMaps/{Name}.md`，重点阅读：
   - **Active Debates**：领域当前争议（判断 Novelty 和 Impact）
   - **Open Questions**：未解决问题（判断 Impact 和 Evidence）
   - **Key Methods / Baselines**：主流方法（判断 Feasibility）

若找不到对应 domain 文件，跳过此步，并在评估记录中注明"DomainMaps 无对应条目，评估基于 Paper 笔记"。

### Step 4：五维评估打分

综合前三步收集的信息，对以下五个维度分别给出 **1-5 分**和简要说明（1-3 句话）：

#### Novelty（1-5）
评估 idea 与已有工作的差异化程度：
- **5**：核心方法/框架在 vault 中无先例，与相关论文有明确区分
- **3**：有新角度，但与已有工作重叠较多，需要进一步差异化
- **1**：与已有论文高度重复，几乎无新贡献

#### Feasibility（1-5）
评估当前资源条件（算力、数据、工程能力）下能否在合理时间内完成：
- **5**：可用已有工具/数据直接实现，技术路径清晰
- **3**：需要较大工程投入，但无不可逾越的障碍
- **1**：存在致命依赖（专有数据/硬件/外部合作），短期无法启动

#### Impact（1-5）
评估若实验成功，对领域的贡献和影响力：
- **5**：直接解决 DomainMaps Open Questions 或 Active Debates，有顶会潜力
- **3**：对领域有增量贡献，但非核心问题
- **1**：结论意义有限，受众极小

#### Risk（1-5，分越高风险越低）
列举 1-3 个主要失败模式，评估综合风险水平：
- **5**：假设有充分先验支持，失败模式已知且可控
- **3**：核心假设未经验证，存在中等概率的负面结果
- **1**：假设高度投机，现有证据薄弱，失败概率极高

#### Evidence（1-5）
评估当前支撑 hypothesis 的证据强度：
- **5**：相关论文或 ablation 直接佐证了核心假设
- **3**：有间接证据或类比支持，但无直接实验验证
- **1**：纯理论推测，vault 中无任何支撑证据

## Verify

- [ ] 5 个维度均有评分（1-5）和简要说明
- [ ] Novelty line 已按格式输出（`**Novelty**: X/5 — closest works: ...`），closest works 引用指向 vault 中已有的 Paper 笔记
- [ ] 总分已计算
- [ ] Reasoning 已给出（2-4 句话）

## Guard

- **不修改 hypothesis**：`hypothesis` 是 idea-generate 的职责范围，idea-evaluate 只读取不修改。
- **评估必须基于可追溯证据**：每个维度的说明必须能对应到 vault 中的具体笔记（Paper、DomainMaps、已有 Idea）。禁止凭空判断——若无足够证据支撑某维度评分，在说明中注明"证据不足，保守估计"。
- **语言规范**：中文正文 + 英文技术术语（模型名、方法名、benchmark 名保持英文，不翻译）。

## Examples

**示例：从文件路径评估 idea**

```
/idea-evaluate --idea "[[Ideas/VLA-GoalConditionedRecovery.md]]"
```

1. Read Idea 文件 → 提取信息
2. Read 相关 Paper 笔记 → 确认 OpenVLA 和 RT-2 均无 recovery mechanism
3. WebSearch "VLA goal-conditioned recovery" → 未发现高度相似工作，有 classical robotics recovery 文献佐证
4. Read DomainMaps/VLA.md → Active Debates 包含 OOD 鲁棒性
5. 五维评分：Novelty 4 + Feasibility 3 + Impact 4 + Risk 3 + Evidence 3 = **17/25**
6. Novelty line：`**Novelty**: 4/5 — closest works: [[Papers/2403-OpenVLA]], [[Papers/2312-RT2]]`
7. Reasoning：方向有价值，Novelty 和 Impact 强，短板在 Feasibility（需构建 failure detection dataset）和 Evidence（VLA 场景无直接先验）
8. Suggestions：先用现有 benchmark failure case 做 pilot experiment；调研 manipulation recovery 文献补充 Evidence
