import { isBleedSlide as __doeFn_isBleedSlide } from '../is-bleed-slide/index.js';
import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { renderActiveSlide as __doeFn_renderActiveSlide } from '../render-active-slide/index.js';
import { syncSlideSettings as __doeFn_syncSlideSettings } from '../sync-slide-settings/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../current-deck/index.js';
import { clearChangedReplacementMemory } from '../../../../packages/doe-document/src/document/presentation/edit/contents-replacement/width-memory.js';
import { hasIndependentCanvases, isCurrentSlideResult, renderContinuousSlides } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1028
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function commitSlideSettings(action, mutator, expectedResult) {
    const target = expectedResult || __doeScope.state.activeResult;
    const slides = __doeScope.state.slides;
    const slideId = target?.slide?.id;
    const targetIndex = () => slides.findIndex(slide => slide.id === slideId);
    const checkTarget = () => {
      if (slides !== __doeScope.state.slides || !isCurrentSlideResult(target) || targetIndex() < 0
        || (__doeScope.state.generation || __doeScope.state.hostReadOnly) || (expectedResult && (0, __doeFn_isBleedSlide)(slides[targetIndex()]))) {
        throw new Error(__doeScope.global.DOEContentEditor?.labels?.changed || "页面已变化，请重新打开图片编辑器。");
      }
    };
    checkTarget();
    await target.flushPendingEdits?.();
    checkTarget();
    const index = targetIndex();
    const before = slides[index];
    const draft = (0, __doeFn_deepClone)(before);
    mutator(draft);
    clearChangedReplacementMemory(before, draft);
    if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
    slides[index] = draft;
    __doeScope.state.dirty = true;
    if (hasIndependentCanvases()) await renderContinuousSlides();
    else await (0, __doeFn_renderActiveSlide)();
    (0, __doeFn_syncSlideSettings)();
    (0, __doeFn_post)("deck-change", {
      dirty: true,
      action,
      index: __doeScope.state.activeIndex,
      total: __doeScope.state.slides.length,
      deck: (0, __doeFn_currentDeck)(),
    });
  }
