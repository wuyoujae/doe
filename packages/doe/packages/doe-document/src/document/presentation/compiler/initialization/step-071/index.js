import { canonicalizePolicy as __doeFn_canonicalizePolicy } from '../../canonicalize-policy/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2097
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.engine.registerLayoutPolicy("canonicalize-layout-tree", {
    phase: "compile",
    priority: 20,
    apply: __doeFn_canonicalizePolicy,
  });
}
