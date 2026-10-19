# 本地附件解析服务

从商业版 2026-10-12 基线迁移的 Docling 解析核心。Rust 后端负责上传、原文件、任务状态、项目归属和已解析正文；此 Python 服务仅将受限文档转换为完整 Markdown，不连接商业数据库或对象存储。

支持 PDF、DOCX、PPTX、XLSX、HTML/HTM、Markdown、CSV，以及 UTF-8 TXT 和 JSON。文档上限 30 MiB、500 页、2,000,000 正文字符。保留原版 MIME/文件头匹配、OOXML 压缩炸弹和 XML 防护、密码保护检测、转换超时及失败分类。不会静默截断正文。

图片由 Rust 完整解码、校验、清除传给模型的容器元数据，并接入原多模态消息及项目素材。原版音视频依赖商业 Kodo 重签链接，Python 相应入口未实现；本地版本不开放该上传范围，不假装提供转录。

使用 Python 3.12，直接依赖与基线 `pyproject.toml` 一致（Docling 2.132.0）。全新安装：

```powershell
python -m venv backend/file-parser/.venv
backend/file-parser/.venv/Scripts/python -m pip install --require-hashes -r backend/file-parser/requirements.lock
backend/file-parser/.venv/Scripts/python -m pip install --no-deps -e backend/file-parser
```

Linux/macOS 使用 `.venv/bin/python`。可用 `YRKIE_PARSER_PYTHON` 指定预先准备好的兼容 Python 解释器。首次初始化 PDF OCR/表格模型可能下载官方模型；可预先在该虚拟环境使用 `docling-tools models download layout tableformer rapidocr` 准备用户缓存。

`npm run dev` 通过 `scripts/file-parser.mjs` 管理独立进程；也可单独运行 `node scripts/file-parser.mjs`。它监听 `127.0.0.1:7765`，在当前 `YRKIE_DATA_DIR`（默认 `.run-data/backend`）生成独立 `parser-token`；令牌只留在本机，不写进源码或日志。helper 清除继承的商业 parser/admin 错误上报配置。临时解析文件在同一数据目录的 `parser-temp`。

`GET /healthz` 检查进程，`GET /readyz` 检查转换器。内部 `POST /v1/documents/parse` 需要独立令牌。解析超时后原运行时退出码 70 触发 helper 重启，避免 native OCR 永久占用转换槽。上传任务在 SQLite 中持久化，后端重启会恢复未完成任务；失败可重试时使用原文件重新解析。
