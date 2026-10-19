import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
import { renderGenerationLatest as __doeFn_renderGenerationLatest } from '../render-generation-latest/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:794
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function setGenerationDeck(message) {
    const generation = __doeScope.state.generation;
    if (!generation || generation.generationId !== message.generationId) return;
    const updateVersion = Number(message.updateVersion);
    const readyBlockCount = Number(message.readyBlockCount);
    if (
      !Number.isSafeInteger(updateVersion)
      || updateVersion <= generation.renderedVersion
      || !Number.isSafeInteger(readyBlockCount)
      || readyBlockCount < 1
      || !message.deck
    ) return;
    if (generation.pending && updateVersion <= generation.pending.updateVersion) return;
    generation.pending = {
      deck: (0, __doeFn_deepClone)(message.deck),
      readyBlockCount,
      updateVersion,
    };
    void (0, __doeFn_renderGenerationLatest)(generation);
  }
