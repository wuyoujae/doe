import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { isComposition as __doeFn_isComposition } from '../is-composition/index.js';
import { directionOf as __doeFn_directionOf } from '../direction-of/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1215
import { scope as __doeScope } from "../runtime/context/index.js";

export function limitDepth(node, compositionDepth, diagnostics) {
    if (!(0, __doeFn_isGroup)(node)) return node;
    const nextDepth = compositionDepth + ((0, __doeFn_isComposition)(node) ? 1 : 0);
    if ((0, __doeFn_isComposition)(node) && nextDepth > __doeScope.MAX_DEPTH) {
      node.layout.variant = (0, __doeFn_directionOf)(node) === "row" ? "row" : "stack";
      if ((0, __doeFn_isLocalCluster)(node)) {
        node.kind = "cluster";
        node.layout.cluster = true;
      } else {
        node.kind = "layout";
      }
      diagnostics.push({
        code: "depth-exited-composition",
        level: "repair",
        nodeId: node.id,
        message: `${node.id} 超过 ${__doeScope.MAX_DEPTH} 层，已退出可编辑组合并保留排版`,
      });
    }
    const childDepth = compositionDepth + ((0, __doeFn_isComposition)(node) ? 1 : 0);
    node.children = (node.children || []).map((child) =>
      (0, limitDepth)(child, childDepth, diagnostics),
    );
    return node;
  }
