# DOE 生成执行器

## 原 Otherone 执行框架迁入（2026-10-19，用户已确认方案）

- [x] 直接迁入 10 月 12 日 vendored 九 crate、MIT 许可证与原文件哈希清单。
- [x] 删除宿主 Agent 轮次循环，改调真实 Otherone 交互流式执行器。
- [x] RuntimeContext 实例存储映射原 SQLite run checkpoint，复用旧项目历史。
- [x] 设置、异步 DOE 事务工具、Skill revision、问答暂停、附件 resolver、流式事件和取消接线。
- [x] 保留真实 reasoning_content，移除固定工具等待和 EOF 等待，保留有界批量写入。
- [x] 原 DOE 历史压缩过滤器迁入；输出和附件预算提前预留，压缩不修改展示历史。
- [x] HTTP fixture 验证真实 SDK 全流程、问答、聊天编辑、取消、文档/图片输入和真实推理字段续轮。
- [x] SQLite 宿主存储范围、对象回执、用户原话/Skill ID 压缩保留和失效运行拒写验证。

实现来源和准确补丁见 `packages/otherone-agent/SOURCE.md`；完整跨模块决定与回退由 `docs/ORIGINAL_CORE_MIGRATION.md` 管理。下述早期宿主循环/压缩记录是迁入前实现过程，当前实际执行以 Otherone 为准；`context.rs` 的重建只作请求前容量预检，不驱动模型轮次或持久压缩。

用户已明确要求从 Create 到大纲确认、真实图片生成、完整可编辑文稿的链路。存储和 HTTP 由 `projects/`、`assets/` 承担；本模块只负责冻结配置、模型工具循环与阶段边界。完整跨模块决策由项目生成流程文档维护。

- [x] 审计 10 月 12 日直接作者工具、提问、图片承诺和 DOE 编译合同。
- [x] 原子读取文本／图片配置，凭据仅内存持有，冻结 DOE revision。
- [x] 有界 OpenAI JSON/SSE 解析、取消和安全错误；不自动重发付费失败请求。
- [x] 提问与大纲审阅均持久化后停止；只有用户操作可进入幻灯片阶段。
- [x] 生成并复用确认大纲的真实图片，执行 Tools 与准确编译、主题、图片授权和每页兑现校验。
- [x] 持久检查点、失效运行写入保护、明确上下文容量与轮次失败。
- [x] 定向模拟 HTTP 集成测试覆盖完整流程、确认门、失败及取消。

上下文默认 131072，显式设置严格尊重。超阈值以宿主权威状态重建上下文，保留全部用户消息、实际读取的 Skill 和最新大纲；容量不足明确失败，不截断已确认事实。回退停止新服务并保留 SQLite、主密钥和图片目录，禁止通过删表降级。

`runner.rs` 管理阶段与检查点；`tools.rs` 定义实际宿主工具；`context.rs` 用保守估算预留显式输出预算，并在生图前检查幻灯片阶段容量；`validation.rs` 调用原始 DOE 编译器并要求注册主题、准确页数和授权图片；`imagery.rs` 沿用原版每页图片承诺逻辑。缺失图片模型或原生透明能力时明确失败，不把有图稿改成无图稿。

验收使用真实本地 HTTP／SQLite／原始 DOE Schema，只替换外部模型为隔离测试服务，不使用商业凭据。覆盖 SSE 字节分片、大纲确认门、Skills、真实 PNG 解码入库、两页文稿、编辑回读、重复操作和取消迟到响应。工具不提供渲染预览，生成成功表示文稿已通过结构与素材校验并可编辑，不代表模型已看过渲染像素。
# Work conversation and original DOE edit tools

- [x] Stream provider text and public reasoning deltas, tool arguments and safe partial outline previews through durable ordered events.
- [x] Restore original ReadSlide / EditSlide / SetDeckTheme contracts with fresh saved-page reads, stable IDs and deck revision fencing.
- [x] Continue saved conversation and frozen Skills for Work chat; preserve partial committed edits on cancellation or conflict.
- [x] Validate byte-split streams, original bound-page compiler preservation, read-before-edit and stale revision rejection.

Reuse `doe_document::presentation::edit::Snapshot`, `schema::markdown::prepare_edit`, and `outline::markdown::preview`; do not add traditional-slide insert/delete tools to DOE. Persistence and SSE delivery remain in `projects`/HTTP. Streaming drafts are display-only; only validated, fenced tool commits update authoritative documents. Rollback stops new runs and retains all committed decks, histories and events.

`editing.rs` 复用原单页编译器并要求当前已读快照；全稿 revision 是所有页面共享的并发栅栏。`streaming.rs` 在真实 HTTP 分片到达时持久化正文和工具参数，正文不截断；大纲草稿只投影完整行、200ms 节流，并对重复预览设单轮预算。完整工具结果在执行成功之后写入展示历史；AskQuestions 保留原 requestId 合同。

验收包含原编译器保留未改页面／稳定 ID、真实 HTTP 聊天修改、正文及 Skill 回执重载、流式事件分页、旧 history 幂等补录、编辑事务 CAS／重放与取消后拒绝迟到写。Work 的 `host-read-only` 协议独立于生成预览：阻止新交互，保留显式 flush 保存锁定前编辑，AI 完成后恢复原可编辑画布。

## 流式消费与轮次耗时修复

- [x] 只读统计真实事件间隔，对照原版 50ms 合并机制，区分图片准备、模型推理和本地消费积压。
- [x] 合并相邻增量并在真实终结标记立即刷新，保留提供商实际返回的 DeepSeek 推理上下文。
- [x] 对不变的大纲草稿同样节流解析，避免累计参数重复扫描。
- [x] 本地慢分片／不关闭连接 fixture 定向验证，并接入单事务批量持久化。

实施路径、证据与回退见 `docs/STREAM_LATENCY.md`；不调整用户的模型、推理等级和输出预算。

