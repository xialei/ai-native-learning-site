# 计划：《深入浅出具身智能》— 仿照《深入浅出vLLM》的源码精读静态站点

## 目标

在 `/Users/lei.xia/workspace/github/ai-native-learning-site/robotics/` 下新建一个纯静态 HTML 多页面学习站点，拆解具身智能（Embodied AI）四大开源仓库的真实源码：

| 源码 | 位置 | 版本（已核实） |
|---|---|---|
| LeRobot（真机、数据、策略、训练） | `/Users/lei.xia/workspace/github/robotics/lerobot` | commit `3f2c29ef7e`（2026-09-03），数据格式 v3.0，pyproject 0.6.2 |
| Isaac Lab（GPU 仿真、RL） | `/Users/lei.xia/workspace/github/robotics/IsaacLab` | v3.0.0（VERSION 文件），commit `99f1423e5d`（2026-09-04） |
| Prismatic VLMs（VLM backbone） | `/Users/lei.xia/workspace/github/robotics/prismatic-vlms` | commit `874c5bb`（2024-05-16） |
| UnifoLM-VLA-0（人形 VLA 大模型） | `/Users/lei.xia/workspace/github/robotics/unifolm-vla` | commit `ff6c39a`（2026-01-29） |

书名：《深入浅出具身智能》；目录名 `robotics/`（与站点其他子项目命名法一致）。

## 已核实的源码锚点（写作时直接引用，标注真实路径）

**LeRobot**（`src/lerobot/`）：
- `robots/robot.py:46` — `Robot` 抽象基类：`connect / calibrate / get_observation / send_action / disconnect`，`observation_features / action_features` 属性；支持机型 so_follower、koch_follower、lekiwi、reachy2、unitree_g1、hope_jr、openarm、earthrover 等 15+。
- `motors/motors_bus.py:58` — `MotorsBusBase`：`read / write / sync_read / sync_write / enable_torque / write_calibration`；三大总线 feetech、dynamixel、damiao、robstride。
- `teleoperators/teleoperator.py:29` — `Teleoperator` 基类（keyboard、gamepad、homunculus、phone、so_leader 等）。
- `cameras/camera.py:26` — `Camera` 基类：`read / async_read / read_latest`；opencv、realsense、reachy2_camera、zmq。
- `datasets/lerobot_dataset.py:52` — `LeRobotDataset(torch.utils.data.Dataset)`：`add_frame / save_episode / push_to_hub / create`；目录结构 `meta/info.json + meta/stats.json + meta/episodes/chunk-xxx/file-xxx.parquet + data/chunk-xxx/file-xxx.parquet + videos/{video_key}/chunk-xxx/file-xxx.mp4`（`datasets/utils.py:89-147`，`CODEBASE_VERSION = "v3.0"` 于 dataset_metadata.py:61）。
- `policies/`：act、diffusion、pi0、pi05、smolvla、tdmpc、vqbet、eo1、evo1、groot、wall_x、xvla、rtc（实时分块）等 20+；SmolVLA：`SmolVLAPolicy(modeling_smolvla.py:142)` 包 `VLAFlowMatching(:466)`，flow matching 训练目标 `x_t = t·noise + (1-t)·actions`、`u_t = noise - actions`（:700-701），小动作专家 `expert_width_multiplier=0.5`（smolvlm_with_expert.py:110）；π0：`PI0Pytorch(:404)` + PaliGemma 双流 + adarms action expert。
- `scripts/lerobot_train.py:385` — `train(TrainPipelineConfig)`；CLI 入口 pyproject.toml：lerobot-train/record/replay/teleoperate/eval/rollout/dataset-viz 等 19 个。
- `scripts/lerobot_record.py:171` — `RecordConfig`；record_loop 数据流 ASCII 图（robot→obs→processor→teleop→action→save）。
- `async_inference/`：policy server / robot client 分离，gRPC（`transport/services.proto`：SendObservations/GetActions/StreamParameters/SendTransitions），action chunking 队列；`policies/rtc/` 实时分块插值。

**Isaac Lab**（monorepo `source/`，核心包 isaaclab）：
- `isaaclab/envs/manager_based_rl_env.py:161` — `step()` 八步：process_action → (decimation 循环 apply_action→write_data_to_sim→sim.step→scene.update) → get_observations → rewards → termination → reset_idx → observations 返回。
- `isaaclab/managers/` — ActionManager、ObservationManager（compute():317）、RewardManager（compute(dt):129）、TerminationManager、CommandManager、CurriculumManager、EventManager、RecorderManager。
- `isaaclab_tasks/.../manipulation/lift/lift_env_cfg.py` — 完整 ManagerBased 任务范本：`ObjectTableSceneCfg`（场景）、ActionsCfg（arm_action+gripper_action）、ObservationsCfg.PolicyCfg（joint_pos/joint_vel/object_position/target/actions + enable_corruption）、RewardsCfg（reaching_object w=1.0 / lifting_object w=15.0 / object_goal_tracking w=16.0+5.0 / action_rate -1e-4 / joint_vel -1e-4）、TerminationsCfg（time_out/object_dropping）、CurriculumCfg（modify_reward_weight）、EventCfg（reset_root_state_uniform 域随机化）；`LiftEnvCfg.num_envs=4096, decimation=2, sim.dt=0.01`。
- gym 注册：`config/franka/__init__.py:17` `Isaac-Lift-Cube-Franka-v0`（+IK-Abs 变体）。
- `isaaclab/actuators/`：ImplicitActuator、IdealPDActuator、DCMotor、DelayedPDActuator、ActuatorNetMLP/LSTM（学习型执行器，hwangbo2019learning）。
- `isaaclab/controllers/`：DifferentialIKController、joint_impedance、operational_space、pink_ik、rmp_flow。
- `isaaclab/sim/simulation_context.py:78` — `SimulationContext` 单例（physics_dt/render/sim.step）；sensors/：camera、contact_sensor、imu、ray_caster、frame_transformer。
- `isaaclab_assets/robots/` — 26 个机器人 cfg（FRANKA_PANDA_CFG:26、anymal、unitree、spot、shadow_hand、quadcopter…）。
- 入口：`isaaclab.sh train --rl_library rsl_rl --task Isaac-Cartpole-v0`（cli/__init__.py:49 train/play → scripts/reinforcement_learning/train.py，按 rsl_rl/sb3/skrl/rl_games/rlinf 分发）；wrapper：`isaaclab_rl/rsl_rl/vecenv_wrapper.py:25 RslRlVecEnvWrapper`。

**Prismatic VLMs**（`prismatic/`）：
- `models/vlms/prismatic.py:38` — `PrismaticVLM(VLM)`：freeze_backbones(stage)、generate()、get_fsdp_wrapping_policy。
- `models/backbones/vision/` — clip_vit、dinov2_vit、siglip_vit、dinoclip_vit、dinosiglip_vit（双塔融合）；`models/backbones/llm/`。
- `util/nn_utils.py:12,21` — LinearProjector、MLPProjector（FusedGMLP 在 materialize）。
- `models/registry.py:9` — MODEL_REGISTRY（llava-v15 复现、one-stage、dino 等）；FSDP/DDP training strategies。
- 定位：OpenVLA / π0 系列 VLM 骨干的来源。

**UnifoLM-VLA-0**（`src/unifolm_vla/`）：
- `model/framework/unifolm_vla.py:19` — `Unifolm_VLA(baseframework)`：forward / predict_action。
- `model/modules/action_model/DiT_ActionHeader.py:135` — `FlowmatchingActionHead`（DiT-B/L config :130，ActionEncoder，sample_time，predict_action :236）— flow matching + DiT 动作头。
- `model/modules/vlm/QWen2_5.py` — Qwen2.5 VLM 底座；DeepSpeed ZeRO2/3 训练；Unitree 人形，12 类操作任务单策略。

## 书籍结构（13 章 + 首页，全栈均衡主线）

学习主线：**具身智能闭环 = 感知 → 决策（策略）→ 执行（控制）→ 数据 → 学习 → 仿真 → 部署**。

| # | 文件 | 标题 | 内容要点（源码锚点） |
|---|---|---|---|
| 首页 | index.html | 深入浅出具身智能 | hero + 版本徽标（4 仓库 commit）+ 总览 SVG（具身智能闭环）+ 学习路径卡片 + pathgrid |
| 01 | 01-overview.html | 具身智能全景与四个仓库 | VLA 范式 vs 传统 RL；四仓库在技术栈中的位置；一个操作任务的完整生命周期图；LeRobot vs Isaac Lab 分工（真机 vs 仿真） |
| 02 | 02-hardware.html | 硬件抽象层：Robot / MotorsBus / Camera | lerobot Robot 基类接口（robot.py:46）逐方法讲解；MotorsBus（sync_read/write 总线协议）；Camera async_read；calibration 流程；机型一览 |
| 03 | 03-teleop.html | 遥操作与数据采集 | Teleoperator 基类；lerobot-record 数据流（record_loop ASCII→SVG）；RecordConfig；so100 leader-follower；数据集写盘路径 |
| 04 | 04-dataset.html | LeRobotDataset v3.0 | 数据集目录结构（meta/data/videos）；LeRobotDataset 类（add_frame/save_episode/__getitem__）；chunk/file 分片；stats 归一化；push_to_hub；vs RLDS/TFDS 对比 |
| 05 | 05-policy.html | 策略动物园：从 ACT 到 π0 | PreTrainedPolicy 接口（select_action/forward/reset）；ACT encoder-decoder + CVAE；Diffusion Policy；时序集成 ACTTemporalEnsembler；选择指南表 |
| 06 | 06-smolvla.html | VLA 与 Flow Matching：SmolVLA | VLM→动作的范式；VLAFlowMatching 结构（smolvlm+小专家）；flow matching 数学与代码（x_t/u_t :700）；action chunk；SmolVLA 训练要点（num_expert_layers 等） |
| 07 | 07-vla-frontier.html | VLA 前沿：π0 与 UnifoLM-VLA-0 | π0：PaliGemma 双流 + adarms action expert（modeling_pi0.py:404,592,618）；UnifoLM：Qwen2.5 VLM + DiT flow matching action head（DiT_ActionHeader.py:135）；Prismatic VLM 作为 backbone 源头（PrismaticVLM:38，CLIP/DINOv2/SigLIP 双塔，registry）；VLA 演进谱系 |
| 08 | 08-sim-isaaclab.html | 仿真框架：Isaac Lab 架构 | monorepo 包结构；SimulationContext 单例；Spawner/USD 资产；InteractiveScene 克隆 4096 envs；Actuator 模型（PD/DCMotor/ActuatorNet）；sensors |
| 09 | 09-manager-based-env.html | Manager-Based 环境：把 MDP 变成配置 | ManagerBasedRLEnv.step() 八步流程（manager_based_rl_env.py:161）；六大 Manager；LiftCube 任务全拆解（lift_env_cfg.py：scene/actions/obs/rewards/terminations/curriculum）；与 DirectRLEnv 对比 |
| 10 | 10-rl-training.html | RL 训练闭环：奖励设计与课程学习 | reward shaping 剖析（为何 lifting w=15 >> reaching w=1）；action penalty 正则；EventCfg 域随机化（events.py:1758,2048）；curriculum（modify_reward_weight）；RslRlVecEnvWrapper + isaaclab.sh train；rsl_rl OnPolicyRunner |
| 11 | 11-sim2real.html | Sim2Real 与部署 | sim2real gap 来源；域随机化/actuator net；Isaac Lab 域随机化→真机；lerobot 部署路径：lerobot-rollout、async_inference（gRPC 协议 services.proto、policy server/robot client 分离、action chunk 队列）、RTC 实时分块（policies/rtc/：ActionQueue、插值） |
| 12 | 12-build-own.html | 实战：跑通自己的具身智能项目 | 路线图：①SO-101 硬件+标定+遥操作 ②录数据集 ③SmolVLA/ACT 训练 ④评估+rollout ⑤仿真加练（Isaac Lab LiftCube→迁移）⑥VLA 微调（UnifoLM 范式）；每步命令、陷阱清单 |
| 13 | 13-glossary.html | 术语表 | 全书核心术语（中英对照）：Actuator、Action Chunk、Curriculum、DAgger、Domain Randomization、Flow Matching、LeRobotDataset v3.0、Manager-Based Env、MDP、PDK、Sim2Real、Teleoperation、VLA 等，附"在哪一章出现"索引 |

## 每章内部结构（沿用 vLLM 书模式）

- 复用 topbar（13 个导航链接）+ breadcrumb + page-header（h1+subtitle）。
- `section.block` 分节，节标题带 `4.1` 式编号；正文段落 + `<pre class="code">` 摘录真实源码（`code-title` 标注真实路径:行号）+ `annotation` 逐段解释。
- 每章至少 1-2 张内联 SVG（用 `.node/.edge/.lbl` 类，回环用 `.edge.back` 虚线，多色配 `.svg-legend`），遵守 AUDIT.md 规范（泳道对齐、回环虚线、图例、箭头方向核对）。
- 每章结尾 `table.tbl`「概念 → 源码实现 → 你自己做」小结 + `callout.warn` 下一步引导 + `arrow-nav` 上下页。
- 代码摘录必须来自四个仓库的真实文件；行号以当前 checkout 为准。

## 技术要点

- 新建 `robotics/books/assets/robotics-learn.css`：拷贝 vllm-learn.css 全量，只改品牌色变量（具身智能主题：--brand 换成深绿/青绿系 `#14532d`/`#0d9488` 或类似，--accent 保持橙色系）与其余变量注释。
- 13 个 HTML + index.html + README.md，全部手写（内容依赖我已核实的源码事实，不依赖构建工具）。
- 每页 head：viewport meta、lang=zh-CN、title「NN 标题 — 深入浅出具身智能」。
- 移动端：复用 vLLM CSS 的 @media ≤720px 断点（汉堡菜单、SVG 横向滑动、表格滚动）。

## 写作顺序与验收

1. `robotics/books/assets/robotics-learn.css`（品牌色改造）
2. index.html（总览 SVG + pathgrid 13 卡）
3. 02-hardware → 03-teleop → 04-dataset（lerobot 硬件/数据线）
4. 05-policy → 06-smolvla → 07-vla-frontier（模型线）
5. 08-sim-isaaclab → 09-manager-based-env → 10-rl-training → 11-sim2real（仿真/部署线）
6. 01-overview（全景，写完细节后回头写更准）
7. 12-build-own → 13-glossary
8. README.md（仿 vLLM README：如何浏览/内容结构表/技术说明/维护指南）
9. 站点根 README.md 的子项目表加一行 robotics/。

### 验收（对应 AUDIT.md）
- 每章：学习目标可倒推、SVG 无断链/无误导箭头、代码引用路径真实（抽查 5 处 grep 验证）、交叉引用闭合（01↔02↔…↔13 前后向链接齐全）、术语表覆盖全书专名。
- 每页浏览器可开（纯静态无构建）；导航 13 链接逐页一致。
