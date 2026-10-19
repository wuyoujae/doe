import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:344
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function dataTableHeight(props, _width, density) {
    const rows = props.content?.rows || [];
    const naturalHeight = (0, __doeFn_clamp)((rows.length + 1) * 58 + 4, 160, 520);
    return Math.round(naturalHeight * (__doeScope.densityScale[density] || 1));
  }
