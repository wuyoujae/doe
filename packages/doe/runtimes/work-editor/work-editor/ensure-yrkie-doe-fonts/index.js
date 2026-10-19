// Origin: public/yrkie-doe/work-editor/work-editor.js:305
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function ensureYrkieDoeFonts() {
    if (!document.fonts) return;
    await Promise.all(__doeScope.FONT_PROBES.map((probe) => document.fonts.load(probe, "Yrkie 字体测量")));
    await document.fonts.ready;
    const unavailable = __doeScope.FONT_PROBES.filter((probe) => !document.fonts.check(probe, "Yrkie 字体测量"));
    if (unavailable.length) throw new Error("Yrkie-doe 字体加载失败");
    document.documentElement.dataset.yrkieDoeFonts = "ready";
  }
