# 深入浅出SGLang

一套**纯静态、自包含**的 HTML 学习站点，用于系统学习 SGLang 运行时（SRT）的实现，并为**自研推理引擎**提供参照。无需任何构建工具，双击 `index.html` 即可浏览。

## 如何浏览

```bash
open sglang/books/index.html
# 或：在浏览器中打开该文件
```

> 提示：可对照仓库源码一起看。每个页面中标注的 `python/sglang/srt/...` 相对路径都是 sglang 仓库的真实文件（本仓库源码位于同级目录 `../sglang`）。

## 内容结构

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 总览图 |
| `01-architecture.html` | 整体架构与进程模型 | SRT 四进程（HTTP/TokenizerManager、Scheduler×tp、Detokenizer）、ZMQ 通道、事件循环分发 |
| `02-request-lifecycle.html` | 请求生命周期 | /generate → 分词 → 调度 → 前向 → 反分词 → SSE 流式输出的全链路；abort 传播 |
| `03-radix-cache.html` | RadixCache 前缀缓存 | 基数树 match/insert/evict、锁引用、页对齐与 extra_key 命名空间、RadixAttention 名字辨析 |
| `04-scheduler.html` | 调度器与调度策略 | PrefillAdder 三本预算账、cache-aware 排序（LPM/DFS/HRRN）、chunked prefill、retract 抢占 |
| `05-memory.html` | 内存池与显存预算 | ReqToTokenPool、MHATokenToKVPool/MLA、分页分配器 alloc_extend/alloc_decode、mem_fraction_static profiling |
| `06-model-runner.html` | ModelRunner 与 CUDA Graph | ScheduleBatch→ForwardBatch、forward 三级路径（graph 回放/分段图/eager）、capture 与 replay |
| `07-attention-backends.html` | 注意力后端 | 注册表机制、AttentionBackend 三段初始化契约、flashinfer/fa3 实现、MHA vs MLA |
| `08-sampling.html` | 采样与结构化输出 | Sampler 贪心/概率路径、SamplingBatchInfo、grammar 约束（xgrammar 等）、function call 解析 |
| `09-serving-entry.html` | 服务入口 | HTTP 路由、OpenAI 兼容层、离线 Engine、ServerArgs 与 runtime_context 配置体系 |
| `10-distributed.html` | 分布式 | TP/PP/DP/EP、DataParallelController 四种负载均衡、GroupCoordinator 自定义 allreduce、dp_attention |
| `11-hicache.html` | HiCache 分层缓存 | L1/L2/L3 分层、HiRadixTree、预取与回写策略、存储后端（mooncake/hf3fs/nixl/aibrix） |
| `12-pd-disaggregation.html` | PD 分离部署 | bootstrap 房间握手、KV 传输（Mooncake/NIXL）、prefill/decode 两套事件循环与三个队列 |
| `13-speculative.html` | 投机解码 | EAGLE-2/3 结构（draft worker + verify）、MTP/NGRAM/STANDALONE 算法族、与 overlap 调度的配合 |

共享样式：`assets/sglang-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- **基于 SGLang SRT**（`sgl-project/sglang`，`python/sglang/srt`）编写，代码对应版本 `gateway-v0.3.1-9918-g9eda772a21`（HEAD `9eda772a21`）。
- 站点内代码片段均摘自真实代码并标注文件路径；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 13 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`。
- 新增概念图：直接在页面内写内联 `<svg class="svg-box">`，复用 CSS 中的 `.node` / `.edge` / `.lbl` 等类与 `<marker id="arrow">`。
- 代码片段：务必从真实源码摘录并标注路径，不要凭记忆杜撰函数签名。
- 如需在 `index.html` 的 `pathgrid` 增删卡片，同步调整对应页面即可。
- 源码版本升级后：更新各页 footer 与 `index.html` 版本徽标中的 `git describe` 值，并重新抽查代码摘录是否仍然成立。
