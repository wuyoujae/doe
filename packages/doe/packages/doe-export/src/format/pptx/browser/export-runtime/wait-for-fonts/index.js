// Origin: public/yrkie-doe/export-runtime/export-runtime.js:49
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export async function waitForFonts() {
    if (!document.fonts) return;
    await Promise.all(__doeScope.FONT_PROBES.map((probe) => document.fonts.load(probe, "Yrkie")));
    await document.fonts.ready;
  }
