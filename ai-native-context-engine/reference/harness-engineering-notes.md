# Harness Engineering for Self-Improvement — 笔记与 Agent 平台落地要点

- 原文：Lilian Weng, *Harness Engineering for Self-Improvement* (2026-07-04)
- 链接：https://lilianweng.github.io/posts/2026-07-04-harness/

---

## 0. 核心概念：什么是 Harness

文章把"harness"定义为**包裹在基座模型外层、决定模型如何思考规划、如何调用工具、如何感知与管理上下文、如何存储产物、如何评估结果的系统**。相比 2023 年"agent = LLM + memory + tools + planning + action"的老公式，harness 工程多出了三块：**workflow 设计（loop engineering）、评估机制、权限控制与持久状态管理**。类比操作系统——对外接口简单，内部封装复杂逻辑，且工具协议/配置会逐渐在行业内标准化（这与咱们把 MCP 定为唯一工具协议的思路是一致的）。

这条主线也是全文的论点：harness 质量已经和模型本身的智能一样重要，是实现"递归自我改进"（RSI）的关键中间层。

---

## 1. 三个基础设计模式（Design Patterns）

### Pattern 1：Workflow Automation（工作流自动化）
- 核心循环：**plan → execute → observe/test → improve → execute**，直到目标达成。
- 关键不是静态 prompt 模板，而是让 agent 通过"agent runtime"分析自己的历史轨迹和失败案例，在循环中迭代改进。
- 流程中应允许在任务规范不清晰时主动向用户澄清（proactive clarification）。

**→ 对 Agent 平台的启发**：MRA、Ontology Chat、Data Agent 这类业务线的 workflow 引擎，不应该只是一次性 prompt-chain，而要内建"观察-反思-改进"的显式循环节点，并把失败轨迹作为一等公民保存下来供后续分析。

### Pattern 2：File System as Persistent Memory（文件系统作为持久记忆）
- 长程 agent 任务不应把全部日志和状态塞进 context；实验日志、代码 diff、错误轨迹、历史 rollout 都应该落盘为文件。
- "读写编辑文件系统"（通常通过 bash）本身是 LLM 的基础能力，随着模型能力提升会自然变强，不需要额外定制。

**→ 对 Agent 平台的启发**：这直接印证了你们"Agent Runtime + MCP 工具协议"的设计方向——长期记忆/中间产物用文件系统 + 结构化目录承载，而不是无限拉长上下文或依赖专门的记忆数据库。FDE Workbench、MRA 的技能文件混合架构可以参考此模式做统一规范。

### Pattern 3：Sub-agent and Backend Jobs（子代理与后台任务）
- 主 agent 需要一个轻量"进程管理器"：启动任务、查日志、取消失败任务、把结果合并回主线程。
- **关键设计原则：并行必须是显式且可检查的**。如果子代理输出只存在于临时 chat context 里，很快就会过时且不可见；必须落地为文件、日志、状态记录，这样主 agent 才能在中断后恢复，并对自己的执行历史进行推理。

**→ 对 Agent 平台的启发**：这正是你们 Agent 能力平台里 `spawn_agent / resume_agent / wait_agent / list_agents / close_agent / interrupt_agent` 这套接口设计要对齐的标准模式（见下方案例表格）。子代理的中间状态必须结构化落盘，而不是只活在会话上下文里。

---

## 2. Coding Agent Harness 案例：工具分组参考表

文中总结了 Claude Code / Codex / OpenCode / Cursor 类产品的通用工具分组，可直接作为 Agent 能力平台工具目录设计的参考基线：

| 分组 | 工具示例 |
|---|---|
| 文件系统 | 发现：`glob`/`grep`/`ls`；读取：`read`/`read_many`；修改：`write`（整文件覆写）、`edit`（精确字符串替换）、`multi_edit`、`apply_patch`（结构化 diff） |
| Shell 执行 | `bash`、`PowerShell` |
| IO | `lsp`、`git_status`/`git_diff`/`git_commit` |
| 外部上下文 | MCP 工具、Skills |
| 网络搜索 | `web_search`、`web_fetch`、浏览器工具 |
| 产物生成 | 读取文档/图片、生成 HTML/图片 |
| 后台任务 | `CronCreate`/`CronDelete`/`CronList` |
| 子代理调度 | `spawn_agent`/`resume_agent`/`wait_agent`/`list_agents`/`close_agent`/`interrupt_agent` |

**落地建议**：这套分组和你们"MCP 作为唯一工具协议"的五层架构可以直接映射——每个分组对应一类 MCP Server/能力域，子代理调度可作为 Agent Runtime 的原生一等能力而非附加功能。

---

## 3. Harness 层 vs 核心智能：一个务实的预测

作者给出一个两阶段预测，值得作为你们做 Agent 平台路线规划的参考锚点：

1. **短期**：harness 工程会往"元方法论"方向演化——优化的不是答案本身,而是"获得更好答案的机制"。harness 系统自身成为优化目标,规则从启发式走向通用机制。
2. **中期**：成熟的 harness 支撑起模型自我改进的自动化研究闭环；反过来更聪明的模型能防止 harness 被过度工程化，维持系统的可持续性。

长期看，很多 harness 层的改进最终会被"内化"进模型本身的行为（类比 prompt engineering 的手工技巧逐渐被 instruction tuning 取代），但**指定目标、约束、上下文和评估标准的需求不会消失**——也就是说 harness 层的接口价值是持久的，只是实现细节会被模型能力吸收。

**→ 对组织/技术规划的启发**：这为"要不要重投入自建 harness 能力"提供了一个判断框架——投资 harness 中"指定目标/约束/评估"这一层的抽象和协议设计（对齐你们的 ontology 语义控制层思路），比投资具体的手工规则更有长期价值，因为前者不会被模型进步淘汰。

---

## 4. Harness 优化的演进路径（核心框架，重点看）

文章给出一条清晰的优化对象演进链：

```
指令 prompt → 结构化上下文 → workflow → harness 代码 → optimizer 代码
```

模型越强，优化目标越应该往右移（从手写规则走向可执行的搜索空间）。以下按这条链展开各类方法。

### 4.1 Context Engineering（上下文工程）

三个层层递进的方法，代表了"上下文管理"从手工规则走向自动化元优化的路径：

**ACE (Agentic Context Engineering)**：把上下文当作**可进化的 playbook**（结构化要点集合），而不是越写越长的单一 prompt。三组件：
- *Generator*：参照现有 bullet 生成任务轨迹
- *Reflector*：从成功/失败轨迹中提炼洞察
- *Curator*：增量式更新结构化上下文（不是重写整个 prompt blob，而是输出带 id 的结构化条目，用确定性逻辑合并去重）

关键设计点：**避免"上下文坍塌"和重写时的简洁偏差（brevity bias）**——不要让模型一遍遍地"总结再总结"导致信息丢失，而是维护一份持续增量合并、定期去重的结构化日志。

**MCE (Meta Context Engineering)**：在 ACE 基础上更进一步，把"如何管理上下文的机制"和"上下文里具体内容"解耦成双层优化：
- Inner loop：给定一个 skill，在训练集上找最优上下文
- Outer loop：在验证集上搜索最优 skill

实现上，一个 skill 就是文件系统里的一个目录，包含静态部分（`skill.md`）和动态部分（context + rollout 数据），统一用 `Read/Write/Edit/Bash/Glob/Grep/TodoWrite` 这套标准工具集操作。

**Meta-Harness**：比 MCE 更深一层——优化对象直接是"决定该存什么、检索什么、呈现什么给模型"的**代码本身**。提案者本身就是一个 coding agent，最终产出一批 Pareto 前沿上的 harness 候选。核心结论：**一旦 harness 设计变成一个可执行的搜索空间，强 coding agent 就能像人类工程师一样利用这个设计空间**。

**→ 对你们 Skills 文件混合架构（MRA）和 Agent 能力平台的直接启发**：
1. context 管理不应是一次性 prompt 拼接，应设计成"结构化 playbook + 增量合并 + 定期去重"的持久化机制，与你们已有的 skills-file 混合架构思路高度吻合，可以借鉴 ACE 的 Generator/Reflector/Curator 三角色分工。
2. 可以考虑把"上下文管理策略"本身做成可配置、可版本化、可评估的 skill 对象（对应 MCE 思路），而不是写死在 Agent Runtime 代码里，方便针对 MRA / Ontology Chat / Data Agent 不同业务线独立进化。

### 4.2 Workflow Design（工作流设计）

- **AI Scientist / ScientistOne**：自动研究全流程（提出想法→写代码→跑实验→分析→写论文→同行评审）。ScientistOne 强调"可验证性"——每个论断（引用、数值、方法、结论）都要能追溯到证据来源，并通过 Chain-of-Evidence 审计。
- **Autodata**：多角色协作模式（*challenger* 出题、*weak/strong solver* 解题、*verifier* 判题），目标是合成"强模型能解但弱模型解不了"的恰好难度数据。局限：只用来微调弱模型，若不能反哺强模型则更接近蒸馏而非真正的自我改进。
- **ADAS / AFlow**：把 workflow 设计本身当作搜索问题。ADAS 用 meta-agent 在代码层面提出新的 agentic workflow 设计，并做二次 self-refine 检查新颖性；AFlow 把 workflow 表示为图（节点=LLM 调用，边=逻辑操作），用 MCTS 搜索最优图结构。

**→ 对 Agent 能力平台的启发**：这类"多角色协作 + 可验证证据链"的模式，与你们 Data Agent / Ontology Chat 中"提出假设-验证-归档"的诉求高度契合，尤其 ScientistOne 的 Chain-of-Evidence 审计机制，可以作为 Ontology 语义对齐层做"答案可追溯性"设计的参考。

### 4.3 Self-Improving Harness（自我改进的 harness）——全文最核心部分

核心论点：**代码是描述 harness 的通用语言**。如果 LLM 能优化执行 agent 的代码本身,它能触达的设计空间远大于手写 prompt。这一节按复杂度递进介绍了几个方法：

**STOP (Self-Taught Optimizer)**：早期工作，"改进者改进自己"——不直接优化解 s，而是优化"改进函数 I"本身。**重要警示**：STOP 在 GPT-4 上能持续改进，但在 GPT-3.5/Mixtral 等弱模型上反而变差。**结论：递归结构本身不够，基座模型必须有足够能力才能改进机制本身**——harness 改进放大的是模型能力的部署效果,而不能替代模型智能。

**Harness-updating vs harness-benefit 的解耦（Lin et al. 2026）**：这是一个非常实用的发现——
- *harness-updating 能力*（写出有用的 harness 编辑）在不同规模模型间（从 9B 到 Opus 4.6）差异不大，小模型也能写出与大模型"过程同构"的 skill。
- *harness-benefit 能力*（利用更新后 harness 的能力）是非单调的，**中等档位模型受益最大**——用好 harness 需要模型能正确、及时地调用 skill/工具，并具备良好的长程指令遵循能力。

**→ 这一点对你们评估 GLM-5.2 / Kimi-K3 / DeepSeek-V4-Flash 接入生产时非常有参考价值**：不能只看模型"写 harness 配置/skill 文件"的能力，更要重点评估其"长程指令遵循 + 精准工具调用时机"的能力，这直接决定了该模型能否把已有 harness 的价值发挥出来。中等能力模型不一定是短板，反而可能是 harness 收益的甜点区间。

**Self-Harness**：三阶段闭环，工程细节非常值得直接复用到你们的 Agent Runtime 设计：
1. *Weakness mining（弱点挖掘）*：把失败聚类成"有 verifier 依据的失败模式"。**关键提醒**：两次运行表面上是同一种失败（如超时、产物缺失），但因果机制可能完全不同,因此失败记录要包含终态 verifier 结论 + agent 行为的因果状态 + 轨迹暴露出的抽象机制这三层信息，才能找到根因。
2. *Harness proposal（有边界的提案）*：同一模型在当前 harness 下作为 proposer，给它的上下文必须**有边界**：(1) 当前 harness 的可编辑面 (2) 有 verifier 依据的失败模式 (3) 需要保留的正确行为记录 (4) 历史已尝试编辑的摘要。优先解决"可复现、可被窄范围修改解决"的问题，避免过拟合单个任务。候选编辑要求彼此差异化、多样化。
3. *Proposal validation（验证与合并）*：用 held-in（验证弱点是否解决）+ held-out（检查是否引入新问题）双数据集回归测试，**两边都不能有退化才能被接受**；被拒绝的候选要记录但不改变当前 harness。

**Agentic Harness Engineering (AHE)**：把瓶颈定位为**可观测性**，提出三大支柱，是目前这条线里工程化程度最高、最值得直接照搬的设计：

1. **组件可观测性**：harness 被拆成 7 个组件——system prompt、tool description、tool implementation、middleware、skill、sub-agent configuration、long-term memory，每个组件在文件系统中都有实体表示，每个失败模式都要映射到具体某个组件，编辑才能做到精准打击。
2. **经验可观测性**：用"Agent debugger"分析每条轨迹（每条存一个文件），生成单任务的根因分析报告，再把所有报告聚合成 benchmark 总览，原始轨迹按需访问——**分层访问结构，token 效率更高**。
3. **决策可观测性**：每次编辑都配一个"下一轮要验证的预测"。"Evolve agent"读仓库、决定改哪个组件、生成编辑和理由。两条硬约束非常关键：
   - **编辑只能作用于 harness workspace，runs 目录/tracer/verifier/LLM 配置全部只读**——这直接堵死了一大类 reward hacking（比如让 agent 偷偷关掉 verifier、换个更弱的模型、或者偷偷加大推理预算），保证每一份"进步"都能归因到 harness 编辑本身。
   - **编辑必须证据驱动**，每条编辑都要有 manifesto：失败证据的名字、推断的根因、目标修复方案、预测影响（预期修复+可能引入的回归风险）。

在 Terminal-Bench-2 上，AHE 优于人工设计的 harness（OpenCode、Terminus-2、Codex），且**同一个冻结后的 harness 不再继续进化的情况下，能直接迁移到 SWE-bench-verified 并保持优势**——说明它学到的是可迁移的工程经验，而不是针对某个 benchmark 的过拟合技巧。

**→ 这一节是全文对你们 Agent 能力平台最直接可用的部分**，建议重点参考落地：

1. **组件拆分**：把你们 Agent Runtime 的 harness 也拆成类似的可编辑组件清单（system prompt / tool description / tool impl / middleware / skill / sub-agent config / long-term memory），每个失败案例都强制映射到具体组件，而不是笼统地"改 prompt"。
2. **权限边界**：明确划出"可编辑区"和"只读区"（runs 目录、tracer、verifier、LLM 网关配置只读），这是防止自动化改进滑向 reward hacking 的第一道防线，应该在你们的 Agent Gateway/权限层就做硬隔离，而不是靠约定。
3. **失败记录三层结构**：终态结论 + 行为因果状态 + 抽象机制，可以直接作为你们 MRA/Data Agent 的 trace schema 设计参考。
4. **证据驱动的编辑记录（manifesto）**：每次 skill/prompt/config 编辑都强制记录根因、预期修复、风险预测，下一轮验证时回头检查预测是否成立——这套"可证伪的编辑日志"机制，可以直接用来管理你们 skills-file 的迭代版本。

### 4.4 Evolutionary Search（进化搜索）

适用场景：**搜索空间巨大或形状不规则、难以用梯度直接优化、但评估解的好坏很容易**——harness 搜索天然适合。

- **Promptbreeder / GEPA**：prompt 层面的进化搜索，GEPA 结合了"反思"（对轨迹做自然语言复盘）和进化算法。
- **AlphaEvolve**：代码进化搜索系统，维护候选程序池，让冻结的 LLM 生成 diff 改进。关键设计：待改进代码区域要用 `# EVOLVE-BLOCK-START/END` 显式标记（而不是让模型改整个仓库）；meta-prompt 本身也跟着解的进化一起进化。
- **ShinkaEvolve**：三个提升采样效率的技巧——(1) 父代采样兼顾排名和已生成子代数量做平衡 (2) 基于 embedding 余弦相似度做"代码新颖性拒绝采样"，丢弃与现有种群过于相似的候选 (3) 用 meta-scratchpad 记录成功模式指导后续变异方向。
- **Darwin Gödel Machine (DGM) / Hyperagents**：直接进化"harness 代码仓库本身"，agent 被允许修改自己的 harness。流程：按性能概率选父代（子代数越多，被选概率越低，鼓励多样性）→ 父代看自己的评测日志提出改进 → 生成新版本 → 评测达标才入池。用 `Claude 3.5 Sonnet` 做基座、简单初始 harness 配置起步，最终发现的 agent 在 SWE-bench Verified 上从 20%→50%，Polyglot 从 14.2%→30.7%。

局限：这类方法在"评估慢、模糊、依赖启发式判断"的领域效果差，且进化过程本身的算力效率和有效性都是待解决的问题。

**→ 对 Agent 平台的启发**：如果未来想让 skills/prompt 库自动进化，可以借鉴 ShinkaEvolve 的"新颖性拒绝采样"思路，避免大模型生成的 skill 变体同质化；DGM 的"子代数越多父代被选概率越低"这个反馈机制，对维护 skill 库多样性也有直接参考价值。

### 4.5 Joint Optimization with Model Weights（harness 与模型权重联合优化）

- **SIA**：Meta-Agent（提出初始 harness）+ Task-Specific Agent（执行任务）+ Feedback-Agent（根据近期轨迹决定该更新 harness 还是更新模型权重）。作者指出实验设计有明显 confounding（task agent 用 gpt-oss-120b，远弱于做 meta/feedback 的 Claude Sonnet 4.6），方向有意思但证据尚不充分。
- **Continual Harness**：在长程游戏场景中，harness 更新与"从强教师模型蒸馏低 reward 轨迹的标签来协同训练策略模型"结合。

这部分偏研究前沿，暂时对生产系统参考价值有限，可以持续关注但不必急于落地。

---

## 5. 未来挑战（对做 Agent 平台的风险提示）

这部分本质上是一份"自动化 harness 迭代时会踩的坑"清单，直接对照你们的场景：

1. **弱/模糊的评估器**：只有指标可量化、客观的任务，自我改进循环才work得好。Ontology Chat 这类涉及语义理解质量的任务，评估器设计会是长期难点。
2. **上下文与记忆的生命周期**：作者认为 context engineering 会逐渐从"软件系统层"变成"智能本身的核心部分"——值得作为你们 Agent Runtime 长期演进方向的判断依据。
3. **负面结果**：模型训练数据整体偏向"成功案例"，导致模型不擅长判断"该放弃这个假设了"。**Harness 应该让失败尝试容易被保留下来**，这是缩小任务搜索空间最有效的方式之一——直接呼应第 4.3 节 Self-Harness 的弱点挖掘设计。
4. **多样性坍塌**：进化/RL 循环容易过度利用已知高回报模式，需要专门机制防止种群收敛到同质解。
5. **Reward Hacking**：无论 reward 来自单测、judge 模型还是 benchmark 分数，agent 都可能钻空子。**结论与 AHE 一致：评估器和权限控制应该放在"进化 harness 的循环"之外**，配合 held-out 测试、轨迹审计、以及在关键决策点做人工复核。这个"多大程度上可以规模化自动化监督"目前仍是开放问题。
6. **长期健康度**：短期任务完成度指标（如单测通过）无法捕捉可维护性、职责边界、迁移成本、向后兼容性这些长期成本——对企业级交付场景（你们的 to-B 模式）尤其重要。
7. **人的角色**：人应该"上移到更高的抽象层"而不是被移出循环，系统设计要考虑何时、以何种粒度设置人工介入点。

**→ 对组织设计的启发**：结合你们已经在做的 FDE 层设计（Palantir Echo/Delta 模式），"人上移到更高抽象层"这条原则可以直接映射为 FDE 的核心职责定义——FDE 不该陷入具体 prompt 调优，而应设在"harness 编辑验证""证据链审计"这类关键决策点上。

---

## 6. 一句话总结 & 给 Agent 平台的行动清单

**一句话总结**：Harness（模型外层的运行时系统）正在从手写规则演变为可被搜索、可被自动优化的代码空间，其中最工程化、可复现、可迁移的路径是"组件化 + 可观测 + 证据驱动编辑 + 只读边界隔离"（AHE 模式），而不是无约束地让模型改自己。

**可直接消化进 Agent 能力平台设计的行动项**：

- [ ] 把 Agent Runtime 的 harness 拆成显式组件清单（system prompt / tool desc / tool impl / middleware / skill / sub-agent config / long-term memory），每个组件独立可版本化、可回归测试。
- [ ] 子代理调度接口对齐 `spawn/resume/wait/list/close/interrupt` 语义，中间状态全部落盘，不依赖会话上下文。
- [ ] 上下文管理采用"结构化 playbook + 增量合并去重"模式（借鉴 ACE），而不是长 prompt 拼接。
- [ ] 给"harness 自动编辑/skill 自动生成"这类未来能力预留权限边界设计：编辑面与 runs/tracer/verifier/网关配置强制隔离。
- [ ] failure trace schema 采用三层结构（终态结论/行为因果/抽象机制），支撑后续弱点挖掘。
- [ ] 模型选型评估（GLM-5.2/Kimi-K3/DeepSeek-V4-Flash）时，除了基础能力，单独评估其"长程指令遵循 + 工具调用时机"这一维度，这决定了该模型能多大程度吃到 harness 红利。
- [ ] FDE 角色定位可参考"人上移到更高抽象层"原则，聚焦在证据审计和关键决策点，而非具体调优。
