/* ============================================================
   anim.js — LangGraph 学习站 动态演示步进器
   仅用于"第一档"过程性概念:并行扇出 / interrupt暂停恢复 /
   ReAct循环 / Reducer对比 / 时间旅行。
   纯 vanilla JS,无依赖。每个演示由一个 SCENE 对象定义:
     svg    : SVG 模板字符串(画布)
     states : [ [ {sel, cls, txt?, note?}, ... ], ... ]  每步的状态补丁列表
   引擎按 step 索引应用补丁,渲染 state 文本框与说明栏。
   ============================================================ */

(function () {
  "use strict";

  const SCENES = {};

  // 注册一个演示场景
  // name: 场景标识; scene: { svg, states, init? }
  function register(name, scene) { SCENES[name] = scene; }

  // ---- 渲染单个演示容器 ----
  function mount(container) {
    const name = container.dataset.anim;
    const scene = SCENES[name];
    if (!scene) { container.textContent = "[未知演示: " + name + "]"; return; }

    let step = 0;
    const total = scene.states.length;

    // 骨架
    container.className = "anim";
    container.innerHTML =
      '<div class="anim-canvas">' + scene.svg + '</div>' +
      '<div class="anim-controls">' +
        '<button class="anim-btn" data-act="prev" title="上一步">◀</button>' +
        '<button class="anim-btn" data-act="play" title="播放">▶</button>' +
        '<button class="anim-btn" data-act="next" title="下一步">▶▶</button>' +
        '<button class="anim-btn" data-act="reset" title="重置">⟲</button>' +
        '<span class="anim-step">0 / ' + total + '</span>' +
      '</div>' +
      '<div class="anim-state"></div>' +
      '<div class="anim-note"></div>';

    const canvas = container.querySelector(".anim-canvas");
    const stepLabel = container.querySelector(".anim-step");
    const stateBox = container.querySelector(".anim-state");
    const noteBox = container.querySelector(".anim-note");
    let timer = null;

    function render(s) {
      // 应用初始(清除所有动态 class)
      if (scene.init) scene.init(canvas);

      // 应用第 0..s 步的所有补丁(累积,而非只当前步)
      for (let i = 0; i <= s; i++) {
        const patches = scene.states[i] || [];
        patches.forEach(function (p) {
          applyPatch(canvas, p);
        });
      }
      stepLabel.textContent = (s + 1) + " / " + total;
      // 当前步的 state 文本与说明(取当前步最后一条带 state/note 的补丁)
      const cur = scene.states[s] || [];
      let st = "", nt = "";
      cur.forEach(function (p) {
        if (p.state !== undefined) st = p.state;
        if (p.note !== undefined) nt = p.note;
      });
      stateBox.style.display = st ? "" : "none";
      if (st) stateBox.innerHTML = st;
      noteBox.style.display = nt ? "" : "none";
      if (nt) noteBox.textContent = nt;
    }

    function go(n) {
      step = Math.max(0, Math.min(total - 1, n));
      render(step);
    }

    function play() {
      stop();
      const btn = container.querySelector('[data-act="play"]');
      btn.textContent = "⏸";
      timer = setInterval(function () {
        if (step >= total - 1) { stop(); return; }
        go(step + 1);
      }, 1500);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      const btn = container.querySelector('[data-act="play"]');
      if (btn) btn.textContent = "▶";
    }
    function toggle() { timer ? stop() : play(); }

    container.querySelector(".anim-controls").addEventListener("click", function (e) {
      const t = e.target.closest(".anim-btn");
      if (!t) return;
      const act = t.dataset.act;
      if (act === "next") { stop(); go(step + 1); }
      else if (act === "prev") { stop(); go(step - 1); }
      else if (act === "reset") { stop(); go(0); }
      else if (act === "play") { toggle(); }
    });

    go(0);
  }

  // 应用一条补丁:给匹配元素设置 class / 文本
  function applyPatch(canvas, p) {
    // p.sel 是 SVG 内的 CSS 选择器(相对 canvas)
    // p.cls: 设为该 class 字符串(替换); p.add/p.rm: 增删 class
    // p.txt: 设置文本内容; p.attr: {name:val} 设置属性
    let els;
    try { els = canvas.querySelectorAll(p.sel); } catch (err) { return; }
    els.forEach(function (el) {
      if (p.cls !== undefined) el.setAttribute("class", p.cls);
      if (p.add) { const c = (el.getAttribute("class") || "") + " " + p.add; el.setAttribute("class", c.trim()); }
      if (p.rm) { let c = (el.getAttribute("class") || "").replace(new RegExp("(^|\\s)" + p.rm + "(\\s|$)", "g"), " "); el.setAttribute("class", c.trim()); }
      if (p.txt !== undefined) el.textContent = p.txt;
      if (p.attr) { for (const k in p.attr) el.setAttribute(k, p.attr[k]); }
    });
  }

  // ---- 暴露 ----
  window.LGAnim = {
    register: register,
    mountAll: function () {
      document.querySelectorAll("[data-anim]").forEach(mount);
    }
  };

  // 自动挂载
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.LGAnim.mountAll);
  } else {
    window.LGAnim.mountAll();
  }
})();
