# AI Native Context Engine

这是一套面向企业 AI 平台工程师、AI 应用工程师和系统架构师的 Context Engine 设计稿。

全书围绕一条主线展开：

```text
对象模型 → 知识构建 → 检索 → 图扩展 → 选择 → 压缩 → 运行时 → 观测 → 多 Agent 协作
```

Context Engine 的目标不是替代模型或数据平台，而是把企业数据转换为可理解、可推理、可执行且可审计的上下文。

## 在线阅读

成书版本（每章一个 HTML，配 Mermaid 架构图）位于 [`books/`](books/) 目录：

👉 **[打开目录页](books/index.html)** — 本地直接用浏览器打开 `books/index.html` 即可阅读全书。

> 架构图通过 Mermaid.js CDN 渲染，打开时需要联网；离线阅读可在 `books/` 下用任意静态服务器（如 `python3 -m http.server`）启动。

## 目录

| # | 成书版（HTML） | 原始设计稿（Markdown） |
|---|---|---|
| 0 | [概述 · 把"上下文"当成产品来做](books/chapter-00-overview.html) | [概述](chapters/Context%20Engine%20技术架构设计.md) |
| 1 | [总体架构](books/chapter-01-architecture.html) | [总体架构](chapters/第1章-总体架构-ContextEngine.md) |
| 2 | [Context Object Model](books/chapter-02-object-model.html) | [Context Object Model](chapters/第2章-ContextObjectModel.md) |
| 3 | [Knowledge Builder](books/chapter-03-knowledge-builder.html) | [Knowledge Builder](chapters/第3章-KnowledgeBuilder设计.md) |
| 4 | [Context Retrieval Framework](books/chapter-04-hybrid-retrieval.html) | [Hybrid Retrieval](chapters/第4章-hybrid-retrieval.md) |
| 5 | [Graph Expansion](books/chapter-05-graph-expansion.html) | [Graph Expansion](chapters/第5章-graph-expansion.md) |
| 6 | [Context Ranking](books/chapter-06-context-ranking.html) | [Context Ranking](chapters/第6章-context-ranking.md) |
| 7 | [Context Optimizer](books/chapter-07-context-optimizer.html) | [Context Optimizer](chapters/第7章-context-optimizer.md) |
| 8 | [Context Runtime](books/chapter-08-context-runtime.html) | [Context Runtime](chapters/第8章-Context-Runtime.md) |
| 9 | [Context Cache](books/chapter-09-context-cache.html) | [Context Cache](chapters/第9章-Context-Cache.md) |
| 10 | [Context Observability](books/chapter-10-observability.html) | [Observability](chapters/第10章-Context-Observability.md) |
| 11 | [Research Context](books/chapter-11-research-context.html) | [Research Context](chapters/第11章-ResearchContext.md) |
| 12 | [Business Context](books/chapter-12-business-context.html) | [Business Context](chapters/第12章-BusinessContext.md) |
| 13 | [Multi-Agent Context](books/chapter-13-multi-agent.html) | [Multi-Agent Context](chapters/第13章-Multi-Agent%20Context.md) |
| 14 | [Evolution Roadmap](books/chapter-14-roadmap.html) | [Evolution Roadmap](chapters/第14章-Evolution%20Roadmap.md) |

第2章定义全书唯一的对象模型和 Context Package；后续章节只实现或消费这份契约，不重复定义。

## 参考与引用

外部参照有四类，互补不冲突：

- **学术理论背书**：[Agent Harness Engineering 综述](reference/citations.md) —— "harness 决定可靠性天花板"的同行评议级证据 + 量化数字。
- **自我改进机制**：[Harness Engineering for Self-Improvement 笔记](reference/harness-engineering-notes.md)（Lilian Weng, 2026）—— Context Engine 自身如何迭代：AHE 三支柱、组件化 + 证据驱动编辑 + 只读边界、ACE 可演化 playbook。补全书缺失的"自我改进"一层。已嵌入第 1、7、8、10、13、14 章（共 15 处）。
- **数据治理视角**：[Palantir Foundry Ontology 笔记](reference/palantir_citations.md) —— 本体/数据层的工业参照。
- **工程参考实现**：[Pi Agent Harness 引用映射](reference/pi-agent-references.md) —— 开源运行时（可读源码），为 Context Runtime / Optimizer / Cache / 多 Agent / 演进路线的抽象设计提供可核验的落地实现。已嵌入第 7、8、14 章（共 5 处）。

红线：所有引用均标注出处，不编造。Weng 笔记与 Li et al. 综述是两个独立来源，引用时分别标注，不混用。案例数据见 [Case Study Playbook](reference/case.md)。
