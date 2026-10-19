# DOE 领域核心迁移

从 `98cbdd5736535e14bab4593973b33fddd4a99c64` 保留原始 DOE core、component、document Rust 包及编译所需的同包源文件/固定 fixtures。沿用当前前端目录，原有 TypeScript、样式和主题注册表不覆盖。

- [x] 复制三个独立 crate 与 `#[path]` / `include_str!` 依赖闭包，核对已存在同名资源。
- [x] 建立仅含三个领域包的 Cargo workspace，保留原固定依赖和作者协议。
- [x] Cargo check 与大纲/页面 Markdown 两项定向 smoke 通过；向独立后端提供真实编译入口。
- [x] 更新 `docs/DOE_MIGRATION.md` 的核心边界、来源与验证。

宿主负责模型请求、配置快照、持久化、revision CAS、素材授权及运行回执；领域包不引入商业 PostgreSQL、账户或计费。回退只回退代码，保留本地文稿和配置数据。
