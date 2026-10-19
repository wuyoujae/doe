# Image provider compatibility repair

## Otherone transport boundary（2026-10-19）

- [x] `agent_executor.rs` 仅适配 Settings/OpenAI 传输，不运行 Agent 循环；实际循环由原 Otherone 承担。
- [x] 保留请求超时、提供商输出字段、采样/思考参数、取消和有界流式合并；不自动重发付费请求。
- [x] 跨刷新批次累计工具 ID/名字，按原 SDK 的 ID 替换/名字累加合同发送；HTTP fixture 真正分割身份与参数，后续工具请求验证真实 reasoning_content。

框架来源、实例存储和补丁见 `packages/otherone-agent/SOURCE.md`；本节不更改图片凭据或以下历史生图记录。

Scope: `backend/src/ai/images.rs`, targeted transport tests and image adapter documentation. Preserve saved settings, encrypted credentials, project runs and image job API contracts.

- [x] Compare the commercial image adapter and current configured endpoint without logging secrets.
- [x] Verify the current Agnes image contract against its official documentation.
- [x] Recognize official Agnes endpoints configured as Custom and apply its original size/ratio/inline-output request fields.
- [x] Distinguish credential rejection, generic access denial, gateway denial, content policy, quota and rate limits using bounded, non-echoed error bodies.
- [x] Test real local HTTP requests, error redaction and unaffected generic Images behavior: six image tests passed.
- [x] Perform at most one actual image request with the current saved configuration after protocol repair; record only safe outcome metadata.
- [x] Read the running commercial Web/Admin configuration and platform image routing without writes; compare credentials in memory and verify the commercial credential with a free model-directory request.
- [x] After explicit user authorization, back up SQLite with its matching master key, synchronize only the image credential through the revision-checked Settings API, and verify one successful image request.

Evidence: the existing custom adapter sends generic pixel dimensions and omits Agnes `ratio`, `return_base64` and nested `response_format`. The current saved configuration receives HTTP 401 from the authenticated model directory; this is a separate authentication observation and does not by itself establish image-endpoint behavior. No configuration changes or cross-region fallback are authorized by this repair.

The adapter keeps one request per invocation and existing cancellation/uncertain-result semantics. Rollback is source-only; no schema or persisted-data migration is needed.

Bounded live verification on 2026-10-19: one image request using the saved configuration and repaired contract returned HTTP 401, consistent with the earlier authenticated directory result. No image succeeded and no automatic retry ran. The remaining provider authentication/account/region issue requires a working saved credential for that endpoint; the implementation does not overwrite it or switch regions. Documentation: `docs/IMAGE_PROVIDER_COMPATIBILITY.md`.

Commercial comparison on the same date: running Web/Admin use the same platform database and encryption key, with no configured AI SOCKS proxy. The active Agnes image library contains `agnes-image-2.5-flash` and `agnes-image-2.1-flash` with empty extra parameters. Its official China endpoint matches the open-source configuration, but the API credentials differ after trimming. One free `GET /v1/models` with the commercial credential returned HTTP 200 and included the configured 2.5 model. No commercial or open-source setting was changed; no further paid image request was made. Do not copy a commercial credential into public source, logs, fixtures or documentation.

Follow-up user-authorized repair: created an online SQLite backup plus matching master key in `.run-data/backups/20261019-work-chat-before-key/`; quick_check passed at Settings revision 5. The normal HTTP Settings save performed CAS 5→6 with only the image API key supplied. All non-key fields, the text key ciphertext and all four DOE tables were verified unchanged. One subsequent explicitly authorized image request through the production adapter succeeded (PNG, 1312×736); its neutral QA output stays under ignored `test/`, outside user projects and the asset store. No automatic retry, credential logging, commercial database write or secret embedded in source was used.
