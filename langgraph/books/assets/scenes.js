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

  /* ----------------------------------------------------------
     6) two-layer-graph — 12.2 两层图结构(实战案例)
     核心：顶层 10 节点主脊 + 4 个阶段子图,下钻看子图内部,
           子图出口信号字段供顶层条件边消费
     ---------------------------------------------------------- */
  R("two-layer-graph", {
    svg:
      '<svg class="svg-box" viewBox="0 0 880 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tf dg">' +
      '<title id="tf">两层图结构：顶层主脊 + 阶段子图(动态)</title><desc id="dg">主脊从 A 子图推进到 D 子图，C 子图写出口信号，顶层条件边读信号决定下一跳，最后下钻展开 D 子图内部</desc>' +
      '<defs><marker id="arf2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      // 顶层主脊 5 个框
      '<rect class="node core" id="g-a" x="20" y="40" width="130" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="g-at" x="85" y="62" text-anchor="middle">stage_a_subgraph</text>' +
      '<text class="lbl sm" id="g-at2" x="85" y="80" text-anchor="middle">理解与发现</text>' +
      '<rect class="node core" id="g-b" x="200" y="40" width="130" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="g-bt" x="265" y="62" text-anchor="middle">stage_b_subgraph</text>' +
      '<text class="lbl sm" id="g-bt2" x="265" y="80" text-anchor="middle">数据与契约</text>' +
      '<rect class="node core" id="g-c" x="380" y="40" width="130" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="g-ct" x="445" y="62" text-anchor="middle">stage_c_subgraph</text>' +
      '<text class="lbl sm" id="g-ct2" x="445" y="80" text-anchor="middle">评估门禁</text>' +
      '<rect class="node core" id="g-d" x="560" y="40" width="130" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="g-dt" x="625" y="62" text-anchor="middle">stage_d_subgraph</text>' +
      '<text class="lbl sm" id="g-dt2" x="625" y="80" text-anchor="middle">调优迭代</text>' +
      '<rect class="node" id="g-fin" x="750" y="40" width="110" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="g-fint" x="805" y="62" text-anchor="middle">finalize</text>' +
      '<text class="lbl sm" id="g-fint2" x="805" y="80" text-anchor="middle">注册交付</text>' +
      // 主脊连线
      '<line class="edge" id="g-e1" x1="150" y1="68" x2="198" y2="68" marker-end="url(#arf2)"></line>' +
      '<line class="edge" id="g-e2" x1="330" y1="68" x2="378" y2="68" marker-end="url(#arf2)"></line>' +
      '<line class="edge acc" id="g-e3" x1="510" y1="60" x2="558" y2="60" marker-end="url(#arf2)"></line>' +
      '<text class="lbl sm code" id="g-l3" x="534" y="46" text-anchor="middle">tune_required</text>' +
      '<line class="edge" id="g-e4" x1="690" y1="68" x2="748" y2="68" marker-end="url(#arf2)"></line>' +
      // C 出口信号标注
      '<text class="lbl sm code" id="g-sig" x="445" y="126" text-anchor="middle" opacity="0">signals.eval_exit_route = "tune_required"</text>' +
      // D 子图内部(初始隐藏)
      '<rect class="node" id="g-x1" x="480" y="180" width="120" height="44" rx="8" opacity="0"></rect>' +
      '<text class="lbl sm" id="g-x1t" x="540" y="206" text-anchor="middle" opacity="0">prepare_tuning</text>' +
      '<rect class="node warn" id="g-x2" x="480" y="244" width="120" height="44" rx="8" opacity="0"></rect>' +
      '<text class="lbl sm" id="g-x2t" x="540" y="270" text-anchor="middle" opacity="0">idea ⏸ interrupt</text>' +
      '<rect class="node" id="g-x3" x="660" y="212" width="120" height="44" rx="8" opacity="0"></rect>' +
      '<text class="lbl sm" id="g-x3t" x="720" y="238" text-anchor="middle" opacity="0">trial_loop 子图</text>' +
      '<line class="edge" id="g-xx1" x1="600" y1="202" x2="608" y2="242" marker-end="url(#arf2)" opacity="0"></line>' +
      '<line class="edge" id="g-xx2" x1="600" y1="266" x2="658" y2="240" marker-end="url(#arf2)" opacity="0"></line>' +
      // 顶层尾
      '<rect class="node" id="g-tail" x="20" y="212" width="200" height="44" rx="8" opacity="0"></rect>' +
      '<text class="lbl sm" id="g-tailt" x="120" y="238" text-anchor="middle" opacity="0">顶层尾：cleanup → finalize</text>' +
      '<text class="lbl sm code" id="g-tailnote" x="120" y="278" text-anchor="middle" opacity="0">失败短路汇合点必须留顶层(子图不可跳入中间)</text>' +
      '</svg>',
    states: [
      [
        { sel: "#g-a", add: "act" },
        { state: '顶层 StateGraph ~10 节点\nnext = ("stage_a_subgraph",)',
          note: "顶层只有 4 个阶段子图 + 顶层尾（cleanup/finalize）。38 个细粒度节点全部下沉进子图，顶层一屏读完。" }
      ],
      [
        { sel: "#g-a", rm: "act", add: "done" },
        { sel: "#g-e1", add: "act" },
        { sel: "#g-b", add: "act" },
        { state: 'stage_a done → stage_b(数据与契约)\n子图作为节点嵌入： add_node("stage_b", compiled_b)',
          note: "A 子图内部 10 个节点跑完，顶层只看到「一个节点完成」。子图是黑盒，内部事件要靠 subgraphs=True 才能接出来。" }
      ],
      [
        { sel: "#g-b", rm: "act", add: "done" },
        { sel: "#g-e2", add: "act" },
        { sel: "#g-c", add: "act" },
        { state: 'stage_b done → stage_c(评估门禁)\n内部： eval → domain_eval → overfit → gate_router',
          note: "C 子图末节点 gate_router 是关键——它不路由,只写一个出口信号字段。" }
      ],
      [
        { sel: "#g-ct2", txt: "gate_router 写信号" },
        { sel: "#g-sig", attr: { opacity: "1" } },
        { state: 'return {"runtime": {"signals":\n    {"eval_exit_route": "tune_required"}}}',
          note: "子图出口信号契约：内部四向分流收敛为「写一个字段」，子图内部条件边统一走到 END。" }
      ],
      [
        { sel: "#g-c", rm: "act", add: "done" },
        { sel: "#g-e3", add: "act-acc" },
        { sel: "#g-l3", add: "act" },
        { sel: "#g-d", add: "act" },
        { state: '顶层条件边读信号决定下一跳\ndef route(s): return s["runtime"]["signals"]["eval_exit_route"]\n# "tune_required" → stage_d_subgraph',
          note: "顶层不用知道 C 内部发生了什么,只读信号字段。路由从 26 个内联闭包收敛为「子图出口 + 顶层条件边」。" }
      ],
      [
        { sel: "#g-x1", attr: { opacity: "1" } },
        { sel: "#g-x1t", attr: { opacity: "1" } },
        { sel: "#g-x2", attr: { opacity: "1" } },
        { sel: "#g-x2t", attr: { opacity: "1" } },
        { sel: "#g-x3", attr: { opacity: "1" } },
        { sel: "#g-x3t", attr: { opacity: "1" } },
        { sel: "#g-xx1", attr: { opacity: "1" } },
        { sel: "#g-xx2", attr: { opacity: "1" } },
        { sel: "#g-d", rm: "act", add: "act-acc" },
        { state: '▼ 下钻 stage_d 内部(可观测层)\nprecheck → prepare_tuning → idea(⏸interrupt) → trial_loop(子图)',
          note: "产品前端的「下钻」就是这层：顶层主脊给管理者看,子图内部节点给工程师看。细粒度事件经 custom + subgraphs 接出来。" }
      ],
      [
        { sel: "#g-x1", add: "done" },
        { sel: "#g-xx1", rm: "act", add: "dim" },
        { sel: "#g-xx2", add: "act-acc" },
        { sel: "#g-d", rm: "act-acc", add: "done" },
        { sel: "#g-e4", add: "act" },
        { sel: "#g-fin", add: "act" },
        { sel: "#g-tail", attr: { opacity: "1" } },
        { sel: "#g-tailt", attr: { opacity: "1" } },
        { sel: "#g-tailnote", attr: { opacity: "1" } },
        { state: 'stage_d done → finalize\n为什么 cleanup 留顶层？\n子图只能从入口进,失败短路无法靶向子图中间节点',
          note: "两层图的边界划分判据：需要被全图任意位置跳转的节点(cleanup)留顶层;阶段内聚的流程做成子图。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     7) interrupt-ux — 12.5 interrupt 如何变成产品 UX(实战案例)
     核心：interrupt({type}) → 前端按 type 渲染卡片 → resume 闭环
     ---------------------------------------------------------- */
  R("interrupt-ux", {
    svg:
      '<svg class="svg-box" viewBox="0 0 880 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="tu du">' +
      '<title id="tu">interrupt 如何变成产品 UI(动态)</title><desc id="du">节点抛 interrupt 带 type,前端据 type 渲染审批卡,人审批后 Command(resume) 恢复,状态从 running 修正为 interrupted</desc>' +
      '<defs><marker id="arf3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      // 左：图侧
      '<rect class="node core" id="u-node" x="20" y="30" width="200" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="u-nodet" x="120" y="52" text-anchor="middle">generate_idea_library</text>' +
      '<text class="lbl sm" id="u-nodet2" x="120" y="70" text-anchor="middle">产出 3 个高风险 idea</text>' +
      '<rect class="node warn" id="u-int" x="280" y="30" width="200" height="56" rx="10"></rect>' +
      '<text class="lbl sm" id="u-intt" x="380" y="52" text-anchor="middle">interrupt({...})</text>' +
      '<text class="lbl sm" id="u-intt2" x="380" y="70" text-anchor="middle">type: "idea_approval"</text>' +
      '<line class="edge" id="u-e1" x1="220" y1="58" x2="278" y2="58" marker-end="url(#arf3)"></line>' +
      // 中：前端
      '<rect class="node acc" id="ui-card" x="540" y="20" width="180" height="76" rx="10"></rect>' +
      '<text class="lbl sm" id="ui-cardt" x="630" y="44" text-anchor="middle">⏸ 待审批卡片</text>' +
      '<text class="lbl sm" id="ui-cardt2" x="630" y="62" text-anchor="middle">按 type 选组件渲染</text>' +
      '<text class="lbl sm code" id="ui-cardt3" x="630" y="82" text-anchor="middle">idea_approval → IdeaCard</text>' +
      '<line class="edge acc" id="u-e2" x1="480" y1="58" x2="538" y2="58" marker-end="url(#arf3)"></line>' +
      // 底部状态行
      '<rect class="node" id="u-status" x="280" y="150" width="200" height="40" rx="8"></rect>' +
      '<text class="lbl sm code" id="u-statust" x="380" y="175" text-anchor="middle">status: "running"  ← 错!</text>' +
      '<rect class="node" id="u-status2" x="540" y="150" width="180" height="40" rx="8"></rect>' +
      '<text class="lbl sm code" id="u-status2t" x="630" y="175" text-anchor="middle">徽标： 无</text>' +
      // 回传
      '<path class="edge acc" id="u-e3" d="M630 96 Q 630 210 480 210 Q 380 210 380 88" fill="none" marker-end="url(#arf3)"></path>' +
      '<text class="lbl sm code" id="u-l3" x="380" y="228" text-anchor="middle" opacity="0">Command(resume=[批准的 idea id 列表])</text>' +
      '</svg>',
    states: [
      [
        { sel: "#u-node", add: "act" },
        { state: 'ideas = build_idea_library(state)\nhigh_risk = [i for i in ideas if i.risk in ("MEDIUM","HIGH")]',
          note: "调优节点产出一批调参 idea。其中高风险的不能自动执行——需要人审批。" }
      ],
      [
        { sel: "#u-node", rm: "act", add: "done" },
        { sel: "#u-e1", add: "act-acc" },
        { sel: "#u-int", add: "act-acc" },
        { state: 'approved = interrupt({\n  "type": "idea_approval",\n  "ideas": high_risk,   # 结构化载荷\n})',
          note: "关键设计:interrupt 的 value 带 type 字段。前端拿到 __interrupt__ 事件后按 type 选渲染组件——这是「一种 interrupt 一种 UI」的锚点。" }
      ],
      [
        { sel: "#u-e2", add: "act-acc" },
        { sel: "#ui-card", add: "act-acc" },
        { sel: "#u-status", add: "warn" },
        { sel: "#u-status2", add: "warn" },
        { state: '前端读 snapshot.interrupts[0].value\n{"type": "idea_approval", "ideas": [...]}',
          note: "反面教材:旧实现暂停时 status 仍写 running,前端无法区分「在跑」和「在等人」——列表页一片绿,没人知道有审批积压。" }
      ],
      [
        { sel: "#u-statust", txt: 'status: "interrupted" ✓' },
        { sel: "#u-status2t", txt: "徽标： 🔴 1 项待审批" },
        { state: '# 中间件统一改写 status\nif snapshot.interrupts:\n    status = "interrupted"   # 而非 running',
          note: "status 语义修正:暂停态由 checkpointer 快照推导(interrupts 非空 → interrupted),全局徽标才有可信数据源。" }
      ],
      [
        { sel: "#u-l3", attr: { opacity: "1" } },
        { sel: "#u-e3", add: "act-acc" },
        { state: 'graph.invoke(\n  Command(resume=[idea_2, idea_3]),\n  config)   # 同 thread_id',
          note: "人勾选批准的 idea,前端把它包进 Command(resume=...) 回传。resume 值就是 interrupt() 第二次执行的返回值。" },
      ],
      [
        { sel: "#u-int", rm: "act-acc", add: "done" },
        { sel: "#u-intt2", txt: "返回批准列表" },
        { sel: "#ui-card", rm: "act-acc", add: "done" },
        { sel: "#ui-cardt", txt: "✓ 已审批" },
        { sel: "#u-status", rm: "warn" },
        { sel: "#u-status2", rm: "warn" },
        { sel: "#u-status2t", txt: "徽标： 无" },
        { state: 'ideas = apply_approvals(ideas, approved)\nreturn {"tune": {"idea_library": ideas}}',
          note: "闭环完成:同一节点从头重跑,interrupt() 这次返回批准列表,审批结果直接写回业务状态。三种 HITL 点位(idea/领域指标/test 集)共用这套协议。" }
      ]
    ]
  });

  /* ----------------------------------------------------------
     8) stream-observability — 12.7 stream 事件如何驱动进度 UI(实战案例)
     核心：updates 管节点级、custom 管子图内细粒度,事件 → 前端着色
     ---------------------------------------------------------- */
  R("stream-observability", {
    svg:
      '<svg class="svg-box" viewBox="0 0 880 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ts ds">' +
      '<title id="ts">stream 事件驱动进度 UI(动态)</title><desc id="ds">图执行产生 updates 与 custom 两类事件,updates 更新主脊节点状态,custom 携带子图内部 trial 进度(subgraphs=True 时经 ns 标记出现),前端据事件着色</desc>' +
      '<defs><marker id="arf4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#556674"></path></marker></defs>' +
      // 左：执行中的图(纵向主脊)
      '<rect class="node core" id="s-n1" x="30" y="30" width="150" height="40" rx="8"></rect>' +
      '<text class="lbl sm" id="s-n1t" x="105" y="55" text-anchor="middle">stage_c ✓ 完成</text>' +
      '<rect class="node core" id="s-n2" x="30" y="90" width="150" height="40" rx="8"></rect>' +
      '<text class="lbl sm" id="s-n2t" x="105" y="115" text-anchor="middle">stage_d ● 运行中</text>' +
      '<rect class="node" id="s-n3" x="30" y="150" width="150" height="40" rx="8" opacity="0.45"></rect>' +
      '<text class="lbl sm" id="s-n3t" x="105" y="175" text-anchor="middle">finalize ○ 待执行</text>' +
      '<text class="lbl sm code" x="105" y="226" text-anchor="middle">主脊状态 ← updates 事件</text>' +
      // 右：子图内部 trial 进度
      '<rect class="node" x="300" y="20" width="250" height="220" rx="10" fill="none"></rect>' +
      '<text class="lbl sm" x="425" y="42" text-anchor="middle">stage_d 内部(下钻)</text>' +
      '<rect class="node" id="s-t1" x="330" y="60" width="190" height="34" rx="6"></rect>' +
      '<text class="lbl sm code" id="s-t1t" x="425" y="82" text-anchor="middle">trial#1 r2 → 0.81 ✓</text>' +
      '<rect class="node" id="s-t2" x="330" y="106" width="190" height="34" rx="6"></rect>' +
      '<text class="lbl sm code" id="s-t2t" x="425" y="128" text-anchor="middle">trial#2 r1 → …</text>' +
      '<rect class="node" id="s-t3" x="330" y="152" width="190" height="34" rx="6"></rect>' +
      '<text class="lbl sm code" id="s-t3t" x="425" y="174" text-anchor="middle">trial#3 排队</text>' +
      '<text class="lbl sm code" x="425" y="226" text-anchor="middle">trial 级进度 ← custom 事件(subgraphs)</text>' +
      // 右：事件流
      '<rect class="node acc" id="s-ev" x="620" y="30" width="230" height="180" rx="10"></rect>' +
      '<text class="lbl sm code" id="s-evt" x="735" y="56" text-anchor="middle">((), "updates", {stage_c: ✓})</text>' +
      '<text class="lbl sm code" id="s-evt2" x="735" y="84" text-anchor="middle">((), "updates", {stage_d: ●})</text>' +
      '<text class="lbl sm code" id="s-evt3" x="735" y="112" text-anchor="middle">((stage:id,), "custom", trial#1)</text>' +
      '<text class="lbl sm code" id="s-evt4" x="735" y="140" text-anchor="middle">((stage:id,), "custom", trial#2)</text>' +
      '<text class="lbl sm code" id="s-evt5" x="735" y="168" text-anchor="middle">((), "updates", {finalize: ●})</text>' +
      '<line class="edge" id="s-e1" x1="180" y1="110" x2="618" y2="110" marker-end="url(#arf4)"></line>' +
      '<line class="edge acc" id="s-e2" x1="520" y1="120" x2="618" y2="120" marker-end="url(#arf4)"></line>' +
      '</svg>',
    states: [
      [
        { sel: "#s-n1", add: "done" },
        { sel: "#s-evt", add: "act" },
        { state: 'stream_mode=["updates","custom"], subgraphs=True\n>>> ((), "updates", {"stage_c": {...}})   # ns=() 顶层',
          note: "updates 是框架自动吐的节点级 patch:每完成一个节点一条。主脊的 ✓/●/○ 着色就靠它。subgraphs=True 是拿到子图事件的前提。" }
      ],
      [
        { sel: "#s-evt", rm: "act" },
        { sel: "#s-evt2", add: "act" },
        { sel: "#s-n2", add: "act" },
        { state: '>>> ((), "updates", {"stage_d": {...}})\n主脊: stage_d 点亮',
          note: "顶层视角到此为止——子图是一个黑盒节点。不开 subgraphs 时 trial 级进度完全不可见(现状 trial 子图用 invoke,事件被吞——这是框架默认行为的另一面)。" }
      ],
      [
        { sel: "#s-evt2", rm: "act" },
        { sel: "#s-evt3", add: "act-acc" },
        { sel: "#s-t1", add: "done" },
        { sel: "#s-e2", add: "act-acc" },
        { state: '>>> (("stage:abc",), "custom", {"trial":1,"round":2})\n# 子图节点内: writer = get_stream_writer()\n#             writer({...})  → 带 ns 出现在父图 stream',
          note: "custom 是节点主动推的:trial 子图内部每轮训练结束推一条,开了 subgraphs=True 后带 ns 标记出现在父图 stream——ns 为空是顶层事件,非空是子图事件。" }
      ],
      [
        { sel: "#s-evt3", rm: "act-acc" },
        { sel: "#s-evt4", add: "act-acc" },
        { sel: "#s-t2", add: "act" },
        { state: '>>> (("stage:abc",), "custom", {"trial":2,"round":1,...})\n# if ns: 下钻面板  elif mode=="updates": 主脊着色',
          note: "前端消费协议:ns 非空的 custom → 下钻面板的 trial 行实时刷新;ns 为空的 updates → 主脊节点着色。三元组 (ns, mode, payload) 按 ns 分发。" }
      ],
      [
        { sel: "#s-evt4", rm: "act-acc" },
        { sel: "#s-evt5", add: "act" },
        { sel: "#s-t2", rm: "act", add: "done" },
        { sel: "#s-n2", rm: "act", add: "done" },
        { sel: "#s-n3", add: "act", attr: { opacity: "1" } },
        { sel: "#s-e1", rm: "act" },
        { state: '>>> ((), "updates", {"finalize": {...}})',
          note: "一条 stream 双通道:updates 给「全景」(管理者看主脊),custom 给「下钻」(工程师看 trial)。这就是可观测中间件的全部——不需要额外轮询接口。" }
      ]
    ]
  });

})();
