# 引用映射：Palantir Foundry Ontology 文档 → 本书各章

> 来源：Palantir Foundry 官方文档 `https://www.palantir.com/docs/foundry/ontology/overview/` 左侧导航树全部内容。
> 学习笔记：`reference/palantir_ontology_notes_1.md` ～ `palantir_ontology_notes_4.md`（四份文件，累计 378 篇，覆盖 Ontology building 全大类：Object/link types、Action types、Functions、Interfaces、Ontology 设计、Ontology search、应用层、后端架构）。
>
> 本文档把 Foundry Ontology 中对本书**各章节有直接帮助**的实践，逐条映射为"可引用描述"。每条标注：①对应本书哪章、②笔记出处（文件/篇目编号）、③建议怎么引用、④引用价值（为什么值得引）。
>
> 红线：以下所有机制、概念、系统名称均来自学习笔记原文（笔记一～四，共 378 篇），未做任何外推或编造。Foundry 文档本身随版本演进，引用时请保留"截至笔记整理时点"的限定。
>
> 与 `citations.md`（Agent Harness Engineering 综述）的分工：后者提供**学术理论背书**（"为什么"的量化证据），本文档提供**工业实现范式**（"怎么做"的成熟参照）。两者互补——学术引用提升说服力，工业引用提升可落地性。

## 嵌入状态：已嵌入 books/ 成品与 chapters/ 源

引用已嵌入 `books/` HTML 成品和 `chapters/` markdown 源，共 **15 章 / 25 个引用点 / 27 处标注**（其中 PB 与 PC 同引 Ontology 概览、PM 与 PN 同引 augmented generation，各拆为独立标注），每处以 `<span class="src">来源：Foundry Ontology 文档，…</span>` 行内标注（CSS 类定义在 `books/style.css`，与 `citations.md` 共用）。下表按章节标注已嵌入的引用点：

| 章节 | 已嵌入引用点 | 位置 |
|------|------------|------|
| 第 0 章 概述 | PA | 原则 1「Context 是产品，Ontology 是基础设施」 |
| 第 1 章 总体架构 | PC | 「核心模块与边界」开头 |
| 第 2 章 对象模型 | PD、PB、PF、PH、PAA | 七类对象表后、Action 模型、通用元数据、Schema 演进、Policy 输出约束 |
| 第 3 章 Knowledge Builder | PI | Validation 之后新增「前车之鉴」节 |
| 第 4 章 检索 | PL、PM、PN | Vector Retriever、Query Rewrite |
| 第 5 章 图扩展 | PE、PO | 「Graph 是导航层」、ExpansionEngine 接口 |
| 第 6 章 排序 | PBB、PQ | Permission 因子、Token Cost 因子 |
| 第 7 章 优化器 | PR | 优化目标（最大信息增益） |
| 第 8 章 运行时 | PT、PS | Context Merge、Version 与 Diff |
| 第 9 章 缓存 | PU、PP | L1 分层、Graph Expansion 缓存内容 |
| 第 10 章 可观测 | PV、PW、PX | Trace Pipeline、RCA 七类归因后 |
| 第 11 章 研发上下文 | PY | Context Plugin Marketplace |
| 第 12 章 业务上下文 | PG | 行业插件化 |
| 第 13 章 多 Agent | PZ | 「共享 Context 的威力」后 |
| 第 14 章 路线图 | PCC | 「与 Palantir Foundry 的区别」后 |

引用纪律与 `citations.md` 一致：标注来源、区分平台演进（OSv1/OSv2、Legacy/新版）、保留官方限定、不外推、机制而非数字。

---

## 0. 一句话判断

Palantir Foundry 是目前工业界最成熟的"Ontology 驱动"企业数据平台。它的核心论点——**Ontology 代表企业中的"决策"(decisions)而非仅仅是"数据"(data)**——与本书第 0 章"Context 是产品，Ontology 是基础设施"（原则 1）几乎同构。更重要的是，Foundry 提供了大量**带具体机制、带工程细节的实现范式**（类型体系、图扩展、沙箱合并、权限分层、产品化分发），可作为本书多个章节的工业参照。

与学术论文引用不同，Foundry 的价值不在量化数字，而在**已经被规模化验证的工程模式**——它证明本书设计的对象模型、图扩展、上下文沙箱、插件化分发不是凭空发明，而是有工业先例的成熟路径。

---

## 1. 第 0 章 概述 / 第 1 章 总体架构 —— Ontology 的定位与边界

### 引用点 PA：Ontology = 运营层而非数据层（最强定位背书）
- **笔记出处**：笔记一，批次 1 第 2 篇"Why create an Ontology"（第 38–49 行）。
- **原文要点**：
  - Foundry 明确提出 Ontology 是让客户"安全、可靠、有效地在企业中使用 AI、驱动运营转型"的核心系统。
  - 核心论点：**Ontology 代表的是企业中的"决策"(decisions)，而不仅仅是"数据"(data)**。传统数据架构不会捕捉决策背后的推理过程和随之而来的行动，因而限制了学习与 AI 的融入。
  - 价值：让新数据快速整合进高保真语义表示；让新算法/业务逻辑无缝暴露给人类和 AI 用户；通过与运营系统的实时连接实现"动作集成(action integration)"。
- **建议引用方式**：第 0 章愿景或第 1 章平台定位处。措辞示例：
  > 工业界最成熟的 Ontology 平台 Palantir Foundry 同样认为，Ontology 的价值不在于"数据"而在于"决策"：它捕捉决策背后的推理与行动，并通过与运营系统的实时连接实现动作集成（Foundry Ontology 文档）。本书的 Context Engine 正是把这个"决策可执行"的语义层交给 Agent 消费。
- **引用价值**：直接背书本书第 0 章"瓶颈从模型转向 Context"和"Context Engine 是 AI Agent 的上下文操作系统"的定位。

### 引用点 PB：语义元素 + 动态元素的二分法
- **笔记出处**：笔记一，批次 1 第 1 篇"Overview"（第 28–36 行）。
- **原文要点**：Foundry 的 Ontology 包含**语义元素(semantic elements：objects/properties/links)**和**动态元素(kinetic elements：actions/functions/动态安全策略)**。四大组成部分：Object & Link types、Action types & Functions、Interfaces、应用层。
- **建议引用方式**：第 0 章核心抽象或第 2 章 Action 模型处。措辞示例：
  > Foundry 把 Ontology 分为语义元素（对象/属性/链接）与动态元素（动作/函数/安全策略）两类（Foundry Ontology 文档）。本书第 2 章将 Action 与 Policy 列为一等公民对象，正是对"动态元素"的对应——上下文不只是供阅读的信息，还包括可执行的动作与必须遵守的约束。
- **引用价值**：佐证本书把 Action（可执行动作）和 Policy（权限规则）纳入对象模型而非外挂的设计。

### 引用点 PC：Foundry 四大组成与本书六层架构的对照
- **笔记出处**：笔记一，批次 1 第 1 篇"Overview"（四大组成部分）。
- **原文要点**：Foundry 四大组成——Object & Link types（映射数据为对象）、Action types & Functions（动态部分）、Interfaces（多态建模）、应用层（Object Views/Workshop 等深度集成）。
- **建议引用方式**：第 1 章六层架构处，用 Foundry 四大组成作外部参照系，说明本书聚焦 Knowledge Runtime + Context Engine 层，并向下衔接 Storage、向上衔接 Agent。
- **引用价值**：用工业平台的结构给本书章节体系一个外部映射。

---

## 2. 第 2 章 Context Object Model —— 类型体系与 Schema 演进

### 引用点 PD：Object/Property/Link/Action 类型体系
- **笔记出处**：笔记一，批次 3"Object and link types"（第 179–398 行，45 篇）。
- **原文要点**：Foundry 四大核心类型——Object type（实体/事件 schema）、Property（特征字段）、Link type（两对象间关系 schema）、Action type（对象如何被修改的 schema + 副作用）。用数据集类比：Object type≈表、Object≈行、Property≈列、Link≈join。
- **建议引用方式**：第 2 章 Entity 模型或"与数据平台映射"处。措辞示例：
  > Foundry 的 Ontology 以 Object type、Property、Link type、Action type 为四大核心类型，并用"对象类型≈表、对象≈行、属性≈列、链接≈join"的数据集类比降低理解门槛（Foundry Ontology 文档）。本书的对象模型（Entity/Relation/Action）与此同构，Document 则作为对象来源与证据载体。
- **引用价值**：为本书对象模型提供工业级成熟参照，证明"Object 是一等公民"的设计非凭空发明。

### 引用点 PE：Derived Property——"每个事实只存一份"
- **笔记出处**：笔记一，批次 3a 第 33 篇"Derived properties"（第 303–308 行）+ 笔记三，结构指南第 173 篇（第 116–132 行）。
- **原文要点**：
  - Derived property 值不直接存储，而是**运行时基于 link 关联到的其他对象的属性动态计算**的只读属性，支持最多 3 层关联；多对多基数链路必须指定聚合方式（Count/Average/Sum/Min/Max 等）。
  - 结构指南核心原则：**每个事实只存一份(store each fact once)**，用 derived property 换取便利性。把关联对象的值冗余复制（denormalization）有风险——数据源变化时所有副本都要更新；规范化 + derived property 能在保证一致性的同时获得"看起来像冗余展开"的访问便利，且不需人工维护同步。
  - 更细判断：不是所有"计算出来的值"都能一视同仁——要看它"能否安全地从稳定输入预计算"还是"必须和 Ontology 里动态变化的内容保持同步"。如果一个值依赖 action 带来的变化，每个可能影响它的 action 都必须同步更新它。
- **建议引用方式**：第 5 章"Graph 的定位"（第 3 节）或第 7 章 Relation Compression 处。措辞示例：
  > Foundry 的结构指南提出"每个事实只存一份"：关联对象的值不应冗余存储为属性，而应在运行时通过 derived property 按需计算（Foundry Ontology 文档）。这正是本书把 Graph 定位为"Object Store 的导航索引"而非存储层的依据——关系在运行时展开，而非冗余落盘。
- **引用价值**：直接佐证本书第 5 章"Graph 只是 Object Store 的导航索引"和第 7 章 Relation Compression 的设计哲学。

### 引用点 PF：Value Type——校验逻辑集中治理
- **笔记出处**：笔记一，批次 3b 第 50–55 篇"Value types"（第 354–371 行）。
- **原文要点**：Value type 是对基础字段类型的"语义包装"，附带元数据和约束（constraints）。经典例子：定义"email" value type 挂正则约束，之后任何用到它的属性自动获得校验。约束类型含 Enum/Range/Regex/RID/UUID/Uniqueness/Nested。权限上"用"vs"定义/治理"分离：View 权限可使用，Editor/Owner 才能创建编辑。
- **建议引用方式**：第 2 章 Policy 模型或第 3 章 Validation 处。措辞示例：
  > 校验逻辑应"随类型走"而非散落各处：Foundry 的 Value Type 机制允许把正则、枚举、范围等约束绑定到语义类型上，所有引用该类型的属性自动继承校验（Foundry Ontology 文档）。本书的 Policy 对象与第 3 章 Validation 遵循同一思路——校验失败的对象不得进入 Ontology。
- **引用价值**：佐证本书"Validation Failure 不能进入 Ontology"的纪律，并提供"校验集中治理"的工业范式。

### 引用点 PG：Interface——用抽象而非"大而全"object type
- **笔记出处**：笔记三，Interfaces 大类（第 12–97 行，9 篇）。
- **原文要点**：Interface 描述 object type 的"形状"与"能力"，让共享结构的多个 object type 一致建模。经典例子：Facility 接口（Facility Name、Location），Airport/Manufacturing Plant/Maintenance Hangar 各自实现并带特有属性。**未来新增实现该接口的类型时，已有工作流无需改动就自动兼容**。一个 object type 可实现多个接口；接口可扩展多个接口，属性沿继承链叠加。
- **建议引用方式**：第 11 章或第 12 章"行业插件化"处。措辞示例：
  > 领域插件的共性应通过抽象表达，而非硬造属性稀疏的大而全类型。Foundry 的 Interface 机制让 Airport、Manufacturing Plant 等不同类型实现同一 Facility 接口，新增实现类型时已有工作流自动兼容（Foundry Ontology 文档）。本书的 Domain Context Plugin 遵循同一多态思路。
- **引用价值**：佐证本书第 11/12 章插件化设计和第 2 章"类型可新增"的可行性。

### 引用点 PH：Schema 破坏性变更与编辑迁移
- **笔记出处**：笔记四，Object edits and materializations（第 274–282 行）。
- **原文要点**：
  - 破坏性 schema 变更包括改属性数据类型、换 object type 背后数据源、改主键等。
  - OSv1(Phonograph) 的架构性局限：**不支持编辑迁移**——一旦破坏性变更，已有用户编辑要么丢失要么需人工抢救；无 schema 迁移支持时唯一变通是移除 writeback dataset 配置，但这会删掉所有已有用户编辑。
  - OSv2 从架构上解除该限制，让破坏性 schema 变更可支持编辑迁移，允许更灵活迭代。
- **建议引用方式**：第 2 章 Schema 演进（第 9 节）或第 3 章 Version Management 处。措辞示例：
  > "保证历史 Context 可重放"不只是版本号问题。Foundry 的经验表明，破坏性 schema 变更后能否迁移已有用户编辑，取决于底层存储架构：旧版存储(Phonograph)不支持编辑迁移，新版(OSv2)才从架构上解除该限制（Foundry Ontology 文档）。本书的 Schema 演进设计需在存储层就考虑编辑迁移能力。
- **引用价值**：深化本书第 2 章"保证历史 Context 可重放"的工程内涵。

---

## 3. 第 3 章 Knowledge Builder —— 质量治理与后端架构

### 引用点 PI：Ontology 设计反模式清单（本章最核心引用）
- **笔记出处**：笔记三，Ontology 设计三篇（第 172–174 篇，第 103–148 行）。
- **原文要点**：
  - **最佳实践检查清单**（可直接抄用）：对现实建模而非对系统建模；有意识地做取舍(curate intentionally)；跨团队协作（团队各自为战是"重复建模"主因）；保持 object type 聚焦；选对工具（人工/agent 决策用 action types，全自动转换用 pipelines）；用 Interface 做抽象而非硬造大而全 object type。
  - **Kitchen Sink 反模式**：照搬源系统数据表 1:1 映射成属性，不做取舍；命名直接抄源系统字段习惯（如 `dtLastInspMod`）而非业务语言（如 `lastInspectionDate`）；一条源数据行混杂多个实体信息却建成单一 object type。
  - **System Silos 反模式**：因数据来自不同源系统，就给同一真实世界实体建多个 object type。
  - **Department Silos 反模式**：不同部门各自造一套同一 object type，映射的是组织架构而非业务现实。
  - **命名歧义反模式**：类型叫"Item"（产品？订单行？库存？）、属性叫"value"（金额？数量？打分？）。
- **建议引用方式**：第 3 章 Validation 或实施优先级（第 21 节）处。措辞示例：
  > 经验表明，自动抽取若不加约束，容易落入"照搬源系统 schema"的陷阱。Palantir Foundry 的 Ontology 设计文档将此列为 Kitchen Sink 反模式，并建议：对现实建模而非对系统建模、有意识地做取舍、用接口做抽象而非硬造大而全的类型（Foundry Ontology 文档）。本书 Knowledge Builder 的"Rule + LLM 混合抽取"必须配合这类质量纪律，LLM 输出不得直接写入生产 Ontology。
- **引用价值**：**补强本书第 3 章最缺的"踩坑警示"**。第 3 章讲如何构建 Ontology，但未讨论"建出来的 Ontology 质量怎么保证"。Foundry 的反模式清单是对冲 LLM 抽取产生 Kitchen Sink 的直接武器。

### 引用点 PJ：索引与写入编排的微服务架构
- **笔记出处**：笔记四，Ontology architecture 后端（第 238–272 行，约 21 篇）。
- **原文要点**：
  - Foundry 用微服务实现 Ontology 后端，三大职能：数据源管理、查询/搜索/聚合、写入编排。
  - 核心服务：OMS（元数据服务）、Object Data Funnel（OSv2 写入编排核心，从数据集/流式源/Action 编辑统一索引）、Actions 服务、OSS（读服务）、Object database（存储，分 OSv1/OSv2 两代）。
  - OSv1→OSv2 演进动机：OSv1 把"索引"和"查询"耦合，难水平扩展；OSv2 从第一性原理解耦，支持增量索引、数百亿对象规模、单次 Action 最多编辑 10,000 对象、更细粒度多数据源对象权限。
- **建议引用方式**：第 1 章 Storage 层或第 3 章 Ontology Store 处。措辞示例：
  > Ontology 后端的读写应分离：Foundry 用独立微服务分别承担元数据管理、写入编排(Funnel)、读服务(OSS)和存储，并将索引与查询解耦以支持水平扩展（Foundry Ontology 文档）。本书 Storage 层的 Object Store、Graph Index、Vector、Search 分离设计与之同构。
- **引用价值**：佐证本书第 1 章 Storage 层分离设计和第 3 章"Streaming First / Incremental First"原则。

### 引用点 PK：增量索引与流式更新
- **笔记出处**：笔记四，Indexing（第 264–272 行）+ 笔记一，批次 2 第 13 篇"索引计算成本"（第 148–156 行）。
- **原文要点**：
  - OSv2 默认对所有 object type 采用**增量索引**：新事务发生时自动计算数据差异、只索引新增/变化部分，而非每次全量重跑。
  - Funnel streaming pipelines 针对流式数据源提供低延迟流式索引。
  - 流式索引局限：流式 object type 不支持用户编辑、不支持多数据源对象(MDO)；除 Workshop 外其他前端应用不支持实时数据刷新。
- **建议引用方式**：第 3 章 Streaming Update（第 15 节）处。措辞示例：
  > 本书主张"不是每天全量重建"而是 Event 化增量更新。Foundry 的 OSv2 默认采用增量索引，新事务只索引差异部分，并为流式源提供低延迟管道（Foundry Ontology 文档）。但流式索引当前不支持用户编辑与多数据源对象——增量与可编辑性的权衡需显式设计。
- **引用价值**：佐证本书第 3 章"Streaming First / Incremental First"原则，并补充其工程约束。

---

## 4. 第 4 章 Hybrid Retrieval —— 语义搜索与查询预处理

### 引用点 PL：语义搜索流程——Embedding → Vector 属性 → KNN
- **笔记出处**：笔记三，Ontology search 大类（第 152–211 行，8 篇）。
- **原文要点**：
  - 语义搜索原理：用 AI 模型把文本转成 embedding，在 N 维空间里彼此靠近的向量对应语义相近的内容；把嵌入向量关联到 Ontology 对象后，"找相关实体"变成"找最近邻向量"。
  - **Chunking（分块）**：把大段文本拆成更小片段——embedding 模型有输入长度上限；更小片段语义区分度更高（整篇长文档一起嵌入语义会被"稀释"）。
  - 端到端流程：用 Pipeline Builder 的"Text to Embeddings"表达式把文本转向量 → 存入 Ontology 的 vector 类型属性 → 三种消费方式（Workshop KNN object set / TypeScript function / AIP Agent）。
  - vector 类型属性只能通过 KNN 查询，不能用在 action type 里，最大维度 2048。
- **建议引用方式**：第 4 章 Vector Retriever（4.2 节）处。措辞示例：
  > 语义检索的工业落地路径是：文本分块 → embedding → 存入向量属性 → KNN 近邻查询。Foundry 的语义搜索即按此流程，并强调分块粒度影响语义区分度（Foundry Ontology 文档）。本书的 Vector Retriever 应遵循同样的"分块-嵌入-近邻"范式，而非对整文档直接嵌入。
- **引用价值**：为本书第 4 章 Vector Retriever 提供工业落地路径。

### 引用点 PM：查询预处理——用户提问不能直接扔给检索
- **笔记出处**：笔记三，第 178 篇"Ontology augmented generation"（第 172–176 行）。
- **原文要点**：
  - 直接把用户原始提问扔给关键词搜索效果往往不好。建议在用户查询和实际检索之间插入一个 LLM 处理步骤：去除停用词和"帮我找找看"这类无意义修饰语、补充同义词和相关词。
  - 给了可抄的 prompt 模板思路："给定用户查询 {query}，给出能找到相关结果的搜索词列表，记得去除停用词、给最重要的词补充同义词和相关词"。
- **建议引用方式**：第 4 章 Query Rewrite（第 6 节）处。措辞示例：
  > 查询重写不是可选优化，而是检索质量的前提。Foundry 的语义搜索文档明确建议在用户查询与检索之间插入 LLM 预处理步骤，去停用词、补同义词（Foundry Ontology 文档）。本书的 Query Rewrite 把"为什么 Loss 上升"扩展为 Experiment/Training/Loss/Learning Rate 等检索词，正是同一思路。
- **引用价值**：佐证本书第 4 章 Query Rewrite 的必要性，并提供可抄的 prompt 模板。

### 引用点 PN：上下文窗口够大时未必需要语义搜索
- **笔记出处**：笔记三，第 178 篇"Ontology augmented generation"（第 173 行）。
- **原文要点**：随着模型上下文窗口变长（如 GPT-4o 的 128K 能装 300+ 页文本），不一定非得用语义搜索；如果完整上下文能塞进限制内，**优先不用搜索、直接把全部上下文塞进 prompt**，等真正需要时再引入检索。
- **建议引用方式**：第 7 章 Adaptive Budget 处。措辞示例：
  > 模型上下文窗口的扩大改变了检索策略的边界：Foundry 文档指出，若完整上下文能塞进窗口，可优先不用搜索而直接全量注入（Foundry Ontology 文档）。但这不等于"窗口大就不需要管理"——context rot（Hong et al., 2025）表明退化远早于窗口填满。本书的 Adaptive Budget 据模型窗口动态调整压缩粒度，而非简单地"塞满或检索"二选一。
- **引用价值**：与 `citations.md` 引用点 F（context rot）形成对话，让本书论证更立体——窗口大小影响策略但不消除管理必要。

---

## 5. 第 5 章 Graph Expansion —— 自定义图扩展与缓存

### 引用点 PO：Search Around 函数——自定义图扩展的工业实现
- **笔记出处**：笔记四，Vertex 第 247–257 篇 Graphs 模块（第 108–118 行）。
- **原文要点**：
  - Search Around 函数用 TypeScript functions 编写，有严格签名要求：**恰好一个参数**（一个 Ontology 对象类型或其列表）；**返回类型必须是 `IGraphSearchAroundResultV1`**，Vertex 靠这个精确类型结构自动发现合法的 Search Around 函数。
  - 返回结果支持两类边：**directEdges（直接边，对象间直接连接）**和 **intermediateEdges（中间边，对象通过中间对象/事件产生的间接连接，中间对象被"打包"合并进这条边，多个中间对象聚合到同一条边）**。
  - 还可额外接收 Integer/Double/string/boolean/Timestamp 等补充参数，系统自动生成表单。
- **建议引用方式**：第 5 章 Expansion Strategy（第 6 节）或 Expansion API（第 9 节）处。措辞示例：
  > 自定义扩展策略需要可编程的接口。Foundry 的 Vertex 提供 Search Around 函数机制：函数接收一个对象参数、返回结构化的边集合，其中 intermediateEdges 把中间对象"打包"合并进间接连接边（Foundry Ontology 文档）。本书的 ExpansionEngine 接口可借鉴这一"直接边 + 中间边"的分类，后者直接对应第 12 节的 Context Merge（多路径找到同一对象时统一 Object ID）。
- **引用价值**：**补强本书第 5 章"自定义扩展逻辑怎么实现"的工程范式**，特别是 intermediateEdges 的"打包合并"机制对应 Context Merge。

### 引用点 PP：Graph template 的参数化与 RID 复用
- **笔记出处**：笔记四，Vertex Graph template（第 115–117 行）。
- **原文要点**：
  - 任何一次图探索都可转成模板，支持配置对象参数（决定起始节点，可关联 Search Around）和非对象参数。
  - 模板可嵌入 Object View 或 Workshop 应用，支持参数映射。
  - **"覆盖图谱 RID"选项**：从对象的某个属性读取已保存的图谱 RID 来加载已有图谱，而非每次重新生成——适合"给某业务对象持久化保存专属分析图谱"。
- **建议引用方式**：第 9 章 Cache 内容（7.2 Graph Expansion 缓存）处。措辞示例：
  > 图扩展结果可持久化复用：Foundry 的 Graph template 支持把已生成的图谱以 RID 形式存入对象属性，下次直接按 RID 加载而非重新遍历（Foundry Ontology 文档）。本书第 9 章的 Graph Expansion 缓存可借鉴这一"结果落盘 + 按引用加载"模式。
- **引用价值**：为本书第 9 章 Graph Cache 提供工业实现范式。

---

## 6. 第 6 章 Context Ranking / 第 7 章 Context Optimizer —— 按需索引与规模治理

### 引用点 PQ：Render hints——按需索引减负
- **笔记出处**：笔记一，批次 3b 第 56–58 篇 Metadata（第 374–377 行）。
- **原文要点**：
  - Render hints 告诉存储层和应用"这个属性该怎么被使用"（如 sortable 让应用知道可排序、Searchable 让属性可被过滤/排序/聚合）。
  - **很多 render hint 直接影响重建索引性能**——不需要被搜索/排序的属性，取消对应 render hint 可减轻索引负担、加快索引速度。
  - 硬约束：过滤、排序、聚合只能作用于开启了 Searchable render hint 的属性。
- **建议引用方式**：第 6 章 Token Cost 因子（7.7 节）或第 7 章优化目标处。措辞示例：
  > 不是所有属性都需要进入高成本的可搜索/可排序索引。Foundry 用 render hints 标记属性的用途，取消不需要的搜索/排序提示可显著减轻索引负担（Foundry Ontology 文档）。本书 Ranking 的 Token Cost 因子与之同构——价值接近时优先低 Token 对象，本质是"按需加载、按需索引"。
- **引用价值**：为本书"单位 Token 信息量最高"的优化目标提供更细的"按需索引"视角。

### 引用点 PR：Ontology volume 会比原始数据更大——精炼数据的快速访问后端
- **笔记出处**：笔记一，批次 2 第 12 篇"Ontology volume"（第 137–146 行）。
- **原文要点**：
  - Ontology volume 往往会比原始数据集体积更大（不可压缩 + 索引额外存储）。
  - 但 Ontology 设计初衷是作为"高度精炼数据"的**快速访问后端**，理想体积应显著小于原始/中间数据总量。
  - 控制要点：多少个 object type、每个类型多少对象、每个对象多少属性。
- **建议引用方式**：第 7 章优化目标（第 4 节）或第 9 章 Cache 指标处。措辞示例：
  > 精炼不等于小：Foundry 明确 Ontology volume 往往大于原始数据集（索引不可压缩），但作为"精炼数据的快速访问后端"应主动控制规模（Foundry Ontology 文档）。本书 Context Optimizer 的目标是"最大 Information Gain / Token Cost"而非"最少 Token"，正需要这种规模治理意识。
- **引用价值**：佐证本书第 7 章"不是最少 Token，而是最大信息量"的设计，并补充"精炼上下文需主动控制规模"的工程背景。

---

## 7. 第 8 章 Context Runtime / 第 13 章 Multi-Agent Context —— 沙箱与冲突解决

### 引用点 PS：Scenario 机制——沙箱 fork + 原子事务合并
- **笔记出处**：笔记三，Ontology scenarios（第 214–237 行，5 篇）+ 笔记四 Vertex Scenarios（第 128–133 行）+ Dynamic Scheduling（第 224 行）。
- **原文要点**：
  - Scenario 本质是对 Ontology 数据的一次"fork/分支"，通过应用一组 action 生成，核心用途是"what-if"假设分析。
  - **所有编辑只存在于隔离沙箱，不影响主 Ontology**；采纳结论时，"Apply scenario"把所有暂存编辑作为**单一事务(single transaction)**一次性提交（merge action）。
  - Scenario 一旦创建不可变，想"修改"需创建新场景或复制现有场景。
  - 单个场景最多 30,000 次编辑。
  - Dynamic Scheduling 明确：排程编辑默认走 Scenario 机制，"用户可自由试排、对比方案，不用担心误操作污染生产数据"。
  - 合并需在 action 的 Security & Submission Criteria 配置权限——"合并场景相当于一次性批量改动生产数据，权限收紧是必须的"。
- **建议引用方式**：第 8 章 Context Snapshot（第 6 节）或第 13 章 Context Version（第 8 节）处。措辞示例：
  > 上下文演化需要沙箱保护。Foundry 的 Scenario 机制把假设分析的所有编辑隔离在分支沙箱里，采纳时才作为单一事务原子提交到主 Ontology（Foundry Ontology 文档）。本书第 8 章的 Context Snapshot（Tool 执行前后快照）和第 13 章的 Context Version（v1→v2→v3 支持 Rollback/Replay）可借鉴这一"fork-验证-原子合并"模型。
- **引用价值**：**为本书第 8/13 章提供最直接的工业对应**——沙箱式上下文演化 + 原子事务提交。

### 引用点 PT：Action 的冲突解决策略——数据管道 vs 人工编辑共存
- **笔记出处**：笔记一，批次 4 第 62 篇 Action types Getting started（第 415 行）。
- **原文要点**：对象实例既可以被输入数据源更新，也可以被用户 Action 编辑更新——当同一对象（同一主键）同时收到两边数据时，系统需要一套**冲突解决策略**决定最终值以谁为准。
- **建议引用方式**：第 8 章 Context Merge（第 8 节）或第 13 章 Context Lock（第 9 节）处。措辞示例：
  > 多源更新的冲突解决必须显式设计。Foundry 的对象可同时被数据管道和用户 Action 编辑，平台提供冲突解决策略决定最终值（Foundry Ontology 文档）。本书第 8 章 Context Merge（Tool/Memory/Realtime/Retrieval 统一 Merge）和第 13 章 Context Lock（多 Agent 改同一对象的 Object Lock/Version Check/Merge Conflict）同样需要明确冲突策略，而非仅"统一 Merge"。
- **引用价值**：指出本书 Context Merge 设计需补充"冲突解决策略"的明确性。

---

## 8. 第 9 章 Context Cache —— 快照复用

### 引用点 PU：Ontology edit 的快照一致性复用
- **笔记出处**：笔记二，第 101 篇 Manage published functions（第 72 行）。
- **原文要点**：Function-backed action 一次运行中，所有读请求会**自动复用同一个 Ontology 快照**——保证同一次执行内多次查询看到的数据一致（不会中途数据变了导致前后矛盾），同时因复用快照，**读性能也提升**。
- **建议引用方式**：第 9 章 Cache 对象（第 4 节）或 Cache 层级处。措辞示例：
  > 执行粒度的上下文复用能同时提升一致性与性能。Foundry 的 function-backed action 在单次执行内自动复用同一 Ontology 快照，保证多次查询数据一致且读性能提升（Foundry Ontology 文档）。本书第 9 章的 Context Cache 在 L1（Memory）层可借鉴这一"单次执行共享快照"机制。
- **引用价值**：为本书第 9 章 L1 缓存提供"执行粒度快照复用"的工业实现。

---

## 9. 第 10 章 Context Observability —— 行为建模与错误分类

### 引用点 PV：Action log——把行为建模为可分析对象
- **笔记出处**：笔记一，批次 4 第 93 篇 Action log（第 550–553 行）。
- **原文要点**：
  - Action log 把每一次 action 提交都建模成 object type，方便用 Ontology 感知工具分析、展示、作为下游决策工作流输入。
  - 所有 action log 的 object type 名字以 `[LOG]` 前缀标注，和对应 action type 一一对应。
  - 若需"记录某对象所有历史编辑"的更细粒度需求，应用对象类型的 edit history 功能而非 action log。
- **建议引用方式**：第 10 章 Trace Pipeline（第 5 节）处。措辞示例：
  > 可观测的最高形式是把行为本身建模为对象。Foundry 把每次 action 提交建模为 `[LOG]` 前缀的 object type，供 Ontology 工具分析与下游消费（Foundry Ontology 文档）。本书第 10 章 Context Trace 不仅能记录日志，还可把"对象为何进入 Prompt"的决策本身建模为可查询对象。
- **引用价值**：为本书第 10 章"可解释 Context"提供"行为建模为对象"的深化思路。

### 引用点 PW：user-facing vs non-user-facing 错误区分
- **笔记出处**：笔记二，第 103 篇 Function monitoring（第 88–89 行）+ 第 116 篇 User-facing errors（第 180–181 行）。
- **原文要点**：
  - Function 有四种监控规则，特别区分"user-facing errors（函数代码主动抛出的用户可见错误）"vs"non-user-facing errors（基础设施/系统级故障）"。
  - 可分别设不同告警策略和 responsible 团队——业务逻辑问题归业务团队，平台问题归平台团队。
  - 主动抛 `UserFacingError` 的失败被归为"用户可见错误"，可单独统计告警，和系统性错误分开。
- **建议引用方式**：第 10 章 RCA / 失败归因处。措辞示例：
  > 失败归因应区分业务错误与系统错误。Foundry 的 Function 监控把用户可见错误（业务逻辑问题）与非用户可见错误（基础设施故障）分开统计，分别告警给不同团队（Foundry Ontology 文档）。本书第 10 章 RCA 的七源归因可借鉴这一二分，避免把"检索逻辑错误"和"存储故障"混为一谈。
- **引用价值**：为本书第 10 章 RCA 提供错误分类的工业实践，与 `citations.md` 引用点 Z（七源归因）互补。

### 引用点 PX：Viewing usage——破坏性变更前看影响面
- **笔记出处**：笔记四，第 238 篇 Viewing usage（第 28–33 行）。
- **原文要点**：
  - 帮你在对 Ontology 做改动前先看"这个改动会影响多大范围"，更安全评估破坏性变更影响面。
  - Reads 统计：一次"加载对象"请求记一次读，**一次批量加载大量对象/聚合只算单次读**；Ontology Manager 自身使用不计入。
  - Writes 统计：Action/Function/Form/直接编辑/API 调用产生的编辑都算一次写，批量编辑也算单次写。
  - 两个入口：Overview 标签页（近 30 天高层次汇总）+ 独立 Usage 标签页（详细到谁在何时通过哪个应用使用）。
- **建议引用方式**：第 10 章 Trace 或第 2 章 Schema 演进处。措辞示例：
  > 可观测性不止于单次 Context 生成，还应覆盖 Ontology 变更的影响面。Foundry 的 Viewing usage 在改动前展示近 30 天的读写统计，帮助评估破坏性变更影响（Foundry Ontry 文档）。本书第 10 章 Trace 侧重"对象为何进入 Prompt"，可补充"Ontology 变更影响了多少下游 Context"这一变更管理维度。
- **引用价值**：为本书第 10 章补充"变更影响面可观测"维度。

---

## 10. 第 11/12 章 Research/Business Context / 第 14 章 Roadmap —— 产品化与协作

### 引用点 PY：Marketplace 产品化——Ontology 类型/Action/函数打包分发
- **笔记出处**：笔记一第 60 篇（第 393–397 行）+ 笔记一第 94 篇（第 556–558 行）+ 笔记二第 102 篇（第 80–83 行）。
- **原文要点**：
  - 通过 Foundry DevOps 可把 object type、action type、function、Object View 打包进 Marketplace 产品供其他环境安装复用。
  - 关键约束：submission criteria 不能引用具体用户（要改引用群组），否则装到别的环境权限规则失效；**对象实例本身不能被打包**（只能打包类型定义+数据集，安装后重新生成对象）；打包 action type 时推荐关联 link type 一并加入。
  - 源码可见性差异：TypeScript v1 函数不带可见源码，Python/TS v2 带可见源码（但生产模式安装后不可编辑）。
- **建议引用方式**：第 11 章 Context Plugin Marketplace 或第 14 章 Context Marketplace 处。措辞示例：
  > 插件化分发在工业上已被验证可行。Foundry 的 Marketplace 可把 Ontology 类型、Action、函数打包分发，但有明确工程约束：权限规则不能绑死具体用户（须改引用群组）、对象实例不可打包（只能打包定义后重新生成）（Foundry Ontology 文档）。本书第 11 章的 Domain Context Plugin 与第 14 章 Context Marketplace 需遵循同样的"定义可分发、实例不可分发、权限可移植"纪律。
- **引用价值**：**为本书第 11/14 章插件化分发提供工业验证和具体工程约束**。

### 引用点 PZ：Shared Ontology——多组织协作
- **笔记出处**：笔记一，批次 2 第 10 篇 Shared ontologies（第 122–126 行）。
- **原文要点**：Shared ontology 允许多个组织在同一套共享工作流下协作，存在于专门 shared space 之下，继承组织标记(organization markings)与角色授权(role grants)。使用场景：与客户或合作方在同一套本体上协作（联合建模、联合数据交换）。
- **建议引用方式**：第 13 章或第 14 章 Context Federation 处。措辞示例：
  > 跨组织共享知识需要独立的共享机制。Foundry 的 Shared Ontology 在专门 space 下承载多组织协作，继承组织标记与角色授权（Foundry Ontology 文档）。本书第 13 章"Context 才是共享资产，Agent 只是执行者"与第 14 章 Context Federation 可借鉴这一"共享空间 + 标记继承"模式。
- **引用价值**：佐证本书第 13 章共享 Context 和第 14 章 Federation 的设计。

---

## 11. 第 14 章 Evolution Roadmap —— 权限演进与模型接入

### 引用点 PAA：权限模型三代演进 + 两层授权
- **笔记出处**：笔记四，第 239–240 篇（第 36–54 行）+ Object permissioning（第 256–262 行）。
- **原文要点**：
  - 演进路径：数据源派生权限（最早）→ Ontology roles（2023 年 9 月起默认）→ 项目权限（当前最新，统一进 Compass 体系）。
  - 核心收益：统一心智模型、批量管理、权限可解释性、更细隐私控制。
  - **两层授权**：Ontology resources 层（类型定义：display name/属性名/类型/描述）和 Objects and links 层（数据实例：主键和属性值）**分开管理**——"能改类型定义"和"能看到具体数据"是两件独立的事。
  - 迁移单向不可逆。
- **建议引用方式**：第 2 章 Policy 模型或第 0 章原则 4 处。措辞示例：
  > 权限应分层管理。Foundry 把 Ontology 资源权限（类型定义）与对象实例权限（数据）分为两层独立管理，并经历了"数据源派生→Ontology roles→项目权限"三代演进，核心收益是统一心智与权限可解释性（Foundry Ontology 文档）。本书第 2 章 Policy 作为"输出约束"与第 6 章 Permission 作为"直接过滤而非降分"，遵循同一分层思路。
- **引用价值**：佐证本书第 0 章原则 4"Policy 是硬约束"和第 2 章 Policy 设计。

### 引用点 PBB：Object and property security policies——cell-level 安全
- **笔记出处**：笔记四，Object permissioning（第 262 行）。
- **原文要点**：
  - 可直接在 object type 上配置对象实例级和属性值级的 **cell-level（单元格级）安全**，独立于背后数据源权限。
  - 相对 Restricted View 方案的优势：配置更简单（直接在 object type 上配）、策略变更近乎实时生效（RV 方式改权限需重建整条管道）、支持流式数据源（RV 做不到给流式对象加行/列级权限）。
- **建议引用方式**：第 6 章 Permission 因子（7.5 节）处。措辞示例：
  > 权限检查应到属性粒度。Foundry 支持 object type 上的 cell-level 安全（对象实例级 + 属性值级），独立于数据源权限且近乎实时生效（Foundry Ontology 文档）。本书第 6 章 Permission 因子（无权限直接过滤而非降分）可深化为对象级与属性级两层检查。
- **引用价值**：深化本书第 6 章 Permission 的粒度设计。

### 引用点 PCC：Function interface——模型接入标准化
- **笔记出处**：笔记二，第 149 篇 Function interfaces（第 406–412 行）。
- **原文要点**：
  - Function interface 描述"函数应该长什么样"的契约（输入/输出/错误类型），本身不是函数而是给别的函数"实现"的规范。
  - 最直接案例：AIP Logic 的"Use LLM"模块依赖 Foundry 提供的 chat completion function interface；用户注册的模型本质就是"实现了该接口的函数"。
  - 实操模式：用 `@ExternalSystems({sources: [...]})` 声明外部 source + `@ChatCompletion()` 装饰器，函数签名接收标准化消息列表和补全参数、返回标准化结果——"把自建模型包一层 OpenAI 兼容适配器注册成平台 LLM"的现成模板。
- **建议引用方式**：第 14 章技术路线或第 4 章 Tool Retriever 处。措辞示例：
  > 模型与工具的接入应标准化为契约。Foundry 的 Function interface 让用户通过实现 chat completion 接口把自建模型注册为平台可用的 LLM，几乎就是"包一层 OpenAI 兼容适配器"的现成模板（Foundry Ontology 文档）。本书"Agent 不直接访问数据源、统一从 Context Engine 获取"的抽象层设计，可借鉴这一"接口契约 + 多实现"模式。
- **引用价值**：为本书第 4 章 Tool Retriever 和第 14 章平台结合提供"模型/工具接入标准化"的工业范式。

---

## 12. 引用纪律（与"不编造"红线一致）

1. **标注来源**：所有引用均标注笔记文件与篇目编号（如"笔记一，批次 3a 第 33 篇"），可回溯到 Foundry 官方文档原始 URL（笔记每篇均附 URL）。
2. **区分平台演进**：Foundry 文档含大量 OSv1/OSv2、Legacy/新版、Beta/转正的演进信息，引用时须保留版本限定（如"OSv2 独有""Legacy 机制"），不暗示当前状态。
3. **保留官方限定**：如 Foundry 自己标注"功能仍在开发中""官方已不推荐""处于 sunset 阶段"的，引用时必须带出，不为增强说服力而删去。
4. **不外推**：笔记中标注"未能独立检索到完整正文""基于邻近页面整合"的内容，引用时须注明"据 Foundry 文档推断"，不当作已核实事实。
5. **机制而非数字**：与 `citations.md`（学术引用，重数字）不同，本文档引用的是**工程机制与设计模式**，引用时聚焦"Foundry 是怎么做的"而非"效果提升多少"，避免把平台文档的定性描述量化。

---

## 13. 优先级建议（若只引几条，先引这些）

- **🔴 必引（直接补强核心章节）**：
  - 引用点 **PI**（Ontology 设计反模式清单，第 3 章）——补强 Knowledge Builder 最缺的质量治理与踩坑警示。
  - 引用点 **PA**（Ontology = 决策而非数据，第 0/1 章）——背书全书核心定位。
  - 引用点 **PO**（Search Around 函数，第 5 章）——补强"自定义图扩展"的工程实现。
  - 引用点 **PS**（Scenario 沙箱 + 原子合并，第 8/13 章）——补强 Context Snapshot/Version 的工业对应。

- **🟡 强烈建议（章节级补强）**：
  - 引用点 **PD**（Object/Property/Link/Action 类型体系，第 2 章）。
  - 引用点 **PE**（Derived Property"每个事实只存一份"，第 5/7 章）。
  - 引用点 **PL**（语义搜索流程，第 4 章）。
  - 引用点 **PM**（查询预处理，第 4 章）。
  - 引用点 **PU**（快照一致性复用，第 9 章）。
  - 引用点 **PV**（Action log 行为建模，第 10 章）。
  - 引用点 **PY**（Marketplace 产品化，第 11/14 章）。

- **🟢 按需引用（深化与前瞻）**：
  - 引用点 **PF**（Value Type 校验集中治理，第 2/3 章）。
  - 引用点 **PG**（Interface 多态/插件，第 11/12 章）。
  - 引用点 **PH**（Schema 编辑迁移，第 2/3 章）。
  - 引用点 **PQ**（Render hints 按需索引，第 6/7 章）。
  - 引用点 **PT**（冲突解决策略，第 8/13 章）。
  - 引用点 **PAA/PBB**（权限演进 + cell-level 安全，第 2/6/14 章）。
  - 引用点 **PCC**（Function interface 模型接入，第 4/14 章）。

---

*本文档所有引用点均核对自 `reference/palantir_ontology_notes_1.md`～`palantir_ontology_notes_4.md`（四份学习笔记，共 378 篇，覆盖 Foundry Ontology 文档导航树全部内容）。每篇笔记均附 Foundry 官方文档原始 URL，可按篇目编号回溯核实。*
