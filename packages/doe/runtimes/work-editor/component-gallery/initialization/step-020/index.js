import { slide as __doeFn_slide } from '../../slide/index.js';
import { container as __doeFn_container } from '../../container/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.js:1641
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideDemoSchemas.push(...[["image-text", "上图下文"], ["icon-text", "上图标下文"]].map(([type, label]) => ({
    id: `gallery-${type}`, name: `组件展厅 · ${label}`,
    schema: (0, __doeFn_slide)(`gallery-${type}`, [
      (0, __doeScope.peerHeading)(`${type}-heading`, label),
      (0, __doeFn_container)(`${type}-row`, "row", (0, __doeScope.peerItems)(3).map((item, index) => ({
        id: `${type}-${index}`, type,
        props: { title: item.title, text: item.text, ...(type === "image-text" ? { src: "./assets/smart-city-poster.png", alt: item.title } : { icon: item.icon }) },
      }))),
      (0, __doeScope.peerNotice)(`${type}-notice`),
    ]),
  })));
}
