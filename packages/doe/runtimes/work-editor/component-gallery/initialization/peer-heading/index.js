// Origin: public/yrkie-doe/work-editor/component-gallery.js:1582
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.peerHeading = (id, text) => ({ id, type: "heading", props: { text, level: 2 } });
}
