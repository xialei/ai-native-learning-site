# Pi Agent Harness

基于 [`github.com/earendil-works/pi`](https://github.com/earendil-works/pi) 源码整理的一套**静态 Web 站点**，用于深入浅出地学习这个 TypeScript Agent 运行时。

面向目标：**未来自己动手做一个 Agent Runtime**。因此每一章都强调「代码 + 逐行解释 + 机制」，并在最后一章给出从零自制的演进路线。

## 亮点

- **全部静态 HTML + 单一共享 CSS**，无需构建、无运行时依赖，浏览器直接打开本目录下的 `index.html` 即可。
- **书页式版式**：760px 窄栏正文 + chap-meta 章标 + lede 导语 + 每章「本章小结」收拢块 + 上下章书式导航；宽图（≥800px）经 `.breakout` 溢出到 960px 保持可读，窄屏自动回落栏内。
- 所有架构图 / 流程图均使用**内联 SVG**。
- **重点章节**：上下文（第 5 章）与 Harness（第 7、8 章），这正是 Pi 里信息密度最高、对「自己做 Runtime」最关键的部分。
- **工程细节就地讲解**：原「补遗」内容已拆并入各章——分支摘要与文件操作清单（第 6 章 §6.8）、带宽优化的流式代理（第 10 章 §10.5）、深度 JSON 耐久校验（第 4 章 §4.8）、stdout 接管与按真实文件串行写（第 9 章 §9.6）。
- **边界章节**：第 13 章收拢运行时的外围——项目信任与沙箱隔离（软/硬边界）、把 llama.cpp 本地模型接成 Provider（离线接入）、以及 SDK / RPC / JSON 事件流三种程序化嵌入方式。
- **对照章节**：第 14 章把 Pi 和「图优先」的 LangGraph 沿六个维度（设计哲学/核心能力/适用场景/开发体验/灵活性/生产就绪）逐项对比，看清两者各自把复杂度放在哪里、为谁优化——不是分高下，而是讲清设计取舍，助你自研时敢做选择。
- 每章都带代码片段 + 逐行解释 + 结论式 callout，深入浅出，绝不只是大纲。

## 章节

| # | 主题 | 文件 |
|---|------|------|
| 首页 | 总览与心智地图 | `index.html` |
| 01 | 架构分层 | `01-architecture.html` |
| 02 | 消息类型（AgentMessage / Message 桥） | `02-messages-types.html` |
| 03 | Agent 循环（双循环） | `03-agent-loop.html` |
| 04 | 会话存储（Lane / Entry / 追加式树） | `04-session-storage.html` |
| 05 | ★ 上下文构建 | `05-context.html` |
| 06 | 压缩 compaction | `06-compaction.html` |
| 07 | ★ Harness 运行时骨架 | `07-harness.html` |
| 08 | ★ 生产 Harness（agent-session） | `08-agent-session.html` |
| 09 | 工具层 | `09-tools.html` |
| 10 | AI 层（pi-ai 多供应商抽象） | `10-ai-layer.html` |
| 11 | 编码 Agent（组装成产品） | `11-coding-agent.html` |
| 12 | 自制 Runtime 施工图 | `12-build-own-runtime.html` |
| 13 | 安全边界·本地模型·程序化集成（信任/沙箱 · llama.cpp Provider · SDK/RPC/事件流） | `13-security-local-integration.html` |
| 14 | Pi vs LangGraph 逐项对比（设计哲学/核心能力/适用场景/开发体验/灵活性/生产就绪） | `14-comparison-langgraph.html` |

## 阅读建议

1. 想快速建立全貌 → 首页 + 第 1 章。
2. 想理解「Agent 到底怎么跑」→ 第 2、3 章。
3. 你的核心诉求（context + harness）→ 第 4、5、6 章，再第 7、8 章。
4. 想动手自己写 → 第 9、10、11 章积累招式，最后第 12 章按五阶段施工。

## 打开方式

```bash
cd pi-agent/books
open index.html        # macOS
# 或任何静态文件服务器
python3 -m http.server
```

## 源码路径速查

各章引用的 Pi 关键源码位置：

- 消息/循环：`packages/agent/src/`（`types.ts`、`agent.ts`、`agent-loop.ts`；v1.0.0 后 pi-agent-core 只剩 Agent + 循环 + proxy + 类型）
- ~~旧 experimental harness~~：`packages/agent/src/harness/`（契约 `agent-harness.ts`、runtime/、session/、compaction/）——**v1.0.0 整体删除**，各章保留其机制讲解并标注「已删」
- durable 后继：`packages/durable/`（`@earendil-works/pi-durable`，`src/harness/` 的 Harness.open / scheduler / registry，规格在 `docs/spec.md`；SQLite 后端在 `storage/sqlite/node`，底层驱动已下沉到 `packages/chord/src/sqlite/`）
- 生产 harness：`packages/coding-agent/src/core/agent-session.ts`、`agent-session-runtime.ts`（durable 的消费方是 experimental 的 `packages/env/`；v1.2.0 已删除原消费方 `packages/coding-agent/src/experimental/session-worker.ts`）
- 工具：`packages/coding-agent/src/core/tools/`；暴露面（exposure/prepareLoadout）在 `core/extensions/types.ts`
- 能力外置：`packages/codemode/`（QuickJS 沙箱）、`packages/mcp/`（MCP 客户端）；内置扩展注册在 `packages/coding-agent/src/extensions/index.ts`（`builtin:<name>`）
- AI 层：`packages/ai/src/`（`types.ts`、`api/*.ts`）

## 备注

- 内容基于当前仓库源码整理。代码引用不标行号，随版本演化可能略有出入，以源码为准。
- 当前审核版本：`v1.3.0-42-g73f8de80b`（2026-10-20 再核实：自 v1.3.0-16-g8efd314fa 起 26 commits；ch07 §7.8 增补 durable 三条线——sleeping 任务/sleepUntil+now/setTimer/onWake 时钟链路、崩溃循环守卫 restartLimit+parked、onReport 带类型化 ReportInfo 九种 + afterFailedRun/checkpointWhen 必填；ch01 包表补 chord//sqlite 与 telemetry-sqlite 下沉、pi-telemetry 能力扩容（propagation/links/metrics/TelemetryStore/renderTrace）；ch10 §10.3.1 补 Copilot 裸 HTTP 413 溢出收编、§10.3/10.4 补 AI_TELEMETRY_SCHEMA 遥测观察器与 telemetryContext→telemetry 改名；ch09 powershell 工具补三级查找 + existsSync→accessSync（nodejs/node#36790）；ch11 11.4 程序状态条补终端能力探测（Rex OSC 8/真彩、图片关、内层先判）；全部既有摘录与 pin 逐一对源复核零漂移）。
- 配色沿用 Pi 的 teal / indigo 品牌色调（`assets/pi-learn.css`），结构上借鉴了此前自建的 vLLM 学习站模板。
