# 第12章 Business Context 技术架构设计

> Context Engine 领域上下文模型（Domain Context Plugin）
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

```
风机 --located_in--> 风电场 --downstream_of--> 电网限电（Event）
风机 --monitored_by--> 测风塔 --calibrated_against--> ERA5（Dataset）
风机 --drives--> 功率预测模型 --raises--> 告警（Event） --triggers--> 工单
工单 --resolved_by--> 维修记录（Document）
```

（关系动词与 §5 的关系 Schema 一致。）

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

领域章不新增平台对象类别：上图是业务视角的命名，全部映射到第 2 章 §2 的七类平台对象：

| 业务视角 | 第 2 章 §2 对象类型 | 说明 |
|---------|-------------------|------|
| Business Object（风机、工单…） | Entity | 业务实体 |
| Business Relation | Relation | 对象间关系 |
| Business Event（限电、告警…） | Event | 状态变化 |
| Business Metric（实时功率…） | Metric | 可量化指标 |
| Business Rule（风速>25m/s 停机…） | Policy | 规则与约束部分映射为 Policy |
| Business Action（创建工单…） | Action | 可执行动作 |
| 检修 SOP、操作手册 | Document | 文档系统接入（§2 数据源），业务知识的重要证据载体 |

Business Rule 与 Policy 的分工：参与推理的领域规则（如故障树）以 Entity 属性或 Relation 形式参与扩展与排序；具有约束/授权语义的规则（停机阈值、权限）映射为 Policy，由 Policy Engine 强制执行。

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

ID 规约与第 11 章一致，以第 2 章 §2 为准（全局 `id` + `source_ref` 指向源系统）：

```
id: wf001    source_ref: erp://assets/wf001

id: wt102    source_ref: scada://turbines/wt102

id: forecast20260730    source_ref: mes://forecast/20260730
```

## 身份解析

企业多源场景最难的一步：同一风机在 ERP 是资产编码、SCADA 是设备号、CRM 是服务对象。统一 ID 靠身份解析实现：

- **命名空间注册**：每个源系统接入时在 Ontology 注册命名空间（`erp://`、`scada://`、`crm://`），由 Knowledge Builder 统一管理；
- **跨系统映射表**：`(source, source_ref) → canonical id`，例如 `scada://turbines/wt102 → wt102`、`erp://assets/AS-88172 → wt102`、`crm://service-objects/SO-2209 → wt102`；映射规则由第 3 章 §12 Identity Resolution 的匹配键驱动（UUID > source_ref > 归一化名称+别名）；
- **冲突合并**：同一 canonical id 的多源属性冲突，按第 2 章对象级 `provenance`/`confidence` 字段记录来源与置信度，裁决规则复用第 7 章 §6 的冲突裁决表。

## 身份解析示例

```
ERP  erp://assets/AS-88172    ─┐
SCADA scada://turbines/wt102   ├─►  canonical id: wt102
CRM  crm://service/SO-2209    ─┘    （provenance: [erp, scada, crm]）
```

---

# 5. Business Relation

对象之间：

通过 Relation 建立联系。

例如（动词即本领域的关系白名单，方向为"源 --动词--> 目标"）：

```
Wind Farm --contains--> Turbine
Turbine --installed_with--> Sensor
Sensor --reports--> Metric
限电（Event） --triggers--> Alarm
Alarm --generates--> Work Order
风机 --monitored_by--> 测风塔
测风塔 --calibrated_against--> ERA5（Dataset）
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

两种用途挂接的平台钩子不同（对象类别以 §3 的映射表为准）：

- **参与推理**：作为对象属性/关系进入 Package，供 Agent 读取与排序参考。
- **参与 Expansion**：作为第 5 章 §7.3 Relation White List 中的领域关系触发扩展（如告警 --triggered_by--> 工单）；具有约束语义的规则（停机阈值）映射为 Policy，由 Policy Engine 强制执行，不作为普通遍历节点。

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

# 11. 业务对象事件闭环示例

本节展示的是业务对象的**业务闭环**（设备上线→维修→归档），不是平台级 Context 生命周期——那以第 2 章 §10 和第 8 章 §4 为准，每个业务阶段触发的 Context Event 与第 11 章 §7 的映射方式相同。Business Context 包（Package 级）的创建/更新/过期/归档同样遵循第 8 章 §4 的 8 状态，本章不重画。

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

自动扩展（按第 5 章扩展策略，Hop 限制内输出带 relation 标注的 Top 子图，与 §2 对象链同一套 Schema）：

```
风电场 --contains--> 风机
风机 --calibrated_against--> ERA5 数据（Dataset，hop 1）
风机 --monitored_by--> 测风塔（hop 1）
风机 --drives--> 预测模型 --latest_training--> 最近训练（hop 2）
预测模型 --has_evaluation--> 模型评测（hop 2）
测风塔 --observes--> 天气变化（Event，hop 2）
风机 --has_status--> 设备状态（Metric，hop 1）
预测模型 --tracks--> 历史误差（Metric，hop 2）
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

（以下为交付计划，非已完成清单；Marketplace 排期以第 14 章 Phase 4 为准。）

第一阶段：

计划七类对象的业务映射（§3）+ Builder 接入（ERP/SCADA/IoT）

第二阶段：

计划 Rule Engine / Workflow / Plugin 机制 / 实时事件

第三阶段：

计划 多行业 Context 扩展

计划 数字孪生（数字孪生引擎本身超出本书范围，此处只做 Context 侧的对象同步）

Marketplace 排期以第 14 章 Phase 4 为准（本插件的 Marketplace 接入随 Phase 4 M9 交付）。

---

# 一句话总结

Business Context 不是业务数据库。

也不是知识图谱。

而是：

> **企业业务世界在 AI Runtime 中的统一上下文模型（Business Context），让 Agent 能够理解对象、关系、事件、指标、规则和动作，并完成业务推理与业务执行。**

这个定位落成的整体形态（"Business Runtime" 一词在第 14 章 Phase 3 有明确排期，本章不另立名目）：

```
Enterprise Systems
ERP / CRM / MES / IoT / SCADA / Git / MLflow

                │

         Knowledge Builder（第 3 章）+ Context Builder（第 4 章）

                │

       Context Engine + Business Context Plugin（本章）

                │

     Context Runtime（第 8 章）

                │

      Agent / Copilot / API
```
