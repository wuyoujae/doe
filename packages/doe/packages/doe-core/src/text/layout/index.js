import { createMeasure as __doeFn_createMeasure } from '../create-measure/index.js';
import { tokenize as __doeFn_tokenize } from '../tokenize/index.js';
import { solveParagraphs as __doeFn_solveParagraphs } from '../solve-paragraphs/index.js';
import { projectLines as __doeFn_projectLines } from '../project-lines/index.js';
import { wrapContactTokens } from '../wrap-contact-tokens/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:300
import { scope as __doeScope } from "./runtime/context/index.js";

export function layout(text, options = {}) {
    const widthPx = Math.max(
      1,
      Number(options.widthPx) || Number(options.widthPt) * __doeScope.PT_TO_PX || 1,
    );
    const authoredPx = Math.max(
      1,
      Number(options.fontPx) || Number(options.fontPt) * __doeScope.PT_TO_PX || 16,
    );
    const requestedMinimum =
      Number(options.minFontPx) || Number(options.minFontPt) * __doeScope.PT_TO_PX;
    const minimumPx = Math.min(
      authoredPx,
      Math.max(8 * __doeScope.PT_TO_PX, requestedMinimum || authoredPx),
    );
    const maxLines = Math.max(1, Math.min(24, Number(options.maxLines) || 2));
    const allowScale = options.allowScale === true;
    const cacheKey = typeof options.measureText === "function"
      ? ""
      : JSON.stringify([
          String(text ?? ""),
          options.locale || "auto",
          Array.isArray(options.protectedTerms) ? options.protectedTerms : [],
          widthPx,
          authoredPx,
          minimumPx,
          maxLines,
          allowScale,
          options.fontFamily || "sans-serif",
          options.fontWeight || 300,
          options.fontStyle || "normal",
          Number(options.letterSpacingPx) || 0,
        ]);
    if (cacheKey && __doeScope.layoutCache.has(cacheKey)) return __doeScope.layoutCache.get(cacheKey);
    const measureAt = (0, __doeFn_createMeasure)(options);
    const segmentation = (0, __doeFn_tokenize)(text, options);
    const floor = allowScale ? minimumPx : authoredPx;

    for (let fontPx = authoredPx; fontPx >= floor - 0.01; fontPx -= 0.5 * __doeScope.PT_TO_PX) {
      const measure = (value) => measureAt(value, fontPx);
      let resolvedSegmentation = segmentation;
      let solution = (0, __doeFn_solveParagraphs)(
        segmentation.paragraphs,
        widthPx,
        maxLines,
        measure,
        segmentation.paragraphSources,
      );
      if (!solution) {
        resolvedSegmentation = wrapContactTokens(segmentation, widthPx, measure, options.protectedTerms);
        if (resolvedSegmentation !== segmentation) {
          solution = (0, __doeFn_solveParagraphs)(resolvedSegmentation.paragraphs,
            widthPx, maxLines, measure, resolvedSegmentation.paragraphSources);
        }
      }
      if (solution) {
        const result = {
          ...resolvedSegmentation,
          lines: solution.lines,
          projection: (0, __doeFn_projectLines)(segmentation.source, solution.ranges),
          fontPx,
          authoredPx,
          widthPx,
          maxLines,
          status:
            Math.abs(fontPx - authoredPx) < 0.1 ? "preserved" : "scaled",
          brokenProtectedTerms: 0,
        };
        if (cacheKey) {
          __doeScope.layoutCache.set(cacheKey, result);
          if (__doeScope.layoutCache.size > __doeScope.LAYOUT_CACHE_LIMIT) {
            __doeScope.layoutCache.delete(__doeScope.layoutCache.keys().next().value);
          }
        }
        return result;
      }
    }

    const blocked = {
      ...segmentation,
      lines: [],
      fontPx: minimumPx,
      authoredPx,
      widthPx,
      maxLines,
      status: "blocked",
      brokenProtectedTerms: 0,
      request: {
        type: "parent-layout",
        actions: ["increase-width", "increase-lines", "change-structure"],
      },
    };
    if (cacheKey) {
      __doeScope.layoutCache.set(cacheKey, blocked);
      if (__doeScope.layoutCache.size > __doeScope.LAYOUT_CACHE_LIMIT) {
        __doeScope.layoutCache.delete(__doeScope.layoutCache.keys().next().value);
      }
    }
    return blocked;
  }
