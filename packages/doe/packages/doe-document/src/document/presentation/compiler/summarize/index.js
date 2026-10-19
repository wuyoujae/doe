import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { contractFor as __doeFn_contractFor } from '../contract-for/index.js';
import { isCollection as __doeFn_isCollection } from '../is-collection/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { directionOf as __doeFn_directionOf } from '../direction-of/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:553
import { scope as __doeScope } from "../runtime/context/index.js";

export function summarize(node) {
    if (!(0, __doeFn_isGroup)(node)) {
      const contract = (0, __doeFn_contractFor)(node) || {};
      return {
        role: contract.role || "flow",
        minWidth: Math.max(1, Number(contract.minWidth) || 260),
        preferredWidth: Math.max(
          Number(contract.minWidth) || 260,
          Number(contract.preferredWidth) || 360,
        ),
        minHeight: Math.max(0, Number(contract.minHeight) || 0),
        preferredHeight: Math.max(0, Number(contract.minHeight) || 0),
        priority: Number(contract.priority) || 50,
      };
    }
    const children = (node.children || []).map(summarize);
    // Local clusters may carry collectionKey so an outer collection can
    // validate them, but their own geometry is a composition row/stack.
    if ((0, __doeFn_isCollection)(node) && !(0, __doeFn_isLocalCluster)(node)) {
      const gap =
        __doeScope.engine.SPACING_TOKENS[node.layout?.gap] ||
        __doeScope.engine.SPACING_TOKENS["18pt"];
      const minimum = Math.max(1, ...children.map((child) => child.minWidth));
      const preferredItem = Math.max(
        minimum,
        ...children.map((child) => child.preferredWidth),
      );
      const requestedColumns = Number(node.layout?.columns);
      const preferredColumns = Math.max(
        1,
        Math.min(
          children.length || 1,
          Number(node.layout?.maxColumns) || 4,
          Number.isFinite(requestedColumns) && requestedColumns > 0
            ? requestedColumns
            : 2,
        ),
      );
      const childMinHeights = children.map((child) => child.minHeight || 0);
      const estimatedRows = Math.max(
        1,
        Math.ceil(children.length / preferredColumns),
      );
      const estimatedRowHeight = Math.max(0, ...childMinHeights);
      return {
        role: children.every((child) => child.role === "compact")
          ? "compact"
          : "collection",
        minWidth: minimum,
        preferredWidth:
          preferredItem * preferredColumns +
          gap * Math.max(0, preferredColumns - 1),
        minHeight: estimatedRowHeight,
        preferredHeight:
          estimatedRowHeight * estimatedRows +
          gap * Math.max(0, estimatedRows - 1),
        priority: Math.max(50, ...children.map((child) => child.priority)),
      };
    }
    const direction = (0, __doeFn_directionOf)(node) === "auto" ? "stack" : (0, __doeFn_directionOf)(node);
    const gap = __doeScope.engine.SPACING_TOKENS[node.layout?.gap] || __doeScope.engine.SPACING_TOKENS["18pt"];
    const minimums = children.map((child) => child.minWidth);
    const preferred = children.map((child) => child.preferredWidth);
    const roles = children.map((child) => child.role);
    const childMinHeights = children.map((child) => child.minHeight || 0);
    const minHeight =
      direction === "row"
        ? Math.max(0, ...childMinHeights)
        : childMinHeights.reduce((sum, height) => sum + height, 0) +
          gap * Math.max(0, children.length - 1);
    const role = roles.includes("media")
      ? "media"
      : roles.includes("wide")
        ? "wide"
        : roles.every((item) => item === "compact")
          ? "compact"
          : roles.includes("flow")
            ? "flow"
            : "collection";
    return {
      role,
      minWidth:
        direction === "row"
          ? minimums.reduce((sum, width) => sum + width, 0) +
            gap * Math.max(0, children.length - 1)
          : Math.max(1, ...minimums),
      preferredWidth:
        direction === "row"
          ? preferred.reduce((sum, width) => sum + width, 0) +
            gap * Math.max(0, children.length - 1)
          : Math.max(1, ...preferred),
      minHeight,
      preferredHeight: minHeight,
      priority: Math.max(50, ...children.map((child) => child.priority)),
    };
  }
