// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:241
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeSlotSpace(source) {
    if (!source || typeof source !== "object" || Array.isArray(source)) return undefined;
    const output = {};
    ["top", "right", "bottom", "left"].forEach((side) => {
      const value = source[side];
      if (value === 0 || __doeScope.SPACE_VALUES.has(value)) output[side] = value;
    });
    return Object.keys(output).length ? output : undefined;
  }
