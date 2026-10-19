// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1255
import { scope as __doeScope } from "../runtime/context/index.js";

export function planningGap(node) {
    if (node.layout?.gap === 0) return 0;
    return __doeScope.engine.SPACING_TOKENS[node.layout?.gap] ?? __doeScope.engine.SPACING_TOKENS["18pt"];
  }
