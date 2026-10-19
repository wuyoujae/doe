import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { cancelComponentInsertion } from '../insert-component/index.js';
import { renderActiveSlide as __doeFn_renderActiveSlide } from '../render-active-slide/index.js';
import { thumbnailItemById as __doeFn_thumbnailItemById } from '../thumbnail-item-by-id/index.js';
import { activeSlideId as __doeFn_activeSlideId } from '../active-slide-id/index.js';
import { hasIndependentCanvases, focusContinuousSlide, flushSlideEditors, renderContinuousSlides } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1403
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

let selectionVersion = 0;
export async function setActiveSlide(index, { revealContinuous = true } = {}) {
    const version = ++selectionVersion;
    const nextIndex = Math.max(0, Math.min(__doeScope.state.slides.length - 1, Number(index) || 0));
    if (hasIndependentCanvases()) {
      if (__doeScope.state.viewMode === 'single') {
        const slides = __doeScope.state.slides;
        await flushSlideEditors();
        if (version !== selectionVersion || slides !== __doeScope.state.slides) return;
      }
      focusContinuousSlide(nextIndex, { reveal: revealContinuous });
      if (__doeScope.state.viewMode === 'single') await renderContinuousSlides();
      (0, __doeFn_thumbnailItemById)((0, __doeFn_activeSlideId)())?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return;
    }
    if (nextIndex === __doeScope.state.activeIndex && __doeScope.state.activeResult) return;
    const slides = __doeScope.state.slides;
    const result = __doeScope.state.activeResult;
    cancelComponentInsertion();
    if (__doeScope.state.generation) __doeScope.state.generation.followNewest = false;
    __doeScope.state.thumbnailCoordinator?.cancelBackground();
    await result?.flushPendingEdits?.();
    if (version !== selectionVersion || slides !== __doeScope.state.slides || result !== __doeScope.state.activeResult) return;
    (0, __doeFn_releaseActiveResult)();
    __doeScope.state.activeIndex = nextIndex;
    await (0, __doeFn_renderActiveSlide)({ revealContinuous });
    (0, __doeFn_thumbnailItemById)((0, __doeFn_activeSlideId)())?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
