import { sanitizePolicy as __doeFn_sanitizePolicy } from '../../sanitize-policy/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2092
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.engine.registerLayoutPolicy("sanitize-ai-schema", {
    phase: "compile",
    priority: 10,
    apply: __doeFn_sanitizePolicy,
  });
}
