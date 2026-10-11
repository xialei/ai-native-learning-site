# deepseek-harness/books:v0.1.7 重锚 + 问题驱动结构改写

## 现状
- 书籍现锚定 `dsh-v0.1.6-alpha.2 (ddefc45fbc)`;源码 HEAD `00102833df (dsh-v0.1.7-alpha.2)`,1461 个非合并 commits,32 个 pinned 文件中 21 个变化,44 个 pin 中 34 个漂移,其中 6 处摘录内容已删除需重写。
- 结构目标:对齐 vllm/langgraph 书籍已验证的问题驱动模板(副标题问题式、开头摆问题①–N+答案地图、中段标题加前缀、收尾答案回收)。

## A. 事实修复 + 重锚(逐章)
- **ch02** types.ts:88→:89 SESSION_FORMAT_VERSION 3→4;SurfaceEventType「四类」→五类(+developer/message);tool-addition/tool-removal 内容块;TurnEndReasonMap 增 forked;EpochHeader 退役 system 键(@persistenceReserved);V3→V4 迁移包增补
- **ch03** agent.ts 4 pin:266/295/380/581;agent/index.ts 534→537;agent/types.ts 87→96;新增 abortedCancelCause(:68-91)
- **ch04** agent.ts 129→154、251(preStep);abortedCancelCause 在 turn catch/wakeDriver 的用法
- **ch05** generated.ts 摘录重写(currentVersion: 3→4,codec/migration 数,restoreCurrent 三函数);repair.ts openTurnClosers(:63)+OpenTurnCloseCause+forked 措辞增补
- **ch06** tools/index.ts 241→258 + 新增 projectContent vs finalizeContent 区分;PreToolDecision 589→606、ToolPresentationMode 653→670、ToolGuard 713→730;MessageSourceMap 增 'tool-registry'
- **ch07** §7.5 协议选择器/common/ 整节重写 → Messages-only 直连 transport;adapter.ts:134 providerError;transport.ts(44 行)分类摘录;httpErrorCode 删除;RequestMessage/RequestUserInput;deferLoading
- **ch08** system-prompt 4 pin:179/279/427/574;runtime-context SOURCE '@deepseek-ai/dsh-system-prompt'→'runtime-context' 摘录重写;user-approval inject 155→162;restrict 1077→1096
- **ch09** user-approval 208→215、260→267;9.4 Windows partial-enforcement 注释引文换成新措辞(Everyone 双表保留 + Low label + NTFS 硬链接)
- **ch10** fs 49→50 + watch 默认实现;jobs types.ts→view.ts:19(JobStatus 拆分,client-safe leaf);SessionActivityKindMap 增 job/turn
- **ch11** compaction 99→106、112→119;checkpoint.ts:19 marker `{kind:'plugin',plugin:'compact'}`→`{kind:'compact-checkpoint'}`;headroomTokens(默认 65,536)+reservedCompletionTokens 压力预算公式;8192 maxTokens 旧注释清除;「嵌套 tool-result 一并数」→contentHasImage 不再递归
- **ch12** subagent Config :192 Volatile 化摘录重写(z .volatile() + .get());module comment :1 重写(Direct-child discovery);startContinuable 262→261;installSubagentArchiveAdmission
- **ch13** webserver 165→166;docs/subsystems 60→62;cordis.patch.yml 增补 config-editor/settings/authorization/deepseek-account-platform 行;spill maxInlineBytes 50000→maxInlineTokens 12500
- **ch01** cordis.patch.yml :16 行未变,仅版本戳;hmr/plugin-manager 叙述核对

## B. 版本重锚
- 13 章页脚 + index.html 徽章(~:41)+ README.md(:5 与章表)→ `dsh-v0.1.7-alpha.2 (HEAD 00102833df)`

## C. 问题驱动结构改写(13 章,模板同 vllm/langgraph)
- 副标题:陈述式 → 问题式
- X.1「一分钟版本」→「X.1 问题:…」:开头摆出本章 ①–N 个问题 + 答案地图(指向小节)
- 中段小节标题加 ①–N 前缀,正文首句承接对应问题
- 末节「要点」→「收尾:…」:逐条回收 ①–N 答案
- callout 中重复引导句裁剪;遵循 plain-chinese 风格(禁套话/比喻)
- 章号/图号/代码/pin 不动;ch07 目前无图,补 1 幅(直连 transport 结构 SVG,编号 7.1)
- 措辞基准:写演化痕迹、保留困惑点、场景贯穿、总结句宁缺毋滥

## D. 验证
1. python re 标签配对(div/p/section/code/pre 注意 `<p` vs `<pre`)
2. href/anchor 断链扫描
3. code-title → pre.code 邻接检查
4. 全部新 pin `sed -n` 回源核对
5. 版本戳一致性(13 footer + index + README 全部为 v0.1.7-alpha.2/00102833df)
6. AI 套话 grep 扫描(值得注意/本质上/总而言之 等)
7. 完成后更新 memory 的 deepseek-harness-books-version-tracking

## 执行顺序
ch02(事实量最大,定模板)→ ch01 → ch03–ch13 → index/README → 验证 → memory
