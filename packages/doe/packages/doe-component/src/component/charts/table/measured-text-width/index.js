// Origin: public/yrkie-doe/components/data-table/data-table.js:307
import { scope as __doeScope } from "../runtime/context/index.js";

export function measuredTextWidth(context, font, text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (!value) return 0;
    const key = `${font}\u0000${value}`;
    if (__doeScope.textMeasureCache.has(key)) return __doeScope.textMeasureCache.get(key);
    context.font = font;
    const width = context.measureText(value).width;
    if (__doeScope.textMeasureCache.size > 2400) __doeScope.textMeasureCache.clear();
    __doeScope.textMeasureCache.set(key, width);
    return width;
  }
