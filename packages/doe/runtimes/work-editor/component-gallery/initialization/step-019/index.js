// Origin: public/yrkie-doe/work-editor/component-gallery.js:1636
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
for (const variant of ["quote", "bubble"]) __doeScope.global.SlideDemoSchemas.push((0, __doeScope.itemScene)(`four-${variant}`, variant === "quote" ? "引号卡片 · 四项混排" : "气泡卡片 · 四项混排", [
    (0, __doeScope.peerHeading)(`${variant}-heading`, variant === "quote" ? "引号卡片" : "气泡卡片"),
    { id: `${variant}-four`, type: "item-cards", props: { variant, items: (0, __doeScope.peerItems)(4) } }, (0, __doeScope.peerNotice)(`${variant}-notice`),
  ]));
}
