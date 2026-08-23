# Palantir Foundry — Ontology 文档学习笔记(四)

> 承接前三份笔记文件(累计235篇)。本文件收录 **"Ontology Manager"** 大类(共9篇)——这是你日常做 Ontology 建模改动时天天打交道的管理台应用本身。

## 进度追踪

- [x] Ontology Manager 大类(9篇)✅ 已完成

---

## Ontology Manager(管理台应用,共9篇)

### 236. Overview
https://www.palantir.com/docs/foundry/ontology-manager/overview/

- **Ontology Manager(有时简称 OMA,Ontology Management Application)= 用来构建和维护组织 Ontology 的管理台应用**。快速访问路径:在 Foundry 首页 URL 后面加 `/workspace/ontology`。
- **界面两大常驻元素**:**Top bar(顶栏)**——支持搜索 Ontology 资源、创建新资源、在分支间切换/新建分支;**Sidebar(侧边栏)**——提供到各类资源/页面/子应用的导航入口。
- **首页 Discover 视图**:新用户友好设计——分区展示"最近修改过的 object type"和"prominent 优先展示的 object type";**支持自定义配置页面展示哪些分区、每个分区展示几条**,可选分区包括:Recently viewed(最近查看)、Favorite object types(收藏的类型)、Favorite groups(收藏的分组),也可以专门给某个具体分组加一个独立展示区。
- **选中某个 object type 后**,进入类型详情视图,左侧带完整的页面导航侧边栏;从该类型的 Overview 页 Properties 区块点某个属性,可以直接跳进属性编辑视图。

### 237. Navigation(导航,内容已在 Overview 中一并说明)
https://www.palantir.com/docs/foundry/ontology-manager/navigation/

- 该篇聚焦讲解顶栏和侧边栏的具体导航交互细节,核心结构和上一条 Overview 描述的一致(顶栏管搜索/创建/分支切换,侧边栏管资源导航),不再重复展开。

### 238. Viewing usage(查看资源用量,⚠️ 强烈建议养成使用习惯)
https://www.palantir.com/docs/foundry/ontology-manager/view-usage/

- **这个功能的定位很明确**:帮助你在对 Ontology 做改动前,先看清楚"这个改动会影响多大范围",从而**更安全地评估破坏性变更的影响面**——这正好呼应了批次3、批次5多处提到的"改主键/换数据源/改接口定义前要评估下游影响"这类建议,Viewing usage 就是这些建议在界面上的具体落地工具。
- **Reads(读)的统计口径**:某个应用对某 object type 发起一次"加载对象"的请求就记一次读——包括 Workshop 表格里展示对象、按类型全量搜索、对某属性做聚合等;**⚠️ 一次批量加载大量对象/聚合,只算作"单次读"**(不是按对象数计数);**⚠️ Ontology Manager 里自己产生的类型/链接类型使用行为,不计入统计**。
- **Writes(写)的统计口径**:Action、Function、Foundry Form、Object Explorer 直接编辑、API 调用产生的对象编辑都算一次写;同理,**一次批量编辑也只算单次写**。
- **两个入口**:**Overview 标签页的用量图表**(近30天高层次汇总,快速判断做破坏性变更的影响);**独立的 Usage 标签页**(更详细的指标,能看到近30天内具体谁在什么时间、通过哪个 Foundry 应用使用了该类型)。
- **⚠️ 如果本该有用量数据却显示"No usage for the last 30 days"**,可能是**内部统计表还没被配置好**,需要联系 Palantir 代表排查——遇到这种情况先别急着怀疑是自己操作有问题。

### 239. Migrate to project-based permissions(迁移到基于项目的权限模型,⚠️ 重点关注,和你的权限体系设计直接相关)
https://www.palantir.com/docs/foundry/ontology-manager/migrate-to-project-based-permissions/

这是目前 **Ontology 权限管理的最新一代模型**,建议重点了解现状、评估是否该推进迁移:

- **核心机制**:object type、action type、link type、interface、shared property 等 Ontology 资源,现在可以**直接保存进具体的 Project(项目)**里,权限**自动继承**该 Project 的权限设置——**这和 Foundry 里其他所有资源类型用的是同一套统一权限模型**,底层都由 **Compass**(Foundry 平台的文件系统)管理"谁能查看/编辑/管理"。
- **⚠️ 对象/链接实例的权限依然依赖底层数据源**:**迁移到项目权限,不会改变谁能访问背后 datasource 的权限**——项目权限管的是"Ontology 资源本身(类型定义)"的权限,实例数据的访问权限还是走原来那套(数据源权限)。
- **这套模型取代了之前的两种旧模型**:**Ontology roles**(见第240条)和**数据源派生权限(datasource-derived permissions)**。
- **统一权限模型带来的具体收益(建议直接作为向团队汇报"为什么要做这次迁移"的论据)**:①**统一心智模型**——不用为 Ontology 资源单独学一套权限系统;②**批量管理**——在项目/文件夹层级统一设权限,不用逐个资源单独配;③**权限可解释性**——Security 标签页直接显示"要查看/编辑该类型、要看到实例/跑 action,分别需要什么权限",排查权限问题更直观;④**更细的隐私控制**——可以给敏感 Ontology 资源打 marking、或放进用户没有角色授权的项目里做隐藏;⑤**Compass 治理原语复用**——可以用 portfolio、tag 组织资源,用角色授权/marking 隐藏无关资源。
- **⚠️ 迁移是单向不可逆的**:**一旦某个资源迁移到了项目权限,就不能再退回 Ontology roles 或数据源派生权限**——这是个需要谨慎评估、一次到位的决策,不建议草率试水。
- **⚠️ 当前限制**:**该能力目前还不支持 Default ontology**(不确定自己 Ontology 类型的话建议联系 Palantir Support 确认);**资源命名要符合 Compass 命名规范**(不能含斜杠 `/`,不允许重名,重名时系统会自动追加"(1)"这样的后缀来保证路径唯一)。
- **启用方式**:Ontology owner 去 Ontology Manager 的 **Ontology configuration 标签页**,打开"Require new ontology resources be saved in a project"开关——开启后,后续新建资源时都会被要求先选保存位置。

### 240. Ontology roles migration [Legacy](旧版权限模型迁移指南)
https://www.palantir.com/docs/foundry/ontology-manager/ontology-roles-migration/

- **⚠️ 该页面本身现在也是"过时的过时"**:官方原文明确标注**"This page describes a legacy process that is no longer the most up-to-date method"**——也就是说,**Ontology roles 本身,已经被上面第239条的"项目权限"模型取代了**;这篇讲的是"如何从更早的数据源派生权限,迁移到 Ontology roles"这个**中间过渡阶段**的操作指南。**结论很明确:如果你们现在要做权限模型升级,应该直接对标第239条的项目权限,不需要再关心这个更旧的 Ontology roles 迁移流程**,这里只做背景记录。
- **背景概念(帮助理解历史脉络)**:**Ontology roles 是 2023年9月起、所有新开通环境的默认授权模型**,把授权直接挂在 object/link/action type 这些"Ontology 资源"本身及其元数据上,**并把"Ontology 资源"和"资源背后的数据实例"解耦**——数据实例(具体对象、链接)的权限仍然由输入数据源的权限管控。**用到 shared property、interface 等较新特性,都要求先启用 Ontology roles**。
- **迁移中的实用工具:Ontology cleanup**(见下条244)——如果发现某个资源已经不再需要,可以直接用这个工具删除,不用费力气去处理它的迁移问题。
- **Function-backed action type 的迁移坑**:大部分情况下 Foundry 会**自动**帮你迁移背后的 Function,但**有些 Function 可能无法自动迁移,需要手动在函数里显式声明会编辑哪些对象类型**(呼应批次5多处提到的"显式声明 edits 优于依赖静态分析自动推断"这一设计理念)。

### 241. Save changes to the Ontology(保存改动的具体流程)
https://www.palantir.com/docs/foundry/ontology-manager/save-changes/

- **核心机制**:在 Ontology Manager 里做的所有改动,**默认只存在本地的 work-in-progress(进行中)状态**——要让改动对其他人可见、真正在用户应用里生效,**必须点 Save 走完保存流程**。
- **标准保存流程**:顶栏点 Save → 打开 "Review edits" 对话框逐一审查所有改动 → 确认无误后点 Save 完成更新。
- **⚠️ Save 按钮变灰不可点时的排查思路**:说明存在**阻断性错误(error)**——可以直接滚动浏览改动列表,逐条查看内嵌的错误提示,也可以点对话框顶部的 **Errors 标签页**统一查看所有错误。**Warnings(警告)不会阻断保存**,但值得读一遍理解改动的潜在影响。
- **⚠️ 一个容易被忽视的确认机制**:对于有明确警告的改动,系统会要求你**手动输入被改资源的名字**才能继续保存——这是一道"确保你真的读懂了影响、不是手滑点了保存"的软性确认关卡。
- **报错信息辨识技巧**:如果后端服务处理保存请求时出问题,会弹出一个 toast 错误提示,**错误消息名通常以 `OntologyMetadata:` 或 `Phonograph2:` 开头**——整个 Ontology 文档体系里,很多具体错误码的排查方法都是围绕这两个前缀展开的(批次3提到的 `Phonograph2:FoundryColumnNameNotFound`、`Phonograph2:InvalidColumnRemoval` 正是这个体系下的具体案例),看到这两个前缀基本就能判断问题出在元数据配置层还是索引后端层。

### 242. Review and restore changes(查看历史并回滚,⚠️ 实用的应急工具)
https://www.palantir.com/docs/foundry/ontology-manager/restore-changes/

- **入口**:某个具体 Ontology 资源页面的 **History 标签页**——展示"你当前未保存的改动"+"所有已保存的历史改动"(附带改动时间和操作人);资源视图左下角的 footer 也会简要展示"最后一次编辑时间+编辑人"。
- **回滚具体流程**:在 History 列表里选中你想恢复到的那个历史版本 → Confirm → **⚠️ 回滚后,该版本之后的所有改动都会被撤销**,但**这个撤销结果只是进入了你的"工作中状态",依然需要再走一次批次241的 Save 流程,回滚才会真正生效**——回滚不是"一键立即生效"的操作,别忘了最后这一步。
- **组织级别的历史查看**:侧边栏首页的 **History 标签页**,可以看到整个 Ontology 的所有已保存改动列表(默认折叠展示,点箭头展开细节);**可以选择隐藏"你没有查看权限的类型"相关的改动细节**(不开这个选项的话,你能看到"确实发生过改动"这个事实,但看不到具体细节);还支持把**同一个作者的多次改动合并成一条**来简化视图。

### 243. Export, edit, and import an Ontology(导出/编辑/导入,⚠️ 面向"用代码管理 Ontology 定义"的高级工作流)
https://www.palantir.com/docs/foundry/ontology-manager/export-import/

- **底层机制**:Ontology 的 schema 定义存储在一个 **JSON 文件**里,**⚠️ 官方明确提醒不应该依赖这份导出 JSON 的具体 schema 结构,因为它可能随时间变化**——不建议基于这份 JSON 格式搭建长期依赖的自动化工具链。
- **两种典型用途**:①**用代码而非 UI 来编辑 Ontology**——导出 JSON → 用代码编辑器/文本编辑器直接改 → 导入回 Foundry,绕开 Ontology Manager 界面手动点选;②**把一个 Ontology 的当前工作状态复制到另一个 Ontology**——导出源 Ontology 状态 → (可选在代码编辑器里做进一步修改)→ 导入目标 Ontology。
- **操作入口**:首页的 **Advanced settings 页面** → Export / Import。导入时会提示选择本地 JSON 文件,导入完成后应用顶栏会显示"需要保存的改动数量"。
- **⚠️ 一个具体的限制场景**:**带条件格式化规则(conditional formatting rule sets)的导出状态,不能被导入到"导出来源"之外的其他 Ontology**——如果强行导入,会报 `OntologyMetadata:UnreferencedRuleSets` 错误,这是评估"能不能跨 Ontology 复制粘贴配置"时要提前知道的一条硬约束。

### 244. Ontology cleanup(Ontology 清理工具)
https://www.palantir.com/docs/foundry/ontology-manager/cleanup/

- **定位**:帮你**系统化地识别"哪些 object type 可以安全删除"**,依据一套具体标准打标(flag)——例如:背后数据源已经被删到回收站、已经过了 deprecation 截止日期、索引正在报错失败、是否还在用 Ontology roles 等等。
- **操作方式**:清理页面展示一个可按标记类型/所属 group 过滤的待清理列表;对每个类型可以选择 **Deprecate(标记废弃)** 或 **Delete(直接删除,连带清空 object storage 里的数据)**;**一旦对某个类型做了处理(标废弃或删除),它就从待清理队列里消失**,可以用表格过滤器回看已经处理过的记录。
- **⚠️ 废弃和删除都遵循和普通 Ontology 改动一样的"暂存 → Save"流程**——不是点了 Deprecate/Delete 就立刻生效,顶部点 Save 时,既可以选择直接保存到 Ontology,也可以选择**创建一个 proposal 请别人 review**(呼应批次2提到的 Ontology proposal 评审机制)。
- **可定制清理标准**:清理页面下有一个子页面,可以**自定义使用哪些标记(flag)、以及它们的优先级排序**——这意味着你可以按团队自己的治理规范(比如"deprecated超过90天"或"索引连续失败超过7天"这类标准),定制一套适合自己组织的清理策略,而不是完全依赖官方默认的判定标准。**这对你评估存量 Ontology 治理、定期"打扫卫生"是个直接可用的工具**。

---

# Ontology Manager 大类(共9篇)全部完成

**累计四份笔记文件合计 244 篇。**

**一个值得你重点关注的贯穿性主线**:本批的**第239条(项目权限)**和**第240条(旧版 Ontology roles)**清楚地勾勒出 Palantir 权限模型的演进路径——**数据源派生权限(最早)→ Ontology roles(2023年9月起默认)→ 项目权限(当前最新,统一进 Compass 体系)**。如果你们的 Ontology 是较早期建的,大概率还停留在中间的 Ontology roles 阶段,**评估一次迁移到项目权限的收益(统一权限模型、批量管理、权限可解释性)**,可能是个值得放进近期规划的技术债清理项。

---

# 应用层 · 第四部分:Vertex(共27篇,图谱可视化与因果/情景分析)

> 说明:Vertex 这部分子页面较多且部分页面主题高度相关、内容有交叉重叠,以下采用**按功能模块归纳整理**的方式呈现(而非逐页罗列),已完整覆盖 Overview、Example use cases、Graphs(图谱构建/浏览/模板/嵌入/样式/函数驱动)、Events and time series(事件与时间序列)、Scenarios(情景推演)、Marketplace 集成等全部主要模块。

### 245-246. Overview / Example use cases(定位与典型场景)
https://www.palantir.com/docs/foundry/vertex/overview/ 、 example-use-cases/

- **Vertex 的核心定位**:基于当前/预测/假设条件,**提供一套工具包来监控、模拟、优化运营决策**,以最大化组织成果。四个核心价值主张:①**打破职能孤岛的透明度**——探索整个网络的实时视图;②**核心告警**——围绕关键风险与机会及其对目标的影响做集中告警;③**模拟未来**——结合分析与运营找到最有影响力的改动;④**学习与优化**——通过提升数据清晰度和模型准确性,持续逼近全局最优。
- **典型场景**:快速搭建"对象支撑的系统图谱/生产流程图",覆盖从物料加工、设备调优到生产排程、供应链管理等各类工作流;利用预定义的对象关系,可视化整个系统里的物料流转和事件;**Vertex 能让你通过和 Foundry 里已发布的任意模型、预测或业务逻辑对接,来交互式地"询问"你的数字孪生**——运行"what-if"分析和仿真,理解并对比不同决策/事件/潜在改动对整个网络的影响。

### 247-257. Graphs(图谱模块,共11篇)
https://www.palantir.com/docs/foundry/vertex/explore-object-relationships/ 等

- **启动方式**:从 Foundry 工作区侧边栏 Apps → Operational Applications → Vertex → **"+ New Graph"** 开始新的探索,从空白工作区里通过对象搜索弹窗添加对象作为起点;**点击图谱上某个对象节点会自动打开选择面板展示其属性**,选择面板右下角的 "+" 号可以添加**派生属性函数**做进一步计算展示。
- **交互式浏览(exploration view)**:可以对选中对象/边**右键调出 Actions 菜单**,用 **Search Around** 找到关联对象/事件、把它们作为新节点加入图谱;可以在侧边栏的 Layers 标签页调整样式和布局。**⚠️ 在 Workshop 模块里对嵌入的图谱做的修改,不会更新底层的图谱模板**——如果希望改动永久生效,必须回到源头去更新模板本身,而不是在 Workshop 嵌入视图里改。
- **样式与布局配置**:支持给对象/边配置**动态样式**(基于属性/派生属性值)、配置"关键属性读出(readout)"跟随时间选择窗口联动展示变化趋势;内置多种**预定义布局算法**(自动摆放节点位置),大多数布局有可通过齿轮图标访问的高级参数(**Auto 和 Circular 布局没有高级参数**);支持给对象加**徽标(badge)展示关联事件数量**,以及在"默认节点"和"完整对象卡片"两种展示形态间切换;边可以配置基于对象类型或共同属性的颜色、以及直线/曲线/正交三种连线样式。
- **⚠️ 图谱样式配置的一个已知限制(来自官方 Product QA)**:**目前 Vertex 不支持"基于图谱里其他对象的信息"来决定某个对象的样式**——样式配置只能基于"被样式化对象自身"的派生属性作为输入,不能跨对象引用。
- **Graph template(图谱模板,⚠️ 重点关注,是 Vertex 复用/嵌入能力的核心机制)**:**任何一次 Vertex 探索分析都可以被转换成模板**(顶部工具栏 Save 选项 → "Save as Template..."),用途包括:围绕某类对象做"可复用"的下钻分析、把图谱生成逻辑封装成可复用资源、**把模板嵌入进 Object View 或 Workshop 应用**。模板支持配置**对象参数(object parameters,决定图谱起始节点,并可以关联 Search Around)**和**非对象参数(non-object parameters,类型和 Search Around 函数支持的非对象参数类型一致)**,消费方可以通过顶部工具栏的 Parameters 按钮调整参数值来重新生成图谱。
- **在 Workshop 里嵌入图谱**:用 Vertex Graph 组件,三步完成——选择要嵌入的图谱/模板/图表资源(只有兼容资源会出现在选择器里)→ 配置参数映射(对象类型参数从 Workshop 的 object set 变量传入,非对象参数按类型传值)→ 配置交互行为(保存时机、是否弹保存对话框、是否存成带版本历史的 versioned graph)。**支持"覆盖图谱 RID"选项**——从对象的某个属性里读取一个之前保存过的图谱 RID 来加载已有图谱(而非每次都重新生成),适合"给某个具体业务对象持久化保存一份专属分析图谱"的场景。**⚠️ 也支持"Load data from scenario"开关**——让嵌入的图谱基于一个 Scenario(而非基础 Ontology)加载数据,并可配置"每次应用场景改动后自动刷新图谱"。
- **URL 参数驱动的图谱生成(适合做深链接/系统集成)**:通过在其他 Foundry 应用里配置指向 `/workspace/vertex/graph/create` 的链接、附加特定 URL 参数,可以自动生成预填充的 Vertex 图谱——`selectObjectRid`(选中并居中展示指定对象)、`objectRid`(把指定对象加为节点)、`objectSetRid`(把整个对象集的所有对象加为节点)、`searchAroundFnRid`(把指定 Search Around 函数的执行结果加入图谱,该函数会用 `objectRid`/`objectSetRid` 对应的对象作为输入被调用)。
- **⚠️ 用 Functions 编写自定义 Search Around 函数(建议重点关注,给你团队做定制化图探索功能的直接接口)**:Search Around 函数用 TypeScript functions repository 编写,**必须严格满足两条硬性签名要求**——**恰好一个参数**(一个 Ontology 对象类型,或该类型对象的列表);**返回类型必须是 `IGraphSearchAroundResultV1`(或其 Promise 包装)**,且这个返回类型的结构**必须按官方规定的字段名精确声明**,Vertex 靠这个精确的类型结构来自动发现该函数是不是一个合法的 Search Around 函数(通过工具栏菜单/右键菜单/URL参数调用时,还可以额外接收 Integer/Double/Float/string/boolean/Timestamp/Date 类型的补充参数,系统会自动生成对应的表单)。返回结果支持两类边:**`directEdges`(直接边,对象间的直接连接,若基于某个具体 link type,可以带上其 RID 让 Vertex 展示链接类型名称和方向)**、**`intermediateEdges`(中间边,对象通过某个中间对象/事件产生的间接连接,展示时中间对象会被"打包"合并进这条边上,多个中间对象会被聚合到同一条边)**。

### 258-264. Events and time series(事件与时间序列模块,共7篇)
https://www.palantir.com/docs/foundry/vertex/events-overview/ 等

- **两种时间维度的数据类型**:**Event(事件)**——是 Ontology 里配置了时间信息的 object type,**至少要有起止两个时间戳**;**Time series(时间序列)**——随时间变化的度量值,对应 Ontology 里的时间序列属性。这套能力和批次5的 Scenario 机制结合起来,专门用于**分析过去发生了什么、预测未来可能发生什么**。
- **Configure events(配置事件)**:要在 Vertex 里使用事件,需要①建一个带时间序列的 event object type;②给它加一个专属的 **Vertex type class**,用来设置该告警的颜色和/或严重级别(通常挂在主键列上)。
- **Explore related time series(浏览关联时间序列)**:选中某个对象后,在选择侧边栏的 **Series 标签页**能看到它关联的所有时间序列;每条时间序列旁的省略号菜单支持"在 series view 里打开"(时间轴可视化会显示在图谱画布底部,可以点选/滚动时间轴上任意时间点来查看)、"添加到扩展标签/读出(readout)"(直接把该时间序列的值展示在对象标签上)。**⚠️ 不是所有客户环境都开通了时间序列能力**——如果你的环境里没看到这些功能,需要联系 Palantir 代表确认是否已启用。

### 265-268. Scenarios(情景推演模块,和批次3提到的 Ontology scenarios 是同一套底层机制在 Vertex 里的具体应用)
https://www.palantir.com/docs/foundry/vertex/scenarios-overview/ 、 scenarios-getting-started/ 等

- **核心用途**:通过"What if"式提问,理解不同条件/决策路径对系统的影响。Vertex 借助 Foundry 里已经发布/编排好的模型,提供一个界面来**可视化整个系统里的建模交互关系,并选择性地覆盖关键参数**,理解还有哪些替代 Action 能达成更优结果。
- **两种数据来源可以驱动 Scenario**:**已发布并通过 Modeling Objective 绑定到 Ontology 的模型**;**已发布的 Function**(批次5f提到的 functions on models 机制在这里同样适用——模型版本定义了输入输出参数,可以和图谱里的 Ontology 对象紧密对齐,让建模概念和数字孪生动态联动)。
- **操作流程**:点 "Add scenario" 新建一个情景 → 展开该情景、点 "Add Action" → 选择要添加的 Action(测试用预配置的 Action 去修改 Ontology 对象会如何影响局部乃至整体系统)→ 更新该 Action 的参数 → Submit 保存进该情景。
- **⚠️ 重要的官方迁移建议**:**"选模型、配置模型、运行模型"这一整套旧流程,正处于淘汰阶段(sunset)**——**官方建议改用"给模型配一个 Function、把这个 Function 导入一个 function-backed action、再按标准 Action 添加流程操作"这条新路径**,而不是继续走旧版的直接模型选择流程。**这条建议和批次4"Function-backed actions"、批次5f"Functions on models"的技术路线完全一致,是 Palantir 平台"逐步把裸模型调用统一收敛到 Function 抽象层"这一整体架构演进方向的又一处体现**。

### 269-270. Configuration(配置)
> 该子分类的2篇独立页面未能单独检索到完整正文。结合上文各模块提到的配置项(事件的 Vertex type class 配置、图谱模板的参数配置等)推断,这里应该是对 Vertex 应用级别配置项(如权限、默认布局等)的汇总说明页,建议如果需要具体的应用级配置细节,直接查阅 Ontology Manager 或 Control Panel 里 Vertex 相关的配置入口原文。

### 271. Add Vertex graph templates to a Marketplace product(打包进 Marketplace)
https://www.palantir.com/docs/foundry/vertex/marketplace-vertex/

- 通过 Foundry DevOps 打包 Vertex 图谱模板复用。**⚠️ 唯一的功能缺口**:**打包时不支持"已保存的 Search Around"这一项配置**,除此之外图谱模板的其他所有功能都完整支持打包分发。

---

**应用层第四部分:Vertex(27篇,归纳整理完成)。累计四份笔记文件合计 271 篇。**

**一个值得你重点关注的技术方向**:Vertex 的 **Search Around 函数机制**(通过 Functions 写自定义图探索逻辑,返回 `directEdges`/`intermediateEdges` 结构)+ **Graph template 的对象参数/嵌入 Workshop 能力**,组合起来其实是一套相当灵活的"图探索能力开放接口"——如果你团队要做类似"知识图谱可视化下钻分析"的产品能力,这套机制值得作为参考架构研究。

---

# 应用层 · 第五部分:Machinery(共约6篇)—— 流程建模与优化

### Overview
https://www.palantir.com/docs/foundry/machinery/overview/

- **Machinery = 用来理解和管理"流程(process)"的应用**:识别不良行为模式、朝目标结果持续改进。**核心建模思路**:很多现实世界的事件本质上都是"流程"(业务工作流、政府运作、医疗诊疗流程等)——在一个流程里,实体(文档、设备、个人)会**随时间经历状态变化(state transition)**。
- **结合 AIP 的定位**:借助 AIP 的 LLM 能力,**Machinery 可以作为编排多步骤 AIP 工作流里"多个自动化环节"的可靠框架**。支持的典型工作流:借助 AIP+自动化解决流程低效问题、编排多个 AI agent 端到端管理一个 AIP 用例、从外部事件日志里"挖掘"出一个正在运行的流程以获得可见性、定义并监控性能指标/预期以识别流程瓶颈。
- **典型场景举例**:**保险**(从最初报案到最终理赔决定的完整流程,含单据 OCR、半自动化处理、人工审批)、**医院运营**(端到端建模患者在医院的完整就诊旅程,辅助生成医疗文书)、**采购到付款(Purchase-to-pay)**(从申请到付款,提升流程效率)、**订单到收款(Order-to-cash)**(从收单到收款,优化销售流程和现金流)。

### Core concepts(核心概念)
https://www.palantir.com/docs/foundry/machinery/core-concepts/

- **状态由一个字符串属性(通常叫 `state`)显式追踪**,状态的具体取值(如 "created"、"approved")会体现为流程图上的**状态节点**。**⚠️ 实操建议**:为了避免打字错误或数据不一致,建议**用 enum 类型的 value type(批次3提到的枚举约束)给这个 state 属性做背书**——这样能保证 Ontology 里的数据只能取预定义的合法值集合,**Machinery 会自动识别这套配置、并保持流程状态和这个枚举定义同步**。
- **Action 是状态转换的驱动力**:平台内发生的状态变化都是由某个 Action 定义的,可以把这些 Action 导入进 Machinery 图谱、并标注它们在流程里扮演的角色。
- **Log object type(日志对象类型)**:因为流程的本质是"实体随时间变化",要识别路径模式、计算"平均停留时长"这类指标,必须捕捉时间维度——**Machinery 通过维护一个 Log object type 来追踪每次对象变化(不管变化来自外部数据源还是 Foundry action)**,是整个流程分析能力的数据基础。

### Connect data to Machinery(接入数据)
https://www.palantir.com/docs/foundry/machinery/connect-data/

- **Machinery 需要接入两类对象数据**:**Process object(流程对象)**——正在经历流程的实体本身(比如 Onboarding 流程里的 Employee、Purchase-to-pay 流程里的 Invoice);**Log object(日志对象)**——追踪该流程对象每一次状态变化的记录。
- 数据配置面板可以从主工具箱或直接从流程容器节点打开;状态值的依赖关系(比如某个状态转换要满足特定的 action submission criteria,或由自动化在满足特定状态条件时触发)也在这里配置。

### Optimize a process(优化流程)
https://www.palantir.com/docs/foundry/machinery/optimize-process/

- **配置完成后,Machinery 流程可以通过 Workshop 里的专属组件集成进运营应用**:Machinery 应用本身负责"定义流程",而 **Workshop 组件负责支撑分析、运营和人机协同(human-in-the-loop)的实时流程优化工作流**。
- **⚠️ 一个当前的功能限制**:**Machinery Process Overview 组件目前只支持展示单一根流程容器**——不支持展示同级(sibling)容器或层级(hierarchy)结构,如果你的流程图里有嵌套容器,**这些嵌套容器不会被展示出来**。
- **进一步结合 AIP Logic**:可以让 Action 由 LLM 生成的响应驱动,增强流程优化能力。
- **数据更新机制**:流程日志对象是**异步**响应流程对象变化的,因此**可能存在轻微延迟**,涉及最近事件的相关指标可能暂时反映不出最新数据。
- **组件配置细节**:从 Machinery 资源里自动发现 Ontology 配置和节点位置;要展示的具体流程对象通过 **Workshop object set 变量**传入;**为保证一致性,建议通过"从流程对象集做 Search Around"的方式获取对应的流程日志对象集变量**,而不是单独查询;"last updated at"(最后更新时间)默认取该流程对象最近一条日志记录的时间戳,也可以选择在流程对象类型上自行维护一个 Updated at 属性来手动指定。

### Analyze and monitor a process(分析与监控)
https://www.palantir.com/docs/foundry/machinery/analyze-and-monitor/

- **Machinery Overview 组件**:在 Workshop 应用里渲染 Machinery 流程图,可以展示指标、流程走向和对象分布,提供流程运营的洞察和监控能力,方便**在用户正实际操作流程时获得可见性**、识别分析/监控工作流里的瓶颈。
- 该组件既可以用在 Workshop 模块里,也可以作为 Machinery 应用本身的"独立视图模式"(功能相对精简)使用;**当前默认使用的是 v2 版本组件,支持 Machinery v2 资源**。

---

**应用层第五部分:Machinery(约6篇)完成。累计四份笔记文件合计 277 篇。**

**一个值得记录的小发现**:搜索过程中顺带确认了 Ontology architecture 后端部分的入口页面(`object-backend/overview`),里面提到了 **Object Storage V1(Phonograph,legacy)/ Object Storage V2(新一代规范存储)/ Object Set Service(OSS,负责读)** 这三大后端服务的关系——这和前面多个批次反复提到的 OSv1/OSv2/OSS 概念是同一套体系,等推进到"Ontology architecture 后端"部分时会有更详细的展开。

---

# 应用层 · 第六部分:Foundry Rules / Map / Dynamic Scheduling(约80篇,精简归纳处理)

> **处理方式说明**:这一块是三个高度垂直化的场景应用(规则引擎 / 地理空间可视化 / 动态排程),和你目前的 AI 平台架构/知识图谱工作关联度相对较低。参照 Object Monitors 的处理方式,这里**按应用做归纳性总结,呈现每个应用的核心概念和定位**,不逐页展开配置细节。如果未来你们业务涉及具体某个应用(比如要做设备维修排程、或者物流地图可视化),建议届时再针对性精读该应用的原文档。

## Foundry Rules(规则引擎:低代码业务规则管理)

- **定位**:**用点选式、低代码界面主动管理复杂业务规则**(原名 Taurus)。典型场景:反洗钱(AML)风险标记、告警生成、数据分类。
- **核心对象模型**:**Rule(规则)**= 一组应用在数据集/对象上的条件组合(从简单过滤到复杂聚合/join);**Proposal(提案)**= 规则变更的载体,新增/编辑/删除规则都要先生成 proposal,经 **Proposal Reviewer(提案审核)**批准后才生效——**这套"提案-审核"机制和批次2的 Ontology proposal 评审机制、批次4的 Action submission criteria 设计理念是相通的:重要变更都要经过一道显式的审批关卡**。
- **规则逻辑三段式**:**Inputs(输入,可以是数据集或对象,⚠️ 用对象作为输入体验更好、支持自动补全下拉,但不支持多数据源背书/多物化/edit-only 属性的 object type,也不支持直接用 Restricted View 背书的对象)→ Logic blocks(逻辑变换块)→ Rule output(输出格式)**。
- **工作流架构**:Foundry Rules 会**自动生成一整套 transforms 管道**(现代版本,2022年7月后)来跑规则逻辑;配套一个 **Workshop 应用**(通常包含 Rule Editor 规则编辑器 + Proposal Reviewer 提案审核器两个组件);**输出的 schema 约束用 Foundry Action 来实现**——Action 的参数对应输出数据集的列,必须映射到逻辑产生的列或用户输入的静态值,这样能保证所有规则的输出格式一致。**⚠️ 这些"Rule Action"虽然是标准 Foundry Action(要在 Ontology Manager 配置),但不会直接对底层对象执行**,更多是承担"标准化输出格式"的角色。
- **部署方式**:通过专门的部署应用一键生成新 Project(含配套数据集、Rules 工作流、Workshop 应用),需要选择 space 和目标 Ontology,并配置一个 "Rule editor" 群组(该群组成员默认可以创建/编辑/删除规则提案、可以裁决提案)——**这只是起始配置,后续可以在具体 action type 上进一步细化提交权限**。
- **可以打包进 Marketplace**分发,打包时通常要把 Rule 和 Proposal 这两个 object type、以及所有相关 action type 一起打包,生产模式安装时建议对这两个类型开启"仅允许通过 Action 编辑"。

## Map(地理空间可视化与分析)

- **定位**:提供强大的地理空间与时序分析可视化能力,把 Foundry 各处数据整合进统一的地理空间体验:探索地理对象间的连接关系、遍历物理网络、用边界框/多边形相交做地理搜索、可视化高性能矢量数据和卫星影像、可视化对象随时间移动的轨迹和事件、通过绘制图形执行地理空间相关的 Action、基于地图模板构建地理空间应用。
- **技术底座**:渲染基于 **Web Mercator 投影(EPSG:3857)**,坐标数据要求 **WGS 84 经纬度(EPSG:4326)** 格式——如果你团队有卫星/遥感数据要接入 Map,这是需要对齐的坐标系标准。
- **图层(Layer)体系**:**Base layer(底图,可切换亮色/暗色/卫星影像等主题)**、**Object layer(对象图层,展示 Ontology 里带地理数据的对象)**、**Link layer(链接图层,展示执行 Search Around 后对象间的关系)**,以及外部图层(需要额外配置,联系 Palantir 代表)、Boundaries(和 Mapbox 合作的行政区划边界图层,支持 choropleth 分级设色地图)。
- **对象的地理数据要求**:点/线/多边形几何靠 **geopoint / geoshape 属性类型**承载;**圆形几何**通过在 object type 的 Capabilities 标签页选一个数值型 "Radius" 属性来定义(**⚠️ 圆形几何只在地图上渲染展示,不会被索引用于地理搜索**——如果需要圆形范围可搜索,得改用多边形近似)。
- **样式配置(Display)**:一个 object layer 可以包含多种 display(图标/圆点、线/多边形、轨迹线/面包屑轨迹/热力图,后两者专门用于可视化随时间移动的对象),每种 display 可以按属性值配置颜色/大小/透明度等样式。
- **在 Map 上执行 Action**:右键点地图或点对象会弹出适用的 Action 菜单;要让一个 Action 能响应"在地图上选点/画多边形/画线"这类交互,需要给对应参数打上特定的 **geo 相关 type class**(如 `Kind: geo, Value: geopoint`)。
- **和其他应用的关系**:除了独立的 Map 应用,**Workshop 里也有一个基于 MapboxGL 的 Map 组件**(共享 Map 应用的大部分核心能力,**⚠️ 需要 WebGL,不支持移动端**,移动端/非WebGL环境需要改用 "Map [Legacy]" 组件),Slate、Quiver、Object Explorer、Contour 也都有各自的地理空间能力。

## Dynamic Scheduling(动态排程与资源优化)

- **定位**:围绕**三大原则**建模排程问题——**用 Foundry Ontology 建模你的资源、把资源的条件和约束编码进系统、对资源与约束之间的关系和相互依赖建模**。典型场景:员工排班优化(随时间变化的优先级与约束平衡)、交通物流网络的抗中断韧性(结合机器学习实时给出重排方案)、制造业生产计划排程(提升产能利用效率),官方案例还提到过**钻井作业优化(AI驱动)**这类工业场景。
- **核心对象模型**:**Resource object(资源对象)**——排程甘特图上的"行",例如技师、设备;**Schedule object(排程对象)**——具体的事件/分配/时间槽,必须持有指向资源对象的外键属性,**必须开启编辑能力(因为排程过程中开始/结束时间、时长、资源归属都会被持续修改)**;支持 fixed-duration(固定时长)布尔属性来控制是否强制该排程保持静态时长。
- **核心交互组件**:**Scheduling Gantt chart(排程甘特图组件)**——每一行代表一个 Resource,悬停展示卡片信息(标题、精选属性、Object View 链接),支持自定义配色和"拖拽分配(puck allocation)"交互行为;**Calendar(日历)**——按天/周/月或自定义视图展示 Schedule 对象。
- **⚠️ 关键机制:排程编辑默认走 Scenario(场景)机制,不直接写 Ontology**——用户在甘特图组件里做的编辑,**先被创建为"提议中的变更(proposed changes)"**,需要一个专门的 **schedule save action handler** 来把这些变更真正落地成 Ontology edit;这和批次3的 Ontology Scenario 机制(fork → 应用编辑 → merge 提交)是同一套底层设计思路在排程场景下的具体应用,**好处是用户可以自由试排、对比不同排程方案,不用担心误操作污染生产数据**。
- **两个用 Function 驱动的智能辅助能力(⚠️ 技术含量较高,建议关注)**:
  - **Suggestion Functions(建议函数)**:每个都由一个 TypeScript function 支撑,根据组织自定义的业务逻辑,**用颜色高亮"可以往哪里拖拽分配"**(评分 -1到1,越接近1颜色越绿、代表越合适,越接近-1越红、代表不合适);Workshop 组件配置里可以选择是否强制"自动吸附到最近的高亮合适区域"。
  - **Search Functions(搜索函数)**:帮助用户快速找到并评估针对特定排程难题的候选解决方案。
  - **Inline metrics(行内指标)**:每一行(资源)可以展示随时间分桶的自定义指标(用 function 返回特定形状的数据结构,支持 Timestamp/LocalDate/Integer 三种时间轴类型),用于给排程决策提供直接的可视化数据支撑。

---

**应用层第六部分:Foundry Rules / Map / Dynamic Scheduling(约80篇,精简归纳完成)。累计四份笔记文件合计 357 篇。**

**至此,应用层全部部分完成**(Object Explorer + Object Monitors + Object Views + Ontology Manager + Vertex + Machinery + Foundry Rules/Map/Dynamic Scheduling)。

---

# 应用层之后:Ontology architecture 后端(共约21篇)—— 全部内容的收官部分

> 这是整个 Ontology 文档体系的**底层技术篇**,讲的是"Ontology Manager 界面背后到底是哪些服务在真正干活"。建议你重点看这部分,因为它直接关系到性能规划、权限设计、schema 变更风险评估这几个你日常要做技术决策的领域。

## Overview and getting started(总览:微服务架构全景,4篇归纳)
https://www.palantir.com/docs/foundry/object-backend/overview/ 等

- **Foundry 用微服务架构实现 Ontology 后端**,这些服务共同承担**三大职能**:①**数据源管理**——喂数据给 Ontology、管理 schema 定义;②**查询/搜索/聚合**——支持精细的过滤和权限控制;③**写入编排**——包括索引数据源、以及基于 Action/决策产生的 Ontology 编辑。
- **核心服务清单(建议做成一张架构图贴在团队墙上)**:
  - **OMS(Ontology Metadata Service,本体元数据服务)**:定义"存在哪些本体实体"的总控服务,管理 object/link/action type 等的元数据;
  - **Object Data Funnel("Funnel")**:**OSv2 架构里负责编排"写入 Ontology"的核心微服务**——从数据集/Restricted View/流式数据源读数据,也读 Action 产生的用户编辑,统一索引进 object database,并持续保持数据新鲜;
  - **Actions 服务**:负责把用户编辑真正应用到 object database,支撑复杂权限和条件判断,还能生成用于分析的历史 action log(呼应批次4的 Action log 机制);
  - **OSS(Object Set Service)**:**负责服务 Ontology 的"读"请求**——支撑其他 Foundry 服务/应用对对象数据做搜索、过滤、聚合、加载;
  - **Object database(对象数据库)**:真正存储已索引对象数据的服务,同时负责索引、查询、编排用户编辑,分 **OSv1(Phonograph,legacy 遗留组件)** 和 **OSv2(下一代标准存储)** 两代。
- **⚠️ OSv1 → OSv2 的架构演进动机(帮你理解为什么官方一直建议迁移)**:**OSv1(Phonograph)把"索引"和"查询"两个关注点耦合在一起**,难以水平扩展;**OSv2 从第一性原理出发,把这些关注点彻底解耦**,让系统能更容易地水平扩展应对未来增长,同时通过 Object Data Funnel 引入了 Actions 等额外服务能力。**OSv2 相对 OSv1 的具体能力提升(2023年5月发布公告的原话)**:通过默认增量索引大幅提升索引性能;单个 object type 支持索引规模达到**数百亿(tens of billions)**级对象实例;用户编辑吞吐量提升到**单次 Action 最多编辑 10,000 个对象**(如需更高上限找 Palantir Support);更低的编辑延迟、前端应用能更快感知到用户编辑、编辑近实时自动同步进 materialized 对象数据集;支持 schema 破坏性变更后**迁移已有用户编辑**(OSv1 做不到这点);更细粒度的多数据源对象权限(支持列/属性级权限)。
- **迁移路径**:Ontology Manager 提供**自助迁移工具**,支持**无停机地**把 object type 从 OSv1 逐个选择性迁移到 OSv2;**⚠️ OSv1 目前没有被废弃或移除,但官方明确建议所有新 object type 都直接用 OSv2**(功能集更优、长期产品路线图也是围绕 OSv2 展开)——这是评估"存量 OSv1 类型要不要迁移"时的权威依据。

## Object permissioning(对象权限,归纳3篇核心内容)
https://www.palantir.com/docs/foundry/object-permissioning/overview/ 等

- **两层授权体系(和批次4/笔记四多次提到的机制完全对应)**:**Ontology resources(本体资源)层**——object/link/action type 本身的 schema 定义(display name、属性名、类型、描述等,不含实际数据);**Objects and links(对象与链接)层**——真正的数据本身(具体的主键和属性值)。**这两层权限是分开管理的**,理解这个分层是排查"为什么我能看到类型定义但看不到具体数据"这类问题的关键起点。
- **当前最新模型:项目权限(和笔记四第239条呼应,这里补充更多技术细节)**:Ontology 资源存进具体 Project,权限通过 **Compass**(平台文件系统)统一管理,**取代了之前的 Ontology roles 和数据源派生权限两种旧模型**。**⚠️ 一个具体的操作细节**:**如果对象存在项目里,背后的数据源也必须被导入这个项目,对象才能被索引**——如果背后数据源还没导入,创建对象时系统会自动提示你导入。
- **具体的编辑权限要求(容易被忽视的细节清单)**:**编辑链接**——必须同时拥有链接类型本身、以及链接两端两个 object type 的编辑权限;**编辑 Action**——必须同时拥有该 action type、以及这个 action 会编辑到的所有 Ontology 资源类型的编辑权限。**举例说明权限分层的实际含义**:如果你在 Project A 里是 Editor,你可以编辑 Building 这个 object type(的 schema 定义);但要查看具体某个 Building 对象的数据,还需要**单独**对该对象背后的数据源有权限——**"能改类型定义"和"能看到具体数据"是两件完全独立的事**。
- **⚠️ 旧版模型(Legacy ontology permissions)**:如果还在用数据源派生权限,**改 object type 及其属性要求对背后数据源有 Editor 权限**;**建/改共享属性要求是 Ontology Administrators 用户组成员**;**改链接类型要求对链接类型背后数据源有 Editor 权限、且对链接两端两个 object type 背后数据源有 Viewer 权限**——这套模型权限散落在多处数据源上,正是项目权限模型要解决的"心智负担"问题的具体例证。
- **对象和属性安全策略(Object and property security policies,推荐的行级/列级安全方案)**:可以直接在 object type 的 Ontology Manager 视图里配置,**独立于背后数据源的权限**,实现"对象实例级别"和"属性值级别"的**cell-level(单元格级)安全**——支持 mandatory/classification-based 访问控制,也支持更细粒度的访问控制。**相对于用 Restricted View 做数据源侧权限控制,这套方案的优势很明确**:**配置更简单**(直接在 object type 上配,不用绕数据源);**策略变更近乎实时生效**(RV 方式改权限需要重建整条管道,才能让新读取生效)；**支持流式数据源**(RV 方式做不到给流式对象类型加行/列级权限)。**这是你评估"敏感数据该用哪种权限方案"时最直接的决策依据**。

## Indexing(索引机制,归纳5篇核心内容)
https://www.palantir.com/docs/foundry/object-indexing/overview/ 等

- **索引 = 把 Foundry 数据源里的表格化(或其他形式)数据,转成能被专用数据库快速检索的格式**。OSv2 架构下,索引由 **Funnel 服务统一编排**,底层跑的是 **Funnel pipeline(内部作业管道)**。
- **两种 Funnel pipeline 类型,按场景二选一**:**Funnel batch pipelines(批处理管道)**——**默认对所有 object type 采用增量索引**,新事务发生时自动计算数据差异、只索引新增/变化的部分(而不是每次全量重跑),显著提升索引效率;**Funnel streaming pipelines(流式管道)**——针对 Foundry streams 类型数据源,提供**低延迟**的流式索引能力。
- **⚠️ 流式索引的当前功能局限清单(评估要不要用流式方案时的关键依据)**:**流式 object type 不支持用户编辑**(变通方案:要么把用户编辑作为一条数据变更推回输入流,要么额外配一个非流式数据源支撑的辅助 object type 专门承载编辑);**流式 object type 不支持多数据源对象(MDO)**;**除 Workshop 外,其他 Foundry 前端应用都不支持实时数据刷新**(因为历史上这些应用没有为流式更新设计);**流式管道能保证和输入流一致的顺序**(前提是数据按事件时间戳做好窗口划分、按主键做哈希分区写入)。
- **数据质量强校验(OSv2 独有,OSv1 相对宽松)**:**OSv2 强制主键唯一**——同一事务内出现重复主键,索引直接失败报错;**跨事务出现重复主键,则以较晚事务的版本为准**;**OSv2 限制某些数据类型不能作为主键**(用于引导更好的建模实践,呼应笔记三"Ontology design"里提到的建模最佳实践)。**⚠️ 这意味着从 OSv1 迁移到 OSv2 时,原本 OSv1 能接受的一些"脏数据"模式,在 OSv2 下可能直接触发索引失败**——评估迁移前,建议先对存量数据跑一遍这套校验规则自查。
- **⚠️ 具体的性能硬指标(容量规划直接依据)**:**索引吞吐量限制为每个 object type 2 MB/s**,写入 OSv2 object database(需要更高吞吐找 Palantir Support 申请)。
- **监控与排障**:Ontology Manager 里有专门的 pipeline graph 展示 Funnel pipeline 各作业状态,**OSv2 节点显示绿色勾号代表索引完成、该类型已可被查询**;支持配置 **Sync Propagation Delay 规则**,当索引数据的"新鲜度"超过阈值时触发告警——这是你监控"数据从写入到可查询之间延迟"是否符合业务预期的直接工具。

## Object edits and materializations(对象编辑与物化,归纳5篇核心内容)
https://www.palantir.com/docs/foundry/object-edits/overview/ 等

- **Materialization(物化)机制**:把 Ontology 里的编辑结果**物化**成普通的 Foundry 数据集/Restricted View,供下游管道消费——在 Ontology Manager 的 Datasources 标签页开启 Edits 配置后,进入 Materializations 标签页配置。**⚠️ 物化数据集会自动更新,不能像普通数据集那样从 Dataset Preview 手动触发构建**。
- **⚠️ OSv1 writeback dataset vs OSv2 materialized dataset 的 schema 来源不同(容易踩的坑)**:**OSv1 直接照搬输入数据源的 schema** 作为 writeback dataset 的 schema;**OSv2 则改成从 Ontology 的类型定义里取 schema(具体用每个属性的 API Name)**——这是为了提高 Ontology 的可读性/legibility 做的有意改动。**如果你正从 OSv1 往 OSv2 迁移、且需要保证下游对 writeback 数据集 schema 的向后兼容**,需要联系 Palantir 代表专门处理。物化数据集里出现的 `__is_deleted`、`__patch_offset` 这类**双下划线前缀列是 Foundry 内部去重用的元数据列**,不代表业务数据本身,排查数据问题时可以忽略。
- **Action 应用时的一致性保障(技术含量较高,建议关注)**:应用 Action 时会加载对象类型定义和对象实例(用于校验/Function执行/side effect),**由于对象实例在 Action 执行过程中可能发生变化,系统必须保证事务性**,避免"把 Action 应用到了错误版本的对象"这类数据正确性问题——Ontology 内置了**版本一致性检查机制**,OSv1 和 OSv2 在具体实现上有所不同。
- **Schema 变更管理(⚠️ 和批次3反复提到的"破坏性变更"话题在架构层面的根本原因)**:**破坏性 schema 变更**包括改属性数据类型、改 object type 背后数据源、改主键等。**OSv1(Phonograph)的架构性局限**:**不支持编辑迁移**——一旦发生破坏性变更,已有的用户编辑要么直接丢失,要么需要耗时复杂的人工干预才能抢救;界面因此会主动"劝退"你对已有编辑的 object type 做这类变更。**没有 schema 迁移支持时唯一的变通方案是移除 writeback dataset 配置,但这会直接删掉所有已有用户编辑**——代价很大。**OSv2 从架构上彻底解除了这个限制**,让破坏性 schema 变更可以支持编辑迁移,允许更灵活迭代的工作流搭建——**这正是官方反复建议新 object type 用 OSv2 的最核心技术原因之一**。
- **权限检查的分支逻辑**:应用 Action 时具体的权限检查规则,**取决于你编辑的是单数据源对象还是多数据源对象(MDO)**,两者的检查路径不同。
- **用户编辑历史(User edit history)**:可以为索引进 OSv2 的对象类型,**单独开启/关闭"追踪用户编辑历史"这一功能开关**——这是你要不要为某个类型保留完整编辑审计轨迹的直接配置入口。

## Object databases(对象数据库,归纳1篇,内容已并入上文 Overview 部分)

- Object databases(对象数据库)= **实际存储已索引对象数据、并负责查询计算的服务层**,如上文所述,分 OSv1(Phonograph)和 OSv2 两代。这条概念在 Overview 部分已完整展开,这里不再重复。

---

# 🎉 Ontology architecture 后端(约21篇)全部完成 —— 整个学习计划圆满收官!

**四份笔记文件累计合计 378 篇**,完整覆盖了 https://www.palantir.com/docs/foundry/ontology/overview/ 左侧导航树下的全部内容:

| 大类 | 篇数 | 所在文件 |
|---|---|---|
| Ontology building 总览 | 5 | 笔记一 |
| Ontologies | 10 | 笔记一 |
| Object and link types | 45 | 笔记一 |
| Action types | 34 | 笔记一 |
| Functions | 68 | 笔记二 |
| Interfaces | 9 | 笔记三 |
| Ontology 设计三篇 + search + scenarios | 25 | 笔记三 |
| 应用层(Object Explorer/Monitors/Views/Ontology Manager/Vertex/Machinery/Rules/Map/Dynamic Scheduling) | 约161 | 笔记三 + 笔记四 |
| Ontology architecture 后端 | 约21 | 笔记四 |

**给你的一条总览性建议**:如果只能重读三个部分来抓核心,建议是 ——① **笔记一的 Object/link types + Action types**(建模与写回的基础语言);② **笔记三的 Ontology 设计三篇**(最佳实践/结构指南/反模式,少走弯路的最快方式);③ **笔记四的这一部分(后端架构)**(理解"为什么会这样设计",尤其是 OSv1→OSv2 的演进逻辑,贯穿了几乎所有批次里提到的各种限制和最佳实践建议的根本原因)。

如果后续还想深挖某个具体主题(比如某几篇原文我标注"未能独立确认"的页面,或者你在实际操作中遇到的具体问题),随时告诉我,我可以针对性地单独去查证补充。
