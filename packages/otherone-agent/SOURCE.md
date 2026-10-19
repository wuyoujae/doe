# 原始来源与本地适配

本目录直接来自 Yrkie 商业仓库提交 `98cbdd5736535e14bab4593973b33fddd4a99c64` 的 `app/backend/third_party/otherone-agent-0.6.0-yrkie.1/`，保留九个 crate、原始 MIT `LICENSE`、README 与 Cargo 清单。`UPSTREAM_FILES.json` 记录全部 83 个原文件的 SHA-256，可逐文件追溯迁入后的修改；没有复制运行配置、凭据、数据库、Git 元数据或编译产物。

后端真实调用 `Otherone::invoke_agent_stream_interactive_with_cancellation_and_pre_compaction_hook`。框架负责模型轮次、历史读取、上下文阈值和压缩、工具调度、交互暂停及取消。宿主仅通过运行实例的存储接口、模型传输接口和工具接口适配本地 Settings、SQLite 和 DOE 事务，未保留另一套 Agent 循环。

## 必要补丁

- `otherone-storage/types.rs`：`RuntimeContext` 增加不序列化的 `SessionStore`。所有权和生命周期绑定当前 run，避免进程级可变存储根目录。`storage/lib.rs` 与 `context/lib.rs` 优先使用实例存储；原 LocalFile/PostgreSQL API 继续可用。开源宿主不会建立额外 JSON 会话库或依赖商业 PostgreSQL。
- `otherone-agent/types.rs`：复用框架已有的异步 `ToolRegistry`，加到实际 Agent 循环。宿主的数据库、图片任务和取消不再包进阻塞同步闭包。原同步工具入口保持兼容；异步宿主自行执行整批写入屏障校验。
- 同一文件增加明确的 `terminal_tools`：已提交的大纲审阅和整稿生成回执结束当前轮，避免文稿提交后再次请求模型。`user_input_tool` 继续使用原 `AskQuestions` 持久化后暂停合同。
- `otherone-ai/Message`、Agent assistant entry 与 Context 历史转换：只保留提供商实际返回的 `reasoning_content`，供 DeepSeek 等下一轮工具请求使用。显示思考别名和加密推理块不被伪造成该字段；旧消息缺省兼容。
- Agent 流式/非流式工具回合移除固定 1,500ms 等待。流式收到 `finish_reason` 即结束，仍拒绝缺少终结标记的截断工具。宿主传输保持 50ms/8KiB/128 项有界合并，观测器写入展示事件完成后才执行工具。
- Context 压缩写入失败向上返回，防止持久化失败后继续付费请求。当前用户原话、选中 Skill ID 和保留的工具后缀由 SQLite 适配器保存；原 DOE 历史过滤器仅整理即将压缩的历史正文。

`Message` 新字段对应的原始 Rust 构造器只增加 `None`；SDK 版本保持 `0.6.0-yrkie.1`，宿主补丁由本文件和来源清单识别，避免冒充未经修改的上游发行版。

## 宿主边界

`backend/src/generation/agent_runtime.rs` 组装 SDK；`agent_history.rs` 将原 run checkpoint 作为唯一持久模型历史；`backend/src/ai/agent_executor.rs` 只负责安全 OpenAI 风格传输和 SDK 事件转换。公开显示日志仍与可压缩模型上下文分离，附件全文/图片字节仅在发送前临时解析。Settings 的密钥不会进入 SDK 存储、快照或日志。

工具 ID/名字允许跨 SSE 帧分片。传输累计身份，向 SDK 发送名字增量与完整当前 ID；展示流按 `run:round:tool:index` 隔离并行工具，`tool_identity` 在中途更新身份元数据，完成标记后再改成最终提供商 ID，随后实际工具回执沿用该 ID。参数不因身份变化丢失，也不会遗留重复运行中的工具行。

上下文在调用前预留最大输出、附件和当前文稿状态容量。实际模型轮次上限传 SDK，未配置时为 8。进程中止仍沿用宿主的 interrupted 状态和显式重试，不自动恢复付费请求。回退停止新服务并恢复匹配代码与运行备份，不删表、不覆盖用户作品。
