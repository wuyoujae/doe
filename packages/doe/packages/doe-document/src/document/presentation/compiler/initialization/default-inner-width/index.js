// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:10
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.DEFAULT_INNER_WIDTH = __doeScope.engine.CANVAS.renderWidth - __doeScope.engine.SPACING_TOKENS["36pt"] * 2;
}
