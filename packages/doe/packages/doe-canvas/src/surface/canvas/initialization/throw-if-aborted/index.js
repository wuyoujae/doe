// Origin: public/yrkie-doe/canvas/canvas.js:5
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.throwIfAborted = signal => { if (signal.aborted) throw new DOMException("Canvas disposed", "AbortError"); };
}
