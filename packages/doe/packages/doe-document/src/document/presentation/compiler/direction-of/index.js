import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:480


export function directionOf(node) {
    if (!(0, __doeFn_isGroup)(node)) return null;
    if (node.layout?.variant === "stack") return "stack";
    if (node.layout?.variant === "row") return "row";
    return ["row", "stack"].includes(node.layout?.direction)
      ? node.layout.direction
      : "auto";
  }
