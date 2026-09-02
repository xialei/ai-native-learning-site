# 第4章 Context Retrieval Framework 技术架构设计

> Context Engine 核心模块
>
> Version：v1.0
>
> Status：Draft

本章定义从 Query Planning 到候选 Context 输出的检索流水线；Context Ranking 和 Context Optimizer 的正式职责分别见第6、7章。

---

# 1. 设计目标

Context Retrieval Framework（CRF）是 Context Engine 的检索入口，Hybrid Retrieval 是其中的执行能力。

它的职责不是"搜索文档"，而是：

> 为 Agent 构建高质量、高可信、低 Token 成本的业务上下文（Context）。

不同于传统 RAG：

```
Question
    ↓
Vector Search
    ↓
Chunk
    ↓
LLM
```

Hybrid Retrieval 返回的是：

```
Question
      │
      ▼
Hybrid Retrieval
      │
      ▼
Context Object Graph
      │
      ▼
Context Builder
      │
      ▼
LLM
```

返回结果已经不是 Document，而是 Context。

---

# 2. 为什么需要 Hybrid Retrieval

企业数据不是单一种类。

通常包括：

- 文档（PDF、Word）
- 数据库
- 数据仓库
- 数据湖
- Git
- Notebook
- MLflow
- Kafka
- Paimon
- Fluss
- Prometheus
- Kubernetes
- API
- 实时日志

这些数据无法依赖一种 Retrieval。

因此，需要统一的 Hybrid Retrieval Framework。

设计目标：

✓ 支持结构化数据

✓ 支持非结构化数据

✓ 支持实时数据

✓ 支持对象关系

✓ 支持业务知识

✓ 支持 Tool

---

# 3. 架构

```
                     User Query
                          │
                 Query Rewrite
                          │
              Retrieval Orchestrator
                          │
      ┌─────────┬─────────┬─────────┬─────────┬─────────┐
      │         │         │         │         │
 Keyword   Vector   Graph   SQL   Streaming   Tool
Retriever Retriever Retriever Retriever Retriever Retriever
      │         │         │         │         │
      └─────────┴─────────┴─────────┴─────────┘
                          │
                Retrieval Merge
                          │
                Retrieval Ranking
                          │
                 Context Builder
                          │
                 Context Object Graph
```

---

# 4. Retriever 类型

Hybrid Retrieval 统一管理六类 Retriever。

## 4.1 Keyword Retriever

适用于：

- SOP
- Wiki
- PDF
- 日志
- 设备编号
- 型号
- ErrorCode

典型实现：

- Elasticsearch
- OpenSearch

优势：

- 精确
- 可解释
- 工业领域效果好

---

## 4.2 Vector Retriever

适用于：

语义检索。

典型实现：

- Milvus
- Qdrant
- PGVector
- FAISS

负责：

Document

Chunk

Embedding

Semantic Search

向量检索的工业落地路径固定：文本先分块，再 embedding，存进向量属性，最后做 KNN 近邻查询。分块尤其关键——embedding 模型有输入长度上限，整篇长文档一起嵌入语义会被"稀释"，切成更小片段区分度才高。Palantir Foundry 的语义搜索就是按这条链路走：文本转向量，存进 Ontology 的 vector 类型属性，再由 KNN 查询消费；它的 vector 属性只接受 KNN 查询、不能用在 Action 里、最大维度 2048。本书 Vector Retriever 应遵循"分块-嵌入-近邻"范式，而不是对整篇文档直接嵌入。<span class="src">来源：Foundry Ontology 文档，Ontology search</span>

---

## 4.3 Graph Retriever

适用于：

Ontology。

例如：

```
Experiment

↓

Dataset

↓

Feature

↓

Checkpoint

↓

Evaluation
```

返回：

Object

Relation

Event

而不是 Document。

---

## 4.4 SQL Retriever

适用于：

结构化数据。

例如：

Hive

MySQL

Paimon

Iceberg

DuckDB

SQL Retriever 可以生成：

SQL

执行

结果

自动转换 Context。

---

## 4.5 Streaming Retriever

支持：

实时 Context。

例如：

Kafka

Fluss

MQ

CDC

IoT

返回：

最新状态。

而不是历史状态。

---

## 4.6 Tool Retriever

Tool 也是一种 Knowledge。

例如：

deploy()

rollback()

restart()

predict()

train()

Workflow

Notebook

Agent 不只是知道信息。

还能知道：

可以执行什么。

---

# 5. Retrieval Orchestrator

Orchestrator 是整个系统的大脑。

职责：

① Query Rewrite

② Query Classification

③ Retriever Routing

④ Parallel Retrieval

⑤ Merge

⑥ Ranking

⑦ Cache

⑧ Trace

它不关心具体 Retrieval。

而负责：

什么时候调用。

调用几个。

调用顺序。

---

# 6. Query Rewrite

用户：

```
为什么 Loss 上升？
```

Rewrite：

```
Experiment

Training

Loss

Learning Rate

GPU

Commit

Evaluation
```

目的：

提升召回率。

Rewrite 可以结合：

- LLM
- Ontology
- 用户历史

共同完成。

Rewrite 不是可有可无的优化，是检索质量前提。Palantir Foundry 的语义搜索文档说得很直白：直接把用户原始提问扔给关键词搜索效果不好——它建议在查询和检索之间插入 LLM 预处理步骤，去掉"帮我找找看"这类修饰语、补上同义词。本书把"为什么 Loss 上升"扩展成一组检索词正是同一思路，区别是本书还能结合 Ontology 知道哪些对象相关，比纯靠 LLM 更准。<span class="src">来源：Foundry Ontology 文档，Ontology augmented generation</span>

顺带一个反直觉的点：上下文窗口越来越大后，语义检索未必总必需。Foundry 文档也承认，完整上下文能塞进窗口时（如 128K 装 300 多页），可以先不检索、直接全量注入 prompt，真正需要时再引入检索。但这不等于窗口大就不用管——窗口填满前模型有效注意力就早开始衰减（见第 7 章压缩）。策略是"能塞则塞、塞不下才检索"，不是非此即彼。<span class="src">来源：Foundry Ontology 文档，Ontology augmented generation</span>

---

# 7. Retrieval Merge

多个 Retriever 返回结果后。

统一转换：

```
Retrieval Result
```

例如：

```
Object

Document

Event

Metric

Action
```

Merge 后形成：

```
Context Candidate
```

供后续排序。

---

# 8. Retrieval Ranking

检索阶段的初步打分只用于 Merge 后的候选筛选，多维评分公式与因子定义以第6章 Context Ranking §7、§8 为权威契约，本章不重复定义。

Ranking 输出：

Top-N Context。

---

# 9. Context Builder

Hybrid Retrieval 不直接返回 Prompt。

而返回：

Context Object。

例如：

```
Experiment

Dataset

GPU

Feature

Notebook

Commit

Evaluation
```

Context Builder：

负责：

Object Merge

最终形成：

候选 Context。

Graph Expansion（第5章）和 Compression（第7章 Context Optimizer）是独立阶段，不由 Context Builder 承担。

---

# 10. API 设计

统一接口：

```go
type Retriever interface {

    Name() string

    Retrieve(ctx Context,
             query Query)
             ([]RetrievalResult, error)

}
```

所有 Retriever：

统一实现。

支持动态注册。

---

# 11. 输出格式

统一输出：

Context Package，字段以第 2 章 §8 的契约为准（objects / relations / events / metrics / actions / documents / policy / provenance / trace / token_budget / schema_version），本章不重新定义。

两点说明：

- `confidence` 是第 2 章 §2 定义的**对象级**元数据，随 objects 内的每个对象携带，不是 Package 级字段。
- Retrieval 阶段产出的包是**候选包**：token_budget 尚未经过第 7 章 Context Optimizer 的裁剪，objects 数量多于最终包。

Context Engine 后续所有模块：

均基于 Context Package 工作。

---

# 12. MVP

第一阶段：

✓ Keyword Retriever

✓ Vector Retriever

✓ SQL Retriever

✓ Merge

✓ Ranking

✓ Context Builder

第二阶段：

✓ Graph Retriever

✓ Streaming Retriever

✓ Tool Retriever

第三阶段：

✓ Query Rewrite

✓ Context Cache

✓ Context Trace

✓ Adaptive Routing

---

# 13. 本章小结

Hybrid Retrieval 之后，将继续设计：

- Graph Expansion
- Context Ranking
- Context Optimizer
- Context Builder
- Context Cache
- Context Debugger

共同组成完整 Context Engine。

---

# 一句话总结

Hybrid Retrieval 的目标不是"检索文档"。

而是：

**从企业所有知识源中，统一检索对象（Object）、关系（Relation）、事件（Event）、指标（Metric）、动作（Action），最终构建 Agent 可直接消费的 Context。**

---

## 14. 演进方向：Context Retrieval Framework

本章已将模块命名为 Context Retrieval Framework（CRF），因为它负责 **Query Planning → Routing → Retrieval → Merge → Candidate Context** 的完整流水线，更接近数据库中的 Query Optimizer，而不只是向量搜索。

```
Context Retrieval Framework
├── Query Planner
├── Query Rewriter
├── Retriever Router
├── Hybrid Retrieval
├── Context Merger
├── Context Ranker
├── Context Builder
├── Context Cache
└── Context Trace
```

后续实现可继续补充 Query Planner、Retriever Router、Context Merger 和 Context Trace，但最终候选选择、压缩和运行时管理仍分别归属第6、7、8章。
