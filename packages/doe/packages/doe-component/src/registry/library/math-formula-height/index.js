// Origin: public/yrkie-doe/layout-engine/library-components.js:330
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function mathFormulaHeight(props, width, density) {
    const api = __doeScope.global.PPTComponents?.mathFormula;
    const formula = props?.content?.formula || "";
    const natural =
      typeof api?.estimateHeight === "function"
        ? api.estimateHeight(formula, width)
        : 48;
    return natural;
  }
