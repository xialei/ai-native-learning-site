# Qwen3.8-27B / Qwen3.8-Flash-Next 技术架构解析

> 资料来源：Hugging Face 模型卡（Qwen/Qwen3.8-27B、Qwen/Qwen3.8-Flash-Next）原文"Model Overview"架构表。两份模型卡本身给出的架构参数已相当完整、颗粒度很细（层级排布公式、各组件维度均直接列出），本文以官方原文数据为主，仅在个别背景概念解释上补充少量通用知识，均已标注。

---

## 1. 系列定位

这两个模型代表通义千问（Qwen）技术路线上的**两代**、也是**两种不同架构范式**：

| 模型 | 定位 | 参数规模 | 架构范式 |
|---|---|---|---|
| Qwen3.8-27B | Qwen3.8 系列的稠密（Dense）模型，构建在 **Qwen3.5 架构基础**上 | 27B（全部激活） | 稠密模型 + Gated DeltaNet/Gated Attention 混合注意力 |
| Qwen3.8-Flash-Next | 官方明确定位为 **Qwen4 架构的实验性预览（preview）**，是"下一代架构"的首个开放权重发布 | 125B 总参数 / 6B 激活 + 51B n-gram embedding + 4B MTP | MoE + 混合线性/稀疏注意力 + 全新残差与 embedding 设计 |

一句话概括：**Qwen3.8-27B 是当前成熟稳健路线的集大成者，Qwen3.8-Flash-Next 是官方亲自下场验证的"下一代范式"探路者**——模型卡原文写道，这是"面向 Qwen4 的架构"的首次开放权重亮相。

---

## 2. Qwen3.8-27B：稠密模型 + 混合注意力

### 2.1 基础参数（官方模型卡"Model Overview"原文）

| 项 | 数值 |
|---|---|
| 参数量 | 27B（全部激活，稠密模型） |
| 隐藏维度 | 5120 |
| 词表（padded） | 248,320 |
| 层数 | 64 |
| **层级排布** | `16 × (3 × (Gated DeltaNet → FFN) → 1 × (Gated Attention → FFN))` |
| Gated DeltaNet | V 头 48 个，QK 头 16 个，head dim 128 |
| Gated Attention | Q 头 24 个，KV 头 4 个（GQA），head dim 256，RoPE 维度 64 |
| FFN 中间维度 | 17,408 |
| MTP | 多步训练（未展开具体层数） |
| 原生上下文 | 262,144（可扩展至 1,000,000） |

### 2.2 架构解读：Gated DeltaNet + Gated Attention 混合

这是延续自 Qwen3.5（Qwen3-Next 系列）的成熟设计——**每 4 层为一组，其中 3 层用 Gated DeltaNet（线性注意力）、1 层用 Gated Attention（标准分组查询注意力 GQA）**：

- **Gated DeltaNet**：基于 delta 规则的门控线性注意力，用固定大小的循环状态取代随长度增长的 KV cache，处理局部/近距离依赖时计算复杂度不随序列长度平方增长（属于业界"线性注意力+delta规则"这一大类方法，DeltaNet/Gated DeltaNet 概念背景为公开研究常识，非本模型卡独有表述）。
- **Gated Attention**：每组的第 4 层保留标准注意力（此处为 GQA，24 Q 头 / 4 KV 头），负责捕捉全局/长距离依赖，弥补纯线性注意力在精确检索上的短板。
- 3:1 的比例设计是在"效率"和"精度"之间的经验性权衡——多数层用便宜的线性注意力处理局部信息，少数层用标准注意力兜底全局能力。

### 2.3 原生多模态与推理控制

- **原生视觉语言模型**：支持图像与视频理解，覆盖 STEM 图表、文档到小时级长视频。
- **灵活思考控制**：`reasoning_effort` 支持三档——`xhigh`（默认，复杂任务深度分析）、`medium`（精度与速度平衡）、`low`（效率优先）。
- **preserve_thinking 默认开启**：跨轮次保留完整推理轨迹，官方特别说明这对 Agent 场景的决策一致性、减少重复推理有帮助，同时能改善 KV cache 利用率。
- **YaRN 扩展上下文**：原生 262,144 tokens，通过 YaRN（`rope_type=yarn`，静态缩放因子）可扩展到 1M；官方提醒**所有开源框架实现的都是静态 YaRN**（缩放因子不随输入长度变化），会影响短文本场景性能，因此建议仅在确实需要长上下文时才修改该配置。

### 2.4 关键基准（官方模型卡节选）

| 基准 | Qwen3.8-27B | Qwen3.6-27B | Qwen3.7-Plus | Opus 4.6 Max |
|---|---|---|---|---|
| SWE-bench Pro | **61.7** | 53.5 | 57.6 | 53.4 |
| DeepSWE 1.1 | **42.2** | 13.3 | 14.2 | -- |
| QwenSWEBench（自建） | **79.0** | 49.3 | 59.2 | 63.8 |
| OSWorld-Verified | **84.3** | 63.9 | 73.3 | 72.7 |
| IFBench | **79.5** | 69.1 | 79.1 | 62.5 |

结论倾向：相对上一代 Qwen3.6-27B 在编码/Agentic/多模态操作类任务上有大幅跃升（DeepSWE 1.1 从 13.3 到 42.2、QwenSWEBench 从 49.3 到 79.0），部分维度已反超 Claude Opus 4.6 Max，但纯多学科推理（HLE）上仍有明显差距（30.8 vs 40.0）。

---

## 3. Qwen3.8-Flash-Next：面向 Qwen4 的架构预览

模型卡原文明确表态："as the frontier of foundation models pushes toward ever-larger parameter counts and ever-longer context windows, the question is no longer just how much we can scale, but how efficiently we can do so"——即这次发布的核心目的是**架构效率探索**，而非单纯堆参数。四项官方标注的核心创新如下。

### 3.1 核心参数（官方模型卡"Model Overview"原文）

| 项 | 数值 |
|---|---|
| 参数构成 | 125B 总参数 / **6B 激活** + 51B n-gram embedding + 4B MTP |
| 隐藏维度 | 2560 |
| 词表（padded） | 248,320 |
| N-gram embedding | 2000 万条目（bigram/trigram，位于第 2 层） |
| 层数 | 48 |
| **层级排布** | `12 × (3 × (Gated DeltaNet → MoE) → 1 × (Qwen Sparse Attention → MoE))` |
| Gated DeltaNet | V 头 48 个，QK 头 16 个，head dim 128（与 Qwen3.8-27B 一致） |
| **Qwen Sparse Attention（QSA）** | Q 头 24 个，KV 头 2 个，head dim 256，RoPE 维度 64；Indexer 为 MQA 结构（4 个 query 头 + 1 个共享 key 头），indexer head dim 128；预算为 512 个 block 或 2048 个 token |
| MoE | 512 个专家，激活 10 路由 + 1 共享，专家中间维度 640 |
| **Gated Residual** | 4 个分支，瓶颈秩（bottleneck rank）320 |
| MTP | 1 层，多步训练 |
| 原生上下文 | 262,144（可扩展至 1,000,000） |

### 3.2 创新一：Hybrid Attention with QSA（混合注意力 + Qwen 稀疏注意力）

相对 Qwen3.8-27B 的"Gated DeltaNet + Gated Attention"组合，Qwen3.8-Flash-Next 把标准 Gated Attention 替换为全新的 **Qwen Sparse Attention（QSA）**：

- **关键区别**：QSA **不是逐 token 选择**，而是在**微块（micro-block）级别**操作——即注意力的稀疏选择粒度是一组连续 token（block），而非单个 token。官方给出的理由是这样能显著降低长上下文场景下的延迟，这对当前 Agentic workload 越来越占主导的实际使用场景是关键收益。
- **具体配置**：Indexer 采用 MQA（多查询注意力）结构做打分——4 个 query 头共享 1 个 key 头，indexer head dim 128；最终预算是 **512 个 block 或 2048 个 token**（二选一或结合使用的稀疏预算上限）。
- 与 DeepSeek 的 DSA、GLM 的 DSA+IndexShare 相比，QSA 的差异化点在于**block 级而非 token 级**的稀疏粒度，这是三家在稀疏注意力设计上的一个明显分野。

### 3.3 创新二：Gated Residual（门控残差）

这是对标准残差连接的重新设计：

- **做法**：把残差流"加宽"为多个分支（Qwen3.8-Flash-Next 用 4 个分支，瓶颈秩 320），通过**逐元素、数据依赖的读门（read gate）**和**每分支的标量写门（write gate）**来调制信息如何流经这些加宽的残差流。
- **目的**：在保持训练稳定性、控制推理开销的前提下，为跨层信息流动提供更精细的可调节粒度——官方表述为"finer-grained expressiveness across layers while preserving training stability and keeping inference overhead low"。
- 这与 DeepSeek/GLM 系列采用的 **mHC（流形约束超连接）**是同一大类问题（改进深层网络的残差/跨层信息传播）的**不同解法**：mHC 走的是流形约束正则化路线，Gated Residual 走的是显式门控（读门+写门）路线。

### 3.4 创新三：N-gram Embedding（N-gram 嵌入）

这是本次发布中最独特的创新点，官方给出的动机是：**embedding 层提供了一条不同于 MoE 的参数扩展轴——计算量更小，且更适合向外存/慢速存储卸载（offloading）**：

- **做法**：用短 n-gram（bigram/trigram）做索引，在第 2 层引入一个 **2000 万条目**的独立 embedding 表。
- **效果**：让参数扩展在**显存受限的加速卡**上变得高效可行，而不必依赖计算密集的 MoE 扩展路径——模型卡的参数统计里专门把"51B n-gram embedding"从"6B 激活参数"中拆分出来展示，说明这部分参数的访问/计算模式与常规 MoE 专家参数有本质不同（更接近查表，而非稠密/稀疏矩阵乘法）。
- 这是一个此前在主流开源大模型架构里较少见的设计方向，可以理解为"用近乎零计算成本的大规模查找表，换取额外的知识容量"。

### 3.5 创新四：定制化训练配方

- **优化器分工**：Muon 和 AdamW **按权重类别分别应用**到不同参数组，以最大化效率（具体哪类权重用哪种优化器，模型卡未展开）。
- **重新拟合的 scaling law**：据此**取消传统的 batch size 预热（warmup）**，直接从目标 batch size 开始训练，大幅减少总优化器步数，同时能安全地使用更大学习率以保证收敛稳定性。

### 3.6 关键基准（官方模型卡节选）

| 基准 | Qwen3.8-Flash-Next（6B激活） | Qwen3.8-27B（27B激活） | Qwen3.7-Plus（17B激活/397B总） | DeepSeek-V4-Flash-0731（13B激活） |
|---|---|---|---|---|
| SWE-bench Pro | **62.5** | 61.7 | 55.8 | 56.0 |
| DeepSWE 1.1 | **58.7** | 42.2 | 16.5 | 54.4 |
| CoWorkBench | **73.9** | 70.7 | 65.1 | 45.1 |
| JobBench | **55.7** | 33.4 | 27.6 | 41.3 |
| GPQA Diamond | **91.7** | 89.2 | 90.3 | 90.8 |
| LiveCodeBench v6 | **91.9** | 90.3 | 89.6 | 90.6 |

结论倾向：以仅 **6B 激活参数**（是 Qwen3.8-27B 激活量的约 1/4.5）拿到了几乎全面反超 Qwen3.8-27B 本身、以及同期 DeepSeek-V4-Flash 的成绩，是本次发布"效率优先"叙事的直接证据——官方在架构上做的四项创新（QSA、Gated Residual、N-gram Embedding、定制训练配方）共同验证了"用更少激活计算换取同等或更强能力"的路径是可行的。

---

## 4. 两者架构对比小结

| 维度 | Qwen3.8-27B | Qwen3.8-Flash-Next |
|---|---|---|
| 模型类型 | 稠密 | MoE（512 专家，10 路由+1 共享激活） |
| 层级排布 | 3×(GatedDeltaNet→FFN) + 1×(GatedAttention→FFN) | 3×(GatedDeltaNet→MoE) + 1×(QSA→MoE) |
| 全局注意力 | 标准 Gated Attention（GQA，token 级） | Qwen Sparse Attention（QSA，**block 级**稀疏） |
| 残差设计 | 标准残差 | **Gated Residual**（4 分支门控） |
| Embedding 扩展 | 无特殊设计 | **N-gram Embedding**（2000万条目，51B参数） |
| 总/激活参数 | 27B / 27B | 125B / 6B（+51B n-gram +4B MTP） |
| 训练配方 | 常规 | Muon+AdamW 分权重类别、取消 batch size warmup |
| 定位 | 当前成熟路线的旗舰稠密模型 | Qwen4 架构探路者 |

可以看到 Qwen 的技术路线选择是：**先在 Qwen3.5/3.6/3.7/3.8-27B 上把"Gated DeltaNet + 标准注意力"3:1 混合这条路线做扎实（稠密模型也能享受线性注意力效率红利），再用 Qwen3.8-Flash-Next 一次性验证四项面向下一代的架构假设**（block 级稀疏、门控残差、n-gram 参数扩展轴、训练配方重构），且直接对外开放权重接受社区检验，这在几家大模型厂商的架构迭代节奏里是相对激进的公开验证方式。

---

## 5. 对基础设施/部署的实务启示

- **两者共享 Gated DeltaNet 组件**：如果你的 vLLM/SGLang 生产栈已经为 Qwen3.5/3.6/3.7 系列的 Gated DeltaNet 做过适配，这部分 kernel/算子基本可以直接复用到 Qwen3.8-27B 和 Qwen3.8-Flash-Next 上，迁移成本较低。
- **QSA 的 block 级稀疏对 KV cache 管理是新课题**：与 token 级稀疏（DSA/QSA 前身）不同，block 级预算（512 block 或 2048 token）意味着显存管理和调度粒度要按 block 对齐，这与你现有针对 DeepSeek DSA / GLM DSA 的 KV cache 优化经验不完全通用，上线前需要针对性验证 vLLM/SGLang 的 Qwen3.8-Flash-Next 专用 recipe。
- **N-gram Embedding 的存储/卸载特性**：51B 参数的 n-gram embedding 表本质上是近似查表操作，官方明确其"更适合向外部存储卸载"——在显存紧张的多云环境下，这部分参数理论上可以考虑放到 CPU/NVMe 而非常驻显存，这是一个和 MoE 专家参数处理方式完全不同的容量规划思路，值得关注 vLLM/SGLang 社区后续针对该组件的 offload 支持进展。
- **静态 YaRN 的短文本性能损耗**：两个模型都用同样的 YaRN 扩展方案和同样的提醒——生产环境如果流量中短文本、长文本混合，统一开启 YaRN 扩展到 1M 会牺牲短文本场景性能，建议按实际流量分布分环境部署（短上下文用原生 262K 配置，长上下文单独起一套 YaRN 扩展的实例）。
- **Qwen3.8-27B 是稠密模型**：与本系列之前介绍的 DeepSeek-V4、GLM-5、Kimi-K2.6/K3 均为 MoE 不同，Qwen3.8-27B 全部 27B 参数都会激活，这意味着它的显存/算力需求曲线更接近传统稠密模型（无需考虑专家并行、路由负载均衡等 MoE 特有的部署复杂度），如果团队评估轻量级私有化部署场景，这是一个部署链路更简单的选项。

---

## 6. 参考链接

- Qwen3.8-27B 模型卡：https://huggingface.co/Qwen/Qwen3.8-27B
- Qwen3.8-Flash-Next 模型卡：https://huggingface.co/Qwen/Qwen3.8-Flash-Next
- Qwen3.8-Flash-Next 技术报告：https://github.com/QwenLM/Qwen3.8-Flash-Next/blob/main/tech_report.pdf
- Qwen3.8 官方博客：https://qwen.ai/blog?id=qwen3.8
- Qwen3.8-Flash-Next 官方博客：https://qwen.ai/blog?id=qwen3.8-flash-next
