import { slide as __doeFn_slide } from '../../slide/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.js:1625
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideDemoSchemas.push(...[
    ["semicircle", "半圆内容", 3], ["petals", "花瓣内容", 3],
    ["stairs", "阶梯内容", 4], ["pyramid", "分层三角内容", 4],
    ...[2, 4, 5, 6].map(count => ["semicircle", `${count} 段半圆内容`, count]),
    ...[2, 4, 5, 6, 7, 8].map(count => ["petals", `${count} 瓣花内容`, count]),
    ...[2, 3, 4, 5, 6].map(count => ["cycle-arrows", `${count} 项旋转箭头内容`, count]),
    ...[2, 3, 4, 5, 6].map(count => ["full-circle", `${count} 项全圆内容`, count]),
    ...[2, 3, 4, 5, 6].map(count => ["ring", `${count} 项圆环内容`, count]),
  ].map(([variant, label, count]) => ({
    id: `gallery-shape-contents-${variant}${count === 3 || !["petals", "semicircle", "cycle-arrows", "full-circle", "ring"].includes(variant) ? "" : `-${count}`}`, name: `组件展厅 · ${label}`,
    schema: (0, __doeFn_slide)(`gallery-shape-contents-${variant}${count === 3 || !["petals", "semicircle", "cycle-arrows", "full-circle", "ring"].includes(variant) ? "" : `-${count}`}`, [
      (0, __doeScope.peerHeading)(`shape-${variant}-heading`, label),
      { id: `shape-${variant}`, type: "shape-contents", props: { variant, items: [...(0, __doeScope.peerItems)(count), ...["成效复盘", "持续优化"].slice(0, Math.max(0, count - 6)).map(title => ({ title, text: "确认业务约束" }))].map(({ title, text }) => ({ title, text })) } },
      (0, __doeScope.peerNotice)(`shape-${variant}-notice`),
    ]),
  })));
}
