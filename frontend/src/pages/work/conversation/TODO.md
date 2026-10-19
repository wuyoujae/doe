# 原版会话消息与流式投影

用户要求保留原版 Work 设计与全部消息，不新增日志式 UI。原仓库的 `app/frontend/src` 仅作为只读迁移来源。

- [x] 迁移 MessagePanel、ToolChips、ThinkingState、Markdown 和必要图片/问答子组件。
- [x] 持久事件按序号去重投影；历史先分页读取，SSE 续接；项目切换取消旧订阅。
- [x] 已回答问卷从持久 answers 恢复；所有用户/assistant/tool 内容保留。
- [x] 保留原滚动、折叠、动效与 CSS 度量；组件类型检查通过，4 项纯投影测试覆盖重放、迟到回执和流式参数保留。
- [x] 兼容旧问答回执缺少 requestId；消息列表限制横向滚动，保留原工具折叠区负边距和局部代码滚动。
- [x] 上传附件与历史共用原 chip；持久 user/answers 事件恢复附件；生图过程沿用原 generatingImages 活动项。
- [x] SSE 在 50ms 窗口内合并相邻文本/参数片段后批量投影与发布，避免逐字符重复复制全文和 React 更新；不延迟终结快照。
- [x] 每轮 assistant_done 结束对应思考状态，保留待执行工具及下一轮思考，避免思考状态一直等待任务结束。

前端仅消费公开会话事件，不读取模型密钥或后端内部 history。API 映射与页面/输入框接线由主任务完成。

## 组件合同与原版来源

- `MessagePanel.tsx`：原 `components/MessagePanel.tsx`，保留 Virtuoso、自动跟底、虚拟列表、文本/工具/思考/图片/嵌套 Agent 展示。外层仍使用原 `chat-history-view`；不要追加第二个滚动容器。依赖原版 `react-virtuoso@4.18.10`。
- `ToolChips.tsx` / `ThinkingState.tsx`、`agents/`、`markdown/`、`questions/` 来自同名原版组件；CSS 原值等价转 rem，变量、断点和动效保持。仅图片路径改为本机项目受管 asset API，移除商业 Tauri opener。
- `MessagePanel` props：`messages:MessageGroup[]`、`isStreaming`、`questions?:DoeQuestionsContext`、可选空态与滚动回调；原 `VirtuosoHandle` ref 保留。模型来自原 `types/session.ts` 的消息合同。
- `questions`：`scopeKey`、`activeRequestId`（无待答问卷时显式 null）、`answersByRequest`、可选 `busy/blockedReason/onUpload`，`onSubmit(requestId, formattedPrompt, answers)` 第三个参数为 `{id,answer}[]`。兼容原对象选项和新服务端字符串选项。读取历史时显示持久已选项与自由文本。
- `useConversation(projectId,{onSnapshot})` 返回 `messages/answersByRequest/streamingOutline/isStreaming/historyLoading/error/refresh`。先完整 GET 分页，再 SSE；当前 snapshot 是运行状态的权威，旧 run 的结束回执不结束新 run。locale 不重建订阅。
- `toStreamingOutlineRecord(draft,projectId)` 对应原 App `streamingOutlineDraftFromEvent` / WorkPreviewPanel `streamedSessionOutline`：接后端已经解析的 `document`，仅供只读流式预览，不将部分文本当作可保存大纲。

验证：`node --test frontend/src/pages/work/conversation/projector.test.mjs`（9/9，含附件历史重放、生图活动项与逐轮思考结束）；前端 TypeScript/生产构建通过。旧问答缺回执与 waiting 状态的后端回填定向测试 2/2 通过；持久会话与 API 整体集成验收见 `docs/VERIFICATION.md`。
