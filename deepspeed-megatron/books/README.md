# 深入浅出 DeepSpeed · Megatron

基于真实源码的 DeepSpeed + Megatron-LM 训练栈拆解，共 14 章 + 索引。所有代码摘录均来自本地仓库实际代码（非伪造签名），行号与实现以版本锚点为准。

## 版本锚点

| 仓库 | 本地路径 | 锚点 |
|---|---|---|
| DeepSpeed | `/Users/lei.xia/workspace/github/DeepSpeed` | `v0.19.7-68-g53e336cd5`（version.txt: 0.19.8） |
| Megatron-LM | `/Users/lei.xia/workspace/github/Megatron-LM` | `core_v0.15.0rc7-2685-g07147d694`（core 包版本 0.20.0） |

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
| 07 | `07-zero.html` | ZeRO 1/2 与 Megatron DistributedOptimizer：分桶、range map、loss scale、Muon 接入 |
| 08 | `08-zero3.html` | ZeRO-3：PartitionedParameterCoordinator 借还、hook、子组 step、M-FSDP v2 流水线 |
| 09 | `09-offload.html` | Offload：CPU Adam、ZeRO-Infinity、DeepNVMe、带宽账 |
| 10 | `10-checkpointing.html` | 激活重算：DS CheckpointFunction（RNG 保存）、Megatron selective、三档对比 |
| 11 | `11-kernel.html` | Kernel 层：core/fusions/ 清单、TE fp8、NVFP4、csrc 三大家当 |
| 12 | `12-checkpoint-io.html` | 分布式 Checkpoint：reshardable formats、async save、universal checkpoint、run_config.yaml |
| 13 | `13-moe.html` | MoE：四段流水、TopKRouter aux loss、dispatcher 三族、DS residual/Tutel |
| 14 | `14-build-own-trainer.html` | 自研：六个里程碑 + 验收标准 + 两条测试资产 + 三条元教训 |

## 技术要点（内容基准）

- **两库分工论**：Megatron 管「算不过来」（TP/PP/CP/EP 切计算），DeepSpeed 管「存不下」（ZeRO/offload 压副本）。两个握手点：rank 布局的 mpu 插头（ch2）、main_grad 通道（ch3/ch7）。
- **16 字节/参数账**（ch6）：fp16 参数 2 + fp16 梯度 2 + fp32 master 4 + Adam m/v 8。ZeRO 三级分别切掉后两项、梯度项、参数项。
- **DS pipe 与 ZeRO-2/3 互斥**：`PipelineEngine` assert `zero_optimization_stage() < ZeroStageEnum.gradients`——PP + ZeRO-3 只能走 Megatron 主导路线（ch1 模式 C、ch4）。
- **RNG 状态决定重算正确性**（ch10）：DS 保存 CPU/CUDA/tracker 三份；重算不一致 = 静默数值错误。
- **CUDA_DEVICE_MAX_CONNECTIONS=1**（ch3）：TP 通信-计算重叠的正确性前提，一个环境变量决定结果对错。

## 演化记录

- **2026-09-29 四次核实**（DeepSpeed 22 commits / Megatron 16 commits，重锚 `v0.19.7-68-g53e336cd5` / `core_v0.15.0rc7-2685-g07147d694`，章级最大一次改动是新增内容）：
  - **ch04 新增 4.5 DualPipeV**（#8576，DeepSeek-V3 调度进 DeepSpeed 主干）：`DualPipeVModule`（每卡两段，2P 切法）+ `DualPipeVSchedule`（八步 schedule、主段 nF0B1F1B0）+ `CommitP2P` 批量 p2p（schedule.py +151 行 → 全文约 650 行，4.4 数据对比更新）；4.3 表格与小结 4.6 顺延改写；index.html STEP 4 卡片补 DualPipeV。约束：`micro_batches >= 2 * stages`。
  - **ch07**：7.2 epilogue 摘录重写——旧摘录的 `release_reduced_gradients` / `overflow_sanitizer` / `step_with_ready_parameters` 三个符号在源码中不存在（换真实 `independent_gradient_partition_epilogue`（:984）结构 + step() 溢出/子组语义改写）；7.5 追加 #8633 动量暂存/提交（`_muon_staging_momentum` + step 里 `_commit_muon_momentum`，staged 副本不进 optimizer.state 不进 checkpoint）。
  - **ch08**：8.3 step 摘录补 #8625 zero_grad 挪位（子组循环前清一次，G×P→P）；8.4 增两项——零元素参数（#8467，`is_optimized_parameter` = requires_grad and numel>0，runtime/utils.py:806，零元素按 frozen 待遇进 checkpoint 保形状）、ZeRO-3 Muon 混合形状 all-gather（#8628，分轮 + pad/dummy 参与集合通信）。
  - **ch09**：9.2 补 #8694 CPU Adam 拒绝 amsgrad（此前静默跑普通 Adam；offload 一开就换算法的静默降级案例）。
  - **ch10**：10.3 摘录重写——旧摘录把 `checkpointed_forward` 挂在 transformer_layer.py 且声称它分支 full/selective；实际该函数在 `megatron/core/recompute.py:24` 只管 full 档（uniform/block 分段），selective 走 `recompute_modules` 列表在 attention.py:393 挂 `checkpoint_core_attention` 标志。三处错误路径修正：ch10 recompute.py、ch05 `datasets/data_samplers.py`、ch09 `ops/adam/cpu_adam.py`（预存错误，旧锚点即错）。
  - **ch01**：1.2 补 #7635 kernel warmup（造模型之前按静态形状编译融合 kernel）；1.2 AutoTP tied 词表头（#8582 VocabParallelEmbedding + DeepCompile autotp pass 不支持时保守复制）；1.3 train_step 摘录补一处「刻意简化」声明（finalize_model_grads_func 实际在 schedules.py 调用，非 train_step 尾部）；pin 刷新 training.py:3266→3292、engine.py 3305→3353 / 3490→3538 / 3365→3413。
  - **ch12**：12.4 补 #6716/#7599 wide-residual 五超参进 checkpoint 校验表（`_WIDE_RESIDUAL_ARG_DEFAULTS`）。
  - 其余 commits（graph harvesting 删除 #8579——书中从未提及、AutoEP activation registry、rollout、Triton FA 兼容、NPU 算子、MXFP8/MFSDP v2 适配、MIMO、DCP V2 契约、多模态修复等）不触及书中覆盖面，未改章。同日全书禁语终扫：清掉 03/04/05/06/09/11/13/14/index 残留的 白赚/网线/外壳/全景/骨架/拉满/值得抄×4/旅程×6/四层地图/值得注意的是 共 17 处（自研启示 tag、收尾： 代码注释为 2026-09-24 终审保留形态，未动）。
- **2026-09-25 三次核实**（DeepSpeed 4 commits / Megatron 17 commits，重锚 `v0.19.7-46-g357102733` / `core_v0.15.0rc7-2669-g7de072aa9`）：6 处 pin 修正；ch12 既有错误修复（虚构文件路径换真实 dist_checkpointing 布局）；写入五项增补——ch07 7.5 Muon 接入 ZeRO（#8464 四坑 + LRU all-gather 缓存）、ch08 8.5 M-FSDP v2 PP、ch11 11.2 末 NVFP4 透传、ch12 12.4 run_config.yaml。同日全书叙述/逻辑终审：ch07 7.2 IPG 全称与函数名修正（reduce_ready_partitions → reduce_ready_partitions_and_remove_grads）、reduce_bucket_size 数量级修正（GB 级非 KB 级）；ch08 8.4 小参数机制改写（param_persistence_threshold/mark_persistent_parameters）；ch14 14.4 兑现 7.5 两条路线承诺。
- **2026-09-21 二次核实**（DeepSpeed 8 commits / Megatron 4 commits，重锚 `v0.19.7-42-g4a5856c25` / `core_v0.15.0rc7-2652-ge27e9d08f`）：
  - ch11 fusions 目录盘点修正：`fused_bias_dropout_add.py` → `fused_bias_dropout.py`（预存文件名错误，`_add` 是 DeepSpeed 侧叫法）；新增 `fused_gated_norm.py` / `fused_pre_gated_delta_rule.py`（GDN 线性注意力融合，#5532 Pre-GDR kernel fusion）
  - ch08 新增演化痕迹：`_allgather_params_coalesced` 曾只等最后一个 all-gather handle 导致读到未初始化内存（#8539 修复，wait-all）
  - engine.py 行号刷新：backward 3286→3295、step 3471→3480（cast 白名单 + vocab CE backend 两 commit 引入偏移，ch01/ch06 三处 pin）
  - 其余 commits（HPU CI、AutoEP、Gram NS、TiledLoss 移除、多模态初始化、GDP 投机解码、training 配置构造重构）不触及书中覆盖面，未改章

## 维护

- 源码演进后的再核实流程：`git -C <repo> describe` 取新锚点 → 对照各章引用的文件 + 函数名（不认行号）→ 更新版本 badge 与 footer。
- 站点结构仿照 `vllm-engine/books/`（共享 CSS 在 `assets/dsm-learn.css`，调色板已换为 DS·Megatron 暗红系）。
