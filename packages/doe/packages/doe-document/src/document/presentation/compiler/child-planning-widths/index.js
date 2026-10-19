import { planningGap as __doeFn_planningGap } from '../planning-gap/index.js';
import { directionOf as __doeFn_directionOf } from '../direction-of/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1260


export function childPlanningWidths(node, innerWidth) {
    const children = node.children || [];
    if (!children.length) return [];
    const gap = (0, __doeFn_planningGap)(node);
    const variant = node.layout?.variant;
    const direction = (0, __doeFn_directionOf)(node);
    if (["grid", "auto-grid", "columns"].includes(variant)) {
      const requested = Number(node.layout?.columns);
      const columns = Number.isInteger(requested) && requested > 0
        ? Math.min(children.length, requested)
        : Math.min(children.length, Number(node.layout?.maxColumns) || 1);
      const cellWidth = Math.max(1, (innerWidth - gap * Math.max(0, columns - 1)) / columns);
      return children.map(() => cellWidth);
    }
    if (direction !== "row") return children.map(() => innerWidth);

    const available = Math.max(1, innerWidth - gap * Math.max(0, children.length - 1));
    if (children.length === 2) {
      const ratio = {
        balanced: [1, 1],
        "primary-first": [3, 2],
        "primary-second": [2, 3],
      }[node.layout?.ratio] || [1, 1];
      const total = ratio[0] + ratio[1];
      return [available * ratio[0] / total, available * ratio[1] / total];
    }
    return children.map(() => available / children.length);
  }
