// Origin: public/yrkie-doe/layout-engine/layout-engine.js:444
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
Object.entries(__doeScope.builtInLayouts).forEach(([id, value]) => __doeScope.layouts.set(id, value));
}
