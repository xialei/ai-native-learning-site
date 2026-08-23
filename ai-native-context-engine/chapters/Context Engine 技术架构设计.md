# 第0章 概述（Overview）

## 1. 愿景

随着大模型能力增强，企业 AI 系统的瓶颈逐渐从模型转向 Context（上下文）。

**Context Engine 是 AI Agent 的上下文操作系统。**它持续从企业数据中构建、组织、优化并安全地提供上下文，使 Agent 理解真实业务，而不仅是文档内容。

本书面向平台工程师、AI 应用工程师和系统架构师，重点讨论可实现的系统边界、数据契约、运行时和评测方法。

## 2. 问题与非目标

传统 RAG 通常采用“问题 → 文档检索 → Prompt → LLM”。它难以表达对象关系、实时状态、权限约束和多轮演化。

本书不讨论模型训练、通用数据仓库实现，也不试图替代 Agent Framework。Context Engine 位于 Agent 与企业数据之间，负责生成经过治理的 Context。

## 3. 核心抽象

```text
事实（Data） → 语义（Ontology） → 上下文（Context） → 执行（Agent）
```

与传统 RAG 的区别：

| 传统 RAG | Context Engine |
|---|---|
| Document Chunk | Object / Object Graph |
| Vector 为主 | Hybrid Retrieval |
| 静态 Prompt | 动态 Context Package |
| 文档相关性 | 业务语义、权限和证据 |

## 4. 全书主线

```text
Object Model → Knowledge Builder → Retrieval → Expansion
→ Ranking → Optimization → Runtime → Cache → Observability
→ Domain Context → Multi-Agent Context
```

第1章给出系统边界，第2章给出唯一数据契约。Research Context 和 Business Context 是领域插件实例，不重新定义平台基础能力。

## 5. 设计原则

1. Context 是产品，Ontology 是基础设施。工业界最成熟的 Ontology 平台 Palantir Foundry 也持同样立场：Ontology 的价值不在"数据"而在"决策"，它捕捉决策背后的推理与行动，并通过与运营系统的实时连接实现动作集成（Foundry Ontology 文档）。本书把 Ontology 定位为底座、把 Context 定位为交付给 Agent 的产品，正是同一思路。<span class="src">来源：Foundry Ontology 文档，Why create an Ontology</span>
2. Agent 只消费经过授权的 Context，不直接访问原始数据。
3. 检索、扩展、选择和压缩是不同阶段，职责必须可观测。
4. Policy 是硬约束，默认开启，并在输出前重新校验。
5. Context 必须可追溯、可回放、可评测。
6. 在线路径优先保证安全和稳定，再优化延迟与成本。

> 后续章节以第2章的 Context Package 为共同契约，避免重复定义。
