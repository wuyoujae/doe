import { slide as __doeFn_slide } from '../../slide/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.js:1584
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.itemScene = (id, name, blocks) => ({ id: `gallery-contents-${id}`, name: `组件展厅 · ${name}`, schema: (0, __doeFn_slide)(`gallery-contents-${id}`, blocks) });
}
