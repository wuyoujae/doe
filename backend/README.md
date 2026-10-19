# Yrkie 本地后端

Rust 1.94 / Axum / SQLite，负责模型与 DOE 配置、原 otherone-agent 创作运行、文稿、受管素材、原导出及正式播放的本地宿主。仅支持当前电脑上的单用户安装；没有商业账户、计费、管理后台或商业数据库依赖。

## 启动

从仓库根目录执行：

```sh
cargo run --locked --manifest-path backend/Cargo.toml
```

默认监听 `127.0.0.1:7763`，前端开发端口为 `7762`，构建预览端口为 `7764`，两者通过 `/api/v1` 同源代理连接。健康接口为 `GET /api/v1/health`。也可以构建后直接运行 `backend/target/debug/yrkie-backend`（Windows 加 `.exe`）。根目录 `npm run dev` 一起管理前后端、`127.0.0.1:7765` 的独立解析服务及 `127.0.0.1:7766` 的原导出引擎。两项服务分别需要独立 Python 3.12 环境；导出还需要 Node 和 Chromium，安装见 [解析服务](file-parser/README.md) 与 [导出引擎](../packages/doe/packages/doe-export/README.md)。只运行 Rust 命令不会自动启动这两项外部服务。

| 环境变量 | 默认值 | 含义 |
| --- | --- | --- |
| `YRKIE_BACKEND_LISTEN` | `127.0.0.1:7763` | 只允许 IPv4 loopback 地址和非零端口 |
| `YRKIE_DATA_DIR` | 当前工作目录下 `.run-data/backend` | SQLite 与主密钥目录；分发二进制不依赖编译机目录 |
| `YRKIE_FRONTEND_ORIGINS` | `http://127.0.0.1:7762,http://localhost:7762,http://127.0.0.1:7764,http://localhost:7764` | 逗号分隔的完整本机前端 Origin |

环境变量必须显式传给进程；服务不自动读取商业目录或 `.env`。不要将此本机服务反向代理到公网；多用户部署需要独立认证和数据归属设计。

## 模块职责

```text
backend/
  migrations/            # 可审查 SQL 迁移
  resources/doe/         # 10 月 12 日默认配置与来源 manifest
  file-parser/           # 独立 Python/Docling 原文档解析服务
  build.rs               # 构建时校验字节数/SHA-256 并嵌入资源
  src/
    config.rs            # 启动配置和本机监听限制
    http/                # 请求合同、同源边界、安全错误
    models/              # 参数校验、事务仓储、运行时读取
    doe/                 # 配置快照、Skills 读取、纯领域编译服务
    db/                  # SQLite 连接与版本迁移
    security/            # AES-256-GCM 凭据加解密
    ai/                  # OpenAI 文本/图片传输及响应边界
    generation/          # 原 otherone-agent 宿主、DOE 工具、确认阶段和预算
    exports/             # 原导出引擎的不可变快照、任务租约与原子产物
    playback/            # 原正式播放协议的本地快照、同步与备注
    projects/            # 项目、运行、事件和文稿 revision
    assets/              # 真实图片校验、任务回执和项目归属
    attachments/         # 上传草稿、原文件、解析任务及事务绑定
  tests/                 # 真实 SQLite / HTTP / 并发合同测试
```

依赖版本在 `Cargo.lock` 中固定。SQLite 由 `rusqlite` 编译进程序，不需要额外数据库进程。阻塞数据库操作在 Tokio `spawn_blocking` 执行；每次操作独立连接、最长五秒锁等待。

## 模型设置 API

`GET /api/v1/model-settings` 返回：

```json
{
  "revision": 0,
  "settings": {
    "text": { "provider": "custom", "baseUrl": "", "model": "", "hasApiKey": false, "options": {} },
    "image": { "provider": "custom", "baseUrl": "", "model": "", "hasApiKey": false, "options": {} }
  }
}
```

`PUT /api/v1/model-settings` 使用 `{revision,settings:{text,image}}`，两个模型一起保存。每个写入对象只有 `provider`、`baseUrl`、`model`、可选 `apiKey`、`options`；不要回写只读的 `hasApiKey`。revision 必须来自最近一次成功读取／保存，冲突返回 `409`，不会覆盖另一标签页保存的设置。

API key 缺省保留、空串清除、非空替换。如果供应商或规范化后的 Base URL 改变而 key 缺省，则清除旧 key，防止旧厂商凭据被带到新地址。模型 ID 改变不清除同一端点的 key。响应只提供 `hasApiKey`，没有读回原始凭据的接口。

首次配置为两个空 custom 端点。任意一组可以保持空白；非空组必须同时提供合法 Base URL 和模型 ID。URL 只允许 HTTP(S)，不得含用户名／密码、查询参数、片段或空白。预设固定官方 URL，不能写入其他地址。

所有对象拒绝未知字段。请求上限 64 KiB，API key 上限 8 KiB，Base URL 上限 2048 字节，模型 ID 上限 256 字符，额外参数上限 16 KiB／128 个顶层键。错误格式为 `{error:{code,message,field?}}`；`invalid_settings` 为 400，`conflict` 为 409，`storage_unavailable` 为 503。错误不回显请求或凭据，所有响应 `Cache-Control: no-store`。精确校验 Host、Origin 以及浏览器跨站 Fetch 元数据，不提供跨域访问许可。

## 参数与兼容边界

服务商由前后端共享的 `packages/model-catalog/providers.json` 管理：25 个文本预设、7 个图片预设，以及自定义端点。文本使用 `/chat/completions`，图片使用 `/images/generations`；只列入官方文档能确认兼容的接口。预设提供端点地址，不替用户选择模型或宣称所有模型都支持所有参数。各服务商的固定端点和能力标记见 [共享目录](../packages/model-catalog/providers.json)。

文本 Options 包含 `contextWindow`、`thresholdPercentage`、`maxIterations`、`temperature`、`topP`、`maxOutputTokens`、`reasoningEffort`、`toolChoice`、`parallelToolCalls`、`stream`。图片不接受文本专属参数。两类共有 `connectTimeoutSeconds`、`readTimeoutSeconds`、`requestTimeoutSeconds`、`extraParams`。

参数范围和保留字段见 [配置校验](src/models/validation.rs)，预设端点见 [共享目录](../packages/model-catalog/providers.json)。三种超时缺省为 15 / 300 / 900 秒，连接和读取超时不能大于总超时；未填写时按有效默认值一起比较。`extraParams` 必须是 JSON 对象，不得覆盖模型、消息、Prompt、数量、凭据或任何已提供专用输入项的字段。

`ai` 模块把配置构造成真正的 Reqwest HTTP 请求及独立 Agent 预算：

- `contextWindow / thresholdPercentage / maxIterations` 缺省为 `131072 / 0.8 / 8`，只属于宿主 Agent 运行预算，不发送给模型 API；显式更小的预算仍按设置执行，不自动覆盖。
- 采样参数留空即省略，不强塞默认温度或 top-p。`maxOutputTokens` 在 OpenAI／MiniMax 预设映射 `max_completion_tokens`，其他预设映射 `max_tokens`；字段映射由共享目录决定。
- `reasoningEffort: "none"` 明确发送 `reasoning_effort: "none"`；留空才省略。Anthropic 不接受此字段，DeepSeek 限制为 none / low / high / max。
- 按用户选择保留 stream 和并行工具调用请求参数；文本适配器解析普通或 SSE 响应，生成宿主管理工具执行、取消、运行记录和预算。提问和最终提交必须独占一个工具批次，禁止提前确认。
- 图片额外参数作为供应商请求体字段传递；是否支持具体尺寸、质量等由供应商模型决定。仅在共享目录明确支持时发送 `n: 1`，Z.AI／火山方舟／BytePlus 不注入该字段。
- TLS 使用标准证书验证；不跟随重定向，防止凭据随跳转泄露。

生成流程已连接这些配置；新建的 `srv-` 文稿和图片持久化到后端，旧浏览器文稿保留原存储。供应商端点的模型兼容性和账户额度仍由实际调用结果决定，配置保存成功不代表供应商联网验收成功。

生成执行实际调用 `packages/otherone-agent/` 的原 `0.6.0-yrkie.1` SDK，包含九个 crate、83 个源文件；`generation/` 只负责原 DOE 工具、本地事务、上下文、事件和等待状态适配。没有并行维护第二套宿主模型循环。流式批处理、真实推理字段和完成标记处理保留已验证修复，取消原固定工具间等待。框架来源和宿主适配边界见 [SDK 来源说明](../packages/otherone-agent/SOURCE.md)。

## 创作与图片 API

| 接口 | 行为 |
| --- | --- |
| `POST /api/v1/projects` | `{prompt,requestId,uploadIds?}` 创建项目并启动大纲运行 |
| `GET /api/v1/projects` | `{projects:[...]}`，按更新时间列出最多 500 项摘要 |
| `GET /api/v1/projects/{id}` | 项目、大纲、最新运行/事件和可用 Deck 的一致快照 |
| `POST /api/v1/projects/{id}/actions` | `{action,expectedRevision,requestId,message?,answers?,outlineMarkdown?,uploadIds?}`；支持 answer/revise/confirm/retry/chat/cancel，chat 同时校验 expectedDeckRevision，cancel 不接收附件 |
| `PUT /api/v1/projects/{id}/outline` | `{expectedRevision,document:{title,page_count,body:[{id,index,page,contents}]}}`；按项目 revision 自动保存原版大纲卡片，返回完整项目快照 |
| `PUT /api/v1/projects/{id}/deck` | `{expectedRevision,deck}`，以独立 Deck revision 保存 Work 编辑 |
| `GET /api/v1/projects/{id}/assets` | 项目授权的图片元数据列表 |
| `GET /api/v1/projects/{id}/assets/{sha256}` | 校验归属与内容 hash 后返回原始图片 |
| `POST /api/v1/projects/{id}/assets?requestId=...` | 原始 PNG/JPEG/WebP body 上传，返回持久 ImageJob |
| `GET/POST /api/v1/projects/{id}/image-jobs` | 查询图片任务；创建接收 `{requestId,prompt,ratio,removeBackground}` |

项目创建/行为使用事务幂等回执；同 requestId 的不同内容返回冲突，不会再次调用供应商。只有用户的 confirm 请求才能固定当前大纲并进入幻灯片阶段。人工编辑和生成提交都复核 revision；Work 保存响应丢失时，仅允许“恰好落后一个版本、请求 Deck 与已存 JSON 完全相同”的原保存重放，直接返回原记录而不再写入，其他过期请求仍冲突。用户取消先关闭数据库提交权限，再通知在途请求。刷新页面不丢运行，服务重启只标记 interrupted/uncertain，需要显式重试。

大纲自动保存通过原 DOE 序列化/编译器规范化；稳定页面 ID 保留图片计划，重排和删除时同步映射来源，仍被其他页使用的来源页不能删除。生成中和已确认的大纲不可改写；相同内容的一步保存重放不递增版本。它不调用模型或生成图片。

Deck 上限 8 MiB，保留编辑器未知兼容字段；受管引用只能指向当前项目的图片。上传和生成结果只接受真实解码的 PNG/JPEG/WebP，最多 20 MiB、4000 万像素、单边 16384；先原子发布内容寻址文件，再事务提交元数据和项目关联。取消竞争可能留下无关联文件，它不能通过 API 读取或覆盖文稿。配置冻结及模型工具合同分别见 [运行装配](src/generation/agent_runtime.rs) 和 [DOE 工具](src/generation/tools.rs)。

## 原导出与正式播放

导出入口为 `POST /api/v1/projects/{id}/exports/{pdf|pptx}`，接收 `{expectedSourceRevision,embedFonts?}`；任务查询/取消为 `GET/DELETE /api/v1/exports/{id}`，成功文件由 `GET /api/v1/exports/{id}/download` 读取。前端先 flush 并保存，宿主在事务中冻结准确 revision；按源内容、格式和引擎合同去重。原 Python/Node 引擎生成 PDF 与原生可编辑 PPTX，工作者通过租约防止取消、超时或重启后的迟到提交；下载再次校验成品。原文稿不会被导出修改，后续编辑也不会改变已提交快照。

正式播放通过项目 `/playback` 设置、`/playback/access` 角色设置和 `/playback/start` 启动。演讲者/观众链接的快照、SSE、命令、素材和备注接口位于 `/api/v1/playback-links/{link}`。本机拥有者使用 HttpOnly Cookie，随机链接不是公开分享许可；观众不接收演讲备注。翻页、笔迹、激光和黑屏使用原状态协议，备注以 epoch/每页 revision 保存。重启结束临时现场，但保留文稿与备注。具体生命周期见 [播放宿主](src/playback/README.md)。

旧 IndexedDB 文稿保持原存储，在导出或播放前以保存后的不可变快照进入相同宿主；后端的新项目不需要该桥接。

## DOE 配置与运行时

`GET /api/v1/doe-settings` 返回 `{revision,entries}`。每项包含固定 `id/kind/name/description/source`、当前 `content/enabled`、默认 `defaultContent/defaultEnabled` 和 `isModified`。21 项资源包括 System、Outline Schema、Slide Schema 以及 18 个设计 Skills；三项关键配置必须启用，Skills 可独立启停。两份 Schema 是给 Agent 的 Markdown 作者协议，不是可替换编译器语法的 JSON Schema。

`PUT /api/v1/doe-settings` 接收 `{revision,entries:[{id,content,enabled}]}`，必须包含所有固定 ID 一次，不能添加、重命名或删除资源身份。全量保存一次比较 revision、写覆盖、递增 revision、记录不可变快照，再返回新的配置。相同内容的保存不生成空版本。恢复默认通过提交默认内容实现，使用相同 CAS 边界，不绕过冲突检查。错误格式与模型配置相同，定位字段为 `entries.{id}.content` 或 `.enabled`。

正文不得为空或包含 NUL；单个 Skill 最大 64 KiB，Prompt／Schema 最大 512 KiB，整个配置正文最大 2 MiB。HTTP 请求上限 8 MiB，容纳 JSON 转义。默认资源构建时校验原始字节数和 SHA-256 并嵌入二进制；安装运行时不依赖源码目录。启动时同步已审计默认值，保留显式本地覆盖并记录新的完整 revision；与新默认值相等的覆盖自动归零。资源身份或类型的删除／变更必须有显式数据库迁移，启动不能静默丢弃用户配置。

`doe::Repository::resolve()` 一次性读取 System、两份 Schema、启用 Skill 的目录以及统一 revision。生成宿主将该 revision 绑定到运行；`read_skill(revision,id)` 从不可变历史读取当时启用的 Skill，当前停用或修改不会改变已经冻结的版本。配置域与执行工具、模型网络调用及 Run 持久化各自独立。

## DOE 编译 API

`POST /api/v1/doe/compile` 接收 `{kind:"outline"|"slide",markdown:string}`，调用从同一基线迁移的 `doe-document` Rust 编译器，底层依赖 `doe-core` 与 `doe-component`。成功返回 `200 {kind,valid:true,document,markdown,diagnostics}`，其中 Markdown 是规范序列化结果；作者语法失败返回 `422 {kind,valid:false,diagnostics}`。输入最大 2 MiB，未知字段和错误请求结构返回 `400 invalid_document`。它只编译／诊断，不保存稿件、不执行资产地址请求、不调用 AI；前端编辑器没有被强制切换为新的存储路径。

## 数据、备份与回退

会话历史使用 `GET /api/v1/projects/:id/conversation?after=N` 分页读取；`GET /api/v1/projects/:id/events` 提供带事件游标的 SSE，支持 `Last-Event-ID` 续接。运行事件先落库再展示，断线不重发模型请求。`actions` 新增 `chat`，同时核对项目 `expectedRevision` 和画布 `expectedDeckRevision`；原位修改复用 DOE 作者编译器与稳定页面 ID。流式响应默认开启，Settings 可显式关闭；提供商只返回 JSON 时保留正常完整结果。

运行目录保存 `yrkie.sqlite3`、SQLite WAL/SHM 文件、`master.key`、`assets/`、附件原文件 `attachments/` 和成功导出成品 `exports/`；两项服务的本机令牌、解析工作区及 `export-runtime/` 资源镜像/字体缓存同样位于该目录。进程启动先占监听端口并持有 `server.lock` 的 OS 文件锁，再迁移和恢复中断任务，防止两个进程共享运行目录。锁随进程退出自动释放。迁移在一个事务内更新 `schema_migrations` 和 `PRAGMA user_version`，启动核对两者一致；更高版本或不一致的数据库会停止启动。

当前 schema 版本为 8，按 `0001_model_settings` → `0002_provider_catalog` → `0003_doe_settings` → `0004_generation` → `0005_conversation` → `0006_attachments` → `0007_exports` → `0008_playback` 升级。第二版在保留模型原值与密文的前提下，将供应商角色改为共享目录同步的复合外键；第三版增加 DOE 配置域，第四版增加项目、运行、幂等回执和资产域；第五版增加持久会话事件、原位聊天编辑回执与旧历史补录标记；第六版增加上传身份、解析状态、完整文档正文、项目绑定与上传取消记录；第七版保存不可变导出快照、任务租约和成品校验信息；第八版保存播放角色链接、冻结快照与每页演讲备注。升级在一个事务内完成，迁移失败回滚所有表变更。上传合同和容量见 [附件服务](src/attachments/service.rs) 与 [解析服务说明](file-parser/README.md)，模型输入预算见 [附件上下文适配](src/generation/attachments.rs)。

`model_settings_state` 是模型整体 revision，`model_configs` 以 text／image 为主键，`model_provider_kinds` 提供目录角色约束。DOE 使用独立 `doe_settings_state`、`doe_defaults`、`doe_overrides`、`doe_revisions`，默认资源与本地覆盖分离，历史版本保留完整有效内容。两类配置互不递增对方 revision。SQLite 约束限定角色、字段长度、有效 JSON、revision 和空端点一致性；使用 WAL + FULL 同步、`BEGIN IMMEDIATE` 完成原子保存。

API key 用 AES-256-GCM 加密，随机 nonce，密文绑定 text／image 角色；数据库不保存明文。主密钥首次启动随机生成，独立保存在 `master.key`；Unix 目录权限 0700、密钥 0600，Windows 使用本地目录 ACL，应由当前用户私有持有。加密用于保护数据库单独泄露的情况，数据库和主密钥不可一起公开提交。

备份时停止后端，将整个运行目录复制到受保护的备份位置；恢复时同样停服务，数据库与主密钥必须来自同一套备份。主密钥缺失或不匹配时停止启动，不生成新 key 覆盖已有数据库。不支持通过删除新表或覆盖旧数据库来回退；回退代码时保留数据目录，只使用兼容当前 schema 的程序。

## 验证

```sh
cargo test --locked --manifest-path backend/Cargo.toml
```

测试源在 `backend/tests` 及对应模块内；可丢弃的 SQLite 文件进入根目录忽略的对应 `test/<date>-<task>/`。定向测试覆盖加密与重启、参数和同源 HTTP 边界、升级后凭据保留、DOE 配置、项目/Deck CAS、取消与并发、Unicode 问答恢复、素材授权，以及隔离供应商夹具驱动的生成与图片传输。夹具测试不调用收费模型，不应称为特定真实模型的质量验收。
