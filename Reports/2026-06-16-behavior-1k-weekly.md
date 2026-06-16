---
type: weekly
period: 2026-06-09 ~ 2026-06-16
date_created: "2026-06-16"
tags: [report, weekly, behavior-1k]
sources: ["[[Projects/behavior-1k/main]]", "[[Projects/behavior-1k/experiments/XR05]]", "[[Projects/behavior-1k/discussions/2026-06-15]]"]
---

# BEHAVIOR-1K 周报（2026-06-09 ~ 06-16）

## Highlights

1. **「真机 RFM 靠 SFT 迁移到 BEHAVIOR sim」这条路线本周被两次 negative 基本证否。** 继上周单 task joint SFT 四组全 0 后，本周把三个变量（全 50-task + lr 3e-5 + 绝对 EE pose/IK）一齐放大重试，eval 仍 **SR=0 / graded Q=0**。链路逐层确认无误，SR=0 是模型/表征层面，非 bug、非欠训练。
2. **同根因已定位**：XR05 真机 pretrain（agibot/bridge/droid/fractal/midata）从没见过 BEHAVIOR sim，而对照组 Comet pt50 是直接在 BEHAVIOR 上 pretrain 的——纯 SFT（即便放大数据、对齐表征）补不动 real→sim 的域 gap。
3. **战略岔路待审批**：continued-pretrain（补域 gap 再 SFT）vs pivot（放弃迁移路线）。这是本周唯一需要 Supervisor 决策的事项。

## Progress by Direction

### XR05 真机 RFM → BEHAVIOR sim 迁移

- **本周做了什么**:
  - 06-10：把上周单 task 失败后的 4 个战略选项整理进 main.md `## Next Steps`（MF-10，Multica×MindFlow 流水线首链路验证）。
  - 06-11：**A1 前置验证通过**（MF-14）——OmniGibson IK controller 替换双臂 JointController，`absolute_pose` mode 与 proprio eef 同源同 frame，整机 action 21 维，eval 纯 config 注入零代码改动，本地 4090 smoke 双臂 30 步收敛 sub-mm。
  - 06-11：**开放大实验 XR05-50task-EE**（MF-15）——10000 ep 数据转换（0 skipped）+ EE 标签构造 + norm stats 重算 + 135.5 GiB 上传；底座升级 260527 4B；训练 job 提交（`t-20260611192400-eh4x4`，gm403×8 bs64）。
  - 06-15：训练 **succeed @ 20k**（~3.6 天，train/loss 0.04–0.06，val/loss 0.055）；接 eval。
  - 06-16：**reorg（MF-32）**——XR05/XR05-EXT/XR05-50task-EE 三篇合并为单篇 [[Projects/behavior-1k/experiments/XR05|XR05]]（零信息丢失，旧名转 alias，全 vault wikilink 重指）。
- **关键发现**:
  - eval `turning_on_radio` 10 instance **SR=0 / Q=0**（对标 Comet SFT 0.70）。loss 收敛到 0.05 但 task 没学会——**loss 低 ≠ task 学会**。
  - rollout 视频显示模型有「通用机器人移动/探索」先验（会动、会抬臂、感知到不同真实房间），但**没建立 instruction→目标→靠近→操作的 grounding**——学会了「动」，没学会 task。
  - delta vs abs 表征都 SR=0 → **action 表征不是主因**，排除了最初头号嫌疑；嫌疑转向 pretrain 数据域。
- **下一步**: 二选一——① BEHAVIOR continued-pretrain → 再 SFT（直击域 gap 根因，但需 pretrain 级算力+数据配方）；② pivot，重估「真机 RFM 单 task 迁移 sim benchmark」路线性价比（零算力成本，但放弃 XR05 迁移）。
- **需要 Human 决策**: **是**。

## New Discoveries

- **口径错配的教训沉淀**（上周 Comet Step 4 的修正延续）：challenge 主指标是 graded **Q** 而非 binary SR。Comet pt50 全 50-task eval mean Q=0.234 已 ≥ paper pretrained 0.192、逼近 challenge top 0.2599——**Comet 其实是个强 baseline，没有想象中的 gap**。这反过来抬高了「迁移路线要赢过 Comet」的门槛。
- **failure-mode 信号**：高 Q 低 SR 的 task（差临门一脚，如 bringing_water Q=0.90）是最有价值的改进信号，比纯 SR=0 更可操作。

## Experiments Summary

| Experiment | Status | Key Result |
|-----------|--------|-----------|
| [[Projects/behavior-1k/experiments/XR05\|XR05（含 50task-EE）]] | concluded-negative | 三变量齐改仍 SR=0/Q=0；与单 task 版同根因（real→sim 域 gap）。两次 negative → 迁移路线基本证否 |
| [[Projects/behavior-1k/experiments/Comet\|Comet]] | active (baseline) | 全 50-task pt50 eval：500 eval 0 失败，mean Q=0.234（≥ paper 0.192，逼近 top 0.2599），mean SR=0.098 |

## Questions for Human

1. **审批战略岔路**：XR05 迁移路线两次证否后，走 continued-pretrain（补域 gap）还是 pivot？continued-pretrain 需要一轮 pretrain 级算力与数据配方设计，请确认是否值得投入。
2. 若 pivot，是否转向以 Comet（已是强 baseline）为基座做 RL fine-tune / failure-mode 定向改进（高 Q 低 SR task）？这条路当前证据更扎实。

## Resource Usage

- Experiments run: 1 大型放大实验（XR05-50task-EE，训练 ~3.6 天 gm403×8 + 跨集群 serve/eval）+ 1 前置接口验证（A1 IK controller）
- Data processed: 10000 ep 数据转换 + 135.5 GiB 上传
- Multica 任务: MF-10 / MF-14 / MF-15 / MF-32
