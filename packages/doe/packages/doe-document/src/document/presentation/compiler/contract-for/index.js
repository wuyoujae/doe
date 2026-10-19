import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:489
import { scope as __doeScope } from "../runtime/context/index.js";

export function contractFor(node) {
    if (!node || (0, __doeFn_isGroup)(node)) return null;
    return __doeScope.engine.components.get(node.type)?.layoutContract || null;
  }
