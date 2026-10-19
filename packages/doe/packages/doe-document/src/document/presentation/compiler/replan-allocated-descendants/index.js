import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { childPlanningWidths as __doeFn_childPlanningWidths } from '../child-planning-widths/index.js';
import { autoPlanNode as __doeFn_autoPlanNode } from '../auto-plan-node/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1560


export function replanAllocatedDescendants(node, diagnostics, innerWidth) {
    if (!(0, __doeFn_isGroup)(node)) return node;
    const widths = (0, __doeFn_childPlanningWidths)(node, innerWidth);
    node.children = (node.children || []).map((child, index) =>
      (0, __doeFn_autoPlanNode)(child, diagnostics, widths[index] || innerWidth),
    );
    return node;
  }
