import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { resolveSpacingToken as __doeFn_resolveSpacingToken } from '../resolve-spacing-token/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7241
import { scope as __doeScope } from "../../runtime/context/index.js";

export function columnNodeMinimum(node) {
    if (node.type !== "layout-group") {
      const definition = __doeScope.components.get(node.type);
      const contentMinimum = definition?.resolveLayoutContract?.(node.props || {})?.minWidth;
      return Math.max(240, Number(definition?.columnMinWidth ?? contentMinimum ?? definition?.minWidth) || 240);
    }
    const widths = (node.children || []).map(columnNodeMinimum);
    if ((0, __doeFn_isCompositionGroup)(node) && node.layout.direction === "row") {
      return widths.reduce((sum, width) => sum + width, 0) + (0, __doeFn_resolveSpacingToken)(node.layout.gap, 0, "18pt") * Math.max(0, widths.length - 1);
    }
    return Math.max(240, ...widths);
  }
