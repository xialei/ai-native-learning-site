# ai-native-learning-site

> 读源码不如读一本"把源码讲透的书"。本项目把 AI Native 生态里几个关键开源项目,逐行拆解成"成书 HTML + 逐章讲解 + 内联架构图"的静态学习站点,浏览器打开即读,无需构建、无需联网依赖。

面向想**真正搞懂 Agent Runtime、上下文工程(Context Engineering)、LLM 推理引擎如何实现**的工程师与架构师——不是看 API 文档,而是看清"代码为什么这么写、复杂度放在哪里、为谁优化"。

## 这是什么

一套围绕 AI Native 技术的中文源码精读站点。每个子项目对应一个开源仓库,以"成书"形式(每章一个 HTML,配架构图与逐行解释)深入拆解其源码实现与设计取舍。目前包含:

- **AI Native Context Engine** —— 企业级 Context Engine 设计稿(自研),覆盖对象模型、知识构建、混合检索、图扩展、上下文排序与压缩、运行时、缓存、可观测性、多 Agent 协作(16 章)。
- **Pi Agent Harness** —— 拆解 TypeScript Agent 运行时 [pi](https://github.com/earendil-works/pi):Agent 循环、会话存储、上下文投影、压缩 Compaction、Harness 骨架、工具层、AI 多供应商抽象、安全边界与本地集成,并对照 LangGraph(15 章)。
- **LangGraph / vLLM** —— 规划中的拆解,源码已就位。

## 适合谁读

- 在做 **AI Agent / LLM 应用**,想从"调 API"进阶到"理解 Runtime 内部机制"的工程师;
- 关注 **Context Engineering / RAG / 上下文窗口管理**,想知道工业级 Context Engine 如何设计的架构师;
- 想自己动手做 Agent Runtime、推理引擎,需要一份"代码级"参考的开发者;
- 中文技术读者——本站为中文写作,术语配英文原名。

## 子项目与源码位置

源码仓库与本站点平级,位于上一层目录:

| 学习子项目 | 对应源码仓库 | 源码位置 |
|---|---|---|
| [`ai-native-context-engine/`](ai-native-context-engine/) | 企业 Context Engine 设计稿(自研,非开源项目) | — |
| [`pi-agent/`](pi-agent/) | [earendil-works/pi](https://github.com/earendil-works/pi) | [`../pi`](../pi) |
| [`langgraph/`](langgraph/) | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | [`../langgraph`](../langgraph) |
| [`vllm-engine/`](vllm-engine/) | [vllm-project/vllm](https://github.com/vllm-project/vllm) | [`../vllm`](../vllm) |

## 阅读方式

各子项目均为纯静态 HTML,浏览器直接打开对应目录下的 `index.html` 即可阅读,无需构建。

## 写作与审计规范

为保证每一章都能让读者真正"读懂"而非"读毕",所有核心章节在定稿前需过一遍审计。规范涵盖五个维度:章节内容审计(以终为始四步闭环)、SVG 图检查清单、移动端适配约束、术语一致性、交叉引用完整性。

👉 详见 [`AUDIT.md`](AUDIT.md)

## License

本站学习内容为作者整理撰写;所拆解的开源项目源码版权归原作者所有,详见各子项目对应的上游仓库。

---

<details>
<summary>🔍 关键词 / Topics(便于搜索)</summary>

本站涉及主题,便于在 GitHub / 搜索引擎中被检索到:

`ai-native` `llm` `agent` `ai-agent` `agent-runtime` `agent-harness` `context-engine` `context-engineering` `rag` `retrieval-augmented-generation` `knowledge-graph` `context-window` `compaction` `multi-agent` `tool-use` `function-calling` `observability` `llm-inference` `vllm` `langgraph` `langchain` `typescript-agent` `source-code-reading` `learn-to-code` `中文技术文档` `源码精读`

> 建议在 GitHub 仓库 About 处添加 topics:`ai-agent`、`llm`、`context-engineering`、`agent-runtime`、`rag`、`vllm`、`langgraph`、`source-code-reading`。

</details>
