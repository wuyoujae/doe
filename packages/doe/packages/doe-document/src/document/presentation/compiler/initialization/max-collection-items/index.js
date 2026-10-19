// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:9
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.MAX_COLLECTION_ITEMS = __doeScope.engine.COLLECTION_LIMITS?.maxItems || 24;
}
