# 深入浅出 DeepSeek Harness（dsh）

一套**纯静态、自包含**的 HTML 学习站点，用于系统学习 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）的 agent 运行时实现，并为**自制 Harness** 提供路线图。无需任何构建工具，双击 `index.html` 即可浏览。

> 参考源码：`/Users/lei.xia/workspace/github/deepseek-harness`，版本锚点 **dsh-v0.1.3-alpha.1**（HEAD `d347e70390`）。每个页面标注的 `packages/...` 路径均为该仓库的真实文件。

## 如何浏览

```bash
open ai-native-learning-site/deepseek-harness/books/index.html
# 或：在浏览器中打开该文件
```

## 内容结构

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 总览 |
| `01-architecture.html` | 整体架构 | 一切皆插件（cordis）、能力缝、profile 组合、目录地图 |
| `02-session-log.html` | 会话日志 | append-only 事件流是唯一事实、事件信封、seq/替换语义 |
| `03-agent-lifecycle.html` | 生命周期 | inbox → 用户消息 → turn 边界 → turn/end 全链路 |
| `04-agent-loop.html` | Agent 循环 | ReactLoopAgent 并发模型、step 边界、中止与恢复 |
| `05-persistence.html` | 持久化 | 存储后端、崩溃恢复、冷恢复 |
| `06-tools.html` | 工具系统 | defineTool、五段管线、调度器（并行组/独占栅栏）、中止合成、PTC |
| `07-llm.html` | LLM 层 | StreamChunk 协议、LlmFailure 稳定错误码、重试策略、DeepSeek 适配器 |
| `08-scope-prompt.html` | Prompt/Scope | system prompt 四类输入、SECTION_ORDERS 版面、persona 遮蔽、Scope 双向语义、tools.restrict |
| `09-security.html` | 安全 | 沙箱模式与后端链（bwrap/Landlock/Seatbelt/ACL）、审批决策流、权限升级 |
| `10-seams.html` | 能力缝 | shell/fs/web/skill/jobs 五条缝的注册表语义与失败契约 |
| `11-compaction.html` | Compaction | 压缩事件编舞、影子定价、溢出恢复、检查点来源 |
| `12-orchestration.html` | 编排 | 委派缝多 provider、continuable 子 agent、工作流 worker thread、ralph |
| `13-roadmap.html` | 自制 Harness | profile bundle / SDK（JSON-RPC stdio）/ Web host 三张面孔、能力缝配方、八里程碑路线图 |

共享样式：`assets/dsh-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- **基于 dsh v0.1.3-alpha.1（插件架构，cordis 内核）** 编写。
- 站点内代码片段均摘自真实源码并标注文件路径与行号；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 13 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`；页脚保留版本戳。
- 新增概念图：直接在页面内写内联 `<svg>`，复用 `<marker id="arrow">`（描边色 `#4156c8`）。
- 代码片段：务必从真实源码摘录并标注路径（可行时带行号），不要凭记忆杜撰函数签名。
- 重新核实版本锚点：在 deepseek-harness 仓库跑 `git describe --tags` + `git rev-parse --short=10 HEAD`，逐章更新页脚戳与 `index.html` 徽标。
- 如需在 `index.html` 的 `pathgrid` 增删卡片，同步调整对应页面即可。
