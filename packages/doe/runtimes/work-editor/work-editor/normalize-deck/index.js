import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:557
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function normalizeDeck(value) {
    let resolved = value;
    if (typeof value === "string") {
      const recovery = __doeScope.global.SchemaJsonRecovery;
      const result = recovery?.parse ? recovery.parse(value) : null;
      if (result?.ok) {
        resolved = result.value;
        if (result.repaired) {
          console.warn(
            "Yrkie-doe recovered simple Deck JSON syntax errors:",
            result.repairs.map((repair) => recovery.formatRepair(repair)),
          );
        }
      } else {
        const diagnostic = result?.diagnostics?.[0];
        const detail = diagnostic && recovery?.formatDiagnostic
          ? recovery.formatDiagnostic(diagnostic)
          : result?.error?.message || "无法解析 Deck JSON";
        throw new Error(detail);
      }
    }
    const source = resolved && typeof resolved === "object" ? resolved : {};
    const deck = source.deck && typeof source.deck === "object" ? source.deck : source;
    const slides = Array.isArray(deck.slides) ? deck.slides : [];
    const pageNumber = {
      enabled: source.pageNumber?.enabled !== false,
      format: source.pageNumber?.format === "fraction" ? "fraction" : "number",
    };
    if (!slides.length) throw new Error("Deck 至少需要一张幻灯片");
    return {
      title: typeof deck.title === "string" && deck.title.trim() ? deck.title.trim() : "Yrkie 幻灯片",
      theme: __doeScope.global.PPTTheme?.normalizeThemeId?.(deck.theme) || "yrkie-theme",
      pageNumber,
      logo: source.logo ? (0, __doeFn_deepClone)(source.logo) : null,
      slides: slides.map((entry, index) => {
        const candidate = entry?.slide && typeof entry.slide === "object" ? entry.slide : entry;
        if (!candidate || !Array.isArray(candidate.blocks)) {
          throw new Error(`第 ${index + 1} 张幻灯片缺少 blocks`);
        }
        const normalizedSlide = { ...(0, __doeFn_deepClone)(candidate), editor: true };
        delete normalizedSlide.theme;
        return normalizedSlide;
      }),
    };
  }
