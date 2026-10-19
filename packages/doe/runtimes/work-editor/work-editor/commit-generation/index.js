import { post as __doeFn_post } from '../post/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:815
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function commitGeneration(generationId) {
    if (!__doeScope.state.generation || __doeScope.state.generation.generationId !== generationId) return;
    __doeScope.state.generation.committed = true;
    if (__doeScope.state.generation.renderedVersion > 0) {
      (0, __doeFn_post)("generation-state", {
        generationId,
        status: "committed",
        readyBlockCount: __doeScope.state.generation.lastReadyBlockCount,
      });
    }
  }
