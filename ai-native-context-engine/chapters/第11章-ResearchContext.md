# 第11章 Research Context 技术架构设计

> AI Knowledge Runtime（AKR）领域上下文模型
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

```
                    Research Context

                           │

 ┌──────────┬──────────┬──────────┬──────────┐

 Experiment   Dataset    Model      Feature

      │            │           │           │

 Notebook   MLflow   Git Repo   Checkpoint

      │            │           │

 GPU Cluster  Workflow   Evaluation

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

例如：

```
experiment://exp-001

dataset://era5-v2

model://glm52

checkpoint://ckpt-23
```

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

# 7. Context 生命周期

Research Context 会持续演化。

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

```
Dataset

↓

Feature

↓

Notebook

↓

Checkpoint

↓

Evaluation

↓

GPU

↓

Owner
```

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

✓ Foundation Model

✓ Agent Memory

✓ 自动知识抽取

---

# 一句话总结

Research Context 不是研发知识库。

而是：

> **AI 研发全过程的统一上下文模型（Research Context Graph），让 Agent 能够像研发工程师一样理解实验、数据、模型、代码和资源之间的关系。**

# Context Plugin Marketplace

Context Engine

↓

Install Plugin

↓

Research Context

Business Context

Weather Context

Energy Context

Manufacturing Context

例如你们未来在新能源行业，可以直接提供：

风电 Context
光伏 Context
电网 Context
储能 Context
气象 Context

每个插件都包含：

Ontology Schema
Builder
Retriever
Expansion Rule
Ranking Rule
Prompt Template

"打包即用"工业上已被验证可行，但有几条工程约束先说清楚。Palantir Foundry 的 Marketplace 可把 object type、action type、function、视图打包成产品分发到别的环境，它踩的坑值得抄录：第一，权限规则不能绑死具体用户，必须改成引用群组——否则装到别的环境用户不存在，权限规则直接失效；第二，对象实例本身不能打包，只能打包类型定义和数据集，安装后由对方环境重新生成对象；第三，打包 action type 时最好把关联的 link type 一起带上。本书 Context Plugin Marketplace 要遵循同一条纪律：可分发的是定义不是实例；权限要可移植，不能绑死具体身份。<span class="src">来源：Foundry Ontology 文档，Foundry DevOps / Marketplace</span>
