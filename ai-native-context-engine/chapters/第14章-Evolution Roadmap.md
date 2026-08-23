# 第14章 Evolution Roadmap（演进路线）

> AI Knowledge Runtime（AKR）
>
> Version：v1.0
>
> Status：Draft

---

# 1. 产品愿景

AI Knowledge Runtime（AKR）的最终目标不是构建一个更好的 RAG。

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

都是完整产品。

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

研发周期：

3~4个月。

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

研发周期：

4~6个月。

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

研发周期：

6~9个月。

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

最终：

形成：

Enterprise AI OS。

---

# 3. MVP（6个月）

第一阶段：

重点：

能够支撑：

Research Agent。

建议：

```
Hybrid Retrieval

+

Context Package

+

Graph Expansion

+

Context Ranking

+

Prompt Builder
```

暂时：

不要：

复杂 Workflow。

不要：

Distributed Runtime。

保证：

简单。

稳定。

---

# 4. V2（12个月）

重点：

Business Context。

新增：

```
Business Context

Research Context

Realtime Context

Context Cache

Trace

Debugger
```

支持：

多个：

Agent。

---

# 5. V3（18个月）

重点：

Context Runtime。

新增：

```
Context Version

Context Delta

Context Snapshot

Context Share

Context Event Bus
```

形成：

Runtime。

---

# 6. V4（24个月）

目标：

Enterprise AI Runtime。

支持：

```
Multi-Agent

Context Protocol

Context Plugin

Context Marketplace

Context Federation
```

真正成为：

企业 AI 基础设施。

---

# 7. 技术路线

建议：

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

# 8. Context Engine 自身如何迭代

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

经验可观测性 → 第10章 RCA + Trace 分层

决策可观测性 → 第10章证据日志 + 第8章 Version
```

三条支柱里最关键的不是怎么改。

而是边界。

AHE 划了一条硬约束。

编辑只能作用于 harness workspace。

runs 目录。

tracer。

verifier。

LLM 配置。

全部只读。

这直接堵死了一大类 reward hacking。

比如让 agent 偷偷关掉 verifier。

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

```
收集失败轨迹

↓

归因到具体组件

↓

提出有边界的编辑候选

↓

held-in 验证弱点是否解决

+

held-out 检查是否引入新问题

↓

两边都不退化才接受
```

被拒绝的候选记录但不改变当前 harness。

这个环和第10章 RCA 是同一套能力的两面。

RCA 是诊断。

AHE 是诊断后安全地改。

---

# 9. 自我改进的风险与人的位置

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

# 10. 与现有平台结合

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

# 11. 产品矩阵

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

# 12. 商业化路径

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

# 13. 与 Palantir Foundry 的区别

Palantir：

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

# 14. 一句话总结

AI Knowledge Runtime（AKR）的目标不是成为新的知识库，也不是新的 Agent 平台。

而是：

> **构建企业 AI 的 Context Runtime，让企业所有 Agent 基于统一上下文理解业务、协同推理、执行任务，并持续演化。**

Context 将成为企业 AI 时代最重要的基础设施。
