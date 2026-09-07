/* ============================================================
   scenes.js — 第一档动态演示场景定义
   依赖：先加载 anim.js(LGAnim.register)，再加载本文件。
   每个 SCENE = { svg, states }
   - svg： 静态画布模板(初始所有元素带静态 class)
   - states： 数组，每元素=一步的补丁列表
     补丁 {sel, cls|add|rm, txt?, attr?, state?, note?}
     state/note 只取该步最后一条，渲染到底部 state 框/说明栏。
   累积语义：render(s) 会依次应用 states[0..s],init() 先复位。
   ============================================================ */

(function () {
  "use strict";
  const R = window.LGAnim.register;

  /* ----------------------------------------------------------
     1) send-fanout — 4.5 Send 并行 fan-out
     核心：一个节点吐出 3 个 Send → 同 super-step 并发 → reducer 归并
     ---------------------------------------------------------- */
  R("send-fanout", {
    svg:
      '<svg class="svg-box" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ta da">' +
      '<title id="ta">Send 并行 fan-out(动态)</title><desc id="da">START 发 3 个 Send,worker 并发执行，reducer 汇总</desc>' +
      '<defs><marker id="arf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      '<rect class="node" id="f-start" x="20" y="90" width="110" height="50" rx="8"></rect>' +
      '<text class="lbl" x="75" y="120" text-anchor="middle">START</text>' +
      '<rect class="node core" id="f-w1" x="270" y="20" width="130" height="46" rx="8"></rect>' +
      '<text class="lbl sm" id="f-w1t" x="335" y="47" text-anchor="middle">worker #1</text>' +
      '<rect class="node core" id="f-w2" x="270" y="92" width="130" height="46" rx="8"></rect>' +
      '<text class="lbl sm" id="f-w2t" x="335" y="119" text-anchor="middle">worker #2</text>' +
      '<rect class="node core" id="f-w3" x="270" y="164" width="130" height="46" rx="8"></rect>' +
      '<text class="lbl sm" id="f-w3t" x="335" y="191" text-anchor="middle">worker #3</text>' +
      '<rect class="node" id="f-end" x="500" y="90" width="110" height="50" rx="8"></rect>' +
      '<text class="lbl" x="555" y="120" text-anchor="middle">END</text>' +
      '<line class="edge" id="f-e1" x1="130" y1="100" x2="268" y2="43" marker-end="url(#arf)"></line>' +
      '<line class="edge" id="f-e2" x1="130" y1="115" x2="268" y2="115" marker-end="url(#arf)"></line>' +
      '<line class="edge" id="f-e3" x1="130" y1="130" x2="268" y2="187" marker-end="url(#arf)"></line>' +
      '<line class="edge" id="f-e4" x1="400" y1="43" x2="498" y2="100" marker-end="url(#arf)"></line>' +
      '<line class="edge" id="f-e5" x1="400" y1="115" x2="498" y2="115" marker-end="url(#arf)"></line>' +
      '<line class="edge" id="f-e6" x1="400" y1="187" x2="498" y2="130" marker-end="url(#arf)"></line>' +
      '<text class="lbl sm code" x="150" y="60">Send ×3</text>' +
      '<text class="lbl sm code" x="420" y="80">reducer: add</text>' +
      '</svg>',
    states: [
      [ // step0： 初始，只有 START 待命
        { sel: "#f-start", add: "act" },
        { state: 'state = { docs: ["文档一","文档二","文档三"], summaries: [] }',
          note: "START：准备处理 3 篇文档。fan_out() 将对每个文档生成一个 Send。" }
      ],
      [ // step1: fan_out 返回 3 个 Send，边激活
        { sel: "#f-start", rm: "act", add: "done" },
        { sel: "#f-e1, #f-e2, #f-e3", add: "act" },
        { state: 'fan_out() -> [Send("summarize_one", {doc:"文档一"}),\n                   Send("summarize_one", {doc:"文档二"}),\n                   Send("summarize_one", {doc:"文档三"})]',
          note: "同一 super-step 内，3 个 Send 同时投递给 summarize_one——这就是「并行」。" }
      ],
      [ // step2: 3 个 worker 并发执行(同时点亮)
        { sel: "#f-w1, #f-w2, #f-w3", add: "act" },
        { state: '# worker #1  return {"summaries": ["摘要：文档一..."]}\n# worker #2  return {"summaries": ["摘要：文档二..."]}   ← 同一时刻\n# worker #3  return {"summaries": ["摘要：文档三..."]}',
          note: "关键：三个 worker 在同一 step 并发执行，互不等待。这是 Send 区别于「串行条件边」的本质。" }
      ],
      [ // step3： 汇聚边激活，worker 完成
        { sel: "#f-w1, #f-w2, #f-w3", rm: "act", add: "done" },
        { sel: "#f-e4, #f-e5, #f-e6", add: "act-acc" },
        { state: 'reducer = operator.add\n["摘要：文档一..."] + ["摘要：文档二..."] + ["摘要：文档三..."]',
          note: "step 结束时，3 份返回值一起走 operator.add 累加，然后才进入下一 step。" }
      ],
      [ // step4: END，结果就绪
        { sel: "#f-e4, #f-e5, #f-e6", rm: "act-acc" },
        { sel: "#f-end", add: "act" },
        { state: 'state = { summaries: ["摘要：文档一...",\n              "摘要：文档二...",\n              "摘要：文档三..."] }',
          note: "END:summaries 已归并。注意 3 篇文档的总耗时 ≈ 单篇(并发)，而非 3 倍。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     2) hitl-interrupt — 6.7 interrupt 暂停-恢复
     核心：跑到一半 → 冻结存 checkpoint → 等人输入 → resume → 继续
     ---------------------------------------------------------- */
  R("hitl-interrupt", {
    svg:
      '<svg class="svg-box" viewBox="0 0 680 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tb db">' +
      '<title id="tb">interrupt 暂停-恢复(动态)</title><desc id="db">执行到 interrupt 冻结，等待 resume 后继续</desc>' +
      '<defs><marker id="arb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      '<rect class="node" id="h-start" x="10" y="35" width="90" height="50" rx="8"></rect>' +
      '<text class="lbl sm" x="55" y="64" text-anchor="middle">START</text>' +
      '<rect class="node core" id="h-gather" x="130" y="35" width="100" height="50" rx="8"></rect>' +
      '<text class="lbl sm" id="h-gt" x="180" y="64" text-anchor="middle">gather</text>' +
      '<rect class="node acc" id="h-wait" x="270" y="30" width="120" height="60" rx="8"></rect>' +
      '<text class="lbl sm" id="h-wt1" x="330" y="55" text-anchor="middle">interrupt()</text>' +
      '<text class="lbl sm" id="h-wt2" x="330" y="72" text-anchor="middle">⏸ 等待人工</text>' +
      '<rect class="node core" id="h-execute" x="430" y="35" width="100" height="50" rx="8"></rect>' +
      '<text class="lbl sm" id="h-et" x="480" y="64" text-anchor="middle">execute</text>' +
      '<rect class="node" id="h-end" x="570" y="35" width="90" height="50" rx="8"></rect>' +
      '<text class="lbl sm" x="615" y="64" text-anchor="middle">END</text>' +
      '<line class="edge" id="h-e1" x1="100" y1="60" x2="128" y2="60" marker-end="url(#arb)"></line>' +
      '<line class="edge" id="h-e2" x1="230" y1="60" x2="268" y2="60" marker-end="url(#arb)"></line>' +
      '<line class="edge" id="h-e3" x1="390" y1="60" x2="428" y2="60" marker-end="url(#arb)" stroke-dasharray="4 3"></line>' +
      '<line class="edge" id="h-e4" x1="530" y1="60" x2="568" y2="60" marker-end="url(#arb)"></line>' +
      '</svg>',
    states: [
      [
        { sel: "#h-start", add: "act" },
        { state: 'thread_id = "order-1"\nstate = { task: "删除用户数据" }',
          note: "执行开始。thread_id 是后续能恢复的物理基础。" }
      ],
      [
        { sel: "#h-start", rm: "act", add: "done" },
        { sel: "#h-e1", add: "act" },
        { sel: "#h-gather", add: "act" },
        { state: 'state = { task: "删除用户数据", user: "u-42" }',
          note: "gather 节点收集到要操作的 user=u-42。" }
      ],
      [
        { sel: "#h-gather", rm: "act", add: "done" },
        { sel: "#h-e2", add: "act-acc" },
        { sel: "#h-wait", add: "act-acc" },
        { state: '>>> interrupt({"user": "u-42", "task": "删除"})\n[图执行在此处暂停]\n>>> checkpoint 已写入，thread_id=order-1',
          note: "interrupt() 被调用：当前状态存入 checkpoint，执行冻结，控制权交回调用方。进程可以退出。" }
      ],
      [
        { sel: "#h-wait", rm: "act-acc", add: "frozen" },
        { state: '⏸ 图处于暂停态。可随时：\n  get_state(config)        # 查看暂停点\n  update_state(config, ...) # 必要时改状态\n  invoke(Command(resume=...)) # 恢复',
          note: "暂停期间状态持久化在 Checkpointer 里。人审核后用 Command(resume=) 传回决策。" }
      ],
      [
        { sel: "#h-wait", rm: "frozen", add: "done" },
        { sel: "#h-wt1", txt: "resume=yes" },
        { sel: "#h-wt2", txt: "已确认" },
        { sel: "#h-e3", add: "act" },
        { state: 'graph.invoke(Command(resume="yes"), config)\n>>> 从 checkpoint 加载状态，注入 resume="yes"',
          note: 'Command(resume=...) 触发恢复：interrupt() 这次返回 "yes"，执行从断点继续。' }
      ],
      [
        { sel: "#h-e3", rm: "act" },
        { sel: "#h-execute", add: "act" },
        { state: 'state = { task:"删除", user:"u-42", approved: "yes" }\n>>> 执行删除操作...',
          note: "execute 节点拿到 resume 值，继续后续流程。" }
      ],
      [
        { sel: "#h-execute", rm: "act", add: "done" },
        { sel: "#h-e4", add: "act" },
        { sel: "#h-end", add: "act" },
        { state: 'state = { ..., result: "已删除" }',
          note: "END：从暂停到恢复的完整闭环。没有 Checkpointer,interrupt 后进程就没了，resume 无从谈起。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     3) react-loop — 5.1 ReAct 循环
     核心：agent 出 tool_call → tools 执行 → 回 agent → 无 call → END
     ---------------------------------------------------------- */
  R("react-loop", {
    svg:
      '<svg class="svg-box" viewBox="0 0 560 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tc dc">' +
      '<title id="tc">ReAct 循环(动态)</title><desc id="dc">agent 与 tools 之间循环，直到无 tool_call</desc>' +
      '<defs><marker id="arc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      '<ellipse class="node" id="r-start" cx="60" cy="110" rx="42" ry="26"></ellipse>' +
      '<text class="lbl sm" x="60" y="115" text-anchor="middle">START</text>' +
      '<rect class="node core" id="r-agent" x="160" y="75" width="130" height="70" rx="10"></rect>' +
      '<text class="lbl" x="225" y="105" text-anchor="middle" font-weight="bold">agent</text>' +
      '<text class="lbl sm" id="r-at" x="225" y="125" text-anchor="middle">调用 LLM</text>' +
      '<rect class="node acc" id="r-tools" x="360" y="75" width="130" height="70" rx="10"></rect>' +
      '<text class="lbl" x="425" y="105" text-anchor="middle" font-weight="bold">tools</text>' +
      '<text class="lbl sm" id="r-tt" x="425" y="125" text-anchor="middle">ToolNode</text>' +
      '<line class="edge" id="r-e0" x1="102" y1="110" x2="158" y2="110" marker-end="url(#arc)"></line>' +
      '<path class="edge" id="r-e1" d="M290 95 Q 325 75 360 95" fill="none" marker-end="url(#arc)"></path>' +
      '<path class="edge" id="r-e2" d="M360 125 Q 325 145 290 125" fill="none" marker-end="url(#arc)"></path>' +
      '<text class="lbl sm code" id="r-l1" x="325" y="70" text-anchor="middle">tool_calls</text>' +
      '<text class="lbl sm code" id="r-l2" x="325" y="160" text-anchor="middle">结果回写</text>' +
      '<ellipse class="node" id="r-end" cx="490" cy="200" rx="42" ry="20"></ellipse>' +
      '<text class="lbl sm" x="490" y="205" text-anchor="middle">END</text>' +
      '<path class="edge" id="r-ee" d="M290 145 Q 360 200 448 200" fill="none" marker-end="url(#arc)"></path>' +
      '<text class="lbl sm code" id="r-le" x="340" y="190" text-anchor="middle">无 tool_call</text>' +
      '</svg>',
    states: [
      [
        { sel: "#r-start", add: "act" },
        { state: 'messages = [ {"role":"user","content":"北京天气？然后算 20×8"} ]',
          note: "用户一个多步问题进来。ReAct 循环开始。" }
      ],
      [
        { sel: "#r-start", rm: "act", add: "done" },
        { sel: "#r-e0", add: "act" },
        { sel: "#r-agent", add: "act" },
        { state: 'agent.invoke(messages)\n>>> LLM 决定先查天气',
          note: "agent 节点把消息喂给 LLM。LLM 此刻不直接答，而是要求调用工具——这是 ReAct 的「Act」。" }
      ],
      [
        { sel: "#r-at", txt: "→ tool_calls" },
        { sel: "#r-e1", add: "act" },
        { sel: "#r-l1", add: "act" },
        { sel: "#r-tools", add: "act" },
        { sel: "#r-tt", txt: "get_weather(北京)" },
        { state: 'tool_calls = [{name:"get_weather", args:{city:"北京"}}]\n>>> ToolNode 执行工具',
          note: "agent 输出 tool_call。tools_condition 判定为「有调用」→ 路由到 tools 节点执行。" }
      ],
      [
        { sel: "#r-tools", rm: "act", add: "done" },
        { sel: "#r-e2", add: "act-acc" },
        { sel: "#r-l2", add: "act" },
        { sel: "#r-agent", rm: "done", add: "act" },
        { sel: "#r-at", txt: "调用 LLM" },
        { state: 'messages += [ {tool_result: "北京 晴 22°C"} ]\n>>> 工具结果追加回 messages，再次进 agent',
          note: "工具结果写回 messages(reducer 追加)，回到 agent。注意：agent 现在看到的是「用户问题 + 天气结果」。" }
      ],
      [
        { sel: "#r-at", txt: "→ tool_calls" },
        { sel: "#r-tools", rm: "done", add: "act" },
        { sel: "#r-tt", txt: "calc(20*8)" },
        { sel: "#r-e1", rm: "act" },
        { sel: "#r-e2", rm: "act-acc" },
        { sel: "#r-l1", rm: "act" },
        { sel: "#r-l2", rm: "act" },
        { state: '>>> LLM 决定还要算数\ntool_calls = [{name:"calc", args:{expr:"20*8"}}]',
          note: "第二圈循环：LLM 看到天气已有，但用户还问了算术，于是再发一个 tool_call。循环就是这样转起来的。" }
      ],
      [
        { sel: "#r-tools", rm: "act", add: "done" },
        { sel: "#r-e2", add: "act-acc" },
        { sel: "#r-agent", rm: "act", add: "act" },
        { sel: "#r-at", txt: "→ 无 tool_call" },
        { state: 'messages += [ {tool_result: 160} ]\n>>> 两个子问题都有了答案，LLM 这轮不再调用工具',
          note: "工具结果再次回写。这一圈 LLM 判断信息够了，直接产出最终回答，无 tool_call。" }
      ],
      [
        { sel: "#r-agent", rm: "act", add: "done" },
        { sel: "#r-le", add: "act" },
        { sel: "#r-ee", add: "act" },
        { sel: "#r-end", add: "act" },
        { state: 'tools_condition(agent) -> END\n最终回答： "北京晴 22°C;20×8=160"',
          note: "tools_condition 判定为「无调用」→ 路由到 END。循环结束。ReAct 就是「想-做-看」的二人转，转几圈由 LLM 自己决定。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     4) reducer-compare — 3.7 三种 Reducer 对比
     核心：相同输入流，覆盖 / operator.add / add_messages 三种结果分叉
     ---------------------------------------------------------- */
  R("reducer-compare", {
    svg:
      '<svg class="svg-box" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="td dd">' +
      '<title id="td">三种 Reducer 对比(动态)</title><desc id="dd">同一输入流，三种合并方式结果不同</desc>' +
      // 列标题
      '<text class="lbl" x="120" y="22" text-anchor="middle" fill="var(--fg-muted)">覆盖(默认)</text>' +
      '<text class="lbl" x="360" y="22" text-anchor="middle" fill="var(--brand-3)">operator.add</text>' +
      '<text class="lbl" x="600" y="22" text-anchor="middle" fill="var(--accent)">add_messages</text>' +
      // 三列结果框
      '<rect class="node" id="c-c1" x="40" y="40" width="160" height="60" rx="8"></rect>' +
      '<text class="lbl sm code" id="c-t1" x="120" y="75" text-anchor="middle">field = ?</text>' +
      '<rect class="node core" id="c-c2" x="280" y="40" width="160" height="60" rx="8"></rect>' +
      '<text class="lbl sm code" id="c-t2" x="360" y="75" text-anchor="middle">list = ?</text>' +
      '<rect class="node acc" id="c-c3" x="520" y="40" width="160" height="60" rx="8"></rect>' +
      '<text class="lbl sm code" id="c-t3" x="600" y="75" text-anchor="middle">msgs = ?</text>' +
      // 共同输入流(底部)
      '<text class="lbl sm" x="360" y="160" text-anchor="middle" fill="var(--fg-muted)">▲ 同一份输入依次到达 ▲</text>' +
      '<rect class="node" id="c-in1" x="240" y="180" width="240" height="34" rx="6"></rect>' +
      '<text class="lbl sm code" id="c-in1t" x="360" y="202" text-anchor="middle">第 1 轮： A</text>' +
      '<rect class="node" id="c-in2" x="240" y="222" width="240" height="34" rx="6"></rect>' +
      '<text class="lbl sm code" id="c-in2t" x="360" y="244" text-anchor="middle">第 2 轮： A(同 ID)</text>' +
      '</svg>',
    states: [
      [
        { sel: "#c-in1", add: "act" },
        { sel: "#c-in1t", txt: "第 1 轮： A" },
        { state: '三个字段初始为空。第 1 轮各节点返回：\n  覆盖字段 ← "A"\n  add字段   ← ["A"]\n  msgs字段  ← [msg(id=1,"A")]',
          note: "三种 reducer 第一轮结果看起来都「有 A」。差异要等第二轮才显现——这正是坑所在。" }
      ],
      [
        { sel: "#c-t1", txt: 'field = "A"' },
        { sel: "#c-t2", txt: 'list = ["A"]' },
        { sel: "#c-t3", txt: 'msgs = [A(id=1)]' },
        { state: '第 1 轮后：\n  覆盖： field = "A"\n  add:   list = ["A"]\n  msgs:  msgs = [{id:1, content:"A"}]',
          note: "第一轮三者一致地包含了 A。现在第 2 轮：又来一个「A」，但这次带相同的 message id。" }
      ],
      [
        { sel: "#c-in1", rm: "act", add: "done" },
        { sel: "#c-in2", add: "act" },
        { sel: "#c-in2t", txt: "第 2 轮： A(同 ID)" },
        { state: '第 2 轮输入(同一 message id=1，内容更新为 "A\'"):\n  交给三种 reducer 合并...',
          note: "注意第 2 轮的 A 与第 1 轮 A 共享相同 message id。这是 add_messages 能识别「同一消息更新」的关键。" }
      ],
      [
        { sel: "#c-c1", add: "warn" },
        { sel: "#c-t1", txt: 'field = "A\'"  ← 覆盖！' },
        { sel: "#c-c2", add: "act" },
        { sel: "#c-t2", txt: 'list = ["A","A\'"]' },
        { sel: "#c-c3", add: "act-acc" },
        { sel: "#c-t3", txt: 'msgs = [A\'(id=1)]  ← 替换' },
        { state: '覆盖：  field = "A\'"        # 旧值直接没了，历史丢失\nadd:   list = ["A","A\'"]   # 全部追加，可能重复\nmsgs:  msgs = [{id:1,"A\'"}] # 按 id 替换，既不丢也不重',
          note: "三种行为分叉：覆盖丢历史、add 会重复、add_messages 按 ID 精准替换。给消息类字段选对 reducer，是防坑第一要务。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     5) time-travel — 9.5 时间旅行
     核心：checkpoint 时间线 → 选历史快照 → 分叉重跑
     ---------------------------------------------------------- */
  R("time-travel", {
    svg:
      '<svg class="svg-box" viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="te de">' +
      '<title id="te">时间旅行(动态)</title><desc id="de">checkpoint 时间线，从历史快照分叉重跑</desc>' +
      '<defs><marker id="are" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      '<text class="lbl sm" x="40" y="40" fill="var(--fg-muted)">checkpoint 时间线(thread-1)</text>' +
      // 主线
      '<line class="edge" x1="60" y1="80" x2="560" y2="80" stroke-width="1.4"></line>' +
      '<circle class="node" id="t-cp0" cx="80" cy="80" r="12"></circle>' +
      '<text class="lbl sm" id="t-l0" x="80" y="108" text-anchor="middle">cp-0</text>' +
      '<circle class="node" id="t-cp1" cx="230" cy="80" r="12"></circle>' +
      '<text class="lbl sm" id="t-l1" x="230" y="108" text-anchor="middle">cp-1</text>' +
      '<circle class="node" id="t-cp2" cx="380" cy="80" r="12"></circle>' +
      '<text class="lbl sm" id="t-l2" x="380" y="108" text-anchor="middle">cp-2</text>' +
      '<circle class="node" id="t-cp3" cx="530" cy="80" r="12"></circle>' +
      '<text class="lbl sm" id="t-l3" x="530" y="108" text-anchor="middle">cp-3(最新)</text>' +
      // 分叉支线(从 cp-1 向下)
      '<path class="edge" id="t-fork" d="M230 92 Q 230 150 300 180" fill="none" stroke="var(--accent)" stroke-width="0" stroke-dasharray="5 3"></path>' +
      '<circle class="node acc" id="t-fc1" cx="330" cy="190" r="11" opacity="0"></circle>' +
      '<text class="lbl sm" id="t-fl1" x="330" y="220" text-anchor="middle" fill="var(--accent)" opacity="0">cp-1\'</text>' +
      '<circle class="node acc" id="t-fc2" cx="460" cy="190" r="11" opacity="0"></circle>' +
      '<text class="lbl sm" id="t-fl2" x="460" y="220" text-anchor="middle" fill="var(--accent)" opacity="0">cp-2\'</text>' +
      '<path class="edge" id="t-fe" d="M341 190 L449 190" fill="none" stroke="var(--accent)" stroke-width="0" marker-end="url(#are)"></path>' +
      '</svg>',
    states: [
      [
        { sel: "#t-cp0", add: "act" },
        { state: '执行第 1 步 → 写入 checkpoint cp-0',
          note: "每过一个 super-step,Checkpointer 自动存一个快照。这条线就是 thread-1 的状态历史。" }
      ],
      [
        { sel: "#t-cp0", rm: "act", add: "done" },
        { sel: "#t-cp1", add: "act" },
        { state: '执行第 2 步 → 写入 cp-1(父快照=cp-0)',
          note: "每个 checkpoint 记着 parent_config，串成一条可回溯的链。" }
      ],
      [
        { sel: "#t-cp1", rm: "act", add: "done" },
        { sel: "#t-cp2", add: "act" },
        { state: '执行第 3 步 → 写入 cp-2',
          note: "继续累积。现在 thread-1 有完整时间线：cp-0 → cp-1 → cp-2。" }
      ],
      [
        { sel: "#t-cp2", rm: "act", add: "done" },
        { sel: "#t-cp3", add: "act" },
        { state: 'get_state_history(config) -> [cp-3, cp-2, cp-1, cp-0]  (从新到旧)\n当前在 cp-3(最新)',
          note: "invoke 又跑一步到 cp-3。get_state_history 能拿到这条完整时间线——这是「时间旅行」的入口。" }
      ],
      [
        { sel: "#t-cp3", rm: "act" },
        { sel: "#t-cp1", add: "act-acc" },
        { state: '>>> 选中历史快照 cp-1 作为新起点\npast_config = history[2].config  # cp-1',
          note: "挑一个历史点 cp-1。接下来从它重新 invoke——就像游戏「读档」。" }
      ],
      [
        { sel: "#t-fork", attr: { "stroke-width": "1.6" } },
        { sel: "#t-fc1", attr: { opacity: "1" }, add: "act-acc" },
        { sel: "#t-fl1", attr: { opacity: "1" } },
        { state: 'graph.invoke(new_input, past_config)\n>>> 从 cp-1 加载状态，产生新快照 cp-1\'',
          note: "从 cp-1 重新执行，会分叉出一条新线 cp-1\'。主线 cp-2/cp-3 不受影响——这是只读历史的「假设分析」。" }
      ],
      [
        { sel: "#t-fc1", rm: "act-acc", add: "done" },
        { sel: "#t-fe", attr: { "stroke-width": "1.6" } },
        { sel: "#t-fc2", attr: { opacity: "1" }, add: "act-acc" },
        { sel: "#t-fl2", attr: { opacity: "1" } },
        { state: '继续在新线上推进 → cp-2\'\n主线：cp-0→cp-1→cp-2→cp-3\n新线：cp-0→cp-1→cp-1\'→cp-2\'',
          note: "分叉线继续推进。两条线共享 cp-0/cp-1 前缀，之后各自演化。没有 Checkpointer 存的这条时间线，这一切都不可能。" }
      ]
    ]
  });

})();
