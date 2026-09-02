# 第3章 Knowledge Builder 技术设计

> Context Engine 技术架构设计 v1.0

---

# 1. 为什么需要 Knowledge Builder

Knowledge Builder 是整个 Context Engine 的入口，也是全书数据侧最重要的模块。

它负责持续从企业各种数据源中自动构建 Ontology。

如果说：

- Context Engine 决定 Agent 的智能水平；
- Retrieval 决定上下文质量；

那么：

> **Knowledge Builder 决定整个系统的知识质量。**

没有高质量 Ontology，就不存在高质量 Context。

---

# 2. 设计目标

Knowledge Builder 的目标不是建立知识图谱。

而是建立：

> AI 可以理解、推理、执行的业务世界。

必须满足：

- 自动构建
- 增量更新
- 实时同步
- 可解释
- 可版本管理
- 可扩展

设计原则：

1. AI First
2. Incremental First
3. Streaming First
4. Schema Evolution
5. Human-in-the-loop

---

# 3. 总体架构

```text
                 Enterprise Data
───────────────────────────────────────────────

Database

Kafka

Paimon

Git

Notebook

MLflow

PDF

API

Logs

Metrics

───────────────────────────────────────────────
                     │
                     ▼

              Source Connector

                     │

             Data Normalizer

                     │

───────────────────────────────────────────────

              Knowledge Builder

───────────────────────────────────────────────

Entity Extractor

Relation Extractor

Event Extractor

Metric Extractor

Action Extractor

Policy Extractor

Document Parser

───────────────────────────────────────────────

                     │

             Ontology Validator

                     │

             Ontology Versioning

                     │

             Ontology Store
```

---

# 4. 数据源设计

Knowledge Builder 必须支持插件化数据源。

建议统一 Connector Interface。

支持：

## Structured

- MySQL
- PostgreSQL
- Oracle
- Hive
- Iceberg
- Paimon

## Streaming

- Kafka
- Fluss
- Pulsar

## Document

- PDF
- Word
- Excel
- Markdown

## Development

- Git
- Notebook
- MLflow
- Jenkins

## Runtime

- Kubernetes

- Prometheus

- 日志

所有 Connector 输出统一 Object。

---

# 5. Builder Pipeline

建议统一 Builder Pipeline。

```text
Raw Data

↓

Normalize

↓

Entity Discovery

↓

Relation Discovery

↓

Event Discovery

↓

Metric Discovery

↓

Action Discovery

↓

Ontology Merge

↓

Validation

↓

Versioning

↓

Ontology Store
```

Pipeline 每一步都支持：

- Retry
- Cache
- Trace

---

# 6. Entity Discovery

目标：

发现业务对象。

例如：

日志：

```
Training started.

Dataset weather_v2

GPU H20

```

自动抽取：

```
Experiment

Dataset

GPU
```

建议：

Rule + LLM

混合抽取。

规则负责：

高精度。

LLM负责：

高召回。

---

# 7. Relation Discovery

例如：

```
Experiment uses Dataset

Experiment deployed_on GPU

Model generated_by Notebook
```

输出：

```yaml
source: exp-001        # 实例 ID（第 2 章 §4）

relation: uses

target: dataset-1

confidence: 0.98
```

建议：

Graph Pattern

+

LLM

共同完成。

---

# 8. Event Discovery

企业知识最容易缺失的是：

事件。

例如：

```
TrainingStarted

TrainingFinished

AlarmRaised

RepairCompleted
```

所有 Event 字段以第 2 章 §5 的 Event 模型为准（`type / time / actor / object`），本章不另行定义；若业务确需额外状态字段（如 Status），须走第 2 章 §9 的 Schema 演进流程补充，不得在本章私加。

支持：

事件时间线。

---

# 9. Metric Discovery

自动发现：

Loss

Accuracy

Latency

Cost

Temperature

Power

Wind Speed

统一：

Metric Object。

支持：

历史趋势。

---

# 10. Action Discovery

Knowledge Builder 不只是理解。

还要发现：

可执行动作。

例如：

Git：

```
deploy.sh

rollback.sh
```

Notebook：

```
submit_job()
```

K8s：

```
kubectl rollout restart
```

统一抽：

```
Action
```

以后：

Agent 才知道：

可以执行什么。

---

# 11. Document Parser

Document：

不是最终知识。

Document：

只是知识来源。

建议：

Document

↓

Section

↓

Paragraph

↓

Chunk

↓

Entity Link

↓

Ontology

Document 永远：

绑定：

Entity。

不要孤立。

---

# 12. Ontology Merge

多个数据源：

可能产生：

同一个对象。

例如：

MLflow：

Experiment-001

Git：

Experiment-001

Notebook：

Experiment-001

Builder：

自动 Merge。

建议：

Object Identity Resolution。

包括：

- Name

- Alias

- UUID

- Metadata

共同判断。

---

# 13. Validation

Builder 输出：

必须：

验证。

包括：

Schema

Relation

Loop

Permission

Reference

Version

Validation Failure：

不能进入：

Ontology。

---

# 13.1 前车之鉴：别照搬源系统的 schema

校验只能拦住"格式错"的对象，拦不住"方向错"的建模。自动抽取最容易踩的坑，是 LLM 把源系统里的表结构原样搬进 Ontology——字段照抄、命名照搬、一条源数据行里混杂多个实体也建成单一类型。这么建出来的 Ontology 看着满满当当，其实是源系统 schema 的拙劣副本，业务语义全丢了。

这不是假设。Palantir Foundry 的 Ontology 设计文档把这类问题总结成几条反模式，每一条都直指自动抽取的软肋：

- **Kitchen Sink**——把源数据表 1:1 映射成对象属性，不做取舍；属性命名直接抄源系统的字段习惯（比如 `dtLastInspMod`），而不是用业务语言（`lastInspectionDate`）；一条源数据行里混了多个实体，却建成单个对象类型。
- **System Silos**——因为数据来自不同源系统，就给同一个真实世界的实体建多个对象类型。这恰恰是 Knowledge Builder 多源抽取最容易产生的后果。
- **Department Silos**——不同部门各自造一套同一对象类型，映射的是组织架构而不是业务现实。
- **命名歧义**——类型叫"Item"、属性叫"value"，没人知道它到底指产品、订单行，还是金额、数量。

Foundry 给出的应对清单也值得抄过来：对现实建模而非对系统建模、有意识地做取舍、跨团队协作避免重复建模、用接口做抽象而非硬造大而全的类型。这些原则翻译到本书，就是 Knowledge Builder 的 Rule + LLM 抽取必须配合质量纪律——LLM 输出不仅要过 Validation，还要过"是不是在照搬源 schema"这道关。否则建出来的 Ontology 越大，垃圾越多。<span class="src">来源：Foundry Ontology 文档，Ontology 设计最佳实践/反模式</span>

---

# 14. Version Management

Ontology：

必须版本化。

例如：

```
Experiment

v1

↓

v2

↓

v3
```

支持：

Snapshot

Diff

Rollback

Replay

Agent：

才能：

解释历史。

---

# 15. Streaming Update

推荐：

Fluss：

实时 Context Bus。

所有：

新增：

修改：

删除：

都：

Event 化。

Builder：

消费：

Event。

更新：

Ontology。

不是：

每天全量重建。

---

# 16. 插件架构

建议：

```go
type Connector interface {

    Discover()

    Extract()

    Normalize()

    Sync()

}
```

Builder：

不关心：

数据源。

统一：

Connector。

---

# 17. Trace

Builder：

必须：

记录：

```
Entity

来源

抽取规则

LLM Prompt

Confidence

更新时间

```

方便：

Explain。

---

# 18. MVP

建议：

第一版：

支持：

- MySQL

- Paimon

- Git

- MLflow

- PDF

自动：

Entity

Relation

Document

即可。

Event：

第二版。

Action：

第三版。

---

# 19. 工程拆分

建议拆成：

```
knowledge-builder/

connector/

mysql/

git/

mlflow/

pdf/

extractor/

entity/

relation/

event/

metric/

action/

validator/

version/

trace/
```

方便：

独立开发。

---

# 20. 本章总结

Knowledge Builder 的职责不是导入数据。

而是：

持续构建企业知识。

它最终输出的是：

统一 Ontology。

后续所有：

Retriever、

Graph Expansion、

Context Engine、

Agent Runtime，

都建立在 Builder 的输出之上。

一句话总结：

> Knowledge Builder 是企业知识进入 AI 世界的入口，也是 Context Engine 的知识生产流水线。

## 21. 实施优先级与评测

首个版本应优先完成 Connector SDK、Entity/Relation 抽取、增量同步、Schema 校验和发布回放。LLM 抽取必须与规则校验、人工审核和来源证据结合，不能直接把模型输出写入生产 Ontology。

建议以以下指标评估 Builder：实体识别准确率、关系准确率、来源覆盖率、增量延迟、冲突率、人工审核通过率和历史版本可重放率。详细接口和 Schema 以第2章契约为准。
