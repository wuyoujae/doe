import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:473


export function isLocalCluster(node) {
    return (
      (0, __doeFn_isGroup)(node) &&
      (node.kind === "cluster" || node.layout?.cluster === true)
    );
  }
