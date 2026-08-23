# 第2章 Context Object Model（上下文对象模型）

> Context Engine 技术架构设计 v1.0

> 本章是全书唯一的对象模型和 Context Package 契约。其他章节不得重新定义这些字段。

## 1. 为什么需要统一对象模型

传统 RAG 的最小单元是 Document Chunk，而 Context Engine 的最小单元是 **Object（对象）**。

统一对象模型的目标：

- 为 Knowledge Builder 提供统一抽象
- 为 Hybrid Retrieval 提供统一检索对象
- 为 Graph Expansion 提供统一节点
- 为 Agent 提供统一 Context Package

---

## 2. Context 的组成

Context 由七类对象组成：

| 类型 | 说明 | 示例 |
|------|------|------|
| Entity | 实体对象 | Experiment、Dataset、WindTurbine |
| Relation | 对象关系 | uses、belongs_to |
| Event | 事件 | TrainingStarted、AlarmRaised |
| Metric | 指标 | Loss、Accuracy、Latency |
| Action | 可执行动作 | deploy、restart |
| Document | 文档 | SOP、Notebook、PDF |
| Policy | 权限与规则 | ACL、脱敏、审计 |

把对象拆成"类型+属性+关系+动作"四件套，是工业上已被验证的成熟做法。Palantir Foundry 的 Ontology 就以这四者为核心类型，并给了好用的类比：对象类型≈表、对象≈行、属性≈列、链接≈join——用数据集的语言解释对象模型，门槛立刻降下来。本书七类对象（尤其 Entity/Relation/Action）与此同构，额外把 Event、Metric、Document 单列，是因为这三类在 AI 场景下都有独立的时序、聚合和证据语义，值得一等公民待遇。<span class="src">来源：Foundry Ontology 文档，Object and link types</span>

所有对象都应携带以下通用元数据：

```yaml
id: exp-001
type: Experiment
schema_version: "1.0"
source: mlflow
source_ref: mlflow://experiment/1
provenance: []
confidence: 0.98
valid_time: {start: null, end: null}
observed_at: 2026-07-17T10:00:00Z
tenant: tenant-a
```

校验逻辑也应"随类型走"，而不是散落每个字段各写一遍。Palantir Foundry 的 Value Type 机制就是这个思路：把正则、枚举、范围、唯一性这些约束绑定到一个语义类型上（比如定义带正则的 `email` 类型），任何引用它的属性自动继承校验。校验和治理权限也分开——"使用"一个类型和"定义/治理"一个类型是两件事。本书第 3 章 Validation 遵循同一纪律：校验失败的对象不得进入 Ontology，而校验规则本身应沉淀在类型层，而不是每条抽取规则里重复实现。<span class="src">来源：Foundry Ontology 文档，Value types</span>

---

## 3. Entity 模型

Entity 是整个 Ontology 的核心。

建议统一字段：

```yaml
id: exp-001
type: Experiment
name: glm52_ablation
properties:
  owner: alice
  framework: pytorch
tags:
  - research
status: Running
version: v1
```

设计原则：

- 全局唯一 ID
- 类型明确
- 属性可扩展
- 支持版本演进

---

## 4. Relation 模型

Relation 描述对象之间的业务关系。

```yaml
source: experiment-1
relation: uses
target: dataset-1
confidence: 0.98
```

Relation 应支持：

- 双向查询
- 权重
- 来源
- 生命周期

---

## 5. Event 模型

Event 描述对象状态变化。

```yaml
type: TrainingFinished
time: 2026-07-17T10:00:00Z
actor: trainer
object: experiment-1
```

Event 是构建 Realtime Context 的基础。

---

## 6. Metric 模型

Metric 描述可量化指标。

```yaml
name: Loss
value: 0.213
timestamp: 2026-07-17T10:00:00Z
```

支持：

- 时序
- 聚合
- 趋势分析

---

## 7. Action 模型

Action 定义 Agent 可以执行的能力。

```yaml
name: deploy
resource: model-service
parameters:
  version: latest
```

Action 不仅用于回答问题，还支持 Agent 自动执行。

把 Action 和 Policy 列为一等公民对象而非外挂功能，这设计有工业先例。Palantir Foundry 把 Ontology 内容分两半：语义元素（objects/properties/links，描述"是什么"）和动态元素（actions/functions/动态安全策略，描述"能做什么、必须遵守什么"）。它认为只有语义元素、没有动态元素的 Ontology 是不完整的——企业真正运转靠决策和行动，不是静态描述。本书把 Action（可执行动作）和 Policy（权限规则）都建模成对象，正是对"动态元素"的对应：上下文不只是供阅读的信息，还包括可执行的动作与必须遵守的约束。<span class="src">来源：Foundry Ontology 文档，Ontology 概览</span>

---

## 8. Context Package

Context Engine 输出统一采用 Context Package。

```yaml
context:
  objects: []
  relations: []
  events: []
  metrics: []
  actions: []
  documents: []
  policy: {}
  trace: {}
  token_budget: 24000
  schema_version: "1.0"
```

Agent 只消费 Context Package，而不是直接消费 Prompt。

Policy 是输出约束而不是普通排序特征：任何对象在进入最终 Package 前都必须经过授权、脱敏和审计检查。

权限要落到这步，得先分清两件事："能不能改类型定义"和"能不能看到具体数据"。Palantir Foundry 把 Ontology 资源权限（类型定义层：名称、属性名、类型、描述）和对象实例权限（数据层：主键和属性值）分两层独立管理——前者是治理，后者是可见性。它还经历三代演进：数据源派生权限 → Ontology 角色 → 统一项目权限，核心收益是把权限模型统一成一个心智、且可解释。本书 Policy（输出约束）与第 6 章 Permission（直接过滤而非降分），遵循的就是同一种分层思路。<span class="src">来源：Foundry Ontology 文档，Permissioning / Viewing usage</span>

---

## 9. Schema 演进

设计要求：

- Schema Version
- 向后兼容
- 属性可扩展
- 类型可新增
- 保证历史 Context 可重放

而"历史可重放"不只是加版本号，它牵涉存储层。Palantir Foundry 的经验是：破坏性 Schema 变更（改属性类型、换数据源、改主键）后能否迁移已有用户编辑，取决于底层存储架构。它的旧版存储（Phonograph）不支持编辑迁移——一旦破坏性变更，历史编辑要么丢失要么靠人工抢救；新版（OSv2）才从架构上解除限制。本书提醒：Schema 演进不能只在模型层做版本管理，存储层从一开始就得为"编辑迁移"留好能力，否则历史回放会卡在数据搬不动上。<span class="src">来源：Foundry Ontology 文档，Object edits and materializations</span>

---

## 10. Context Object 生命周期

```text
Discovery
   ↓
Normalization
   ↓
Ontology Store
   ↓
Retrieval
   ↓
Graph Expansion
   ↓
Context Package
   ↓
Agent
```

---

## 11. 与数据平台映射

| 数据来源 | 映射对象 |
|----------|----------|
| MLflow | Experiment、Metric |
| Git | Commit、Repository |
| Notebook | Document |
| Paimon | Dataset |
| Kafka/Fluss | Event |
| MySQL | Entity |
| PDF | Document |

---

## 12. 本章小结

Object 是 Context Engine 的一等公民，Document 是一种对象来源和证据载体。Knowledge Builder 负责生成对象，Retrieval 和 Expansion 负责发现对象，Ranking 和 Optimizer 负责选择表达方式，Agent 最终消费标准化 Context Package。
