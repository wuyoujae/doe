// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1903
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.ROOT_EVIDENCE_TYPES = new Set([
    "media",
    "code-block",
    "table",
    "grouped-bar-chart",
    "line-chart",
    "stacked-bar-chart",
    "risk-matrix",
    "waterfall-chart",
    "radar-chart",
    "donut-chart",
    "math-formula",
  ]);
}
