import { minimumFontPxForTypographyRole as __doeFn_minimumFontPxForTypographyRole } from "../minimum-font-px-for-typography-role/index.js";
import { isDescriptiveTextNode as __doeFn_isDescriptiveTextNode } from "../../layout/is-descriptive-text-node/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8100
import { scope as __doeScope } from "../../runtime/context/index.js";

export function candidateMinimumFontPx(node, defaultMinimumPx) {
    const semanticMinimumPt = Number(
      node.closest("[data-semantic-min-pt]")?.dataset.semanticMinPt,
    );
    if (Number.isFinite(semanticMinimumPt) && semanticMinimumPt > 0) {
      return Math.min(semanticMinimumPt, __doeScope.MIN_MICRO_FONT_PT) * __doeScope.CSS_PIXELS_PER_POINT;
    }
    // Editable copies may wrap a small eyebrow beside an icon. Its text
    // still belongs to the ancestor's typography token, not the body floor.
    if (node.closest('[data-typography-style="small"]')) {
      return __doeScope.MIN_MICRO_FONT_PT * __doeScope.CSS_PIXELS_PER_POINT;
    }
    const role = node
      .closest("[data-typography-role]")
      ?.dataset.typographyRole;
    return (0, __doeFn_minimumFontPxForTypographyRole)(
      role || ((0, __doeFn_isDescriptiveTextNode)(node) ? "supporting" : "content"),
      defaultMinimumPx,
    );
  }
