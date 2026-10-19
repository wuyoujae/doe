import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2414


export function edgeMediaContentAlign(node) {
    if (!(0, __doeFn_isEdgeSplitGroup)(node)) return null;
    return "center";
  }
