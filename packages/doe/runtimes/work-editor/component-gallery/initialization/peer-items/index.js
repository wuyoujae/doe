// Origin: public/yrkie-doe/work-editor/component-gallery.js:1581
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.peerItems = (count) => __doeScope.peerTitles.slice(0, count).map(title => ({ title, text: "确认业务约束", icon: "Target" }));
}
