// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7459
import { scope as __doeScope } from "../../runtime/context/index.js";

export function applyClusterSlotSpace(record, spacingCompression) {
    // Local clusters already own a semantic gap between their children, and
    // each component still keeps its own internal padding. Retaining the full
    // standalone 6pt slot inset here double-counts vertical whitespace. Keep
    // a small selectable breathing area, scaled with the active density.
    const verticalInset = spacingCompression <= 0
      ? __doeScope.SPACING_TOKENS["6pt"]
      : spacingCompression === 1
        ? 6
        : 1;
    record.content.style.padding = `${verticalInset}px 0`;
  }
