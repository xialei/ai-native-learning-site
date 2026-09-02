# 第8章 Context Runtime 技术架构设计

> Context Engine 核心模块
>
> Version：v1.0
>
> Status：Draft

本章聚焦单 Agent / Session 的 Context 生命周期、版本、快照和恢复。多 Agent 共享协议见第13章。

---

# 1. 模块定位

Context Runtime 是整个 Context Engine 的运行时核心。

职责：

> **负责 Context 的创建、更新、演化、共享和生命周期管理。**

Context 不再只是 Prompt。

而是：

Agent Runtime 的状态。

---

# 2. 为什么需要 Runtime

传统 RAG：

```
Question

↓

Prompt

↓

LLM

↓

结束
```

Context：

生命周期：

只有一次。

但是 Agent：

```
Question

↓

Context

↓

Tool

↓

Observation

↓

New Context

↓

Reasoning

↓

Tool

↓

Observation

↓

Answer
```

整个过程：

Context：

一直变化。

因此：

必须：

Runtime。

---

上面这个循环不是本书自创。

而是 harness 工程文献总结的三个基础设计模式之一。

工作流自动化。

plan → execute → observe → improve → execute。

直到目标达成。

关键不是静态 prompt 模板。

而是让 agent 通过 runtime 分析自己的历史轨迹和失败案例。

在循环中迭代改进。

本书把这条循环落地成 Create → Expand → Optimize → Consume → Update → Snapshot 的生命周期。

并允许在任务规范不清晰时主动向用户澄清。

另外两个模式也和本章直接相关。

文件系统作为持久记忆。

长程任务的实验日志、代码 diff、错误轨迹、历史 rollout 都应该落盘为文件。

而不是塞进 context 或依赖专门的记忆数据库。

这正是本章 Context Store 分 hot/warm/cold 落盘的方向。

以及子代理与后台任务。

主 agent 需要一个轻量进程管理器。

启动。

查日志。

取消。

合并结果。

这在第13章展开。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §1</span>

---

# 3. Runtime 架构

组件分三层——编排层（Runtime 自己）、构建层（Context Engine 调用链）、持久层（Store），外加三类并列的 Context 生产者（不是流水线的先后级）：

```
User
 ↓
Agent
 ↓
┌────────────────────────────────────────────┐
│ Context Runtime（编排层）                     │
│  生命周期 / Session / Snapshot / Lock / Event │
│  └─ 调用 Context Engine 构建链（第4-7章）      │
└────────────┬───────────────────────────────┘
             │ Delta（§7）/ Merge（§8）
┌────────────▼──────────────┐  ┌────────────────────────────┐
│ Context Store（§14 持久层） │  │ Context 生产者（并列来源）     │
│  Hot: Redis                │  │  Tool Runtime               │
│  Warm: Paimon              │◄─│  Memory                     │
│  Cold: Object Storage      │  │  Realtime Context           │
└───────────────────────────┘  │  Retrieval（第4章）           │
                               └────────────────────────────┘
```

Context Runtime：

统一管理：

所有 Context。

---

# 4. Context 生命周期

建议：

生命周期：

```
Create

↓

Load

↓

Expand

↓

Optimize

↓

Consume

↓

Update

↓

Snapshot

↓

Archive
```

而不是：

Prompt：

生成一次。

结束。

---

# 5. Context Session

每次 Agent：

拥有：

一个：

Context Session。

例如：

```
Session

ID

Owner

Goal

Context

History

Memory

Snapshot
```

Session：

就是：

Agent：

工作空间。

---

# 6. Context Snapshot

支持：

Snapshot。

例如：

```
Before Tool

↓

Snapshot

↓

Tool

↓

Snapshot

↓

Reasoning

↓

Snapshot
```

方便：

Replay。

Debug。

Checkpoint。

---

# 7. Context Update

Tool：

执行后：

Context：

更新。

例如：

```
Deploy()

↓

Deployment Status

↓

Context Update
```

不是：

重新 Retrieval。

而是：

提交 Context Delta（增量更新）。

多 Agent 场景下多个 Producer 提交的 Delta 如何合并，见第13章 §7。

---

# 8. Context Merge

多个来源：

```
Tool

Memory

Realtime

Retrieval
```

统一：

Merge。

形成：

最新：

Context。

"该覆盖哪个"不能含糊，必须有显式冲突解决策略。Palantir Foundry 的对象实例是典型：它既能被数据源更新，也能被用户 Action 编辑，同一对象（同一主键）同时收到两边数据时，平台需一套冲突解决策略决定最终值以谁为准。本书 Merge 也一样——Tool、记忆、实时、检索可能指向同一对象的不同值，Runtime 不能默认"后到覆盖先到"，要按来源优先级和业务规则明确裁决，否则上下文会出现自相矛盾的字段。<span class="src">来源：Foundry Ontology 文档，Action types</span>

裁决规则（与上游两级衔接：候选级见第 6 章 §11、对象级见第 7 章 §6，本节管运行时级）：

| 冲突类型 | 裁决 |
|---------|------|
| 来源优先级 | `tool_observed > realtime > memory > retrieval`（工具返回的是最新事实） |
| 同优先级 | 按 `observed_at` 新者胜 |
| 数值冲突 | 双值都进 trace，供第 10 章 Diff（§13） 展示与人工仲裁 |

---

# 9. Context Version

Context：

支持：

Version。

例如：

```
v1

↓

v2

↓

v3
```

方便：

Rollback。

Audit。

Replay。

Version 和 Snapshot 让上下文演化有了沙箱保护。Palantir Foundry 的 Scenario 机制就是对 Ontology 的一次"分支"——所有假设分析编辑只存在于隔离沙箱，不影响主 Ontology；只有结论被采纳时，"Apply scenario"才把所有暂存编辑作为单一事务原子提交。它一旦创建不可变，要改得新建或复制；单场景最多 30000 次编辑；合并还得在 Action 安全策略里配足权限。本书 Snapshot 和 Version 可借鉴这套"fork-验证-原子合并"模型——尤其"采纳时才作为单次事务提交"，能避免半截更新污染主线。<span class="src">来源：Foundry Ontology 文档，Ontology scenarios</span>

---

# 10. Context Diff

两个：

Context：

比较。

例如：

```
GPU

90%

↓

95%
```

Diff：

自动：

生成。

Agent：

无需：

全部：

重新读取。

Diff 的格式契约（对象 ID 对齐、字段级变更、Relation 增删、JSON Patch 超集）由第 10 章 §13 统一定义，本章的运行时增量展示直接引用，两处保持同一实现。

---

# 11. Context Share

多个 Agent：

共享：

Context。

例如：

```
Research Agent

↓

Business Agent

↓

Coding Agent
```

共享：

同一：

Experiment。

无需：

重复：

Retrieval。

---

# 12. Context Lock

多个 Agent：

修改：

同一：

Object。

Runtime：

负责：

Lock。

避免：

冲突。多 Agent 并发写的完整锁协议（TTL 锁、source_priority 裁决）见第 13 章 §10，本节不重复。

---

# 13. Context Event

所有变化：

产生：

Event。

例如：

```
ContextCreated

ContextExpanded

ContextUpdated

ContextMerged

ContextArchived
```

统一：

Event Bus。

---

# 14. Context Store

建议：

```
Hot Context

Redis

Warm Context

Paimon

Cold Context

Object Storage
```

支持：

分层。

---

# 14A. Session Budget & Compaction

第 7 章 Progressive Context 说 Context 随轮次扩展（Round1→Round2→Round3），第 7 章的压缩都是单轮内的。多轮累计之后，谁负责驱逐和压缩历史轮次？这是 Runtime 的职责，本节补齐——它也是 Progressive Context 能落地的必要条件。

Session 级 token 记账：

```
session_tokens = Σ(每轮 ContextPackage 实际用量)
窗口余量 = 模型窗口 − session_tokens − 本轮 token_budget − 预留输出
```

压缩触发与动作：

- 触发：`session_tokens > 窗口 × 70%`（阈值起点，可按场景校准）；
- 动作：对最旧轮次做 hierarchical summary——把该轮 Package 的 objects/events/documents 压缩为一条结构化摘要（复用第 7 章 §8/§9 的压缩算子），摘要替换原内容挂在新版本上；
- 与 Snapshot/Version 联动：压缩前先打快照（§6），保证"压缩前的完整上下文"可随时回放（§9 Rollback）；压缩作为一次 Update（§7）记入 Delta 与 Trace。

快照链自身的存储预算同样计入：快照用 delta 链存储（只存与父版本的 diff），长会话定期 compaction，避免每轮全量快照导致 O(n²) 存储。

---

# 15. Runtime API

统一：

```go
type ContextRuntime interface {

    Create()

    Load()

    Update()

    Merge()

    Snapshot()

    Archive()

}
```

所有：

Agent：

统一：

接口。

---

# 16. Runtime Trace

记录：

完整：

生命周期。

例如：

```
Create

↓

Expand

↓

Tool

↓

Merge

↓

Answer
```

方便：

Debug。

---

# 17. MVP

第一阶段：

✓ Session

✓ Update

✓ Snapshot

✓ Merge

✓ Trace

第二阶段：

✓ Version

✓ Share

✓ Replay

✓ Diff

第三阶段：

✓ Distributed Runtime

✓ Multi Agent

✓ Streaming Context

---

# 18. 与其他模块关系

各模块在流水线中的职责与边界见第1章 §4。本章定位：让 Context 成为持续演化的运行时状态（Runtime），而非一次性 Prompt。

---

# 一句话总结

Context Runtime 不是 Prompt 生命周期。

而是：

> **Agent 在整个推理过程中，对 Context 的持续管理与演化能力。**

Context 从"一次性输入"升级为"持续演化的运行时状态"。
