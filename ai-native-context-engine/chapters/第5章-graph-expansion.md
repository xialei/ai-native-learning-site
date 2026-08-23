# Graph Expansion 技术架构设计

> AI Knowledge Runtime（AKR）核心模块
>
> Version：v1.0
>
> Status：Draft

---

# 1. 模块定位

Graph Expansion 位于 Hybrid Retrieval 之后。

它的职责不是继续搜索数据，而是：

> **围绕当前 Context，自动扩展 Agent 真正需要的业务上下文。**

Graph Expansion 是 Context Engine 与传统 RAG 最大的区别。

传统 RAG：

```
Question
    │
Vector Search
    │
Chunk
```

Graph Expansion：

```
Question
      │
Hybrid Retrieval
      │
Seed Context
      │
Graph Expansion
      │
Expanded Context
      │
LLM
```

Graph Expansion 输出的是：

> **Context Object Graph**

而不是更多 Document。

---

# 2. 为什么需要 Graph Expansion

Hybrid Retrieval 返回的通常只是：

```
Experiment A
```

但是 Agent 真正需要的是：

```
Experiment
    │
    ├── Dataset
    ├── Feature
    ├── Notebook
    ├── Git Commit
    ├── GPU
    ├── Checkpoint
    ├── Evaluation
    └── Owner
```

如果没有 Expansion：

LLM 不知道：

- 使用了什么数据
- 谁提交了代码
- GPU 是否异常
- 使用哪个模型
- 是否已有历史实验

因此：

> Retrieval 找到的是入口。

> Expansion 找到的是上下文。

---

# 3. Graph 的定位

本设计中：

Graph 不是数据库。

Graph 是：

> Object Navigation Layer

作用：

- 找关系
- 找上下文
- 找依赖

而不是：

存储所有数据。

建议：

```
Object Store
        │
Graph Index
        │
Expansion Engine
```

Graph 只是 Object Store 的导航索引。

背后原则：

> 每个事实只存一份。

一个属性能从关联对象算出来，就不要在本地冗余存储——源头一变，所有副本都得同步，漏掉一个就是脏数据。Palantir Foundry 的结构指南用 derived property（运行时按 link 动态计算、只读）换取"看起来像冗余展开"的访问便利，底层规范化、只存一份，最多支持三层关联遍历。这正是 Graph 作为"导航索引而非存储层"的依据，也是第 7 章 Relation Compression 的延伸。<span class="src">来源：Foundry Ontology 文档，Derived properties / 结构指南</span>

---

# 4. Expansion 输入

输入统一采用：

```
ContextPackage
```

例如：

```json
{
  "objects":[
    {
      "type":"Experiment",
      "id":"exp_001"
    }
  ]
}
```

Graph Expansion 不关心 Query。

只关心：

> 当前有哪些 Object。

---

# 5. Expansion 输出

输出：

```
Expanded Context Package
```

例如：

```
Experiment

↓

Dataset

↓

Feature

↓

Notebook

↓

Commit

↓

GPU

↓

Evaluation
```

所有对象：

统一加入：

Context。

---

# 6. Expansion Strategy

Graph Expansion 支持多种扩展策略。

## 6.1 Direct Expansion（一跳扩展）

只扩展：

直接关联对象。

例如：

Experiment

↓

Dataset

↓

Notebook

适合：

快速回答。

---

## 6.2 Multi-Hop Expansion（多跳扩展）

继续扩展：

```
Experiment

↓

Dataset

↓

Feature

↓

Statistics

↓

Quality Report
```

适合：

复杂分析。

需要：

Hop Limit。

---

## 6.3 Type Expansion

按对象类型扩展。

例如：

Experiment

↓

全部 Metric

全部 Event

全部 Checkpoint

而不是：

所有 Relation。

---

## 6.4 Temporal Expansion

扩展：

时间上下文。

例如：

当前实验

↓

昨天

↓

最近一周

↓

历史版本

适合：

分析趋势。

---

## 6.5 Dependency Expansion

寻找：

依赖链。

例如：

Notebook

↓

Git

↓

Docker Image

↓

Dataset

↓

GPU

Agent 能知道：

真正依赖。

---

## 6.6 Policy Expansion

扩展：

权限。

例如：

Experiment

↓

Owner

↓

ACL

↓

Project

↓

Tenant

确保：

后续 Context Builder：

不会拿到无权限对象。

---

# 7. Expansion Rules

Graph Expansion 不允许无限扩展。

必须限制。

建议：

## Hop

默认：

2

最大：

4

---

## Node Limit

默认：

200

超过：

停止。

---

## Relation White List

例如：

允许：

uses

belongs_to

generated_by

trained_on

禁止：

debug_relation

temporary_relation

---

## Score Threshold

Relation：

低于阈值：

不继续扩展。

---

# 8. Expansion Ranking

多个邻居：

需要排序。

建议：

Score：

```
Expansion Score

=

Relation Weight

+

Node Importance

+

Freshness

+

Business Priority

-

Distance
```

例如：

Dataset

★★★★★

Notebook

★★★★★

GPU

★★★★☆

Owner

★★☆☆☆

历史实验

★☆☆☆☆

---

# 9. Expansion API

统一接口：

```go
type ExpansionEngine interface {

    Expand(
        ctx context.Context,
        pkg ContextPackage,
    ) (ContextPackage,error)

}
```

任何：

Expansion：

都实现：

统一接口。

这种"一个对象进、一堆边出"的可编程扩展，工业上有现成参照。Palantir Foundry 的 Vertex 提供 Search Around 函数：接收一个对象参数，返回结构化的边集合，其中 directEdges 是直接连接，intermediateEdges 是经中间对象的间接连接，中间对象被"打包"合并进同一条边。这个"直接边 + 打包中间边"的分类对应后文上下文合并——多条路径找到同一对象按 Object ID 去重，intermediateEdges 的打包本质就是合并的一种实现。本书的 ExpansionEngine 可借鉴这一分类，让间接连接的合并发生在扩展阶段。<span class="src">来源：Foundry Ontology 文档，Vertex / Search Around 函数</span>

---

# 10. Expansion Pipeline

```
Seed Context

↓

Rule Match

↓

Relation Filter

↓

Graph Traversal

↓

Node Ranking

↓

Node Merge

↓

Loop Detection

↓

Policy Filter

↓

Expanded Context
```

整个过程：

保持可追踪。

---

# 11. Loop Detection

必须避免：

循环。

例如：

A

↓

B

↓

C

↓

A

设计：

Visited Set。

避免：

无限扩展。

---

# 12. Context Merge

多个路径：

可能找到：

同一个 Object。

例如：

GPU

既来自：

Experiment

也来自：

Training Job

Merge：

统一：

Object ID。

避免：

重复。

---

# 13. Trace

Expansion 必须支持：

Explain。

例如：

```
Experiment

↓

Dataset

↓

Feature
```

为什么扩？

因为：

trained_on。

所有 Expansion：

必须：

可解释。

---

# 14. MVP

第一阶段：

✓ Direct Expansion

✓ Hop Limit

✓ Loop Detection

✓ Merge

第二阶段：

✓ Temporal Expansion

✓ Dependency Expansion

✓ Policy Expansion

第三阶段：

✓ Learning Expansion

✓ Adaptive Expansion

✓ Agent Feedback

---

## 15. 与后续章节的关系

Graph Expansion 输出：

Context。

后续：

Context Ranking：

决定：

哪些 Context 保留。

Token Budget：

决定：

哪些 Context 放入 Prompt。

---

# 一句话总结

Graph Expansion 的目标不是遍历图。

而是：

> **围绕当前业务对象，自动补全 Agent 完成推理所需的最小业务上下文（Minimum Sufficient Context）。**

Graph 只是导航结构。

真正的产品价值是：

**Context Expansion。**

## 16. 高级扩展策略

### 16.1 Semantic Expansion（语义扩展）

Graph 只能扩展显式关系。

但企业里很多关系并不存在于图中，例如：

两个 Experiment 使用了相同 Feature
两个模型都依赖同一个基础模型
两份 SOP 描述的是同一种故障

因此增加一个 Semantic Expansion：

Object
    │
Embedding
    │
Nearest Neighbor
    │
Virtual Relation

它可以动态创建"虚拟关系"，再交给 Graph Expansion 继续扩展。

### 16.2 Intent-aware Expansion（意图驱动扩展）

Expansion 不应该固定。

例如同一个对象：

Experiment

不同问题需要不同扩展：

问 性能 → 扩展 GPU、Metrics、Profile
问 数据 → 扩展 Dataset、Feature、Statistics
问 代码 → 扩展 Git、Notebook、Commit
问 成本 → 扩展 GPU、资源、账单

也就是说，Expansion 的策略由 Intent Planner 决定，而不是固定的 Hop 规则。

这会让整个 Context Engine 从固定图遍历升级为上下文规划（Context Planning）。两种策略都必须记录虚拟关系的来源、置信度和失效时间，并接受第1章定义的 Policy Filter。
