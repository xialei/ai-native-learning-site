# Codex CLI 学习站

基于 [`github.com/openai/codex`](https://github.com/openai/codex) 源码整理的一套**静态 Web 站点**，用于深入浅出地学习这个 Rust 编写的 Agent 运行时（Codex CLI）。

面向目标：**理解一个真实生产级编码 Agent 的内部构造，并最终为自研 Agent Runtime 积累蓝图**。因此每一章都强调「源码 + 逐行解释 + 机制」，并在最后一章给出从零自制的演进路线。

## 亮点

- **全部静态 HTML + 单一共享 CSS**，无需构建、无运行时依赖，浏览器直接打开 `index.html` 即可。
- 所有架构图 / 流程图均使用**内联 SVG**。
- **重点章节**：Turn 循环（第 3 章）、上下文构建（第 5 章）与工具系统（第 7 章），这正是 Codex 里信息密度最高、对「自己做 Runtime」最关键的部分。
- 每章都带**真实源码片段 + 逐行解释 + 结论式 callout**，深入浅出，绝不只是大纲。所有代码路径与标识符均标注真实位置（如 `codex-rs/core/src/session/turn.rs`）。

## 章节

| # | 主题 | 文件 |
|---|------|------|
| 首页 | 总览与心智地图 | `index.html` |
| 01 | 整体架构（Cargo workspace / 分层） | `01-architecture.html` |
| 02 | 消息与协议模型（ResponseItem / Op / EventMsg） | `02-protocol-model.html` |
| 03 | ★ Turn 循环（Agent Loop） | `03-turn-loop.html` |
| 04 | 会话与 Rollout（持久化与回放） | `04-session-rollout.html` |
| 05 | ★ 上下文构建（Context 工程） | `05-context.html` |
| 06 | 上下文压缩 Compaction | `06-compaction.html` |
| 07 | ★ 工具系统（ToolSpec / ToolExecutor） | `07-tools.html` |
| 08 | 审批与沙箱（Approval / Sandbox） | `08-approvals-sandbox.html` |
| 09 | 配置系统（config.toml / 权限档案） | `09-config.html` |
| 10 | MCP 与扩展（MCP / Plugins / Skills） | `10-mcp-extensions.html` |
| 11 | 多 Agent 与协作 | `11-multi-agent.html` |
| 12 | TUI 与 CLI（前端形态） | `12-tui-cli.html` |
| 13 | 自制 Agent Runtime 路线图 | `13-build-own-runtime.html` |

## 阅读建议

1. 想快速建立全貌 → 首页 + 第 1 章。
2. 想理解「Agent 到底怎么跑」→ 第 2、3 章。
3. 你的核心诉求（turn 循环 + context + tools）→ 第 3、5、7 章。
4. 想动手自己写 → 第 4、6、8 章积累招式，最后第 13 章按阶段施工。

## 打开方式

```bash
cd docs/learning-site
open index.html        # macOS
# 或任何静态文件服务器
python3 -m http.server
```

## 源码路径速查

各章引用的 Codex 关键源码位置（仓库根目录为基准）：

- 协议/类型：`codex-rs/protocol/src/`（`protocol.rs`、`models.rs`、`approvals.rs`、`config_types.rs`）
- Agent 内核：`codex-rs/core/src/`（`codex_thread.rs`、`client.rs`、`compact.rs`）
  - 会话/轮次：`codex-rs/core/src/session/`（`session.rs`、`turn.rs`、`turn_input.rs`、`input_queue.rs`）
  - 上下文：`codex-rs/core/src/context/`、`codex-rs/core/src/context_manager/`
  - 工具：`codex-rs/core/src/tools/`、`codex-rs/tools/src/`（`tool_executor.rs`、`tool_spec.rs`）
  - 配置：`codex-rs/core/src/config/`
  - 沙箱/执行策略：`codex-rs/sandboxing/`、`codex-rs/execpolicy/`、`codex-rs/core/src/exec_policy/`
- 前端：`codex-rs/tui/`、`codex-rs/cli/`、`codex-rs/app-server*/`
- 持久化：`codex-rs/rollout/`、`codex-rs/history/`

## 备注

- 内容基于当前仓库源码整理（章节内标注了具体文件与行号附近的要点，随版本演化可能略有出入，以源码为准）。
- 配色采用 Codex 的墨绿/青色品牌色调（`assets/codex-learn.css`），结构借鉴了自建的 Pi Agent Harness 学习站模板。
