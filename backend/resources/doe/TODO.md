# DOE 默认资源迁移

目标：从已确认的 2026-10-12 源码基线保留直接 DOE 作者实际消费的 System、Outline/Slide 作者协议和启用设计 Skills。商业运行数据和旧委托 Agent 配置不进入开源版。

- [x] 核实 `doe-direct-v1` 的三个活动配置键及 Skills 目录。
- [x] 按 Git blob 原始字节迁移默认正文，建立稳定 ID、来源路径及 SHA-256 清单。
- [x] 记录纯 DOE Rust 核心与宿主职责边界，交付后端配置模块消费。
- [x] 核实 21 份正文的哈希/大小及 18 份 Skills 的主题 ID；不把资源迁移描述为生成工作流已接通。
- [x] 迁入 doe-core / doe-component / doe-document Rust 领域包及实际编译依赖，不覆盖既有前端和主题资源。
- [x] 通过独立 Cargo 检查与小型大纲/页面编译验证，向后端交付同一领域入口。

默认正文由 `manifest.json` 声明并在构建期嵌入。用户配置保存在独立 SQLite，升级默认资源不得覆盖本地修改；回退保留本地数据库和 revision 历史。
