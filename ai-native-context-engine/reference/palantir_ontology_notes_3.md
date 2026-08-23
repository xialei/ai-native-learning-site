# Palantir Foundry — Ontology 文档学习笔记(三)

> 承接第一份笔记文件 `palantir_ontology_notes.md`(Ontology building 总览、Ontologies、Object and link types、Action types)和第二份笔记文件 `palantir_ontology_notes_2.md`(Functions 大类),累计已完成 162 篇。本文件专门收录 **"Interfaces"** 大类(共9篇)。

## 进度追踪

- [x] Interfaces 大类(9篇)✅ 已完成
- [x] Ontology 设计三篇 + Ontology search(8篇)+ Ontology scenarios(5篇)✅ 已完成

---

## Interfaces(接口:对象类型的多态性机制,共9篇)

### 163. Overview
https://www.palantir.com/docs/foundry/interfaces/interface-overview/

- **Interface(接口)= 描述 object type"形状"与"能力"的 Ontology 类型**,让共享同一种结构的多个 object type 可以被**一致地建模和交互**。经典例子:一个 **Facility(设施)接口**可以定义 Facility Name、Location 两个属性,Airport(机场)、Manufacturing Plant(工厂)、Maintenance Hangar(维修机库)这几个 object type 都可以各自带上自己特有的属性、同时"实现"这个 Facility 接口——这样一来,写工作流时可以统一操作 Facility 接口(不管背后是哪个具体类型),**未来新增实现该接口的 object type 时,已有工作流无需改动就自动兼容**。
- **接口的组成部分**:接口属性(interface properties)、链接类型约束(link type constraints)、动作类型约束(action type constraints)、接口元数据。**接口属性推荐在接口上本地定义**,也可以用共享属性(shared property)。
- **多态与继承**:一个 object type 可以**实现多个接口**(用于不同工作流场景);一个接口也可以**扩展(extend)多个其他接口**(包括那些自身也在扩展别的接口的接口),**属性会沿着这条继承链层层叠加继承下来**——概念上和编程语言里的接口继承非常类似。
- **⚠️ 功能成熟度矩阵(截至该文档时间点,建议使用前先核实是否已转正)**:
  - **Actions**(基于接口定义创建/修改/删除/链接对象的动作)已支持;
  - **Interface action type constraints(接口动作类型约束)当时仍是 Beta**;
  - **Object Set Service 按接口搜索/排序**已支持,**按接口聚合(aggregate)仍在开发中**;
  - **Interface link types(接口链接类型)当时仍在开发中**(注:批次内第168条已经证实该功能后续已经上线可用,说明这个矩阵会持续演进,建议以 Ontology Manager 实际界面为准);
  - **Ontology SDK 把接口当作 API 层来访问实现类型**:**当时只有 TypeScript 支持,Java/Python 支持仍在开发中**——**这一点如果你团队打算大量依赖接口做 Python/Java 侧的多态访问,建议先去 Ontology SDK 文档确认当前实际支持状态,避免踩到功能缺口**。

### 164. Create an interface(创建接口)
https://www.palantir.com/docs/foundry/interfaces/create-interface/

- 创建流程:新建接口 → 加属性(本地定义或引用共享属性,**每个属性单独标记"必需(required)"或"可选(optional)"**)→(可选)加接口链接类型约束 → (可选)加接口动作类型约束 → 选择保存到的 Project → Create → 回到 Ontology Manager 点 Save 让改动正式生效。
- **必需属性 vs 可选属性的实操含义**:必需属性要求**任何实现该接口的 object type,都必须在实现时提供从本地属性到接口属性的映射**;可选属性则可以跳过映射。
- **⚠️ 一个很实用的产品化设计建议**:**如果你在构建要打包分发的 Marketplace 产品,优先把接口属性设计成"可选"**——这样后续迭代接口定义时,不会给已经安装了该产品、但还没跟着升级实现的下游用户制造"必须立刻处理的升级阻塞(upgrade blocker)"。
- 接口动作类型约束的配置项包括:约束元数据、是否要求必须实现(required)、以及具体的参数约束(parameter constraints)。

### 165. Implement an interface(实现接口)
https://www.palantir.com/docs/foundry/interfaces/implement-interface/

- **实现接口的前提条件(三件套)**:该 object type 必须有属性能满足接口的**必需属性**要求、有链接能满足接口的**必需链接类型约束**、有动作类型能满足接口的**必需动作类型约束**——"实现接口"本质上就是**声明"这个 object type 是该接口在 Ontology 里的一个具体实例"**。
- **实现后解锁的两项关键能力**:
  1. **Object Set Service 针对接口发起的搜索,会返回所有实现了该接口、且匹配条件的具体 object type 的对象**(跨类型统一检索);
  2. **同一个对象既可以用它自己的"本地 API name"当作具体类型来交互,也可以用"接口的 API name"当作接口类型来交互**(属性和链接都是)——这正是"多态"的具体体现。
- 操作入口:两种方式都可以——从 object type 侧配置 Interfaces 标签页,或从接口总览页的 Implementations 区块点 "+ New" 选择要实现的 object type。
- 如果接口声明了必需的链接类型约束,你必须**在 object type 上选一个满足该约束的链接类型**(可以复用已有链接,也可以新建);非必需的约束可以选择跳过映射。动作类型约束同理。
- 实现完成后,可以在该 object type 的 Interfaces 标签页里进一步**配置参数映射(parameter mappings)**——所有必需的参数约束都必须映射到具体动作类型上兼容的必需参数。

### 166. Edit an interface definition(编辑接口定义,⚠️ 重点关注,涉及破坏性变更)
https://www.palantir.com/docs/foundry/interfaces/edit-interface-definition/

- 加新属性的入口:接口配置的 Properties 标签页 → New property,属性元数据编辑分四个标签页(和批次3提到的属性元数据结构类似)。
- **⚠️⚠️ 这是接口维护中最需要牢记的一条**:**因为接口会对外暴露 API name,修改接口定义有直接"破坏下游应用"的风险,而且必然会破坏所有已有的接口实现**。具体规则:
  - **给接口新增一个"必需"属性或必需链接类型约束时,所有实现了该接口的 object type,必须在同一次 Ontology 更新里,同步补齐对应的映射关系**——不能"先改接口、后面再慢慢补实现",系统不允许这种半吊子状态存在;
  - 官方**强烈建议接口定义的改动和它的消费方(下游应用/工作流)同步更新**;
  - **如果下游应用暂时没法和接口改动同步升级**,推荐的替代方案是:**不要直接改老接口,而是创建一个新版本的接口(用扩展/extend 的方式,或者干脆建一个独立的新接口),让消费方自己选择合适的时机再迁移过去**——这条建议和批次5b里"API-named query function 升级建议复制一份、起新 apiName"的思路完全一致,是 Foundry 平台上一以贯之的"破坏性变更管理"哲学:**永远优先给消费方选择权,而不是强制同步升级**。

### 167. Edit an interface implementation(编辑接口实现)
https://www.palantir.com/docs/foundry/interfaces/edit-interface-implementation/

- 在 Ontology Manager 里找到某个已经实现了接口的 object type → 用 "..." 菜单选 "Remove interface" 可以**彻底移除**该 object type 对某接口的实现关系,保存后生效。
- 也可以直接通过下拉菜单**更换**用来实现接口某个属性/链接类型约束的具体属性/链接类型(不需要整个移除重来)。

### 168. Interface link types(接口链接类型约束)
https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview/

- **Interface link type constraint(接口链接类型约束)= 定义"所有实现该接口的 object type 之间共同拥有的一种对象间关系"**。可以配置:链接的说明文字、供代码引用的 API name。当某 object type 实现了带链接约束的接口后,**该 object type 上具体的(concrete)链接类型会被用来满足这个接口层面的约束**。
- **链接目标(link target)可以是接口,也可以是具体 object type**——**当你要建模"两个抽象概念之间"的关系时,应该把链接目标设为接口而不是具体类型**。经典例子:要建模 Facility(设施接口)和它所在地点发生的 Alert(告警接口)之间的关系——因为设施有很多种(机场/工厂/机库)、告警也有很多种,如果链接目标只能选单一具体 object type,根本没法表达这种"多对多类型组合"的关系;而通过"Facility 接口 → 链接到 → Alert 接口"这种接口对接口的链接约束,就能统一表达所有具体设施类型和具体告警类型之间的关系。
- **基数(Cardinality)**:接口链接约束支持 **ONE**(每个实现该接口的对象应该链接到目标类型的**一个**对象,类比 1:1)和 **MANY**(可以链接到目标类型的**任意数量**对象,类比 1:多)两种。选择依据是建模语义:比如"驾照 → 人"适合用 ONE(每张驾照只属于一个具体的人);"公司 → 股东"则更适合用 MANY(一家公司可以有多个股东)。
- 链接类型约束还可以标记为**是否是 object type 实现该接口时的必需项**。

### 169. Interface action type constraints(接口动作类型约束)
https://www.palantir.com/docs/foundry/interfaces/interface-action-type-constraints/

> 该独立页面未能直接检索到完整正文,以下整合自 Overview / Create an interface / Actions on interfaces 三篇里对该主题的详细描述,内容可信度较高:

- **接口动作类型约束 = 描述"所有实现该接口的 object type,应该具备哪些动作能力"的契约**——它**只定义契约本身(接口层面的动作规范)**,具体的编辑逻辑仍然由 object type 侧、满足该约束的**具体动作类型的 action rules** 来定义和执行。
- **当前定位**(截至文档撰写时):**接口动作类型约束目前是 Ontology Manager 里的一个建模/映射能力,还不是终端用户应用层或 Ontology SDK 可以直接调用的能力**——也就是说,这套机制目前主要服务于"定义规范、约束实现",终端消费侧的调用能力仍在发展中。
- **权限层面的强提醒**:**接口的动作提交条件(submission criteria)会统一套用到所有实现了该接口的 object type 上**——批次4"Actions on interfaces"里也强调过这一点(无法针对不同实现类型单独收窄权限)。这意味着**在创建接口级别的 action 之前,必须仔细审视"所有实现该接口的 object type"这个完整集合上,谁能创建/修改/删除对象**,而不能只盯着你当下关心的那一两个具体类型来评估权限影响面。

### 170. Extend an interface(扩展接口)
https://www.palantir.com/docs/foundry/interfaces/extend-interface/

- **扩展(extend)接口 = 把多个接口组合起来,构造一个更具体的新接口**——对于"构造一个实现了多种能力接口的抽象对象接口"这类场景特别有用。**接口会继承它所扩展的那个接口的所有共享属性、链接类型约束、动作类型约束**;一个接口可以扩展**任意数量**的其他接口。
- 操作路径:Ontology Manager 打开目标接口 → 左侧面板选 Extension → Add extension → 下拉菜单选要扩展的接口 → 确认对话框会**列出即将被继承进来的所有共享属性/链接约束/动作约束**,供你 review 后确认。
- 也**支持移除扩展关系**来解耦两个接口——移除后,之前通过扩展继承过来的共享属性等也会一并移除。

### 171. Metadata reference(接口元数据参考)
https://www.palantir.com/docs/foundry/interfaces/interface-metadata/

- 接口的元数据字段:**RID**(该接口的唯一标识,会出现在平台各处的错误信息里)、**Icon**(图标+颜色,**接口图标周围会带一圈虚线,专门用来和 object type 的图标做视觉区分**——比如 Facility 接口的建筑图标外面会套一圈虚线框)、**Display name**、**Description**。
- **⚠️ 一条容易被忽视但很关键的容量限制**:**可搜索(searchable)的接口最多支持 50 个实现该接口的 object type;不可搜索的接口上限是 1,000 个**——如果你的 Ontology 设计里某个抽象接口预期会被大量(50+)不同 object type 实现、同时又需要跨接口做搜索,这条限制值得在设计阶段就纳入考量,避免后期才发现搜索能力被容量上限卡住。

---

# Interfaces 大类(共9篇)全部完成

**累计进度:三份笔记文件合计已完成 171 篇**(Ontology building 总览5 + Ontologies10 + Object and link types45 + Action types34 + Functions68 + Interfaces9)。

**一个值得回顾的关联点**:批次5f提到的"Function interfaces"(函数接口,用来注册自定义 LLM 给 AIP Logic 用)和本文件的"Interfaces"(对象类型接口)是**完全不同的两套机制**,只是命名上都叫"接口"——前者是函数签名契约,后者是对象类型的结构与能力契约,设计理念相通(都是"契约 + 多实现"的多态思想),但应用场景完全不同,注意不要混淆。

## Ontology 设计:最佳实践 / 结构指南 / 反模式(3篇,强烈建议精读原文)

这三篇是 Palantir 官方总结的"血泪经验",和你现在做 Ontology 建模、以及评估存量设计的合理性直接相关,建议原文通读一遍。

### 172. Best practices(最佳实践)
https://www.palantir.com/docs/foundry/ontology/ontology-best-practices/

- **开篇警告**:被要求"把某个数据集 ontology 化"时,**不要图省事直接把列 1:1 映射成属性就算完事**——这种"全盘照搬源系统"的做法(即下面反模式里的 **Kitchen Sink 反模式**)只会做出一个"复刻源系统 schema 怪癖"的 Ontology,而不是真正有业务语义的模型。**好的 Ontology 应该让用户(或 AI agent)凭直觉就能无障碍导航**,因为它的结构匹配的是人们理解这个业务领域的方式,而不是数据库表结构。
- **实操检查清单**(建议直接抄进团队的 Ontology 设计规范文档):
  - **对现实建模,而不是对系统建模**:object type 应该代表真实世界的实体,而不是某个源系统或部门自己的数据视角;
  - **有意识地做取舍(curate intentionally)**:每个属性都应该有明确的业务或技术价值,不是"有就加上";
  - **跨团队协作**:Ontology 设计应该拉上多个部门/团队的干系人——**团队各自为战是"重复建模"最主要的原因**;
  - **保持 object type 聚焦**:每个 object type 应该只代表一种界限清晰的实体;
  - **选对工具**:人工或 agent 参与的决策用 action types,全自动的转换用 pipelines(数据管道)——不要什么都往 action 里塞;
  - **用接口做抽象**:当多个实体共享公共特征时,**用 Interface 表达这种抽象,而不是硬造一个属性稀疏、字段一大堆但大部分都是 null 的"大而全"object type**。

### 173. Structural guidance(结构指南)
https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance/

- **核心原则:每个事实只存一份(store each fact once),用 derived property(派生属性)换取便利性**——把关联对象的值直接"冗余复制"到当前对象上(denormalization)是有风险的操作:**数据源一旦变化,所有复制出去的副本都得跟着更新**,而**规范化(normalization)配合 derived property,能在保证数据一致性的同时,依然获得"看起来像冗余展开"的访问便利性,且不需要人工维护同步**。
- **⚠️ 一个更细的判断标准(容易被忽视但很关键)**:**不是所有"计算出来的值"都可以一视同仁地对待**——关键要看这个值"能不能安全地从稳定输入预计算出来",还是"必须和 Ontology 里动态变化的内容保持同步"。**如果一个值依赖某些 action 带来的变化,那么每一个可能影响这个值的 action,都必须同步去更新它**——只要有一个 action 漏更新了,这个值就会一直错下去,直到有人发现这个偏差。这是评估"这个字段该用 denormalized 存储还是该用 derived property"时的核心决策依据。
- **命名规范建议**(表格对照,建议直接套用做团队命名规范):

| ✗ 避免 | ✓ 推荐 |
|---|---|
| Object type: Item | Object type: Product |
| Property: dtLastInspMod | Property: lastInspectionDate |
| Property: value | Property: monetaryValue / quantityOnHand |
| Link: Item → Related Item | Link: Product → Supplier / Employee → Supervisor |

- **提前约定命名规范**:在正式开始建模之前,就针对日期、状态、标识符、链接这几类元素统一命名模式。
- **安全设计对齐业务边界**:如果你的业务本身就有天然的访问边界(区域经理只看自己片区数据、诊疗团队只看自己患者),**应该用 Ontology 的关系和安全策略来建模这些边界,而不是靠临时的、散落各处的数据过滤逻辑**。
- **不要为了实现安全隔离而拆分 object type**:一个类型 + 精心设计的安全策略,永远优于"同样的 schema 拆成好几个类型分别挂不同权限"。
- **对新增的 Ontology 路径做访问一致性复查**:每次新增链接、类型或属性时,确认这些新路径没有绕过原本对受限数据的保护意图。

### 174. Anti-patterns(反模式,建议对照自查存量 Ontology)
https://www.palantir.com/docs/foundry/ontology/ontology-anti-patterns/

即便是经验丰富的 Ontology 设计者,也很容易陷入"当下看起来合理、但随着 Ontology 规模变大就会出大问题"的设计陷阱。以下几个是文档中点名的典型反模式:

- **Kitchen Sink 反模式**(踩坑信号自查清单):
  - object type 是照搬源系统数据表,而不是对应一个业务实体;
  - 几乎每一列都原样映射成了属性,没有做任何取舍;
  - 命名直接抄了源系统的字段命名习惯(如 `dtLastInspMod`),而不是用业务语言命名(如 `lastInspectionDate`);
  - 建模时是"看着数据来设计",而不是"先理解业务领域再设计";
  - 一条源数据行里其实混杂了多个不同实体的信息,却被建成了单一 object type。
- **System Silos(系统孤岛)反模式**:因为数据来自不同的源系统,就给同一个真实世界实体建了多个不同的 object type(而不是围绕这个实体本身去建模)。**常见成因**:不同团队各自拥有不同的源系统、独立开发互不沟通;不确定该怎么合并多源数据;想保留系统特有字段、又懒得决定哪些才是真正重要的字段。
- **Department Silos(部门孤岛)反模式**:不同部门各自造了一套自己版本的同一个 object type,导致整个 Ontology 支离破碎、**映射的是组织架构、而不是业务现实**。**常见成因**:部门间各自为战、缺乏跨职能协调;每个团队都觉得"我们对客户的理解和别人不一样";缺乏统一的 Ontology 治理机制或权威负责人。**修复方式**:把"四个部门各自维护的 Customer object type"合并成一个共享的 object type,用属性和链接去承载部门专属的差异化信息,而不是靠拆分整个类型来"各过各的"。
- **命名歧义反模式**:比如给 object type 起名叫 "Item"(到底是产品?订单行项目?库存项目?)、给属性起名叫 "value"(是金额?数量?打分?评级?)——**这类模棱两可的命名会让整个 Ontology 变得难以理解和维护**。
- **给出的具体补救建议**:给所有 Ontology 元素都写清楚描述,说明它的含义和合法取值;命名要拉上终端用户一起 review,确保直观且没有歧义;在 Ontology Manager 里把设计决策文档化(object type / property / link 都要写清楚"为什么存在这个字段、谁在用它")。

---

## Ontology search — 语义搜索(共8篇)

### 175. Overview(总览)
https://www.palantir.com/docs/foundry/ontology/overview-semantic-search/

- **语义搜索的原理**:用 AI 模型把文本转换成向量(embedding);如果模型效果好,**在 N 维空间里彼此靠近的向量,对应的就是语义相近的内容**(例子:"face mask" 的向量会比"respirator"更靠近"face covering")。把这些嵌入向量关联到 Ontology 里的具体对象后,搜索驱动的运营工作流会变得更加实用——**找相关实体,本质上就变成了在 N 维空间里找最近邻向量**。

### 176. Document processing(文档处理:分块/Chunking)
https://www.palantir.com/docs/foundry/ontology/document-processing/

- **Chunking(分块)= 把大段文本拆成更小的片段**。这么做的原因有两个:①embedding 模型对输入文本长度**有上限**;②**更小的文本片段在语义搜索时区分度更高**(整篇长文档一起嵌入,语义会被"稀释")。常用于处理 PDF 这类大文档:把长文本拆成小"块",每个块对应一个链接回原始对象的 Ontology 对象。
- **实操路径**:入门可以**用 Pipeline Builder 无代码实现基础的分块策略**;更高级的分块策略(比如按语义边界智能切分,而不是死板按字数切)建议用代码仓库(code repository)实现。

### 177. Process multimodal and embedding models(多模态与嵌入模型)
https://www.palantir.com/docs/foundry/ontology/aip-multimodal-and-embedding-models/

- **两条技术路线**:①先用普通文本抽取拿到"能被搜索的东西",后续再对**原始页面图像**跑多模态模型做更精细处理;②如果场景是英文为主,可以直接试**基于 MS MARCO 数据集训练的 sentence-transformers 模型**——这类模型专门针对"搜索词/问题 → 找相关段落"这个任务训练过,把查询词和相关段落的向量在嵌入空间里拉近,**这个"训练目标匹配你的使用场景"的特性,往往比通用型的 OpenAI Ada 嵌入模型更适合"从用户提问出发做检索"的语义搜索工作流**。

### 178. Ontology augmented generation(Ontology 增强生成,即你熟悉的 RAG 思路在 Foundry 里的落地)
https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/

- **⚠️ 一个值得纳入决策的判断**:**随着模型上下文窗口越来越长,不一定非得用语义搜索**——比如 GPT-4o 的 128K 上下文窗口能装下 300+ 页文本,**如果你的应用完整上下文能塞进这个限制内,官方建议优先不用搜索、直接把全部上下文塞进 prompt**,等真正需要时再引入检索。
- **构建基础语义搜索的步骤**:定好分块策略 → 用带 media reference 属性的对象承载每个分块 → 在语义搜索工作流里检索分块 → 在 Workshop 里用 PDF Viewer 部件做展示(有专门的配置项支持高亮/跳转到具体分块)。
- **查询预处理(Query pre-processing)的重要性**:直接把用户原始提问扔给关键词搜索,效果往往不好——**建议在用户查询和实际检索之间插入一个 LLM 处理步骤**,让 LLM 帮忙**去除停用词和"帮我找找看"这类无意义的修饰语、补充同义词和相关词**,来提高检索相关性。文档给了一个可以直接抄的 prompt 模板思路:"给定用户查询 {query},给出能找到相关结果的搜索词列表,记得去除停用词、给最重要的词补充同义词和相关词"。

### 179. Use Palantir-provided models to create a semantic search workflow(用 Palantir 内置模型搭建语义搜索,官方推荐路径)
https://www.palantir.com/docs/foundry/ontology/using-palantir-provided-models-to-create-a-semantic-search-workflow/

- **前提**:必须先在环境里启用 **AIP**,且用户本身要有 **AIP developer 权限**。
- **端到端流程**:用 Pipeline Builder 的 **"Text to Embeddings" 表达式**(底层调用的是 `text-embedding-ada-002` 这个 Palantir 提供的模型)把文本转成向量 → 存入 Ontology 的 **vector 类型属性** → 三种消费方式任选:
  1. **Workshop 里配一个 KNN object set(纯无代码)**:选带 embedding 属性的对象类型,在过滤条件里选"On a property"选中该 embedding 属性,配置出 K 近邻检索(**⚠️ KNN object set 没法按相关度排序**,如果需要按相关性排序的结果,得改用下面的函数方式);
  2. **写一个 TypeScript function**,接收用户输入文本,用同一个 Palantir 模型生成向量,再做 KNN 检索,发布后可以在 Workshop 或 AIP Logic 里当工具用;
  3. **直接在 AIP Chatbot / AIP Agent 里加"Ontology 语义搜索"能力**,让 agent 自己决定何时调用语义检索。
- 在 AIP Logic 里用发布好的语义搜索函数时,可以直接在 prompt 里指示模型"用 fetchRelevantObjects 工具、kValue 设为5,去找最相关的对象"这样的具体调用指令。

### 180. Use custom models to create a semantic search workflow(用自定义模型搭建语义搜索,⚠️ 官方已不推荐)
https://www.palantir.com/docs/foundry/ontology/using-custom-models-to-create-a-semantic-search-workflow/

- **⚠️ 文档开篇即明确标注:这套面向"非 Palantir 提供的嵌入模型"的教程,已经不是官方推荐的工作流了**——如果没有特殊原因(比如必须用某个特定开源模型、或者有严格的数据不出私有部署环境的合规要求),**新项目应该优先走第179条的 Palantir 内置模型路径**。
- 但如果你确实需要自定义模型(比如接入你们团队自己训练/微调的向量模型),流程是:用 Foundry Modeling Objective 给文档生成 embedding → 存进带 vector 属性的 object type → 示例用的是开源 **all-MiniLM-L6-v2** 模型(输出384维向量)→ 模型需要暴露一个"输入文本列、输出向量列"的表格化 API,可以用任意输出向量与 Ontology vector 类型兼容的模型替换。

### 181. Search syntax(搜索语法,含正则搜索)
https://www.palantir.com/docs/foundry/ontology/search-syntax/

- 这篇讲的是 Ontology 里(不局限于语义搜索,含关键词/正则搜索)的搜索语法,重点是**正则表达式搜索**的几条硬性规则(容易踩坑,建议记牢):
  - **要对某个字符串属性用正则搜索,必须先在 Ontology Manager 里给该属性开启"regex 索引"**(路径:object type 的 Properties 标签页 → Interaction 标签 → 勾选 "Enable regex queries");
  - **⚠️ 正则匹配的是整个字段值,而不是子串**——因为索引存的是完整字符串作为一个"未分析"的整体值,你的正则表达式默认会去匹配**从头到尾的完整值**。举例:搜索 `cat` 只会精确匹配值恰好是 `cat` 的记录,**不会**匹配包含 `cat` 的 `concatenate`;想做子串匹配,得手动在两边加 `.*`,写成 `.*cat.*`;
  - **不支持 `^` 和 `$` 锚点**——因为每次匹配本来就已经隐含"从头到尾"的语义,这两个锚点是多余的;
  - 举例:`\d{3}-\d{4}` 能匹配 `555-1234`;要匹配字面意义的点号,要转义写成 `\.`(比如 `example\.com` 精确匹配 `example.com`,不会误配 `exampleXcom`)。

### 182. Derived properties(Ontology 查询层面的派生属性,⚠️ 注意和批次3的"属性定义层面的 Derived properties" 区分)
https://www.palantir.com/docs/foundry/ontology/derived-properties/

- **⚠️ 容易混淆的两套"Derived properties"**:批次3(Object and link types)讲的是**在 Ontology Manager 里给 object type 预先定义一个固定的派生属性**;而这一篇讲的是**在发起查询的那一刻、临时动态计算的派生属性**(概念上更接近"运行时的 SQL 计算列"),两者用途场景不同,不要混为一谈。
- **在 Ontology SDK 里的用法**:TypeScript OSDK 通过 **`withProperties`** 操作来临时定义、返回、或用于额外过滤/聚合/排序的派生属性(**需要 `@osdk/client` 包 2.2.0-beta.x 及以上版本**)。
- **⚠️ Beta 阶段的能力限制清单(评估要不要现在就用这个特性时的关键依据)**:
  - **不支持任何用 OSv1 索引的 object type**——这条查询里只要牵涉到哪怕一个 OSv1 类型,就用不了这个特性(又一处 OSv1 vs OSv2 能力差距的体现);
  - **不能用于文本搜索或关键词过滤**;
  - **TypeScript OSDK 当前版本下,查询里不能包含任何 struct 类型的属性**。

---

## Ontology scenarios — 场景推演("what-if"分析,共5篇)

> 说明:该子类下部分独立页面(overview-ontology-scenario / temporary-scenario / persisted-scenario / osdk-scenario)未能单独检索到完整正文;以下内容综合自 **merge-scenario 原文**(已独立确认)和 **Workshop Scenarios 文档**(同一套底层机制在 Workshop 场景下的说明,内容高度可信可迁移),但具体到 `osdk-scenario` 里 OSDK 层面的 API 细节,建议你使用前直接查阅原文核实。

### 183. Overview(总览)
- **Scenario(场景)本质上是对 Ontology 数据的一次"fork/分支"**,通过应用一个或多个 action 生成——这些 action 也可以借助 functions on models(批次5f提到的模型函数)引入模型计算结果,让场景推演具备"调用模型预测未来状态"的能力。**核心用途是做"what-if"假设分析和对比**:比如"如果调整这条航线的排班,会对整个机队运力产生什么连锁影响"。

### 184. Temporary scenarios(临时场景)
- 结合关联的 Object Set 机制可知:**临时资源(如临时对象集)通常有效期为24小时,过期自动失效**——推断"临时场景"应该遵循类似的生命周期设计,适合"跑一次性假设分析、看完结果就不需要保留"的场景,不占用长期存储。

### 185. Store scenario metadata as objects(把场景元数据存成对象/持久化场景)
- 与"临时场景"相对,**持久化场景会被真正存下来供后续参考和跨会话复用**——适合"这次 what-if 分析的结论需要留档、给团队评审"这类场景。
- **关键机制(来自 Workshop Scenarios 文档的印证)**:一个 Scenario 一旦创建就**不可变(immutable)**——想"修改"一个场景,实际做法是**用一组新的 action/model 配置创建一个新场景**,而不是编辑原场景;也可以直接复制一个现有场景(连带它已有的 action 和参数)作为起点再改。
- **⚠️ 硬性规模限制**:**单个场景最多能对 Ontology 做 30,000 次编辑**——因为 Scenario 基础设施是建立在 Action 之上的,批次4提到的 Action 相关限制在这里同样适用。**这条限制值得在设计大规模模拟/推演场景时提前评估**,避免场景跑到一半因为超限而失败。

### 186. Merge scenarios(合并场景,即"把假设变成现实")
https://www.palantir.com/docs/foundry/ontology/merge-scenario/

- **核心机制**:在场景内所做的所有编辑(创建对象、改属性、删对象、加/删链接)都**只存在于该场景的隔离沙箱里,不会影响主 Ontology**。当你决定"采纳"这个场景的结论时,**"应用场景(Apply scenario)"会把所有暂存的编辑,作为单一事务(single transaction)一次性提交到主 Ontology**——即所谓的 **merge action(合并动作)**。
- **配置方式**:在 Ontology Manager 新建一个 action type,创建向导里选 **Scenario 标签页**,定义该场景编辑涉及的 object types 和 link types 范围;创建完成后,记得去该 action 的 **Security & Submission Criteria 标签页**明确配置"谁有权限执行这个合并动作"——**这是个不容忽视的权限关卡:合并场景相当于一次性批量改动生产数据,权限收紧是必须的**。
- 如果你已经有一个现成的 action,也可以直接在它的 Rules 标签页**加一条 "Apply Scenario" 规则**,不需要从头新建一个 action type。

### 187. Use scenarios with OSDK(用 Ontology SDK 操作场景)
- 该页面具体的 OSDK API 使用细节未能独立确认,合理推断应该是围绕"在代码里创建场景、在场景上下文里执行 action、读取场景内的暂存数据、触发合并"这套流程提供的编程接口封装,和批次5的 Ontology edits 机制在设计理念上是相通的(暂存编辑 → 校验 → 提交)。**如果你近期要在代码里(而非纯 UI 操作)编排场景推演流程,建议直接查阅这篇原文**。

---

# 本文件(笔记三)阶段性小结

本文件目前已完成:**Interfaces(9篇)+ Ontology 设计三篇 + Ontology search(8篇)+ Ontology scenarios(5篇)= 25篇**。

**三份笔记文件累计进度:187 篇**(笔记一94篇 + 笔记二68篇 + 笔记三25篇)。至此,**"Ontology building" 这个顶层大类下,除应用层和后端架构外的所有核心建模内容已经全部完成**。

剩余尚未开始的部分,规模都比较大:
- **应用层第一块**:Object Explorer / Object Monitors / Object Views(约50篇)
- **应用层第二块**:Ontology Manager / Vertex / Machinery(约30篇)
- **应用层第三块**:Foundry Rules / Map / Dynamic Scheduling(约80篇,篇幅最大)
- **Ontology architecture 后端**:权限、索引、写入落地、对象数据库(约20篇,适合评估性能/权限设计时看)

---

# 应用层 · 第一部分:Object Explorer(共16篇)

> 从这里开始进入"应用层"内容。Object Explorer 是面向**技术门槛较低用户**的 Ontology 搜索与分析工具,批次1(Ontology-aware applications)里已简要提及,这里是完整展开。

### 188. Overview
https://www.palantir.com/docs/foundry/object-explorer/overview/

- **Object Explorer = 用来回答"Ontology 里任何东西"相关问题的搜索与分析工具**:支持从简单关键词到复杂属性过滤的各类查询,查询后可以在**探索视图(exploration view)**里可视化下钻、切换成**表格结果视图**、或点开单个对象查看其 **Object View**。
- 支持**对比多个对象集、对当前对象集批量执行 Action(如批量写回)、把当前结果集"带去"其他兼容应用(如 Quiver)、导出数据**;探索结果可以**保存(saved exploration)**,随时回来查看最新数据。
- **定位很明确**:**几乎不需要预先配置,面向技术门槛较低的用户**——这和 Workshop(需要专门搭建)、Quiver(面向更复杂分析场景)形成互补。

### 189. Getting started
https://www.palantir.com/docs/foundry/object-explorer/getting-started/

- 首页是一个"导航枢纽",支持:全局搜索栏搜索一切(对象/对象类型/保存的探索/模块)、按预配置的 **object type group** 分组浏览、预览具体对象类型、直接选中某类型进入探索。
- **⚠️ 一个容易被忽视的规模限制**:**如果 Ontology 里用户能发现的 object type 超过 250 个,全局关键词搜索只会覆盖前 250 个类型**——超过这个数量,要精确定位某个具体类型,必须用后面提到的分组/按类型搜索等更精确的方式,不能只依赖全局搜索栏。
- **Object type group 的图谱视图**:点击 Graph 图标能看到该分组内各 object type 之间的链接关系图,可以在图上直接看到链接类型、调整布局、移除某个类型分组——这是一个理解某个业务域内类型关系的直观入口。

### 190. Search for objects(搜索对象)
https://www.palantir.com/docs/foundry/object-explorer/search-objects/

- 搜索结果页按类别组织:**Object type filters**(按对象类型分类的匹配结果)、**Object type groups**(按分组过滤)、**Artifacts**(细分为 Explorations & Lists、Comparison Views、Modules)。
- **结果排序规则**:**prominent(优先展示)的对象类型排在 non-prominent 前面**,同优先级内按匹配结果数量升序排列(结果最少的排前面);**hidden(隐藏)的对象/属性类型永远不会出现在搜索结果里**——这几个排序/可见性规则和批次3提到的"Visibility: normal/prominent/hidden"元数据直接对应,是你调整某类型该不该在 Object Explorer 里"显眼"的直接抓手。

### 191. Search syntax(搜索语法)
https://www.palantir.com/docs/foundry/object-explorer/search-syntax/

- **默认行为**:多个词之间是**独立的 OR 关系**(搜 `yellow cab` 会匹配包含 `yellow` 或 `cab` 的任意对象);**用引号包起来做精确短语匹配**(`"yellow cab"` 只匹配包含完整短语的对象,结果通常比单词搜索少)。
- **逻辑运算符**:`NOT`、`AND`、`OR` 都支持,可以组合成复杂表达式。
- **通配符**:`?` 匹配单个字符,`*` 匹配零或多个字符;**前置通配符(`*smith`)需要在 Ontology Manager 里给该字符串属性开启"Enable leading wildcards" render hint**;**前置+后置组合通配符(`*term*`)不支持**,同一次查询只能选前置或后置其中一种。
- **模糊匹配**:在词尾加 `~` 做"fuzzy match"(近似匹配,同时也能匹配精确值)。
- 想深入了解跨平台(含 Workshop、Functions API)的文本搜索底层分析器行为,建议参考下面第192条。

### 192. Understanding text search(理解文本搜索底层机制)
https://www.palantir.com/docs/foundry/object-explorer/understanding-text-search/

> 该页面未能独立检索到完整正文,但从其他页面的多处引用可以确认:**这是一篇跨平台的文本搜索原理详解页(不仅限于 Object Explorer,同样覆盖 Workshop 和 Functions API 里的文本搜索行为)**,专门讲解**analyzer(分析器)行为**、以及为什么"多词通配符查询无法匹配"这类具体限制背后的原理。**如果你团队要基于 Object Explorer/Workshop/Functions 的文本搜索结果做产品化功能,建议直接查阅这篇原文,理解清楚底层分析器的分词/索引逻辑,能省掉很多"为什么搜不到"的排查时间**。

### 193. Analyze using SQL(用 SQL 分析)
https://www.palantir.com/docs/foundry/object-explorer/analyze-sql/

- 在探索视图右上角菜单选 "Analyze using SQL",打开一个可调整大小的预览面板,在 Code 标签页写**只读的 Spark SQL 查询**(语法遵循标准 Spark SQL 方言);输入对象类型名字时有自动补全,可以帮你快速插入完整的 object type RID,也可以直接用 API name 写查询。
- **⚠️ 硬性限制**:**每次查询固定返回最多 1,000 行的采样结果**,且查询用的是和 Contour 相同的计算后端——这是个"探索性分析用的采样预览"能力,不是用来跑生产级批量分析的。

### 194. Filter results(过滤结果)
https://www.palantir.com/docs/foundry/object-explorer/filter-results/

- 探索视图的搜索栏是过滤的核心入口:可以按属性名搜索、选中属性后按属性类型(数值/文本/日期等)呈现对应的取值选择器。
- **三种查询修饰符(用开关而非手改文本,保证格式一致)**:**"Is not"**(取反,等价于 `NOT term`)、**"Starts with"**(前缀通配符搜索,等价于 `term*`)、**"Exact"**(精确匹配整个短语,含空格位置)。
- **两种典型使用路径**:①**知道属性、按属性选值过滤**;②**只知道值、不知道属于哪个属性时,直接在搜索栏输入值**,如果该值在当前对象集里存在,系统会主动推荐"where 某属性 = 该值"这样的过滤选项。
- **也支持基于链接的过滤**:用 "Has Link" 过滤"是否有某种关联"(有/没有该链接的对象);还可以**按关联对象的属性过滤**(如"2018年生产的飞机所执飞的航班"),或者**直接过滤到链接的具体对象**(如"某航空公司旗下的航班")。

### 195. Explore with charts(用图表探索)
https://www.palantir.com/docs/foundry/object-explorer/explore-charts/

- **图表是 Object Explorer 里过滤交互的主要方式**:每张图表代表对主对象类型(或关联对象类型)某个属性字段的一次聚合。默认会给选中对象类型的每个 **prominent(优先展示)属性**各生成一张图表;用户可以自定义并保存自己的默认布局,**管理员可以给所有用户保存全局默认布局**。
- **图表类型**:**Listogram(列表图)**用于非数值属性(String/Boolean/Array)的聚合展示,也能展示数值属性的聚合(如平均营收);还支持对**关联对象**的属性做聚合图表(图表标题会标注是在过滤关联对象的属性)。
- **Layout(布局)= 图表+表格列配置+排序配置的可共享视图组合**,可以设置该布局默认打开 Explore(图表)还是 Results(表格)标签页,也可以标记为"仅自己默认"或(管理员权限下)"全体用户默认"。

### 196. View results(查看结果表格)
https://www.palantir.com/docs/foundry/object-explorer/view-results/

- Results View 用表格展示探索结果,滚动加载更多;支持自定义列的显示/隐藏、拖拽调整列顺序、"不截断文本"选项(让长文本自动换行而不是被裁切)。管理员可以把某个配置保存成新布局并设为全体用户默认。
- 点击某行的 Title 列,会在**新的 Object Explorer 标签页**打开该对象的 Object View;勾选多行则会打开一个**选中项预览面板**(最多同时预览前20个被选中对象的 Object View,以卡片列表形式展示)。

### 197. Pivot to explore linked objects(沿链接切换探索的主对象类型)
https://www.palantir.com/docs/foundry/object-explorer/pivot-linked/

- **"Pivot"= 把当前探索的主对象类型,切换成通过某条链接关联到的另一个类型**,同时**自动继承当前已应用的过滤条件**——例如从"过滤出的一批东部大机场"pivot 到"这些机场的所有出发航班",探索主体就从 Airport 切换成了 Flight,而且自动带着"东部大机场"这个筛选上下文。
- **支持连续多跳 pivot**,可以在 Ontology 里灵活地沿着链接关系层层深入探索。

### 198. Compare object sets(对比对象集)
https://www.palantir.com/docs/foundry/object-explorer/compare-object-sets/

- **Comparison View(对比视图)= 对比两个经过过滤的对象集**,这两个对象集既可以来自动态过滤条件,也可以来自已保存的探索/列表。
- **分享机制**:点 Share 按钮可以指定具体用户/群组、设定访问级别、可选设置全员默认角色。**⚠️ 一个容易被忽视的权限细节**:**分享一个 Comparison 本身,并不会连带分享它所引用的底层探索/对象数据的访问权限**——查看者除了要有这个 Comparison 本身的权限,还必须**单独**对底层数据有相应的角色权限,否则光有 Comparison 的访问权限也看不到实际内容。

### 199-200. Save explorations / Save lists(保存探索 / 保存列表)
https://www.palantir.com/docs/foundry/object-explorer/save-explorations/ 、 save-lists/

- **两者的核心区别**:**Exploration(探索)保存的是一套"动态"的搜索参数配置**(过滤条件+布局),每次打开都会重新按这套条件查询、看到最新数据;**List(列表)保存的是一份"静态"的具体对象快照**,不会随数据变化自动更新。——**这是一个很实用的设计选择点:要"实时监控符合某条件的最新数据"用 Exploration,要"固定住此时此刻这批具体对象、留档或后续复用"用 List**。
- 两者都可以设为 **Private**(存入个人 Explorations/Lists 文件夹,默认仅自己可见)或 **Public**(可选存储位置,该位置有权限的人都能访问);都会出现在 Object Explorer 首页全局搜索结果里,也都可以通过顶部导航栏的下拉菜单访问、内置文本搜索和常用过滤器辅助查找。

### 201. Apply Actions(应用动作)
https://www.palantir.com/docs/foundry/object-explorer/apply-actions/

- 探索视图右上角按钮分三大类:**Actions**(数据写回)、**Open In**(把当前探索带去其他兼容应用)、**Export**(导出到 Foundry 之外,如 Excel)。
- 选中某个已配置的 Action type 后,系统会自动**把当前选中的对象集(或未选中时的全部对象)预填进表单的 object reference 参数**,你只需要填其余参数。
- **⚠️ 硬性上限**:**选中对象数超过 1,000 个时,Actions 功能会直接不可用**——批量写回场景要留意这个上限,超量时需要考虑分批操作或改用批次4提到的"Batched execution"的 function-backed action。

### 202. Generate Object Explorer URLs(生成 Object Explorer 链接)
https://www.palantir.com/docs/foundry/object-explorer/generate-urls/

- 三类可生成链接的对象:**特定 object type 的探索**(`?objectTypeId=aircraft`)、**已保存的探索/对象集**(`/saved/<RID>` 路由)、**由其他 Foundry 应用创建的对象集**(`external/objectSet` 路由)。默认打开 Explore(图表)视图,追加 `perspectiveId=results` 参数可以直接打开表格 Results 视图。
- **实用的调试技巧**:先在 Object Explorer 里手动搭好一个示例搜索(填好你想要的各项过滤值)→ 打开浏览器控制台(右键 inspect,确保 inspect 的是 Object Explorer 渲染出的具体元素,而不是空白页面)→ 执行 `await hubble_get_current_search()` → 会返回当前全部过滤条件的 JSON,可以照着这个格式去反推、拼接出你需要的自定义链接参数。**这是一个没有正式文档 API、但官方明确推荐的"逆向工程"技巧,适合你要给客户/内部系统生成"直接跳转到某个预设探索"的深链接时使用**。

### 203. Configure Object Explorer(配置 Object Explorer)
https://www.palantir.com/docs/foundry/object-explorer/configure/

- **Object type group 的创建**:在 Ontology Manager 里该 object type 的元数据面板里配置(需要 editor 权限)。
- **隐藏某个 Action**:给该 action 的 **Object Reference List 参数**加上 `hubble-oe:hide-action` 这个 type class(需要在 Ontology Editor app 里操作,要求有 Ontology 编辑权限)。**⚠️ 官方明确标注:这个功能仍在开发中,未来可能被废弃且不保证自动迁移**——如果你打算用这个功能隐藏某些 action,官方建议先联系 Palantir 代表确认,要承担"未来可能需要手动迁移"的风险。
- **动态对象集 vs 静态对象集**:探索结果默认可以保存为**动态对象集**(保存的是过滤条件的"表示",新数据匹配/不匹配这些条件时,对象集内容会自动更新)。
- **配置"成功提示"里的跳转链接**:给"创建对象"类型 action 的 **Primary Key 参数**、或"修改对象"类型 action 的 **Object Reference List 参数**加一个特定的 type class,可以让 Action 提交成功后弹出的 toast 提示直接带一个跳到新建/修改对象 Object View 的超链接——同样需要通过 Ontology Editor app 操作,要求有 Ontology 编辑权限。

---

---

# 应用层 · 第二部分:Object Monitors [Sunset](共11篇,精简处理)

> **⚠️ 关键信息,决定了这部分要不要深入学习**:官方原文明确写着——**"Object Monitors are in the sunset phase of development and will be deprecated at a future date... We recommend migrating your workflows to Automate."**(Object Monitors 正处于淘汰阶段,未来会被废弃,官方建议迁移到 **Automate**——这是一个没有出现在本次学习范围原始导航树里的更新产品,推测是后来替代 Object Monitors 的新一代自动化平台)。**鉴于此,这部分只做精简记录,不逐页展开细节,建议如果你们团队要做"数据变化触发通知/自动化"的新需求,直接去查 Automate 的文档,而不是投入时间深入学习即将被淘汰的 Object Monitors。**

### 204-214. 核心内容速览
https://www.palantir.com/docs/foundry/object-monitors/overview/ 等(共11篇,含总览/创建教程/8个核心概念子页/限制/错误参考)

- **Object Monitors = 让终端用户和应用构建者感知"Foundry Ontology 里数据何时发生变化"的工具**:变化发生时,可以自动**发通知**或**提交 Action**(当满足指定条件时)。定位是**追踪单个搜索或单个对象的监控/告警能力**,也可以作为应用构建者往 Foundry 应用里嵌入监控告警功能的组件。目前**仍保留完整支持**,只是不再是官方推荐的新建路径。
- **创建方式**:最常见的入口是**从 Object Explorer 的已保存探索(saved exploration)直接创建**——保存探索后点右上角 "Monitor" 按钮,进入该探索关联的监控列表,点 "Add new Monitor" 填监控名称、描述、监控条件即可;**⚠️ 带嵌套子条件的高级条件,没法在这个简化界面里配置,必须去 Object Monitors 独立应用里创建/修改**。
- **核心概念**(11篇里的8个"Core concepts"子页,按名称推断内容,不逐一展开):
  - **Monitors(监控本身)**:监控的顶层配置对象;
  - **Inputs(输入)**:监控的输入必须是**已经在 Object Explorer 里保存好的探索**;
  - **Conditions(条件)**:分 **event(事件型)** 和 **threshold(阈值型)**两种条件类型,配置项因类型而异;
  - **Evaluation(评估)**:监控条件的评估执行机制;
  - **Activity(活动记录)**:监控的历史触发/评估活动记录,可以在监控详情面板里查看订阅者、历史活动等;
  - **Notifications(通知)**、**Actions(动作)**:满足条件后可以触发的两类效果,和批次4"Action types → Side effects"的通知/action 机制在设计理念上是相通的;
  - **Monitoring limits(监控限制)**:监控数量、评估频率等方面的平台限制(具体数值建议直接查原文,考虑到即将淘汰,这里不做详细摘录);
  - **Error reference(错误参考)**:监控出错时的错误码/错误信息对照表。
- Overview 页面本身会展示:近期监控活动列表、监控总数、已订阅/已静音的监控数、有错误或即将过期的监控数——这是一个监控健康度的仪表盘视图。

---

---

# 应用层 · 第三部分:Object Views(共21篇)—— 终端用户日常最常接触的部分

### 215. Overview
https://www.palantir.com/docs/foundry/object-views/overview/

- **两种 Object View**:**Standard Object View(标准视图)**——开箱即用、自动反映 object type 配置的标准化展示,所有 object type 默认都有;**Configured Object View(配置化视图)**——用 Workshop 搭建的、完全可定制的展示,面向特定工作流做上下文化呈现。**一旦创建了 Configured View,它会变成该类型的默认展示**,但用户随时可以切回 Standard View——**两者是并存的一等公民选项,不是替代关系**。
- **两种"形态尺寸(form factor)"**:**Full Object View(完整视图)**——对象的全面深入展示;**Panel Object View(面板视图)**——为集成进其他应用设计的紧凑视图,聚焦当前工作流最关键的数据。举例:一个 Patient 的 Full View 可能包含完整的基本信息+生命体征+关联的诊疗记录+历史趋势分析;而它的 Panel View 可能只精简展示基本信息和生命体征。

### 216. Standard Object Views(标准视图)
https://www.palantir.com/docs/foundry/object-views/standard-object-views/

- **创建/配置 object type 时,Foundry 会自动生成对应的标准视图**,直接反映该类型的元数据配置:**Prominent(优先)属性**会被突出展示(在专门的表格或根据 base type 呈现不同视觉形式:**时间序列属性 → 交互式图表**、**地理属性(geohash/geoshape/GTSR)→ 直接在地图上渲染**、**媒体引用属性 → 专门的媒体查看器**);**Normal(普通)属性显示在常规表格里**;**Hidden(隐藏)属性完全不展示**——这一整套行为直接对应批次3提到的"Visibility: normal/prominent/hidden"元数据配置,是你调整某类型该"默认长什么样"最直接的抓手。
- 标准视图同样有 **Panel 形态**,功能上和 Full 形态基本对等。

### 217-219. 视图版本管理 / 配置化视图总览 / 分支支持(3篇)
https://www.palantir.com/docs/foundry/object-views/manage-versions/ 、 config-overview/ 、 branching-object-views/

- **版本机制**:每次对 Object View 的保存编辑都会存成**一个新版本**,一个版本可以包含多处改动(增/删/改 tab 等)。
- **权限模型**:如果该 object type **没有**启用 Ontology roles,编辑者必须同时具备"Control Panel 里的 Object View Admin 应用权限"+"该类型任一输入数据源的 Editor 角色";**如果已启用 Ontology roles,只需要该 object type 的 Ontology Editor 角色即可**——**这是又一处"迁移到 Ontology roles 能显著简化权限管理"的例证**。**除非手动把某个 tab 的 Workshop 模块转成独立模块,否则该模块的权限会和 object type 权限自动保持同步**,确保"能编辑/查看该类型的人,也一定能编辑/查看该类型 Object View 里的所有模块"。
- **默认视图行为**:未编辑过的默认视图会**动态跟随 object type 配置变化**(新增属性/改名会自动体现);**但只要视图被人工编辑过一次,它就变成"用户接管(user-managed)"状态,后续所有更新都必须手动同步**——这是一条容易被忽视但很关键的机制,评估"要不要现在就去动手改某个默认视图"时,要意识到一旦改了就再也不会自动跟着 Ontology 变更走。
- **⚠️ Branching 支持是2026年1月刚上线的新能力(重点关注)**:**Object Views 现在支持 Foundry Global Branching**,可以在分支上独立开发/测试视图改动(结构性改动如 tab、可见性条件;内容性改动如 Workshop 模块本身),不影响生产环境;支持跨应用测试(把分支上的视图嵌入 Workshop 应用、在 Ontology Manager 里预览验证)、支持 rebase 时自动解决非冲突改动;**目前分支上的视图变更还不支持审批流程,一律自动通过**;**Legacy(旧版)Object View tabs 不能在分支上编辑**。**这对你团队如果打算把 Object Views 的迭代也纳入统一的分支化开发流程,是一条直接可用的新能力**。

### 220-221. Full Object Views(完整视图:使用 + 配置)
https://www.palantir.com/docs/foundry/object-views/use-full-views-in-platform/ 、 config-object-views/

- **默认的 Full View** 展示单个 Property List 组件(展示 prominent 属性)+ 一个 Links 组件(展示对象的链接)。
- **编辑器三大区域**:**Header**(面包屑显示 Ontology 名/类型/形态,可切换 Full/Panel 编辑、查看版本号、切换预览对象、保存发布)、**Object title bar**(点齿轮图标管理 tab:增删/重排/改名/配置可见性,**若只配了1个 tab,查看时 tab 标题会被隐藏**,**删除某个 tab 会连带删除它背后的 Workshop 模块**)、**Workshop module**(每个 tab 背后就是一个标准 Workshop 模块,可以用 Workshop 的全部标准能力去编辑内容)。

### 222-223. Panel Object Views(面板视图:使用 + 配置)
https://www.palantir.com/docs/foundry/object-views/use-panel-views-in-platform/ 、 config-panel-views/

- **典型使用场景**:Vertex、Map、Gaia 等应用**通过面板视图**展示被选中对象的紧凑信息,面板里点标题可以打开一个可移动/可调整大小的模态框,展示完整的 Full View。
- **两种 Panel View 类型**:**Object instance panel(单个对象实例面板)**——展示某类型的单个具体实例,出现在应用的"选择面板"里;**Object set panel(对象集面板)**——展示同一类型多个实例的聚合视图,当用户选中一批同类型对象时出现。**在自定义 Workshop 应用里,用 Object View 组件、配置成 panel 形态,就能获得这种紧凑视图**。
- 配置面板尺寸时,有**匹配不同平台应用的预设尺寸**、常见分辨率预设、以及手动像素输入三种方式。

### 224-227. Legacy Object Views — 配置基础(4篇:旧版配置/Tabs/应用侧边栏/Profiles)
https://www.palantir.com/docs/foundry/object-views/config-legacy-object-views/ 、 config-tabs/ 、 config-app-sidebar/ 、 config-profiles/

> **定位说明**:这4篇属于"Legacy(旧版)Object View builder"体系——**新 tab 已经不能再用这套旧版构建器创建,但已有的旧版 tab 仍受支持**。如果你团队维护的是较早期建的 Ontology,可能还有不少视图停留在这套旧机制上,值得了解现状以评估是否要迁移到新的 Workshop tab builder。

- **Legacy Tab 的组成单元叫 Widget(部件,也叫 Section/Plugin)**——是旧版体系里展示/操作数据的基本单位,包含加/删/重排等操作。
- **Configure tabs(Tab 配置,新旧通用的概念)**:tab 支持通过**用户 Profile**、**属性值条件**(当前对象某属性等于/不等于指定值时才展示,例如"只有华东区机场才显示的 Regional View tab")两种方式做条件可见性配置;可以嵌入**已有的 Workshop 模块**(同一个模块可以在多个 Object View 里复用)。
- **Configure the applications sidebar(应用侧边栏配置)**:每个分组/应用卡片都能单独配置——可以直接跳转编辑背后的具体应用(Workshop/Slate)、或新增一个"Add application"卡片来嵌入指定的具体资源;嵌入 Workshop/Slate 时,可以把**当前对象的属性值、关联对象集、或预设值**作为参数透传进去,在被嵌入的应用里以同名变量的形式访问(Workshop 侧要在模块的接口变量设置里配置接收)。
- **Configure profiles(Profile 配置,面向不同角色的差异化视图)**:Profile 让你为不同角色的用户展示不同的 tab 组合。**底层依托 Object Explorer 背后的 Hubble 服务**,要把一个用户组配置成 profile,需要在 Platform Settings 的 Groups 标签页给该组加特定的 Hubble 属性;设置 `hubble:isDiscoverable=true` 会让该 profile 对非组内成员也可见,不设置则只有组内成员能访问对应视图。**⚠️ 新建的 profile 最多需要等5分钟才会在编辑器里生效**——这是个容易踩的"配了但暂时用不了"的坑,遇到时先别急着排查配置对不对,等几分钟再看。**设置默认 profile 的方式是把用户加进该 profile 背后的那个组**(仅当用户只属于单一 profile 时生效)。

### 228-232. Legacy Object Views — 五大 Widget 分类
https://www.palantir.com/docs/foundry/object-views/widgets-properties-links/ 等

- **Properties and Links(属性与链接类)**:展示对象/关联对象的属性和链接的表格化视图,还包括展示预计算指标/KPI,或需要对关联对象做聚合运算得出的统计值。**Properties 组件是任何新建 object type 默认生成的 Object View 内容**,其配置和 Ontology Manager 里的属性定义紧密联动(哪些属性 prominent/长文本/关键词/可编辑,都是共用同一套配置)。
- **Visualization(可视化类)**:图表、透视表、时间轴、地图等可视化组件,也支持嵌入其他 Foundry 应用产出的可视化内容(Slate 应用、Contour 看板、Foundry 报告、Fusion 电子表格、Quiver 时间序列/图表)。其中 **Linked Object 组件**(展示指定类型的关联对象列表,支持直接链接或通过中间类型的传递链接)有三种展示形态:**Table(表格,支持选中做批量操作)、Card(卡片)、List(简单列表)**——只有 Table 视图支持完整的选中/批量 Action 功能。
- **Filtering(过滤类)**:提供 Multiselect / Dropdown / Button / Date Range 等多种过滤器组件,搭配 **Linked Object Filter Sidebar**(更灵活的侧边栏过滤)、**Filter Sandbox Container**(过滤只影响视图局部)、**Filter Container**(预定义过滤器只作用于指定子集组件)。**要让过滤条件跨组件、甚至跨 tab 联动生效,必须在编辑器右侧 Settings 面板里打开"cross-filtering(交叉过滤)"开关**——这是个容易漏配的前置条件,配了过滤器但互相不联动,第一反应应该检查这个开关。
- **Layout(布局类)**:用容器类组件(Horizontal Distribution / Vertical Stack / Tabbed Container)组织页面视觉结构;**Conditional Container(条件容器)**可以根据用户 profile、或"某个属性/过滤条件是否命中"来决定内容显示/隐藏,常和上面的 Filtering 组件配合使用。
- **Apps and Files(应用与文件类)**:嵌入其他 Foundry 应用(Slate、Contour、Quiver 仪表盘等)、展示媒体预览、上传关联文件、评论组件等。**⚠️ 一个关键设计限制,容易被误用**:**这一类里很多组件"不感知对象(not object-aware)"**——例如 **Comments 组件的评论内容只存在于该 Object View 本地,不会真正写回到 Ontology 对象本身**(如果希望评论数据能在其他场景被复用/查询,应该改用批次4的 Action + Attachment 机制来正式捕获);**用 "Linked Files" 上传的文件确实存进了 Foundry,但并没有真正关联到该对象**(如果需要文件真正可复用,应该用 Action 的 attachment 机制);嵌入 Slate/Contour 虽然能传参,但**不支持发布/消费交叉过滤**,不能和 Charts 组件这类联动。

### 233. Generate Object View URLs(生成 Object View 链接)
https://www.palantir.com/docs/foundry/object-views/generate-urls/

- 两种链接格式:一种直接拼主键到 URL 路径里,另一种用**查询参数形式**——`/workspace/hubble/external/object/v0/<object-type-id>?<primary-key-property-id>=<primary-key-property-value>`,**当主键值可能包含特殊字符时,推荐用查询参数这种方式**,更不容易因为字符转义出问题。
- **要把 Object View 嵌入 iframe(而非作为普通链接)**,记得加上 `embedded=true` 查询参数,加载时会**隐藏 Workspace 侧边栏**,更适合嵌入场景的干净展示。

### 234. Comment on objects(在对象上添加评论)
https://www.palantir.com/docs/foundry/object-views/comment-on-objects/

> 该独立页面未能直接检索到完整正文。**需要特别提醒的一点区分**:第228-232条提到的 Legacy "Comments Widget" **明确不会写回到对象本身**(仅存在于该视图本地);而这一篇标题是平级的"Comment on objects"顶层功能页(不在 Legacy Widget 分类之下),**推测它讲的是一套更新的、真正与对象关联(object-aware)的原生评论机制**,和旧版 Comments Widget 是两回事。**如果你团队打算在 Object Views 里用评论功能沉淀协作记录,建议先查这篇原文,搞清楚具体走的是哪一套机制、评论数据到底存在哪里、能不能被其他工作流查询到**,避免重蹈"以为存进对象了,其实只是本地视图配置"的坑。

### 235. Add Object Views to a Marketplace product(打包进 Marketplace)
https://www.palantir.com/docs/foundry/object-views/marketplace-object-views/

- 通过 Foundry DevOps 把 Object View 打包分发。**⚠️ 硬性限制**:**Marketplace 产品只支持用"Workshop tab builder"构建的 tab,不支持 Legacy builder**——如果你要打包的视图里还有旧版 tab,**必须先用 Workshop tab builder 重建**才能打包分发,这是评估"能不能把这个视图分享给其他团队/客户环境"时的第一道检查关卡。

---

**应用层第三部分:Object Views(21篇)完成。累计三份笔记文件合计 235 篇。**

接下来是 **Ontology Manager**(约9篇,是你日常做 Ontology 建模改动时天天打交道的管理台应用本身)→ **Vertex**(约27篇,图谱可视化与因果分析)→ **Machinery**(约6篇)→ **Foundry Rules / Map / Dynamic Scheduling**(约80篇,篇幅最大的应用层部分)→ **Ontology architecture 后端**(约20篇)。回复"继续"或"下一批"以继续。
