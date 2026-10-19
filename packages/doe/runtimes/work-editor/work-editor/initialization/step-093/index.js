import { commitSlideSettings as __doeFn_commitSlideSettings } from '../../commit-slide-settings/index.js';
import { currentSlide as __doeFn_currentSlide } from '../../current-slide/index.js';
import { isBleedSlide as __doeFn_isBleedSlide } from '../../is-bleed-slide/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1572
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.backgroundContentWidth.addEventListener("change", () => {
    const slide = (0, __doeFn_currentSlide)();
    if (__doeScope.state.generation || !slide?.background?.src || slide.background.enabled === false || (0, __doeFn_isBleedSlide)(slide)) return;
    const contentWidth = Math.max(0.2, Math.min(1, Number(__doeScope.elements.backgroundContentWidth.value) / 100));
    if (!Number.isFinite(contentWidth) || (slide.background.contentWidth ?? 1) === contentWidth && !slide.layout?.contentsReplacement) return;
    void (0, __doeFn_commitSlideSettings)("调整背景内容宽度", (draft) => {
      draft.background.contentWidth = contentWidth;
      if (draft.layout) delete draft.layout.contentsReplacement;
    }, __doeScope.state.activeResult);
  });
__doeScope.elements.backgroundOpacity.addEventListener("change", () => {
    const opacity = Math.max(0, Math.min(0.9, Number(__doeScope.elements.backgroundOpacity.value) / 100));
    void (0, __doeFn_commitSlideSettings)("调整背景遮罩透明度", (draft) => {
      if (!draft.background) return;
      draft.background.overlay = {
        opacity,
        direction: draft.background.overlay?.direction || "to-right",
      };
    });
  });
}
