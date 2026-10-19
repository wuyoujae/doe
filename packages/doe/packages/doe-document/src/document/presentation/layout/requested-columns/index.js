import { isContentsGroup as __doeFn_isContentsGroup } from '../is-contents-group/index.js';
import { contentsMaximumColumns as __doeFn_contentsMaximumColumns } from '../contents-maximum-columns/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../edge-media-axis/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { balancedAutoGridColumns as __doeFn_balancedAutoGridColumns } from '../balanced-auto-grid-columns/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7207
import { scope as __doeScope } from "../../runtime/context/index.js";

export function requestedColumns(group) {
    const count = Math.max(1, group.node.children.length);
    if ((0, __doeFn_isContentsGroup)(group.node)) {
      const requested = group.node.layout.variant === "stack" || (group.node.layout.variant === "composition" && group.node.layout.direction === "stack") ? 1 : Number(group.node.layout.columns) || 3;
      return Math.min(count, requested, (0, __doeFn_contentsMaximumColumns)(group.node));
    }
    if ((0, __doeFn_isEdgeSplitGroup)(group.node)) {
      return (0, __doeFn_edgeMediaAxis)((0, __doeFn_edgeMediaPosition)(group.node)) === "row" ? 2 : 1;
    }
    if ((0, __doeFn_isCompositionGroup)(group.node)) {
      return group.node.layout.direction === "stack"
        ? 1
        : Math.min(count, __doeScope.MAX_COMPOSITION_ITEMS);
    }
    if (group.node.layout.variant === "stack") return 1;
    if (group.node.layout.variant === "row") return count;
    if (group.node.layout.variant === "grid") {
      return (
        Number(group.node.layout.columns) ||
        Math.min(count, group.node.layout.maxColumns || 4)
      );
    }
    const explicitColumns = Number(group.node.layout.columns);
    if (Number.isFinite(explicitColumns) && explicitColumns > 0) {
      return Math.min(count, Math.round(explicitColumns));
    }
    return (0, __doeFn_balancedAutoGridColumns)(
      count,
      group.node.layout.maxColumns || 4,
    );
  }
