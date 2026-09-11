# Kimi-K2.6 / Kimi-K3 技术架构解析

> 资料来源：Hugging Face 模型卡（moonshotai/Kimi-K2.6、moonshotai/Kimi-K3）、Kimi K2.5 技术报告《Kimi K2.5: Visual Agentic Intelligence》（arXiv:2602.02276）、Kimi K3 技术报告（k3_tech_report.pdf，Moonshot 官方 GitHub）、Kimi Linear 论文（KDA 原始出处，2025年10月）、以及若干第三方架构解读（SemiAnalysis、Andrey Lukyanenko 博客等）。凡未在官方模型卡/技术报告中直接给出数值、来自第三方逆向分析或推算的内容，均标注来源，供交叉验证。

---

## 1. 系列概览

Moonshot AI（月之暗面）的 Kimi 系列近两代的核心主线是：**原生多模态 Agentic 能力 + 超大规模 MoE 稀疏化效率**。

| 模型 | 总参数 | 激活参数 | 层数 | 上下文 | 注意力机制 | 定位 |
|---|---|---|---|---|---|---|
| Kimi-K2.6 | 1T | 32B | 61 | 256K | MLA（标准多头潜在注意力） | 长时程编码 + Agent 蜂群编排 |
| Kimi-K3 | 2.8T | 104B | 93 | 1M | KDA + Gated MLA 混合 | 全球首个开源 3T 级模型，长时程编码/知识工作/推理 |

K2.6 与 K3 之间是一次**架构范式的跃迁**：K2.6 仍是"MLA + 标准 MoE"的稳健路线，K3 则引入了全新的 **Kimi Delta Attention（KDA）线性注意力**、**Attention Residuals（AttnRes，跨深度的注意力式残差）**和 **Stable LatentMoE**，是三条独立的架构创新同时落地到 3T 级别模型上的罕见案例。

---

## 2. Kimi-K2.6：架构细节（官方模型卡）

### 2.1 核心参数

| 项 | 数值 |
|---|---|
| 总参数 | 1T |
| 激活参数 | 32B |
| 层数（含 1 层 dense） | 61 |
| Attention 隐藏维度 | 7168 |
| MoE 隐藏维度（单专家） | 2048 |
| 注意力头数 | 64 |
| 专家总数 | 384（8 激活 + 1 共享） |
| 词表大小 | 160K |
| 上下文长度 | 256K |
| 注意力机制 | MLA |
| 激活函数 | SwiGLU |
| 视觉编码器 | MoonViT（400M 参数） |

架构本身与前代 Kimi-K2.5 完全一致（模型卡原文明确"has the same architecture as Kimi-K2.5, and the deployment method can be directly reused"），K2.6 的提升主要来自**训练数据/后训练策略的迭代**，而非结构性改动。

### 2.2 能力特性（官方强调）

- **长时程编码（Long-Horizon Coding）**：面向 Rust/Go/Python 等多语言、前端/DevOps/性能优化等多领域的端到端复杂编码任务。
- **编码驱动设计（Coding-Driven Design）**：把简单文字/视觉输入转化为可用的生产级界面和轻量全栈工作流。
- **Agent 蜂群（Elevated Agent Swarm）**：单次自主运行中可**横向扩展到 300 个子 Agent、协同执行 4000 步**，动态把任务拆解为并行的领域专精子任务。
- **主动式 & 开放编排（Proactive & Open Orchestration）**：支持无人值守的 **24/7 后台常驻 Agent**，主动管理日程、执行代码、跨平台编排。

### 2.3 推理与工程细节

- **原生 INT4 量化**：采用与 Kimi-K2-Thinking 相同的原生 INT4 量化方案。
- **Thinking / Instant 双模式**：Thinking 模式推荐 `temperature=1.0`，Instant 模式推荐 `temperature=0.6`，`top_p=0.95`；通过 `chat_template_kwargs.thinking=False`（第三方部署）或 `thinking.type=disabled`（官方 API）切换。
- **preserve_thinking**：支持跨多轮对话保留完整推理内容（默认关闭），对编码 Agent 场景有实测收益。
- **交错思考 + 多步工具调用**：与 Kimi-K2-Thinking 共享同一套设计。
- **图像+视频输入**：视频对话为实验性功能，目前仅官方 API 支持；vLLM/SGLang 第三方部署以图像输入为主。
- **推荐部署引擎**：vLLM、SGLang、KTransformers；`transformers` 版本要求 `>=4.57.1, <5.0.0`。

### 2.4 关键基准（官方模型卡节选）

| 基准 | Kimi K2.6 | GPT-5.4(xhigh) | Claude Opus 4.6(max) | Gemini 3.1 Pro | Kimi K2.5 |
|---|---|---|---|---|---|
| SWE-Bench Verified | 80.2 | - | 80.8 | 80.6 | 76.8 |
| Terminal-Bench 2.0 | 66.7 | 65.4 | 65.4 | 68.5 | 50.8 |
| BrowseComp | 83.2 | 82.7 | 83.7 | 85.9 | 74.9 |
| DeepSearchQA (F1) | 92.5 | 78.6 | 91.3 | 81.9 | 89.0 |
| MMMU-Pro | 79.4 | 81.2 | 73.9 | 83.0 | 78.5 |

结论倾向：K2.6 相对 K2.5 在几乎所有维度都有显著提升（尤其 Toolathlon 从 27.8→50.0、MCPMark 从 29.5→55.9），已接近甚至部分反超同期闭源旗舰在搜索类/Agentic 任务上的表现，但纯推理类硬指标（HLE-Full 无工具、AIME、HMMT）上仍落后 GPT-5.4/Gemini 3.1 Pro。

---

## 3. Kimi-K3：三项核心架构创新

Kimi-K3 官方定位为"**世界首个开源 3T 级模型**"，模型卡明确指出其建立在 **Kimi Delta Attention（KDA）** 和 **Attention Residuals（AttnRes）** 之上，并通过 **Stable LatentMoE** 框架把 MoE 稀疏度进一步做大——16/896 专家激活，相对 K2 带来约 **2.5 倍整体 scaling 效率提升**（此为官方口径，具体测算方法未完全公开，第三方评价认为需要等完整技术报告佐证）。

### 3.1 核心参数（官方模型卡）

| 项 | 数值 |
|---|---|
| 总参数 | 2.8T |
| 激活参数 | 104B（激活比约 3.7%，第三方文章称"1.8%"口径不同，可能统计口径含义不同——建议以模型卡 104B/2.8T 为准） |
| 层数 | 93（1 层 dense） |
| 注意力层构成 | 69 层 KDA + 24 层 Gated MLA |
| Attention 隐藏维度 | 7168 |
| 注意力头数 | 96 |
| Latent MoE 维度 | 3584 |
| MoE 隐藏维度（单专家） | 3072 |
| 专家总数 | 896（16 激活 + 2 共享） |
| 词表大小 | 160K |
| 上下文长度 | 1,048,576（1M） |
| 激活函数 | SiTU-GLU |
| 视觉编码器 | MoonViT-V2（401M 参数） |
| 量化 | MXFP4 权重 / MXFP8 激活（量化感知训练，从 SFT 阶段就引入） |

### 3.2 Kimi Delta Attention（KDA）：序列维度的效率突破

KDA 并非 K3 首创，而是源自 Moonshot 2025 年 10 月发表的《Kimi Linear》论文，在 K3 上被大规模放大验证。其技术脉络（第三方技术解读综合，非本模型卡原文）：

- 演化路径：标准 softmax 注意力 → 去 softmax 的线性注意力 → DeltaNet → Gated DeltaNet（GDN）→ **KDA**。
- 核心思路：KDA 是一种**基于 delta 规则的线性注意力**，用**逐通道（channel-wise）的可学习遗忘门**控制固定大小的循环状态（recurrent state）如何更新——不同于标准注意力需要随序列增长而增长的 KV cache，KDA 的状态大小固定，不随上下文长度膨胀。
- **位置编码**：位置信息隐式来自 KDA 自身的门控和衰减机制，**不需要 RoPE**，这意味着扩展到 1M 上下文窗口时不存在"频率插值/rescale"的老问题。
- **层间排布**：K3 中每 3 层 KDA 后接 1 层全局 Gated MLA（模型卡列出的 69 KDA + 24 MLA 大致对应约 3:1 的比例），用 KDA 做低成本的局部/近距离建模，用少数全局 MLA 层保证长距离检索精度。
- **官方/第三方引用的收益数据**：Kimi Linear 论文报告 KDA+MLA 混合相对纯 MLA 可降低 KV cache 用量约 75%；第三方文章引用"1M 上下文下解码速度提升 6.3 倍"，这一具体倍数来自第三方汇总材料，未在本次读取的官方模型卡原文中直接确认，建议以完整技术报告为准。

### 3.3 Attention Residuals（AttnRes）：深度维度的信息流优化

这是解决"深层网络信号稀释"问题的新方案，思路上把**残差累加**问题重新表述为**跨层检索（retrieval）**问题（第三方技术解读）：

- **标准残差的问题**：每层输出无差别地叠加进同一条残差流，当层数深至上百层，早期层的信号贡献会被稀释、隐藏状态数值容易失衡。
- **AttnRes 的做法**：每一层生成一个可学习的伪 query，对 embedding 层及此前所有层的输出做 softmax 注意力，**有选择性地"读取"它真正需要的历史层表示**，而非被动接受一条累积残差流。
- **分块设计**：K3 采用分块变体——8 个 block、每 block 12 层，把"回看更早层输出"的显存开销控制在有限范围内。
- **官方/第三方引用的收益数据**：第三方文章引用"额外增加约 2% 计算成本、换取约 25% 的训练效率提升"，此数值同样来自第三方汇总材料而非本次读取到的官方模型卡原文。

### 3.4 Stable LatentMoE：宽度维度的稀疏化放大

- **做法**：在路由专家前后加入低维的"压缩-解压"通道（LatentMoE 通信优化范式）——先把待分发（dispatch）的 token 表示压缩到较低维度的 latent 空间，跨设备通信完成专家计算与聚合（aggregation）后再解压回原维度，从而降低分布式训练/推理中的跨卡通信量（通信量与总路由 token 数、激活专家数 K、专家输入维度 d 成正比，压缩维度直接降低这一开销）。
- **稳定性改进（"Stable"的含义）**：在解压（up-projection）之前引入 RMSNorm，降低模型对数值尺度变化的敏感度，这被认为是相对原始 LatentMoE 论文的关键改进点，用来避免大规模路由 MoE 训练中常见的数值不稳定问题。
- **规模**：896 个路由专家中每 token 激活 16 个 + 2 个共享专家，是本文覆盖的四个模型系列中路由专家数量最多、稀疏度最高的设计。

### 3.5 三项创新的关系（组合，而非替代）

第三方技术解读给出了一个清晰的类比框架：**序列维度交给 KDA，深度维度交给 AttnRes，宽度维度交给 Stable LatentMoE**，三者相互独立、可组合叠加，最终堆叠成一个 2.8T 总参数、但单 token 仅激活 104B 参数（约 3.7%）的模型——这正是"模型规模巨大但推理成本可控"的工程基础。

### 3.6 推理与部署细节（官方模型卡）

- **思考模式常开**：K3 始终启用 thinking，返回 `reasoning_content`；通过顶层 `reasoning_effort` 字段控制强度，支持 `low`/`high`/`max`（**默认 max**）。
- **强制保留完整思考历史**：多轮对话和工具调用场景下，API 返回的完整 assistant 消息（含 `reasoning_content` 和 `tool_calls`）必须原样传回，不能只传 `content`——这是训练阶段就固化的行为约束，接入时需要特别注意消息回传逻辑，否则会破坏模型的推理连续性。
- **推荐部署引擎**：vLLM、SGLang、TokenSpeed，均已有官方 recipe/cookbook。
- **原生 MXFP4 量化**：从 SFT 阶段就引入量化感知训练（QAT），而非训练后量化，官方强调这是为了"广泛硬件兼容性"。

### 3.7 关键基准（官方模型卡节选，均为 max 推理强度）

| 基准 | Kimi K3 | Claude Fable 5(max) | GPT-5.6 Sol(max) | Claude Opus 4.8(max) | GLM-5.2(max) |
|---|---|---|---|---|---|
| GPQA Diamond | 93.5 | 92.6 | 94.1 | 91.0 | 91.2 |
| Terminal-Bench 2.1 | 88.3 | 88.0 | 88.8 | 84.6 | 82.7 |
| BrowseComp | 91.2 | 88.0 | 90.4 | 84.3 | — |
| MCP-Atlas | 84.2 | 84.7 | 83.6 | 83.6 | 82.6 |
| OSWorld-Verified | 84.8 | 85.0 | 83.0 | 83.4 | — |

结论倾向：K3 在编码、Agentic、长时程任务上已全面进入第一梯队，多数基准与 Claude Fable 5 / GPT-5.6 Sol 处于同一水平线甚至领先（如 Terminal-Bench 2.1、DeepSearchQA、GDPval-AA），部分纯知识推理类指标（HLE-Full、CritPt）略逊于头部闭源模型。

---

## 4. K2.6 → K3 架构演进小结

| 维度 | Kimi-K2.6 | Kimi-K3 |
|---|---|---|
| 注意力机制 | 纯 MLA | KDA（线性）+ Gated MLA（全局）混合，约 3:1 排布 |
| 残差设计 | 标准残差 | Attention Residuals（跨层注意力式检索） |
| MoE 路由 | 384 专家（8 激活+1 共享），标准路由 | 896 专家（16 激活+2 共享），Stable LatentMoE + RMSNorm 稳定化 |
| 总参数/激活参数 | 1T / 32B | 2.8T / 104B |
| 上下文长度 | 256K | 1M |
| 位置编码 | 未知（MLA 通常仍需 RoPE 类机制） | 隐式（KDA 门控+衰减，不需要 RoPE） |
| 量化 | 原生 INT4（训练后） | 原生 MXFP4（SFT 阶段起 QAT） |
| 视觉编码器 | MoonViT（400M） | MoonViT-V2（401M） |

可以看到 Moonshot 的技术路线是：K2.6 阶段先把"MLA + 标准 MoE + Agent 蜂群编排"的能力和工程链路打磨成熟，K3 则是一次架构层面的整体跃迁——**同时在序列、深度、宽度三个维度引入新机制**，把参数规模推到 3T 级别的同时把激活比例进一步压低，是目前开源模型里架构改动幅度最大的一次迭代。

---

## 5. 对基础设施/部署的实务启示

- **KDA 的 KV cache 特性与传统 MLA/MHA 模型不同**：线性注意力层用固定大小状态替代随长度增长的 KV cache，理论上对显存更友好，但第三方分析也指出"实际 serving 时并非完全恒定显存占用"——在做多云 GPU 容量规划时，不能直接套用传统"KV cache 随 context 线性增长"的估算公式，需要结合具体推理引擎（vLLM/SGLang）对 KDA 的实现方式做实测。
- **强制回传完整推理历史（K3）**：如果 Gateway/LiteLLM 层做了统一的消息裁剪或格式转换（比如只保留 `content` 丢弃 `reasoning_content`），会直接破坏 K3 的多轮推理能力，这是一个比 GLM/DeepSeek 更严格的接入约束，需要在网关层做模型级白名单处理。
- **MXFP4/INT4 原生量化**：两代模型都强调"原生"量化（训练阶段引入而非训练后量化），这类模型通常自带针对特定精度优化的推理 kernel（vLLM/SGLang 的对应 recipe 已发布），部署时优先用官方推荐精度，而非自行做训练后量化，以免精度损失超预期。
- **Agent 蜂群编排（K2.6）与超长上下文（K3）对调度系统的要求不同**：K2.6 的 300 子 Agent / 4000 步场景更依赖任务编排层（如 Kimi Code CLI 一类的框架）的水平扩展能力；K3 的 1M 上下文则更依赖单实例的显存/KV 状态管理效率，两者对基础设施的压力点不同，选型时需要按实际工作负载类型（多 Agent 并发 vs 单请求超长上下文）分别评估。

---

## 6. 参考链接

- Kimi-K2.6 模型卡：https://huggingface.co/moonshotai/Kimi-K2.6
- Kimi-K3 模型卡：https://huggingface.co/moonshotai/Kimi-K3
- Kimi K2.5 技术报告（arXiv）：https://arxiv.org/abs/2602.02276
- Kimi K3 完整技术报告（PDF）：https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf
- Kimi Linear（KDA 原始论文，2025年10月）：相关内容见上述第三方引用文章
- Kimi-K3 vLLM 部署 recipe：https://recipes.vllm.ai/moonshotai/Kimi-K3
- Kimi-K3 SGLang cookbook：https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K3
