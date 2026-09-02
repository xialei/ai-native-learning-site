# 第14章 Evolution Roadmap（演进路线）

> Context Engine（AKR）演进路线
>
> Version：v1.0
>
> Status：Draft

---

# 1. 产品愿景

AI Knowledge Runtime（AKR，本书平台层的总称；Context Engine 是其核心引擎，见第 2 章 §13 术语表）的最终目标不是构建一个更好的 RAG。

而是：

> **构建企业 AI 的统一 Context Runtime，让所有 Agent 基于统一上下文完成推理、协作和执行。**

最终形成：

```
Enterprise Data

↓

Knowledge Builder

↓

Context Engine

↓

Business Runtime

↓

Agent Runtime

↓

Enterprise AI Applications
```

Context Engine：

成为整个 AI 平台的核心。

---

# 2. 总体演进路线

建议采用四个阶段。

```
Knowledge

↓

Context

↓

Runtime

↓

AI Operating System
```

每一个阶段：

都以"该阶段能力可独立交付、并支撑至少一个付费场景"为完成标准（验收指标见各 Phase 末行）。

---

# Phase 1：Knowledge Engine

目标：

统一企业知识。

能力：

✓ Ontology

✓ Knowledge Builder

✓ Hybrid Retrieval

✓ Context Package

✓ Prompt Builder

对应产品：

企业知识助手。

验收指标：Package 生成 P95 延迟、token_budget 命中率、检索召回@k。

研发周期：

3~4个月（里程碑 M1：Ontology + Knowledge Builder；M2：Hybrid Retrieval + Context Package + Prompt Builder）。

---

# Phase 2：Context Engine

目标：

统一企业上下文。

新增：

✓ Graph Expansion

✓ Context Ranking

✓ Context Optimizer

✓ Context Runtime

✓ Context Cache

✓ Context Trace

形成：

真正 Context Engine。

对应产品：

Research Copilot

Business Copilot

Coding Copilot

验收指标：扩展命中率、缓存命中率、Trace 覆盖率。

研发周期：

4~6个月（里程碑 M3：Graph Expansion + Context Ranking；M4：Context Optimizer + Context Cache；M5：Context Runtime + Context Trace）。

---

# Phase 3：Business Runtime

目标：

Context 成为企业运行时。

新增：

✓ Business Context

✓ Research Context

✓ Realtime Context

✓ Workflow

✓ Context Event

✓ Context Subscription

✓ Multi-Agent Context

形成：

Business Runtime。

对应产品：

行业 Agent 平台。

验收指标：多 Agent 合并冲突率、订阅端到端延迟、实时 Context 陈旧度上限。

研发周期：

6~9个月（里程碑 M6：领域插件 Research/Business Context；M7：Realtime Context + Workflow；M8：Multi-Agent Context + Event Bus）。

依赖：Phase 2 的 Context Runtime（Version/Delta/Snapshot）与 Context Cache（Realtime 依赖缓存降延迟）、第 8 章的 Version/Lock/Merge（Multi-Agent 依赖）。

---

# Phase 4：Enterprise AI Operating System

最终目标：

Context 成为企业 AI 操作系统。

新增：

✓ Context Protocol

✓ Context Scheduler

✓ Context Marketplace

✓ Domain Context Plugin

✓ Multi-Agent Runtime

✓ Autonomous Workflow

验收指标：协议跨租户兼容性、插件接入工时。

依赖：Phase 3 的 Multi-Agent Context（协议在本书中已由第 13 章定义雏形，本阶段做标准化与跨租户实现）、第 11/12 章的插件体系（Marketplace 依赖）。

研发周期：

9~12个月（里程碑 M9：Context Protocol 标准化 + 插件 Marketplace；M10：Scheduler / Federation，其中 Scheduler 与 Federation 本书只给出职责边界，详细设计超出本书范围）。

---

# 3. 时间线对照（MVP → V4）

上面四个 Phase 是**能力划分**；本节给一套按月份推进的**交付时间线**。二者不是两套路线图——时间线上的每个节点都是某个 Phase 的里程碑子集，能力只出现一次（标注所属 Phase），不再重复罗列。

| 时间点 | 交付内容 | 所属 Phase / 里程碑 |
|--------|---------|--------------------|
| 6个月（MVP） | Hybrid Retrieval + Context Package + Graph Expansion + Context Ranking + Prompt Builder，支撑 Research Agent | Phase 1 M2 + Phase 2 M3 |
| 12个月（V2） | + Context Optimizer / Cache / Trace，+ Business & Research 领域插件，支撑多 Agent 只读场景 | Phase 2 M4~M5 + Phase 3 M6 |
| 18个月（V3） | + Realtime Context / Workflow / Event Bus / Multi-Agent Context（Version / Delta / Snapshot 在此阶段随 Runtime 完整交付） | Phase 3 M7~M8 |
| 24个月（V4） | + Context Protocol 标准化 + Plugin Marketplace | Phase 4 M9 |

MVP 阶段刻意不做的事：复杂 Workflow、Distributed Runtime、Multi-Agent 写入——保证简单稳定；这些能力在 V3 由 Phase 3 承接。Context Federation 与 Context Scheduler 属于 Phase 4 的 M10，超出 24 个月时间线的承诺范围。

---

# 4. 技术路线

与 Phase / 时间线同一口径的三年视图（不再引入新的阶段划分）：

第一年：

```
Ontology

↓

Knowledge Builder

↓

Hybrid Retrieval

↓

Context Package
```

第二年：

```
Context Runtime

↓

Business Runtime

↓

Context Protocol
```

第三年：

```
Enterprise AI OS
```

逐步演进。

---

# 5. Context Engine 自身如何迭代

前面十四章都在讲怎么给 Agent 造上下文。

但没有回答：

Context Engine 自己的 prompt、检索策略、压缩规则。

由谁改。

怎么改。

改坏了怎么防。

这就是 harness 工程里单列的一层。

自我改进的 harness。

一个朴素直觉：

让模型自己改自己的配置。

但结论很审慎。

递归结构本身不够。

基座模型必须有足够能力才能改进机制本身。

早期实验 STOP。

改进者改进自己。

强模型上持续改进。

弱模型上反而变差。

harness 改进放大的是模型能力的部署效果。

而不能替代模型智能。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

还有一条对模型选型实用的发现。

能写出有用的 harness 编辑。

不同规模模型间差异不大。

小模型也能写出和大模型同构的 skill。

但用好更新后 harness 的能力是非单调的。

中等档位模型受益最大。

因为它需要足够的长程指令遵循和精准工具调用时机。

这提醒本书模型选型。

不能只看写配置的能力。

更要单独评估长程指令遵循加工具调用时机。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3 引 Lin et al., 2026</span>

真正工程化程度最高的是 AHE。

三大支柱。

组件可观测性。

经验可观测性。

决策可观测性。

它在 Terminal-Bench-2 上优于人工设计。

而且冻结后不再进化。

也能迁移到 SWE-bench-verified 并保持优势。

学到的是可迁移的工程经验。

而不是针对某个 benchmark 的过拟合技巧。

三大支柱映射到本书：

```
组件可观测性 → 第1章核心模块 + 第8章运行时组件

经验可观测性 → 第10章 Explain（§6–10）+ Timeline（第10章 §11）

决策可观测性 → 第10章 §4 Trace（Context Version 字段）+ 第8章 §9 Version
```

本节的改进环与第 10 章是同一闭环的两面：失败轨迹收集→归因→编辑候选→held-in/held-out 验证→接受/回滚，其执行机制（Replay/Diff/Evaluation 门禁）与日志 schema（**编辑日志 Change Manifest** 六字段）在第 10 章 RCA（§19）与 §14A 定义，本章不重复，只讨论迭代机制与边界。

三条支柱里最关键的不是怎么改。

而是边界。

AHE 划了一条硬约束。

编辑只能作用于 harness workspace。

runs 目录。

tracer。

verifier（评测器，见第 2 章 §13 术语表）。

LLM 配置。

全部只读。

这直接堵死了一大类 reward hacking。

比如让 agent 偷偷关掉评测器。

换个更弱的模型。

偷偷加大推理预算。

好让进步指标好看。

每一份进步都必须能归因到 harness 编辑本身。

而不是归因到把裁判换走了。

在本书落地就是：

把可编辑区和只读区在架构层硬隔离。

可编辑区：

检索权重。

压缩规则。

ranking 阈值。

prompt 模板。

只读区：

trace 数据。

评测器。

模型网关配置。

Policy Engine 的 ACL 规则。

不是靠约定。

而是和第1章 Policy Engine 一起作为不可被自动化改动的底盘。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

这套范式对应到本书路线图是一个新阶段。

不改变 Phase 1→4 的产品划分。

但在每个 Phase 之上叠加一个持续改进环。

```mermaid
flowchart TD
  A["收集失败轨迹<br/>（第10章 Trace）"] --> B["归因到具体组件<br/>（第10章 RCA）"]
  B --> C["提出有边界的编辑候选<br/>（Change Manifest）"]
  C --> D{"双数据集回归"}
  D -- "held-in：弱点是否解决" --> E["两边都不退化才接受"]
  D -- "held-out：是否引入新问题" --> E
  E -- "接受 → 下一轮监控" -.-> A
  E -- "拒绝 → 仅记录" --> F["被拒候选归档<br/>（不改变当前 harness）"]
  style A fill:#f4e6e4,stroke:#b4332a
  style C fill:#f4e6e4,stroke:#b4332a
  style D fill:#eef4ee,stroke:#2f6b3a
  style F fill:#f3f1ea,stroke:#9a978f,stroke-dasharray: 5 5
```

图例：红=读/写数据与编辑候选，绿=验证关卡，灰虚线框=只进档案不进 harness；虚线箭头=回到环入口的迭代回边。

被拒绝的候选记录但不改变当前 harness。

这个环和第10章 RCA 是同一套能力的两面。

RCA 是诊断。

AHE 是诊断后安全地改。

---

# 6. 自我改进的风险与人的位置

把自动改进打开。

就要同时把它管住。

文献把这条路上的坑列成清单。

逐条对照本书：

弱/模糊的评估器。

只有指标可量化、客观的任务。

自我改进循环才 work 得好。

涉及语义理解质量的任务。

评估器设计是长期难点。

第10章 Quality Score 不能只靠单测通过率。

负面结果。

模型训练数据整体偏向成功案例。

导致模型不擅长判断该放弃这个假设了。

Harness 应该让失败尝试容易被保留下来。

这直接呼应上面的弱点挖掘设计。

也是缩小任务搜索空间最有效的方式之一。

多样性坍塌。

进化循环容易过度利用已知高回报模式。

收敛到同质解。

若未来让 skill/prompt 库自动进化。

需要专门机制防止同质化。

基于 embedding 相似度的新颖性拒绝采样。

子代越多父代被选概率越低。

长期健康度。

短期任务完成度指标无法捕捉可维护性。

职责边界。

迁移成本。

向后兼容性。

对企业级交付场景尤其重要。

这也是 Phase 4 把 Context Federation 列为独立能力的原因。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §5</span>

最后一条关于人的位置。

原则不是把人移出循环。

而是让人上移到更高的抽象层。

人应该设在 harness 编辑验证。

证据链审计。

这类关键决策点上。

而不是陷入具体 prompt 调优。

自动化的改进环处理可复现、可窄范围修改的问题。

涉及职责边界、权限扩张、向后兼容的决策。

保留人工介入点。

回到路线图本身。

文献的两阶段预测可以作为本书判断锚点。

为什么模型越来越强还要投资 Context Engine。

短期内 harness 工程往元方法论演化。

优化的不是答案本身。

而是获得更好答案的机制。

长期看很多 harness 层的改进最终会被内化进模型本身。

类比 prompt engineering 的手工技巧被 instruction tuning 取代。

但指定目标、约束、上下文和评估标准的需求不会消失。

harness 层的接口价值是持久的。

只是实现细节会被模型能力吸收。

这意味着投资本书指定目标/约束/评估这一层的抽象和协议设计。

Context Protocol。

Policy。

Trace schema。

比投资具体的手工规则更有长期价值。

因为前者不会被模型进步淘汰。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §3</span>

---

# 7. 与现有平台结合

结合现有 AI Platform：

```
AI Gateway

↓

Context Engine

↓

Knowledge Runtime

↓

Research Context

↓

Business Context

↓

Agent Runtime

↓

AI CLI

↓

Workflow

↓

Notebook

↓

Training

↓

Deployment
```

形成：

统一平台。

---

# 8. 产品矩阵

建议最终形成：

```
AI Knowledge Runtime

├── Knowledge Builder

├── Context Engine

├── Context Runtime

├── Research Context

├── Business Context

├── Context Cache

├── Context Observability

├── Context Protocol

├── AI Gateway

├── AI CLI

└── Agent Runtime
```

所有能力：

统一产品。

---

# 9. 商业化路径

建议产品化路线：

第一阶段：

Research Copilot

↓

第二阶段：

Business Copilot

↓

第三阶段：

行业 Context Plugin

↓

第四阶段：

Enterprise AI Runtime

↓

第五阶段：

Context Marketplace

逐步扩大客户价值。

---

# 10. 与 Palantir Foundry 的区别

Palantir 的 OAG（Object Augmented Graph，对象增强图：Ontology 对象实例经关系链接构成的图，是 Foundry 消费层数据的组织形态）：

```
Ontology

↓

OAG

↓

Application
```

AKR：

```
Knowledge Builder

↓

Context Engine

↓

Context Runtime

↓

Business Runtime

↓

Agent Runtime

↓

Application
```

AKR：

更加关注：

Context 的生命周期。

Agent 协作。

实时上下文。

Context 可观测性。

Context Protocol。

不过有一处值得反过来向 Foundry 借鉴：模型和工具的接入应标准化成契约。Foundry 的 Function Interface 描述"函数该长什么样"——输入、输出、错误类型的规范，本身不是函数，而是让别的函数去实现的契约。最直接的案例是它的 chat completion 接口：用户注册的自建模型本质就是"实现了这个接口的函数"，几乎等同于"包一层 OpenAI 兼容适配器"的现成模板。本书主张"Agent 不直接访问数据源、统一从 Context Engine 获取上下文"，这层抽象同样可走"接口契约+多实现"——把检索、扩展、压缩各环节都定义成接口，具体模型、具体数据源作为可替换实现插进来，平台演进时换底层不动契约。<span class="src">来源：Foundry Ontology 文档，Function interfaces</span>

---

# 11. 一句话总结

AI Knowledge Runtime（AKR）的目标不是成为新的知识库，也不是新的 Agent 平台。

而是：

> **构建企业 AI 的 Context Runtime，让企业所有 Agent 基于统一上下文理解业务、协同推理、执行任务，并持续演化。**

Context 将成为企业 AI 时代最重要的基础设施。
