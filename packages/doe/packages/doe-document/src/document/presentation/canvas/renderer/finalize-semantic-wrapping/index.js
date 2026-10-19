import { semanticWrapNeedsFinalization as __doeFn_semanticWrapNeedsFinalization } from "../semantic-wrap-needs-finalization/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10044
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function finalizeSemanticWrapping(state) {
    const layout = state.layoutElement;
    if (!layout) return { applied: 0, blocked: 0, deferred: 0 };
    const semanticElements = [...layout.querySelectorAll("[data-semantic-wrap]")]
      .filter((element) => !element.dataset.semanticOwner);
    const visibleSemanticElements = semanticElements.filter(
      (element) => element.getClientRects().length > 0 && element.clientWidth > 0,
    );
    const staleSemanticElements = visibleSemanticElements.filter(
      __doeFn_semanticWrapNeedsFinalization,
    );
    const needsFinalization = staleSemanticElements.length > 0;
    const semanticService = __doeScope.global.SemanticTextLayout;
    if (!semanticService?.applyTree) {
      layout.dataset.semanticWrapRuntime = "missing";
      return { applied: 0, blocked: 0, deferred: semanticElements.length };
    }
    if (needsFinalization) {
      const repaired = staleSemanticElements
        .map((element) => ({
          element,
          result: semanticService.applyElement(element, {
            minFontPt: __doeScope.MIN_READABLE_FONT_PT,
            allowScale: false,
          }),
        }))
        .filter((entry) => entry.result);
      state.semanticWrapResults = repaired;
      void layout.offsetHeight;
    }
    const blocked = visibleSemanticElements.filter(
      (element) => element.dataset.semanticWrapStatus === "blocked",
    ).length;
    const deferred = visibleSemanticElements.filter(
      (element) =>
        !element.dataset.semanticWrapStatus ||
        element.dataset.semanticWrapStatus === "deferred",
    ).length;
    layout.dataset.semanticWrapRuntime = deferred ? "deferred" : "ready";
    layout.dataset.semanticWrapRepaired = needsFinalization ? "true" : "false";
    return {
      applied: state.semanticWrapResults?.length || 0,
      blocked,
      deferred,
    };
  }
