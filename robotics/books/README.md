# 深入浅出具身智能

一套**纯静态、自包含**的 HTML 学习站点，用于系统学习具身智能（Embodied AI）的全栈实现——真机硬件、数据采集、模仿学习、VLA 模型、仿真 RL 与部署——并为**搭建自己的具身智能系统**提供路线图。无需任何构建工具，双击 `index.html` 即可浏览。

## 如何浏览

```bash
open /Users/lei.xia/workspace/github/ai-native-learning-site/robotics/books/index.html
# 或：在浏览器中打开该文件
```

> 提示：可对照源码仓库一起看。每个页面中标注的 `lerobot/src/lerobot/...`、`isaaclab/source/...` 等相对路径都对应 `/Users/lei.xia/workspace/github/robotics/` 下的文件。

## 内容结构

| 页面 | 主题 | 核心内容 |
|------|------|----------|
| `index.html` | 首页 | 学习路径导航 + 三条技术路线总览 |
| `01-overview.html` | 全景 | 模仿学习 vs RL vs VLA 三范式对比、全书知识地图、七仓库三层分工 |
| `02-hardware.html` | 硬件抽象 | MotorsBus 总线、Feetech/Dynamixel、Camera、Robot 抽象基类 |
| `03-teleop.html` | 遥操作 | Leader/Follower、teleoperate/record 循环、键盘遥操作 |
| `04-dataset.html` | 数据集 | LeRobotDataset v3.0 目录结构、chunk 分片、delta_timestamps、统计量 |
| `05-policy.html` | 策略接口 | PreTrainedPolicy 四方法、队列 vs 时序集成、ACT 与 Diffusion Policy 拆解 |
| `06-smolvla.html` | SmolVLA | 双流架构（VLM+动作专家）、flow matching、prefix KV cache、微调实战 |
| `07-vla-frontier.html` | VLA 前沿 | π0（PaliGemma+手工注意力）、UnifoLM-VLA（DiT 动作头）、GR00T N1.7（跨本体）、Prismatic 三件套 |
| `08-sim-isaaclab.html` | Isaac Lab 全景 | monorepo 分层、configclass 任务、SimulationContext、4096 环境并行、actuator 家族 |
| `09-manager-based-env.html` | 环境内核 | step() 八步流程、八大 Manager、_reset_idx 顺序、LiftCube episode 走查 |
| `10-rl-training.html` | RL 训练 | 奖励接力棒设计、课程学习、域随机化四种 mode、rsl_rl PPO 回路 |
| `11-sim2real.html` | Sim2Real | 差距清单、gRPC 异步推理、must-go 直通、队列聚合、师生蒸馏 |
| `12-build-own.html` | 实战路线 | 六个里程碑 M1-M6：硬件点亮→数据→模仿→RL→VLA→部署 |
| `13-glossary.html` | 术语表 | 按主题分组的术语速查 |

共享样式：`assets/robotics-learn.css`。所有架构图/流程图均为**内联 SVG**。

## 技术说明

- **纯静态**：每个 `.html` 自带导航与内联 SVG，仅引用一个共享 CSS。
- **基于开源源码**：lerobot（真机栈与策略）、Isaac Lab v3.0.0（release/3.0.0 @ 694dbf45d，仿真与 RL）、openpi（π0 / π0-FAST / π0.5 官方栈）、Isaac-GR00T（N1.7 跨本体 VLA）、OpenVLA（7B 动作 token 化）、prismatic-vlms（VLM 底座）、unifolm-vla（VLA 框架）。
- 站点内代码片段均摘自上述仓库并标注文件路径；仓库持续演进，若某处函数/路径对不上，以仓库最新代码为准。

## 维护指南

- 新增/修改页面：复制任一现有页面的 `topbar nav` 结构，保持 13 个导航链接不变，更新 `<title>`、页头与 `arrow-nav`。
- 新增概念图：直接在页面内写内联 `<svg class="svg-box">`，复用 CSS 中的 `.node` / `.edge` / `.lbl` 等类与 `<marker id="arrow">`。
- 代码片段：务必从源码摘录并标注路径，不要凭记忆杜撰函数签名。
- 如需在 `index.html` 的路径卡片增删条目，同步调整对应页面即可。
