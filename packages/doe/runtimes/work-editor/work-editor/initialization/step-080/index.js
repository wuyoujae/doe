import { decorateGenerationFocus as __doeFn_decorateGenerationFocus } from '../../decorate-generation-focus/index.js';
import { acceptSlideResult } from '../../continuous-view/index.js';
import { reconcileFilmstrip as __doeFn_reconcileFilmstrip } from '../../reconcile-filmstrip/index.js';
import { refreshActiveThumbnail as __doeFn_refreshActiveThumbnail } from '../../refresh-active-thumbnail/index.js';
import { post as __doeFn_post } from '../../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../../current-deck/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1435
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.frame.parentElement.addEventListener("slideengine:change", (event) => {
    if (__doeScope.state.generation) {
      (0, __doeFn_decorateGenerationFocus)(__doeScope.state.generation, false);
      return;
    }
    const result = event?.detail?.result;
    if (!result) return;
    // Rejected edits restored the original tree; they must not create a save.
    if (event.detail.rejected) return;
    const index = acceptSlideResult(result);
    if (index < 0) return;
    __doeScope.state.slides[index] = result.slide;
    __doeScope.state.dirty = true;
    (0, __doeFn_reconcileFilmstrip)();
    void (0, __doeFn_refreshActiveThumbnail)(result, index);
    (0, __doeFn_post)("deck-change", {
      dirty: true,
      index: __doeScope.state.activeIndex,
      total: __doeScope.state.slides.length,
      deck: (0, __doeFn_currentDeck)(),
    });
  }, true);
}
