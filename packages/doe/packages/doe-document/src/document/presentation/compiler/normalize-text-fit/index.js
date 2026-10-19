import { enumOrDefault as __doeFn_enumOrDefault } from '../enum-or-default/index.js';
import { scope } from '../runtime/context/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:228


export function normalizeTextFit(source) {
    const input = source && typeof source === "object" && !Array.isArray(source)
      ? source
      : {};
    const { minimumFontPt = 12.5, optionalMicroFontPt = 9.5 } = scope.engine?.COMPOSITION_LIMITS || {};
    const floor = value => Number(value) <= optionalMicroFontPt ? optionalMicroFontPt : minimumFontPt;
    return {
      mode: (0, __doeFn_enumOrDefault)(input.mode, ["readable", "micro"], "readable"),
      minBodyPt: floor(input.minBodyPt),
      optionalMinBodyPt: floor(input.optionalMinBodyPt),
    };
  }
