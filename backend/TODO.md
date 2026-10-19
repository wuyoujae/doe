# 本地创作后端

## 完整 DOE 生成的数据与接口（2026-10-19）

当前范围由用户授权扩为 Create → 偏好问答 → 大纲审阅/确认 → 图片与幻灯片生成 → Work 编辑。下方模型设置和 DOE 配置记录保留历史范围，不再代表“只有配置”的当前状态。

- [x] `0004_generation` 增加项目、运行、事件、请求回执和图片元数据/关联；SQLite 事务隔离保证轮询读快照一致。
- [x] `src/projects/` 管理服务端 ID、项目与 Deck 独立 revision、显式确认、取消 fence、重启中断与可重试回执；完整用户事实写入新运行事务，首轮失败仍保留。
- [x] `src/assets/` 校验 PNG/JPEG/WebP、尺寸和 SHA-256，原子发布文件再提交项目关联；图片任务去重，未知供应商结果标记 uncertain 而不自动重新收费。
- [x] `src/http/generation_routes.rs` 提供项目/行为/Deck/资产/图片任务 API，复用精确 Host/Origin 和无缓存边界。
- [x] `main.rs` 在迁移前占监听端口并持有数据目录 OS 文件锁；只有进程拥有者恢复中断运行。
- [x] 14 项集成测试通过：新项目存储 4 项、既有模型 6 项及 DOE 配置/升级 4 项。实际 Agent/传输流程由 `src/generation/` 与对应测试负责，不能把存储测试称为收费模型验收。

升级前停止后端，备份整个 `.run-data/backend`，包括数据库、主密钥和资产。回退保留新 schema，使用兼容程序；不做删表或覆盖式回退。旧 IndexedDB 文稿仍由不带 `srv-` 的 ID 访问。生成时取消与文件发布之间的极短竞争可能留下没有数据库关联的内容寻址文件；它无法通过 API 读取，也不会覆盖文稿，不在正常启动中进行破坏性清理。

## DOE 配置与统一服务商目录（2026-10-18）

用户已要求迁入 DOE 专用 Skills、提示词、Schema 并在设置中编辑。以 10 月 12 日资源为默认值，不复制商业数据库或账户模块。

- [x] `resources/doe/` 经来源审计后在构建期嵌入；`src/doe/` 提供默认值、事务覆盖、不可变 revision 快照与运行时读取。
- [x] `migrations/0002_*` 扩展共享服务商目录约束，保留原模型、加密密钥与 revision；`0003_*` 增加独立 DOE 配置表。
- [x] `GET/PUT /api/v1/doe-settings` 全量 CAS；固定资源身份，仅允许改正文和 Skills 启用状态；恢复默认仍走同一保存事务。
- [x] 请求限制、字段校验、并发冲突和资源更新保留覆盖均经过定向验证。
- [x] `POST /api/v1/doe/compile` 实际调用迁入的纯 DOE 领域编译器，返回 Outline／Slide 文档、规范 Markdown 与诊断；不保存文稿或执行模型请求。
- [x] 更新后端运行及回退文档；14 项后端定向测试通过，不将配置基础描述为生成链路完成。

共享目录 `packages/model-catalog/providers.json` 同时被前后端消费，供应商 URL、角色和请求字段只维护一次。数据库升级按顺序事务执行，运行数据升级前由主任务备份。回退保留新库与主密钥，不执行删表或覆盖式旧库恢复；旧版本遇到新 schema 必须拒绝启动。

## 模型配置阶段范围（已完成）

该阶段接入独立开源版的文本／图片模型配置、OpenAI 兼容协议参数和本地数据库；完整生成链现由 `generation/`、`projects/`、`assets/` 接入。商业版只作源码参考，不复制账户、数据库、凭据或运行状态。

## 实现路径与决策

- `src/config.rs`：本地监听和运行目录配置；默认仅监听 `127.0.0.1:7763`。
- `src/http/`：版本化 API、请求大小限制、精确 Host／Origin 校验、无缓存响应与安全错误。
- `src/models/`：文本／图片 DTO、参数校验、端点预设、数据库事务和运行时配置读取。
- `src/db/`、`migrations/`：SQLite WAL、版本迁移、单例全局 revision、两类模型的唯一记录。
- `src/security/`：服务端 AES-256-GCM 密钥加密；主密钥只保存在忽略的本地运行目录。
- `src/ai/`：OpenAI 请求字段与本地 Agent 预算映射；不引入无用途的商业模块。

`GET /api/v1/model-settings` 返回 `{revision,settings:{text,image}}`。`PUT` 使用相同 revision 做一次事务 CAS，两个模型一起提交。响应不返回 API key，只返回 `hasApiKey`；写入缺省保留、空串清除、非空替换。首次 revision 为 0。

SQLite 采用 `model_settings_state` 单例行以及 `model_configs` 两行。主键和 CHECK 约束限定角色、供应商、revision、必要字段和合法 JSON。参数 JSON 是版本化 DTO 的聚合，不允许任意字段。不存在用户体系，因此数据库范围明确为当前本地安装的拥有者。

## 风险与回退

- 本机模式不提供公网多用户认证；监听范围不能被环境变量扩成公网。前端通过同源代理连接。
- 主密钥与数据库必须成套备份。已有加密数据但主密钥缺失／不匹配时停止启动，不生成新密钥覆盖。
- 配置失败／冲突不覆盖现有记录。没有自动从商业数据库或浏览器导入凭据。
- 回退停止新服务并保留运行目录；不执行反向删表或覆盖式旧库恢复。旧前端本地配置与新数据库独立。

## 检查项

- [x] 确定框架真实支持的参数并冻结 DTO；图片仅超时和额外 JSON，不加入未消费的框架字段。
- [x] 实现迁移、密钥存储、模型读取和事务 CAS；增加 schema_migrations 回执与 user_version 一致性检查。
- [x] 实现受限 HTTP 服务与运行参数适配；OpenAI 最大输出映射 max_completion_tokens，其他兼容端点为 max_tokens。
- [x] 验证并发冲突、密钥不回显、缺省保留／清除、非法参数和跨站拒绝；6 项集成测试及 1 项输出字段定向测试通过。
- [x] 更新 README 的启动、API、数据备份与未接通边界。

## 2026-10-19：原版 AI 会话与聊天编辑

- [x] 复用 MessagePanel、ToolChips、ThinkingState、Markdown 和原问题卡，保留回答及工具详情。
- [x] 持久会话事件、分页、SSE 续接；默认流式，正文/工具参数/大纲草稿逐步输出。
- [x] 当前文稿 ReadSlide/EditSlide/SetDeckTheme；保存前置、revision CAS、工具幂等、取消与重启保护。
- [x] AI 运行期间只读画布，显式 flush 保留先前修改，完成后恢复编辑。
- [x] 原 Agnes 图片合同适配与错误分类；供应商诊断见 docs/IMAGE_PROVIDER_COMPATIBILITY.md。