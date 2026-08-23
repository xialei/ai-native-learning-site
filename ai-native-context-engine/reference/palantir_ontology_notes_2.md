# Palantir Foundry — Ontology 文档学习笔记(二)

> 承接第一份笔记文件 `palantir_ontology_notes.md`(已完成 Ontology building 总览、Ontologies、Object and link types、Action types,共约94篇)。本文件专门收录 **"Functions"** 大类(全站篇幅最大的一块,约68篇),因为体量太大,会拆成多个子批次持续追加到本文件里。

## 进度追踪(Functions 大类内部)

- [x] 子批次5a:Functions Overview / Getting started / Types reference / Branching functions / Function management(5篇)/ Function consumption(4篇)—— 共15篇 ✅ 已完成
- [x] 子批次5b:Language agnostic features(8篇)✅ 已完成
- [x] 子批次5c:TypeScript v2(3篇)+ Python(7篇)✅ 已完成
- [ ] 子批次5d:TypeScript v1(11篇,含 migration 指南)
- [x] 子批次5d:TypeScript v1(11篇)✅ 已完成
- [x] 子批次5e:Functions on objects(9篇)✅ 已完成
- [x] 子批次5f:Models(5篇)+ Aliases(3篇)✅ 已完成
- [x] 子批次5g:Unit testing(7篇)✅ 已完成 —— **Functions 大类(68篇)全部完成**

---

## 子批次5a:Functions 总览 / 版本管理 / 消费方式(15篇)

### 95. Overview(总览)
https://www.palantir.com/docs/foundry/functions/overview/

- **Functions(函数)让开发者编写能在运营场景(如仪表盘、应用)中快速执行的业务逻辑代码**,典型用途包括:给 Quiver 计算自定义指标/聚合、通过 external functions 查询外部系统来丰富 Ontology 对象、把 Python function 作为 Pipeline Builder 里的 sidecar 容器使用。
- **支持的语言是 TypeScript 和 Python**(具体是三个"变体":TypeScript v1、TypeScript v2、Python)。

### 96. Feature support by language(各语言功能支持对比)
https://www.palantir.com/docs/foundry/functions/language-feature-support/

- **只有 Python 和 TypeScript v2 支持 Ontology SDK(OSDK)**——可以直接在开发环境里操作 Ontology,并享受 Developer Console 兼容性和 OSDK 版本管理的好处,**官方推荐优先用这两者**。
- **TypeScript v2 相对 v1 的关键升级**:v2 运行在**完整的 Node.js 运行时**里(serverless 执行),支持 `fs`、`child_process`、`crypto` 等核心模块,能兼容更多需要文件系统访问、CPU 密集并行任务或系统级操作的 NPM 库——这对你团队要接第三方 NPM 依赖(比如调用自建 LiteLLM 网关的 SDK)是个重要考量点。
- **实操建议**:新项目优先选 **Python 或 TypeScript v2**;TypeScript v1 仅在维护存量代码或有特殊历史依赖时才继续用。

### 97. Getting started(快速上手)
https://www.palantir.com/docs/foundry/functions/getting-started/

- 三种语言起步方式基本一致:创建 code repository → 选对应模板(TypeScript v1 / TypeScript v2 / Python functions 模板)→ 写函数 → **Live Preview 调试**(和线上发布后的运行环境不同,CPU/内存/超时限制都不一样)→ Commit → **Tag version(打标签发布)**,发布后函数会进入 functions registry,平台内其他地方就能引用。
- **建议把要给 Workshop / Ontology 应用用的函数都放在同一个 repository 里,以降低成本**(这是个直接的成本优化建议)。

### 98. Types reference(类型系统参考)
https://www.palantir.com/docs/foundry/functions/types-reference/

- Functions 有一套跨语言的**注册类型系统**,和具体语言的原生类型做映射。几个容易踩坑的点:
  - **Integer vs Long**:Python 的 `int` 和 TS 的 number 在两者之间是模糊的——如果函数签名里直接写 Python `int` 或 TS 内建 number,**默认会被注册成 Integer**;要显式表达 Long,必须用 API 提供的 `Long` 类型。
  - **Long 类型在不同语言里的底层表示不同**:TypeScript v1 里 Long 是内建 `number` 的别名;**TypeScript v2 里 Long 是内建 `string` 的别名**(避免精度丢失);Python 里 Long 是内建 `int` 的别名。**这是从 TS v1 迁移到 TS v2 时最容易踩的坑之一——大数字段的类型表示方式变了**。
  - Double/Float 同理:Python `float` 直接写在签名里默认会被注册成 Double。
  - 支持 struct/struct list 承载对象类型实例:需要用 Ontology SDK 定义一个带对象类型字段的 custom type 作为输入。
  - Notification 返回类型包含 ShortNotification(站内展示用的精简版)和 EmailNotificationContent(可含 headless HTML 正文的邮件富文本版),Link 可以指向 URL、OntologyObject,或任意 Foundry 资源的 RID。

### 99. Branching functions(分支上的函数开发)
https://www.palantir.com/docs/foundry/foundry-branching/branching-functions/(在 Functions 目录下同名)

- 要支持 Global Branching,需要把 repository 升级到 `functions-typescript` 子模板 **0.903.0 及以上版本**。
- 可以开发依赖分支上资源变更(比如新建/修改的 Ontology 实体)的函数,但**目前不支持依赖分支版本的 query function**。
- 发布函数时可以指定一个 **version target(版本目标)**——代表分支合并回 main 时最终会发布的稳定版本;开发期间在分支上发布的都是**不稳定的预览版本**。
- **⚠️ 分支开发期间不会自动同步 main 上的新函数版本**(防止 main 上的开发干扰你的分支工作);如果 main 上有更新,函数版本选择器和 Ontology Manager 里会有提示,需要**手动 rebase** 才能拉取。
- **⚠️ 一个重要限制(和批次3提到的一致)**:**TypeScript v2 和 Python 函数目前不能在分支上被修改**——这条限制建议特别记住,团队做分支化开发流程规划时,函数这块目前只有 TypeScript v1 能真正在分支上改。

### 100. Function versioning(函数版本管理)
https://www.palantir.com/docs/foundry/functions/functions-versioning/

- 函数发布用**语义化版本(Semantic Versioning)**,版本一旦创建就**不可变**。核心规则:
  - **主版本号(major)为0(即 0.y.z)代表"初始开发阶段"**,函数随时可能变,不应被下游当作稳定版本依赖;
  - **破坏性变更 → 升主版本号**(如给函数签名加必填输入);
  - **向后兼容的新增功能 → 升次版本号**(如加可选输入、优化性能但不改变预期行为);
  - **向后兼容的 bug 修复 → 升修订号**。
- 严格遵循这套规范,是保证下游消费者(Workshop、Actions 等)能可靠依赖你函数的关键。

### 101. Manage published functions(管理已发布函数)
https://www.palantir.com/docs/foundry/functions/manage-functions/

- **配置继承机制**:发布新版本时,配置(如内存/超时设置)默认会按语义化版本规则,从**上一个稳定版本**继承下来(如果发布的是非稳定版,则从上一个版本继承,不管它是否稳定)。要用上这个特性,repository 模板版本要求:TypeScript v1 ≥ 3.512.0,Python ≥ 0.423.0。
- **⚠️ Function-backed action 的 Ontology 快照一致性**:一次 action 运行中,所有的读请求会**自动复用同一个 Ontology 快照**,好处是保证同一次执行内多次查询看到的数据是一致的(不会中途数据变了导致前后查询结果矛盾),同时因为复用快照,**读性能也会提升**。
- **内存限制细节**(不同语言/执行模式差异较大,做容量规划时要对号入座):
  - 函数执行统一限制 **128MB 内存**(这个限制很少被真正触达,通常先撞到时间限制或对象加载数量限制);
  - **部署式(deployed)Python 函数默认 2GB 内存**,且目前**无法在配置页面调整**;
  - **Serverless 函数默认 1024 MiB**,可在配置页面调整范围为 **512 MiB ~ 5120 MiB**。
  - TypeScript v1 函数执行是**单线程**,同一时刻只能跑一个计算。

### 102. Add functions to a Marketplace product(打包进 Marketplace)
https://www.palantir.com/docs/foundry/functions/marketplace-functions/

- **⚠️ 源码可见性差异**:通过 Foundry DevOps 打包函数进 Marketplace 产品时,**TypeScript v1 函数不会带用户可见的源码**(装完能用,但配套 repository 是空的,看不到具体逻辑);**Python 和 TypeScript v2 函数则会带用户可见的源码**——但生产模式安装后依然**不能编辑**。这对你评估"要不要把 Ontology 抽取逻辑打包分发给客户环境"很关键:如果不想让客户看到实现细节,可以考虑用 TS v1 打包;如果希望透明可审计,用 Python/TS v2。
- 支持**可覆盖的静态函数(overridable static function)**机制:用 `@Static()` 装饰器标注某个函数参数,允许安装方在自己的环境里提供自定义逻辑覆盖默认行为——适合做"预留可定制业务逻辑插槽"的产品化设计。

### 103. Function monitoring(函数监控)
https://www.palantir.com/docs/foundry/functions/monitoring/

- 支持四种监控规则(比 Action 的监控更细分):**Function duration p95**(P95执行耗时超阈值)、**Number of function failures in window**(窗口内总失败数超阈值,统计所有失败类型)、**Number of user-facing function failures in window**(仅统计函数代码主动抛出的用户可见错误)、**Number of non-user-facing function failures in window**(排除用户可见错误,专门用来监控基础设施/系统级故障)。
- **这个"用户可见错误 vs 系统级错误"的区分很实用**——可以分别对"业务逻辑问题"和"平台/基础设施问题"设置不同的告警策略和responsible团队。

### 104. Instrumentation and telemetry(埋点与遥测)
https://www.palantir.com/docs/foundry/functions/instrumentation-telemetry/

- 函数可以主动发出遥测数据用于监控和调试:所有函数类型都会**自动生成一个覆盖整体执行时长的 span,以及一条 request log**。
- **TypeScript v2 和 Python 函数会自动为所有出站网络请求插桩**(自动生成 span),也支持手动加自定义 span;**TypeScript v1** 则只有产品预定义的一些操作(如对象加载、查询执行)会生成 span。
- 底层用的是标准的 **OpenTelemetry SDK**(TS v2/Python 场景下 Foundry 会配置好全局 tracer provider),第三方库要接入追踪也要通过这个全局 tracer——这对你团队如果想把函数执行链路和外部可观测性系统(如自建的 Prometheus/Grafana 或 LiteLLM 的监控)打通是个直接的技术接口。

### 105. Permissions(权限)
https://www.palantir.com/docs/foundry/functions/permissions/

- **执行已发布函数的前提**:用户必须对该函数所在的 repository 有 **Viewer 角色**。
- **最佳实践建议**:把函数 repository 放在**和依赖它的终端应用(Workshop/Slate等)同一个 Project 里**,便于权限统一管理。
- 导入 backing datasource 时,如果 object type 开启了行级安全(row-level security),导入对话框会提示你导入 **Restricted View** 而不是普通 dataset。

### 106. Use functions in the platform(在各应用里使用函数,批次1曾提及,此处补全)
https://www.palantir.com/docs/foundry/functions/use-functions/

- **Workshop**:大部分 Workshop 变量都可以由函数支撑(function-backed),默认在其依赖的变量更新时**自动重新计算**——比如用户编辑了一个输入组件,依赖它的 Object Set 变量会自动重算。
- **Action**:function-backed action 通过 **Ontology edits API** 定义对象该如何更新,能表达复杂编辑逻辑(如"更新某起始对象所有关联对象");Action 也能配置函数生成的 Notification 内容、以及函数计算出的 Webhook 参数。
- **Slate**:有自己独立的"functions"概念(文档内嵌的 JavaScript 代码片段,位于 Platform 标签页),和 Foundry Functions 是两回事——两者可以配合使用,比如用 Foundry Function 取数据、再用 Slate Function 加工展示。

### 107. Function metrics(函数指标)
- 和批次4里 Action metrics 是同源功能(2025年12月更新:引入近实时的 P95 耗时指标、连续更新的指标数据、以及过去7天完整运行历史的链接,原来指标更新最长可能要延迟一天)。Ontology Manager 里对每个函数都有对应的指标看板。

### 108. Optimize performance(性能优化,建议重点关注)
https://www.palantir.com/docs/foundry/functions/optimize-performance/

- **成本构成三部分**:①**固定开销**——每次函数执行不管做什么,固定消耗 **4 compute-seconds**;②**计算时间**——函数实际执行所需的 vCPU 时间;③**外部调用**——调用平台其他能力(Ontology 查询、模型推理、LLM 调用)会产生各自独立的额外开销。**这对你估算 ontology extraction 系统调用 Kimi/GLM 模型的整体成本模型很直接相关**——每次函数调用的固定4秒开销在高频小函数场景下可能占比不小,值得在设计粒度时纳入考量。
- **Performance 标签页**(在 functions helper 里,函数跑完后可看):瀑布图展示各操作耗时分布,标出 "Execute function"(执行函数代码的 CPU 时间)、"Load objects from arguments/links"(调用底层 Ontology 后端服务 OSS 花的时间)等阶段。
- **优化建议**:
  - 用 **Objects API** 做聚合和链路遍历比在函数代码里手写循环更快;
  - **确保对 Ontology 后端的多次调用是并行发起的**,避免串行等待;
  - **复杂计算可以用异步执行来并行化**——为对象集合里的每个对象并行发起计算,而不是逐个顺序算。

### 109. Version range dependencies(版本范围依赖)
https://www.palantir.com/docs/foundry/functions/version-range-dependencies-for-functions/

- **重要新能力**(2025年6月上线):以前 Foundry 应用(Workshop、Actions、Automate)只能依赖函数的**固定版本(pinned version)**;现在可以依赖一个**版本范围**,实现运行时自动升级——**函数升级到新版本时,消费方零停机自动跟进**,不用每次手动改配置。
- 版本范围的语义**借鉴自 NPM**(如 `>=1.0.0 <2.0.0`),依据语义化版本的优先级规则判断某版本是否"满足"某个范围。
- **⚠️ 当前限制**:Workshop 和 Actions 目前**只允许版本范围包含"向后兼容"的版本**(即只能做 minor/patch 级别的自动升级),**不支持自动升级到破坏性的 major 版本**——这也是为什么"严格遵循语义化版本规范"变得比以前更重要:如果你不小心把一个破坏性变更打成了 minor 版本号,依赖你函数的下游应用会被自动升级过去,直接炸掉。

---

## 子批次5b:Language agnostic features(跨语言通用能力,8篇)

### 110. Ontology edits — Overview(Ontology 编辑机制总览)
https://www.palantir.com/docs/foundry/functions/edits-overview/

- **Ontology edit = 创建、修改或删除一个对象的行为**。函数可以返回 Ontology edit,供 function-backed action 使用。
- **⚠️ 一个极其重要、容易被误解的机制**:在 Authoring 的 functions helper 里**直接运行**一个 Ontology edit 函数,**并不会真的把编辑应用到实际对象上**——唯一能真正落地更新对象的方式,是把这个函数**配置成 function-backed action** 并去执行这个 action。这意味着你可以放心地在 helper 里反复跑 edit 函数来验证各种输入的结果,不用担心把线上数据搞坏。
- **⚠️ 编辑后立即查询可能看不到最新结果(caveat)**:任何 `Objects.search()` 查询,只要结果依赖于你刚编辑过的属性/链接(比如过滤条件、Search Around、聚合都用到了这个字段),都会用**旧的对象/属性/链接数据**,不一定反映刚才的编辑(包括新建和删除)——函数必须自己手动处理这种情况。但**如果是通过主键直接取回你已经编辑过的那个具体对象**,函数基础设施会在该对象被"物化"取用时**应用你还未提交的挂起编辑**,所以拿到的是编辑后的值。**这个"批量查询 vs 单个主键取回"结果不一致的坑,是写复杂 ontology edit function 时最容易踩、也最难调试的一类 bug,建议写单测时专门覆盖这种场景**。
- 编辑会被**智能合并**:比如"先创建对象、再更新它的属性"最终只会产生一条 Create Object 编辑(属性变更包含在里面);对同一对象多次属性更新会合并成一条 Update Object 编辑;如果对象最后被删除,之前所有对该对象的属性编辑都会被删除操作**清空抹去**。
- TypeScript v1 里,编辑被收集在**函数整个执行生命周期内的单一 edit store** 里,因此可以把编辑逻辑拆到没有被单独标注为"edit function"的辅助函数里调用,edit 依然会被正确收集(但整个函数必须整体执行成功,才会生成最终传给 Actions 服务做原子事务的 edit 列表——这也是为什么 Ontology edit 函数的返回类型必须是 `void` 或 `Promise<void>`,真正的"返回值"其实是编辑列表)。

### 111. Publish and call query functions through API gateway(通过 API 网关发布/调用 Query 函数)
https://www.palantir.com/docs/foundry/functions/query-functions/

- 用 `@Query`(TS)/等价装饰器 给函数指定一个**固定的 `apiName`**,即可通过 **API gateway** 直接调用这个函数,不需要走常规的函数版本引用机制。
- **⚠️ API-named 的 query 永远只用"最新已打标签的版本"**,**不遵循**其他 Foundry 函数的语义化版本管理范式——这意味着改了逻辑并发新 tag 会**立即影响所有通过该 apiName 调用的消费者**,没有"版本兼容性缓冲"。
- 如果要"断开"某个 apiName(废弃它)、或者要做不破坏现有消费者的升级,推荐做法是:**把函数代码复制一份,给新版本起一个新的 apiName**(比如从 `getReschedulableAircraftCount` 升级成 `getReschedulableAircraftCountV2`),让消费者自主选择何时切换,而不是直接改已有 apiName 背后的逻辑。**这条建议对你团队设计对外(跨环境/跨客户)暴露的 Ontology query API 尤其重要**。

### 112. Configure notifications(配置通知)
https://www.palantir.com/docs/foundry/functions/configure-notifications/

- 除了用 Notification API 自定义通知内容,还可以**用函数动态计算收件人列表**——写一个返回 `User`/`Group`(或统一的 `Principal` 类型)列表的函数,比如"根据 Issue 对象,同时返回当前 assignee 和 reporter"。这让通知收件人可以完全基于对象数据动态确定,而不是写死。

### 113. Make API calls from functions(从函数发起外部 API 调用)
https://www.palantir.com/docs/foundry/functions/api-calls/

- 要从函数调用外部系统,必须先在 **Data Connection** 里配置好对应 source(且该 source 要开启"允许导出"和"允许导入到 Code Repositories"这两项)。
- 一个常见模式:**调用一个 OAuth 保护的外部 API,把结果喂给一次 Ontology edit**,再通过 function-backed action 把这整个流程暴露出去。
- **⚠️ 排障提示(容易踩的坑)**:Webhook 和函数的运行时环境并不完全一致——有时候 webhook 测试是通的,但函数里发起同样的 API 调用却报 `UNABLE_TO_GET_ISSUER_CERT` 证书错误,需要检查 source 里证书链是否配置完整。**第三方 HTTP client 库目前尚不支持 serverless 执行模式**——这点在你评估用哪种运行时接第三方 SDK(比如调用自建模型网关)时要提前确认。

### 114. Use platform APIs with the Foundry platform SDK(用 Foundry platform SDK 调用平台 API)
https://www.palantir.com/docs/foundry/functions/platform-sdk/

- Foundry platform SDK 让你在函数里方便地调用 Foundry 自身的各类 API(管理/治理工作流、Schedule 和 Build 交互、Media set 访问等)。
- **只有 Python 和 TypeScript v2 支持"一等公民"级别的鉴权**(TypeScript v1 不支持)——这是团队评估语言选型时的又一个明确信号:优先用 Python 或 TS v2。
- 安装方式:在 code repository 的 Libraries 侧边栏搜索 `foundry-platform-sdk`(Python)或 `@osdk/foundry`(TypeScript)。示例代码展示了怎么用这套 SDK 调用**语言模型(LLM)**或查询 media set——这对你团队接入 Kimi/GLM 类模型、或处理多模态数据非常直接相关。

### 115. Deploy functions(部署函数:Serverless vs Deployed)
https://www.palantir.com/docs/foundry/functions/functions-deployed/

- **两种执行模式**:**Serverless**(如果环境开启了该能力,新 repository 默认用这个,官方**大多数场景都推荐 serverless**,维护成本更低,不用为长期运行的部署承担持续成本)和 **Deployed(长驻部署)**。
- **Deployed 模式的额外能力**:因为进程长期存活,**可能支持本地缓存**(如果函数能容忍重启);此外 deployed 模式支持一些 serverless 目前还不具备的特性。
- **⚠️ Serverless 的一个明确限制**:支持通过 source 提供的 client 访问外部数据源,但**不支持第三方 client 库**——和上一条 api-calls 里提到的坑呼应,这是你评估函数运行时选型时必须提前确认的硬约束。

### 116. User-facing errors(面向用户的错误)
https://www.palantir.com/docs/foundry/functions/user-facing-error/

- 通过抛出专门的 **`UserFacingError`** 类型(TS v1/v2、Python 各自有对应导入路径),可以让函数把一段**对终端用户友好、可读的错误信息**直接传递到调用它的应用(如 Workshop、Action 提交失败提示)界面上——**这正好对应批次4"Function monitoring"里提到的"user-facing vs non-user-facing failures"这套区分机制的源头**:主动抛 `UserFacingError` 的失败,会被归为"用户可见错误",可以单独统计和告警,和底层系统性错误分开处理。

### 117. Streaming functions(流式函数)
https://www.palantir.com/docs/foundry/functions/streaming-functions/

> 该页面未能直接检索到完整正文,以下基于 Foundry Query API 里对应的 `streamingExecute` 接口整理:

- Foundry 提供一个 **`streamingExecute`** 接口,用于以 **NDJSON 流**的形式执行并返回某个 Query 函数的结果(区别于 batched 一次性返回全部结果),适合"结果集较大、希望边生成边消费"的场景——如果你团队要做面向 Ontology 的大规模检索/生成式接口,这是个值得关注的执行模式。

---

## 子批次5c:TypeScript v2(3篇)+ Python(7篇)—— 官方推荐主力语言

### 118. TypeScript v2 — Getting started
https://www.palantir.com/docs/foundry/functions/typescript-v2-getting-started/

- 写函数的位置很关键:必须放在 `typescript-functions/src/functions` 目录下,**文件名必须和函数名完全一致**(比如函数 `myFunction` 必须写在 `myFunction.ts` 里),用 `export default` 导出——和 TS v1 "必须包在一个类里、从 index.ts 统一导出"的写法完全不同,**这是从 v1 迁移到 v2 时最直观的结构性变化**。支持子目录分组相关函数。
- 函数发布时依据**文件路径**唯一标识,输入输出类型必须遵循 Types reference 里定义的受支持类型。

### 119. TypeScript v2 — Ontology edits(批次5b已引用,此处补充 TS v2 专属细节)
https://www.palantir.com/docs/foundry/functions/typescript-v2-ontology-edits/

- 可以通过 interface 类型调用 `.delete()` 方法删除对象;**interface 和 object 类型的 struct 属性都可以在 TS v2 函数里编辑**(TS v2 里 struct 类型用 TypeScript interface 定义,字段名要和 Ontology struct 属性的 API name 对应)。
- 和 Python 一样,**必须显式声明会编辑哪些实体类型**(用 `@osdk/functions` 包导出的 `Edits` 类型),而 TS v1 只需要 `void` 返回类型即可(参见批次5a的 Types reference)。

### 120. TypeScript v2 — Staged writes
https://www.palantir.com/docs/foundry/functions/typescript-v2-staged-writes/

> 该页面未能直接检索到完整正文。根据页面标题及 TS v2 Ontology edits 机制推断:"Staged writes(暂存写入)"应该是描述 TS v2 函数在一次执行内如何**暂存/累积多个编辑操作、最后统一提交**的底层写入模式,和批次5b "Ontology edits Overview" 里提到的"编辑会被智能合并"机制是同一套底层逻辑在 TS v2 API 层面的具体呈现。**如果你近期要写复杂的 TS v2 edit function,建议直接打开这个原始页面精读**,笔记这里先留空以免给出不准确的细节。

### 121. Python — Getting started
https://www.palantir.com/docs/foundry/functions/python-getting-started/

- 建仓库时选 "Python functions" 模板,函数写在 `python-functions/python/python-functions/my_function.py`,用 `@function` 装饰器标注(来自 `functions.api`),例如:`@function def my_function() -> String: return "Hello World!"`。
- **同样建议**(和批次5a的建仓库建议呼应):**把要给 Workshop 或 Ontology 应用用的所有函数都放进同一个仓库,以最小化成本**。
- 完整发布流程:写函数 → functions helper 里 Live Preview 试跑 → Source control 标签页 Commit → Branches → Tags and releases → New tag 打版本发布。

### 122. Python — Functions on objects
https://www.palantir.com/docs/foundry/functions/python-functions-on-objects/

- 通过 `FoundryClient().ontology.objects.<ObjectType>.where(...)` 这种链式 API 直接查询 Ontology 对象集(比如 `Aircraft.object_type.capacity > 100`)。
- **Beta 特性**:Python OSDK 支持和 **pandas DataFrame 互操作**——可以直接对一个 object set 调用 `.to_dataframe()`,拿到 pandas DataFrame 后用标准 pandas 语法做聚合(如 `df['capacity'].sum()`)。**这对你团队如果想在函数里做更复杂的统计分析、或者想复用现有 pandas 处理逻辑非常方便**。

### 123. Python — Create a custom aggregation
https://www.palantir.com/docs/foundry/functions/python-functions-create-custom-aggregation/

> 该页面未能直接检索到完整正文。结合 "Function consumption → Use functions in the platform" 页提到的"用函数给 Quiver 计算自定义指标/聚合"、以及批次5a 提到的 **Aggregation API 参考文档**,可以推断该页讲的是:当 Foundry 内置的标准聚合方式(Sum/Average/Count等,即批次3提到的 Property reducers)不能满足需求时,如何用 Python 函数编写自定义聚合逻辑,供 Workshop/Quiver 图表调用。

### 124. Python — Ontology edits(批次5b已引用,此处补充 Python 专属写法)
https://www.palantir.com/docs/foundry/functions/python-ontology-edits/

- **编辑对象的标准写法**:先通过 `FoundryClient().ontology.edits()` 拿到一个 **edits 容器**,用 `ontology_edits.objects.<Type>.create(primary_key)` 创建新对象(可以直接在 create 时连带传入属性值)、用 `ontology_edits.objects.<Type>.edit(existing_object)` 获取一个可编辑视图去修改已有对象,最后统一 `return ontology_edits.get_edits()`。
- 函数必须用 `@function(edits=[Employee, Ticket])` 这种形式**显式声明会编辑哪些对象类型**(这是 Python/TS v2 相对 TS v1 的一个显式化改进——TS v1 靠 `@Edits([...])` 装饰器 + `void` 返回类型隐式表达)。
- **⚠️ 数组属性的编辑坑**:可编辑对象上的**数组属性是只读的**,不能直接 `.append()`;正确做法是**先拷贝成新数组、改新数组、再整体赋值覆盖原属性**(`array_copy = list(obj.my_array_property)` → 改 `array_copy` → `obj.my_array_property = array_copy`)——这是写 Python edit function 时一个具体、容易踩的语法坑。
- 同一次函数执行内,**后续访问刚编辑过的属性会拿到新值**(即便对象本身还没真正持久化),但原始的不可编辑对象实例不会反映这个变化。

### 125. Python — Use Python functions in Pipeline Builder
https://www.palantir.com/docs/foundry/functions/python-functions-builder/

- **Python 函数在 Pipeline Builder 管道里是以 sidecar 容器的方式运行的**——好处是**不需要单独部署,会随管道规模动态伸缩**。Pipeline Builder 同时支持 Java 和 Python 两种 UDF(用户自定义函数)。
- 导入方式:打开目标 Pipeline Builder 管道 → Reusables → User-defined functions,把已发布的 Python 函数导入进来当作管道节点使用,还能在管道里预览效果(和普通 transform 类似)。
- 想在管道里的 UDF 里访问外部系统:需要发布一个"具备外部系统访问权限"的 Python 函数,且相关 source 必须配置为"可导入进管道"。

### 126. Python — Use Python functions in Workshop
https://www.palantir.com/docs/foundry/functions/python-functions-workshop/

- 在 Workshop 的 Variables 标签页可以直接搜索已发布的 Python 函数,**serverless 和 deployed 两种函数都能被找到**——但 **deployed 函数需要手动启动部署**(在函数选择器里点信息图标 → Configure → Create and start deployment),状态分 Running(可服务请求)/ Stopped(不可用)两种;**serverless 函数则不需要手动部署,任意版本随时可跑**。
- **Function-backed 列**:配置好符合条件的函数后,可以在 Object Table 部件里配置"函数支撑的属性列"——函数接收一批被选中的对象(一个 object set),返回一个 `{对象: 计算值}` 的字典,让每一行动态展示函数算出来的值(也支持一次返回多列)。

### 127. Python — Local development(本地开发)
https://www.palantir.com/docs/foundry/functions/python-functions-local-development/

- 支持在本地环境高速迭代 Python functions 仓库代码,但**改动最终仍需要 push 回 Foundry 才能真正发布产物,或者跑 checks/build**。
- **环境前置要求**:必须安装 **Java 17**,并正确设置 `JAVA_HOME` 环境变量(Windows 用 PowerShell 的 `SETX`,Linux/macOS 用 `export`);还要确保仓库已经升级到最新的模板版本;并确保 `CI`、`JEMMA`、`CA` 这几个环境变量**没有**被设置(否则本地开发流程可能出问题)。**如果你团队要给成员配置本地 Python functions 开发环境,这条 Java 17 + 特定环境变量清空的要求值得写进 onboarding checklist**。

---

## 子批次5d:TypeScript v1(共11篇)—— 存量维护向,新项目请优先 v2/Python

> 官方在每一篇 TS v1 文档开头都反复强调:**"我们推荐迁移到 TypeScript v2"**。这批笔记侧重"和 v2 的关键差异 + 存量代码排障要点",细节写法不再重复展开。

### 128. Getting started
https://www.palantir.com/docs/foundry/functions/typescript-v1-getting-started/

- 和 v2 的核心结构差异(批次5c已提):v1 函数必须写成 **TypeScript 类的方法**,类必须从 `functions-typescript/src/index.ts` **统一导出**;方法上打 `@Function()` 装饰器。

### 129. Migrate from TypeScript v1 to TypeScript v2(完整迁移指南,建议重点看)
https://www.palantir.com/docs/foundry/functions/typescript-v2-migration/

这是评估存量 v1 代码迁移成本最直接的一篇,关键差异点汇总(部分在批次5a/5c已提及,这里做个完整清单方便你评估工作量):

| 维度 | TypeScript v1 | TypeScript v2 |
|---|---|---|
| 发布方式 | 类方法 + `@Function()` 装饰器,从 index.ts 导出 | 单文件 `export default`,文件名=函数名 |
| 日期/时间类型 | `LocalDate` / `Timestamp`(来自 `@foundry/functions-api`) | `DateISOString` / `TimestampISOString`(ISO 8601 字符串,来自 `@osdk/functions`),**可以直接用 NPM 生态的 dayjs/date-fns/luxon** |
| 唯一 ID 生成 | `Uuid` from `@foundry/functions-utils` | (v2 有对应替代机制,建议查阅 Ontology edits 章节) |
| Edit 函数返回类型 | 必须是 `void`(编辑靠 `@Edits([...])` 装饰器隐式声明) | **必须显式 `return` 一个 Ontology edits 列表** |
| Ontology 访问 | 内置 `@foundry/ontology-api` 生成绑定 | **一等公民级 OSDK 支持**,代码可以在平台内外复用 |
- **结论**:这不是简单的语法替换,而是**执行模型、类型系统、编辑返回方式都变了**的一次结构性迁移——如果你团队有存量 v1 函数,建议按"新功能一律用 v2 写、旧函数视复杂度择机重写"的策略推进,而不是搞一次性批量迁移。

### 130. Decorators(装饰器体系)
https://www.palantir.com/docs/foundry/functions/decorators/

- v1 函数必须用以下装饰器之一(均来自 `@foundry/functions-api`):**`@Function()`**(普通函数)、**`@OntologyEditFunction()`**(编辑函数,可选配 `@Edits([object type])` 显式声明会编辑的对象类型——**不声明的话系统会靠静态代码分析尽力自动推断**,但推断可能失败,官方强烈建议显式声明)、**`@Query({ apiName: "..." })`**(发布为可通过 API gateway 调用的只读查询,对应批次5b的 query-functions)。

### 131. Ontology edits(v1 写法,批次5b/5c已引用核心机制,此处补 v1 语法细节)
https://www.palantir.com/docs/foundry/functions/api-ontology-edits/

- v1 编辑属性的写法非常直接:**直接对属性重新赋值**即可(`employee.lastName = "Smith"`),不需要像 Python/v2 那样先获取一个专门的"可编辑视图"。
- **⚠️ 静态分析可能失效**:Functions 平台会对代码做静态分析来自动探测涉及哪些对象类型,**但静态分析可能探测失败**——这也是为什么官方强烈建议**始终显式**用 `@Edits([...])` 声明,而不是依赖自动推断。

### 132. Generate unique IDs for new objects(生成唯一ID)
https://www.palantir.com/docs/foundry/functions/edits-generate-id/

- 写"创建对象"的 edit 函数时,用 `@foundry/functions-utils` 包(默认已安装,缺失时需要手动在 package.json 里加 `"@foundry/functions-utils": "0.1.0"` 并重启 Code Assist)里的 **`Uuid.random()`** 生成全局唯一 ID 作为新对象主键。

### 133. Error types(错误类型)
https://www.palantir.com/docs/foundry/functions/typescript-error-types/

- 除了声明返回类型,v1 函数还可以显式声明**错误类型**:用 `FunctionsError<Name, Payload>`(来自 `@foundry/functions-api`)定义具体错误、可以用联合类型组合多种可能错误;再用 **`FunctionsResult<Output, Error>`** 把"成功值/错误值"包装成统一返回类型;调用方用 **`isOk`/`isErr`** 类型守卫区分成功/失败分支。这套机制特别适合发布为 **Query**(只读查询)时,给消费方一个结构化、类型安全的错误处理接口,而不是简单抛异常。

### 134. Handle undefined values(处理 undefined)
https://www.palantir.com/docs/foundry/functions/undefined-values/

- 因为属性可能没有实际值,访问 Ontology 对象属性时 TypeScript 类型是 `T | undefined`,**编译器会强制要求你显式处理 undefined 情况**。两种处理方式:①**显式判空**(更安全,可以抛出更明确的错误信息);②**用非空断言操作符 `!` 强行忽略**(代码更简洁,但一旦运行时真的是 undefined,会抛出难以定位的隐晦错误)——**建议团队代码规范里明确:除非非常确定不会为空,否则优先用显式判空,别滥用 `!`**。
- **数组属性是只读的 `ReadOnlyArray` 类型**(和批次5c提到的 Python 数组只读机制是同一个设计理念,只是 TS 里用类型系统强制表达)——修改数组属性必须整体替换成新数组。
- 遍历 1:1 / 多:1 链接时,取到的关联对象同样可能是 `undefined`(没有关联对象的情况),需要同样的 undefined 处理套路。

### 135. Debug functions(调试)
https://www.palantir.com/docs/foundry/functions/debug/

- Code Repositories 内置调试器,可以给单元测试**打断点**,暂停执行后检查变量、查看调用栈帧(frame,显示函数名+文件名+行号)、并在断点处的上下文里用**控制台执行 JavaScript 命令**做即时探查(⚠️ 只能操作当前选中帧的局部变量,跨帧操作会报错)。这套调试能力对单元测试和普通函数调试都适用。

### 136. Import resources into Code Repositories(资源导入侧边栏)
https://www.palantir.com/docs/foundry/functions/resource-imports-sidebar/

- **Resource imports 侧边栏**是管理"导入进 v1 functions 仓库的 Foundry 资源"的统一入口:Ontology 类型(object/link type)、LMS 语言模型、live deployment、外部系统(REST API 等)都从这里导入/移除/查看依赖详情。
- **导入 Ontology 类型前必须先选定一个 Ontology**(选择器会在你第一次导入类型时弹出;如果已经导入过至少一个类型,后续会自动沿用同一个 Ontology)。
- 资源之间可能有依赖(比如 link type 依赖它所属的 object type);**资源必须有 API name 才能在代码里被引用**,缺失时侧边栏会给出警告并提供"一键配置 API name"的入口。

### 137. Add NPM dependencies(添加 NPM 依赖)
https://www.palantir.com/docs/foundry/functions/add-dependencies/

- 在 Code Repositories 的 **Libraries 侧边栏**搜索并添加 NPM 包(结果同时来自 Foundry 内部仓库和公共 npmjs.com,需要先手动开启"从公共 npm registry 拉取依赖"的开关)。
- **⚠️ 硬限制(v1 特有,v2 已经解除)**:**v1 函数运行时只支持纯 JavaScript 库——任何依赖 Node.js 运行时、会发起系统调用的包都不支持**,这正是批次5c反复强调"v2 支持完整 Node.js 运行时(fs/child_process/crypto 等)"这个优势的直接体现。文档还专门举了个真实变通方案:v1 里如果依赖用到了 `fs` 模块(比如解析 PDF 之类需要文件系统的库),可以**引入一个内存文件系统库(如 `memfs`)、把它 alias 成 `fs`** 来绕过限制——但这终归是个 workaround,如果这类需求较多,**是时候评估切到 v2 了**。

### 138. Use webhooks(v1 专属,批次4的 Action 侧 webhook 是另一回事,这里是"从函数里调 webhook")
https://www.palantir.com/docs/foundry/functions/webhooks/

- Webhook 可以被发布成**一等公民函数**,直接被 Workshop、OSDK、Actions、其他函数调用。
- **最佳实践清单**:先用 Data Connection 里的"测试 webhook"侧边面板充分测试,再接入函数;webhook 输入输出优先用**具体的 record 类型**而不是裸 JSON(减少运行时报错概率);用内置的 `isOk`/`isErr` 判断成功/失败,并通过 `name` 字段细分错误类型;**⚠️ 如果一次函数调用里既要写外部系统、又要写 Ontology,要记住"写外部系统成功"不代表"写 Ontology 也一定成功"——两者不是原子操作,务必单独处理失败分支**。

---

## 子批次5e:Functions on objects(三语言通用的 Ontology 数据访问 API,共9篇)

### 139. Overview
https://www.palantir.com/docs/foundry/functions/functions-on-objects/

- 正因为函数对 Ontology 有原生支持,Foundry 的 functions **比常见的 FaaS(Functions-as-a-Service)平台能力更强**:原生支持数据的存储、检索、修改,并且**统一继承 Foundry 的数据安全、血缘(lineage)、透明性保障**——这是这套体系区别于"裸 serverless 平台"的核心价值主张。

### 140. Getting started
https://www.palantir.com/docs/foundry/functions/foo-getting-started/

- 要在函数里用某个 object/interface/link type,**必须先把它导入到该 repository 所在的 Project 里**(通过 Resource Imports 侧边栏)。
- **⚠️ Live Preview 里测试涉及 Notification 的函数要小心**:Live Preview 环境下**不会真正校验收件人权限**,所以"函数在 Live Preview 里成功执行"不代表它在生产环境的 Action 里也一定成功——收件人权限不足会导致生产环境失败,但 Live Preview 测试不出这个问题,**这是个容易被漏测的坑,发布前建议专门用低权限账号在真实 Action 里验证一次通知类逻辑**。

### 141. Object identifiers(对象标识符)
https://www.palantir.com/docs/foundry/functions/object-identifiers/

- 每个 Ontology 对象在函数里有一个 `rid: string | undefined` 字段。**为什么可能是 undefined**:如果这个对象是你在函数里刚创建出来的(还没真正落地持久化),此时它还没有 RID;已存在的对象则一定有确定的 RID。
- 对象也可以用 **object type + primary key** 的组合唯一标识——**所有 Ontology 对象(含新建的)都一定有 `typeId` 和 `primaryKey` 字段**,因为创建对象时必须提供主键。
- **⚠️ 同一个 Ontology 对象,可能在函数里被表示成多个不同的 JavaScript 对象实例**(比如同一个对象被搜索加载了两次,或者既作为参数传入、又通过搜索单独加载了一次)——这个"同一实体、多份内存副本"的现象,是排查"我明明改了这个对象,怎么另一处代码看到的还是旧值"这类 bug 时的关键背景知识。

### 142. Create a custom aggregation(自定义聚合,承接批次5c的 Python 版)
https://www.palantir.com/docs/foundry/functions/create-custom-aggregation/

- 典型场景:Workshop 原生的聚合能力算不出你要的指标(比如"未来6个月各部门预估支出")时,写一个函数:先用 Objects API 做标准聚合(按部门分组、按月分段、求和)拿到基础聚合结果,再在**内存里对聚合结果做二次加工**(比如用最后一个月的值线性外推出未来6个月的预测值),最后把加工后的结果返回,供 Workshop 图表直接展示。

### 143. Import object, interface, and link types(导入 Ontology 类型到代码)
https://www.palantir.com/docs/foundry/functions/ontology-imports/

- 导入后,代码里通过 **`@foundry/ontology-api`** 包(若使用私有 Ontology,则包名会带上该 Ontology 的 API name 后缀,如 `@foundry/ontology-api/<ontology-api-name>`)引用这些类型;`Ctrl+click` 该包名可以在 Code Assist 里直接跳转查看所有当前可导入的合法对象类型。若你对多个 Ontology 有权限,导入时可以用选择器指定具体用哪一个。

### 144. Objects and links(对象与链接 API,批次5b/5d已多次引用,此处补充核心 API 形态)
https://www.palantir.com/docs/foundry/functions/api-objects-links/

- 每个已导入的 object type 会被转换成对应语言的接口/类型:属性映射成字段(用 Ontology 里配置的 API name 命名,点号访问);**数组属性映射成只读数组类型**(修改必须整体替换,这是三语言通用的设计原则,批次5c/5d都提到过对应版本的实现方式)。
- **Link 遍历**:1:1 或 多:1 方向的链接字段类型是 `SingleLink`,用 `.get()`/`.getAsync()` 取到(可能是 `undefined`,因为不一定存在关联对象);1:多 或 多:多 方向的链接字段类型是 `MultiLink`,用 `.all()`/`.allAsync()` 取到一个数组(没有关联对象时返回空数组,而非 undefined)。
- **⚠️ 性能提醒**:遍历链接的代价可能很高,因为后端需要额外查询哪些对象互相关联——这是批次5a "Optimize performance" 里"确保对 Ontology 后端的多次调用并行发起"这条建议的具体应用场景之一。

### 145. Object sets(对象集 API)
https://www.palantir.com/docs/foundry/functions/api-object-sets/

- **`Objects.search()`** 是发起对象搜索的统一入口,链式调用 `.filter()`(基于可搜索属性过滤)、`.groupBy()` + `.sum()`/等聚合方法、最后 `.all()`/`.allAsync()` 拿到具体列表。也可以直接把一个对象数组/RID 列表/已有 object set 的 RID 传给某类型的搜索方法来构造 object set。
- **过滤能力**细节:`Filters` API 支持 `.and()`/`.or()` 组合多个过滤条件;字符串支持 `.prefixOnLastToken()`(前缀匹配,最后一个词做前缀模糊)、`.matchAnyToken()`/`.fuzzyMatchAnyToken()`(任意词匹配/模糊匹配,模糊匹配可传 `Fuzziness` 参数,语义借鉴 ElasticSearch);数值/日期/时间戳支持 `.range()` 系列(`.lt()`/`.lte()`/`.gt()`/`.gte()`);布尔值支持 `.isTrue()`/`.isFalse()`。
- **⚠️ 硬约束**:**过滤、排序、聚合只能作用于开启了 Searchable render hint(可搜索渲染提示)的属性**——这个渲染提示正是批次3提到的"影响索引性能"的那个机制,如果你发现某个属性没法用来过滤,先去 Ontology Manager 检查它是否开了 Searchable。
- **性能建议**:**函数入参优先用 Object set,而不是具体的对象数组**——Object set 是**惰性加载**的(延迟到真正需要时才去后端取数),比提前把整个数组都加载进内存更高效,这也是批次5a "Optimize performance" 建议的具体落地方式之一。

### 146. Attachments(附件 API,承接批次4的"Upload attachments")
https://www.palantir.com/docs/foundry/functions/attachments/

- 函数里读取附件内容返回的是标准的 **`BytesIO`** 二进制流对象(Python)。复杂文件格式(如 PDF)需要额外的解析库,按批次5d "Add NPM dependencies" 的方式引入依赖。
- **⚠️ TypeScript v1 不支持文件系统**:很多处理文件数据的依赖库底层要用 `fs` 模块,而 **v1 函数运行环境没有 `fs` 模块**,会直接编译/运行报错;变通方案是引入一个内存文件系统库(如 `memfs`)、把它 alias 成 `fs`——这条限制和批次5d "Add NPM dependencies" 提到的一致,再次印证:**如果你的函数经常要处理文件/附件解析这类工作,TS v2 或 Python 是更顺畅的选择**。

### 147. Media(媒体 API,承接批次3的 Media reference base type)
https://www.palantir.com/docs/foundry/functions/media/

- **⚠️ TypeScript v1 不支持在函数里直接上传媒体文件**——要上传媒体并创建/更新对象,必须用 **Ontology edit function**(即 TS v2 / Python,因为只有它们支持通过上传媒体获得一个 `MediaReference` 来构造 Ontology edit);上传完的媒体之后就能被读取/下载,用于你的应用。
- **类型守卫解锁专属操作**:比如用 **`MediaItem.isDocument(media)`** 判断某个媒体项具体是不是文档类型,判断通过后才能调用文档专属的方法(如 OCR 文本提取、按页码范围提取文本——不传起止页码则默认提取全文档;**非机器生成的 PDF(如扫描件)建议走 OCR 方式提取**,而非直接文本抽取)。

---

## 子批次5f:Models(5篇)+ Aliases(3篇)—— 和你团队接 Kimi/GLM 模型直接相关

### 148. Functions on models(在函数里调用已部署模型)
https://www.palantir.com/docs/foundry/functions/functions-on-models/

- **Model function = 围绕 live model deployment 自动生成的包装函数**,可以被导入进 functions repository 直接调用,让你在模型预测结果外再加自定义业务逻辑、把模型和 Ontology 对象打通、或编排多个模型调用。
- **两种发布来源**,产出的 model function 功能等价:①**Direct model deployment**(从模型页面直接发布);②**Modeling Objective live deployment**(从 Modeling Objective 的部署详情页发布)。**三种语言(TS v1/v2/Python)都完整支持** model function。
- **调用限制(容量规划要记住)**:模型输入输出数据走网络传输,**单次上限 50MB**;算上这部分开销,**整个函数执行总时长不能超过30秒**。如果该函数支撑的是一个 action,还要叠加批次4"Scale and property limits"里提到的编辑数量上限。
- **⚠️ API 迁移的破坏性影响**:如果把一个"space-bound"模型函数迁移成"ontology-bound"(通过界面操作),**已发布的 TS v1 函数版本仍能继续跑**,但**导入语法不再被识别**——这意味着该 repository 之后没法再预览/打新 tag,必须手动更新 `resources.json` 和调用语法(改用批次5b提到的 query function 语法)。**更危险的是**:通过 Foundry Platform SDK 或 `Functions.Query` 直接按 API name 调用模型函数的消费者,**迁移后会立即中断**——因为这种消费方式是按 API name 引用,而 API name 在迁移时是**全局一次性**迁移的,没有缓冲期。**这条建议你团队在做模型版本升级/迁移前务必提前评估下游消费方式**。

### 149. Function interfaces(函数接口:定义标准化契约,强烈建议关注)
https://www.palantir.com/docs/foundry/functions/function-interfaces/

这一篇和你团队接 Kimi/GLM 模型**直接相关**,建议精读原文:

- **Function interface(函数接口)= 描述"函数应该长什么样"的契约**(输入、输出、错误类型),它本身**不是一个函数**,而是给别的函数去"实现(implement)"的规范。Foundry 内置应用可以依赖某个 function interface,自动发现所有"实现了该接口"的函数,并给它们提供专门的、针对性的运行时特殊待遇。
- **最直接的案例:AIP Logic 的 "Use LLM" 模块**——它依赖 Foundry 提供的 **chat completion function interface**;用户在 Logic 里既可以选 Palantir 自带的 LLM,也可以选**用户自己注册的 LLM**。所谓"注册的模型"本质上就是一个**用户编写的函数,实现了这个 chat completion 接口**——这正是你团队把 Kimi/GLM 等自建/自部署模型接入 Foundry 生态(AIP Logic 等下游应用能直接选用)的标准机制。
- **自定义扩展能力**:实现接口时不限于用接口预定义的类型,可以自己扩展参数类型(比如给 `GenericCompletionParams` 继承出一个带自定义字段 `modelSpecificParam` 的子类型),**只要保持和接口定义"兼容"**,编译器就会接受并允许发布——这给你在标准 chat completion 契约之上,附加 Kimi/GLM 特有参数(比如某些厂商专属的采样参数)留了扩展空间。
- **实操参考代码模式**(来自关联的"Bring your own model"文档,直接对应你的场景):用 `@ExternalSystems({sources: [...]})` 声明该函数要访问的外部 source(即你的模型网关/LiteLLM 网关对应的 source),再用 **`@ChatCompletion()`** 装饰器标注该函数实现了 chat completion 接口,函数签名接收标准化的消息列表和通用补全参数、返回标准化的补全结果或错误——**这一套模式几乎就是"把 Kimi/GLM 包一层 OpenAI 兼容适配器,注册成 Foundry 认识的 LLM"的现成模板**。

### 150. Language models in TypeScript v2 and Python functions(v2/Python 调用语言模型,推荐用法)
https://www.palantir.com/docs/foundry/functions/language-models-python-tsv2/

- **核心机制**:v2/Python 通过**代理端点(proxy endpoint)** 调用语言模型,示例用的是 **OpenAI 兼容的 chat completion 代理端点**(其他 provider 也有对应文档)。
- **实操代码模式(TS v2)**:引入 `PlatformClient`、`openai` 官方 SDK、`Aliases`(来自 `@osdk/functions`)、以及 `getFoundryToken`/`getOpenAiBaseUrl`/`createFetch`(来自 `@osdk/language-models`)几个工具函数,拼出一个标准的 OpenAI client 实例(`apiKey` 用 Foundry token、`baseURL` 用 Foundry 提供的代理地址、`fetch` 用 Foundry 包装过的 fetch),然后就能用**标准 OpenAI SDK 语法**发起 `chat.completions.create()` 调用,模型标识通过 `Aliases.model("{MY_ALIAS}").rid` 引用(即下面第154条 Model aliases 机制)。
- **Python 写法结构完全一致**:`get_foundry_token()` / `get_openai_base_url()` / `get_http_client()` 拼出标准 `OpenAI()` client,后续调用语法和用官方 OpenAI Python SDK **完全相同**。
- **对你团队的直接意义**:**因为接口是 OpenAI 兼容的,理论上只要 Kimi/GLM 网关本身兼容 OpenAI Chat Completion 协议(市面上主流的自建 LLM 网关,包括你们的 LiteLLM 网关,基本都天然兼容),就可以直接复用这套官方 SDK 调用方式**,不需要为每个厂商写一套定制客户端代码——比 TS v1 老方式(需要硬编码资源标识符)简单直接得多。

### 151. Language models in TypeScript v1 functions(v1 调用语言模型,存量维护向)
https://www.palantir.com/docs/foundry/functions/language-models/

- v1 走的是"资源导入"模式:必须先在 **AIP 已启用**且用户本身**有 AIP builder 权限**的前提下,通过 Resource Imports 侧边栏的 Models 选项,把 Palantir 提供的具体语言模型导入进 repository,再在代码里 import 使用。
- 官方明确提示:**如果侧边栏出现"升级"警告图标,说明你导入的是旧版 legacy 模型**,建议用 "Select imports" → "Fix" 移除废弃的 legacy 模型、重新选择升级版模型——**升级会导致编译期报错(代码语法变了)**,需要照着侧边栏给出的代码片段手动改代码。

### 152. Legacy language models in functions(已废弃的旧版调用方式)
https://www.palantir.com/docs/foundry/functions/language-models-legacy/

- 是上一条(151)提到的"升级前"的旧版机制,**官方明确建议全面升级**,升级后能获得**vision(视觉理解)和 streaming(流式输出)**这两项新能力——这两点如果你们有多模态或者流式生成的场景,是明确的升级动因。

### 153. Custom aliases(自定义别名,通用配置解耦机制)
https://www.palantir.com/docs/foundry/functions/custom-aliases/

- **Custom alias = 一个具名引用,存放字符串值**(配置参数、feature flag、环境相关设置),**仅 TypeScript v2 / Python 支持**。用途:把函数逻辑和具体环境配置解耦,让同一份函数代码能在不同环境间portable。
- 创建路径:Resource imports 侧边栏 → Platform SDK 标签页 → Custom aliases → New alias(设 Key + Value)。代码里用 `Aliases.custom("myAlias")`(来自 `@osdk/functions`)取值。
- **⚠️ 和 Marketplace 打包的联动机制(很实用)**:一旦某个用了 custom alias 的函数被打包进 Marketplace 产品,**该别名会自动出现在产品 Inputs 里、变成可配置参数**——安装方不需要改函数源码,就能在自己的环境里配出合适的值;还可以给别名加描述、以及在 Presets 标签页定义"人工限定的可选值列表",引导安装方从预设选项里选,而不是随便乱填。**这对你团队如果要把接入 Kimi/GLM 的函数打包分发给多个客户环境(每个环境模型网关地址/密钥不同)是个现成的标准化机制**。

### 154. Model aliases(模型别名)
https://www.palantir.com/docs/foundry/functions/model-aliases/

> 该页面未能直接检索到独立正文,但从第150条的代码示例可以看出其具体用法:`Aliases.model("{MY_ALIAS}").rid` —— **Model alias 是 Custom alias 机制针对"模型资源标识符(RID)"的专用版本**,让代码里不用硬编码具体模型的 RID,而是引用一个语义化的别名(如 `{MY_ALIAS}`),实际指向哪个模型可以按环境单独配置——原理和上面 Custom alias 的"打包进 Marketplace 后自动变成可配置 Inputs 参数"完全一致,只是专门用来管理模型这一类资源的引用。

### 155. Source aliases(数据源别名)
https://www.palantir.com/docs/foundry/functions/source-aliases/(内容并入批次5b "Make API calls from functions" 页面)

- **Source alias = 用来代替具体 source 标识符的、可移植的具名引用**。当函数通过 Marketplace 产品分发时,这个别名可以在**每个安装环境里被重新映射到不同的具体 source**,让函数代码本身保持环境无关、可移植。
- **⚠️ 语言差异**:**TypeScript v1 函数用的是编译期生成的 source symbol,不支持别名机制**;**只有 TypeScript v2 和 Python 支持 source alias**——这是又一处 v1 vs v2/Python 的能力差距,如果你的函数要跨客户环境分发、且需要调用外部系统,v2/Python 是明确更合适的选择。
- 使用流程:先通过 Resource imports 侧边栏把 source 导入 repository → (v2/Python)创建一个 source alias,用它的 alias key 作为代码里的"数据源标识符" → 用 `@ExternalSystems({sources: [...]})` 声明函数会用到该数据源。

---

## 子批次5g:Unit testing(单元测试,共7篇)—— Functions 大类收官

> 说明:这套单元测试体系底层用的是 **Jest**(`expect(...).toEqual(...)` 等断言语法),专属测试工具来自 **`@foundry/functions-testing-lib`** 包。示例代码均为 TS,但核心概念(桩对象/验证编辑/模拟时间UUID/模拟用户组)是通用设计思路。

### 156. Getting started
https://www.palantir.com/docs/foundry/functions/unit-test-getting-started/

- 每个 functions 仓库默认自带一个测试文件 `functions-typescript/src/__tests__/index.ts`,也可以在 `__tests__` 文件夹下任意新建测试文件。用标准 Jest 语法(`describe`/`test`/`expect().toEqual()`)写测试,在界面上可以**一键跑全部测试**,也可以点某一行旁边的"播放"按钮**单独跑一个测试**。

### 157. Create stub objects(创建桩对象)
https://www.palantir.com/docs/foundry/functions/unit-test-stub-objects/

- 用 **`Objects.create()`** 直接在内存里构造一个"假的"Ontology 对象实例(不需要真实数据源),像操作正常对象一样直接赋值属性(如 `JFK.displayAirportName = "..."`),然后把这个桩对象传给待测函数,断言函数逻辑输出符合预期——这是**测试"只读取对象属性、不做编辑"的函数**最基础的手段。

### 158. Verify Ontology edits(验证 Ontology 编辑,重点掌握)
https://www.palantir.com/docs/foundry/functions/unit-test-ontology-edits/

- **核心 API:`verifyOntologyEditFunction()`**(来自 `@foundry/functions-testing-lib`),专门用来对"会产生编辑"的函数做断言,支持链式调用多种校验方法:
  - **`.createsObject({ objectType, properties })`**:断言函数创建了一个符合指定类型和属性值的新对象;
  - **`.addsLink(edits => ({ link, linkedObject }))`**:断言函数在两个对象之间建立了指定的链接,还可以引用 `edits.createdObjects.byObjectType(...)` 拿到刚才创建的对象来做二次断言;
  - **`.modifiesObject({ object, properties })`**:断言函数修改了某个已有对象(先造一个带旧值的桩对象,断言执行后属性变成了预期新值)。
- **这一套 API 直接对应批次5b "Ontology edits Overview" 提到的"helper 里直接跑不会真的改数据"的痛点**——`verifyOntologyEditFunction` 正是官方推荐的、**在不接触真实数据的前提下验证编辑逻辑是否正确**的标准方式,建议所有 edit function 都配套写这类测试。

### 159. Stub object searches and aggregations(模拟对象搜索与聚合结果)
https://www.palantir.com/docs/foundry/functions/unit-test-object-searches/

- 核心 API:**`whenObjectSet()`**(来自 `@foundry/functions-testing-lib`),给"某个具体的搜索/聚合调用"配置一个**预设的"罐头答案"(canned answer)**——比如 `whenObjectSet(Objects.search().objectType().sum(s => s.property)).thenReturn(55)`,意味着代码里只要调用了这个一模一样的聚合表达式,测试环境下就直接返回 55,不需要真实数据支撑。
- **支持按对象重载区分多组不同的桩数据**:给每个桩对象手动赋一个 `rid`,针对不同的搜索参数(比如按不同对象列表调用同一个搜索方法)配置不同的返回值——这对测试"函数对不同输入分支有不同处理逻辑"的场景很实用。
- 也支持直接用 `.filter()` 等 API 对一个手工构造的 object set 做真实的过滤运算并断言结果(不一定都要走"罐头答案"这条路)。

### 160. Mock dates, timestamps, and UUIDs(模拟日期、时间戳、UUID)
https://www.palantir.com/docs/foundry/functions/unit-test-dates-timestamps/

- **两种应对"非确定性"输出的思路**:
  1. **用 `jest.spyOn()` 直接给非确定性函数(如 `Timestamp.now()`、批次5d提到的 `Uuid.random()`)打桩**,固定其返回值,再配合 `verifyOntologyEditFunction()` 断言产生的对象带有这个固定值;
  2. **如果想要"完全掌控 UUID 输出"、又不想依赖全局打桩机制**,可以直接**改造被测函数的代码结构**:给函数所在的类加一个**带默认值的构造函数参数**(一个"supplier",默认调用 `Uuid.random`),测试时传入一个自定义 supplier(如固定返回 `"my-other-uuid"`)来注入可控值——**这是一种更侵入式但更明确的依赖注入写法,适合团队制定"如何写可测试的 edit function"编码规范时参考**。

### 161. Mock users and groups(模拟用户和用户组)
https://www.palantir.com/docs/foundry/functions/unit-test-users-groups/

- 用 **`createUser({ id, username, ... })`** 和 **`createGroup({ id, ... })`**(均来自 `@foundry/functions-testing-lib`)构造部分字段的用户/组桩对象(`createUser` 只有 `id`/`username` 必填,其余字段可选;`createGroup` 只有 `id` 必填),配合 `Users.getUserByIdAsync()`/`getGroupByIdAsync()` 这类查询用户/组的函数逻辑,断言其返回值符合预期——用于测试**涉及权限判断、收件人计算(对应批次5b的 Configure notifications)**这类需要用户/组数据的函数逻辑,不需要真实连到 Multipass。

### 162. Debug(单元测试调试)
https://www.palantir.com/docs/foundry/functions/unit-test-debugging/

- 单元测试的调试机制和批次5d提到的"Debug functions"完全共用同一套调试器(打断点 → 暂停执行 → 检查变量/调用栈帧 → 控制台交互),不再重复展开。

---

# 🎉 Functions 大类(共68篇)全部完成!

本文件(笔记二)从子批次5a到5g,完整覆盖了 Functions 大类:总览与快速上手、跨语言通用能力(Ontology edits/query functions/API调用/platform SDK等)、TypeScript v2、Python、TypeScript v1(存量维护向)、Functions on objects(对象访问API)、Models & Aliases(模型调用,含 Kimi/GLM 接入的关键机制)、Unit testing。

**加上第一份笔记文件(`palantir_ontology_notes.md`)里已完成的 Ontology building 总览 + Ontologies + Object and link types + Action types,目前累计已完成 162 篇(94 + 68)。**

剩余大类(均在第一份笔记文件里列出了进度追踪表,尚未开始):
- **Interfaces**(9篇)
- **Ontology 设计三篇**(最佳实践/结构指南/反模式)+ **Ontology search**(约8篇)+ **Ontology scenarios**(5篇)
- **应用层**:Object Explorer / Object Monitors / Object Views(约50篇)、Ontology Manager / Vertex / Machinery(约30篇)、Foundry Rules / Map / Dynamic Scheduling(约80篇,篇幅很大)
- **Ontology architecture 后端**(权限/索引/写入落地/对象数据库,约20篇)

告诉我接下来想继续哪一部分——比如 **Interfaces**(和 Object/link types 关系最紧密,建议优先)、或者直接跳到应用层的某个具体应用(如 Ontology Manager)、或者 Ontology architecture 后端(适合你评估性能/权限设计时看)。也可以说"继续"按默认顺序推进到 Interfaces。
