# 第13章 Multi-Agent Context 技术架构设计

> AI Knowledge Runtime（AKR）核心模块
>
> Version：v1.0
>
> Status：Draft

本章聚焦多个 Agent 如何共享、引用和演化 Context。Context Package 的字段契约见第2章；本章不重新定义基础对象。

---

# 1. 模块定位

Multi-Agent Context 是 Context Engine 在多 Agent 协作场景下的上下文共享机制。

职责：

> **多个 Agent 基于统一的 Context Package 协同工作，而不是通过 Prompt 或 Message 传递信息。**

Context 是共享资源。

Agent 是 Context 的消费者（Consumer）和生产者（Producer）。

---

# 2. 为什么需要 Multi-Agent Context

传统 Multi-Agent：

```
Agent A

↓

Message

↓

Agent B

↓

Message

↓

Agent C
```

问题：

- Prompt 越来越长
- 信息不断重复
- Token 成本持续增加
- Context 不一致
- 无法追踪来源

Context Engine：

采用：

```
                Context Runtime

                      │

     ┌─────────┬─────────┬─────────┐

 Research     Business      Coding

    Agent        Agent        Agent

     │             │             │

     └─────────────┴─────────────┘

          Shared Context Package
```

所有 Agent：

共享：

统一 Context。

---

# 3. Context Package

所有 Agent：

统一输入：

```
ContextPackage

├── Objects

├── Relations

├── Events

├── Metrics

├── Actions

├── Memory

├── Metadata

└── Trace
```

Agent：

不关心：

数据来源。

只消费：

Context。

---

# 4. Agent 职责

建议统一抽象。

每个 Agent：

负责：

```
读取 Context

↓

推理

↓

执行 Tool

↓

更新 Context

↓

提交 Runtime
```

而不是：

直接调用：

其他 Agent。

---

# 5. Agent Collaboration

例如：

Research Agent：

```
Experiment

↓

训练模型
```

生成：

```
Checkpoint

Evaluation
```

Business Agent：

自动读取：

最新：

Checkpoint。

无需：

重新 Retrieval。

---

# 6. Sub-agent 生命周期

前面 §2、§4、§5 回答了 agent 之间怎么共享与协作 Context。

但还有一个更底层的问题没回答。

主 agent 启动一个子 agent 之后。

这个子 agent 的生命周期怎么管。

怎么启动。

怎么等它。

怎么查进度。

出了问题怎么取消。

跑完怎么把结果收回来。

harness 工程把这一层叫子代理与后台任务。

给出一组标准生命周期原语：

```
spawn    启动一个子 agent 任务

resume   从中断点恢复已暂停的子 agent

wait     阻塞等待子 agent 完成

list     列出当前所有子 agent 及其状态

close    正常结束并回收一个子 agent

interrupt 强制中止失控或超时的子 agent
```

这组原语补上了从共享 Context 到可调度执行之间缺的一环。

前面 Ownership、Version、Lock 解决的是多个 agent 读写同一份 Context 时不打架。

这组原语解决的是主 agent 怎么把活派出去又怎么把结果收回来。

它和第8章 Context Event 是配合关系。

spawn、close 对应子 agent 生命周期事件。

wait、list 让主 agent 能对自己的执行历史做推理。

而不是 fire-and-forget 之后什么都看不见。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §1 Pattern 3</span>

这里有一条容易踩漏的纪律。

并行必须是显式且可检查的。

如果子 agent 的输出只存在于临时会话上下文里。

它很快就会过时。

而且一旦主 agent 中断就再也看不见。

主 agent 无法对自己的执行历史做推理。

也无法在中断后恢复。

所以子 agent 的中间状态必须结构化落盘。

日志。

状态记录。

产出物。

而不是只活在 chat context 里。

这和第8章 Context 状态落盘而非只存快照。

第10章 Trace 每条存一个文件。

是同一条原则在不同层的体现。

能落盘的不要留在内存里。

能结构化的不要留在自由文本里。<span class="src">来源：Lilian Weng, Harness Engineering for Self-Improvement, 2026, §1 Pattern 3</span>

---

# 7. Context Update

Agent：

完成任务后：

提交：

```
Context Delta
```

例如：

```
新增：

Checkpoint

新增：

Evaluation

更新：

Metric
```

Runtime：

自动：

Merge。

> 这是第8章 §7 Context Update（Context Delta）在多 Agent 场景下的扩展：第8章定义单 Agent / Session 的增量更新，本章定义多个 Producer 同时提交 Delta 时的合并。

这套"共享而非传递"的思路往外推一步就是跨组织协作。Palantir Foundry 的 Shared Ontology 机制解决的就是这个场景：让多个组织在同一套共享工作流下协作，本体放在专门的 shared space 里，自动继承组织标记（organization markings）和角色授权（role grants）——典型用途是和客户、合作方在同一套本体上联合建模、联合数据交换。本书"Context 才是共享资产，Agent 只是执行者"和后续 Context Federation，可借鉴这种"独立共享空间+标记与授权继承"的模式：跨组织共享的不是某方私库，而是一块带好权限标记的共享领地，各方按既有授权读写。<span class="src">来源：Foundry Ontology 文档，Shared ontologies</span>

---

# 8. Context Ownership

Context：

不是 Agent 私有。

而是：

Runtime。

例如：

```
Runtime

↓

Context

↓

Agent A

Agent B

Agent C
```

所有修改：

统一：

提交。

---

# 9. Context Version

每次：

Context：

变化。

生成：

Version。

例如：

```
v1

↓

Research Agent

↓

v2

↓

Business Agent

↓

v3
```

支持：

Rollback。

Replay。

---

# 10. Context Lock

多个 Agent：

同时修改：

同一对象。

Runtime：

负责：

```
Object Lock

Version Check

Merge Conflict
```

保证：

一致性。

---

# 11. Context Subscription

Agent：

可以订阅：

Context。

例如：

```
Research Agent

↓

订阅：

Experiment

Business Agent

↓

订阅：

Forecast

Operation Agent

↓

订阅：

Alarm
```

对象变化：

自动通知。

---

# 12. Context Event Bus

所有：

Context：

变化。

进入：

```
Context Event Bus

↓

Create

Update

Delete

Merge

Snapshot
```

支持：

异步协作。

---

# 13. Context Permission

所有 Agent：

共享：

Context。

但：

权限：

不同。

例如：

```
Research Agent

可以：

Checkpoint

Business Agent

不能：

Checkpoint

Operation Agent

只能：

Deployment
```

Runtime：

统一：

ACL。

---

# 14. Context API

ContextRuntime 的基础接口以第8章 §15 为准（Create / Load / Update / Merge / Snapshot / Archive）。多 Agent 场景在此之上扩展两类方法：

```go
type ContextRuntime interface {

    // 基础生命周期，见第8章 §15
    Create()
    Load()
    Update()
    Merge()
    Snapshot()
    Archive()

    // 多 Agent 扩展
    Subscribe()   // 订阅 Context 变化
    Publish()     // 发布 Context 变化

}
```

所有 Agent：

统一协议。

---

# 15. Context 生命周期

```
Create

↓

Agent Read

↓

Agent Update

↓

Merge

↓

Snapshot

↓

Archive
```

整个生命周期：

统一管理。

---

# 16. 多 Agent 示例

例如：

用户：

```
为什么今天预测误差变大？
```

Research Agent：

负责：

```
模型

训练

Checkpoint
```

Business Agent：

负责：

```
天气

风场

设备
```

Operation Agent：

负责：

```
GPU

Deployment

Runtime
```

三个 Agent：

共享：

同一：

Context。

共同生成：

最终答案。

---

# 17. MVP

第一阶段：

✓ Shared Context

✓ Context Version

✓ Context Merge

✓ Context Lock

第二阶段：

✓ Context Event

✓ Context Subscription

✓ Context Permission

第三阶段：

✓ Distributed Runtime

✓ Cross-Agent Context

✓ Context Federation

---

# 18. 与其他模块关系

通用流水线各模块的职责见第1章 §4。本章定位：在 Context Runtime（第8章）之上定义多个 Agent 如何共享、引用和演化同一份 Context，而非重新定义基础对象或单 Agent 生命周期。

---

# 一句话总结

Multi-Agent 的核心不是 Message Passing。

而是：

> **多个 Agent 基于统一 Context Package 协同推理、协同执行、协同更新。**

Context 才是共享资产。

Agent 只是不同角色的执行者。

## Context Protocol（上下文协议）

就像：

HTTP —— 页面通信
SQL —— 数据查询
Kubernetes API —— 容器编排

ContextRequest

↓

ContextPackage

↓

ContextDelta

↓

ContextSnapshot

↓

ContextReference

↓

ContextEvent

↓

ContextResponse

协议消息必须携带 `schema_version`、`context_id`、`tenant`、`provenance` 和权限声明；发生版本冲突时优先返回可合并的 ContextDelta，而不是静默覆盖。
