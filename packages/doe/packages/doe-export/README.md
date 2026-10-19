# 原版 DOE PDF / PPTX 引擎

源代码固定来自商业版提交 `98cbdd5736535e14bab4593973b33fddd4a99c64` 的 `app/doe/packages/doe-export/{python,node}`。迁移保持原生布局、字体、Canvas 冻结、语义 IR 和 OOXML 算法；本地宿主不读取商业运行目录、账户、数据库或配置。

## 安装

需要 Python 3.12、项目规定的 Node 和 Chromium。Python、npm 依赖独立锁定：

```powershell
cd packages/doe/packages/doe-export/python
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.lock
npm ci
npx playwright-core install chromium
```

Linux 使用 `.venv/bin/python`，并安装 Chromium 所需的系统库。浏览器可由 `PLAYWRIGHT_BROWSERS_PATH` 或 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定；自定义 Python 入口为 `YRKIE_EXPORT_PYTHON`。依赖不得指向商业仓库。

## 宿主适配补丁（2026-10-19）

`python/schema_v4_renderer.js` 与 `node/browser/snapshot/browser/find-browser-executable/index.cjs` 的浏览器查找改为：显式 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` → 当前 Playwright 的 `chromium.executablePath()` → 可用的系统 Chrome/Edge。移除了开发者用户名和固定 Chromium build 路径；这两处不再宣称与原版逐字节一致，原渲染、几何和 OOXML 算法保持。

`architecture/export-manifest.json` 的 `sha256` / `sourceHash` 保留迁移来源指纹，对应条目的 `localSha256` 记录本次适配后的实际文件字节，`revisionReason` 说明差异。

## 源码来源与第三方归属

`pptx2html` 经原 Yrkie 仓库迁入，早期来源是本机独立的 PPTX/HTML 引擎项目，不能仅按包名归属于公开同名项目。可核对的 `python/pptx2html/opc/packuri.py` 与 `python/pptx2html/pom/shared.py` 基础实现分别对应 python-pptx 的 [PackURI](https://github.com/scanny/python-pptx/blob/v1.0.2/src/pptx/opc/packuri.py) 与 [XML proxy 类](https://github.com/scanny/python-pptx/blob/v1.0.2/src/pptx/shared.py)；本仓库为这些适配部分保留 Steve Canny 的 MIT 归属和[官方许可全文](../../../../licenses/python-pptx-MIT.txt)。这不将整个目录认定为第三方，也不以根 Apache-2.0 替换该 MIT 许可。

来源比对只能确认这些实现的对应关系，不能证明其他文件全部原创。其余标准字段、通用短函数和既有业务算法没有据此批量添加版权声明。完整调用链仍保留，未移除原解析、HTMLIR 或导出功能。

## 执行与持久数据

宿主 `scripts/export-runtime.mjs` 从当前 DOE manifest 编译独立磁盘资源镜像，补齐字体，预热原版服务后才报告就绪。原服务仅监听 `127.0.0.1:7766`；Bearer 令牌在本机数据目录 `export-token`，不会传给浏览器。启动器不继承商业错误上报配置。

`YRKIE_DATA_DIR`（默认 `.run-data/backend`）下的 `export-runtime/` 保存资源镜像和字体缓存，`exports/` 保存成功成品；SQLite `presentation_exports` 保存不可变稿件快照与任务元数据。生产不能依赖 `test/`。升级前备份该数据目录；回退不覆盖新稿件或新导出文件。

前端先 flush 并保存，再提交准确的源 revision。任务按源内容、格式、Renderer/Writer 合同和字体选择去重；原稿继续编辑不改变已提交的快照。两名本地工作者使用 60 秒租约、10 秒续期，重启回收过期任务；取消或失去租约的旧工作者不能发布文件。先写入、同步临时文件，再在租约事务内发布成品；下载重新校验文件签名、长度与 SHA-256。

## 原格式合同

- PowerPoint：原生可编辑对象、文字及图表；字体可选择嵌入。默认 `editable`，不使用整页截图替代。
- PDF：与编辑器共用冻结 DOM，Chromium 保留可选文字和矢量；页面为 `960 × 540 pt`。
- 严格等待字体、图片和排版就绪；溢出、缺失图片、不完整页面或无效成品明确失败，不静默漏页。
- 原引擎最多 300 页；宿主沿用现有稿件大小限制，成品上限 128 MiB。动态图像按冻结画面导出，演讲备注不加入输出。

账户、订阅、水印权益和公开分享属于商业宿主，不复制到本机单拥有者应用。这里不为迁入范围外的 Copyist/HTML 产品开放新接口，相关底层代码作为原引擎的实际依赖保留。

## 本机正式宿主验证（2026-10-19）

通过新任务 API 导出当前完整 14 页文稿：PDF 为 7,251,242 bytes，14 页均为 `960 × 540 pt`，包含 6807 字符可选文本；PPTX 为 5,519,542 bytes，14 页包含 253 个可编辑文本 run、8 个媒体部分和 8 个嵌入字体部分。两个格式完成后，源稿 revision 41 和整稿内容 SHA 保持不变。过期 revision 返回 409，重复提交复用同一任务。

原引擎 25 项定向回归、宿主 4 项快照/合同/租约/取消/文件完整性测试和前端类型检查通过。这些是当前本机完整流程与明确异常边界的验证，不代表任意输入或所有环境都已覆盖。临时文件在忽略的 `test/20261019-original-core/`，正式成功产物保存在本机数据目录。
