# 深入浅出On-Device推理

一套**纯静态、自包含**的 HTML 学习站点，用两个真实引擎对照着讲 on-device 推理：**llama.cpp**（通用轻量级推理引擎）与 **FreeToken**（消费级 GPU 的 MoE 专用推理引擎）。并为**自研 on-device 推理引擎**提供路线图。无需任何构建工具，双击 `index.html` 即可浏览。

## 如何浏览

```bash
open on-device/books/index.html
# 或：在浏览器中打开该文件
```

> 提示：可对照两个仓库源码一起看。页面中标注的 `src/...`、`ggml/...`（llama.cpp）与 `python/freetoken/...`（FreeToken）路径都是真实文件。

## 内容结构

llama.cpp 部分（01-09）与 FreeToken 部分（10-12）各自成线，第 13 章收拢对照。

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 总览图 |
| `01-architecture.html` | 整体架构 | 两个引擎的分层、组件职责、一次请求的形状；「先回答你的模型是什么形状」 |
| `02-gguf-loading.html` | 权重加载 | GGUF 元数据/mmap、量化格式；FTW 分片、O_DIRECT、pinned bank |
| `03-decode-loop.html` | decode 循环 | llama_context 状态机、ubatch；overlap_loop 双流、chunked prefill |
| `04-kv-cache.html` | KV cache | cells 槽位制、iswa 双缓存；radix 树页池、GDN 状态槽 |
| `05-graph-sched.html` | 图与调度 | C 图重建/复用、sched 切分；CUDA Graph 档位重放 |
| `06-multi-device.html` | 多设备 | 切层/tensor split/pipeline；FreeToken 的单卡押注 |
| `07-sampling.html` | 采样 | 责任链 sampler、grammar；批量采样、greedy 短路 |
| `08-speculative.html` | 投机解码 | 11 种草稿-验证实现；FreeToken 为何不做 |
| `09-server.html` | 服务入口 | slot 状态机、LCP 选槽、prompt cache |
| `10-freetoken.html` | FreeToken 全景 | 三进程 ZMQ、engine 状态机、decode/prefill 重叠、radix 前缀复用 |
| `11-moe-offload.html` | MoE 专家缓存 | 137GiB 算术、槽池/LRU、bank schemas、prefill 双缓冲、FTW、预算规划、--cpu-moe 对照 |
| `12-hybrid-exec.html` | CPU/GPU 带宽协同 | q* 分流、benchbw 实测、hybrid decode、memop 门铃、host bank 优化 |
| `13-build-own-engine.html` | 双引擎对照·自研 | 全书对照总表、三条工程定律、六个自研里程碑 |

共享样式：`assets/on-device-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- **双引擎对照**：llama.cpp 锚定 `b11095`（HEAD 58367713a），FreeToken 锚定 `v0.1.3`（HEAD cab110e），均为 2026-09-22 核实。
- 站点内代码片段均摘自两个仓库真实代码并标注文件路径；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 13 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`。
- 新增概念图：直接在页面内写内联 `<svg class="svg-box">`，复用 CSS 中的 `.node` / `.edge` / `.lbl` 等类与 `<marker id="arrow">`。
- 代码片段：务必从真实源码摘录并标注路径，不要凭记忆杜撰函数签名。
- 涉及两引擎对照的段落，动机引用以源码注释为准，不要转述成泛泛的「为了性能」。
- 如需在 `index.html` 的 `pathgrid` 增删卡片，同步调整对应页面即可。
