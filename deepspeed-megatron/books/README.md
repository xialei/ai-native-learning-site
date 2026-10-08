# 深入浅出 DeepSpeed · Megatron

基于真实源码的 DeepSpeed + Megatron-LM 训练栈拆解，共 14 章 + 索引。所有代码摘录均来自本地仓库实际代码（非伪造签名），行号与实现以版本锚点为准。

## 版本锚点

| 仓库 | 本地路径 | 锚点 |
|---|---|---|
| DeepSpeed | `/Users/lei.xia/workspace/github/DeepSpeed` | `v0.19.7-86-gf0a3be9bb`（version.txt: 0.19.8） |
| Megatron-LM | `/Users/lei.xia/workspace/github/Megatron-LM` | `core_v0.15.0rc7-2735-ge4294782f`（core 包版本 0.20.0） |

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

- **2026-10-09 目标对标补齐**（对照「读完目标/章节主线/特别要求」四条逐项核对，补 ①②③④ 四项缺口；版本锚点不变）：
  - **④ ZeRO 三阶段表**（ch07 7.1）：「一分钟版本」后新增六列表——阶段 × 按 DP 切了什么 × 每卡剩余字节 × 70B/DP=8 数值 × DS 实现入口（类/方法 + 行号）× Megatron 等价物；四个 stage 的类名与方法入口逐一 grep 回源核对（stage_1_and_2.py/stage3.py/distrib_optimizer.py/param_and_grad_buffer.py）。
  - **③ process group 拓扑图**（ch02 2.2）：新增图 2.1a——64 卡（TP=4×PP=4×DP=4，8 机 × 8 卡）全 64 rank 网格：每机器盒内 8 个 rank 小格（全局 rank + TP 位次）、TP 行着色、PP 跨机器对标条、DP 虚线框（ranks 0/4/8/12 一列）；原图 2.1 改称图 2.1b（16 卡 TP×PP 切片放大）并在图内脚注回指 2.1a；图 2.2 后新增 4D callout（64 卡 = TP2×CP2×PP2×DP8，order 前轴吃机内带宽、CP 机内相邻、EP 跨机 all-to-all）——满足「16 卡/64 卡拓扑图」要求，未独立成章（强化 ch2 免重编号）。
  - **② 显存账/通信量账逐章公式 + 70B 代入**：ch03 3.3 新增「每层通信量账」（纯 TP 2×AR 与 TP+SP 2×(RS+AG) 两式 + 2(t−1)/t ring 因子；70B h=8192/s=4096/b=4/t=8 → 每层 896/448 MiB、80 层 70 GiB/卡）；ch04 4.2 图后补 pp=4/m=8 的 stage0 全 step 手算（warmup 3 + steady 5 轮 + cooldown 3，空闲率 6/22=27% 验证公式）+ 70B（pp=8/m=64 气泡 10%、每边界 32 GiB p2p 流量/步）；ch13 13.3 补 AlltoAll 通信量账（671B 风格 e=64/k=8/h=7168 → dispatch+combine 每层约 3.4 GiB，对比 TP 每层 896 MiB 的近 4 倍）；ch07 7.1 表后补「显存省下了，通信多付多少」节（RS/AG 通信账，70B/d=8：AR 245 GB、ZeRO-1 参数 AG +245 GB、ZeRO-3 fetch 2×245=490 GB/卡/步、开重算逼近 1 TB——与 ch08「通信时长 ≈ 参数全量/带宽」口径核对一致）。
  - **① 小矩阵手算例子**：ch03 3.1（4×4 权重 TP=2：列并行 Y₁/Y₂ 分片 vs 行并行两块部分和 all-reduce，全数字 NumPy 复算精确吻合；3.2 annotation 回指该例）；ch04 4.2（1F1B 逐拍时间线）；ch05 5.5（zigzag：s=8/CP=2 连续切 6:22 失衡 → zigzag 14:14 均衡，配 70B 的 K/V ring 128 MiB/层通信账）；ch13 13.3（EP=2/top-k=2/4 token 的 dispatch 明细：5 份发出 3 份收回，top-k 复制语义 + unpermute 加权还原）。
  - 终扫：五章禁语零残留（清理新写文案中的 白捡/拼图/账单 三处）；五个 HTML parse-check 全过；新增数字全部脚本复算（ch3 矩阵、ch4 时长账、ch5 zigzag 与 ring、ch13 token 份数、ch7 通信账）；算例统一锚 70B（h=8192/s=4096/b=4），MoE 处用 671B 风格参数（h=7168）并在文中标注风格差异。
- **2026-10-06 六次核实**（DeepSpeed 18 commits / Megatron 50 commits，重锚 `v0.19.7-86-gf0a3be9bb` / `core_v0.15.0rc7-2735-ge4294782f`）：
  - 4 处 pin 漂移修正：ch01 `training.py:3292→3302`（RLConfig 容器化 hunk 上移 +10）；ch07 epilogue `:984→:999`（#8632/#8655 在其前插入 ~15 行）；ch08 step `:2774→:2791`（#8655 在其前新增 `_muon_update_lacks_loss_scale` 方法段）。DS engine.py 三个 pin（3353/3413/3538）byte-identical 未动。
  - 摘录回源全中：ch07 7.2 IPG/epilogue、7.5 LRU 缓冲与动量暂存/提交、ch08 8.3 stage3 step 子组循环、ch07 7.3 `_build_model_gbuf_param_range_map` 与 `checkpoint_fully_reshardable_formats`（现 :166）、ch10 `checkpointed_forward`（recompute.py:24）/`checkpoint_core_attention`（attention.py:393）——`recompute_modules` 可选值家族继续扩（新增 mhc/shortcut_pre_mlp_layernorm/residual_stream 等 output-discarding 档，core_attn/mlp/moe 仍走普通 checkpointing），10.3 的 selective 机制描述不变。
  - 两个实质 commit 触及已覆盖面的邻接处但不动摇书中断言：DS #8655（Muon fp16 loss scale 修复——offload 路径 #8464 已处理，非 offload 路径在 fp32 cast 后、norm 与 `unscale_and_clip_grads` 前把 update 乘回 scale；ch07 7.5/7.6 的机制描述与此互补不冲突）+ DS #8632（ZeRO-1/2 offload 梯度生命期/流序硬化——超大梯度独立克隆、producer/reuse event、offload 拷贝跨流排序；覆盖 offload_optimizer cpu/nvme，ZenFlow 除外；ch09 9.3 的数据流叙述仍准确，本次未展开 event 细节）。Megatron #7080（DistributedOptimizer checkpoint 键从 dtype 元组改为 `param_<dtype>` 字符串，带 pre-3.1 回读兼容）——书未断言 FQN 键格式，ch12 不动。
  - Megatron 端新增的 26.09-alpha/beta.rc1 tag 均非 HEAD 祖先（release 候选线），重锚仍取 main。其余 commits（AutoEP 系列 #8644/#8651/#8671/#8678、FP16_Optimizer MoE grad norm #8635、AutoSP 校验、fused Triton RoPE、RecipeConfig 进 run_config yaml、wide-residual [2/4][3/4][4/4]、GTP 去重、RLConfig 节等）不触及书中覆盖面，未改章。
  - 同日 SVG 全审（用户「检查一遍，包括svg图」）：16 张 SVG 的 `<text>` 逐条回源，7 处修正——ch04 时序图 warmup 步数与同图公式自相矛盾（stage0 画 4 步改 3 步、stage1 F0..F2 改 F0..F1、desc 同步）；ch06 ZeRO 显存账两处（ZeRO-1 `2+2+16/DP`→`2+2+12/DP`、ZeRO-2 `2+4/DP`→`2+14/DP`）；index AutoTP 行指向 ch09 改 ch01；ch01 L4 行 `quantizer`→`quantization`；index SVG 同款 quantizer 改名。SVG 内目录名逐个 ls 验证存在。
  - 同日正文路径级纠错（SVG 审计牵出的预存错误，旧锚点即错）：ch11.3 csrc 盘点树重写——`deepspeed/csrc/` 实为仓库根 `csrc/`（`deepspeed/ops/csrc` 是软链，2023-09 #672eee968 起），无 `cpu_adam/` 顶层目录（CPU Adam 在 `csrc/adam/`）、无 `quantizer/`（真名 `quantization/`）、Lion 在 `csrc/lion/`（cpu_lion 非顶层）、transformer 括注文件名换真实（`ds_transformer_cuda.cpp`、`softmax/gelu/normalize_kernels.cu`）；ch01/ch02 Ulysses 归因 `deepspeed/sequence/`→`deepspeed/runtime/sequence_parallel/`（`sequence/` 是 AutoSP）；ch09 9.2 摘录假符号 `ds_opt_adam_init` 换真实 `CPUAdamBuilder().load()` + `create_adam(...)`（cpu_adam.py:91-93）。
- **2026-09-29 五次核实**（DeepSpeed 22 commits / Megatron 16 commits，重锚 `v0.19.7-68-g53e336cd5` / `core_v0.15.0rc7-2685-g07147d694`，章级最大一次改动是新增内容）：
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
