# 第1章 总体架构（Overall Architecture）

> 本章定义 Context Engine 的系统边界。对象 Schema 以第2章为准，检索、运行时和观测的细节分别见第4、8、10章。

## 1. 设计目标

Context Engine 是 AI Platform 的智能中间层，位于 AI Gateway 与企业数据之间，负责把企业数据转换为 Agent 可理解、可推理、可执行的 Context。

### 目标
- 统一上下文构建能力
- 支撑多种 Agent
- 屏蔽底层数据源差异
- 提供权限、优化、可观测能力

---

## 2. 平台定位

```text
AI Agent
   │
AI Gateway
   │
Context Engine
   │
Knowledge Runtime
   │
Enterprise Data
```

Context Engine 位于 AI Gateway 与数据平台之间，是整个 AI 平台的智能中间层。

---

## 3. 六层架构

1. Agent Layer：Research、Business、Coding、Ops Agent。
2. Context Runtime：BuildContext、ExplainContext、MergeContext 等接口。
3. Context Engine：Intent、Retrieval、Graph Expansion、Ranking、Optimizer。
4. Knowledge Runtime：Entity、Relation、Event、Metric、Action、Policy。
5. Storage：Object Store、Graph Index、Vector、Search、Cache。
6. Infrastructure：Kubernetes、Paimon、Fluss、Kafka 等。

---

换一个更直白的说法：Context Engine 就是一个 harness——包裹在基座模型外层、决定模型如何获取上下文、如何推理、如何调用工具、如何管理状态的那套运行时系统。harness 工程文献给出一条优化对象演进链：指令 prompt → 结构化上下文 → workflow → harness 代码 → optimizer 代码。模型越强，优化目标越该往右移——从手写规则走向可执行的搜索空间。这条链和本书章节顺序几乎同构：第 3 章建结构化上下文（Knowledge Builder），第 4–6 章是 workflow（检索→扩展→排序），第 7 章是 optimizer（压缩与 Token 分配），第 8 章是 harness 运行时（Runtime）。把它记住，后面每一章都知道自己在整条链上的位置。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4</span>

## 4. 核心模块与边界

拆之前借一个外部参照系对齐认知。Palantir Foundry 把 Ontology 拆成四大组成：对象与链接类型（把数据映射成对象）、动作类型与函数（让对象可被修改、可执行）、接口（多态建模）、应用层（视图、Workshop 等深度集成）。这四块和本书分层同构——Foundry 的"对象与链接"对应第 4 层 Knowledge Runtime，"动作与函数"对应 Action 模型，"接口"对应第 11/12 章领域插件。本书差异在于：Foundry 止步于 Ontology 到应用，本书在它之上多了运行时、缓存、可观测和多 Agent 协作这几层 AI 时代特有的需求（第 14 章会专门对比）。<span class="src">来源：Foundry Ontology 文档，Ontology 概览</span>

### Knowledge Builder
自动抽取 Entity、Relation、Event、Metric、Action。

### Ontology Store
统一维护知识对象及 Schema。

### Retriever
支持 Keyword、Vector、Graph、SQL、Streaming 检索。

### Graph Expansion
完成对象关系扩展，并限制 Hop 与节点数量。

### Context Builder
负责把各阶段结果组装为第2章定义的 Context Package，不负责决定检索策略，也不负责压缩（压缩归 Context Optimizer）。

### Intent Planner
负责解析用户意图，决定后续阶段的策略：Retriever 路由、Graph Expansion 的扩展方向（第5章 §16.2）、Context Optimizer 的压缩取舍（第7章）。它让扩展和压缩从固定规则升级为意图驱动。

### Policy Engine
负责 ACL、脱敏、审计。

### Context Optimizer
负责去重、压缩、Token Budget；候选选择由 Context Ranking 负责。

### Prompt Builder
负责把 Optimizer 输出的 Context Package 装配为最终结构化 Prompt。它与 Optimizer 是上下游关系：Optimizer 决定放什么、压多少；Prompt Builder 决定怎么组织成模型可消费的格式。

### Trace Engine
记录命中对象、Token 消耗、过滤原因。

---

## 5. 请求流程

```text
User
 ↓
Gateway
 ↓
Intent
 ↓
Hybrid Retrieval
 ↓
Graph Expansion
 ↓
Policy Filter
 ↓
Context Ranking
 ↓
Context Optimizer
 ↓
LLM
```

---

## 6. Context Package

> 以下为示意。Context Package 的唯一权威契约以第2章 §8 为准，本章不重复定义字段。

```yaml
context:
  objects: []
  relations: []
  events: []
  metrics: []
  actions: []
  documents: []
  provenance: []
  schema_version: "1.0"
  policy: {}
  trace: {}
  token_budget: 24000
```

---

## 7. API

```
BuildContext()
ExpandContext()
OptimizeContext()
MergeContext()
ExplainContext()
SnapshotContext()
```

---

## 8. MVP

第一阶段实现：
- Entity/Relation 抽取
- Hybrid Retrieval
- 一跳 Graph Expansion
- Context Builder
- Token Budget
- Context Trace

---

## 9. 本章小结

Context Engine 是 Agent 与企业数据之间的治理和推理中间层。它将离线知识构建、在线 Context 生成和运行时生命周期连接起来，同时保证权限、证据和可观测性贯穿全链路。
