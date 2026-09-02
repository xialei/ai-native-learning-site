# 第10章 Context Observability & Evaluation 技术架构设计

> Context Engine 核心模块
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

## 4.1 Trace 字段与存储

主记录在上述字段基础上补齐多租户与可复现性字段：`tenant`（第 2 章 §2 要求）、`session_id`、`context_id`、`policy_version`、`retrieval_config_version`。每阶段（§5 Pipeline 的每个 stage）另有一条 stage 记录：命中对象列表、过滤原因、Token 消耗、耗时——第 1 章 §4 要求 Trace Engine 记录的"命中对象、Token 消耗、过滤原因"落在 stage 记录上，不进主记录。

Trace 存储与保留：

- 格式：JSON Lines，带 `schema_version`（第 13 章 §6 引用的"逐 stage 结构化记录"即此格式）；
- 索引字段：trace_id、tenant、session_id、context_id、时间范围；
- 保留策略：热数据（7 天，可 Replay/Explain 实时查询）→ 温数据（90 天，聚合指标）→ 冷数据（审计要求的归档期）；
- 第 9 章 Cache 的 Hit/Miss/Refresh/Expire 事件作为 stage 记录并入同一 Trace，Replay 时可还原"这条上下文是否来自缓存"。

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

原因标签统一引用第 6 章 §7 的因子名（Relevance / Freshness / Importance / Authority / Distance），不另造词：

```
GPU

Score：0.78

Reason：

Freshness（observed_at 2h 前）

Importance ★★★★

Authority：MLflow ★★★★★
```

同时：

展示：

未保留：

原因。Ranking 侧只报"低于阈值被截断"；Token 原因（预算裁剪）归第 7 章 Optimizer Explain（第 7 章 §14）：

```
README

↓

Low Relevance（低于 Top-N 分数线）

↓

未装载
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

Token 预算裁剪的原因也在这里展示：

```
README

↓

原始 1200 Token

↓

未装载（Reason：Token Too High，超出本轮 budget 剩余额度）
```

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

重放必须固定输入，否则结果必然与原结果不同，§13 的 Diff 也就失去意义。Replay 输入契约：

```
Replay(traceID, pinnedConfigVersion, snapshotRef)
```

- `snapshotRef`：第 8 章 §6 Snapshot 的引用——固定重放时的 Ontology/Context 历史状态（对应第 2 章 §9 的"历史可重放"要求）；
- `pinnedConfigVersion`：固定检索/扩展/排序配置版本与 policy 版本；
- 模型版本取自 Trace 主记录（§4）。

分工：Runtime 存每步快照（第 8 章 §6），本章负责重放执行；重放 = 对固定快照 + 固定配置重跑 BuildContext。

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

Diff 的实现契约（全书以本节为权威；第 8 章 §10 的运行时增量展示引用本节）：

- 对象按 `id` 对齐，不做模糊匹配；
- 变更粒度为字段级（属性新增/修改/删除），对象级只报 added/removed；
- Relation 按 (source, relation, target) 三元组报增删；
- 同一逻辑变更、不同序列顺序视为等价（diff 前先按 ID 排序，避免伪差异）；
- 输出格式为 JSON Patch 超集（额外支持 relation 增删与 metric 时序段），由 Snapshot 链增量推导，不重算。

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

# 14A. Evaluation

本章标题里的 Evaluation 落在本节：没有评测集，§9 RCA 的"Retrieval Recall Too Low"就没有基准可比，第 14 章 §5 的改进环也无法验证候选编辑是否有效。

评测集构造（三元组）：

```
(query, 期望对象集合, 约束)
```

- 期望对象集合：该 query 理想 Context 应包含的对象 ID（人工标注或从高质量会话沉淀）；
- 约束：token 上限、必须包含的关系/文档、权限场景。

指标：

| 指标 | 定义 | 对应模块 |
|------|------|---------|
| 对象级召回率 | 期望对象被装入 Package 的比例 | 第 4/5/6 章 |
| 对象级精确率 | 装入对象中期望对象的占比（冗余的反向指标） | 第 6 章 |
| Coverage | 期望对象类型的覆盖度（类型配额口径见第 6 章 §10） | 第 6 章 |
| Token 效率 | 达到同等召回所需 Token 数（越低越好） | 第 7 章 |
| 答案质量 | 下游任务指标（如 Agent 任务成功率） | 第 8 章 |

回归门禁：每次检索/扩展/排序/压缩配置变更，先在评测集上重跑（复用 §12 Replay 固定快照与配置），对象级召回率下降超过阈值即阻断发布。这一门禁同时是第 14 章 §5 改进环"held-out 验证"的执行点。

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

（以下为交付计划，非已完成清单。）

第一阶段：

计划 Trace（§4/§4.1）/ Explain（§6–10）/ Timeline / Replay / Search

第二阶段：

计划 Diff / Dashboard / Metrics / Cost

第三阶段：

计划 Root Cause Analysis（§19）

计划 Automatic Diagnosis

计划 Context Quality Score（= §14A Evaluation 指标集的加权综合，落地依赖评测集建设）

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

---

## 19. Root Cause Analysis（RCA）

Root Cause

① Retrieval Recall Too Low

② Missing Dataset Relation

③ Context Too Large

④ Token Compression Too Aggressive

⑤ Outdated Cache

⑥ Permission Filter Removed Critical Object

然后自动给出建议（根因 → 检测信号 → 建议动作 → 责任模块的完整映射表）：

| 根因 | 检测信号 | 建议动作 | 责任模块 |
|------|---------|---------|---------|
| ① Retrieval Recall Too Low | 评测集（§14A）对象召回低于基准；各 Retriever 返回数偏少 | 增加 Retriever 路由 / 调整 Query Rewrite | 第 4 章 |
| ② Missing Dataset Relation | Expansion 触及 Node Limit 但目标对象未达；白名单拦截率高 | 提高 Dataset 类关系权重 / 放宽 hop（第 5 章上界内） | 第 5 章 |
| ③ Context Too Large | Prompt Explain 显示 Token 超预算、截断率高 | 收紧 Top-N / 调整第 7 章 Token Allocation（§11）预算配比 | 第 6/7 章 |
| ④ Token Compression Too Aggressive | 文档摘要过短、下游答案质量下降 | 放宽 Summary 触发阈值（第 7 章 §8） | 第 7 章 |
| ⑤ Outdated Cache | stale-hit 率升高（§4.1 stage 记录可查） | 调整 TTL / 依赖追踪失效 | 第 9 章 |
| ⑥ Permission Filter Removed Critical Object | 过滤 stage 记录中被过滤对象在期望集合内 | 修 Policy 规则（权限误配） | Policy Engine |

"自动给出建议"的判定规则：根因由规则匹配检测信号得出（阈值起点如"召回 < 期望集合的 70%"），建议动作查上表；连续两次同类根因才自动建议，首次只报告。

但光知道根因可能藏在哪还不够。

同一类失败表面相同。

因果机制可能完全不同。

两次运行都表现为产物缺失或超时。

但一个是检索没召回。

一个是压缩时误删。

改的是完全不同的组件。

要让归因真正落地。

失败记录不能只存一条终态结论。

而要存三层信息（层 / 内容 / 例子）：

| 层 | 内容 | 例子 |
|----|------|------|
| 终态结论 | 评测器（verifier，即第 14 章 §5 的验证环节，本书统一称"评测器"）给出的失败判定 | 任务未完成：缺 GPU 利用率数据 |
| 行为因果状态 | agent 在失败前实际做了什么、关键决策点在哪 | 检索了 3 次均未命中 → 改用了旧缓存 |
| 抽象机制 | 这条轨迹暴露的共性问题（而非本任务特有） | 缓存失效依赖追踪缺失 |

只有三层齐备。

下次弱点挖掘才能找到真正的根因。

而不是反复修同一个表象。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

这三层结构也服务于一个更野心的能力。

让 Context Engine 把诊断结果安全地反哺成自身改进。

做法是给每一次配置改动配一份**编辑日志（Change Manifest）**，schema 固定为六字段：

| 字段 | 内容 |
|------|------|
| evidence_id | 失败证据的 Trace/失败记录 ID |
| root_cause | 推断的根因（§ RCA 的六根因之一） |
| change | 目标修复方案（改哪份配置、哪个策略） |
| expected_effect | 预期修复什么 |
| regression_risk | 可能引入什么回归风险 |
| verdict | 验证结果：held-out 通过（保留）/ 不通过（回滚并记录） |

下一轮验证时回头检查预测是否成立。

成立就保留改动。

不成立就回滚并记录。

这套可证伪的编辑日志让每一次改动变成一次可审计的小实验。

而不是凭直觉调参。

它和本章 Replay、Diff、§14A Evaluation 是一组搭档：Replay 重跑改动前后、Diff 看上下文变化、Evaluation 提供 held-out 门禁、Change Manifest 记录当初的理由和预测。这套闭环的迭代机制面（怎么收集失败轨迹、怎么批量验证候选）在第 14 章 §8 展开，本章只负责日志 schema 与校验。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §4.3</span>

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

## 19A. 错误二分与变更影响面

归因要准，第一步是把"业务出错"和"系统出错"分开。Palantir Foundry 的函数监控刻意区分两类错误：user-facing errors（函数主动抛出的用户可见错误，通常业务逻辑问题）和 non-user-facing errors（基础设施、系统级故障）。两类分别告警给不同团队——业务问题归业务负责人，平台问题归平台团队，主动抛 UserFacingError 的失败还会被单独统计。本书 RCA 也该有这道二分：检索逻辑判错、权限过滤误删是业务问题，存储超时、向量库宕机是系统问题。混在一起，排障找不到对的人，告警也失效。<span class="src">来源：Foundry Ontology 文档，Function monitoring / User-facing errors</span>

可观测还有一层易忽略的维度：不只看单次 Context 生成，还要看 Ontology 本身变更的影响面。Palantir Foundry 的 Viewing usage 在改动 Ontology 前先展示近 30 天读写统计（读按加载请求计、写按 Action/编辑计），帮你评估破坏性变更会波及多少下游。本书 Trace 当前侧重"对象为何进入 Prompt"，可再补一刀："某次 Ontology 变更，影响了多少份历史 Context 的可重放性"——这层信息挂在 §13 Diff 的 Ontology 变更视图下。有了这层，Schema 演进才敢放开手改，因为影响面可见。<span class="src">来源：Foundry Ontology 文档，Viewing usage</span>
