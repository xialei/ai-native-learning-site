# 深入浅出vLLM

一套**纯静态、自包含**的 HTML 学习站点，用于系统学习 vLLM 的推理引擎实现，并为**自研推理引擎**提供路线图。无需任何构建工具，双击 `index.html` 即可浏览。

## 如何浏览

```bash
open /Users/lei.xia/workspace/github/vllm/learning-site/index.html
# 或：在浏览器中打开该文件
```

> 提示：可对照仓库源码一起看。每个页面中标注的 `vllm/v1/...` 相对路径都是本仓库的真实文件。

## 内容结构

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 总览图 |
| `01-architecture.html` | 整体架构 | 四层架构、组件职责、EngineCore 进程模型 |
| `02-request-lifecycle.html` | 请求生命周期 | generate() → token 输出的全链路、prefill/decode |
| `03-paged-attention.html` | PagedAttention & KV Cache | 分页思想、逻辑块/物理块、BlockPool、allocate_slots |
| `04-scheduler.html` | 调度器 | 连续批处理、统一调度、优先级/抢占、PD 分离（prefill/decode 分离式部署） |
| `05-model-runner.html` | Model Runner | batch→GPU 张量、KV 传递、CUDA Graph |
| `06-sampling.html` | 采样 | SamplingParams、logits 后处理、Sampler、detokenize |
| `07-kernels.html` | Kernel 层 | 注意力后端抽象、FlashAttention/FlashInfer、自定义算子 |
| `08-memory.html` | 内存与 KV 预算 | 显存划分、memory profile、前缀缓存 |
| `09-serving-entry.html` | 服务入口 | OpenAI API、AsyncLLMEngine、流式、引擎分离 |
| `10-distributed.html` | 分布式 | TP/PP/DP/EP、Executor（uniproc/ray/multiproc） |
| `11-build-own-engine.html` | 自研路线图 | 六个里程碑：从单请求到多卡 |
| `12-model-weights.html` | 实战·模型权重加载 | 注册表→loader→load_weights 重映射→量化/稀疏调优；以 DeepSeek-V4 / GLM-5.2 / Kimi-K2 为例；附三个真实 checkpoint 仓库目录结构对照 |
| `13-agentic-gateway.html` | 实战·Agentic 网关 | 拆解 vllm-project/agentic-api（Rust）：previous_response_id 注水、服务端工具循环、工具所有权路由、SSE 缝合、compaction；vLLM 前的有状态编排层 |

共享样式：`assets/vllm-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- **基于 vLLM v1（新架构）** 编写。
- 站点内代码片段均摘自本仓库真实代码并标注文件路径；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 13 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`。
- 新增概念图：直接在页面内写内联 `<svg class="svg-box">`，复用 CSS 中的 `.node` / `.edge` / `.lbl` 等类与 `<marker id="arrow">`。
- 代码片段：务必从真实源码摘录并标注路径，不要凭记忆杜撰函数签名。
- 如需在 `index.html` 的 `pathgrid` 增删卡片，同步调整对应页面即可。
