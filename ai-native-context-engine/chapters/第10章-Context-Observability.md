# 第10章 Context Observability & Evaluation 技术架构设计

> AI Knowledge Runtime（AKR）核心模块
>
> Version：v1.0
>
> Status：Draft

---

# 1. 模块定位

Context Observability 是整个 Context Engine 的可观测与评测层。

职责：

> **完整记录 Context 从 Query 到 Prompt 的整个生成过程，并提供调试、解释、回放、评估能力。**

它不仅帮助研发排查问题，也帮助业务人员理解：

> Agent 为什么得到这个答案？

---

# 2. 为什么需要 Context Debugger

企业部署 Agent 后：

最常见的问题：

```
为什么没有找到这个实验？

为什么没有引用最新日志？

为什么使用了旧版本 SOP？

为什么没有看到 GPU 信息？

为什么引用了错误文档？
```

如果没有 Debugger：

只能：

猜。

因此：

必须：

Explain。

---

# 3. 整体架构

```
User Query

↓

Hybrid Retrieval

↓

Graph Expansion

↓

Context Ranking

↓

Context Optimizer

↓

Prompt Builder

↓

LLM

↓

Answer
```

Context Observability：

监听：

整个 Pipeline。

记录：

全部状态。

---

# 4. Context Trace

每一次：

Context：

生成：

形成：

一个：

Trace。

例如：

```
Trace

ID

Start Time

End Time

Latency

Model

Token

Context Version
```

统一：

记录。

---

# 5. Trace Pipeline

完整记录：

```
Query

↓

Rewrite

↓

Retrieval

↓

Expansion

↓

Ranking

↓

Optimizer

↓

Prompt

↓

LLM

↓

Response
```

每一步：

都有：

Trace。

Trace 记到极致，行为本身可被建模成对象，而不只是日志行。Palantir Foundry 的 Action Log 把每次 action 提交都建模成 object type，统一用 `[LOG]` 前缀标注，和对应 action type 一一对应——这样行为记录能用 Ontology 的感知工具查询、展示、喂给下游决策工作流，而不是沉在没人翻的日志文件里。本书 Context Trace 也可往这方向走：不只记录"对象为何进入 Prompt"的日志，而把这条决策本身建模成可查询对象，让"为什么"也能被检索和复盘。（若要某对象被编辑的全部历史，该用对象级 edit history，不是 action log，职责不同。）<span class="src">来源：Foundry Ontology 文档，Action log</span>

---

# 6. Retrieval Explain

展示：

每个 Retriever：

返回：

什么。

例如：

```
Keyword

↓

5 Objects

Vector

↓

8 Objects

SQL

↓

2 Objects

Graph

↓

12 Objects
```

全部：

可见。

---

# 7. Expansion Explain

展示：

为什么：

扩展。

例如：

```
Experiment

↓

Dataset

↓

Checkpoint

↓

GPU
```

解释：

```
Relation：

trained_on

uses

running_on
```

支持：

逐跳查看。

---

# 8. Ranking Explain

展示：

每个对象：

为什么：

保留。

例如：

```
GPU

Score：92

Reason：

Current

Importance

Authority
```

同时：

展示：

未保留：

原因。

例如：

```
README

↓

Token Too High

↓

Low Relevance
```

---

# 9. Optimizer Explain

展示：

Context：

如何：

压缩。

例如：

```
SOP

↓

20 Pages

↓

Summary

↓

180 Token
```

展示：

节省：

Token。

---

# 10. Prompt Explain

最终：

Prompt：

组成：

例如：

```
Objects

Relations

Metrics

Events

Documents

Actions
```

分别：

占：

多少：

Token。

---

# 11. Timeline

展示：

时间线。

例如：

```
10:01

Retrieval

↓

10:01.2

Expansion

↓

10:01.3

Ranking

↓

10:01.5

Prompt

↓

10:02

LLM
```

查看：

耗时。

---

# 12. Replay

支持：

Replay。

例如：

昨天：

Context。

重新：

运行。

方便：

Debug。

---

# 13. Diff

支持：

两个：

Context：

比较。

例如：

```
Yesterday

↓

Today
```

展示：

新增：

Object。

删除：

Object。

变化：

Relation。

---

# 14. Metrics

建议：

统一：

指标。

例如：

```
Retrieval Latency

Ranking Latency

Expansion Latency

Prompt Size

Context Size

Token Saved

Cache Hit

LLM Cost
```

统一：

Dashboard。

---

# 15. Search

支持：

搜索：

历史：

Trace。

例如：

```
Experiment

Loss

GPU

User

Project
```

快速：

定位。

---

# 16. API

统一：

```go
type TraceService interface {

    StartTrace()

    Record()

    Finish()

    Replay()

    Compare()

}
```

统一：

管理。

---

# 17. MVP

第一阶段：

✓ Trace

✓ Explain

✓ Timeline

✓ Replay

✓ Search

第二阶段：

✓ Diff

✓ Dashboard

✓ Metrics

✓ Cost

第三阶段：

✓ Root Cause Analysis

✓ Automatic Diagnosis

✓ Context Quality Score

---

# 18. 与其他模块关系

Hybrid Retrieval：

输出：

Trace。

Graph Expansion：

输出：

Trace。

Ranking：

输出：

Trace。

Optimizer：

输出：

Trace。

Runtime：

输出：

Trace。

最终：

统一：

Context Observability。

---

# 一句话总结

Context Observability 的目标不是记录日志。

而是：

> **让每一个进入 Prompt 的 Context 都可以被解释、回放、比较和诊断。**

真正做到：

Explainable Context。

# 创新：Root Cause Analysis（RCA）

Root Cause

① Retrieval Recall Too Low

② Missing Dataset Relation

③ Context Too Large

④ Token Compression Too Aggressive

⑤ Outdated Cache

⑥ Permission Filter Removed Critical Object

然后自动给出建议：

增加：

Graph Hop

建议：

提高：

Dataset Weight

建议：

重新：

Summary

但光知道根因可能藏在哪还不够。

同一类失败表面相同。

因果机制可能完全不同。

两次运行都表现为产物缺失或超时。

但一个是检索没召回。

一个是压缩时误删。

改的是完全不同的组件。

要让归因真正落地。

失败记录不能只存一条终态结论。

而要存三层信息。

终态结论。

verifier 给出的失败判定。

行为因果状态。

agent 在失败前实际做了什么。

关键决策点在哪。

抽象机制。

这条轨迹暴露出的是哪类共性问题。

而非这个具体任务。

只有三层齐备。

下次弱点挖掘才能找到真正的根因。

而不是反复修同一个表象。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

这三层结构也服务于一个更野心的能力。

让 Context Engine 把诊断结果安全地反哺成自身改进。

做法是给每一次配置改动配一份证据驱动编辑日志。

manifesto。

写明失败证据的名字。

推断的根因。

目标修复方案。

预期影响。

预期修复什么。

可能引入什么回归风险。

下一轮验证时回头检查预测是否成立。

成立就保留改动。

不成立就回滚并记录。

这套可证伪的编辑日志让每一次改动变成一次可审计的小实验。

而不是凭直觉调参。

它和本章 Replay、Diff 是天然搭档。

Replay 重跑改动前后。

Diff 看上下文变化。

manifesto 记录当初的理由和预测。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

这个诊断后安全地改的闭环还有一个上游前提。

答案本身要可追溯。

如果 Context 里的每个论断。

引用的数值。

依据的方法。

得出的结论。

都能回溯到具体证据来源。

那么 RCA 才不是在猜。

而是在审计一条证据链。

这正是 ScientistOne 强调的可验证性。

每个论断都要能追溯到证据。

并通过 Chain-of-Evidence 审计。

本书 provenance 字段已经为此留了位置。

让为什么也能被检索和复盘。

是 Observability 从解释单次生成走向支撑持续改进的关键一步。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.2 引 ScientistOne</span>

归因要准，第一步是把"业务出错"和"系统出错"分开。Palantir Foundry 的函数监控刻意区分两类错误：user-facing errors（函数主动抛出的用户可见错误，通常业务逻辑问题）和 non-user-facing errors（基础设施、系统级故障）。两类分别告警给不同团队——业务问题归业务负责人，平台问题归平台团队，主动抛 UserFacingError 的失败还会被单独统计。本书 RCA 也该有这道二分：检索逻辑判错、权限过滤误删是业务问题，存储超时、向量库宕机是系统问题。混在一起，排障找不到对的人，告警也失效。<span class="src">来源：Foundry Ontology 文档，Function monitoring / User-facing errors</span>

可观测还有一层易忽略的维度：不只看单次 Context 生成，还要看 Ontology 本身变更的影响面。Palantir Foundry 的 Viewing usage 在改动 Ontology 前先展示近 30 天读写统计（读按加载请求计、写按 Action/编辑计），帮你评估破坏性变更会波及多少下游。本书 Trace 当前侧重"对象为何进入 Prompt"，可再补一刀："某次 Ontology 变更，影响了多少份历史 Context 的可重放性"。有了这层，Schema 演进才敢放开手改，因为影响面可见。<span class="src">来源：Foundry Ontology 文档，Viewing usage</span>
