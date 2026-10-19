import { reconcileFilmstrip as __doeFn_reconcileFilmstrip } from '../reconcile-filmstrip/index.js';
import { isEditorMeasurable as __doeFn_isEditorMeasurable } from '../is-editor-measurable/index.js';
import { renderActiveSlide as __doeFn_renderActiveSlide } from '../render-active-slide/index.js';
import { hasIndependentCanvases, renderContinuousSlides } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1393
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function renderDeck({ replaceDeck = false, discardPrevious = false } = {}) {
    const theme = __doeScope.global.PPTTheme.themeFor(__doeScope.state.theme);
    __doeScope.global.document.documentElement.style.setProperty("--yrkie-color-studio-stage", theme.colors.studioStage);
    (0, __doeFn_reconcileFilmstrip)({ replaceDeck });
    if (hasIndependentCanvases()) return renderContinuousSlides();
    if (!__doeScope.state.slides.length) {
      __doeScope.elements.canvas.replaceChildren();
      __doeScope.elements.loading.hidden = true;
      return false;
    }
    if (!(0, __doeFn_isEditorMeasurable)()) {
      __doeScope.state.pendingDeckRender = true;
      return false;
    }
    __doeScope.state.pendingDeckRender = false;
    return (0, __doeFn_renderActiveSlide)({ discardPrevious });
  }
