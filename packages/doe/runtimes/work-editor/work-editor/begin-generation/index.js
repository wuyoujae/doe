import { currentDeck as __doeFn_currentDeck } from '../current-deck/index.js';
import { clearGenerationDecoration as __doeFn_clearGenerationDecoration } from '../clear-generation-decoration/index.js';
import { setGenerationReadOnly as __doeFn_setGenerationReadOnly } from '../set-generation-read-only/index.js';
import { post as __doeFn_post } from '../post/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:704
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function beginGeneration(generationId) {
    if (!generationId) return;
    if (__doeScope.state.generation?.generationId === generationId) return;
    const previousGeneration = __doeScope.state.generation;
    const baseline = previousGeneration?.baseline || (0, __doeFn_currentDeck)();
    const baselineDirty = previousGeneration?.baselineDirty ?? __doeScope.state.dirty;
    if (previousGeneration) {
      __doeScope.state.renderToken += 1;
      __doeScope.state.activeMountAbortController?.abort();
    }
    (0, __doeFn_clearGenerationDecoration)();
    __doeScope.state.generation = {
      generationId,
      baseline,
      baselineDirty,
      renderInFlight: false,
      pending: null,
      followNewest: true,
      committed: false,
      renderedVersion: 0,
      lastReadyBlockCount: 0,
      renderedBlockIdsBySlide: new Map(),
      focusSlideId: "",
      focusBlockId: "",
    };
    (0, __doeFn_setGenerationReadOnly)(true);
    __doeScope.state.thumbnailCoordinator?.cancelBackground({ clearQueue: true });
    (0, __doeFn_post)("generation-state", { generationId, status: "streaming", readyBlockCount: 0 });
  }
