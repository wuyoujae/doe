import { releaseActiveResult as __doeFn_releaseActiveResult } from '../../release-active-result/index.js';
import { blankSlide as __doeFn_blankSlide } from '../../blank-slide/index.js';
import { renderDeck as __doeFn_renderDeck } from '../../render-deck/index.js';
import { post as __doeFn_post } from '../../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../../current-deck/index.js';
import { flushSlideEditors, hasIndependentCanvases } from '../../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1460
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.add.addEventListener("click", async () => {
    if ((__doeScope.state.generation || __doeScope.state.hostReadOnly)) return;
    const slides = __doeScope.state.slides;
    await flushSlideEditors();
    if (slides !== __doeScope.state.slides || (__doeScope.state.generation || __doeScope.state.hostReadOnly)) return;
    if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
    __doeScope.state.slides.push((0, __doeFn_blankSlide)());
    __doeScope.state.activeIndex = __doeScope.state.slides.length - 1;
    __doeScope.state.dirty = true;
    await (0, __doeFn_renderDeck)();
    (0, __doeFn_post)("deck-change", {
      dirty: true,
      index: __doeScope.state.activeIndex,
      total: __doeScope.state.slides.length,
      deck: (0, __doeFn_currentDeck)(),
    });
  });
}
