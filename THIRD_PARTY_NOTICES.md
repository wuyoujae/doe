# 第三方代码与资源

根 `LICENSE` 的 Apache-2.0 适用于本项目作者有权许可的代码。下列代码、字体和资源保留各自许可，不因迁入本仓库而改用 Apache-2.0。请保留 `NOTICE`、本文件及模块内的原始版权与许可文件。

## 随源码分发

| 内容 | 来源与许可 | 仓库内许可及来源记录 |
| --- | --- | --- |
| Otherone Agent SDK | Otherone contributors，MIT | `packages/otherone-agent/LICENSE`；`SOURCE.md`、`UPSTREAM_FILES.json` 记录迁入来源与本地补丁 |
| Lucide 图标与浏览器运行库 | Lucide contributors，ISC；部分源自 Cole Bemis 的 Feather，MIT | [完整声明](licenses/lucide-ISC.txt)；浏览器库保留原许可头 |
| SVG path-data-parser | Preet Shihn，MIT | [完整声明](licenses/path-data-parser-MIT.txt)；由 npm 锁文件锁定安装 |
| PPTX OPC URI 与 POM proxy 的适配基础 | python-pptx，Steve Canny，MIT | [完整声明](licenses/python-pptx-MIT.txt)；仅对应 `python/pptx2html/opc/packuri.py`、`pom/shared.py`，详见[导出来源记录](packages/doe/packages/doe-export/README.md#源码来源与第三方归属) |
| MiSans | Xiaomi Inc.，MiSans 独立许可协议 | [原始协议 PDF](packages/doe/packages/doe-theme/src/assets/fonts/misans/LICENSE.pdf)；[字体声明](packages/doe/packages/doe-theme/src/assets/fonts/THIRD_PARTY_NOTICES.md) |
| Alexandria、Caveat、EB Garamond、Fredoka、IBM Plex Mono、Tomorrow、ZCOOL QingKe HuangYou | 各字体作者，SIL OFL 1.1 | `packages/doe/packages/doe-theme/src/assets/fonts/` 各字体目录的 `OFL.txt` |
| Infaxiswield Humanist 的字体来源 | Lora、Source Han Serif，SIL OFL 1.1 | `infaxiswield-humanist/OFL-Lora.txt`、`OFL-SourceHanSerif.txt`，保留原作者及保留名称条款 |
| 前端及兼容字体 | EB Garamond、Lora、Noto Sans SC、Outfit、Cormorant Garamond、Fraunces、Inter、Manrope、Playfair Display，SIL OFL 1.1 | `frontend/public/fonts/` 及 DOE `assets/compatibility/fonts/` 内的 `OFL*.txt` |

MiSans 随应用使用，不能将其视为 Apache/OFL 字体独立转售、修改或重新许可；具体条件以原始协议为准。根许可证也不赋予第三方品牌或商标权。

## 安装的依赖

npm、Cargo 和 Python 依赖由各自清单及锁文件管理，其安装包保留各自许可。第三方依赖不属于本项目自行重新许可的代码。SDK 的 MIT、字体 OFL、Lucide ISC 等声明同样适用于相应内容进入浏览器 bundle 的情况。

导出引擎的直接 Python 依赖包括 Brotli（MIT）、defusedxml（PSFL）、fonttools（MIT 及附属声明）、lxml（BSD-3-Clause 及附属声明）、Pillow（MIT-CMU）、python-pptx（MIT）、skia-pathops（BSD-3-Clause）、typing_extensions（PSF-2.0）和 XlsxWriter（BSD-2-Clause）。解析器使用 Docling 及其组件；解析模型单独下载，遵循模型发布者条款，未随源码捆绑。

本仓库不分发虚拟环境、`node_modules`、Chromium 或模型权重。若后续制作容器、安装包、二进制或独立静态 bundle，需要随成品保留实际打包依赖的完整许可证、版权及附属声明；这份索引不能替代它们。
