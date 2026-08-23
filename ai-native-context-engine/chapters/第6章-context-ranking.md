如果说：

Hybrid Retrieval 决定 找到什么（Find）
Graph Expansion 决定 补充什么（Expand）

那么：

Context Ranking 决定最终把什么交给 LLM（Select）

# 第6章 Context Ranking 技术架构设计

> AI Knowledge Runtime（AKR）核心模块
>
> Version：v1.0
>
> Status：Draft

---

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

但：

LLM 一次只能接收有限 Token。

因此必须：

选择。

而不是：

全部发送。

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
ContextPackage
```

包含：

- Objects
- Relations
- Documents
- Events
- Metrics
- Actions

每个对象：

包含：

```
ID

Type

Metadata

Source

Timestamp

Score
```

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

建议：

统一：

```
Final Score

=

Relevance

+

Freshness

+

Importance

+

Authority

+

Business Priority

-

Distance

-

Token Cost
```

最终：

排序。

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

第一阶段：

✓ Relevance

✓ Freshness

✓ Importance

✓ Permission

✓ Token Cost

✓ Explain

第二阶段：

✓ Learning Ranking

✓ Diversity

✓ Conflict Resolution

第三阶段：

✓ Reinforcement Ranking

✓ Adaptive Ranking

✓ User Preference

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
