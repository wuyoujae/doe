import { normalizeDeck as __doeFn_normalizeDeck } from '../normalize-deck/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { setGenerationReadOnly as __doeFn_setGenerationReadOnly } from '../set-generation-read-only/index.js';
import { renderDeck as __doeFn_renderDeck } from '../render-deck/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { hasIndependentCanvases } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:827
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function abortGeneration(generationId, notify = true) {
    const generation = __doeScope.state.generation;
    if (!generation || generation.generationId !== generationId) return;
    if (!generation.baseline.deck.slides.length) {
      if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
      __doeScope.state.slides = [];
      __doeScope.state.generation = null;
      __doeScope.state.dirty = false;
      (0, __doeFn_setGenerationReadOnly)(true);
      await (0, __doeFn_renderDeck)({ replaceDeck: true, discardPrevious: true });
      if (notify) (0, __doeFn_post)("generation-state", { generationId, status: "aborted" });
      return;
    }
    const baseline = (0, __doeFn_normalizeDeck)(generation.baseline);
    __doeScope.state.title = baseline.title;
    __doeScope.state.theme = baseline.theme;
    __doeScope.state.pageNumber = baseline.pageNumber;
        __doeScope.state.logo = baseline.logo;
    __doeScope.state.slides = baseline.slides;
    __doeScope.state.activeIndex = Math.min(__doeScope.state.activeIndex, __doeScope.state.slides.length - 1);
    if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
    __doeScope.state.dirty = generation.baselineDirty;
    __doeScope.state.generation = null;
    (0, __doeFn_setGenerationReadOnly)(false);
    await (0, __doeFn_renderDeck)({ replaceDeck: true, discardPrevious: true });
    if (notify) (0, __doeFn_post)("generation-state", { generationId, status: "aborted" });
  }
