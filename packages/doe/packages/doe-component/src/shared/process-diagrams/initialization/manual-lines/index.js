// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:1584
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.manualLines = (value) => String(value || "").replace(/\r\n?/gu, "\n").split("\n");
}
