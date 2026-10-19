// Origin: public/yrkie-doe/canvas/canvas.js:3
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
if (__doeScope.global.customElements.get("doe-canvas")) return { stop: true };
}
