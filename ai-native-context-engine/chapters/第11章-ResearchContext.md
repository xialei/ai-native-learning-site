# 第11章 Research Context 技术架构设计

> Context Engine 领域上下文模型（Domain Context Plugin）
>
> Version：v1.0
>
> Status：Draft

本章是 Domain Context Plugin 的第一个实例。通用对象、生命周期和 Context Package 以第2章和第8章为准，本章只定义研发领域的对象映射、关系和使用方式。

---

# 1. 模块定位

Research Context 是 Context Engine 在 AI 研发场景中的领域模型（Domain Context）。

职责：

> **统一描述 AI 研发全过程中的对象、关系、状态和行为，为 Research Agent 提供完整的研发上下文。**

Research Context 不是 Notebook，也不是 MLflow。

而是：

> AI 研发知识的统一运行时。

---

# 2. 为什么需要 Research Context

目前 AI 研发的数据分散在多个系统：

- Git
- Notebook
- MLflow
- 数据平台
- GPU 集群
- 模型仓库
- 特征平台
- 文档系统

Agent 无法理解：

这些对象之间的关系。

例如：

```
这个模型为什么效果下降？
```

实际上需要关联：

- 数据集
- 特征
- 实验
- Commit
- GPU
- 参数
- Evaluation

Research Context 的目标就是：

> 把研发对象组织成一个统一的 Context Graph。

---

# 3. Research Context 架构

分两层看：上层是**领域对象类型**（Research Object，§4 详表），下层是**源系统 Connector**（经 Builder 产出对象），中间的映射由 Builder 归属标注：

```
┌──────────────────── 领域对象类型（Research Object）────────────────────┐
│  Experiment   Dataset   Model   Checkpoint   Evaluation   Job   User  │
│      ▲           ▲         ▲         ▲           ▲        ▲      ▲    │
├──────┴───────────┴─────────┴─────────┴───────────┴────────┴──────┴────┤
│                    Builder 映射（§6，复用第 3 章 Pipeline）              │
├────────────────────────────────────────────────────────────────────────┤
│  源系统 Connector：MLflow   Git   Notebook   Paimon   GPU Cluster      │
└────────────────────────────────────────────────────────────────────────┘
```

所有研发对象：

统一纳入 Context。

---

# 4. 核心对象（Research Object）

建议第一版统一以下对象类型：

| 对象 | 说明 |
|------|------|
| Experiment | 一次实验 |
| Dataset | 数据集 |
| Feature | 特征 |
| Foundation Model | 基础模型 |
| Fine-tuned Model | 微调模型 |
| Checkpoint | 模型检查点 |
| Notebook | Notebook |
| Workflow | 工作流 |
| Evaluation | 评测结果 |
| Metric | 指标 |
| Git Commit | 代码版本 |
| GPU Cluster | GPU资源 |
| Job | 训练任务 |
| User | 研发人员 |

所有对象都拥有统一 ID。

ID 规约以第 2 章 §2 为准：全局唯一 `id` + `source_ref` 指向源系统记录（scheme 是**来源系统**，不是对象类型）。

例如：

```
id: exp-001          source_ref: mlflow://experiment/1

id: era5-v2          source_ref: paimon://table/era5_v2

id: glm52            source_ref: registry://models/glm52

id: ckpt-23          source_ref: storage://checkpoints/ckpt-23
```

同一对象可能有多个 source_ref（如同一模型同时登记在训练平台和模型仓库），身份解析规则见第 3 章 §12。

---

# 5. Object Relation

Research Context 的核心不是对象。

而是关系。

例如：

```
Experiment

├── uses → Dataset

├── uses → Feature

├── trains → Model

├── generates → Checkpoint

├── evaluates → Evaluation

├── executed_by → Job

└── owned_by → User
```

所有关系：

均采用统一 Schema。

---

# 6. Context 构建流程

Research Context 由多个 Builder 自动生成。

```
Git Builder

Notebook Builder

MLflow Builder

Dataset Builder

Workflow Builder

Cluster Builder

↓

Research Context Builder

↓

Context Graph
```

无需人工维护。

---

# 7. 研发对象业务生命周期

本节是**研发领域的业务阶段**，不是平台级的 Context 生命周期——那以第 2 章 §10 和第 8 章 §4 为准，本章不重复定义。每个业务阶段触发的平台动作：

| 业务阶段 | 触发的第 8 章 Context Event | 写入的对象 |
|---------|---------------------------|-----------|
| 创建实验 | ContextCreated | Experiment（Entity） |
| 提交代码 | ContextUpdated | Git Commit（Entity）+ Document |
| 启动训练 | ContextUpdated | Job + Metric 开始产出 |
| 生成 Checkpoint | ContextUpdated | Checkpoint（Entity） |
| 模型评测 | ContextUpdated | Evaluation（Entity）+ Metric |
| 部署 | ContextUpdated | Action 记录 |
| 在线监控 | ContextUpdated / ContextArchived | Metric 时序；实验下线时归档 |

```
创建实验

↓

提交代码

↓

启动训练

↓

生成 Checkpoint

↓

模型评测

↓

部署

↓

在线监控
```

整个生命周期：

统一保存在 Context 中。

---

# 8. Context 查询

Agent 查询的不再是文档。

而是对象。

例如：

```
Experiment：

exp-001
```

自动展开：

按第 5 章的扩展策略执行（Hop 限制、Relation White List、Node Ranking、意图驱动扩展），而不是固定线性链——同样查询 exp-001，"这个实验为什么慢"会向 GPU/Job 方向扩展，"这个实验用了什么数据"会向 Dataset/Feature 方向扩展。扩展产出是按 Expansion Score 排序的 Top 子图（含 relation 与 hop 标注）：

```
exp-001 ──uses──▶ dataset-1          (hop 1)
exp-001 ──trained_on──▶ gpu-07       (hop 1)
dataset-1 ──derived_from──▶ era5-v2  (hop 2)
```

对象 ID 查询走第 4 章 §5 Orchestrator 的 Graph 路由。

形成完整上下文。

---

# 9. Context 更新

Research Context 支持实时更新。

例如：

- 新实验创建
- Git 提交
- Notebook 保存
- MLflow 记录指标
- GPU 状态变化
- 数据集更新

全部自动同步到 Context。

---

# 10. Agent 如何使用

Research Agent 不直接访问：

- Git
- MLflow
- Notebook

而是：

```
Agent

↓

Context Engine

↓

Research Context

↓

Context Package
```

所有研发知识统一从 Context Engine 获取。

---

# 11. Research Context 示例

用户提问：

```
为什么昨天训练失败？
```

Context Engine 自动构建：

```
Experiment

↓

Training Job

↓

GPU

↓

Dataset

↓

Checkpoint

↓

Training Log

↓

Evaluation

↓

Git Commit
```

LLM 不需要自己推测依赖关系。

---

# 12. 与其他模块关系

通用流水线各模块的职责见第1章 §4。本章定位：Domain Context Plugin 的研发实例，只定义研发领域对象映射与关系，不重新定义通用对象模型（第2章）和生命周期（第8章）。

---

# 13. MVP

第一阶段：

✓ Experiment

✓ Dataset

✓ Model

✓ Notebook

✓ MLflow

✓ Git

第二阶段：

✓ Workflow

✓ GPU

✓ Evaluation

✓ Feature

第三阶段：

计划 Foundation Model 接入与自动知识抽取（Agent Memory 不在本插件范围，见第 8 章 Memory）

---

# 一句话总结

Research Context 不是研发知识库。

而是：

> **AI 研发全过程的统一上下文模型（Research Context Graph），让 Agent 能够像研发工程师一样理解实验、数据、模型、代码和资源之间的关系。**

---

## 14. Context Plugin Marketplace

Research Context 是第一个插件实例，它的分发形态就是 Context Plugin Marketplace（交付排期见第 14 章 Phase 4 M9；行业清单以第 12 章 §14 为准）：

```
Context Engine

↓

Install Plugin

↓

Research Context

Business Context

（行业插件见第 12 章 §14：风电 / 光伏 / 储能 / 电网 / 制造 / 金融 / 医疗 / 物流）
```

每个插件都包含：

- Ontology Schema（领域对象映射，如本章 §4/§6）
- Builder（复用第 3 章 Pipeline，只定义映射）
- Retriever 参数与领域关系白名单（复用第 4/5 章）
- Ranking 权重配置（复用第 6 章）
- Prompt Template（第 7 章 §13）

"打包即用"工业上已被验证可行，但有几条工程约束先说清楚。Palantir Foundry 的 Marketplace 可把 object type、action type、function、视图打包成产品分发到别的环境，它踩的坑值得抄录：第一，权限规则不能绑死具体用户，必须改成引用群组——否则装到别的环境用户不存在，权限规则直接失效；第二，对象实例本身不能打包，只能打包类型定义和数据集，安装后由对方环境重新生成对象；第三，打包 action type 时最好把关联的 link type 一起带上。本书 Context Plugin Marketplace 要遵循同一条纪律：可分发的是定义不是实例；权限要可移植，不能绑死具体身份。<span class="src">来源：Foundry Ontology 文档，Foundry DevOps / Marketplace</span>