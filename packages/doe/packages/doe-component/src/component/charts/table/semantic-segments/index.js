// Origin: public/yrkie-doe/components/data-table/data-table.js:319
import { scope as __doeScope } from "../runtime/context/index.js";

export function semanticSegments(text, locale) {
    const value = String(text || "").trim();
    if (!value) return [];
    if (__doeScope.global.Intl?.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter(locale === "auto" ? undefined : locale, {
          granularity: "word",
        });
        return Array.from(segmenter.segment(value), (entry) => entry.segment)
          .filter((segment) => segment && !/^\s+$/.test(segment));
      } catch (_error) {
        // Continue with the deterministic fallback below.
      }
    }
    return value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*|\d+(?:[.,]\d+)*(?:%|[A-Za-z]+)?|[\u3400-\u9fff]+|[^\s]/g) || [value];
  }
