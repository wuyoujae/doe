// Origin: public/yrkie-doe/core/semantic-text-layout.js:282
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function createMeasure(options = {}) {
    if (typeof options.measureText === "function") return options.measureText;
    if (!__doeScope.global.document) {
      throw new Error("SemanticTextLayout.layout requires measureText outside a browser.");
    }
    const canvas = __doeScope.global.document.createElement("canvas");
    const context = canvas.getContext("2d");
    const family = options.fontFamily || "sans-serif";
    const weight = options.fontWeight || 300;
    const style = options.fontStyle || "normal";
    const letterSpacing = Number(options.letterSpacingPx) || 0;
    // CSS tracking includes the final typographic character. Counting n - 1
    // overestimates negatively tracked display text and can falsely block a
    // fitting atomic value. Let the browser shape spacing with the same font.
    const nativeTracking = "letterSpacing" in context;
    if (nativeTracking) context.letterSpacing = `${letterSpacing}px`;
    const segmenter = !nativeTracking && letterSpacing && __doeScope.global.Intl?.Segmenter
      ? new __doeScope.global.Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
    return (text, fontPx) => {
      context.font = `${style} ${weight} ${fontPx}px ${family}`;
      const width = context.measureText(text).width;
      if (nativeTracking || !letterSpacing) return width;
      const count = segmenter ? [...segmenter.segment(String(text))].length : [...String(text)].length;
      return width + count * letterSpacing;
    };
  }
