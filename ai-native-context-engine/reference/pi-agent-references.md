# 引用映射：Pi Agent Harness → 本书各章

> 来源项目：[`github.com/earendil-works/pi`](https://github.com/earendil-works/pi)（TypeScript Agent 运行时，开源）。
> 配套学习站：`/Users/lei.xia/workspace/github/pi/learning-site/`（静态 HTML，逐行讲解源码）。
> 源码根：`/Users/lei.xia/workspace/github/pi/packages/`。
>
> 本文档把 Pi 中对本书**各章节有直接帮助**的工程实践，逐条映射为"可引用描述"。每条标注：①对应本书哪章、②Pi 出处（源码文件 / 学习站章节）、③建议怎么引用、④引用价值。
>
> 红线：以下所有机制、数据结构、阈值均直接来自 Pi 源码原文（已逐行核对），未做外推或编造。Pi 版本：`v0.84.2-6-g086c32e74`（learning-site/05-context.html 页脚）。引用时请保留版本与时点说明。

## 与已有引用的关系

本书已有两类外部参照：

- **Agent Harness Engineering 综述（`reference/citations.md`）**：提供**学术理论背书**——"harness 决定可靠性天花板"的同行评议级证据 + 量化数字。
- **Palantir Foundry Ontology（第1/7/9 章已嵌入）**：提供**本体/数据治理**视角的工业参照。

Pi 的角色与两者都不同，是**第三个、也是本书唯一一个"可读源码的工程参考实现"**：

| 参照 | 性质 | 对本书的价值 |
|---|---|---|
| Harness 综述 | 学术 + 量化 | 证明"为什么 harness 重要"（动机） |
| Palantir Foundry | 工业产品（闭源） | 证明"Ontology 治理怎么做"（数据层） |
| **Pi Agent Harness** | **开源运行时（可读源码）** | **证明"运行时/压缩/会话/循环"具体怎么落地（执行层）** |

Pi 恰好补在综述与 Foundry 都没覆盖的位置：**Context Runtime 的执行细节**（第 8 章主体、第 7 章压缩算法、第 13 章会话与多 Agent、第 14 章演进路线）。本书这些章节目前是"设计书"气质，Pi 可让它们带上"真实落地实现"的证据——正好补 `reference/case.md` 诊断的"缺实践气质"问题，且不违反"不编造"红线（源码可核验）。

---

## 0. 一句话判断

Pi 是本书**运行时章节最贴切的开源工程参照**。它的核心设计——"会话即状态（append-only entry 树）、上下文每轮重算（派生视图而非存储）、压缩即检查点（摘要+保留尾）、状态三分（内容/操作账本/派生状态）"——与本书第 8 章 Context Runtime 的抽象几乎逐条对应，并提供了**带源码行号的具体实现**。可在第 7、8、9、13、14 章作为"真实落地实现"引用，把抽象设计落到可核验的代码。

---

## 1. 第 8 章 Context Runtime —— Pi 是"运行时抽象"的完整落地

这是 Pi 与本书**重合度最高**的一章。本书第 8 章定义了 Context 的生命周期、状态三分、Merge、Version、Snapshot、Event Bus、Runtime API；Pi 给出了这些抽象的 TypeScript 实现。

### 引用点 A：三段式纯函数上下文管线（transform → project → derive state）

- **Pi 出处**：`packages/agent/src/harness/session/context.ts`，`buildSessionContext()`；学习站 `05-context.html` §5.1–5.2。
- **机制**：上下文组装是单个纯函数，内部三步各司其职：
  ```typescript
  export function buildSessionContext(pathEntries, options): SessionContext {
    const state = deriveSessionContextState(pathEntries);          // 派生状态（读原始分支）
    const contextEntries = buildContextEntries(pathEntries, options); // ① transform: Entry[] → Entry[]
    const messages = contextEntries.flatMap((entry, index) =>
      sessionEntryToContextMessages(entry, index, contextEntries, options)); // ② project: Entry → AgentMessage[]
    return { ...state, messages };
  }
  ```
  - **transform** 决定哪些 entry 留下（token 控制在此介入，第 6 章压缩的默认 transform 在这步执行）。
  - **project** 决定每个 entry 如何变成 0..N 条消息（1→N 发生在压缩 entry 上）。
  - **state 派生** 读的是**转换前**的原始分支，不受压缩裁剪影响——"消息被压成摘要了，但'当前用什么模型'仍来自完整历史"。
- **对应本书**：第 8 章 §3 Runtime 架构、§4 Context 生命周期（`Expand → Optimize → Consume`）、§15 Runtime API。Pi 的三段管线是"Expand→Optimize→Consume"两个纯函数 + 一个只读状态派生的具体实现。
- **建议引用方式**：在第 8 章 §4 讲完生命周期阶段后，给一段"参考实现"：
  > 开源运行时 Pi 把上下文组装实现为一个纯函数管线：transform（决定留哪些 entry，压缩在此介入）→ project（每个 entry 投影成 0..N 条消息）→ state 派生（从原始分支只读地推出当前模型/工具配置）。三者职责分离，且状态派生读的是压缩前的完整分支——即"信息被摘要了，但运行时配置仍可被重放重建"。
- **引用价值**：把"生命周期阶段"从抽象流程图落到可核验的 5 行函数签名，读者能直接看到 Expand/Optimize/Consume 在代码里长什么样。

### 引用点 B：上下文是"派生视图"，每轮重算而非存储

- **Pi 出处**：`context.ts` `buildSessionContext`；学习站 `05-context.html` §5.6（`transform_context` 钩子调用 `buildSessionContext`，替换朴素的 `context.messages`）；`agent-loop.ts` `runLoop()` 每轮 `prepareNextTurn` 快照点。
- **机制**：管线在**每次调用 LLM 前**重跑一次，输出 `AgentMessage[]` 再经 `convertToLlm` 变成 `Message[]`。上下文不是存储的 artifact，而是会话树的**派生视图**。
- **对应本书**：第 8 章 §2"为什么需要 Runtime"（Context"一直变化"，必须 Runtime 管理）；§7 Context Update（"不是重新 Retrieval，而是 Incremental Update"）。
- **引用价值**：本书论证"Context 一直变化所以需要 Runtime"，Pi 的 per-turn rebuild 是这个论断的具体机制保证——模型永远不会看到陈旧上下文。

### 引用点 C：状态三分——内容流 / 操作账本 / 派生状态

- **Pi 出处**：`packages/agent/src/harness/session/types.ts`。
  - **内容流**：`Entry` 联合类型（`message` / `compaction` / `branch_summary` / `model_change` / `thinking_level_change` / `active_tools_change` / `custom`）——会话树上的内容。
  - **操作账本**：`LaneRecord` 联合类型（`operation_started` / `operation_finished` / `step_attempt` / `tool_started` / `queue_enqueued` / `write_deferred` / `usage`）——操作元数据，与内容分离。
  - **派生状态**：`deriveSessionContextState()` 从内容流只读推出 `thinkingLevel / model / activeToolNames`。
- **对应本书**：第 8 章 §6 Snapshot、§13 Event Bus（`ContextCreated/ContextUpdated/...`）、§16 Runtime Trace。综述论文的"状态三分（无状态/有状态/受治理）"在此处有工程对应（见 `citations.md` 引用点 P/Q/R）。
- **建议引用方式**：第 8 章 §13 Event Bus 处，指出 Pi 把"内容变更"（Entry）与"操作事件"（LaneRecord）拆成两条流——前者是 Agent 看到的对话，后者是 Runtime 的操作账本（谁启动、谁完成、用了多少 token、为何压缩）。这正是 Event Bus 的最小可运行形态。
- **引用价值**：把 Event Bus 从"建议有这些事件类型"落到"两条流怎么物理分离、怎么独立查询"。

### 引用点 D：Config-as-Entry —— 运行时配置建模为会话树条目

- **Pi 出处**：`types.ts` `ModelChangeEntry / ThinkingLevelEntry / ActiveToolsEntry`；`context.ts` `deriveSessionContextState()`；学习站 §5.3–5.4。
- **机制**：模型/思考级别/活跃工具不存为单独的 session metadata，而是作为 `*_change` Entry 追加到分支上。后果：①投影成 0 条消息（纯状态元数据）；②重放分支即得当前配置（重启可恢复）；③last-write-wins 语义（扫描旧→新，每次覆盖）。
- **对应本书**：第 2 章 §5 Event 模型（Event 描述对象状态变更）；第 8 章 §9 Version / §17 Replay（"重启后重放分支即得当前配置"）。
- **引用价值**：本书第 2 章定义了 Event，第 8 章要求可重放；Pi 用"把配置也变成不可变 Event"这条单一设计同时满足两者——是一个优雅的设计取舍范例。

### 引用点 E：两个显式扩展点 —— transform（结构）vs projector（表现）

- **Pi 出处**：`context.ts` `ContextEntryTransform` / `CustomEntryContextMessageProjector` / `SessionContextBuildOptions`；学习站 §5.5。
  ```typescript
  export type ContextEntryTransform = (entries: readonly Entry[]) => readonly Entry[];
  export type CustomEntryContextMessageProjector =
    (entry: CustomEntry, index: number, entries: readonly Entry[]) => readonly AgentMessage[] | undefined;
  ```
- **机制**：`entryTransforms`（数组，默认压缩 transform 之后顺序应用）改**结构**（重排/删除/插入 entry）；`entryProjectors`（按 `customType` 索引的 map）改**表现**（custom entry 如何变成消息）。
- **对应本书**：第 8 章 §15 Runtime API（`Create/Load/Update/Merge/Snapshot/Archive`）；第 2 章 §9 Schema 演进（"属性可扩展、类型可新增"）。
- **引用价值**：本书列了 CRUD 式 API，但没给"插件怎么接"的缝；Pi 的"结构缝 vs 表现缝"是一个具体、最小的插件契约，可作 Runtime API 的参考实现注脚。

### 引用点 F：安全闸门——deferred stopReason 不投影

- **Pi 出处**：`context.ts` `sessionEntryToContextMessages()`：
  ```typescript
  if (entry.message.role === "assistant" && entry.message.stopReason === "deferred") return [];
  ```
- **机制**：一个 `stopReason === "deferred"`（被工具调用/续写打断）的 assistant 回复，在投影时被丢弃，直到后续 tool/续写完成——防止半句话污染模型上下文。
- **对应本书**：第 8 章 §6 Snapshot（"Before Tool → Snapshot → Tool → Snapshot"）；也是可观测性的"状态一致性"实践。
- **引用价值**：一个极小但真实的"上下文正确性"闸门，证明"什么时候不该让模型看到什么"和"该让它看到什么"同样重要。

### 引用点 G：操作恢复——`findOpenOperations` 的三态语义

- **Pi 出处**：`types.ts` `SessionStorage.findOpenOperations()` 注释：
  > "Returns unfinished operation starts newest first. Recovery uses `limit: 2`: zero results mean the lane is idle, one means it is suspended, and two mean at least two operations are open, which is corruption."
- **机制**：恢复时查未完成的 operation_started：0 条=空闲，1 条=挂起（恢复续跑），2 条=损坏（报错）。`step_attempt` 带 `compactionReason: "manual"|"threshold"|"overflow"` 以便恢复时重做同一份压缩。
- **对应本书**：第 8 章 §4 生命周期、§9 Version/Replay；第 10 章 Observability（故障恢复）。
- **引用价值**：本书要求 Runtime 可恢复；Pi 给出了"用操作账本的未完成记录做恢复"的具体算法和腐败检测阈值。

### 引用点 H：会话模型——append-only 分支树 + Lane

- **Pi 出处**：`types.ts` `SessionTree` / `LanePointer` / `ForkOptions`（`scope: "branch"|"tree"`）/ `findEntriesOnBranch`；学习站 `04-session-storage.html`。
- **机制**：会话是 append-only 的 entry 树；`Lane` 是一条写入链（有 leafId）；`fork` 可在分支级或树级分叉；`BranchBounds`（`stopAtType`/`stopAtId`）控制分支扫描边界。
- **对应本书**：第 8 章 §6 Snapshot、§9 Version（回滚/分叉）；第 13 章 Multi-Agent 的会话隔离与分叉。
- **引用价值**：本书第 8 章 §9 要求 Version 支持回滚；Pi 的 append-only + 分支 fork 是"不修改历史、只追加新分支"的实现，天然支持回滚与分叉。

---

## 2. 第 7 章 Context Optimizer —— Pi 压缩是"信息增益/Token"的真实落地

本书第 7 章的核心命题是"最大 Information Gain / Token Cost"，但缺一个真实压缩算法佐证。Pi 的 compaction 是一个**完整、带阈值、带源码**的压缩实现。

### 引用点 I：压缩触发——双预算 + 阈值公式

- **Pi 出处**：`packages/agent/src/harness/compaction/compaction.ts`：
  ```typescript
  export const DEFAULT_COMPACTION_SETTINGS: CompactionSettings = {
    enabled: true, reserveTokens: 16384, keepRecentTokens: 20000,
  };
  export function shouldCompact(contextTokens, contextWindow, settings): boolean {
    if (!settings.enabled) return false;
    return contextTokens > contextWindow - settings.reserveTokens;
  }
  ```
- **机制**：两个预算——`reserveTokens`（默认 16384，留给摘要 prompt 和输出）+ `keepRecentTokens`（默认 20000，压缩后保留的近期 token）。触发条件：`contextTokens > contextWindow - reserveTokens`。
- **对应本书**：第 7 章 §13 Adaptive Budget（"8K/128K/1M 不同保留"）；第 2 章 §8 Context Package（`token_budget: 24000`）。本书给的是**输出字段**，Pi 给的是**强制机制**：`contextWindow - reserveTokens` 让预算随模型窗口自适应。
- **建议引用方式**：第 7 章 §13 Adaptive Budget 处：
  > 真实运行时如何让预算随模型自适应？开源运行时 Pi 用一个阈值公式：`contextTokens > contextWindow - reserveTokens`，其中 `reserveTokens`（默认 16384）预留给摘要生成、`keepRecentTokens`（默认 20000）决定保留多少近期上下文。模型窗口变大，触发线自动后移，无需改代码。

### 引用点 J：切点算法——保留尾 + 不在 turn 中间切断

- **Pi 出处**：`compaction.ts` `findCutPoint()` / `findValidCutPoints()` / `findTurnStartIndex()`。
- **机制**：从新到旧累加 token，到 `keepRecentTokens` 找最近合法切点。合法切点 = user/assistant/bashExecution/custom/branchSummary/compactionSummary 角色 + 独立 branch_summary；**不能在 toolResult 中间切**。若切点落在一个进行中的 turn 中间（`isSplitTurn`），单独对该 turn 的前缀再生成一个 `TURN_PREFIX_SUMMARIZATION_PROMPT` 摘要，保证 turn 语义完整。
- **对应本书**：第 7 章 §4 优化目标（信息增益）；第 8 章 §6 Snapshot（压缩点是检查点）。
- **引用价值**：本书说"不要直接截断"，Pi 给出"在哪切才不破坏语义"的具体算法——turn 边界 + toolResult 不可切 + split-turn 特殊处理。

### 引用点 K：结构化摘要模板——信息密度最大化的具体格式

- **Pi 出处**：`compaction.ts` `SUMMARIZATION_PROMPT`：
  ```
  ## Goal
  ## Constraints & Preferences
  ## Progress  (### Done / ### In Progress / ### Blocked)
  ## Key Decisions
  ## Next Steps
  ## Critical Context
  ```
  以及 `UPDATE_SUMMARIZATION_PROMPT`（增量更新）、`SUMMARIZATION_SYSTEM_PROMPT`（"Do NOT continue the conversation. ONLY output the structured summary"）。
- **机制**：摘要不是自由文本，而是固定 6 段结构；明确禁止"继续对话/回答问题"；强制保留"exact file paths, function names, and error messages"。
- **对应本书**：第 7 章 §9 Document Compression（"SOP 20 页 → 200 Token，保留关键步骤"）、§10 Event Compression（"1000 条 log → Timeline"）、Reasoning-aware Compression（"问'为什么失败'保留 Timeline 删 README"）。
- **引用价值**：本书的"保留关键步骤/形成 Timeline"是建议；Pi 的 6 段模板是**已经过实战的结构化摘要契约**，可直接作为"Document/Event Compression 输出格式"的参考样板。注意：Pi 压缩的是**对话历史**，本书压缩的是**知识对象**——领域不同，但"结构化摘要保信息密度"的范式通用。

### 引用点 L：增量摘要更新——Progressive Context 的工程形态

- **Pi 出处**：`compaction.ts` `generateSummaryWithUsage(previousSummary?)`：有 `previousSummary` 时用 `UPDATE_SUMMARIZATION_PROMPT`，规则包括"PRESERVE all existing information / ADD new / UPDATE Progress / may remove if no longer relevant"。
- **机制**：每次压缩不是从零重写摘要，而是把上一版摘要 + 新消息一起喂给 LLM 做增量更新——旧信息保住、新信息并入、过时信息可删。
- **对应本书**：第 7 章末尾"Progressive Context（渐进式上下文）"（"Round1 → Need More → Round2"，类似 CPU Demand Paging）；第 9 章 §9 Cache 更新策略。
- **引用价值**：本书的 Progressive Context 是概念图；Pi 的 `UPDATE_SUMMARIZATION_PROMPT` 是它的具体 prompt 契约——"怎么让摘要随推理演化而不丢信息"。

### 引用点 M：信息保真——摘要 + 保留尾（不是只留摘要）

- **Pi 出处**：`context.ts` `sessionEntryToContextMessages()` 投影 `compaction` entry：
  ```typescript
  if (entry.type === "compaction") {
    return [
      createCompactionSummaryMessage(entry.summary, entry.tokensBefore, entry.timestamp),
      ...entry.retainedTail,   // 压缩时被保留的近期消息，原样保留
    ];
  }
  ```
  以及 `compaction.ts` `CompactResult.retainedTail`。
- **机制**：压缩 entry 同时存 `summary`（旧历史摘要）和 `retainedTail`（近期消息原样）。投影时两者都放出——近期上下文零损耗，只有远期被摘要。`tokensBefore` 字段记录压缩前 token 数，供 diff/可观测。
- **对应本书**：第 7 章 §4（"精炼不等于体积小……把每份体积用在信息密度最高的地方"）、§15 Explain（"Document A → Summary → 200 Token → 原因：Token Budget"）；第 9 章 §7.3 Document Summary 缓存。
- **引用价值**：本书强调"省 Token 但信息没丢"；Pi 的"摘要+保留尾"双存储是这个原则的最小可信实现——近期无损、远期摘要，且 `tokensBefore` 让"省了多少"可量化（呼应 `case.md` 对 ch7"Token 经济性案例"的要求）。

### 引用点 N：来源溯源——压缩 entry 带文件操作清单

- **Pi 出处**：`compaction.ts` `CompactionDetails { readFiles, modifiedFiles }`、`extractFileOperations()`、`computeFileLists()`、`formatFileOperations()`。
- **机制**：压缩时从被摘要的历史里抽取"读了哪些文件/改了哪些文件"，作为结构化 `details` 存进压缩 entry，并 append 到摘要文本末尾。即便对话被压成摘要，"碰过哪些文件"这个元上下文不丢。
- **对应本书**：第 2 章 §8 Context Package 的 `provenance: []`；第 7 章 §15 Explain；第 10 章 Observability。
- **引用价值**：本书 Context Package 有 `provenance` 字段；Pi 的 `CompactionDetails` 是"压缩后仍保留来源溯源"的具体实践——证明压缩与可审计不冲突。

---

## 3. 第 9 章 Context Cache —— Pi 的缓存隔离与增量复用

### 引用点 O：摘要调用的缓存隔离——`cacheRetention: "none"` + 独立 sessionId

- **Pi 出处**：`compaction.ts` `completeSimpleWithRetries()`：
  ```typescript
  const requestOptions: SimpleStreamOptions = {
    ...options,
    cacheRetention: "none",   // 摘要调用不写 KV-cache
    sessionId: uuidv7(),       // 独立 sessionId，不污染主对话缓存
  };
  ```
- **机制**：摘要生成是一次性独立请求，显式不写 prompt/KV cache、用独立 sessionId——避免摘要请求的缓存条目被主对话误命中（脏缓存）。
- **对应本书**：第 9 章 §7.5 Prompt Fragment 缓存、§10 Cache 失效（"避免脏 Context"）。**这是反例也是正例**：本书主张缓存可复用片段，Pi 在**摘要这一类不该被缓存复用的请求**上显式关闭缓存——说明"缓存什么"和"不缓存什么"同样重要。
- **引用价值**：本书第 9 章 §10 列了失效场景，但没讲"主动不缓存"的实践；Pi 的 `cacheRetention: "none"` 是"哪些请求坚决不进缓存"的工程判据，可作 §7.5 的对照注脚（见 `citations.md` 引用点 O 的 KV-cache 三规则可并列）。

### 引用点 P：token 计量——provider usage 优先 + 字符启发式兜底

- **Pi 出处**：`compaction.ts` `estimateContextTokens()` / `calculateContextTokens()` / `estimateTokens()`。
- **机制**：优先用最近一条 assistant 消息的 provider 上报 usage（准确）；没有则用字符启发式（`chars / 4`，图片按 4800 字符估）。返回 `{ tokens, usageTokens, trailingTokens, lastUsageIndex }`。
- **对应本书**：第 9 章 §14 Cache 指标（"Token Saved"）；第 7 章 §15 Explain。
- **引用价值**：本书要监控"省了多少 Token"；Pi 的"provider usage 优先、启发式兜底"是 Token 计量的务实做法——准确值与估算值分清，避免把估算当精确。

### 引用点 Q：Usage 按 cause 归因——每笔 token 成本可追溯

- **Pi 出处**：`types.ts` `UsageRecord`，`cause: "assistant" | "compaction" | "branch_summary" | "deferred_fetch" | "tool" | "hook" | "adjustment"`。
- **机制**：每条 usage 记录都带 cause——这笔 token 是主对话、压缩、分支摘要、延迟取数、工具、钩子还是调整产生的。
- **对应本书**：第 9 章 §13 Cache Trace（Hit/Miss/Refresh/Expire）、§14 指标；第 10 章 Observability（成本归因）。
- **引用价值**：本书第 10 章要求可观测；Pi 的 `cause` 归因让"压缩本身花了多少 token"可单独度量——这是 `case.md` 对 ch7"Token 经济性案例"要量化时最缺的那类数据（压缩收益 vs 压缩成本）。

---

## 4. 第 13 章 Multi-Agent Context —— Pi 的会话分叉与队列原语

> 注：Pi 的 learning-site 第 5/6 章是单会话视角；多 Agent / 共享 Context 的**完整机制 Pi 未在 learning-site 详述**。本节只引用 Pi 源码中确实存在的会话分叉与队列原语，不外推 Pi 有"多 Agent 共享 Context"能力。本书第 13 章在"共享 vs 隔离"上比 Pi 走得更远（见综述引用点 DD/EE/FF）。

### 引用点 R：会话分叉——branch/tree 两种 scope

- **Pi 出处**：`types.ts` `ForkOptions`：`{ scope: "branch"; entryId?; position?: "before"|"at" } | { scope: "tree" }`；`SessionRepo.fork()`。
- **机制**：分叉可在分支级（从某个 entry 前/处另起）或树级（整棵会话另起）。`parentSessionId` 维护派生关系。
- **对应本书**：第 13 章多 Agent 会话隔离与 handoff。本书主张"共享 Context vs 消息传递"的取舍（综述引用点 EE）；Pi 的 branch fork 给出了"隔离"这一侧的具体实现——子 Agent 从父会话某点分叉出独立分支，物理隔离但可追溯来源。
- **引用价值**：本书第 13 章 handoff 契约（综述引用点 FF）需要"怎么把上下文交给子 Agent"；Pi 的 branch fork 是"交给一份可独立演化的分支副本"的最小机制。

### 引用点 S：三种队列原语——steer / followUp / nextRun

- **Pi 出处**：`types.ts` `QueueEnqueuedRecord`，`queue: "steer" | "followUp" | "nextRun"`；`agent-loop.ts` `runLoop()` 外层/内层循环。
- **机制**：
  - `steer`：执行**途中**注入的转向消息（内层循环每轮 `getSteeringMessages` 拉取，下轮 assistant 响应前注入）。
  - `followUp`：Agent 本应停止**之后**到达的续接消息（外层循环 `getFollowUpMessages` 拉取，重启内层循环）。
  - `nextRun`：下一轮运行的排队消息。
- **对应本书**：第 13 章 Multi-Agent 协作的"消息传递"一侧；第 8 章 Runtime 的"事件驱动 + 队列"。
- **引用价值**：本书第 13 章对比"共享 Context vs 消息传递"；Pi 的三种队列是"消息传递"这一侧的细粒度原语——区分"途中插话"和"停下后续接"，对应多 Agent 协作里不同时序的注入需求。

### 引用点 T：双循环——内层工具循环 + 外层续接循环

- **Pi 出处**：`agent-loop.ts` `runLoop()`（L155–275）。
  ```typescript
  // Outer loop: continues when queued follow-up messages arrive after agent would stop
  while (true) {
    let hasMoreToolCalls = true;
    // Inner loop: process tool calls and steering messages
    while (hasMoreToolCalls || pendingMessages.length > 0) { ... }
    const followUpMessages = (await config.getFollowUpMessages?.()) || [];
    if (followUpMessages.length > 0) { pendingMessages = followUpMessages; continue; }
    break;
  }
  ```
- **机制**：内层循环处理工具调用 + steer 注入；外层循环在 Agent 要停时检查 followUp，有则续跑。`prepareNextTurn`（每轮快照点，可改模型/思考级别/上下文）、`shouldStopAfterTurn`（终止控制）是两个钩子。
- **对应本书**：第 8 章 §2（Context 在 `Question→Context→Tool→Observation→New Context→Reasoning` 循环中演化）；第 13 章多 Agent 的运行时编排。
- **引用价值**：本书讲 Context 随推理循环演化；Pi 的双循环是"工具循环 + 续接循环"分离的具体结构——内层管"边做边被插话"，外层管"做完再续"，把两种 Context 演化时序区分开。

### 引用点 U：截断安全——length stopReason 不执行被截断的工具调用

- **Pi 出处**：`agent-loop.ts` `runLoop()`：
  ```typescript
  const executedToolBatch =
    message.stopReason === "length"
      ? await failToolCallsFromTruncatedMessage(toolCalls, emit)  // 不执行可能损坏的调用
      : await executeToolCalls(currentContext, message, config, signal, emit);
  ```
- **机制**：输出被 token 上限截断（`stopReason === "length"`）时，其中的 toolCall 参数可能不完整——不执行，直接失败，而非执行"可能损坏的调用"。
- **对应本书**：第 8 章运行时健壮性；第 7 章 Token Budget 的边界行为。
- **引用价值**：一个极小但关键的健壮性闸门，证明"预算耗尽时怎么安全降级"——本书第 7 章 Token Allocation 应说明预算撞墙时的安全行为，Pi 给了参考。

---

## 5. 第 14 章 Evolution Roadmap —— Pi 的"五阶段自制 Runtime"施工图

本书第 14 章是演进路线（Phase 1–4）；Pi 的 learning-site 第 12 章给出了一条**从零自制 Runtime 的五阶段施工图**，每阶段引用已学概念与可借鉴源码。两者都是"阶段化演进"，可直接对照。

### 引用点 V：五阶段施工路线

- **Pi 出处**：`learning-site/12-build-own-runtime.html` §12.2–12.6。
  - **阶段① 最小但完整的循环**：纯循环 + "错误进流"（错误当消息不抛出）从第一天就养成。
  - **阶段② 让对话活到下次启动**：持久化 + 恢复重建（读回历史→重建 messages→复用阶段①循环）。"会话即状态"——模型选择、系统提示也能跟着恢复。**纪律：先忍住不做多会话/分叉。**
  - **阶段③ 上下文会太长，得会压缩**：自动触发 + 摘要替换两点（来自第 5、6 章，可简化）。
  - **阶段④ 变成真正的 Harness**：操作状态机 + 事件驱动 + 队列 + 钩子——从"库"变"运行时/平台"。
  - **阶段⑤ 工具三板斧与多供应商**：`prepare（校验+权限钩子）→ execute（signal 可中止 + 流式 update）→ finalize（可改写+terminate）`；多供应商抽象。
- **关键纪律（Pi §12.1）**："每一阶段结束时，它都是一个能独立运行、被验证过的正确小系统，不是半成品"；"下一阶段总在上一阶段的'地基事件'上长出，而非推翻重写"。
- **对应本书**：第 14 章 Evolution Roadmap 的 Phase 1–4；第 1 章 §8 MVP。
- **建议引用方式**：第 14 章某 Phase 处，作为"参考实现的开源演进路线"：
  > 开源运行时 Pi 在其学习资料中给出一条自制 Runtime 的五阶段施工图：①最小完整循环（含"错误进流"纪律）→ ②持久化与恢复（先单会话，忍住不分叉）→ ③自动压缩 → ④操作状态机+事件+队列+钩子（从库变运行时）→ ⑤工具三阶段管线+多供应商。其核心纪律是"每阶段结束都是一个能独立运行的正确小系统，下一阶段在上一阶段的地基事件上长出而非重写"——与本书 Phase 1→4 的阶段化思路一致。
- **引用价值**：本书第 14 章路线图是"设计阶段划分"；Pi 的五阶段是"实现阶段划分"且每阶段带可借鉴源码——证明路线图可施工，呼应 `case.md` 对 ch14"分期落地案例"的要求。

---

## 6. 第 10 章 Observability —— Pi 的信任决策与四层安全纵深

### 引用点 W：四层安全纵深

- **Pi 出处**：`learning-site/14-security-local-integration.html` §14.1–14.2。
  - **信任系统（软边界）**：`trust-manager.ts`，`TrustFile` = 路径→决策三态表（`true/false/null`），"就近祖先"继承（`~/work` 信任→`~/work/repo-a` 继承），`null` 表示"跟随父目录"。`proper-lockfile` 加锁写保证并发安全。
  - **`beforeToolCall` 钩子（放行）**：权限确认挂在钩子上。
  - **AbortSignal→杀进程树（可停）**：Bash 工具接 AbortSignal 并杀整个进程树。
  - **容器化（硬边界）**：Docker/Gondolin/OpenShell，"Agent 能碰到的"从"当前目录"缩到"容器文件系统"。
  - 一句话区分：信任决定"要不要问"，钩子决定"放不放行"，AbortSignal 决定"能不能停"，容器决定"能碰到什么"。
- **对应本书**：第 2 章 §8 Policy（ACL/脱敏/审计）；第 10 章 Observability；第 8 章 Policy Engine。
- **引用价值**：本书第 2 章 Policy 是数据契约；Pi 的"信任三态+就近祖先+加锁写"是"跨进程跨会话要落盘的安全判断"的工程模板——可作 Policy Engine 落地参考。本书可在 Policy 章节注："信任决策的难点不在信任本身，而在决策如何继承、持久化、并发安全"。

### 引用点 X：本地模型即 Provider——llama.cpp 适配器

- **Pi 出处**：`learning-site/14-security-local-integration.html` §14.3，`extensions/llama/provider.ts`。
- **机制**：本地 llama.cpp 不需要新机制，只需一个"把本地 llama 服务器翻译成 Model/Provider"的适配器：`toPiModel` 把 `n_ctx` 映射成上下文窗口（取不到回退 128000）；`stream/streamSimple` 直接复用 pi-ai 的 OpenAI 兼容流；`refreshModels` 从 catalog 筛 `status.value === "loaded"`（真正加载到内存）的模型。
- **对应本书**：第 14 章 Roadmap（离线/私有化部署）；第 8 章多模型适配。
- **引用价值**：本书第 14 章若涉及私有化/离线部署，Pi 的"本地模型即一个 Provider 适配器"是最小落地路径——证明离线接入不需要造新机制，只需翻译层。

---

## 7. 诚实标注：Pi 未覆盖处（本书超出 Pi 的部分）

为遵守"不编造"红线，明确 Pi **不能**为以下本书设计背书：

| 本书设计 | Pi 现状 | 结论 |
|---|---|---|
| 第 8 章 §8 Merge（多源冲突解决策略） | Pi 的 `entryTransforms` 是顺序 transform，无显式冲突解决 | 本书更严；Pi 只能引"结构 merge 缝"，不能引"冲突解决" |
| 第 8 章 §11/§12 Lock / 多 Agent 共享 | learning-site 第 5/6 章单会话；多 Agent 共享 Context 未详述 | 本书第 13 章超出 Pi；引 Pi 只限"分叉/队列原语" |
| 第 8 章 §14 三级存储（Redis/Paimon/Object） | Pi 未讨论存储分层 | 不可引 |
| 第 2 章 Policy 对象（输出约束） | Pi 无 Policy 对象 | 不可引为 Policy 背书；只能引信任系统（§14.1） |
| 第 7 章 知识对象压缩（Entity/Relation/Metric） | Pi 压缩的是**对话历史**，非知识对象 | 领域不同；只引"结构化摘要范式"通用性，不引"对象压缩算法" |
| 第 9 章 语义 Context Cache（Context Package 级） | Pi 缓存是 prompt/KV-cache 级，非 Context Package 级 | Pi 是反例（`cacheRetention:"none"`），非正例 |

---

## 8. 嵌入状态（2026-08-17 更新）

已嵌入 `books/` 成品，共 5 处，每处以 `<span class="src">来源：Pi Agent Harness 源码/学习站，<路径></span>` 行内标注。下表为已嵌入点：

| 章节 | 已嵌入引用点 | Pi 引用点 | 处数 |
|---|---|---|---|
| 第 7 章 Context Optimizer | 双预算阈值（reserveTokens 16384 / keepRecentTokens 20000）+ 触发公式 | I | 1 |
| 第 7 章 Context Optimizer | 结构化六段摘要模板 + 增量更新（保旧/并新/删过时）= Document Summary 输出范式 | K、L | 1 |
| 第 8 章 Context Runtime | 三段式纯函数管线（transform→project→派生状态）= Expand→Optimize→Consume 落地 | A、B | 1 |
| 第 8 章 Context Runtime | 内容流 vs 操作账本双流 = Event Bus 最小实现 + 操作恢复三态 | C、G | 1 |
| 第 14 章 Evolution Roadmap | 五阶段自制 Runtime 施工图 = "阶段化演进、不半成品"原则的开源印证 | V | 1 |

**未与已有引用冲突**：五处嵌入点所在段落原先均无 `<span class="src">` 标注；相邻既有引用（ch07 §objective Survey "context rot"、§objective Survey "最小高信号集"、§document-compression Survey "先召回再精度"、§objective Foundry "Ontology volume"、§progressive Survey "三层内存/MemGPT"；ch08 §snapshot/§update Survey、§merge/§version Foundry；ch14 §palantir Foundry）分处不同小节、论证不同侧面，互不重叠。

待嵌入（后续批次，按优先级）：

| 优先级 | 章节 | 引用点 | 价值 |
|---|---|---|---|
| 🟡 1 | 第 7 章 §4 | M | 摘要+保留尾（retainedTail）= 信息保真的最小实现（与 §4 既有 Foundry "Ontology volume" 不冲突，论述"省 Token 但信息没丢"的落地侧） |
| 🟡 2 | 第 9 章 §7.5/§10 | O、Q | 缓存隔离（cacheRetention:"none"）+ cause 归因 = "不缓存什么"与成本归因 |
| 🟢 3 | 第 13 章 | R、S、T | 分叉/队列/双循环 = 多 Agent 原语（仅隔离与消息传递侧，诚实标注 Pi 无共享 Context） |
| 🟢 4 | 第 10 章/第 2 章 Policy | W、X | 四层安全纵深 + 本地模型 Provider |

---

## 9. 给写作者的话

1. **Pi 的引用价值在"可核验"**：每个机制都能指向具体源码文件（`context.ts`、`compaction.ts`、`session/types.ts`、`agent-loop.ts`）或学习站章节（`05-context.html` 等）。引用时尽量带文件名 + 函数名，让读者可查。
2. **领域差异要诚实**：Pi 压缩对话历史，本书压缩知识对象。引"结构化摘要范式/双预算/切点算法"的通用性，不要引成"Pi 实现了 Entity 压缩"。第 7 节的不可引清单务必遵守。
3. **与已有引用配合**：Pi 是"工程实现"，Harness 综述是"学术量化"，Foundry 是"数据治理"。同一章节可三者并列——例如第 7 章：综述证明"harness 比模型重要"（动机）+ Foundry 证明"精炼数据仍可能很大"（规模治理）+ Pi 证明"压缩具体怎么做"（落地）。三者互补不冲突。
4. **版本与时点**：Pi 源码随版本演化，引用时标注 `v0.84.2-6-g086c32e74`（learning-site 页脚）与核对日期，以源码为准。
5. **一个主案例串联**：参考 `case.md` 第五节，可考虑把 Pi 的"会话→上下文→压缩→恢复"作为一条贯穿第 7/8/9/13 章的工程实现主线，在不同章节展示其不同环节——比每章硬引不同片段更连贯。
