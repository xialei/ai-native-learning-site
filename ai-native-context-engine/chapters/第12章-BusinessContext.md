# 第12章 Business Context 技术架构设计

> AI Knowledge Runtime（AKR）领域上下文模型
>
> Version：v1.0
>
> Status：Draft

本章是 Domain Context Plugin 的业务实例。通用对象模型、Policy、Runtime 和 Context Package 不在本章重复定义。

---

# 1. 模块定位

Business Context 是 Context Engine 在企业业务场景中的领域模型（Domain Context）。

职责：

> **统一描述企业业务对象、业务关系、业务事件和业务规则，为 Business Agent 提供实时业务上下文。**

Business Context 不是业务数据库。

而是：

企业业务世界在 AI Runtime 中的统一表达。

---

# 2. 为什么需要 Business Context

企业业务数据通常分散在多个系统：

- ERP
- CRM
- MES
- SCADA
- IoT
- OA
- Workflow
- 数据仓库
- 数据湖
- 文档系统

Agent 无法理解：

这些系统之间：

到底是什么关系。

例如：

用户问：

```
为什么今天风电场发电量下降？
```

实际上需要：

风机

↓

测风塔

↓

ERA5

↓

功率预测模型

↓

告警

↓

工单

↓

维修记录

↓

天气变化

↓

电网限电

Business Context：

就是把这些对象：

组织起来。

---

# 3. Business Context 架构

```
Business Context

│

├── Business Object

├── Business Relation

├── Business Event

├── Business Metric

├── Business Rule

└── Business Action
```

所有业务知识：

统一表达。

---

# 4. Business Object

建议统一对象模型。

例如：

新能源行业：

| Object | 示例 |
|---------|------|
| Wind Farm | 风电场 |
| Turbine | 风机 |
| Solar Farm | 光伏电站 |
| Inverter | 逆变器 |
| Weather Station | 气象站 |
| Sensor | 传感器 |
| Forecast Task | 预测任务 |
| Alarm | 告警 |
| Work Order | 工单 |
| Maintenance | 检修 |
| Customer | 客户 |
| Organization | 组织 |

所有对象：

拥有统一 ID。

例如：

```
windfarm://wf001

turbine://wt102

forecast://forecast20260730
```

---

# 5. Business Relation

对象之间：

通过 Relation 建立联系。

例如：

```
Wind Farm

↓

contains

↓

Turbine

↓

installed_with

↓

Sensor

↓

reports

↓

Metric

↓

trigger

↓

Alarm

↓

generate

↓

Work Order
```

所有 Relation：

采用统一 Schema。

---

# 6. Business Event

Business Context 需要统一管理业务事件。

例如：

```
风速突变

↓

预测完成

↓

设备离线

↓

功率下降

↓

限电

↓

人工确认

↓

工单关闭
```

所有事件：

进入 Event Stream。

---

# 7. Business Metric

业务指标统一抽象。

例如：

```
实时功率

预测功率

风速

温度

辐照度

利用小时数

设备健康度

模型误差
```

Metric：

是 Context 的组成部分。

---

# 8. Business Rule

业务规则：

统一建模。

例如：

```
风速 > 25m/s

↓

停机

预测误差 > 20%

↓

重新训练

设备离线 > 10min

↓

创建告警
```

Rule：

不仅用于推理。

还参与：

Context Expansion。

---

# 9. Business Action

Agent：

最终执行：

Action。

例如：

```
创建预测

启动训练

生成报表

创建工单

发送通知

重新部署模型

更新参数
```

Action：

统一注册。

供 Agent 调用。

---

# 10. Context 构建流程

Business Context：

由多个 Builder 自动生成。

```
ERP Builder

CRM Builder

MES Builder

SCADA Builder

IoT Builder

Data Lake Builder

Workflow Builder

↓

Business Context Builder

↓

Business Context Graph
```

无需：

人工维护。

---

# 11. Context 生命周期

Business Context：

持续更新。

例如：

```
设备上线

↓

实时监控

↓

预测

↓

异常

↓

告警

↓

维修

↓

恢复

↓

归档
```

全过程：

统一记录。

---

# 12. Agent 如何使用

Business Agent：

不直接查询：

ERP

MES

SCADA

数据库。

而是：

```
Business Agent

↓

Context Engine

↓

Business Context

↓

Context Package
```

统一获取：

业务上下文。

---

# 13. 新能源行业示例

用户：

```
为什么今天风电预测误差增大？
```

Context Engine：

自动扩展：

```
风电场

↓

风机

↓

ERA5 数据

↓

测风塔

↓

预测模型

↓

最近训练

↓

模型评测

↓

天气变化

↓

设备状态

↓

历史误差
```

LLM：

无需自己：

寻找依赖关系。

---

# 14. 行业插件化

Business Context：

采用插件模式。

例如：

```
Business Context

├── 风电

├── 光伏

├── 储能

├── 电网

├── 制造

├── 金融

├── 医疗

└── 物流
```

每个插件：

包含：

- Ontology Schema
- Builder
- Retrieval Rule
- Expansion Rule
- Ranking Rule
- Prompt Template

统一接入：

Context Engine。

但插件之间的共性应用抽象表达，而不是硬造一个属性稀疏的"大而全"类型。Palantir Foundry 的 Interface 机制就是这个思路：定义一个对象类型的"形状"和"能力"，让多个不同类型一致实现它。比如定义 Facility 接口（带 Facility Name、Location），Airport、Manufacturing Plant、Maintenance Hangar 各自实现它、再各带特有属性——关键好处是将来新增实现该接口的类型，已有工作流不用改就自动兼容。一个对象类型还能实现多个接口，接口间也能继承。本书行业插件可照此做：风电场、光伏电站、储能站都是"设施"，先抽 Facility 接口兜住共性，再让各自插件带特有对象。跨行业通用工作流（如"列出所有设施健康度"）只认接口不认具体类型，新行业接入时老逻辑自动复用。<span class="src">来源：Foundry Ontology 文档，Interfaces</span>

---

# 15. 与其他模块关系

通用流水线各模块的职责见第1章 §4。本章定位：Domain Context Plugin 的业务实例，只定义业务领域对象、关系、事件与规则，不重复定义通用对象模型（第2章）、Policy 和 Runtime。

---

# 16. MVP

第一阶段：

✓ Business Object

✓ Business Relation

✓ Event

✓ Metric

✓ Action

第二阶段：

✓ Rule Engine

✓ Workflow

✓ Plugin

✓ 实时事件

第三阶段：

✓ 多行业 Context

✓ 数字孪生

✓ Context Marketplace

---

# 一句话总结

Business Context 不是业务数据库。

也不是知识图谱。

而是：

> **企业业务世界在 AI Runtime 中的统一上下文模型（Business Context），让 Agent 能够理解对象、关系、事件、指标、规则和动作，并完成业务推理与业务执行。**

# Business Runtime

Enterprise Systems
ERP / CRM / MES / IoT / SCADA / Git / MLflow

                │

         Context Builder

                │

       Business Runtime
      （Context Engine）

                │

Business Context Plugin
Research Context Plugin
Weather Context Plugin
Energy Context Plugin

                │

     Business Agent Runtime

                │

      Agent / Copilot / API
