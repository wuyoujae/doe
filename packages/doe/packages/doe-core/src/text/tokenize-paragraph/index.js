import { normalizeLocale as __doeFn_normalizeLocale } from '../normalize-locale/index.js';
import { uniqueTerms as __doeFn_uniqueTerms } from '../unique-terms/index.js';
import { segmentMap as __doeFn_segmentMap } from '../segment-map/index.js';
import { mergePunctuation as __doeFn_mergePunctuation } from '../merge-punctuation/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:96
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function tokenizeParagraph(text, options = {}) {
    const source = String(text || "");
    const locale = (0, __doeFn_normalizeLocale)(options.locale, source);
    if (!source) return { locale, tokens: [] };
    const terms = (0, __doeFn_uniqueTerms)(locale, options.protectedTerms);
    const intlSegments = (0, __doeFn_segmentMap)(source, locale);
    const tokens = [];
    let index = 0;
    let previousEnd = 0;

    while (index < source.length) {
      if (/\s/u.test(source[index])) {
        index += 1;
        continue;
      }

      const spaceBefore =
        index > previousEnd && /\s/u.test(source.slice(previousEnd, index));
      const protectedTerm = terms.find((term) => source.startsWith(term, index));
      let value = protectedTerm || "";
      let isProtected = Boolean(protectedTerm);

      if (!value) {
        const direct = __doeScope.ATOMIC_VALUE.exec(source.slice(index));
        if (direct) {
          value = direct[0];
          isProtected = true;
        }
      }

      if (!value) {
        const intl = intlSegments.get(index);
        if (intl) {
          value = intl.segment;
          isProtected = intl.isWordLike !== false;
        }
      }

      if (!value) value = [...source.slice(index)][0];
      const end = index + value.length;
      tokens.push({
        text: value,
        start: index,
        end,
        protected: isProtected,
        spaceBefore,
        gapBefore: source.slice(previousEnd, index),
      });
      previousEnd = end;
      index = end;
    }

    const merged = (0, __doeFn_mergePunctuation)(tokens);
    if (merged.length) merged[merged.length - 1].trailing = source.slice(merged[merged.length - 1].end);
    return { locale, tokens: merged };
  }
