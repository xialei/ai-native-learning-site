# Palantir Foundry — Ontology 文档学习笔记

> 数据来源:https://www.palantir.com/docs/foundry/ontology/overview/ 及其左侧导航下的各子页面
> 说明:该导航树覆盖 **Ontology building** 整个大类,实际子页面超过 300 个(含 Ontologies、Object/Link types、Action types、Functions、Interfaces、Ontology search、Ontology scenarios,以及应用层 Object Explorer / Object Views / Ontology Manager / Vertex / Machinery / Foundry Rules / Map / Dynamic Scheduling,再加上 Ontology architecture 后端部分)。因为工具限制(每个新页面必须先被搜索"命中"过才能抓取),全部读完工作量极大,采用**分批抓取、持续追加**的方式进行。本文件会在后续对话中不断更新,你可以把它当作一份不断增厚的学习讲义。

## 进度追踪

- [x] 批次1:Ontology building 总览(5篇)✅ 已完成
- [x] 批次2:Ontologies(分支/共享/迁移/用量,约10篇)✅ 已完成
- [x] 批次3a:Types reference / Object types / Properties(18篇)✅ 已完成
- [x] 批次3b:Structs / Shared properties / Link types / Value types / Metadata / Object type groups / Marketplace(27篇)✅ 已完成 —— **Object and link types 大类(45篇)全部完成**
- [x] 批次4:Action types(约34篇)✅ 已完成
- [ ] 批次5:Functions(约68篇,篇幅最大)
- [ ] 批次6:Interfaces(约9篇)
- [ ] 批次7:Ontology 设计三篇(最佳实践/结构指南/反模式)+ Ontology search(semantic search 等,约8篇)+ Ontology scenarios(5篇)
- [ ] 批次8:应用层 — Object Explorer / Object Monitors / Object Views(约50篇)
- [ ] 批次9:应用层 — Ontology Manager / Vertex / Machinery(约30篇)
- [ ] 批次10:应用层 — Foundry Rules / Map / Dynamic Scheduling(约80篇,篇幅很大)
- [ ] 批次11:Ontology architecture 后端(权限/索引/写入落地/对象数据库,约20篇)

---

## 批次1:Ontology building 总览

### 1. Overview(总览)
https://www.palantir.com/docs/foundry/ontology/overview/

- **Ontology 是什么**:Palantir 的 Ontology 是组织的"运营层"(operational layer)。它架在 Foundry 已集成的数字资产(datasets、virtual tables、models)之上,把这些资产和现实世界的对应物连接起来——既包括物理资产(工厂、设备、产品),也包括抽象概念(客户订单、财务交易)。
- 在很多场景下,Ontology 相当于组织的**数字孪生(digital twin)**,同时包含:
  - **语义元素(semantic elements)**:objects(对象)、properties(属性)、links(链接)
  - **动态元素(kinetic elements)**:actions(动作)、functions(函数)、动态安全策略
- **四大组成部分**:
  1. **Object & Link types**:把数据源映射为对象、属性、链接,不只是数据编目/建模,还带有完整的元数据、细粒度安全与治理。
  2. **Action types & Functions**:承载组织的"动态"部分——action types 捕获操作员输入或编排决策流程;functions 用于编写和演进任意复杂度的业务逻辑。
  3. **Interfaces**:描述对象类型的"形状"与能力,提供对象类型的多态性,便于统一建模和交互具有相同结构的多个对象类型。
  4. **应用层**:Ontology 深度集成进 Object Views、Object Explorer、Quiver、Workshop 等分析/操作工具,目标是支撑组织范围内更好的决策。

### 2. Why create an Ontology?(为什么要建 Ontology)
https://www.palantir.com/docs/foundry/ontology/why-ontology/

- 核心定位:Ontology 是让客户安全、可靠、有效地在企业中使用 AI、驱动运营转型的**核心系统**。
- 关键论点:**Ontology 代表的是企业中的"决策"(decisions),而不仅仅是"数据"(data)**。
- 对比传统架构:传统数据架构不会捕捉决策背后的推理过程和随之而来的行动,因而限制了学习与 AI 的融入;传统分析架构的计算脱离真实运营场景。
- Ontology 的价值:
  - 让新数据能快速整合进一个高保真的语义表示中;
  - 让新的算法/业务逻辑能无缝地暴露给人类和 AI 用户使用;
  - 通过与全范围运营系统的实时连接,实现稳健的"动作集成"(action integration)。
  - 每个组织的 Ontology 是团队间不断变化的条件、目标、决策的实时表示,从而保证 AI 的使用始终锚定在企业的真实情况中。
- 延伸阅读方向:Ontology 的"决策中心"架构、Ontology SDK 提供的可扩展性、支持零停机变更的 Global Branching 框架。

### 3. Models in the Ontology(模型如何接入 Ontology)
https://www.palantir.com/docs/foundry/ontology/models/

- 讲的是如何把 AI/ML 模型"运营化"到 Ontology 里做实时推理(live inference),端到端步骤:
  1. 在 Foundry 中创建模型;
  2. 配置一次 direct model deployment(直接模型部署);
  3. 发布一个简单的 wrapper function 包装模型,也可以在其他 function 里调用它来编排更复杂的逻辑;
  4. 在 Workshop、Vertex 等面向终端用户的应用中使用该 function 做实时推理。
- 也支持**批量推理**:用模型给数据集打标签,再让 Ontology 对象绑定这些数据集(batch inference)。
- **把模型接入 Ontology 的好处**:
  - **可解释性(Interpretability)**:建模结果最终都表达为真实世界概念(对象类型的属性),终端用户不需要懂机器学习,只需要理解"预测值/评分/分类"这类简单概念。
  - **规模经济(Economies of scale)**:不同用例可以复用同一个建模成果(例如一个用例产出的预测可直接被后续用例使用),减少重复劳动。
  - **规模化连接(Connectivity at scale)**:借助 Ontology 统一接入更多模型能力(原文此处被截断,大意是模型可以方便地和 Ontology 中其它对象、动作打通)。

### 4. Core concepts(核心概念)
https://www.palantir.com/docs/foundry/ontology/core-concepts/

这是最重要的一篇,建立了 Ontology 的基本词汇表:

- **Ontology = 对世界的分类(categorization of the world)**,是组织的数字孪生,把数据集和模型映射为 object types、properties、link types、action types。
- 核心概念与"数据集"的类比关系(便于快速上手):
  | Ontology 概念 | 数据集类比 |
  |---|---|
  | Object type(对象类型) | 相当于一张数据集/表 |
  | Object(对象) | 相当于表里的一行(row) |
  | Property(属性) | 相当于表的一列(column) |
  | Property value(属性值) | 相当于单元格的值 |
  | Link(链接) | 相当于表之间的 join 关系 |
- **四个核心类型定义**:
  - **Object type**:定义组织中的一个实体或事件。
  - **Property**:定义 object type 的特征字段。
  - **Link type**:定义两个 object type 之间的关系(schema 层面);一个 link 是这个关系的一次具体实例。
  - **Action type**:定义对象/属性值/链接可以被如何修改的 schema,同时包含提交动作时触发的副作用(side effects)。配置好 action type 后,终端用户即可通过"应用 action"来修改对象。
- **Roles(角色)**:Ontology 的核心权限模型,类似 Foundry 文件系统里的角色,可以在整个 Ontology 层级或单个资源层级授予。

### 5. Ontology-aware applications(基于 Ontology 的应用)
https://www.palantir.com/docs/foundry/ontology/applications/

Foundry 内置了一批原生构建在 Ontology 之上的应用,共同构成分析与操作平台。本页是各应用的功能定位速查表:

- **Object Explorer**:面向"Ontology 里任何东西"的搜索与分析工具。可视化拼装搜索条件(从简单过滤到 Search Arounds),浏览/对比对象集,对对象集批量执行 Action(如批量写回),导出结果或在 Workshop 等兼容应用中打开。**无需预配置**,面向技术门槛较低的用户。
- **Object Views**:围绕"某一个对象"的信息与工作流中心枢纽——展示该对象的"基本信息"(如 Airport 对象类型可能展示国家/城市/经纬度)、关联对象、关键指标,以及嵌入的分析/看板/应用入口。
- **Quiver**:通过可视化点选界面 + 图表库,支持时间序列和对象数据的分析,从简单的线性下钻分析到更复杂的分析工作流都能支持。
- **Workshop**:面向广泛用户群体的低代码/无代码 + 完全自定义代码组件的应用搭建工具,可充分利用 Ontology 的对象与动作,实现深度交互、定制化体验和运营实效。
- **Slate**:允许应用构建者用 HTML/CSS/JavaScript 完全自定义、快速搭建动态应用,并与 Ontology 无缝集成(可以看到对象与动作之间的关联关系)。
- **Fusion**:Foundry 内置的电子表格应用,可直接查询 Foundry 数据集、用标准表格函数分析数据,并可将结果**写回** Foundry。
- **Vertex**:用于可视化和量化组织"数字孪生"中的因果关系,构建/整理/发布图谱供组织内复用。

---

## 批次2:Ontologies(分支 / 共享 / 迁移 / 用量与限制)

### 6. Ontologies — Overview(Ontology 资源总览)
https://www.palantir.com/docs/foundry/ontologies/ontologies-overview/

- Ontology 里的各类资源(object types、link types、action types 等)统称为 **Ontology resources**。
- 一个 Ontology 可以是**私有的**(归属单一组织),也可以是**共享的**(多个组织共用)。
- **Ontology 与 Space 是 1:1 映射关系**:新建一个 space 时,会自动同步创建一个同名、带相同组织标记(organization markings)的 Ontology。私有 space ↔ 私有 Ontology;共享 space ↔ 共享 Ontology。

### 7-9. Branching the ontology(Ontology 的分支管理:总览 / 审核提案 / 旧版分支)
https://www.palantir.com/docs/foundry/ontologies/branching-ontology/ 、 review-ontology-proposals/ 、 ontology-branches-legacy/

- Ontology 集成了 Foundry 的 **Global Branching(全局分支)**机制,以支持 Ontology 资源的安全隔离开发。
- 关键概念:**Ontology proposal(Ontology 提案)**——当你在一个包含 Ontology 变更的全局分支上创建 Proposal 时,系统会自动创建一个 Ontology proposal 来专门追踪本体相关的变更(评审人、名称、描述等元数据)。
- **受保护资源(protected resources)**:修改受保护资源时,原本的 "Save" 对话框会被替换成 "Create and save to branch",强制你必须先保存到分支。
- **Rebase(变基)**:如果你的分支没有触及 Ontology,rebase 会自动发生;一旦分支引入了 Ontology 变更(哪怕只是给某个 object type 建索引),就必须**手动 rebase** 来同步 main 分支上其他人引入的最新变更(侧边栏会有蓝色提示)。
- **审核 Ontology 提案**:提案类似代码评审里的 Pull Request,分为「我的提案 / 已合并提案 / 已关闭提案」三个视图;每个提案有 Overview、Preview status、Review changes、Changelog 四个标签页,合并 Ontology 提案本质上是合并对应的 Global Branching 提案。
- **⚠️ Ontology branches [Legacy](旧版机制,正在淘汰)**:旧版"Ontology proposals/branches"机制正在被 sunset。**开通了 Global Branching 的环境将无法再创建旧版 Ontology 分支**,必须改用 Global Branch 来修改 Ontology(好处是可以连带分支数据源、在下游应用中测试变更、统一管理数据和 Ontology 修改)。旧版分支需要项目 editor 权限才能创建,五步走的工作流(创建分支 → 修改 → 提案 → 评审 → 合并)。
  - **实践提示**:如果你的环境还在用旧版 Ontology branches,建议关注是否已开通 Global Branching 并尽快迁移工作流,避免后续被强制切换打断节奏。

### 10. Shared ontologies(共享 Ontology)
https://www.palantir.com/docs/foundry/ontologies/shared-ontologies/

- **Shared ontology(共享本体)**是一种特殊类型的 Ontology,允许**多个组织**在同一个共享工作流下协作,与"私有 Ontology"(只包含单一组织的资源)相对。
- 共享 Ontology 存在于专门为该工作流创建的 **shared space** 之下,当新的 shared space 被创建时会自动同步创建对应的共享 Ontology,并继承该 space 的组织标记(organization markings)与角色授权(role grants)。
- 使用场景联想:如果你未来要和客户或合作方在同一套本体上协作(比如联合建模、联合数据交换),这是关键机制。

### 11. Migrating between ontologies(跨 Ontology 迁移资源)
https://www.palantir.com/docs/foundry/ontologies/ontology-migration/

- 每个 Ontology 资源在创建时会自动关联到所属的 Ontology,但**创建后可以被迁移到别的 Ontology**。
- 迁移资源会**改变该资源的权限**,但**不会影响底层数据/输入数据源本身的权限**。
- 迁移对象时,默认**保留所有已有的编辑记录(edits)**。
- 操作步骤:在 Ontology Manager 右上角的 Ontology switcher 里定位到资源所属的源 Ontology → 选择 "Migrate resources" → 在下拉菜单选目标 Ontology → 勾选要迁移的 object types / link types / action types / workflows → 预览左右两侧(源/目标)的资源对比。
- **限制**:object type 不能从私有 Ontology 迁移到 default ontology,除非它最初就是在 default ontology 里创建的;迁移时必须把相互关联的资源**打包一起迁移**,否则因为依赖缺失会迁移失败。

### 12. Ontology volume(Ontology 存储用量)
https://www.palantir.com/docs/foundry/ontologies/volume-usage/

- **Ontology volume** = 已索引对象集及其相互链接的**总大小**,单位是 GB(瞬时)/ GB-Month(月度平均);Foundry 每小时采样一次,再做时间段内的平均。
- **驱动因素**:
  - **对象数量**:Foundry 的 Ontology 层单个 object type 最多可扩展到**数十亿**个对象,volume 与对象数直接相关;
  - **对象属性大小**:每个属性可以是任意大小,总索引大小 = 该 object type 下每个对象的每个已索引属性大小之和;
  - **多对多关系的 join 表**:多对多链接需要额外定义 join 表来记录对象间基于主键的链接关系,这些表也会被索引并占用 volume,通常按记录数线性增长。
- **⚠️ 重要提醒**:Ontology volume 往往会**比原始数据集体积更大**,因为 Ontology 数据不能被压缩,而且索引本身需要额外存储空间来实现更快查询。
- **最佳实践**:Ontology 设计初衷是作为"高度精炼数据"的**快速访问后端**,理想情况下它的体积应该显著小于 Foundry 转换管道里的原始/中间数据总量。要控制 volume,重点关注:Ontology 里定义了多少个 object type、每个 object type 有多少对象、每个对象有多少属性。

### 13. Ontology indexing compute(索引计算成本)
https://www.palantir.com/docs/foundry/ontologies/compute-usage/

- **索引(indexing)** = 把 Foundry 数据集里任意大小/格式的数据,转换为 Ontology 后端可以快速存储、搜索、编辑的格式,这个转换过程用的是**并行化的 Spark 后端**。
- 计算成本以 **compute-seconds** 计量,由「计算资源(driver + executors)的量」×「索引作业的总墙钟时长」决定。
- 影响索引计算量的因素:
  - **对象数量**:数据集记录数越多,需要索引的对象越多;
  - **属性数量**:每个对象的每个属性都要单独分析并写入索引,属性越多计算量越大;
  - **属性大小**:比如一个内容很长的文本属性,分析和索引所需的空间/计算量远大于简单标量属性。

### 14. Ontology query compute(查询计算成本)
https://www.palantir.com/docs/foundry/ontologies/query-compute-usage/

- 查询产生的 compute 归属规则:一般情况下,**compute 归属于发起查询的资源**(比如某个 Workshop 模块、某次 Object Explorer 检索)。
- 通过 Object Explorer、Workshop、Quiver 等应用对 Ontology 发起的 "query type" 查询都会消耗 compute-seconds,由两部分组成:
  1. 一个**固定的最小查询开销**;
  2. 一个**随实际计算量线性增长**的部分。
- **OSv1(Phonograph)的查询优化**:数据分布式存储在多个索引中,查询引擎通过遍历索引来"剪枝"(pruning)——避免处理大片无关数据,能够在数十亿条记录里只需评估其中约 1/1000 的记录量就完成搜索。

### 15. Object Set Service (OSS) 相关限制(对应原页面 oss-limitations)
https://www.palantir.com/docs/foundry/ontologies/oss-limitations/

> 说明:该原始页面未能直接检索到完整正文,以下是从相邻权威文档(Functions 强制限制、Aggregation considerations、Load Object Set API 文档)中整理出的**关于 OSS 读取限制**的关键要点,可作为该页内容的实用替代:

- **OSv1(Phonograph)分页限制**:Load Object Set 接口对 OSv1 支持的对象最多返回 **10,000 个对象**;超过后再翻页会报 `ObjectsExceededLimit` 错误。**OSv2 没有这个限制**——这是 Roger 你评估存量 Ontology 是否该迁移到 OSv2 时的一个直接依据。
- **Functions 里读取 Object Set 的限制**:调用 `.all()` / `.allAsync()` 一次性加载超过 **100,000** 个对象会直接报错;即使是加载"几万个"对象,也大概率会撞到时间限制或内存限制。建议改用聚合(aggregation)取摘要数据,或用排序 + limit 只取子集。
- **Action 批量编辑上限**:单次 Action 默认最多编辑 **10,000 个对象**(如需更高上限需联系 Palantir Support 申请变更)。
- **聚合结果可能不精确(inexact aggregations)**:在高基数(high cardinality)场景下,Object Explorer / Workshop 默认走 `PREFER_SPEED` 模式,聚合结果可能不准确(例如降序排列的 Top-N 分桶顺序不对);API 层可以显式传 `AggregationExecutionMode = PREFER_ACCURACY` 换取更准的结果(但更慢),响应里也会带 `AggregateResultAccuracy` 字段标明结果是否精确。

---

## 批次3a:Object and link types — Types reference / Object types / Properties(18篇)

### 16. Types reference(类型总览)
https://www.palantir.com/docs/foundry/object-link-types/type-reference/

- Foundry 里的"类型"分两大类:
  - **Ontology types(本体类型)**:用于把现实世界建模进 Ontology,包括 object type、property、link type、object type group、interface。
  - **Data types(数据类型)**:用于表示具体的数据值,设计上借鉴了 RDF、OWL、XSD 里的概念。
- 关键区分(容易混淆的一点,建议牢记):
  - **"Object type definition"(类型定义/元数据)** ≠ **"Object"(对象实例)**。前者是 schema 层信息(display name、属性名、属性数据类型、描述等),后者是某个具体实例的主键和属性取值。这个区分同样适用于 link type / link。

### 17-19. Object types — Overview / Create / Edit
https://www.palantir.com/docs/foundry/object-link-types/object-types-overview/ 、 create-object-type/ 、 edit-object-type/

- **Object type = 现实世界实体或事件的 schema 定义**;Object(对象实例)= 该类型的一个具体实例(如 "Melissa Chang" 是 Employee 的一个对象);多个对象的集合叫 **object set**(如"所有已转正员工")。
- **创建流程**(推荐用引导式 helper):选择已有数据源(自动映射列→属性)或不选(需要 OSv2 才能"先建对象类型、后接数据");**每个 object type 必须至少有一个属性作为主键(primary key)**;主键的值在数据源每一行必须唯一。
- **注意**:单个数据源**只能背靠一个 object type**;数据源不能包含 `MapType` 或 `StructType` 列(要用别的机制处理结构化字段,见后面 Structs)。
- **编辑 object type 的"破坏性变更"警告**(这个非常重要,建议团队内部做检查清单):以下改动会导致该 object type 的底层数据源被**注销并重新注册(reregister)**,期间该类型的所有对象在用户应用里**不可用**,直到重新索引完成:
  1. 更换 object type 的 backing datasource;
  2. 更改 primary key;
  3. 删除 object type。
  - 更换数据源时,只有新旧数据源 schema 完全一致才会自动重映射属性,否则要手动重新映射。
  - **状态为 active 的 object type 不能被删除**(需要先降级状态)。
  - 常见报错:`Phonograph2:FoundryColumnNameNotFound`(数据源里的列被删,但属性还没解除映射)、`Phonograph2:InvalidColumnRemoval`(删除了已经产生过编辑记录的列——要么把列加回来,要么整个 object type 注销重注册)。
  - 但改**显示名、render hint、type class、visibility**这类"纯元数据"层面的东西,即使属性已经有编辑记录,也**不需要**注销重注册。

### 20-21. Enable Gotham integration / Create Ontology objects from Gaia
https://www.palantir.com/docs/foundry/object-link-types/enable-gotham-integration/ 、 create-ontology-objects-from-gaia/

> 这两篇偏 Gotham(政府/国防线产品)对接,和你目前的商业 AI 平台场景关联度较低,这里只做简要记录:

- **Gotham 集成**通过"Type mapping"机制,在 Ontology Manager 里把 Foundry 的 object type 映射为 Gotham 里的对象(Parent category 分 Entity/Event/Document 三类),属性可以选择"共享"或"克隆"进 Gotham 本体;未映射的属性默认不会同步过去。
- 如果环境里有 **Map Rendering Service (MRS)**,可以跳过 type mapping,直接在 Gaia(Gotham 的地图应用)里创建/关联 Ontology 对象。

### 22. Object types — Metadata reference
https://www.palantir.com/docs/foundry/object-link-types/object-type-metadata/

Object type 的元数据字段一览(和 Properties 的 metadata reference 结构类似,建议对照记忆):
- **ID / RID**:逻辑标识符 / Foundry 自动生成的资源唯一标识符(会出现在错误信息里)。
- **Icon**:用户应用里展示该类型对象时用的图标+颜色。
- **Display name / Plural display name**:单数/复数显示名(如 "Employee" / "Employees")。
- **Description**:说明文字。
- **Groups**:给 object type 打标签分组,便于后续在庞大 Ontology 里过滤查找(**取代了旧版"给主键属性挂 `oe_home_page_object_type_group` type class"的方法**——如果你的团队还在用旧方法,值得借这次学习顺手迁移)。
- **API name**:代码里引用该类型的编程名。
- **Visibility**:normal / prominent(优先展示)/ hidden(不在用户应用中出现)。
- **Status**:active / experimental / deprecated(下一节"Metadata"分组里的 Statuses 页会展开讲)。

### 23. Properties — Overview
https://www.palantir.com/docs/foundry/object-link-types/properties-overview/

- **Property(属性)= object type 某个特征的 schema 定义**;**property value(属性值)= 某个具体对象在该属性上的取值**。
- 类比数据集:property ≈ 数据集的一列(column),property value ≈ 某一行某一列的具体单元格值(field)。

### 24. Edit object type properties(编辑属性)
https://www.palantir.com/docs/foundry/object-link-types/edit-properties/

- 属性编辑面板分四个配置区:**显示名/描述、Status(deprecated/experimental/active)、API name(active 状态下不可改)、Keys(是否为 primary key / title key,active 状态下 primary key 不可改)**。
- 还可以配置:**base type(基础类型,要和底层列类型兼容,改了 base type 需要同步更新使用该属性的 Action 里的类型预期)、type classes、render hints(勾选后影响索引/重建索引性能)、visibility、value formatting**。
- **删除属性**:仅在保存后生效,会破坏引用它的视图/应用;**active 状态属性不能删除**。
- **解除映射(unlink)**属性后可以重新映射到新列。
- 可以按住 Cmd/Ctrl 多选属性做批量编辑。

### 25-26. Add value formatting / Add conditional formatting(展示层格式化)
https://www.palantir.com/docs/foundry/object-link-types/value-formatting/ 、 conditional-formatting/

- **Value formatting(取值格式化)**:把属性的原始值转成更易读的展示形式,不改变底层数据本身。支持数值格式化(如加单位 "kg"、压缩显示 "$100K")、日期时间格式化(含"相对当前时间"展示,超过24小时自动切回具体日期)、时区指定、Multipass 用户/组 ID → 显示姓名/组名 的转换。
- **Conditional formatting(条件格式化)**:给属性配置"取值满足什么条件 → 渲染成什么样式(颜色/对齐等)"的规则,在 Object Explorer、Object Views、Quiver、Workshop 里**全局生效**。规则可以在属性间复制(复制后仍引用原属性,需要手动改引用目标)。**条件格式化的优先级高于 type class 的默认展示**(有一个例外)。
- 这两者都是在 **Ontology Manager 里全局配置一次、所有下游应用统一生效**;而 Workshop 里也有一套"局部"的 value/conditional formatting,只在该 Workshop 模块内生效,不影响全局 Ontology 配置——**这个"全局 vs 局部"的区分在你排查"同一个属性在不同应用里显示不一致"问题时很关键**。

### 27. Properties — Metadata reference
https://www.palantir.com/docs/foundry/object-link-types/property-metadata/

属性的元数据字段一览:
- **ID / RID**、**Status**(active/experimental/deprecated,新建属性默认 experimental)、**API name**(active 状态不可改)。
- **Keys**:标记该属性是否为 title key(展示用的"显示名"来源属性)或 primary key。
- **Base type**:决定该属性在用户应用里可用的操作集合(例如 date 类型才能配置成时间轴组件)。
- **Render hints**:影响该属性索引/重建索引的性能(比如不需要排序/搜索的属性可以取消对应 render hint,减轻索引负担)。
- **Visibility**:normal / prominent / hidden。
- **Value formatting / Conditional formatting / Type classes**:如上两节所述。
- 值得注意:**Vector 类型属性只能通过 KNN 查询,不能用在 action type 里,最大维度 2048**。

### 28. Edit-only properties(仅可编辑属性,OSv2 专属)
https://www.palantir.com/docs/foundry/object-link-types/edit-only-properties/

- **仅 Object Storage V2 支持**的特性:允许创建**不需要映射到 backing dataset 任何列**的属性——这样就能"先在 Ontology 里定义好属性,数据源列还没建好也没关系",或者"这个属性本来就只想通过 Ontology 编辑(而非批量数据管道)写入"。
- 出于数据一致性和安全考虑,edit-only 属性**必须挂靠(permission 到)该 object type 背后某一个具体数据集**。

### 29. Required properties(必填属性,OSv2 专属)
https://www.palantir.com/docs/foundry/object-link-types/required-properties/

- 标记某属性为必填后,系统会校验:不允许出现该属性值为 null(数组属性则不允许为空数组)的对象;校验既作用于 backing datasource 索引,也作用于 Action 编辑。
- **校验发生在"索引时"**:所以如果 backing 数据集本身包含 null 值,Ontology 的修改配置本身可以保存成功(不会立刻报错),但真正索引这些 null 记录时会失败;通过 Action 写入 null/空值则会在**执行时**直接失败。
- **多数据源背书对象的坑**:如果一个 object type 由多个数据集共同背书,而必填属性来自数据集A,当某条新记录只出现在数据集B(A里没有对应行)时,这条对象反而**会成功索引**、但该必填属性没有值——这是个容易被忽视的边界情况,做数据校验设计时要特别注意。

### 30. Mandatory control properties(强制标记属性,常用于安全分级场景)
https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/

- 用于把 Restricted View 上的安全标记(marking)列映射为一个 base type 为 **Mandatory Control** 的属性;每个包含 mandatory control 属性的数据源都必须定义"允许写入哪些值"的约束。
- 标记值/组织值可以设为空数组(此时所有用户都满足标记要求、能看到该行)。
- 如果要给一个**已经有编辑记录**的 edit-only object type 补加 mandatory control 属性(不能直接建,因为该类型属性不能为空):先建一个可为空的字符串数组属性 → 用 Action 回填数据 → 再把 base type 改成 Mandatory Control。

### 31. Base types(基础类型)
https://www.palantir.com/docs/foundry/object-link-types/base-types/

- Base type 决定属性在用户应用中"能做什么操作"。**除 Map 和 Binary 外的所有 field type 都可作为合法 base type**。
- **进阶类型**:
  - **Vector**:语义搜索用的向量;
  - **Geopoint / Geoshape**:地理点/地理形状;
  - **Attachment**:配合 Functions on objects 使用的文件存储;
  - **Time series**:时间序列属性;
  - **Media reference**:指向 media set 里具体媒体项(图片/视频/音频/文档)的引用;
  - **Struct**:多字段结构化属性(下一节详细讲)。
- 除 Vector 和 Time series 外,所有 base type 都可以配置成**数组**(表示一个属性有多个取值)。

### 32. Property reducers(属性归约/聚合器)
https://www.palantir.com/docs/foundry/object-link-types/property-reducers/

> 该页面未能独立检索到完整正文,以下是结合 Derived properties 页里的"聚合(Aggregation)"机制整理的关键概念,可作为实用替代:

- Property reducer 本质上是在**跨多对多链接聚合关联对象属性值**时使用的归约函数,例如:Count(计数)、Sum(求和)、Average(平均)、Min/Max(最小/最大)、Collect to list(收集成列表)、Approximate distinct count(近似去重计数)等。
- 常见用法:在 Derived property(见下条)里,如果链路上某一跳的 link 是"多对多"基数,就**必须**指定一个 reducer 来把多个关联对象的属性值聚合成单一值。

### 33. Derived properties(派生属性,基于关联对象计算)
https://www.palantir.com/docs/foundry/object-link-types/derived-properties/

- **Derived property(派生属性)**:值不直接存储,而是**运行时基于 link 关联到的其他对象的属性动态计算**出来的**只读**属性,不能通过 function 或 action 编辑。
- 配置方式:在属性配置面板选 Source type = "Linked objects" → 选一个 link type(决定从哪些关联对象取值)→ 可以再"追加一跳"link,最多支持**3层关联**;如果链路中任意一跳是"多对多"基数,则必须选一个聚合方式(Count / Average / Sum / Min / Max / 近似去重计数等,即上面的 Property reducers)。
- 计算时会使用**链路上所有涉及对象的安全上下文**做权限校验,保证用户只能看到自己有权限访问的信息。
- 例子:Department 的"平均员工薪资"(聚合 Employee 的 salary)、Project 的"负责工程师姓名"(取1:1 link 的单个值)、Order 的"产品名称列表"(把多个 Product 的名字收集成 list)。

---

## 批次3b:Structs / Shared properties / Link types / Value types / Metadata / Object type groups / Marketplace(27篇)

### 34-39. Structs(结构化属性,共6篇)
https://www.palantir.com/docs/foundry/object-link-types/structs-overview/ 等

- **Struct = 一种属性 base type**,允许一个属性内部包含**多个字段**(schema-based,多字段)。典型场景:Full Name 属性拆成 First Name / Last Name 两个字段;Address 属性拆成 Street / City / Postal Code / Country。
- **关键约束**:
  - **深度只能是1层,不支持嵌套**(struct 里不能再套 struct);
  - 至少要有1个字段;
  - 只支持有限的字段基础类型(BOOLEAN、DATE、DOUBLE、GEOPOINT、INTEGER、LONG、STRING、TIMESTAMP);
  - 索引方式类似 ElasticSearch 的 object field type,**数组行为可能不直观**(这个坑在设计"多值struct数组"时要小心)。
  - **仅 Object Storage V2 支持**,目前只能从 dataset 或 Restricted View 创建。
- **创建流程**:在 object type 的 Properties 里新建属性 → base type 选 Struct → 指定 backing column → 逐个添加字段并各自映射列。
- **编辑**:改字段的 API name 会生成新的字段 RID,相当于覆盖原索引(和改 property ID 的行为类似)——引用旧字段的应用都要跟着更新。
- **和 Shared properties 结合**:struct 属性也可以被提升为共享属性(shared property),本地 struct 会继承共享 struct 的字段(但字段 RID 保留本地的);后续给共享 struct 加新字段时,必须同步把新字段映射到所有使用该共享属性的本地 struct。
- **哪些应用支持 struct**:Ontology Manager(定义/编辑)、Actions(创建/修改 struct 属性值)、Pipeline Builder(定义/编辑)、Workshop(展示、作为变量,但**部件和变量转换操作不能直接用整个 struct**,必须先取出单个字段)、Marketplace(打包安装)、Object Explorer(按 struct 字段值搜索,开发中)、Ontology SDK(部分 SDK 尚不支持)、Functions(仅 TypeScript v2 / Python 支持 struct 参数和编辑)。
- **Designate struct main fields(指定主字段)**:可以给 struct 指定一个"主字段"用于默认展示(该子页原文未能单独检索到,以上信息来自邻近页面整合)。

### 40-44. Shared properties(共享属性,共5篇)
https://www.palantir.com/docs/foundry/object-link-types/shared-property-overview/ 等

- **Shared property = 可以被多个 object type 复用的属性**:元数据(名称、描述、base type、render hints、visibility 等)在多个对象类型间**共享**,但底层的对象数据本身**不共享**(各自的数据还是独立的)。
- 典型场景:Employee 和 Contractor 都有 "start date" 属性——建一个共享的 start date 属性,两边都用它,以后只需要在一处更新元数据。共享属性在界面上会带一个**地球图标**标识。
- **创建方式**:直接新建共享属性,或者把已有的本地属性"转换/提升"为共享属性。
- **编辑共享属性的权限考量**(容易踩的坑):共享属性可能被用在多个 object type 上,而拥有该共享属性 Editor 权限的用户,**未必对所有用到它的 object type 有 Viewer 权限**——所以像"改 base type"这种破坏性编辑,只要会破坏**任意一个**(哪怕自己看不到的)object type,系统就会直接报错拒绝,防止"看不见就误伤"。
- **在 object type 上使用共享属性**:在 Ontology Manager 里打开某属性的配置面板,选择"Assign"一个共享属性,即可让该本地属性"挂靠"共享属性的元数据。

### 45-49. Link types(链接类型,共5篇)
https://www.palantir.com/docs/foundry/object-link-types/link-types-overview/ 等

- **Link type = 两个 object type 之间关系的 schema 定义**;**link(链接)= 该关系的一次具体实例**。类比:link type ≈ 两个数据集之间的 join,link ≈ join 后的一行。链接也可以存在于**同一个 object type 的两个对象**之间(自关联)。
- **创建 link type 的两种底层实现方式**(这个区分非常关键,决定了后续怎么维护数据):
  1. **Object type foreign keys(外键方式)**:支持 **one-to-one** 和 **many-to-one/one-to-many** 基数,直接选双方的外键属性和对应主键属性;
  2. **Join table dataset(join表方式)**:用于 **many-to-many** 基数,需要一个专门的 join table 数据集来背书这个链接(表里的列必须映射到两个 object type 各自的主键)。
- **基数(cardinality)语义**(注意:one-to-one 只是"意图声明",系统**不强制**唯一性校验):
  - one-to-one:一个 Aircraft 对应一个 Flight;
  - one-to-many / many-to-one:一个 Aircraft 对应多个 Flight,反过来则是多个 Aircraft 对应一个 Flight;
  - many-to-many:需要 join table。
- **编辑 link type 的破坏性变更**(和 object type 的逻辑类似):更换 many-to-many 的 backing 数据集、改变基数、改外键,都会导致 unregister/reregister,期间下游应用(如用到该 link 做 Search Around 的 Workshop 模块)会暂时不可用。可以在该 link type 的 Datasources 页里查看 Phonograph 重新索引的进度。
- **⚠️ 如果 link type 开启了 writeback(允许用户编辑)**,改动要格外小心:编辑历史存储在 OSv1(Phonograph)里,每次 writeback 数据集构建时都会**重新应用**这些历史编辑来得到最终状态——这意味着底层 schema 的变动可能会让历史编辑重放出问题,操作前务必评估影响面。
- **Metadata reference**:link type 的元数据包括 RID、Status(active/experimental/deprecated,新建默认 experimental)、关联的两个 object type、Cardinality。

### 50-55. Value types(值类型,共6篇,较新的能力,值得重点关注)
https://www.palantir.com/docs/foundry/object-link-types/value-types-overview/ 等

这组概念对你团队做**跨域变量映射表 / 统一数据校验**可能特别有参考价值,建议重点看:

- **Value type = 对某个基础字段类型的"语义包装"**,附带元数据和约束(constraints),用来增强类型安全性、表达力,并提供额外的领域上下文。区别于 dataset 字段类型 / property base type 这种"和具体领域无关"的原始类型,value type **承载了业务语义**并**集中管理数据校验逻辑**。
  - 经典例子:定义一个 "email" value type,挂一个正则约束校验是否是合法邮箱格式;之后任何用到这个 value type 的属性(不管是哪个 object type 上的),都自动获得这个校验,不用每次重复写校验逻辑,而且明确地告诉后来者"这个字段就是邮箱"。
- **归属范围**:与 object type、property、link type 这些"定义 Ontology 本身"的类型不同,**value type 是绑定在某个 space(空间)上的**,只能在定义它的那个 space 内使用;**default ontology 不支持 value type**。
- **创建方式**:在 Value Types Manager 应用里创建;可选地定义约束(字符串用正则、也支持枚举/范围等,取决于 base type);建议提供一个示例预览值。
- **约束(constraints)类型一览**:
  - **Enum**:限定取值集合(字符串枚举可选大小写敏感/不敏感);
  - **Range**:最小/最大值范围(适用 Decimal/Double/Float/Integer/Short/Date/Timestamp/String/Array,对字符串是限制长度、对数组是限制元素个数);
  - **Regex**:正则匹配(可选择是否允许"部分匹配");
  - **RID / UUID**:校验字符串是否为合法 RID / UUID;
  - **Uniqueness**(数组专属):数组元素必须互不相同;
  - **Nested**(数组专属):可以把某个约束(如正则)套用到数组里的每个元素上。
- **使用方式**:可以赋给 object type 的属性、赋给 shared property、或在 Pipeline Builder 管道里通过 "logical type cast" 表达式赋给写入 Ontology 的属性。**⚠️ 如果给某属性套上 value type,而现有数据不满足约束,该 object type 会直接索引失败**——上线前务必先做数据质量校验。
- **版本管理**:value type 支持版本化来处理破坏性/非破坏性变更,版本包含"元数据"和"约束"两部分。
- **权限模型**:**对某个 space 有 View 权限**的用户就可以在该 space 及其关联 Ontology 里"使用"(assign)已有的 value type;而**创建/编辑/删除** value type 需要该 space 的 **Editor 或 Owner** 权限——这是一个"用" vs "定义/治理"权限分离的设计,你如果要给团队规划 value type 的治理流程可以参考这个模型。

### 56-58. Metadata — Type classes / Render hints / Statuses(共3篇)
https://www.palantir.com/docs/foundry/object-link-types/metadata-typeclasses/ 、 metadata-render-hints/ 、 metadata-statuses/

- **Type classes(类型类)**:附加在属性/link type/action type 上的额外元数据,由具体的 Foundry 应用(如 Hubble/Object Views)解读并影响展示效果(如某些 type class 会决定属性在 Object Views 里怎么渲染)。**Ontology Manager 正在把很多历史上靠 type class 配置的能力,迁移到 object type 的专门 "Capabilities" 页面**——如果你在维护老 Ontology,留意哪些 type class 已被标记为 deprecated、该迁移到 Capabilities 页了。
- **Render hints(渲染提示)**:告诉 Object Storage V1(Phonograph)和用户应用"这个属性该怎么被使用",例如 `sortable` render hint 让应用知道可以对这个属性排序/做时间轴。**很多 render hint 直接影响重建索引的性能**——不需要被搜索/排序的属性,取消对应 render hint 可以给 Phonograph 减负、加快索引速度。这是你评估存量 Ontology 索引性能时的一个直接抓手。
- **Statuses(状态)**:每个 object type / property / link type / action / interface 都有一个状态,标记其"开发阶段",在 Object Explorer、Object Views、Workshop 里可见:
  - **Active**:被用户应用实际依赖,Ontology Manager 里**不允许对它做重大破坏性变更**(如改 primary key、删除、改 API name);
  - **Experimental**(新建资源默认状态):可能会发生变更导致在用户应用里不可用;
  - **Deprecated**:即将被删除,不应再被依赖,deprecated 资源还会带一条"由谁替代"的元数据;
  - **Example**:作为示例安装,仅适合培训/探索场景,**不应用于生产工作流**;
  - **Promoted**(仅 object type 专属):代表该 object type 已被 Ontology owner 审核认定为"核心可信资源",在 API name 层面享受和 active 类似的保护,界面上有个紫色勾标区分。

### 59. Object type groups(对象类型分组)
https://www.palantir.com/docs/foundry/object-link-types/type-groups/

- **Object type group = 一种分类原语**,帮助用户在庞大的 Ontology 里更好地搜索、浏览 object type。由 Ontology owner/editor 在 Ontology Manager 的 groups 菜单里创建管理,也可以直接在某个 object type 的 Overview 页选择"Edit groups"来打组。
- Group 支持在 Ontology Manager 的搜索栏搜索、在 object type 列表里筛选展示,也会显示在 Object Explorer 首页。查看 group 需要对其所在 project 有 viewer 权限。
- **⚠️ 历史沿革提醒**:这是**2024年5月22日**替换掉"旧版基于 type class 打标签的分组方式(legacy groups)"后的新机制;当时**无法安全自动迁移**的旧分组已经在 Workshop、Object Explorer 等应用里被隐藏(但为了向后兼容,旧分组名还保留在 object type 的 type class 元数据里),需要 Ontology owner 手动迁移。**如果你们团队的 Ontology 历史比较久,建议专门排查一次,看是否还有卡在旧分组机制里没迁移的对象类型**。

### 60. Add Ontology types to a Marketplace product(把 Ontology 类型打包进 Marketplace 产品)
https://www.palantir.com/docs/foundry/object-link-types/marketplace-ontology-types/

- 通过 **Foundry DevOps** 可以把 object type、shared property type、interface type 打包进 Marketplace 产品,供其他用户/环境安装复用。
- 添加 object type 到产品时,系统会**推荐关联的 link type**一并加入。
- **限制**:并非所有属性类型都受支持;**对象实例本身不能被打包**(也就是说 Action 产生的对象编辑数据不能靠 Marketplace 分发),但数据集和 object type 定义可以被打包,安装后用来重新生成新对象。

---

## 批次4:Action types(动作类型,共34篇)—— Ontology"动态/写回"能力核心

### 61. Overview
https://www.palantir.com/docs/foundry/action-types/overview/

- **Action type = 一次性对多个对象/属性值/链接做一组变更的 schema 定义**,同时包含提交后触发的副作用(side effect)行为。**Action(动作)= 一次具体的事务**,基于用户定义的逻辑改变一个或多个对象的属性——重点是让用户"围绕业务目标操作",而不是逐个字段手动改。
- 例子:一个 "Assign Employee" action type 可以定义"改 Employee 的 role 属性"这个流程,同时带一个参数表单(标准化输入新 role),还能自动在 Employee 和新 Manager 之间建立 link。
- 数据资产的价值随着用户的决策以 Ontology 编辑的形式被记录而不断增长——同一套 action 逻辑和校验规则可以在所有用户界面(Workshop、Object Explorer、Object Views)统一复用,保证编辑一致性。
- 对象类型上叠加了用户编辑之后的最新数据状态,会体现在该 object type 的 **writeback dataset** 里。

### 62. Getting started(实操教程)
https://www.palantir.com/docs/foundry/action-types/getting-started/

- 完整走一遍在 Ontology Manager 建 Action type 的流程:New Action type → 选 "Change object(s) = Modify" → 选目标 object type + 要改的属性 → 在 Forms 标签页配置参数(比如把 Priority 参数从"自由输入"改成"单选下拉:P0/P1/P2")→ 在 Security & Submission Criteria 标签页加提交条件(例如"只有 Open 状态的 ticket 才能改优先级")。
- **重要机制**:**对象实例既可以被输入数据源更新,也可以被用户 Action 编辑更新**——当同一个对象(同一个主键)同时收到两边的数据时,系统需要一套**冲突解决策略**来决定最终值该以谁为准(这个策略在别处文档详述,是评估"数据管道 vs 人工编辑"共存场景时必须搞清楚的机制)。
- **让用户能真正提交 Action 还需要额外配置**:OSv2 下需要打开一个"允许编辑"的开关;OSv1(Phonograph,已进入淘汰阶段)下则需要专门创建一个 writeback dataset。
- 参数默认值技巧:选 "Environment variable → Current object" 可以让某个参数自动填充为"当前正在查看的对象",并设为 Hidden,用户就不会看到这个字段但值是对的。

### 63. Use actions in the platform(在各应用里使用 Action)
https://www.palantir.com/docs/foundry/action-types/use-actions/

- Action 可以无缝集成进 Object Explorer 和 Workshop 等应用。文档区分了 **single action type**(参数是单个 object reference)和 **bulk action type**(参数是 object reference list,即批量操作)。
- 在 Object View 的 Actions 区块里配置按钮:可自定义标签和颜色;可以把默认的"点击打开表单"行为改成"点击直接用默认值执行"(如果默认值有效);还能配置当某个不可见参数无效时按钮是隐藏还是禁用。

### 64. Rules(规则:Action 的核心逻辑)
https://www.palantir.com/docs/foundry/action-types/rules/

- **Rules 把参数转换成 Ontology 编辑或其他效果**,分两大类:**Ontology rule**(改 Ontology 本身:创建/修改/删除对象和链接)和**触发 Foundry 里其他效果的 rule**。
- 常见 Ontology rule:**Create object**(创建对象,必须填主键,其他属性可选)、**Modify object(s)**(修改已有对象,主键来自 object reference 参数,**不能引用本次 action 里刚创建的对象**)。
- 要创建/删除 one-to-many 或 one-to-one 的链接,需要用 object rule 去修改对应的外键属性。
- **多规则合并逻辑(容易踩坑)**:一个 action type 里可以组合多条规则,系统会把它们编译成**每个对象一条最终编辑**——如果两条规则都改了同一个对象的同一属性(比如一条改成"A"、另一条改成"B"),**最终生效的是规则顺序里靠后的那条**,规则的**顺序**直接决定最终结果。
- 除了改 Ontology 本身,还有两种"触发其他效果"的规则:**Webhook rule**(可配置在编辑应用前/后运行,把参数传给外部请求)和 **Schedule rule**(触发某个 Schedule 的 build,可以把 action 参数透传给底层的参数化 transform;**Foundry 会在 build 开始后才应用 Ontology 编辑**)。

### 65-70. Parameters(参数,共6篇)
https://www.palantir.com/docs/foundry/action-types/parameter-overview/ 等

- **Parameter = action type 的输入**,是 Rules 和 Workshop/Slate/Object Views 等应用之间的接口,本质上是"装着外部值的变量"。每个参数由类型决定能接受什么值,还可以配置是否在表单里展示、是否允许用户修改。参数可以在 rules(把值写回对象/链接/side effect)、submission criteria(校验能否提交)、override(改后续参数的配置)等地方被引用。
- **Set parameter default value(默认值)**:在参数层配置,用于预填表单;还可以用 **type class** 标注参数,自动预填一些特殊值(如自动生成的 UUID、当前用户 ID)。
- **Filter results of a parameter dropdown(过滤下拉选项)**:
  - 对 **object reference** 参数,可以配置"对象下拉框只展示某属性匹配指定值的对象"(值可以是静态输入、来自另一个参数、或来自另一个 object reference 参数的属性),多个匹配值之间是 OR 关系;起始集合默认是该类型全部对象,但可以换成任意其他 object set。
  - 对 **多选/单选(非 object reference)**参数,可以配置"选项来自某个 object set 的某个属性"——如果链接对象集合刚好只有一个可选项且参数必填,会**自动预填**。
- **⚠️ Object dropdown security considerations(下拉框的隐私/安全隐患,容易被忽视的坑)**:如果下拉过滤用的是**静态写死的值**(而不是参数或关联对象属性),这个静态值会暴露给**所有能看到该 action type 的用户**,哪怕他们看不到被过滤出来的具体对象。举例:一个按"Investigation Name = Area 51 Investigation"过滤文档的下拉框,即使用户看不到那些文档,也能从 action 配置或网络请求里看到"存在一个叫 Area 51 Investigation 的调查"这个事实本身。**用参数或关联对象属性过滤则没有这个泄露风险**。
- **Override parameter configurations(条件覆盖参数配置)**:根据"条件(基于更早的参数)→ 覆盖后续参数的约束/可见性/必填性/默认值"这样的规则块,可以避免为细微差异建一堆几乎相同的 action type。举例:同一个"改工单状态"的 action,manager 提交时"理由"参数必填且可见,assignee 提交时则隐藏且非必填。
- **Performance considerations(性能考量)**:参数之间如果存在"默认值依赖另一个参数、下拉选项又依赖第二个参数"这种链式依赖,加载表单时系统需要**按依赖顺序串行求值**——建议把参数的依赖层级尽量做扁平化,减少链式嵌套,避免表单加载变慢。

### 71. Submission criteria(提交条件)
https://www.palantir.com/docs/foundry/action-types/submission-criteria/

- **Submission criteria(原名 validations)= 决定一个 Action 能否被提交的条件**,是把业务逻辑编码进"数据编辑权限"的机制,保障 Ontology 数据质量和编辑治理。
- 条件由"基于用户"或"基于参数"两种模板组合而成,本质是"两个值之间用运算符做比较"的逻辑判断:
  - **Current User 模板**:基于提交者本身的上下文,校验用户 ID、群组 ID、或任意 Multipass 属性;
  - **Parameter 模板**:基于某个参数(可以是对象属性)的值。
- 例子:只允许"飞行调度员"这个群组、且被改的 Aircraft 对象当前"仍在运营中"的情况下,才允许提交"更换某航班挂载飞机"这个 Action。

### 72. Actions on interfaces(接口上的 Action)
https://www.palantir.com/docs/foundry/action-types/actions-on-interfaces/

- 可以直接给 **interface**(而非具体 object type)定义 Action,这样的 interface action rule 只能用来**修改接口的共享属性**或**删除对象**——因为编辑必须对所有实现该接口的 object type 都适用。
- **⚠️ 权限颗粒度限制**:interface action 的 submission criteria **对所有实现该接口的 object type 统一生效**,目前**无法在同一个 interface action 内为不同 object type 配不同权限**(官方文档标注该能力"正在开发中")。想收窄权限,只能到 Ontology Manager 某个 object type 的 Interfaces 标签页,单独禁用它继承自某接口的 action。

### 73. Actions on structs(struct 属性上的 Action,批次3已提及,此处补充)
https://www.palantir.com/docs/foundry/action-types/actions-on-structs/

- 通过 **struct parameter**(base type = STRUCT,内含具名的嵌套字段)给 struct 属性写值,struct parameter 的每个字段必须**完整映射**到 struct 属性的每个字段,且 base type 要匹配;struct property 有破坏性变更(加字段/删字段/改字段类型)时,相关联的 action type 也要同步修改。

### 74-76. Function-backed actions(函数支撑的 Action,共3篇)
https://www.palantir.com/docs/foundry/action-types/function-actions-overview/ 等

- 当简单规则(创建/修改/删除对象、建/删链接)不够表达复杂逻辑时(例如:关闭一个 Incident 时要联动把所有关联 Alert 也标记为 Resolved;或者要先跑一段业务逻辑算出一个值再写回属性),就要用**函数支撑的 action type**——本质是让 action 调用一个 Function 来定义"应该怎么改对象",复杂度上限取决于 Function 本身。⚠️ 注意函数支撑的 action **仍然受 action type 限制和 function 执行限制的双重约束**。
- **Getting started**:在 Rules 里加一条 Function 类型的规则(**不能和其他 Ontology rule 混用**),选发布好的函数和版本,函数的所有输入会自动转成 action 的参数。**Auto upgrade 陷阱**:如果给 function-backed action 开了自动升级,没有该 action 编辑权限、但有函数编辑权限的人,可以间接改变这个 action 的行为(因为函数权限和 action 权限是分开的)——升级到坏版本还可能导致 action 执行失败。
- **Batched execution(批量执行)**:默认情况下,批量触发的 action(如 Workshop 的 inline edits 或 Automate 批量场景)会对函数**逐条串行调用**,所有编辑最后一起原子提交;如果想提升性能或统一处理冲突,可以把函数配置成"整批一次性调用"——函数需要改造成接收"一个结构体列表(相当于 map/dict 列表)"作为唯一输入参数。

### 77-81. Side effects(副作用:通知与Webhook,共5篇)
https://www.palantir.com/docs/foundry/action-types/side-effects-overview/ 等

- **Side effect(副作用)= 让 Action 把数据发送到 Foundry 之外**,对接组织已有的业务流程("decision orchestration,决策编排"模式)。两大类:
  - **Notifications(通知)**:action 提交后灵活配置怎么通知用户(含站内推送和邮件)。用于 Foundry 之外某系统是"真理源"、需要实时告知人去响应的场景。
  - **Webhooks(Webhook)**:以高度灵活的方式对接外部系统(REST API、ERP 系统等),既能写数据回源系统,也能借助消息系统间接通知用户。
- **Notifications 细节**:
  - 通知内容里用到的 Ontology 数据反映的是"该 Action 编辑生效**之前**"的状态;
  - 如果想让收件人拿到最新对象状态的链接,可以嵌入 object 参数引用的链接,或(通过"create object"规则而非函数创建的)新对象链接——因为新对象在通知渲染时还没生成 RID,必须用主键来引用;
  - 收件人如果通过对象属性动态指定,该属性必须存的是 Foundry 用户/组 ID 字符串(不支持直接发到邮箱地址)。
  - **Set up a notification 教程**:走一遍改 Alert 优先级并通知 Assignee 的完整配置,包括在 Notifications 设置里验证站内推送+邮件都能收到。
  - **⚠️ Global Branching 场景下的默认行为**(2025年10月更新):action 在分支上执行时,**默认不会真的发送通知**(会看到一条 toast 提示),需要在 Security & submission criteria 标签页手动开启"分支上也发通知",并可指定收件人策略(发给分支所有者 or 沿用默认配置的收件人)。
- **Webhooks 细节**:
  - 两种配置方式:**writeback**(编辑应用**之前**先执行,失败会阻断后续规则)vs **side effect**(编辑应用**之后**执行,用户会先看到"成功"提示,副作用真正执行可能发生在提示之后);
  - **一次 action 触发多次 webhook 调用**:可以传入一个 payload 列表,webhook 会按列表条数被调用多次,但**执行顺序不保证**;
  - **Set up a webhook 教程**:在 Rules 里选已配置好的 webhook → 把 webhook 的输入参数映射到 action 参数(默认自动生成同名参数)→ 选 writeback 或 side effect 时机 → 保存。

### 82. Trigger schedule build(触发 Schedule Build,参见 Rules 一节)
- Schedule rule 可以让 action 触发某个 Schedule 的 build,并把参数透传给底层的参数化 transform;**Foundry 会在 build 开始后才应用对应的 Ontology 编辑**(而不是等 build 跑完)。这对于"用户点一下按钮就触发一整条数据管道重跑"这类场景很关键。

### 83. Configure sections(表单分区)
https://www.palantir.com/docs/foundry/action-types/configure-sections/

- Action 表单可以用 **Sections(分区)** 对参数做逻辑分组,让复杂表单更易读、易操作。

### 84-85. Upload media / Upload attachments(上传媒体/附件)
https://www.palantir.com/docs/foundry/action-types/upload-media/ 、 upload-attachments/

- **两种上传机制,推荐优先用 Media reference(而非 Attachment)**:Media reference 属性(依托 media set)支持数十亿级文件规模、内置格式转换和 LLM 能力、丰富的预览、以及 NITF/GeoTIFF/DICOM 等专业格式支持;文件先经文件选择器上传,**格式转换在 action 提交成功之后才发生**。要一次上传多个文件到同一属性,需要打开 "Allow multiple" 且对应属性是数组类型。
- **Attachment(附件)机制**:表单里一添加文件就立即上传;提交成功后,查看/编辑/删除权限继承自该对象类型的权限;如果表单提交失败或取消,未提交的附件会在一段时间后**自动永久删除**(已删除对象或已取消映射的附件同理);同时支持 logic-backed 和 function-backed action;**全局固定单文件大小上限 200MB**。

### 86. Scale and property limits(规模与属性限制)
https://www.palantir.com/docs/foundry/action-types/scale-property-limits/

- **单次 action 的对象编辑数量上限**:function-backed 且未开启 batched execution 时上限压到 **20**;批量调用(batched execution)时,一次批量调用里产生的所有编辑会被当作**同一组**统一计入上限,不管是批次里哪条请求触发的。
- **Action 不能直接编辑对象的主键**——改主键等价于"删除旧对象+新建对象",要用 rules 显式创建/删除对象来实现,不能靠改主键的方式。
- **Side effect notifications 单次最多通知 500 个收件人**。

### 87. Inline edits(行内编辑)
https://www.palantir.com/docs/foundry/action-types/inline-edits/

- 在 Object Explorer 结果视图、原生 Object View 的 property/metric 卡片组件里可以做**逐格行内编辑**,底层也是靠 action 支撑。
- 和普通单次 action 的关键区别:**行内编辑的所有参数都是可选的且默认取对象当前值**(方便逐个字段单独改);编辑是**批量验证+批量提交**,而不是单条顺序提交,因此**引用共享 action 类型或关联对象的 submission criteria 与行内编辑不兼容**(因为累积型的提交条件是拿"新值"和"编辑前的旧值"比较,批量并行编辑会打破这个假设)。
- 默认值只能来自该行内 action 定义所依附的那个 object reference 参数,不能用静态值或"当前用户/当前时间"这类特殊值;可见性和 override 配置在 Object Explorer / Object Views 场景下会被忽略;不能挂 webhook 或通知类 side effect。

### 88. Permissions(权限)
https://www.palantir.com/docs/foundry/action-types/permissions/

- Submission criteria 是控制"谁能跑这个 action"的细粒度机制,可以要求特定用户/群组 ID,并结合参数信息组合判断。
- **对象编辑权限的两种模式**:锁死为"只能通过 action 编辑"(**新建 object type 默认就是这个模式**,官方推荐所有新场景都用这个,以保证跨工作流的一致安全范式),或者开放"允许 action、Foundry Forms、Object Explorer 直接编辑、API 调用"等多种编辑路径。
- **只允许 action 编辑的对象类型有个很实用的特性**:提交 action 的用户**只需要对被编辑对象有 Read 权限即可**——也就是说,用户理论上可以创建出自己都看不到的对象。
- Webhook 相关的额外权限要求在 Data Connection 应用里单独配置。
- 通知类 side effect:提交条件必须先正常通过,才会触发 side effect;收件人必须对通知里包含的对象数据有权限,否则不会收到该通知(多收件人场景下,权限不足的会被静默跳过,不影响其他有权限的收件人收到)。

### 89. Monitoring(监控)
https://www.palantir.com/docs/foundry/action-types/monitoring/

- 支持两种监控规则:**Action duration p95**(执行耗时 P95 超过阈值告警)和 **Number of action failures in window**(时间窗口内失败次数超阈值告警)。配置流程走标准的"建监控视图 → 加监控规则 → 配阈值和告警级别 → 订阅告警通知"。Action monitor 支持 Workflow Lineage、Workshop、OSDK 应用作为动态作用域。

### 90. Undo or revert Actions(撤销/回滚 Action)
https://www.palantir.com/docs/foundry/action-types/action-reverts/

- 在 Ontology Manager 里,Action 提交后可以**立即撤销(revert)**。

### 91. Branching action types(分支上的 Action)
https://www.palantir.com/docs/foundry/action-types/branching-action-types/

- 可以在 Workshop 模块里、基于 Global Branch 测试 action 配置是否正确:要在分支上跑某个 action,所有被该 action 编辑的 object type 都必须先在该分支上完成索引。
- **分支上跑 action 只是测试机制,编辑不会被合并回 main**。
- **Function-backed action 的分支感知(branch-aware)差异**:branch-aware 的函数可以在分支上被修改、并从分支读取 schema;非 branch-aware 的函数则只从 main 读 schema。**不管是否 branch-aware,分支上执行的 function-backed action 都只在分支内生效,不会写回 main**。

### 92. Action metrics(动作指标)
https://www.palantir.com/docs/foundry/action-types/action-metrics/

- 每个 action type 页面可查看近30天的近实时使用指标:**成功/失败次数**(便于快速定位问题)、**P95 执行时长**(便于发现性能瓶颈)。还能看过去7天的完整**运行历史(run history)**。所有指标基于 Foundry Telemetry Service(FTS)近实时更新。

### 93. Action log(动作日志)
https://www.palantir.com/docs/foundry/action-types/action-log/

- **Action log 会把每一次 action 提交都建模成 object type**,方便用 Ontology 感知的工具去分析、展示、并作为下游决策工作流的输入,用来监控 Ontology 上发生的变更。为便于识别,所有 action log 的 object type 名字都以 **`[LOG]`** 前缀标注,和对应 action type **一一对应**。
- 如果需要的是"记录某个对象所有历史编辑"这种更细粒度的需求,应该用**对象类型的 edit history** 功能(在 Object edits and materializations 大类里),而不是 action log。

### 94. Add action types to a Marketplace product(把 Action type 打包进 Marketplace)
https://www.palantir.com/docs/foundry/action-types/marketplace-action-types/

- 通过 Foundry DevOps 把 action type 打包进 Marketplace 产品复用。**打包前必须检查**:submission criteria 不能引用具体某个**用户**(要改成引用**群组**),否则装到别的环境里这条权限规则就失效了——这是给别人分发 action type 前务必自查的一条硬性要求。

---

**至此,"Action types" 大类(共34篇)全部完成。** 下一批将进入 **"Functions"** 大类——这是篇幅最大的一块(约68篇),涵盖语言支持、TypeScript v1/v2、Python、单元测试、模型调用等,和你团队做 Kimi/GLM 模型接入、ontology edit function 开发直接相关,建议再拆成3-4个子批次进行。回复"继续"或"下一批"以继续,也可以告诉我你想优先看哪个子部分(比如 Python functions 或 Models 相关章节)。
