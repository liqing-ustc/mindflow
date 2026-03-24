---
title: Hierarchical VLA with Shared Semantic Scene Graph for Unified Navigation-Manipulation
tags:
  - VLN
  - VLA
  - SLAM
  - scene-graph
  - flow-matching
  - hierarchical-planning
  - mobile-manipulation
status: raw
date_created: 2026-03-24
dg-publish: true
dg-home: true
---

## Core Idea
构建一个三层 hierarchical VLA 架构，以 semantic scene graph 作为 navigation 和 manipulation 的 shared spatial representation，实现 building-scale 导航与 dexterous manipulation 的统一。

## Motivation
从 [[VLN-VLA-Unification]] survey 的 gap 分析中发现：（1）现有系统的 navigation 和 manipulation 使用完全不同的空间表示（如 OK-Robot 的 2D occupancy grid vs. 3D point cloud），没有 shared representation；（2）没有 end-to-end model 能同时处理 building-scale navigation 和 dexterous manipulation；（3）SLAM representations 未针对 VLM consumption 优化。本 idea 的核心假设是：**shared semantic spatial representation 能显著提升 Nav+Manip 的协调性和任务成功率**。每个组件都有成熟的技术基础（VLM backbone、ConceptGraphs、flow matching），且 HomeRobot OVMM 提供了直接可用的评估平台，使验证路径清晰可行。

## Related Work

**VLA / Manipulation 基础：**
- [[Black2024-Pi0]] — Flow matching action generation，manipulation head 的技术基础
- [[Black2025-Pi05]] — VLM + hierarchical planning for long-horizon tasks，验证了 hierarchical 架构的可行性
- [[Black2025-PiStar06]] — **RL self-improvement for VLA**。Recap 算法（advantage-conditioned policy extraction）首次实现通用 VLA 通过真实部署 RL 改进，>2× throughput。Knowledge Insulation 使 discrete/continuous actions 独立训练——对 dual action heads 至关重要
- [[Torne2026-MEM]] — 多尺度记忆机制（视频短期 + 语言长期），memory 设计的参考

**Hierarchical VLM-VLA 架构（直接验证）：**
- [[Shi2025-HiRobot]] — **最直接的上两层架构验证**。独立 VLM reasoning (PaliGemma-3B, ~1 Hz) + VLA execution (π₀, 10-50 Hz)，超越 GPT-4o 40%+ instruction accuracy。Synthetic data generation 从少量 demos 自动生成多轮交互训练数据——可直接迁移到 Nav+Manip 指令生成。**本 idea 只需在 Hi Robot 架构中间加入 spatial memory 层并扩展 navigation**

**VLN / Navigation 基础：**
- [[Cheng2024-NaVILA]] — VLM-driven navigation with language actions，high-level planner 的参考
- [[An2024-ETPNav]] — Hierarchical navigation with explicit topological planning
- [[Zhu2025-MTU3D]] — **最直接的架构参考**。Online query-based spatial memory + unified grounding-exploration decision space，证明了无需 3D 重建即可 joint optimize grounding 和 exploration。其 unified decision space 设计可推广到加入 manipulation action type，实现 grounding / exploration / manipulation 三合一

**Spatial Representation：**
- [[Gu2024-ConceptGraphs]] — Open-vocabulary 3D scene graph，shared representation 的核心技术（离线构建）
- [[Huang2023-VLMaps]] — Language-indexed spatial features for navigation（dense feature map 方案）

**Nav+Manip 系统（对比基线）：**
- [[Liu2024-OKRobot]] — Modular Nav+Manip baseline，使用 separate representations

## Rough Plan

### 三层架构设计

1. **High-level VLM Planner**（基于 [[Shi2025-HiRobot|Hi Robot]] 架构扩展）
   - 实现：Fine-tuned PaliGemma-3B 或 Gemma 3（Hi Robot 已验证此方案超越 GPT-4o）
   - 输入：语言指令 + 多摄像头图像 + scene graph 的文本化 summary（Hi Robot 原版无 scene graph input，这是本 idea 的扩展点）
   - 输出：intermediate language command（如 "navigate to kitchen sink"）+ optional verbal response
   - **Synthetic data pipeline**：复用 Hi Robot 的 VLM-based synthetic data generation，从 Nav+Manip demos 自动生成多轮交互数据（含约束、纠正、偏好），解决 Nav+Manip 指令数据稀缺问题
   - 关键：设计高效的 graph-to-text serialization 方案，控制 context window 占用

2. **Mid-level Spatial Memory**（两种候选方案）
   - **方案 A: Scene Graph 式**（基于 ConceptGraphs 简化版）——每个 node 包含 CLIP embedding + 3D position + navigability flag + graspability flag，graph 结构天然支持 relational reasoning（"杯子在桌子上"）
   - **方案 B: Online Query 式**（基于 [[Zhu2025-MTU3D|MTU3D]] 的 spatial memory bank）——从 RGB-D 流直接生成 object queries，IoU matching 增量合并，配合 occupancy map，无需显式 graph 构建。优势是实时性好（MTU3D 实测 3.4 FPS），劣势是缺少拓扑关系
   - **两种方案的共同要求**：同时服务 navigation（nodes/queries 作为 waypoints）和 manipulation（作为 grasp targets），支持 language query
   - **关键设计选择**：方案 A 更适合需要 relational reasoning 的复杂任务（"把 X 放到 Y 旁边"），方案 B 更适合需要 real-time 的场景。也可以混合使用：MTU3D 式 online queries 做实时感知，ConceptGraphs 式 graph 做离线 relational enrichment

3. **Low-level Dual Action Heads**（基于 [[Black2025-PiStar06|π\*₀.₆]] 的 Knowledge Insulation）
   - Navigation head：在 scene graph 上做 waypoint selection → local planner 执行 continuous locomotion
   - Manipulation head：flow matching policy（à la π₀）生成 continuous joint-level control
   - **Knowledge Insulation**：π\*₀.₆ 已验证 discrete tokens 和 continuous actions 可以独立训练而互不干扰——这正是 nav head（discrete waypoint）和 manip head（continuous flow）共存于同一模型所需要的技术
   - **RL Self-improvement**：部署后可用 Recap 算法（advantage-conditioned policy extraction）从自身经验中改进，无需复杂 policy gradient

### 实验计划

- **平台**：HomeRobot OVMM（simulation → real Hello Robot Stretch）
- **关键对比实验**：
  1. Shared scene graph vs. separate representations（OK-Robot 式）的 Nav+Manip 成功率
  2. Hierarchical VLM-VLA（our system）vs. flat VLA（Hi Robot ablation 已证明 hierarchy 的必要性）
  3. With vs. without RL self-improvement（Recap）的 throughput 和 success rate 差异
- **渐进路径**：先在 Habitat simulation 验证架构 → 再 transfer 到 real robot → Recap RL 迭代改进
- **Metrics**：task success rate、navigation efficiency、manipulation success rate、re-planning frequency、throughput (tasks/hour)
- **Synthetic data**：用 Hi Robot 方法从 Nav+Manip demos 生成 open-ended 指令变体（"go to the kitchen and make me coffee, I prefer decaf"）

## Open Questions
1. **Scene graph scalability**：building-scale 环境可能产生数千 nodes，如何高效 serialize 并输入 VLM 的有限 context window？需要 graph summarization 或 attention-based selection。
2. **Online construction 效率**：ConceptGraphs 需要离线构建，如何实现 real-time incremental update？可能需要简化 graph 结构或引入 lazy evaluation。
3. **Co-training 策略**：navigation head 主要依赖 sim data（Habitat），manipulation head 需要 real data（OXE）。Sim-real mixed training 的 domain gap 如何处理？
4. **Graph-to-text serialization 格式**：哪种 serialization 方案对 VLM reasoning 最友好？JSON？natural language description？structured template？需要 ablation study。
5. **Failure recovery**：当 scene graph 中的信息过时（物体被移动）或错误（misdetection）时，如何触发 re-observation 和 graph update？
6. **Query-based vs. Graph-based representation**：MTU3D 的 online query representation 避免了显式 graph 构建，但可能丢失拓扑关系。对于 Nav+Manip 场景，query-based（MTU3D 式）和 graph-based（ConceptGraphs 式）哪种更适合？还是可以混合使用？
7. **RL reward design for Nav+Manip**：π\*₀.₆ 的 Recap 使用 episode-level sparse reward（success/failure）。Nav+Manip 联合任务的 reward 如何设计？是 task-level 还是 sub-goal level？Navigation 和 manipulation 的 value function 是否应该独立？
8. **High-level 与 low-level 的 error awareness**：Hi Robot 的 high-level 不感知 low-level 失败（如 drop object）。在 Nav+Manip 场景中，spatial memory 可以作为 error detection 的信号源（object 位置变化 = manipulation 失败），如何设计这种 feedback loop？
