# DeepSeek-V4 / V4.1-Flash 技术架构解析

> 资料来源：Hugging Face 模型卡（deepseek-ai/DeepSeek-V4-Flash、deepseek-ai/DeepSeek-V4.1-Flash 及其 encoding/README）、DeepSeek-V4 技术报告（arXiv:2606.19348）、vLLM 官方博客与 HF Transformers 文档。标注"社区分析"的部分为第三方逆向工程结论，未必是官方原始表述，供参考验证。

---

## 1. 系列概览

DeepSeek-V4 是一个 MoE（混合专家）系列，核心目标是**百万 token 级上下文的高效推理**，而非单纯堆参数量。系列包含两个尺寸：

| 模型 | 总参数 | 激活参数 | 上下文长度 | 精度 |
|---|---|---|---|---|
| DeepSeek-V4-Flash(-Base) | 284B | 13B | 1M | FP8 混合 / 发布版 FP4+FP8 混合 |
| DeepSeek-V4-Pro(-Base) | 1.6T | 49B | 1M | FP8 混合 / 发布版 FP4+FP8 混合 |

预训练数据规模超过 **32T tokens**。Flash 是 Pro 的小激活量版本，二者共享同一套架构，仅宽度/深度/专家数不同。

DeepSeek-V4.1-Flash 是在此基础上的迭代版本，新增了**原生多模态（视觉）能力**，模型卡显示参数规模增至约 **485B**（含视觉编码器/对齐模块）。

---

## 2. 核心架构创新（V4 主线）

### 2.1 混合注意力机制（Hybrid Attention）

这是 V4 相对 V3.2 最大的结构性变化，每一层被打上三种类型标签之一：

- **Sliding-window 全注意力**：仅关注固定窗口（默认 128 token）内的局部上下文，用于"引导层"，思路延续 V3 的做法，保证局部细粒度依赖不丢失。
- **Compressed Sparse Attention（CSA，论文 §2.3.1）**：先用可学习的压缩权重将每 `m`（默认 4）个 KV token 压缩为 1 个条目（低倍率压缩池，允许重叠窗口），再通过 **Lightning Indexer** 对压缩后的 KV 做打分，为每个 query 选出 top-k 个压缩块参与真正的注意力计算——即 **DeepSeek Sparse Attention（DSA）** 机制，把注意力复杂度从 O(L²) 降到近似 O(L·k)。
- **Heavily Compressed Attention（HCA，论文 §2.3.2）**：思路相同但压缩倍率 `m′` 远大于 `m`（不重叠窗口），在高倍率压缩流上做稠密注意力，用于捕捉超长距离的粗粒度依赖。

三种层交替排布（interleaving），是 1M 上下文能落地的关键。效果上，在 1M-token 场景下 DeepSeek-V4-Pro 相比 DeepSeek-V3.2 仅需 **27% 的单 token 推理 FLOPs** 和 **10% 的 KV cache**。

Lightning Indexer 的打分公式（社区还原）大致为：

```
I(t,s) = Σ_h  w_{t,h} · ReLU(q_{t,h} · K_s)
```

其中 H_I（indexer heads，V4-Flash/Pro 约为 64）、压缩倍率 m=4、每 query 的 top-k 一般取 512~1024。indexer 路径可用 FP4/BF16 量化以进一步加速，工程上常放在独立 CUDA stream 上与主注意力路径并行，隐藏延迟。

### 2.2 Manifold-Constrained Hyper-Connections（mHC）

在传统残差连接基础上增加流形约束，用于**增强跨层信号传播的稳定性**，同时尽量不牺牲模型表达能力——这类似于 Hyper-Connections 思路的进一步正则化版本，主要解决深层 MoE 训练中的信号衰减/爆炸问题。

### 2.3 Muon 优化器

替代传统 AdamW 类优化器，官方说明用于**加快收敛速度、提升训练稳定性**，与 mHC 配合，支撑了对 32T token 的大规模预训练。

### 2.4 MoE 结构

- Flash：284B 总参数 / 13B 激活（激活比约 4.6%）
- Pro：1.6T 总参数 / 49B 激活（激活比约 3%）

极低的激活比延续了 DeepSeek 一贯的"大总量、小激活"MoE 路线，配合 CSA/HCA 的长上下文优化，使得单 token 推理成本远低于同等总参数量的稠密/传统 MoE 模型。

---

## 3. 训练与后训练流程

1. **预训练**：32T+ 高质量多样化 token，序列长度分阶段爬升（如 4K→16K 稠密注意力起步，进入 64K 阶段后开启稀疏注意力路径），逐步过渡到 1M 上下文。
2. **两阶段后训练**：
   - **阶段一**：针对不同领域独立培养"专家模型"，各自用 SFT + **GRPO**（Group Relative Policy Optimization）强化学习训练。
   - **阶段二**：通过 **on-policy distillation（在策略蒸馏）** 做统一模型融合，把各领域专才的能力整合进单一模型，而非用统一策略 RL 直接联合训练——官方认为这是相比"统一 RL"的关键后训练范式升级。

---

## 4. 推理效率与部署相关设计

- **精度方案**：Base 模型为 FP8 混合精度；正式发布版（Instruct）为 **FP4 + FP8 混合**——MoE 专家参数用 FP4，其余大部分参数用 FP8，进一步压缩显存/带宽占用。
- **KV Cache 优化**：CSA/HCA 的压缩机制 + indexer cache 量化（indexer 常用 FP4、注意力 cache 用 FP8）共同作用，1M 上下文下单序列 KV cache 可降到 ~9.6 GiB 量级（社区 vLLM 博客数据），相比传统 61 层稠密栈节省近 8.7 倍。
- **投机解码（DSpark）**：官方提供 `-DSpark` 后缀的checkpoint变体，本质是在同一权重上"外挂"一个投机解码草稿模块（非独立新模型），用于进一步提升解码吞吐，社区 vLLM 部署配方中常见 `--speculative-config` 搭配 DSpark 使用。
- **推荐推理框架**：官方模型卡直接给出 vLLM 与 SGLang 的一键启动命令（`vllm serve` / `sglang.launch_server`），说明主力生态适配已覆盖你现有的 vLLM 生产栈。
- **无 Jinja Chat Template**：V4/V4.1 均未提供传统 Jinja 模板，而是用独立 `encoding/` Python 模块做消息编解码（`encode_messages` / `parse_message_from_completion_text`），这点在做 LiteLLM/Gateway 层适配时需要特别注意，不能直接套用 OpenAI 风格模板渲染逻辑。

---

## 5. 三种推理强度模式

| 模式 | 特点 | 典型场景 | 输出格式 |
|---|---|---|---|
| Non-think | 快速、直觉式响应 | 日常低风险任务 | `</think>` 直接给结论 |
| Think High | 有意识逻辑分析，慢但更准 | 复杂问题求解、规划 | `<think>思考</think>结论` |
| Think Max | 推理强度拉满 | 探索模型推理能力边界 | 特殊 system prompt + `<think>思考</think>结论` |

其中 **DeepSeek-V4-Pro-Max**（Pro 的最大推理强度模式）在编码类基准上处于开源模型第一梯队，显著缩小与闭源旗舰模型在推理/Agent 任务上的差距；**V4-Flash-Max** 在给足思考预算时可逼近 Pro 版推理水平，但纯知识类任务和最复杂 Agent 工作流上因参数量较小仍略逊一筹。

---

## 6. DeepSeek-V4.1-Flash：相对 V4 的变化

V4.1-Flash 的 HF 仓库定位是"DeepSeek-V4.1-Exp"，本质是围绕新架构提供的**编码参考实现 + 最小推理实现**（权重另存于对应权重仓库）。相比 V4，确认的变化点如下：

### 6.1 原生多模态

- 新增**视觉编码器（ViT）+ 对齐模块（aligner）**，将图像编码为 `<｜deepseek_image｜>` 占位符插入到文本 prompt 序列中，`media["images"]` 保留图像在 prompt 中的原始顺序。
- Pipeline 标签由纯文本的 `text-generation` 变为 `image-text-to-text`。
- 官方口径：在保持纯文本 Agent 任务能力持平的前提下，多模态 Agent 能力有实质提升（第三方数据如 ApexBench、Agents' Last Exam 显示相对 V4-Flash-0731 有明显提升，但这些具体分数来自社区/第三方部署仓库，非官方模型卡直接数据，建议以官方后续技术报告为准）。

### 6.2 提示词格式（Prompt Format）三处明确变化

1. **DSML 标签带前导空格**：工具调用块从 V4 的 `<｜DSML｜tool_calls>` 改为 `<｜DSML｜ calls>`（`calls`/`invoke`/`parameter` 前均带空格），这是一个容易在升级迁移时踩坑的细节，纯字符串匹配的历史适配代码需要同步更新。
2. **数值化推理预算**：`reasoning_effort` 从 V4 的自然语言描述改为 **1–100 的整数预算**，字符串别名映射为 `"low"→25`、`"high"→50`（默认）、`"xhigh"→75`、`"max"→100`，且该前缀仅在 `thinking_mode="thinking"` 且位于对话开头（index 0）时渲染。
3. **支持对话中途插入 system 消息**：通过新增的 `<｜System｜>` token 实现，行为上等价于一条 user 消息（后面紧跟 assistant 生成头）。

### 6.3 架构层面的进一步延伸（需注意来源可信度）

模型仓库描述提到推理参考实现 covers "vision encoder and aligner, sliding-window plus compressed sparse attention with its two-level indexer, engram n-gram lookups, MoE, Hyper-Connections, and the DSpark forward path"。可确认为**官方仓库文字表述**的部分是：视觉编码器/对齐模块、滑窗+压缩稀疏注意力、二级索引器（two-level indexer，是对 V4 单层 Lightning Indexer 的扩展）、MoE、Hyper-Connections、DSpark 投机解码。

"Engram n-gram lookups" 官方仓库仅一笔带过、未展开细节；第三方分析（非官方一手资料）将其描述为一种**静态记忆原语**：用多头哈希把 N-gram 直接映射到 embedding 表，实现近似常数时间的知识检索，作用是把部分"事实性知识查找"从标准注意力路径中卸载出来。**这一机制的具体设计细节暂缺官方技术报告佐证，建议在做技术选型/复现前等待正式论文或以官方 inference 代码为准**，本文档仅作为待验证线索列出。

---

## 7. 与前沿闭源模型对比（V4-Pro-Max，节选）

| 维度 | 代表基准 | DS-V4-Pro-Max 表现 |
|---|---|---|
| 代码能力 | LiveCodeBench / Codeforces | 领先或持平于 Opus-4.6 Max、GPT-5.4 xHigh、Gemini-3.1-Pro High 等闭源旗舰 |
| 知识类 | MMLU-Pro / SimpleQA-Verified | 与一线模型有差距，Gemini-3.1-Pro 明显领先 |
| Agentic 工具使用 | SWE-bench Verified / MCPAtlas | 基本追平第一梯队 |
| 长上下文 | MRCR 1M / CorpusQA 1M | 落后 Opus-4.6，但优于部分同代模型 |

结论（官方表述）：V4-Pro-Max 在编码类基准上是当前开源模型第一梯队，显著缩小了与闭源模型在推理与 Agent 任务上的差距，但纯知识类任务上仍有可观差距。

---

## 8. 对基础设施/部署的实务启示

结合当前主流的 vLLM + Kubernetes + 多云 GPU 部署栈，几个值得关注的点：

- **KV cache 大幅压缩**（1M 上下文降至个位数 GiB 量级）意味着同等显存预算下可支撑更高并发或更长上下文，GPU 资源规划时可重新核算显存/吞吐比。
- **FP4+FP8 混合精度**对推理硬件（如是否支持原生 FP4 Tensor Core）和量化推理栈（vLLM/SGLang 的对应 kernel 支持版本）有硬性要求，多云环境下不同云厂商 GPU 型号（如是否为 Blackwell 系列）会直接影响能否吃满这部分收益。
- **无 Jinja 模板 + 自定义 encoding 模块**：如果 Gateway/LiteLLM 层做了统一的 prompt 模板抽象，需要单独适配 DeepSeek 的 `encoding.py`，而不能复用通用 chat template 逻辑；V4→V4.1 的 DSML 空格变化说明这类自定义编码格式本身也在快速迭代，建议做版本化适配层。
- **DSpark 投机解码是权重外挂而非独立模型**，从工程角度看，只需在原 checkpoint 基础上加载草稿模块并在 vLLM/SGLang 启动参数中开启 speculative decoding 配置即可，迁移成本较低。

---

## 9. 参考链接

- DeepSeek-V4-Flash 模型卡：https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash
- DeepSeek-V4.1-Flash 模型卡：https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash
- V4.1 Encoding README：https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/encoding/README.md
- 技术报告（arXiv）：https://arxiv.org/abs/2606.19348
- vLLM 官方博客《DeepSeek V4 in vLLM: Efficient Long-context Attention》：https://vllm.ai/blog/2026-04-24-deepseek-v4
