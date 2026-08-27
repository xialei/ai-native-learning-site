# Claude Code 深入浅出

基于 [`anthropics/claude-code`](https://github.com/anthropics/claude-code) 仓库与官方文档整理的一套**静态 Web 站点**，用于系统学习 Claude Code 这个 agentic 编码工具的设计与工程实践。

面向目标：**真正理解 Claude Code 为什么这么设计、如何用对、如何扩展**。因此每一章都强调「机制 + 代码 + 图示 + 结论」，并在最后给出实战工作流与速查表。

## 亮点

- **全部静态 HTML + 单一共享 CSS**，无需构建、无运行时依赖，浏览器直接打开 `index.html` 即可。
- 所有架构图 / 流程图均使用**内联 SVG**。
- **重点章节**：Agentic 循环（第 3 章）、上下文（第 4 章）与 Hooks（第 8 章），这是「让模型能动手且动手得安全」的真正灵魂。
- **基于真实仓库实例**：Hooks（`examples/hooks/`）、Settings（`examples/settings/` 三套范例）、MDM（`examples/mdm/`）、网关（`examples/gateway/`）、官方插件（`plugins/` 十几个）、slash 命令（`.claude/commands/`）——引用处都标注了真实文件路径。
- 每章都带代码片段 + 逐行解释（`.annotation`）+ 结论式 callout，深入浅出，绝不只是大纲。

## 章节

| # | 主题 | 文件 |
|---|------|------|
| 首页 | 总览与心智地图 | `index.html` |
| 01 | Claude Code 是什么 | `01-what-is.html` |
| 02 | 整体架构（内核 / 接入 / 扩展三层） | `02-architecture.html` |
| 03 | ★ Agentic 循环 | `03-agentic-loop.html` |
| 04 | ★ 上下文构建 | `04-context.html` |
| 05 | 内置工具 | `05-tools.html` |
| 06 | 权限模型 | `06-permissions.html` |
| 07 | 子代理与并行 | `07-subagents.html` |
| 08 | ★ Hooks 生命周期 | `08-hooks.html` |
| 09 | 配置体系 | `09-settings.html` |
| 10 | 插件与 Skills | `10-plugins.html` |
| 11 | SDK 与程序化集成 | `11-sdks.html` |
| 12 | MCP 外接工具 | `12-mcp.html` |
| 13 | 实战工作流 | `13-workflows.html` |
| 14 | 术语表与速查 | `14-glossary.html` |

## 阅读建议

1. 想快速建立全貌 → 首页 + 第 1、2 章。
2. 想理解「Agent 到底怎么跑」→ 第 3 章（循环），再第 4 章（上下文）。
3. 你的核心诉求（安全与扩展）→ 第 6 章（权限）+ 第 8 章（Hooks），再第 10 章（插件）。
4. 想动手做自动化 → 第 11 章（SDK）+ 第 12 章（MCP），最后第 13 章看招式。

## 打开方式

```bash
cd claude-code/books
open index.html        # macOS
# 或任何静态文件服务器
python3 -m http.server
```

## 三条主线（全站纲领）

1. **循环决定它怎么干**（第 3 章）—— 模型 ⇄ 工具交替推进，工具结果回灌驱动下一轮。
2. **上下文决定它看到什么**（第 4 章）—— 系统提示 + CLAUDE.md + 压缩 + 按需载入。
3. **权限与 Hooks 决定它在哪条线上干**（第 6、8 章）—— 每个工具调用都是可拦截、可审计的决策点。

## 仓库可对照的真实材料

| 路径 | 对应章节 |
|------|----------|
| `plugins/`（十几个官方插件） | 第 7、10、13 章 |
| `examples/hooks/bash_command_validator_example.py` | 第 8 章 |
| `examples/settings/{lax,strict,bash-sandbox}.json` | 第 6、9 章 |
| `examples/mdm/`（macOS/Windows 部署模板） | 第 6、9 章 |
| `examples/gateway/{gcp,aws}/` | 第 11 章 |
| `.claude/commands/commit-push-pr.md` | 第 10、14 章 |

## 备注

- CLI 内核源码未随仓库开放，涉及循环 / 上下文压缩等内部机制的章节以**官方公开文档 + 仓库实例的行为**为准。
- 引用的代码片段大多来自上述仓库实例（Hooks、插件、配置），这些是**可运行、可对照**的部分，最适合边读边试。
- 配色采用 Claude 的橘棕系（`assets/cc-learn.css`），结构上借鉴了 Pi Agent Harness / vLLM 学习站的卡片式模板。
