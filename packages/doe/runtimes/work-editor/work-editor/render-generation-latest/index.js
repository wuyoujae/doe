import { normalizeDeck as __doeFn_normalizeDeck } from '../normalize-deck/index.js';
import { generationFocus as __doeFn_generationFocus } from '../generation-focus/index.js';
import { currentSlide as __doeFn_currentSlide } from '../current-slide/index.js';
import { releaseActiveResult as __doeFn_releaseActiveResult } from '../release-active-result/index.js';
import { renderDeck as __doeFn_renderDeck } from '../render-deck/index.js';
import { post as __doeFn_post } from '../post/index.js';
import { decorateGenerationFocus as __doeFn_decorateGenerationFocus } from '../decorate-generation-focus/index.js';
import { hasIndependentCanvases } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:734
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function renderGenerationLatest(generation) {
    if (!generation || __doeScope.state.generation !== generation || generation.renderInFlight) return;
    generation.renderInFlight = true;
    try {
      while (__doeScope.state.generation === generation && generation.pending) {
        const pending = generation.pending;
        generation.pending = null;
        if (pending.updateVersion <= generation.renderedVersion) continue;
        const normalized = (0, __doeFn_normalizeDeck)(pending.deck);
        __doeScope.state.title = normalized.title;
        __doeScope.state.theme = normalized.theme;
        __doeScope.state.pageNumber = normalized.pageNumber;
        __doeScope.state.logo = normalized.logo;
        __doeScope.state.slides = normalized.slides.map((slideValue) => ({ ...slideValue, editor: false }));
        if (generation.followNewest || __doeScope.state.activeIndex >= __doeScope.state.slides.length) {
          __doeScope.state.activeIndex = __doeScope.state.slides.length - 1;
        }
        const focus = (0, __doeFn_generationFocus)((0, __doeFn_currentSlide)(), generation);
        generation.focusSlideId = focus.slideId;
        generation.focusBlockId = focus.blockId;
        if (!hasIndependentCanvases()) (0, __doeFn_releaseActiveResult)();
        const rendered = await (0, __doeFn_renderDeck)({ replaceDeck: true, discardPrevious: true });
        if (__doeScope.state.generation !== generation) return;
        if (!rendered) {
          if (!generation.pending) {
            (0, __doeFn_post)("generation-state", {
              generationId: generation.generationId,
              status: "error",
              message: "生成中的 Slide 暂时无法渲染",
            });
          }
          continue;
        }
        generation.renderedBlockIdsBySlide.set(focus.slideId, new Set(focus.blockIds));
        (0, __doeFn_decorateGenerationFocus)(generation, focus.animate);
        generation.renderedVersion = pending.updateVersion;
        generation.lastReadyBlockCount = pending.readyBlockCount;
        (0, __doeFn_post)("generation-state", {
          generationId: generation.generationId,
          status: generation.committed ? "committed" : "rendered",
          readyBlockCount: pending.readyBlockCount,
          index: __doeScope.state.activeIndex,
          total: __doeScope.state.slides.length,
        });
      }
    } catch (error) {
      if (__doeScope.state.generation === generation) {
        (0, __doeFn_post)("generation-state", {
          generationId: generation.generationId,
          status: "error",
          message: error?.message || "生成中的 Slide 暂时无法渲染",
        });
      }
    } finally {
      if (__doeScope.state.generation !== generation) return;
      generation.renderInFlight = false;
      __doeScope.state.thumbnailCoordinator?.resume();
      if (generation.pending) void (0, renderGenerationLatest)(generation);
    }
  }
