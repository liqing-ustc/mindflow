---
last_updated: "2026-03-27"
---

# Domain Map

> Human-AI 共同维护的核心认知地图。所有 Papers/Ideas/Experiments 的精华汇聚于此。
> 每个 domain 独立一个文件，便于精准维护和 skill 读写。

## Domains

| Domain | 文件 | 说明 | 最后更新 |
|:-------|:-----|:-----|:---------|
| VLA | [[Domain-Map/VLA\|VLA]] | Vision-Language-Action 模型 | 2026-03-27 |
| VLN | [[Domain-Map/VLN\|VLN]] | Vision-Language Navigation | 2026-03-27 |
| Spatial Representation | [[Domain-Map/SpatialRep\|SpatialRep]] | 语义 SLAM 与空间表示 | 2026-03-27 |

> 新增 domain：创建 `Domain-Map/{Name}.md`，使用 `Templates/DomainMap.md` 模板，在上表添加一行。

## Cross-Domain Insights

- **VLN-VLA 架构趋同**：两个领域都在向 hierarchical VLM reasoning + low-level policy execution 的架构收敛。详见 [[VLN-VLA-Unification]]。
- **Spatial representation 是统一的关键瓶颈**：VLN 依赖显式空间表示（topological map），VLA 通常无显式空间表示（end-to-end）。3D scene graph 是最有潜力同时服务两者的表示形式。详见 [[Domain-Map/SpatialRep|SpatialRep]]。
