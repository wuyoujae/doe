// Origin: public/yrkie-doe/work-editor/work-editor.js:326
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function boundedLayoutOverflow(value) {
    const measured = Number(value);
    if (!Number.isFinite(measured) || measured < 0) return null;
    return Math.min(
      __doeScope.MAX_LAYOUT_DIAGNOSTIC_OVERFLOW,
      Math.round(measured * 100) / 100,
    );
  }
