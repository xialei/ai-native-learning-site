# Fireworks AI 工程架构拆解

> **版本：2026-09**
>
> 本文从工程架构角度拆解 Fireworks AI 的核心技术体系，重点分析其在 LLM Inference、GPU Runtime、KV Cache、Prefill/Decode Disaggregation、Routing、Speculative Decoding、Multi-LoRA、Deployment Shape、Training/RL 等方面的工程实践，并进一步映射到自建 AI Infra / Context Engine / Gateway 的设计。

---

# 1. Executive Summary

Fireworks 最值得研究的地方，不是某一个 CUDA Kernel，而是它采用了一种非常明确的工程路线：

> **从 Model Serving 出发，向下控制 GPU Runtime，向上控制 Routing / Deployment，再向前延伸到 Training / RL，形成 Model → Runtime → Serving → Training 的垂直优化体系。**

Fireworks 官方目前将其推理系统描述为：

```text
GPU Memory Layout
        ↓
Custom Kernels
        ↓
Inference Runtime
        ↓
Prefill / Decode Disaggregation
        ↓
KV Cache
        ↓
Prompt-aware Routing
        ↓
Deployment Shapes
        ↓
Application
```

同时继续向训练侧延伸：

```text
Training
    ↕
Weight Synchronization
    ↕
Rollout / Inference
    ↕
Numerical Alignment
    ↕
Evaluation
```

Fireworks 官方明确强调，其推理引擎不是在通用 serving stack 上简单调参，而是从 GPU memory layout 到 runtime 进行端到端优化，并将不同推理阶段进行 disaggregation。

因此可以把 Fireworks 的核心工程体系概括为：

```text
                    Fireworks AI
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Model Layer      Runtime Layer    Platform Layer
        │                │                │
    MoE / LoRA       Kernels          Routing
    Quantization     Attention        KV Cache
    Speculation      GPU Runtime      Deployment
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  Inference Platform
                         │
               ┌─────────┴─────────┐
               ↓                   ↓
           Prefill Pool        Decode Pool
               │                   │
               └─────────┬─────────┘
                         ↓
                     KV Cache
                         ↓
                     GPU Fleet
                         ↓
                Training / RL Loop
```

---

# 2. Fireworks 的核心工程哲学

## 2.1 不把 LLM Serving 当成 Web Service

传统工程思路：

```text
HTTP Request
     ↓
Load Balancer
     ↓
Inference Server
     ↓
GPU
```

核心目标通常是：

- API 稳定
- 请求均衡
- GPU 利用率
- QPS

Fireworks 的思路更接近：

```text
Request
   ↓
Workload Analysis
   ↓
Prompt / KV Locality
   ↓
Routing
   ↓
Prefill / Decode Scheduling
   ↓
KV Cache
   ↓
GPU Runtime
   ↓
Kernel
   ↓
GPU
```

也就是说：

> **请求本身的计算特征会影响调度。**

例如：

- prompt 很长
- output 很短
- prompt 很短
- output 很长
- prefix cache hit
- prefix cache miss
- 是否存在 draft model
- 是否使用 LoRA
- 是否需要长上下文
- 是否属于 interactive workload

这些因素最终都会影响：

```text
GPU
Batch
Routing
Cache
Runtime
```

---

# 3. 第一层：GPU Runtime

## 3.1 FireAttention

Fireworks 很早就构建了自己的推理栈，并将 FireAttention 作为核心优化组件之一。

其目标不是单纯实现 Attention，而是针对实际 LLM serving workload 对：

- memory layout
- attention execution
- batching
- quantization
- GPU architecture

进行联合优化。

Fireworks 官方曾明确表示，FireAttention 会持续加入新的 kernel 和配置，以针对不同 deployment workload 进行优化。

因此可以把它理解成：

```text
          Model
            ↓
       FireAttention
            ↓
   ┌────────┼────────┐
   ↓        ↓        ↓
Attention  KV      Batching
Kernel    Cache    Scheduling
   ↓        ↓        ↓
        GPU Runtime
```

---

# 4. 第二层：Precision / Quantization

Fireworks 并不把量化简单看成：

```text
FP16 → INT8
```

而是把 Precision 作为 deployment optimization 的一个维度。

典型维度包括：

```text
BF16
FP8
FP4
NVFP4
NF4
Block-wise FP8
```

Deployment Shape API 本身就暴露了 precision、GPU、draft model、LoRA cache 等配置项，说明 Fireworks 将这些参数统一视为 serving configuration，而不是用户必须理解的底层细节。

核心思想：

```text
Model
  +
GPU
  +
Precision
  +
Kernel
  +
Workload
```

必须联合优化。

---

# 5. 第三层：Speculative Decoding

Fireworks 将 speculative decoding 做成生产级 serving capability。

基本结构：

```text
                 Prompt
                   │
                   ↓
             Draft Model
                   │
            draft tokens
                   │
                   ↓
             Target Model
                   │
                verify
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    accepted                rejected
        │
        ↓
      output
```

传统 Decode：

```text
token 1
  ↓
token 2
  ↓
token 3
  ↓
token 4
```

Speculative Decode：

```text
              Draft
                ↓
       t1 t2 t3 t4 t5
                ↓
             Verify
                ↓
       ✓  ✓  ✓  ✗
```

Fireworks 曾公开展示 Cursor Fast Apply 场景中，70B 模型结合 speculative decoding 达到超过 1000 tok/s 的生成速度。

Fireworks 目前也将 speculative decoding 作为 Deployment Shape 背后的隐藏优化项之一。

### 工程启示

Speculation 不应该只是：

```yaml
enable_speculation: true
```

而应该成为：

```text
Workload
   ↓
Latency Requirement
   ↓
Draft Model Selection
   ↓
Speculation Strategy
   ↓
GPU / Batch Configuration
```

的一部分。

---

# 6. 第四层：Prefill / Decode Disaggregation

这是 Fireworks 当前架构中非常重要的一层。

官方明确表示：

> Prefill 和 Decode 具有不同的硬件特征，因此将它们放在独立资源池中分别扩展。



架构：

```text
                    Router
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
        Prefill Pool         Decode Pool
             │                   │
       GPU Compute          Memory Bandwidth
             │                   │
             └─────────┬─────────┘
                       ↓
                   KV Cache
```

---

# 7. 为什么 PD Separation 有价值？

因为 Prefill 和 Decode 的瓶颈完全不同。

## Prefill

主要特点：

```text
大量输入 Token
      ↓
高 FLOPs
      ↓
Compute Bound
```

## Decode

主要特点：

```text
逐 token 生成
      ↓
大量读取 KV / Model Weights
      ↓
Memory Bandwidth Bound
```

所以：

```text
Prefill GPU
≠
Decode GPU
```

最优配置也可能不同。

Fireworks 的工程思想就是：

> **不要强迫一个 GPU 同时为两种完全不同的 workload 服务。**

---

# 8. 第五层：KV Cache

这可能是 Fireworks 对你目前 Context Engine 最有价值的启发之一。

Fireworks 将 KV Cache 从单机 runtime feature 提升到了：

> **Distributed Infrastructure**

官方明确提到其使用 disaggregated KV caching，并结合 prompt-aware routing 来提高长上下文和多轮 session 的效率。

---

# 9. KV Cache 的三层结构

Fireworks 的思路可以抽象为：

```text
                 KV Cache
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      Node        Cluster      Region
      Cache        Cache        Cache
```

再由 Router 决定：

```text
Request
   ↓
Prefix Hash
   ↓
KV Locality
   ↓
Candidate Workers
   ↓
Load
   ↓
Routing
```

这已经不是传统：

```text
Round Robin
Least Connection
```

而是：

> **Cache-aware Routing**

---

# 10. Prompt-aware Routing

传统 Router：

```text
Request
  ↓
GPU 1
GPU 2
GPU 3
GPU 4
```

Fireworks 类架构：

```text
Request
  ↓
Prompt / Prefix Analysis
  ↓
KV Cache Lookup
  ↓
┌─────────────────────────────┐
│ GPU1: 80% prefix hit        │
│ GPU2: 0% prefix hit         │
│ GPU3: 60% prefix hit        │
│ GPU4: overloaded            │
└─────────────────────────────┘
  ↓
GPU1
```

所以 routing objective 从：

```text
Load Balance
```

变成：

```text
Routing Score
=
Load
+
KV Locality
+
Session Affinity
+
Network Cost
+
Prefill Cost
+
Decode Cost
```

这是一个非常重要的架构升级。

---

# 11. Session Affinity

Fireworks 的 Deployment Shape API 中已经存在：

```text
enableSessionAffinity
```

这意味着 session stickiness 也成为 serving shape 的一个可配置维度。

对于 Agent：

```text
User
 ↓
Conversation
 ↓
Agent
 ↓
Tool Calls
 ↓
LLM
 ↓
LLM
 ↓
LLM
```

如果每次请求都随机打到不同 GPU：

```text
GPU1
GPU3
GPU2
GPU4
```

KV cache locality 会严重下降。

因此：

```text
User / Session
       ↓
Sticky Routing
       ↓
KV Locality
```

是合理的。

---

# 12. 第六层：Multi-LoRA

Fireworks 的 Multi-LoRA 是非常有代表性的工程实践。

问题：

```text
Base Model
   │
   ├── Customer A
   ├── Customer B
   ├── Customer C
   ├── Customer D
   └── Customer E
```

如果每个 LoRA 都单独部署：

```text
Base + LoRA A → GPU
Base + LoRA B → GPU
Base + LoRA C → GPU
...
```

大量 GPU 会浪费在重复的 Base Model 上。

---

# 13. Cross-Model Continuous Batching

Fireworks 的解决方案：

```text
                   Base Model
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
       LoRA A        LoRA B        LoRA C
         │             │             │
         └─────────────┼─────────────┘
                       ↓
             Cross-Model Batch
                       ↓
                      GPU
```

Fireworks 官方说明，其 Multi-LoRA 通过 Cross-Model Continuous Batching，让不同 LoRA 的请求进入同一个 base model deployment，同时动态调整 batch size。

同时使用：

```text
Dynamic LoRA Loading
+
LoRA Cache
```

避免所有 adapter 都常驻 GPU memory。

---

# 14. Multi-LoRA 的本质

它不是简单的 LoRA support。

真正重要的是：

> **把 Model Variant 从 Deployment Unit 中解耦。**

传统：

```text
Model Variant
     =
Deployment
     =
GPU
```

Fireworks：

```text
Base Model
     +
Adapter
     ↓
Logical Model
     ↓
Shared Runtime
     ↓
Shared GPU
```

这其实是：

> **Multi-Tenant Model Serving**

---

# 15. 第七层：Deployment Shapes

这是 Fireworks 非常值得学习的产品化设计。

LLM Serving 参数很多：

```text
GPU
Precision
Quantization
TP
Sharding
Batch
KV Cache
Speculation
Draft Model
LoRA
Context Length
```

如果全部开放给用户：

```text
用户
 ↓
100 个参数
 ↓
不知道怎么配
```

Fireworks 的解决方式：

> **Deployment Shape**

---

# 16. Deployment Shape = Serving Compiler 的雏形

用户只需要：

```text
Model
+
Goal
```

例如：

```text
Fast
Throughput
Minimal
```

Fireworks 在后台决定：

```text
GPU
Precision
Quantization
Speculation
Batch
KV Cache
Sharding
```

官方目前将 Deployment Shape 分成 Minimal、Fast、Throughput 等类型，并根据 latency / throughput / cost 目标预配置 serving 参数。

因此：

```text
User Intent
    ↓
Workload Profile
    ↓
Deployment Shape
    ↓
Serving Configuration
    ↓
GPU Runtime
```

这实际上已经非常接近：

> **LLM Serving Compiler**

---

# 17. Deployment Shape 为什么重要？

因为未来真正复杂的不是：

```text
启动 vLLM
```

而是：

```text
给定：

Model
GPU
Context
Concurrency
Input / Output ratio
Latency SLA
Cost target
KV locality
Speculation

求：

最优 Deployment Configuration
```

可以抽象成：

```text
Optimization Function

minimize:
    Cost

subject to:
    TTFT < X
    TPOT < Y
    QPS > Z
    GPU Memory < M
    Quality >= Q
```

Fireworks 正在把大量人工 tuning 经验产品化。

---

# 18. 第八层：Training / Inference 一体化

Fireworks 现在已经不满足于：

```text
Inference Platform
```

而是进一步构建：

```text
Training
   ↕
Rollout
   ↕
Inference
```

特别是在 RL 场景：

```text
             ┌──────────────┐
             │   Trainer    │
             └──────┬───────┘
                    │
               new weights
                    ↓
             ┌──────────────┐
             │ Rollout Fleet│
             └──────┬───────┘
                    │
                 samples
                    ↓
             ┌──────────────┐
             │   Trainer    │
             └──────────────┘
```

这不是传统的：

```text
Train → Checkpoint → Deploy
```

而是：

```text
Train
 ↓
Rollout
 ↓
Reward
 ↓
Update
 ↓
Rollout
 ↓
Update
...
```

---

# 19. Weight Synchronization

RL 最大的问题之一：

```text
Trainer
  ↓
新 checkpoint
  ↓
Inference Fleet
```

如果每一步都传完整 checkpoint：

```text
巨大 Model
     ↓
巨大网络传输
     ↓
巨大同步成本
```

Fireworks 引入了 base/delta checkpoint 链等机制。

其 WeightSyncer 支持：

```text
Base Checkpoint
      ↓
Delta 1
      ↓
Delta 2
      ↓
Delta 3
```

并负责：

- checkpoint tracking
- hotload
- delta chain
- deployment state
- warmup
- failed synchronization recovery



---

# 20. Training / Inference Numerical Parity

这是 Fireworks 当前非常重要的工程能力。

RL：

```text
Trainer
   ↓
Policy
   ↓
Rollout
   ↓
Reward
   ↓
Trainer
```

如果：

```text
Trainer numerics
       ≠
Inference numerics
```

那么：

```text
训练认为：
P(token)=0.52

推理实际：
P(token)=0.48
```

长期积累后会导致：

```text
KL divergence
   ↓
Importance sampling
   ↓
Token clipping
   ↓
Learning signal loss
   ↓
Reward collapse
```

Fireworks 因此对：

- numeric formats
- kernels
- reductions
- MoE routing
- parallelism

进行对齐，并通过 train-inference KLD 进行验证。

---

# 21. MoE Router Replay

MoE 更复杂。

```text
Token
 ↓
Router
 ↓
Expert 1
Expert 5
Expert 8
```

如果 Training 和 Inference 的数值稍有变化：

```text
Trainer:
Expert 1 → Expert 5

Inference:
Expert 1 → Expert 8
```

那么实际上已经不是同一个模型路径。

Fireworks 使用 Router Replay 等方法保证 rollout 与 backward pass 的 expert selection 对齐。

这说明：

> **Fireworks 已经把“Serving Correctness”提升到了 Model Training Correctness。**

---

# 22. Streaming Pipeline Parallelism

Fireworks 在 RL training 中还针对一个非常现实的问题做了优化。

传统 Pipeline：

```text
等待 Batch
    ↓
GPU 计算
    ↓
下一 Batch
```

但 RL rollout 数据往往是：

```text
Sample
Sample
      Sample
          Sample
```

异步到达。

Fireworks 因此使用 Streaming Pipeline Parallelism：

```text
Data 1 ──→ GPU
Data 2 ─────→ GPU
Data 3 ─────────→ GPU
```

而不是：

```text
等待完整 Batch
        ↓
开始计算
```

官方称这种方式可以显著降低 RL workload 的 first-result latency。

---

# 23. Fireworks 的完整架构

综合上述技术，可以抽象出：

```text
                              ┌──────────────────────┐
                              │     Application      │
                              └──────────┬───────────┘
                                         │
                                         ↓
                              ┌──────────────────────┐
                              │   API / Gateway      │
                              └──────────┬───────────┘
                                         │
                              ┌──────────▼───────────┐
                              │ Prompt-aware Router  │
                              └──────────┬───────────┘
                                         │
                         ┌───────────────┼────────────────┐
                         ↓               ↓                ↓
                    KV Cache        Session Affinity   Load
                         │
                         ↓
               ┌─────────────────────┐
               │ Disaggregated Engine│
               └──────────┬──────────┘
                          │
                ┌─────────┴─────────┐
                ↓                   ↓
          Prefill Pool         Decode Pool
                │                   │
                └─────────┬─────────┘
                          ↓
                    KV Cache Layer
                          ↓
                  FireAttention
                          ↓
                Custom GPU Kernels
                          ↓
               Quantization / FP8/FP4
                          ↓
                         GPU
```

上面再向训练侧连接：

```text
                         GPU Fleet
                            │
              ┌─────────────┴─────────────┐
              ↓                           ↓
          Inference                    Training
              │                           │
           Rollout                   Gradients
              │                           │
              └─────────────┬─────────────┘
                            ↓
                     Weight Sync
                            ↓
                    Numerical Parity
                            ↓
                          RL Loop
```

---

# 24. Fireworks 的真正核心：Optimization Stack

如果把 Fireworks 的能力按照层次重新整理：

```text
L0  Hardware
    GPU / NVLink / Network

L1  Precision
    BF16 / FP8 / FP4 / NVFP4

L2  Kernel
    Custom CUDA / Attention / GEMM

L3  Runtime
    Batching / Scheduling / Speculation

L4  Cache
    KV Cache / Prefix Cache / LoRA Cache

L5  Distributed Inference
    Prefill / Decode / KV Transfer

L6  Routing
    Prompt-aware / Session / Locality

L7  Deployment
    Deployment Shapes / Autoscaling

L8  Model Adaptation
    LoRA / Multi-LoRA

L9  Training
    SFT / DPO / RL / Full FT

L10 Training-Inference Alignment
    Weight Sync / Numerical Parity

L11 Product
    API / SDK / Evaluation / Agent
```

越往下越接近硬件。

越往上越接近用户。

Fireworks 的优势就在于：

> **这 11 层不是由 11 个不同团队分别优化，而是尽可能由一个系统统一优化。**

---

# 25. 与 vLLM / SGLang / llm-d 的关系

Fireworks 不应该简单理解成：

```text
Fireworks = Another vLLM
```

更准确的关系：

```text
                     Fireworks
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      Runtime          Router          Platform
        │                │                │
  Custom Kernel       KV-aware        Training
  Attention           Routing         RL
  Speculation         Placement       Eval
  Quantization        Session         Deploy
```

而开源生态：

```text
vLLM
 ├── Runtime
 ├── Continuous Batching
 ├── KV Cache
 └── Serving

SGLang
 ├── Runtime
 ├── Radix Attention
 ├── Structured Generation
 └── Serving

llm-d
 ├── Distributed Serving
 ├── PD Disaggregation
 ├── Routing
 └── Kubernetes Integration
```

因此：

```text
vLLM / SGLang
       ↓
Inference Runtime

llm-d
       ↓
Distributed Inference

Fireworks
       ↓
Runtime
+
GPU
+
Cache
+
Routing
+
Deployment
+
Training
+
RL
```

这是三者最重要的区别。

---

# 26. 对你当前 Gateway 的启发

你目前的 Gateway 如果只是：

```text
Client
 ↓
LiteLLM / Gateway
 ↓
APISIX
 ↓
vLLM
```

那么核心能力还是：

```text
Request Routing
```

Fireworks 式架构应该升级为：

```text
                    AI Gateway
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        Context Engine         Model Router
              │                     │
              ↓                     ↓
          Prefix/KV              Workload
          Metadata              Analysis
              │                     │
              └──────────┬──────────┘
                         ↓
                    Scheduler
                         │
             ┌───────────┼───────────┐
             ↓           ↓           ↓
          Prefill      Decode      Cache
             │           │           │
             └───────────┼───────────┘
                         ↓
                      Runtime
                         ↓
                    GPU Cluster
```

---

# 27. 对你的 Context Engine 的启发

你之前设计的：

```text
Context Engine

Hybrid Retrieval
Graph Expansion
Context Ranking
Token Budget
Runtime
Cache
Trace
Research Context
Business Context
Multi-Agent Context
```

如果加入 Fireworks 思路，可以增加：

```text
Context Engine
│
├── Semantic Context
│
├── Retrieval Context
│
├── Business Context
│
├── Agent Context
│
├── Prompt Cache
│
├── KV Cache Metadata
│
├── Session Affinity
│
└── Context-aware Routing
```

尤其应该把：

```text
Context
```

与：

```text
KV Cache
```

建立联系。

最终形成：

```text
User Context
      ↓
Prompt Construction
      ↓
Prefix Identification
      ↓
KV Cache Lookup
      ↓
Context Optimization
      ↓
Router
      ↓
Inference
```

---

# 28. 你自己的 Router 可以进一步演化

传统：

```text
score =
  load
```

第二阶段：

```text
score =
  load
  + latency
  + GPU utilization
```

Fireworks 风格：

```text
score =
    α × queue_delay
  + β × prefill_cost
  + γ × decode_cost
  + δ × KV_miss_penalty
  + ε × network_cost
  + ζ × session_affinity
  + η × GPU_memory_pressure
```

进一步：

```text
score =
  f(
      prompt_length,
      output_length,
      prefix_hit_ratio,
      KV_location,
      GPU_type,
      batch_state,
      model_shape,
      speculation,
      SLA
  )
```

这才是真正的：

> **LLM Router**

而不是 HTTP Load Balancer。

---

# 29. Deployment Optimizer

Fireworks Deployment Shape 对你自己的平台也非常值得借鉴。

建议不要让用户直接配置：

```yaml
tensor_parallel_size: 8
gpu_memory_utilization: 0.85
max_num_batched_tokens: 32768
max_num_seqs: 8
enable_chunked_prefill: true
enable_prefix_caching: true
...
```

而应该提供：

```yaml
model: glm-5.3-flash

workload:
  type: agent
  concurrency: 30
  input_tokens: 20000
  output_tokens: 4000

objective:
  latency: high
  cost: medium
```

然后：

```text
Deployment Optimizer
        ↓
GPU
TP / EP
PD
Batch
KV
Speculation
Quantization
Runtime
```

自动生成最终 Deployment。

---

# 30. 一个更完整的 AI Serving Control Plane

如果按照 Fireworks 的工程思想重新设计你的平台：

```text
                     Control Plane
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
   Model Registry    Deployment Plan    Eval
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ↓
                  Serving Optimizer
                          │
                  ┌───────┴───────┐
                  ↓               ↓
              Prefill          Decode
                  │               │
                  └───────┬───────┘
                          ↓
                      KV Cache
                          ↓
                     GPU Runtime
                          ↓
                       GPU Fleet
```

Data Plane：

```text
Request
  ↓
Gateway
  ↓
Context Engine
  ↓
Router
  ↓
Scheduler
  ↓
Inference Runtime
```

Training Plane：

```text
Dataset
  ↓
Trainer
  ↓
Checkpoint
  ↓
WeightSync
  ↓
Rollout
  ↓
Reward
  ↓
Trainer
```

三个 Plane 最终形成：

```text
                AI Platform
                     │
      ┌──────────────┼──────────────┐
      ↓              ↓              ↓
 Control Plane    Data Plane    Training Plane
      │              │              │
 Deployment        Serving        Training
 Routing           KV Cache       RL
 Model             Runtime        Weight Sync
 Eval              GPU            Eval
```

---

# 31. 最值得抄的 10 个工程实践

按照对你当前系统的价值排序：

| 优先级 | Fireworks 实践 | 建议 |
|---|---|---|
| ★★★★★ | KV-aware Routing | 强烈建议 |
| ★★★★★ | PD Disaggregation | 你已经在做 |
| ★★★★★ | Deployment Shapes | 非常值得做 |
| ★★★★★ | Prompt/KV Locality | Context Engine 核心能力 |
| ★★★★☆ | Speculative Decoding | Runtime 层 |
| ★★★★☆ | Multi-LoRA | Multi-Tenant 场景 |
| ★★★★☆ | Custom GPU Kernel | 后期再做 |
| ★★★★☆ | Numerical Parity | RL 阶段必须 |
| ★★★★☆ | Weight Sync | Training/RL 阶段 |
| ★★★☆☆ | Streaming Pipeline | 大规模 Training/RL |

---

# 32. 哪些不要直接抄

Fireworks 的一些东西非常重，不建议一开始全部自己做。

## 第一阶段不要自己做

```text
Custom CUDA Kernel
Custom Attention
Custom GPU Runtime
```

原因：

```text
开发成本巨大
     ↓
维护成本巨大
     ↓
GPU 架构变化
     ↓
持续跟进
```

早期直接：

```text
vLLM / SGLang
```

更合理。

---

## 第二阶段应该自己做

```text
Router
KV-aware Routing
Context Engine
Deployment Optimizer
Observability
Model Registry
```

这些才是平台层真正形成差异化的地方。

---

## 第三阶段再做

```text
Custom Runtime
Custom Kernel
GPU Scheduling
Numerical Alignment
Training Runtime
```

只有当规模足够大，才值得承担这些成本。

---

# 33. 对你的平台，我建议形成的最终技术路线

## Phase 1：Inference Platform

```text
Gateway
   ↓
Router
   ↓
vLLM / SGLang
   ↓
GPU
```

目标：

```text
稳定
可观测
高并发
多模型
```

---

## Phase 2：Context-aware Inference

```text
Gateway
   ↓
Context Engine
   ↓
KV-aware Router
   ↓
PD Engine
   ↓
GPU
```

增加：

```text
Prefix Cache
KV Cache
Session Affinity
Prompt-aware Routing
```

---

## Phase 3：Serving Optimizer

```text
Workload
   ↓
Benchmark
   ↓
Deployment Optimizer
   ↓
Deployment Shape
   ↓
自动选择：

GPU
TP
EP
PD
Quant
Batch
KV
Speculation
```

这一步开始真正接近 Fireworks。

---

## Phase 4：Model Platform

```text
Model Registry
      ↓
Base Model
      ↓
LoRA
      ↓
Multi-LoRA
      ↓
Evaluation
      ↓
Deployment
```

---

## Phase 5：Training + RL

```text
Trainer
   ↓
Checkpoint
   ↓
Weight Sync
   ↓
Rollout
   ↓
Reward
   ↓
Trainer
```

同时建立：

```text
Numerical Parity
Router Replay
Weight Delta
Streaming Pipeline
```

---

# 34. 最终判断

Fireworks 最值得学习的不是：

> “他们的 vLLM 比别人快多少。”

而是下面这个思想：

```text
                 Workload
                    ↓
              Model Selection
                    ↓
              Deployment Shape
                    ↓
                 Routing
                    ↓
             KV / Context
                    ↓
            Prefill / Decode
                    ↓
                 Runtime
                    ↓
              Quantization
                    ↓
                 Kernel
                    ↓
                   GPU
```

也就是说：

> **从用户 workload 一直优化到 GPU instruction。**

而训练侧再形成：

```text
GPU
 ↓
Inference
 ↓
Rollout
 ↓
Reward
 ↓
Training
 ↓
Weight Sync
 ↓
Inference
```

最终形成一个闭环。

---

# 35. 对你现在架构最重要的结论

如果把你目前正在做的几个方向放在一起：

```text
Gateway
Context Engine
llm-d
vLLM / SGLang
PD Separation
KV Cache
Agent Runtime
Training Platform
```

我认为最值得演化成的整体架构是：

```text
                         AI Platform
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ↓                   ↓                   ↓
     Control Plane         Data Plane        Training Plane
          │                   │                   │
     Model Registry       AI Gateway          Trainer
     Eval                  Context             RL
     Deployment            Router              Weight Sync
     Optimizer             KV Cache            Numerical Parity
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                       Serving Runtime
                              │
                 ┌────────────┴────────────┐
                 ↓                         ↓
             Prefill Pool             Decode Pool
                 │                         │
                 └────────────┬────────────┘
                              ↓
                         KV Cache
                              ↓
                    vLLM / SGLang / Custom
                              ↓
                         GPU Cluster
```

其中真正应该成为你平台核心壁垒的，不是简单的：

```text
vLLM + K8s
```

而应该是：

```text
Context Engine
       +
KV-aware Router
       +
Serving Optimizer
       +
Deployment Shape
       +
PD Scheduler
       +
Model Runtime
```

**这套东西才真正对应 Fireworks 的核心工程思想。**

---

# 36. 一句话总结

Fireworks 的工程路线可以浓缩成：

> **把 LLM 从“一个运行在 GPU 上的模型”，重新定义成“由 Context、KV Cache、Router、Scheduler、Runtime、Kernel、GPU 共同组成的计算系统”，然后再把 Training / RL 接回这个系统。**

这也是为什么 Fireworks 的架构值得与你正在设计的 **Context Engine + AI Gateway + llm-d + Model Platform** 放在一起研究，而不是单独研究它的 inference engine。