# 深入浅出PyTorch

一套**纯静态、自包含**的 HTML 学习站点，用于系统学习 PyTorch 本体的内部实现，并为**自研训练框架**提供路线图。无需任何构建工具，双击 `index.html` 即可浏览。

## 如何浏览

```bash
open pytorch/books/index.html
# 或：在浏览器中打开该文件
```

> 提示：可对照 [pytorch/pytorch](https://github.com/pytorch/pytorch) 源码一起看。每个页面中标注的 `torch/...`、`c10/...`、`aten/...` 相对路径都是该仓库的真实文件。

## 内容结构

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 总览图 + 全书词表 |
| `01-architecture.html` | 整体架构 | Python 前厅（`torch/__init__.py` 导入机制）、三层目录（c10/ATen/torch/csrc）、生成物地图（native_functions.yaml、derivatives.yaml） |
| `02-tensor.html` | Tensor | TensorImpl/StorageImpl 分离、VariableVersion、shallow-copy 语义、view/detach/clone 行为对照 |
| `03-dispatcher.html` | Dispatcher | DispatchKey 两维模型、查表快路径、redispatch 链、两层插件（register_fake / __torch_dispatch__） |
| `04-autograd-graph.html` | 计算图 | derivatives.yaml、Node/Edge、AutogradMeta、AccumulateGrad、控图开关（no_grad/detach）成本账 |
| `05-autograd-engine.html` | 反向引擎 | Engine::execute、GraphTask 账本、thread_main 工作线程、依赖计数执行序、InputBuffer |
| `06-module.html` | Module | `__setattr__` 三本账、`_call_impl` 快慢路径、state_dict 名字契约 |
| `07-optimizer.html` | 优化器 | Optimizer 基类、AdamW 三条实现路径（single/multi-tensor/fused）、LRScheduler、AMP GradScaler |
| `08-dataloader.html` | 数据加载 | 多进程管道（index_queue→worker→pin_memory→data_queue）、乱序重排、关停语义 |
| `09-dynamo.html` | Dynamo | eval_frame 帧监控、guards、重编译上限、到 AOTAutograd 的接力 |
| `10-inductor.html` | Inductor 与 AOTAutograd | compile_fx 管线四步、min-cut 重算分区、Scheduler 融合、autotune 与两级缓存、收益来源分解 |
| `11-memory.html` | 显存与 CUDA Graphs | CUDACachingAllocator 块池、碎片治理选项、CUDA Graph 捕获/回放、SDPA 多后端选型 |
| `12-distributed.html` | 分布式 | DeviceMesh、DTensor（Placement + `__torch_dispatch__`）、FSDP2 fully_shard |
| `13-engineering.html` | 训练工程 | DCP 检查点（save/async_save/planner）、流水线调度（GPipe/1F1B/Interleaved/ZeroBubble）、torchrun 弹性、profiler 对号入座 |
| `14-build-own.html` | 自研路线 | 扩展档位表（define→dispatch→backend）、自研里程碑清单、torch.export 与 AOTInductor、核心文件收口 |

共享样式：`assets/pytorch-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- 基于 PyTorch 主干（版本戳 `trunk 5eb6d3d36b2`，2026-09-29 快照）编写。
- 站点内代码片段均摘自 pytorch/pytorch 仓库真实代码并标注文件路径；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 14 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`。
- 新增概念图：直接在页面内写内联 `<svg class="svg-box">`，复用 CSS 中的 `.node` / `.edge` / `.lbl` 等类与 `<marker id="arrow">`。
- 代码片段：务必从真实源码摘录并标注路径，不要凭记忆杜撰函数签名。
- 如需在 `index.html` 的 `pathgrid` 增删卡片，同步调整对应页面即可。
