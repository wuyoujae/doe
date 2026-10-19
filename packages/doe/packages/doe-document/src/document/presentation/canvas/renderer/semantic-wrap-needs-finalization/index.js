// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10007
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function semanticWrapNeedsFinalization(element) {
    const status = element.dataset.semanticWrapStatus || "";
    if (!status || status === "deferred") return true;
    const style = __doeScope.global.getComputedStyle(element);
    const horizontalPadding =
      (parseFloat(style.paddingLeft) || 0) +
      (parseFloat(style.paddingRight) || 0);
    const widthSafety = Math.max(
      0.72,
      Math.min(1, Number(element.dataset.semanticWidthSafety) || 1),
    );
    const currentWidth = Math.max(
      0,
      (element.clientWidth - horizontalPadding) * widthSafety,
    );
    const appliedWidth = Number(element.dataset.semanticAppliedWidth);
    const currentFontPx = parseFloat(style.fontSize) || 0;
    const appliedFontPx = Number(element.dataset.semanticAppliedFontPx);
    // The flow solver already wrapped and measured this projection in logical
    // coordinates. Painting it with zoom must not wrap it a second time using
    // platform-dependent rounded glyph metrics. Real overflow is still checked
    // by settledGeometryOverflow; edits and font changes invalidate this guard.
    if (element.closest('[data-flow-paint-scale]') &&
      element.dataset.semanticRender === 'plaintext' &&
      element.dataset.semanticEditing !== 'true' &&
      (status === 'preserved' || status === 'scaled') &&
      element.textContent === element.__semanticProjection?.text &&
      Number.isFinite(appliedFontPx) && Math.abs(currentFontPx - appliedFontPx) <= 0.1) return false;
    if (
      !Number.isFinite(appliedWidth) ||
      Math.abs(currentWidth - appliedWidth) > 0.75 ||
      !Number.isFinite(appliedFontPx) ||
      Math.abs(currentFontPx - appliedFontPx) > 0.1
    ) {
      return true;
    }
    if (status === "preserved" || status === "scaled") {
      if (element.dataset.semanticRender === "plaintext") return element.textContent !== element.__semanticProjection?.text;
      return !element.querySelector(":scope > .semantic-text-line");
    }
    if (status === "blocked") {
      if (element.dataset.semanticRender === "plaintext") return element.textContent !== element.dataset.semanticSource;
      return !element.querySelector(":scope > .semantic-text-token");
    }
    return false;
  }
