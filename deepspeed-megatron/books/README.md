# 深入浅出 DeepSpeed · Megatron

基于真实源码的 DeepSpeed + Megatron-LM 训练栈拆解，共 14 章 + 索引。所有代码摘录均来自本地仓库实际代码（非伪造签名），行号与实现以版本锚点为准。

## 版本锚点

| 仓库 | 本地路径 | 锚点 |
|---|---|---|
| DeepSpeed | `/Users/lei.xia/workspace/github/DeepSpeed` | `v0.19.7-28-g43c53e9b`（version.txt: 0.19.8） |
| Megatron-LM | `/Users/lei.xia/workspace/github/Megatron-LM` | `core_v0.15.0rc7-2630-g64d15673`（core 包版本 0.20.0） |

所有引用代码路径以仓库最新为准——若源码演进导致行号偏移，以文件名 + 函数名定位。

## 阅读

直接用浏览器打开 `index.html`，或从任一章开始（每页顶部有完整章节导航）。纯静态 HTML，无构建步骤。

## 章节

| # | 文件 | 内容 |
|---|---|---|
| 01 | `01-architecture.html` | 总架构：两库分工（计算侧 vs 显存侧）、四层地图、三种组合模式 |
| 02 | `02-hybrid-parallel.html` | 3D 并行总览：六种并行对比、rank 布局、bubble 公式、选型 |
| 03 | `03-megatron-tp.html` | Megatron TP：列/行并行、f/g 共轭算子、VocabParallelEmbedding、SP |
| 04 | `04-pp-1f1b.html` | 流水线：warmup/steady/cooldown、interleaved、DS pipe 命令列表 |
| 05 | `05-megatron-model.html` | 模型与数据：TransformerLayer 组装、Float16Module、采样器、CP zigzag |
| 06 | `06-deepspeed-engine.html` | DS 引擎：initialize 装配线、forward/backward/step、GAS 边界、16B 账 |
| 07 | `07-zero.html` | ZeRO 1/2 与 Megatron DistributedOptimizer：分桶、range map、loss scale |
| 08 | `08-zero3.html` | ZeRO-3：PartitionedParameterCoordinator 借还、hook、子组 step |
| 09 | `09-offload.html` | Offload：CPU Adam、ZeRO-Infinity、DeepNVMe、带宽账 |
| 10 | `10-checkpointing.html` | 激活重算：DS CheckpointFunction（RNG 保存）、Megatron selective、三档对比 |
| 11 | `11-kernel.html` | Kernel 层：core/fusions/ 清单、TE fp8、csrc 三大家当 |
| 12 | `12-checkpoint-io.html` | 分布式 Checkpoint：reshardable formats、async save、universal checkpoint |
| 13 | `13-moe.html` | MoE：四段流水、TopKRouter aux loss、dispatcher 三族、DS residual/Tutel |
| 14 | `14-build-own-trainer.html` | 自研：六个里程碑 + 验收标准 + 两条测试资产 + 三条元教训 |

## 技术要点（内容基准）

- **两库分工论**：Megatron 管「算不过来」（TP/PP/CP/EP 切计算），DeepSpeed 管「存不下」（ZeRO/offload 压副本）。两个握手点：rank 布局的 mpu 插头（ch2）、main_grad 通道（ch3/ch7）。
- **16 字节/参数账**（ch6）：fp16 参数 2 + fp16 梯度 2 + fp32 master 4 + Adam m/v 8。ZeRO 三级分别切掉后两项、梯度项、参数项。
- **DS pipe 与 ZeRO-2/3 互斥**：`PipelineEngine` assert `zero_optimization_stage() < ZeroStageEnum.gradients`——PP + ZeRO-3 只能走 Megatron 主导路线（ch1 模式 C、ch4）。
- **RNG 状态是重算正确性的命门**（ch10）：DS 保存 CPU/CUDA/tracker 三份；重算不一致 = 静默数值错误。
- **CUDA_DEVICE_MAX_CONNECTIONS=1**（ch3）：TP 通信-计算重叠的正确性前提，一个环境变量决定结果对错。

## 维护

- 源码演进后的再核实流程：`git -C <repo> describe` 取新锚点 → 对照各章引用的文件 + 函数名（不认行号）→ 更新版本 badge 与 footer。
- 站点结构仿照 `vllm-engine/books/`（共享 CSS 在 `assets/dsm-learn.css`，调色板已换为 DS·Megatron 暗红系）。
