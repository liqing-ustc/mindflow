---
title: "Vision-Language-Action (VLA) Models 文献调研"
tags: [VLA, manipulation, flow-matching, cross-embodiment, survey]
status: draft
date_updated: 2026-03-27
scope:
  year_range: "2023-2026"
  max_papers: 8
  papers_found: 13
  papers_digested: 3
---

## Overview

Vision-Language-Action (VLA) 模型是将预训练 Vision-Language Models (VLMs) 扩展为 robot policy 的新范式，旨在通过统一视觉感知、语言理解和动作生成，构建跨任务、跨平台的通用机器人基础模型。该领域自 2023 年 RT-2 开创以来，经历了爆发式增长，短短三年内从"概念验证"演进到"真实家庭部署"。

**核心问题**：如何让机器人像 LLM 理解文本一样理解物理世界，并将互联网规模的视觉-语言知识迁移到机器人控制？传统 robot learning 受限于数据稀缺和 task-specific 设计，VLA 范式通过利用预训练 VLM 的泛化能力，有望突破这一瓶颈。

**研究活跃度**：2024-2025 年是 VLA 研究的井喷期——仅 arXiv 上的 VLA survey 就有 5+ 篇，主要会议（CoRL, RSS, ICML, NeurIPS）均有大量 VLA 论文。Physical Intelligence 的 π 系列（π₀ → π0.5 → π₀.₆）、Stanford/Berkeley 的 OpenVLA 系列、Hugging Face 的 SmolVLA 等形成了清晰的技术路线竞争格局。

**整体趋势**：
1. **Action representation 从 discrete 到 continuous**：RT-2 的 token 预测 → Octo 的 diffusion → π₀ 的 flow matching，控制频率从 3 Hz 提升到 50 Hz
2. **架构从 flat 到 hierarchical**：π0.5、Hi Robot、NaVILA 均采用高层语义推理 + 低层 action 生成的分层设计
3. **从 imitation 到 self-improvement**：π\*₀.₆ 的 Recap 算法首次实现了通用 VLA 的 RL 自我改进
4. **从大模型到高效模型**：SmolVLA（0.45B）和 OpenVLA-OFT 证明精心设计的小模型/优化方案可匹敌甚至超越大模型
5. **从实验室到真实世界**：π0.5 在全新家庭环境完成 10-15 分钟长时域任务，MEM 支持 15 分钟级记忆

## 技术路线

### 路线 1：Autoregressive Token Prediction（离散动作生成）

**代表论文**：[[2307-RT2|RT-2]]、[[2406-OpenVLA|OpenVLA]]

**核心思路**：将 robot action 离散化为 token（256 bins），复用 VLM 的 autoregressive next-token prediction 进行动作生成。这是最早也是最直观的 VLA 范式——"actions as language tokens"。

**优势**：
- 直接复用 VLM 架构和预训练权重，无需额外 action head
- 天然支持 language-conditioned control
- RT-2 展示了 emergent reasoning（符号推理、常识迁移）

**劣势**：
- 控制频率低（RT-2 约 3 Hz），无法进行灵巧操作
- 离散化损失动作精度
- Autoregressive 生成慢，序列长度线性增加延迟

**现状**：作为 VLA 范式的奠基工作具有历史意义，但已被 continuous action 方法全面超越。OpenVLA 作为开源 baseline 仍广泛用于对比实验。[[2502-OpenVLA-OFT|OpenVLA-OFT]] 通过 parallel decoding + continuous action + L1 regression 将 OpenVLA 性能从 76.5% 提升至 97.1%（LIBERO），证明 fine-tuning 设计选择比模型规模更重要。

### 路线 2：Flow Matching / Diffusion Action Generation（连续动作生成）

**代表论文**：[[2410-Pi0|π₀]]、[[2405-Octo|Octo]]、[[2506-SmolVLA|SmolVLA]]

**核心思路**：用 flow matching（或 diffusion）建模连续 action 分布，通过 action expert 独立于 VLM backbone 进行动作生成。Action chunking（一次预测多步）进一步提升控制频率。

**优势**：
- 高频连续控制（π₀ 达 50 Hz），支持灵巧操作
- Action expert 的 MoE 设计避免 action loss 破坏 VLM 预训练分布
- Flow matching 对 multimodal action distribution 建模更准确

**劣势**：
- 需要额外的 action expert 参数（π₀ 的 300M action expert）
- Flow matching 的 denoising 步骤增加推理计算
- 最优 action chunk 长度需要 task-specific 调优

**现状**：目前性能最强的 VLA 技术路线。π₀ 系列占据该路线的领导地位，SmolVLA（0.45B）证明了 flow matching action expert 可以在极小参数量下高效工作。[[2412-RoboVLMs|RoboVLMs]] 的 600+ 实验系统验证了 continuous action + policy head history fusion 是最优配置。

### 路线 3：Hierarchical VLM-VLA（分层架构）

**代表论文**：[[2504-Pi05|π0.5]]、[[2502-HiRobot|Hi Robot]]、[[2412-NaVILA|NaVILA]]

**核心思路**：将 policy 分为两层——高层 VLM 进行语义推理和子任务规划（"what to do"），低层 VLA 生成精细动作（"how to do"）。这对应认知科学中的 System 2（deliberative）+ System 1（reactive）。

**优势**：
- 自然解耦语义理解和运动控制，各层可独立优化
- 支持 open-ended 指令理解和实时用户纠正（Hi Robot）
- 适用于 long-horizon 多步任务
- 架构天然兼容 navigation + manipulation 统一（NaVILA 用语言动作桥接）

**劣势**：
- 高层和低层通常独立训练，缺乏 end-to-end joint optimization
- 高层推理延迟（~1 Hz）与低层控制频率（10-50 Hz）不匹配
- Error propagation：低层失败时高层不一定能感知

**现状**：成为 2025 年的主流趋势。π0.5 在全新家庭完成 10-15 分钟任务，Hi Robot 超越 GPT-4o 40%+。NaVILA 证明该架构可扩展到 navigation 领域。

### 路线 4：RL Self-Improvement（强化学习自我改进）

**代表论文**：[[2511-PiStar06|π*₀.₆]]、[[2603-RoboClaw|RoboClaw]]

**核心思路**：在 imitation learning 之后，通过真实世界部署经验进行 RL fine-tuning，突破 demonstration 数据质量的性能上限。π\*₀.₆ 的 Recap 算法用 advantage-conditioned policy extraction 绕过了 PPO 对 flow matching 的兼容性问题。

**优势**：
- 突破 imitation learning 天花板，从自身错误中学习
- Advantage conditioning 是 model-agnostic 的 RL 方法，兼容 flow matching
- 支持异构数据（demos + autonomous rollouts + interventions）统一训练

**劣势**：
- 仍需人工 reward labeling 和 intervention
- Exploration 策略简单，无 sophisticated exploration
- Batch offline RL，非 continuous online learning

**现状**：VLA 研究的最新前沿。π\*₀.₆ 在 laundry folding 等任务上实现 >2× throughput 提升，13 小时连续部署验证了实用性。RoboClaw 的 EAP（Entangled Action Pairs）提供了自主数据收集的替代方案。

## 发展时间线

| 时间 | 里程碑 | 意义 |
|:-----|:-------|:-----|
| 2023-07 | [[2307-RT2\|RT-2]] (Google DeepMind) | 🏆 VLA 范式开创：Actions as Tokens，证明 VLM→robot control 可行 |
| 2024-05 | [[2405-Octo\|Octo]] (UC Berkeley) | 首个开源 generalist robot policy，diffusion action head |
| 2024-06 | [[2406-OpenVLA\|OpenVLA]] (Stanford) | 7B 开源 VLA baseline，超越 55B RT-2-X，降低研究门槛 |
| 2024-10 | [[2410-Pi0\|π₀]] (Physical Intelligence) | 🏆 Flow matching + action expert 范式，50 Hz 灵巧操作 |
| 2024-12 | [[2412-NaVILA\|NaVILA]] (NVIDIA) | VLA 扩展到 navigation，语言作为 mid-level action |
| 2024-12 | [[2412-RoboVLMs\|RoboVLMs]] (Tsinghua/ByteDance) | 600+ 实验系统研究 VLA 设计选择 |
| 2025-02 | [[2502-HiRobot\|Hi Robot]] (Physical Intelligence) | Hierarchical VLM-VLA，超越 GPT-4o |
| 2025-02 | [[2502-OpenVLA-OFT\|OpenVLA-OFT]] (Stanford) | Fine-tuning 优化，26× 推理加速，97.1% LIBERO |
| 2025-04 | [[2504-Pi05\|π0.5]] (Physical Intelligence) | 🏆 Open-world generalization，全新家庭 10-15 分钟任务 |
| 2025-06 | [[2506-SmolVLA\|SmolVLA]] (Hugging Face) | 0.45B 紧凑 VLA，证明小模型可比大模型 |
| 2025-11 | [[2511-PiStar06\|π*₀.₆]] (Physical Intelligence) | 🏆 首次 VLA RL 自我改进，>2× throughput |
| 2026-03 | [[2603-MEM\|MEM]] (Physical Intelligence) | 多尺度记忆，15 分钟级长任务 |
| 2026-03 | [[2603-RoboClaw\|RoboClaw]] (HKU/Galbot) | Agentic VLA，自主数据收集 + long-horizon |

## Paper Comparison

| Paper | Year | 技术路线 | 核心方法 | 关键结果 | 局限性 |
|:------|:-----|:---------|:---------|:---------|:-------|
| [[2307-RT2\|RT-2]] | 2023 | Token Prediction | PaLM-E/PaLI-X + action tokenization | Emergent reasoning 3×提升 | 3 Hz 低频，55B 巨大，未开源 |
| [[2405-Octo\|Octo]] | 2024 | Diffusion | Transformer + diffusion head，27M/93M | 9 平台验证，开源生态 | 参数量小，无 VLM 预训练 |
| [[2406-OpenVLA\|OpenVLA]] | 2024 | Token Prediction | Llama 2 7B + DINOv2/SigLIP | 超 RT-2-X 16.5%，开源 | Autoregressive 低频 |
| [[2410-Pi0\|π₀]] | 2024 | Flow Matching | PaliGemma 3B + flow matching expert | 50 Hz，超越 OpenVLA/Octo | 数据配比 heuristic |
| [[2412-NaVILA\|NaVILA]] | 2024 | Hierarchical | VILA + mid-level language action + RL | R2R-CE 54% SR，real 88% | 仅 navigation |
| [[2412-RoboVLMs\|RoboVLMs]] | 2024 | Benchmark | 8 backbone × 4 架构，600+ 实验 | CALVIN 4.49 SOTA | 仅 table-top |
| [[2502-HiRobot\|Hi Robot]] | 2025 | Hierarchical | VLM planner + π₀ executor + synthetic data | 超 GPT-4o 40%+ IA | Navigation 有限 |
| [[2502-OpenVLA-OFT\|OpenVLA-OFT]] | 2025 | Optimized FT | Parallel decoding + continuous + L1 | LIBERO 97.1%，26× 加速 | 仅验证 OpenVLA |
| [[2504-Pi05\|π0.5]] | 2025 | Hierarchical + FM | Hierarchical inference + co-training | 全新家庭 50-85% | 无 memory |
| [[2506-SmolVLA\|SmolVLA]] | 2025 | Efficient FM | 0.45B + layer skip + community data | LIBERO 87.3%，快 40% | 短 horizon 为主 |
| [[2511-PiStar06\|π*₀.₆]] | 2025 | RL + FM | Recap: advantage-conditioned RL | >2× throughput，13h 部署 | 需人工 reward |
| [[2603-MEM\|MEM]] | 2026 | Memory + FM | 视频短期记忆 + 语言长期记忆 | 15min 任务 70-80% | 仅 π₀.₆ 验证 |
| [[2603-RoboClaw\|RoboClaw]] | 2026 | Agentic | VLM agent + EAP 自主数据收集 | +25% SR，-53.7% 人工 | Cloud VLM 延迟 |

## Key Takeaways

1. **Flow matching + hierarchical inference 是当前最强范式**：π₀ 系列的成功表明，VLM backbone + flow matching action expert + 高层语义推理的组合在灵巧操作上远超 autoregressive token 预测方法。

2. **Fine-tuning 设计比模型规模更重要**：OpenVLA-OFT（7B，优化 fine-tuning）达到 97.1%，超越 π₀（3.3B，大规模预训练）在 LIBERO 上的 94.2%；SmolVLA（0.45B）超越 OpenVLA（7B）。这挑战了"bigger is better"的假设。（建议加入 Domain-Map：Established Knowledge）

3. **Data diversity >> Data specificity**：π0.5 的关键发现是 97.6% 的训练数据不来自目标任务，但对泛化至关重要。Co-training + post-training 策略是当前最有效的数据利用方式。

4. **RL self-improvement 打开了 VLA 的性能天花板**：π\*₀.₆ 的 Recap 证明 VLA 可以通过部署经验持续改进，Advantage conditioning 优雅地解决了 RL 与 flow matching 的兼容性问题。（建议加入 Domain-Map：Active Debates——RL vs 更多 demonstration 哪个更 cost-effective？）

5. **开源生态加速迭代**：从 Octo → OpenVLA → SmolVLA，开源模型不断降低 VLA 研究门槛。SmolVLA 基于 481 个社区数据集训练，展示了社区协作的力量。

## Open Problems

1. **Navigation + Manipulation 统一**：当前 VLA 主要聚焦 manipulation，navigation 仍是 separate 系统（NaVILA）。如何在统一架构中同时支持 building-scale navigation 和灵巧操作是一个核心开放问题。参见 [[VLN-VLA-Unification]]。

2. **长期记忆与空间理解**：MEM 初步解决了 15 分钟级记忆，但缺乏 explicit spatial memory。如何让 VLA 维护 persistent、incrementally updated 的空间表示（如 3D scene graph）以支持跨房间任务？

3. **Exploration 与 Autonomous Improvement**：π\*₀.₆ 的 RL 仍依赖人工 reward labeling。如何实现 fully autonomous self-improvement（无需人工标注的 intrinsic motivation / self-supervised reward）？

4. **Multimodal Action Distribution**：OpenVLA-OFT 的 L1 regression 在单模态 action 下表现优异，但在需要多种合理行为的场景中可能受限。Flow matching 理论上更适合 multimodal 分布，但计算成本更高。最优的 action representation 仍是开放问题。

5. **Cross-Embodiment 迁移的有效性**：RoboVLMs 发现 in-domain 数据比 cross-embodiment 数据更有效，与 π0.5 的"data diversity 至关重要"结论存在张力。Cross-embodiment 数据在什么条件下、以什么方式使用最有效？

6. **Safety 与 Robustness**：随着 VLA 从实验室走向真实世界部署（π0.5 在家庭环境，π\*₀.₆ 13 小时连续运行），safety guarantee 和 failure recovery 机制变得至关重要，但目前几乎没有系统性研究。

## 调研日志

- **调研日期**: 2026-03-27
- **搜索策略**:
  1. `"Vision-Language-Action" model robot arxiv 2024 2025 2026`
  2. `VLA foundation model robotic manipulation generalist 2025 2026`
  3. `VLA survey vision language action embodied AI 2024 2025`
  4. `SmolVLA Helix VLA humanoid robot 2025 arxiv`
  5. `"what matters in building vision language action" RoboVLMs nature 2025`
  6. `OpenVLA-OFT DeeR-VLA efficient VLA 2025 arxiv`
- **论文统计**: vault 已有 10 篇 + 新 digest 3 篇 + 跳过 0 篇
- **未能获取**: 无
