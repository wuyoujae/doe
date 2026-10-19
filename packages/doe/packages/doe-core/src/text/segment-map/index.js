// Origin: public/yrkie-doe/core/semantic-text-layout.js:48
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function segmentMap(text, locale) {
    if (!__doeScope.global.Intl?.Segmenter) return new Map();
    const map = new Map();
    const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
    for (const part of segmenter.segment(text)) {
      if (part.segment && !/^\s+$/u.test(part.segment)) map.set(part.index, part);
    }
    return map;
  }
