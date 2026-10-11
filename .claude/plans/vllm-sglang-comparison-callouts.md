# vLLM 书 01–10 章小结处添加「与 SGLang 对照」callout

## 需求（用户已确认）

- 形式：每章小结末尾插入一个 `callout info` 块，tag 为「与 SGLang 对照」；3–5 行机制对照 + SGLang 源码路径 + 链接到 sglang/books 对应章节。不动现有表格与 callout。
- 范围：只加 vLLM 书 01–10 章（与 sglang 书有对应章节的）。11 自制路线图 / 12 权重加载 / 13 Agentic 网关 / 14 模型变迁不加。
- 不改版本戳（无源码主张变更）；不反向修改 sglang 书；不动 README。

## 插入位置（统一规则：小结表格 + 自研启示之后、下一步导航/过渡之前）

| 文件 | 插入点 |
|---|---|
| 01-architecture.html | 1.6 启示 callout 之后、arrow-nav 之前 |
| 02-request-lifecycle.html | 2.7 末尾 annotation 之后、`</section>` 之前 |
| 03-paged-attention.html | 3.6 表格之后、下一步 callout 之前 |
| 04-scheduler.html | 4.7 本章收束 annotation 之后、下一步 callout 之前 |
| 05-model-runner.html | 5.6 自研启示 callout 之后、`</section>` 之前 |
| 06-sampling.html | 6.8 自研启示 callout 之后、下一步 callout 之前 |
| 07-kernels.html | 7.6 自研启示 callout 之后、`</section>` 之前 |
| 08-memory.html | 8.6 自研启示 callout 之后、`</section>` 之前 |
| 09-serving-entry.html | 9.7 自研启示 callout 之后、下一步 callout 之前 |
| 10-distributed.html | 10.5 自研启示 callout 之后、`</section>` 之前 |

跨书链接用相对路径 `../../sglang/books/NN-*.html`（站点以 file:// 双击打开为主要用法，相对路径可用）。

## 章节映射

01→sglang01 架构 ｜ 02→sglang02 生命周期 ｜ 03→sglang03 RadixCache ｜ 04→sglang04 调度器 ｜ 05→sglang06 ModelRunner ｜ 06→sglang08 采样 ｜ 07→sglang07 注意力后端 ｜ 08→sglang05 内存 ｜ 09→sglang09 服务入口 ｜ 10→sglang10 分布式

## 已核验的事实依据（全部对过真实源码）

vLLM 侧锚 HEAD `proto-v0.3.0-180-gd2983f2f16`（书内戳 4cc15f2121，callout 只引类/文件名不引行号，不受漂移影响）：
- EngineCore core.py:109 / EngineCoreProc :1088；Scheduler scheduler.py:81 / AsyncScheduler async_scheduler.py:12；KVCacheManager kv_cache_manager.py:131、allocate_slots :371；BlockHashToBlockMap block_pool.py:33
- Sampler v1/sample/sampler.py:21、apply_temperature :229；SamplingParams vllm/sampling_params.py:211；apply_top_k_top_p topk_topp_sampler.py:402
- AttentionBackendEnum backends/registry.py:34；selector get_attn_backend selector.py:105
- Executor：UniProc uniproc_executor.py:51 / Multiproc multiproc_executor.py:111
- preempt 按 (priority, arrival_time) scheduler.py:755-759、_preempt_request :1528；V2 GPUModelRunner gpu/model_runner.py:186、sample :1512
- 投机：SpecDecodeMetadata metadata.py:10、EagleProposer eagle.py:10、RejectionSampler v1/sample/rejection_sampler.py

SGLang 侧锚 gateway-v0.3.1-9843-g6ad78f2281（与 sglang 书戳一致，本机源码 HEAD 即此）：
- Scheduler scheduler.py:433（event_loop_normal :1932 / event_loop_overlap :1967）；TokenizerManager tokenizer_manager.py:413；DetokenizerManager detokenizer_manager.py:102；DataParallelController data_parallel_controller.py:140（LoadBalanceMethod :87）
- PrefillAdder schedule_policy.py:620（rem_total_tokens 是 @property :774；rem_input/rem_chunk :646）；CacheAwarePolicy LPM/DFS_WEIGHT/HRRN :219-224；retract_decode schedule_batch.py:3248；SGLANG_INIT_NEW_TOKEN_RATIO scheduler_components/new_token_ratio_tracker.py:23
- radix_cache.py match_prefix :396 / insert :456；ReqToTokenPool memory_pool.py:272、MHATokenToKVPool :1960；PagedTokenToKVPoolAllocator allocator/paged.py:116
- ForwardBatch.init_new forward_batch_info.py:847；ModelRunner model_runner.py:301、_forward_raw :1849；TpModelWorker tp_worker.py:318
- attention_registry.py：ATTENTION_BACKENDS = {} :40、@register_attention_backend :43；解析点 model_runner_components/attention_backend_setup.py:277；RadixAttention 层 layers/radix_attention.py
- Sampler layers/sampler.py:108（forward :138）；SamplingBatchInfo sampling/sampling_batch_info.py:50（apply_logits_bias :351）
- http_server.py launch_server :2844；watchdog.py SubprocessWatchdog :166；ServerArgs server_args.py:195；runtime_context get_schedule :1552
- GroupCoordinator parallel_state.py:238（all_reduce :655 六路选路）；dp_attention dp_gather_partial :837
- BaseSpecWorker base_spec_worker.py:154、forward_batch_generation 接口与 TpModelWorker tp_worker.py:631 同形；zero-step 分支 eagle_worker_v2.py:1461

## 文风约束（记忆 plain-chinese-tech-writing-style）

- 禁 AI 套话/比喻词表；不用 「一句话：」开头；概括不加「设计哲学」式收尾；「详见」+ 书名链接收尾。
- 中文直陈机制；callout 长度控制在 4–6 行。

## 每章内容草稿

### 01 整体架构
同一个「分进程」问题，两边切法不同。vLLM 把「调度 + KV 管理」收进一个 EngineCore 进程（`vllm/v1/engine/core.py`），执行单独成层（Executor → Worker）；SGLang 反过来：调度、KV 管理、前向全部合在一个 Scheduler 进程里（每个 TP rank 一个，`python/sglang/srt/managers/scheduler.py`），反分词反而独立成第三个进程（DetokenizerManager）。进程间两边都走 ZMQ。对照着看，「哪些功能必须分进程、哪些是工程取舍」会比只读一边清楚。详见〔深入浅出SGLang · 01 整体架构与进程模型〕

### 02 请求生命周期
同一条链路，SGLang 的走法：`/generate` → TokenizerManager 分词后发 `TokenizedGenerateReqInput` → Scheduler 入队、事件循环驱动前向 → 输出以 `BatchTokenIDOutput`（id 通道）发给独立进程 DetokenizerManager，再以文本通道回主进程变成 SSE。三个可对照的点：① vLLM 的分词与反分词都在前端进程内，SGLang 把反分词拆成独立进程；② 重叠调度两边都有——vLLM 叫 async scheduling（AsyncScheduler），SGLang 的 `event_loop_overlap` 是默认路径；③ SGLang 把 abort 当一等消息，客户端断连经后台任务转成 `AbortReq` 走同一条 ZMQ 通道。详见〔02 请求全生命周期〕

### 03 PagedAttention
「前缀缓存用什么数据结构」两边给了两个答案。vLLM：块内容哈希——相同 token 序列算出相同哈希，`BlockHashToBlockMap`（`vllm/v1/core/block_pool.py`）一查即中；SGLang：基数树 RadixCache——树节点存 KV 槽位下标，`match_prefix` 沿树往下走（`python/sglang/srt/mem_cache/radix_cache.py`）。哈希表查整块是 O(1)；基数树则天然支持「沿着树长出分层状态」——SGLang 的 HiCache（KV 出 GPU 的分层缓存，其第 11 章）就是在这棵树上扩展的。分页本身两边一致：都以固定大小的块/页为单位分配、都支持块共享。详见〔03 RadixCache〕

### 04 调度器
SGLang 没有把所有预算塞进一个 schedule()，而是分两层：prefill 准入由 PrefillAdder 记三本账——rem_total_tokens（全周期 KV 预算，还是个现算属性）、rem_chunk_tokens（本步 prefill 上限）、rem_input_tokens（`python/sglang/srt/managers/schedule_policy.py`），候选请求先排序再逐个过账；decode 容量另由 check_decode_capacity 把关。抢占在 SGLang 叫 retract：不是把请求退回 waiting 就完事，而是把已生成的 KV 备份到主机内存，重新入队后用备份续跑，恢复节奏由 new_token_ratio 控制。排序本身也有讲究——默认 cache-aware LPM，吃第 3 章基数树的收益。详见〔04 调度器与调度策略〕

### 05 Model Runner
同一层三个可对照点。① 数据结构：vLLM 的 InputBatch 把「调度侧请求状态」和「GPU 侧张量」合在一个类里；SGLang 拆成两个——ScheduleBatch（调度侧）经 `ForwardBatch.init_new` 压平成 ForwardBatch（`python/sglang/srt/model_executor/forward_batch_info.py`）。② 执行路径：vLLM 命中图回放、否则 eager 两级；SGLang 是三级——decode 整图回放 → prefill 分段图（piecewise）→ eager（`ModelRunner._forward_raw`，`model_runner.py`）。③ KV 寻址：两边都是「每请求一张表 + 槽位号」，vLLM 叫 block table + slot mapping，SGLang 叫 req_to_token 行 + out_cache_loc。详见〔06 ModelRunner 与 CUDA Graph〕

### 06 采样
两边的 Sampler 都有「全批贪心就走 argmax 快路径」，组织方式不同：vLLM 一条路径里按 `all_greedy` 分支；SGLang 在 `Sampler.forward` 开头显式分两条路（`python/sglang/srt/layers/sampler.py`），逐请求参数先由 SamplingBatchInfo 压成 batch 张量（apply_logits_bias 一并处理 grammar 屏蔽）。输出约束的落点两边一致：grammar 在采样前压 logit，function call 解析在反分词之后的 serving 层。投机解码的组织差异较大：vLLM 的草稿在 runner 内部走（`vllm/v1/spec_decode/`）；SGLang 把它做成与 TpModelWorker 同接口（`forward_batch_generation`）的 spec worker，调度器零改动。详见〔08 采样与结构化输出〕；EAGLE 草稿-验证结构另见其第 13 章。

### 07 Kernel
「后端怎么选」两边都收敛到注册表，注册粒度不同。vLLM：AttentionBackendEnum 枚举 + 平台优先级列表选路（`vllm/v1/attention/backends/registry.py`、`selector.py`）；SGLang：一个模块级 dict 加一个装饰器，工厂函数按字符串实例化（`python/sglang/srt/layers/attention/attention_registry.py`）。模型层的隔离面也不同：vLLM 模型调 AttentionImpl.forward；SGLang 模型只调一个 RadixAttention 模块（`layers/radix_attention.py`），kernel 怎么选模型完全不管。SGLang 的 AttentionBackend 另有一份「三个初始化钩子（eager / 图外 / 图内）」的契约，为 CUDA Graph 捕获服务——vLLM 用 metadata builder 解决同一个问题。详见〔07 注意力后端〕

### 08 内存
显存预算的参数两边不一样：vLLM 是 `gpu_memory_utilization`（profile 实测非 KV 开销后取剩余）；SGLang 是 `mem_fraction_static`——划出「权重 + KV 池」的静态区，KV 池大小由启动时现场 profiling 量出（`python/sglang/srt/mem_cache/kv_cache_configurator.py`）。记账单位也不同：vLLM 一切以块为单位，KVCacheManager.allocate_slots 按块发号；SGLang 以槽位为单位——ReqToTokenPool 一张「请求 × token → 槽位」的目录表，TokenToKVPool 按槽位存每层 K/V（`mem_cache/memory_pool.py`），页只是分配器的发号粒度。前缀缓存的对照见第 3 章。详见〔05 内存池与显存预算〕

### 09 服务入口
两边都把「HTTP 壳」与「引擎核心」解耦，工程细节各有取舍。SGLang 的 `launch_server`（`python/sglang/srt/entrypoints/http_server.py`）注册约 80 条路由；启动时发一条 max_new_tokens=8 的真实请求做 warmup，把 CUDA Graph 捕获、内核编译这些首次成本消化在「服务就绪」之前；另有 SubprocessWatchdog 轮询子进程存活。配置收在 ServerArgs，经 runtime_context 发布成进程内只读快照。离线入口：vLLM 用 LLM.generate；SGLang 用同一套进程、不设 HTTP 的 Engine。详见〔09 服务入口〕

### 10 分布式
进程组织是最大的分歧点。vLLM：一个 EngineCore 通过 Executor（UniProc / Multiproc / Ray）把每步调度输出分发给 worker；SGLang：每个 TP rank 都是一个完整的 Scheduler 子进程，TP 组内同步发生在前向内部——GroupCoordinator.all_reduce 按平台与消息大小多路选路（pymscclpp、symmetric-memory pynccl、flashinfer、torch 等，`python/sglang/srt/distributed/parallel_state.py`）。DP 的落点也不同：vLLM 的 DP 是多副本分摊负载；SGLang 有 DataParallelController 专做请求路由（四种负载均衡策略），另有 dp_attention 让注意力复制、MoE 分片，是大 MoE 模型的常用组合。详见〔10 分布式推理〕

## 执行步骤

1. 逐文件 Edit 插入 10 个 callout（按上表插入点）。
2. 验证：
   - 标签配平脚本（div/section/table/a/code/ul/li/b 等 23 对）跑 10 个文件；
   - `../../sglang/books/*.html` 链接目标存在性检查；
   - 新增文本过一遍 AI 套话词表 grep；
   - 每个文件插入处上下文通读一遍。

## 不做的事

- 不改 11–14 章、sglang 书、两个 README、版本戳、导航。
