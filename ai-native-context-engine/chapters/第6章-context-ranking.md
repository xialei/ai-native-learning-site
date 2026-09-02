# 第6章 Context Ranking 技术架构设计

> Context Engine 核心模块
>
> Version：v1.0
>
> Status：Draft

---

如果说：

Hybrid Retrieval 决定 找到什么（Find）
Graph Expansion 决定 补充什么（Expand）

那么：

Context Ranking 决定最终把什么交给 LLM（Select）

# 1. 模块定位

Context Ranking 位于 Graph Expansion 之后。

职责：

> **从大量 Context Candidate 中，筛选出当前任务最有价值的 Context。**

它不是传统搜索里的排序器（Ranking）。

而是：

> Context Selection Engine（上下文选择引擎）。

---

# 2. 为什么需要 Ranking

经过 Hybrid Retrieval 和 Graph Expansion 后。

通常已经得到：

```
300~500 个 Object

1000+ Relation

100+ Event

几十篇 Document

几十个 Metric
```

（数字为经验估计，需按租户实测校准；以 200 个候选对象 ≈ 20K token 估算——对象约 100 token/个，关系与事件更小。）

但：

LLM 一次只能接收有限 Token。

因此必须：

选择。

而不是：

全部发送。

Ranking 的产出规模由 Top-N 决定：Top-N 按第 7 章 Token Allocation 下发的 `token_budget` 装载（装满即停），典型 N=50~100 个对象——这正是第 7 章 §2 "Optimizer 拿到 200 Objects" 数字的上游来源（Ranking 装载的候选 + 其关系/事件展开约 200 个条目）。

---

# 3. 整体架构

```
Hybrid Retrieval
        │
        ▼
Context Candidate
        │
        ▼
Graph Expansion
        │
        ▼
Expanded Context
        │
        ▼
Context Ranking
        │
        ▼
Top Context
        │
        ▼
Context Optimizer
```

Ranking：

决定：

哪些对象进入 Prompt。

---

# 4. Ranking 输入

统一输入：

```
ContextPackage（= Context Package，下文用规范写法）
```

包含：

- Objects
- Relations
- Documents
- Events
- Metrics
- Actions

每个对象：

字段以第 2 章 §2 的通用元数据契约为准（`id / type / schema_version / source / source_ref / provenance / confidence / valid_time / observed_at / tenant`），本章不重新定义。两点说明：

- Freshness（§7.2）读取的是 `observed_at`（同对象多源时取最新）与 `valid_time`（`valid_time.end` 已过的对象降权或过滤）——只用单一 "Timestamp" 无法区分业务有效时间和观测时间。
- `Score` 是 Ranking 阶段追加的**派生字段**：只在本次 Ranking 结果与 trace 中存在，不回写 Ontology Store。

---

# 5. Ranking 输出

输出：

```
Ranked Context Package
```

新增：

```
Rank

Priority

Final Score

Reason
```

例如：

```
Experiment

Score：97

Reason：

Current Experiment

High Importance

Recent

Owner Match
```

支持：

Explain。

---

# 6. Ranking Pipeline

```
Candidate Context

↓

Permission Filter

↓

Duplicate Merge

↓

Business Rule

↓

Score Calculation

↓

Top-N Selection

↓

Context Package
```

---

# 7. Ranking 因子

建议采用多维评分。

而不是：

Embedding Similarity。

---

## 7.1 Relevance

相关性。

来源：

- Query
- Intent
- Ontology

例如：

Loss

与：

Experiment

高度相关。

---

## 7.2 Freshness

时效性。

例如：

当前 GPU

昨天日志

今天告警

优先级：

远高于：

三个月前。

---

## 7.3 Importance

业务重要性。

例如：

Experiment

★★★★★

GPU

★★★★☆

Owner

★★☆☆☆

Comment

★☆☆☆☆

Importance：

来源：

Ontology。

---

## 7.4 Authority

可信度。

例如：

MLflow

★★★★★

Notebook

★★★★☆

Wiki

★★★☆☆

Slack

★☆☆☆☆

Source：

影响最终排序。

---

## 7.5 Permission

权限。

用户：

没有权限：

直接：

过滤。

而不是：

降分。

权限过滤还要细到属性粒度，不只"对象可见不可见"。Palantir Foundry 支持在 object type 上直接配 cell-level（单元格级）安全——对象实例级和属性值级两层，独立于背后数据源权限。它比传统 Restricted View 更轻：配置直接挂类型上、策略变更近乎实时生效（旧方案改权限得重建整条管道）、还能给流式数据源加行列级权限。本书 Permission 因子可照此深化：无权限对象直接过滤，对象内部无权限属性按 cell 级脱敏，而不是整个对象扔掉。<span class="src">来源：Foundry Ontology 文档，Object and property security policies</span>

---

## 7.6 Distance

Graph Distance。

例如：

Experiment

↓

Dataset

Distance：

1

Experiment

↓

Dataset

↓

Statistics

Distance：

2

距离越远：

Score：

越低。

---

## 7.7 Token Cost

对象：

占用 Token。

例如：

Document：

1000 Token

Metric：

20 Token

Event：

15 Token

如果价值接近：

优先：

低 Token。

---

# 8. Final Score

七个因子的量纲不同（★ 为 1~5、Distance 是 1~3 跳、Token Cost 是 20~1000 token），不能直接相减——否则 Token Cost 一项会吞掉所有信号。可实现的做法是：先归一化到 [0,1]，再加权求和。

```
score = w_r·R + w_f·F + w_i·I + w_a·A + w_b·B − w_d·log2(1+dist)
```

各因子归一化口径：

| 因子 | 归一化方式 |
|------|-----------|
| Relevance R | 检索器分数归一化到 [0,1]（各路 Retriever 分数先做 min-max） |
| Freshness F | `exp(−λ_type·Δt)`，Δt 为距 `observed_at` 的小时数；λ 按对象类型配置（Event/Metric 小时级衰减，Document 周级） |
| Importance I | 五星 ÷ 5；存于对象 `properties.importance`，由 Knowledge Builder 人工标注 + 默认值 3 |
| Authority A | 源系统星级 ÷ 5；配置在 Retriever 路由表 |
| Business Priority B | 对象 `properties.priority` ∈ {0, 0.5, 1}，由租户按业务对象配置（如"本租户核心资产的风机"= 1），默认 0 |
| Distance dist | 第 5 章扩展的跳数（1~3），经 `log2(1+dist)` 压缩 |

默认权重（起点，需按场景校准）：

| 因子 | 默认权重 |
|------|---------|
| w_r（Relevance） | 0.40 |
| w_f（Freshness） | 0.20 |
| w_i（Importance） | 0.15 |
| w_a（Authority） | 0.10 |
| w_b（Business Priority） | 0.10 |
| w_d（Distance） | 0.05 |

端到端算例（300 个候选 → Top-N）：

```
候选：GPU-07（打分阶段）
  R=0.85  F=exp(−0.05·2h)=0.90  I=4/5=0.80  A=5/5=1.0
  B=0.5   dist=2 → log2(3)=1.58
  score = 0.40·0.85 + 0.20·0.90 + 0.15·0.80
        + 0.10·1.00 + 0.10·0.50 − 0.05·1.58
        = 0.34 + 0.18 + 0.12 + 0.10 + 0.05 − 0.079 ≈ 0.71
```

Top-N 装载：按分数降序逐个装入，直到 `token_budget`（第 7 章 Token Allocation 下发）用尽。**Token Cost 不进分数**——它是装载阶段的次级排序键：分数相同的对象，优先装 Token 低的（与 §7.7 一致）。这样"价值排序"和"成本装载"各管一件事，互不污染。

`Business Priority` 定义：来源字段 `properties.priority`，由租户管理员在业务对象上配置（风电场的核心机组、研发的核心实验），默认 0.5；它表达"这个对象对这类任务普遍重要"，与 Relevance（对当前 query 重要）互补。

"价值接近时优先低 Token"在更上游有个工业对应物：按需索引。不是所有属性都值得进高成本的可搜索/可排序索引。Palantir Foundry 用 render hints 标记属性用途——Searchable 决定它能否被过滤/排序/聚合；不需要被搜索的属性取消提示就能显著减轻重建索引负担、加快索引速度。这和 Token Cost 精神一致：资源有限，只把"会被用到的"放进高成本通道。本书排序层用 Token Cost 选对象，Foundry 存储层用 render hints 选索引，本质都是按需加载。<span class="src">来源：Foundry Ontology 文档，Property metadata / Render hints</span>

---

# 9. Explain

Ranking：

必须：

Explain。

例如：

```
Experiment

↓

Score：95

原因：

Current Project

Recent

High Authority

Token Low
```

Agent：

可以：

Debug。

---

# 10. Context Diversity

不能：

全部：

Experiment。

需要：

覆盖：

```
Experiment

Dataset

Metric

GPU

Notebook

Commit
```

保证：

Context：

丰富。

---

# 11. Conflict Resolution

多个 Source：

可能：

冲突。

例如：

MLflow：

Accuracy：

92%

Notebook：

Accuracy：

91%

Ranking：

优先：

Authority：

高。

保留：

MLflow。

本节只处理**候选级冲突**（同 ID 多路命中、检索期即可按 Authority 择优）。更下游的冲突不在本节范围：对象级跨源合并与裁决表见第 7 章 §6；运行时多 Producer 并发写的冲突归第 8 章 §8 Merge。

---

# 12. Ranking API

统一接口：

```go
type Ranker interface {

    Rank(

        ctx context.Context,

        pkg ContextPackage,

    ) (ContextPackage,error)

}
```

支持：

插件化。

---

# 13. Learning Ranking

未来：

支持：

Feedback。

例如：

用户：

经常：

点击：

GPU。

GPU：

Importance：

自动提升。

Ranking：

不断学习。

---

# 14. Context Quality

Ranking：

不仅输出：

Score。

还输出：

Quality。

例如：

```
Coverage

Freshness

Authority

Completeness
```

供：

Prompt Builder：

参考。

---

# 15. Trace

记录：

每个对象：

为什么：

进入：

Prompt。

例如：

```
Dataset

Score：88

Reason：

Recent

High Importance

Distance=1
```

方便：

Debug。

---

# 16. MVP

（以下为交付计划，非已完成清单；各阶段完成标准见第 14 章对应 Phase 验收指标。）

第一阶段：

计划 Relevance / Freshness / Importance 三因子打分

计划 Permission 硬过滤（§7.5，不参与打分）

计划 Token Cost 次级排序键（§8）

计划 Explain（§9）

第二阶段：

计划 Learning Ranking（用点击/采纳日志在线校准 §8 权重）

计划 Diversity（§10 的类型配额与 Set Cover 贪心）

计划 Conflict Resolution（§11）

第三阶段：

计划 Reinforcement Ranking（把用户采纳/丢弃行为作为 reward 训练权重 w，机制详见第 14 章 Roadmap）

计划 Adaptive Ranking（按 Intent 动态调权重，复用第 1 章 §4 Intent Planner 信号）

计划 User Preference（显式偏好叠加 Business Priority）

---

# 17. 与其他模块关系

各模块在流水线中的职责与边界见第1章 §4。本章定位：从 Graph Expansion 输出的候选中负责选择（Select）。

---

# 一句话总结

Context Ranking 不是搜索排序。

而是：

> **在有限 Token 下，选择最值得让 LLM 看到的业务上下文。**

它决定了：

Agent 是否真正拥有高质量 Context。

## 18. 高级能力

### 18.1 Goal-aware Ranking（目标感知排序）

传统 Ranking 只看 Query。

建议增加：

Goal

↓

Ranking

例如：

同样：

为什么训练慢？

Research Agent：

优先：

GPU

Profile

Operator Agent：

优先：

Cluster

Queue

Scheduler

Business Agent：

优先：

Cost

Goal：

决定：

Ranking。

### 18.2 Context Coverage Optimization（上下文覆盖优化）

很多 RAG：

Top10：

全部：

Document。

实际上：

LLM：

需要：

Experiment

Dataset

Metric

Action

History

Policy

因此：

Ranking：

不是：

Top Score。

而是：

最大：

Coverage。

类似：

Set Cover。

这是 Context Engine 的核心研究方向。生产实现应同时报告相关性、覆盖率、冲突率和 Token 效率，避免把单一分数误认为 Context 质量。
