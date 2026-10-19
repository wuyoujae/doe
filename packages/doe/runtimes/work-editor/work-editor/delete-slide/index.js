import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { renderDeck as __doeFn_renderDeck } from '../render-deck/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../current-deck/index.js';
import { flushSlideEditors, hasIndependentCanvases } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1415
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

let pendingDelete = null;
let requestSequence = 0;

export function deleteSlide(index) {
    if ((__doeScope.state.generation || __doeScope.state.hostReadOnly)) return;
    if (__doeScope.state.slides.length <= 1 || index < 0 || index >= __doeScope.state.slides.length) return;
    const requestId = `delete-slide:${++requestSequence}`;
    pendingDelete = { requestId, slides: __doeScope.state.slides, slideId: __doeScope.state.slides[index].id };
    (0, __doeFn_post)("request-slide-delete", { requestId, index });
  }

export async function resolveSlideDelete(requestId, confirmed) {
    const target = pendingDelete;
    if (!target || target.requestId !== requestId) return;
    pendingDelete = null;
    if (confirmed !== true || (__doeScope.state.generation || __doeScope.state.hostReadOnly) || __doeScope.state.slides.length <= 1) return;
    if (__doeScope.state.slides !== target.slides) return;
    await flushSlideEditors();
    const index = __doeScope.state.slides.findIndex((slide) => slide.id === target.slideId);
    if (__doeScope.state.slides !== target.slides || (__doeScope.state.generation || __doeScope.state.hostReadOnly) || __doeScope.state.slides.length <= 1 || index < 0) return;
    if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
    __doeScope.state.slides.splice(index, 1);
    if (index < __doeScope.state.activeIndex) __doeScope.state.activeIndex -= 1;
    else if (index === __doeScope.state.activeIndex) {
      __doeScope.state.activeIndex = Math.min(index, __doeScope.state.slides.length - 1);
    }
    __doeScope.state.dirty = true;
    await (0, __doeFn_renderDeck)();
    (0, __doeFn_post)("deck-change", {
      dirty: true,
      index: __doeScope.state.activeIndex,
      total: __doeScope.state.slides.length,
      deck: (0, __doeFn_currentDeck)(),
    });
  }
