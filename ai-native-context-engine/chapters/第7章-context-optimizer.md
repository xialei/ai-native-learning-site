# 第7章 Context Optimizer 技术架构设计

> AI Knowledge Runtime（AKR）核心模块
>
> Version：v1.0
>
> Status：Draft

本章负责候选 Context 的去重、合并、压缩、Token 分配，并把装配好的 Context Package 交给 Prompt Builder（第1章 §4）做最终结构化组装。候选选择属于第6章，运行时状态属于第8章。

---

# 1. 模块定位

Context Optimizer 位于 Context Ranking 之后。

职责：

> **在有限上下文窗口（Context Window）内，以最低 Token 成本构建最高质量的 Prompt Context。**

它不是简单的 Token 裁剪器。

而是：

Context Engineering Engine。

---

# 2. 为什么需要 Context Optimizer

经过：

```
Hybrid Retrieval

↓

Graph Expansion

↓

Context Ranking
```

通常得到：

```
200 Objects

100 Relations

30 Documents

50 Events
```

总计：

```
250K Token
```

但是：

GPT

Claude

GLM

Qwen

上下文：

有限。

必须：

优化。

而不是：

直接截断。

---

# 3. 整体架构

```
Ranked Context

↓

Duplicate Remove

↓

Object Merge

↓

Document Compression

↓

Summary

↓

Token Allocation

↓

→ Prompt Builder（交接，见 §14）

↓

Final Context
```

---

# 4. 优化目标

Context Optimizer：

目标不是：

最少 Token。

而是：

最大：

```
Information Gain

──────────────

Token Cost
```

即：

单位 Token：

信息量：

最高。

反直觉的事实：精炼不等于体积小。Palantir Foundry 明确指出 Ontology 体积往往比原始数据集还大——索引不可压缩，加额外存储开销。但它的设计初衷是作为"高度精炼数据"的快速访问后端，所以仍要主动控制规模：多少个 object type、每个类型多少对象、每个对象多少属性。本书 Optimizer 的"最大信息增益/Token 成本"目标正需要这种规模治理意识——不是一味求少，而是在"精炼后仍可能很大"前提下，把每份体积都用在信息密度最高的地方。<span class="src">来源：Foundry Ontology 文档，Ontology volume</span>

---

# 5. Optimization Pipeline

```
Ranked Context

↓

Permission Filter

↓

Duplicate Merge

↓

Object Merge

↓

Relation Compression

↓

Document Summary

↓

Token Allocation

↓

Prompt Builder
```

---

# 6. Duplicate Remove

不同 Retriever：

可能返回：

同一对象。

例如：

Experiment

来自：

Graph

SQL

Vector

Merge：

统一：

Object。

避免：

重复。

---

# 7. Object Merge

多个 Object：

信息：

互补。

例如：

GPU：

Graph：

型号。

Prometheus：

利用率。

Kubernetes：

Node。

最终：

融合。

生成：

一个：

GPU Object。

---

# 8. Relation Compression

Graph：

可能：

```
Experiment

↓

Dataset

↓

Feature

↓

Statistics
```

如果：

Feature：

没有价值。

直接：

压缩：

```
Experiment

↓

Dataset

↓

Statistics
```

减少：

Relation。

---

# 9. Document Compression

不是：

Chunk。

而是：

Document Summary。

例如：

SOP：

20 页。

压缩：

200 Token。

保留：

关键步骤。

---

# 10. Event Compression

例如：

1000 条：

Training Log。

压缩：

```
Training Started

↓

OOM

↓

Restart

↓

Finished
```

形成：

Timeline。

---

# 11. Metric Compression

例如：

Loss：

1000 个点。

保留：

```
Min

Max

Current

Trend
```

无需：

全部。

---

# 12. Token Allocation

不同类型：

预算：

不同。

例如：

```
Objects

25%

Relations

10%

Metrics

10%

Events

10%

Documents

35%

Actions

10%
```

预算：

动态调整。

---

# 13. Adaptive Budget

根据：

模型：

自动：

调整。

例如：

8K：

保留：

Object。

128K：

保留：

更多：

Document。

1M：

无需：

Summary。

---

# 14. Prompt Assembly（交接 Prompt Builder）

Optimizer 的终点是把装配好的 Context Package 交给 Prompt Builder（第1章 §4）做最终结构化组装，而非 Optimizer 自己拼 Prompt。

最终：

输出：

```
ContextPackage

↓

Prompt Template

↓

LLM
```

Prompt：

不是：

拼接。

而是：

结构化。

例如：

```
Objects

Relations

Events

Metrics

Documents

Actions
```

分别：

组织。

---

# 15. Explain

支持：

Explain。

例如：

```
Document A

↓

Summary

↓

200 Token

↓

原因：

Token Budget
```

方便：

Debug。

---

# 16. API

统一：

```
type ContextOptimizer interface {

    Optimize(

        ctx context.Context,

        pkg ContextPackage,

        budget TokenBudget,

    ) (PromptContext,error)

}
```

支持：

插件。

---

# 17. Cache

Summary：

缓存。

Graph：

缓存。

Object：

缓存。

Prompt：

缓存。

避免：

重复：

Summary。

---

# 18. MVP

第一阶段：

✓ Duplicate

✓ Merge

✓ Summary

✓ Token Allocation

✓ Prompt Assembly

第二阶段：

✓ Adaptive Budget

✓ Timeline Compression

✓ Graph Compression

第三阶段：

✓ Reinforcement Optimization

✓ LLM Self Compression

✓ Context Learning

---

# 19. 与其他模块关系

各模块在流水线中的职责与边界见第1章 §4。本章定位：在 Ranking 之后负责压缩与 Token 分配（Compress）。

---

# 一句话总结

Context Optimizer 的目标不是减少 Token。

而是：

**让每一个 Token 都尽可能携带更多业务信息。**

它决定了：

Agent 是否能够在有限 Context Window 内完成复杂推理。

# Reasoning-aware Compression（推理感知压缩）

不同任务：

压缩：

不同。

例如：

问：

为什么训练失败？

保留：

Timeline。

删除：

README。

问：

如何部署？

保留：

SOP。

删除：

Loss。

Compression：

应该：

由：

Intent Planner：

控制。

# Progressive Context（渐进式上下文）
它把 Context 从静态 Prompt 变成了一个可按需加载、可持续演化的运行时资源。

不要一次：

全部：

Context。

而是：

Round1

↓

Need More

↓

Round2

↓

Need More

↓

Round3

Context：

随着：

Agent：

推理：

不断：

扩展。

类似：

CPU：

Demand Paging。

# Context 作为可演化的 Playbook

前面讲的压缩都是把当前一坨内容压小。

但还有一层更深的转变。

把上下文当成一份可进化的 playbook。

一组结构化要点。

会随任务推进被增量更新。

而不是每次都从零重写一个 prompt。

学术界把它提炼成 ACE。

Agentic Context Engineering。

三个角色。

Generator。

参照现有的结构化要点生成任务轨迹。

Reflector。

从成功和失败轨迹中提炼洞察。

找出下次该保留什么、该改什么。

Curator。

增量式更新结构化上下文。

不是重写整个 prompt blob。

而是输出带 id 的结构化条目。

用确定性逻辑合并去重。

这套分工对应到本书。

Generator 是 Optimizer 在做的事。

生成当前要进 Prompt 的内容。

Reflector 是第10章 RCA 在做的事。

从轨迹提炼失败洞察。

Curator 是 Optimizer 还缺的那一环。

把洞察沉淀回一份持续维护的结构化上下文。

跨轮次复用。

MVP 第三阶段那个模糊的 Context Learning。

可以就用 ACE 这三角色来定义。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.1</span>

Curator 为什么强调增量合并去重而不是重写。

因为反复总结再总结会掉进两个坑。

上下文坍塌。

每一轮摘要都丢一点信息。

几轮下来关键细节没了。

简洁偏差。

模型倾向越写越短。

把该保留的精确数值、路径、报错都省略掉。

正确的做法是维护一份持续增量合并、定期去重的结构化日志。

旧信息保住。

新进展并入。

过时的才删。

而不是把上一版摘要整个推翻重写。

这和第8章 Snapshot 的 fork-验证-原子合并是同一种纪律。

改的是增量。

底盘不动。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.1</span>

再往前一步。

可以把上下文管理策略本身做成可配置、可版本化、可评估的对象。

MCE。

Meta Context Engineering。

一个策略就是一个 skill。

有静态部分。

策略说明。

有动态部分。

它维护的上下文加历史 rollout 数据。

统一用标准读写工具操作。

这意味着 Research Context、Business Context、Coding Context 可以各自维护一套独立的压缩与编排策略。

针对不同业务线独立进化。

而不是一套规则写死在 Optimizer 代码里。

这正好呼应第11、12章领域插件化的方向。

不只是对象模型插件化。

上下文管理策略也插件化。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.1</span>
