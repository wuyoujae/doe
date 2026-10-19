import { pageNumberSettings as __doeFn_pageNumberSettings } from '../page-number-settings/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { renderDeck as __doeFn_renderDeck } from '../render-deck/index.js';
import { syncSlideSettings as __doeFn_syncSlideSettings } from '../sync-slide-settings/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { currentDeck as __doeFn_currentDeck } from '../current-deck/index.js';
import { flushSlideEditors, hasIndependentCanvases } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1053
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function commitPageNumberSettings(action, mutator) {
    const slides = __doeScope.state.slides;
    await flushSlideEditors();
    if (slides !== __doeScope.state.slides || (__doeScope.state.generation || __doeScope.state.hostReadOnly)) return;
    const draft = { ...(0, __doeFn_pageNumberSettings)() };
    mutator(draft);
    __doeScope.state.pageNumber = {
      enabled: draft.enabled !== false,
      format: draft.format === "fraction" ? "fraction" : "number",
    };
    if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
    __doeScope.state.dirty = true;
    await (0, __doeFn_renderDeck)();
    (0, __doeFn_syncSlideSettings)();
    (0, __doeFn_post)("deck-change", {
      dirty: true,
      action,
      index: __doeScope.state.activeIndex,
      total: __doeScope.state.slides.length,
      deck: (0, __doeFn_currentDeck)(),
    });
  }
