// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7167
import { scope as __doeScope } from "../../runtime/context/index.js";

export function resolveColumnCount(width, requested, count, minimumWidth = 240, gap = 24) {
    return __doeScope.global.DOEContentsLayout.resolveColumns(width, requested, count, minimumWidth, gap);
  }
