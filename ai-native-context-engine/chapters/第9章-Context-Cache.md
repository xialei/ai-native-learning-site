# 第9章 Context Cache 技术架构设计

> Context Engine 核心模块
>
> Version：v1.0
>
> Status：Draft

本章只讨论派生 Context 的复用、失效和一致性。Retrieval Cache、Embedding Cache、Prompt Cache 和模型 KV Cache 不等同于 Context Package Cache。

---

# 1. 模块定位

Context Cache 是 Context Runtime 的加速层。

职责：

> **缓存可复用的 Context，而不是缓存数据库查询结果。**

目标：

降低 Retrieval 成本。

降低 LLM Token 消耗。

降低响应延迟。

提升 Agent 连续推理效率。

---

# 2. 为什么需要 Context Cache

传统 RAG：

每次：

```
Question

↓

Retrieval

↓

Ranking

↓

Prompt
```

全部重新计算。

但是：

Agent：

通常：

```
为什么训练慢？

↓

GPU

↓

为什么 GPU 利用率低？

↓

为什么数据加载慢？
```

三次：

Context：

几乎相同。

因此：

完全可以：

复用。

---

# 3. 整体架构

Cache 查找发生在流水线最前端（而不是 Optimizer 之后）——命中则跳过整条构建链，未命中才走完整流水线并回填：

```
Query
  │
  ├─ Cache Hit ──────────────► Prompt Builder ──► LLM
  │
  └─ Cache Miss
       ↓
     Hybrid Retrieval
       ↓
     Graph Expansion      ◄─ 构件缓存（§7.2）
       ↓
     Ranking
       ↓
     Context Optimizer    ◄─ 构件缓存（§7.3–7.5）
       ↓
     回填 Cache（Package 级，§7.1）
       ↓
     Prompt Builder ──► LLM
```

各级缓存的挂载位置不同：Package 级缓存在入口（整条链复用）；Graph Expansion、Summary、Embedding、Prompt Fragment 等构件级缓存挂在流水线中段对应阶段（§7）。命中时 policy 版本必须复验（§4），不一致按 Miss 处理。

---

# 4. Cache 对象

缓存单位：

不是：

Document。

不是：

SQL。

而是：

Context Package。

字段严格采用第 2 章 §8 的契约，一个都不能少——尤其是 `policy`：缓存一个不带 policy 字段的 Package，命中时等于绕过权限检查。

例如：

```
ContextPackage

├── Objects

├── Relations

├── Events

├── Metrics

├── Actions

├── Documents

├── Policy        # 必须随包缓存，命中时复验版本

├── Provenance

├── Trace

├── TokenBudget

└── SchemaVersion
```

统一：

缓存。

说明：以 Context Package 为主缓存单位；此外第 7 节还会缓存 Graph Expansion 结果、Document Summary、Embedding、Prompt Fragment 等构件级产物，它们是 Package 内对象的中间产物，不改变"Package 是权威缓存单位"这一定位。

---

# 5. Cache Key

建议：

不要：

Question。

而是：

```
Tenant

Project

Goal

Intent

Seed Object

Permission

Model

SchemaVersion      # 第 2 章 §9：schema 变更后旧缓存不可复用

PolicyVersion      # policy 更新（§10 失效触发）依赖此字段定位

TemplateVersion    # Prompt 模板更新（§10 失效触发）依赖此字段定位

Budget             # token_budget 不同，产出不同 Package
```

版本类字段的必要性：§10 把"Policy 更新、Prompt 模板更新"列为失效触发——key 里没有对应版本字段，失效时根本无法定位要删哪些条目。带上版本号后，"失效"可以转化为"换 key"（旧条目等 TTL 自然过期），不需要全量扫描。

canonicalization 规则：字段按固定顺序拼接（上表顺序）、分隔符 `:`、值内部先 trim、种子对象 ID 集合先排序再拼接，最后整体 SHA-256。同一种子集合不同顺序必须得到同一个 key。

例如：

```
sha256(tenant-a : proj-01 : gpu-排障 : expand : exp-001,exp-002 : role-admin : glm-5.2 : schema-1.0 : policy-v3 : tpl-v2 : 24000)
```

Permission 建议入 key 的是权限组/角色（如 role-admin）而不是原始用户 ID——按用户粒度展开，命中率会趋近于零。

生成：

Context Key。

---

# 6. Cache 层级

建议采用三级缓存。

```
L1

Memory

L2

Redis

L3

Paimon/Object Storage
```

说明：

L1：

最快。

L2：

共享。

L3：

长期保存。

L1 这层有个被低估的好处：单次执行内共享快照，同时提升一致性和性能。Palantir Foundry 的 function-backed action 一次运行里所有读请求自动复用同一 Ontology 快照，保证这次执行内多次查询数据一致（不会中途数据变了导致前后矛盾），同时复用快照读性能也提升。本书 L1 可借鉴"执行粒度共享快照"：一次 Agent 推理内部多次检索共用一份快照，既省重复计算，又避免"前一步查到的对象后一步被改了"这种隐蔽 bug。<span class="src">来源：Foundry Ontology 文档，Manage published functions</span>

---

# 7. Cache 内容

支持缓存：

## 7.1 Context Package

完整 Context。

直接复用。

---

## 7.2 Graph Expansion

Expansion：

结果。

无需：

再次：

遍历。

图扩展结果甚至可持久化到对象身上，下次直接按引用加载。Palantir Foundry 的 Graph Template 支持任何一次图探索存成模板，还能用"覆盖图谱 RID"选项从对象属性里读出已保存的图谱 RID 加载已有图谱，而非每次重新生成——适合给某业务对象持久化专属分析图谱。本书 Graph Expansion 缓存可借鉴"结果落盘+按引用加载"：频繁访问的种子对象把扩展结果带 RID 存进 L3，命中时直接取回整张子图。<span class="src">来源：Foundry Ontology 文档，Vertex / Graph template</span>

---

## 7.3 Document Summary

Document：

摘要。

避免：

重复：

Summary。

---

## 7.4 Embedding

Embedding：

缓存。

避免：

重复计算。

---

## 7.5 Prompt Fragment

例如：

固定：

SOP。

固定：

Policy。

固定：

System Prompt。

直接：

缓存。

---

# 8. Cache 生命周期

```
Create

↓

Warm

↓

Hit

↓

Refresh

↓

Expire

↓

Archive
```

支持：

自动更新。

---

# 9. Cache 更新策略

支持：

三种模式。

## Lazy Update

读取：

更新。

适合：

静态知识。

---

## Active Update

数据：

变化。

主动：

刷新。

例如：

MLflow

Git

Experiment。

---

## Event Update

监听：

Fluss

Kafka

CDC

自动：

更新：

Context。

---

# 10. Cache 失效

以下情况：

必须：

失效。

- 数据更新
- 权限变化
- Policy 更新
- Ontology 更新
- Prompt 模板更新

避免：

脏 Context。

---

# 11. Cache 共享

多个 Agent：

共享：

同一：

Context。

例如：

Research Agent

Coding Agent

Business Agent

无需：

重复：

Retrieval。

共享边界（§5 Cache Key 含权限组，不同权限必然不同 key）：构件级缓存（Embedding/Summary/Graph 结果）跨 Agent 共享；Package 级缓存按权限域隔离。跨 Agent 写入权限的硬约束见第 13 章 §13。

---

# 12. Cache API

统一接口：

```go
type ContextCache interface {

    Get()

    Put()

    Refresh()

    Delete()

    Exists()

}
```

支持：

插件化。

---

# 13. Cache Trace

记录：

```
Hit

Miss

Refresh

Expire
```

方便：

性能分析。

---

# 14. Cache 指标

建议监控：

- Hit Rate
- Miss Rate
- Refresh Count
- Average TTL
- Average Context Size
- Average Retrieval Latency Saved
- Token Saved

重点关注：

> 节省了多少 Token。

而不是：

缓存数量。

---

# 15. MVP

（以下为交付计划，非已完成清单。）

第一阶段：

计划 Package / Embedding / Summary 三类缓存 + L1/L2 分层

计划 **失效机制**（§10 依赖追踪 + TTL）——失效不在第一阶段的缓存 MVP 是危险交付

第二阶段：

计划 Graph Cache / Prompt Fragment Cache

计划 Event Refresh（§10 失效触发的自动化）

第三阶段：

计划 Predictive Cache（预取依据：Intent Planner 的下一步意图信号 + 历史会话序列，提前预热种子对象的扩展结果）

计划 Distributed Cache / Context Sharing（共享边界见 §11 的分层共享策略）

---

# 16. 与其他模块关系

各模块在流水线中的职责与边界见第1章 §4。本章定位：Context Runtime 的加速层，缓存可复用的 Context Package 而非查询结果。

---

# 一句话总结

Context Cache 缓存的不是数据。

而是：

> **Agent 已经理解过的企业上下文。**

真正缓存的是：

Context Package。

而不是：

Document 或 SQL。
