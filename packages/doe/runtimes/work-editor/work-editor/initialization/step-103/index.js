import { ensureYrkieDoeFonts as __doeFn_ensureYrkieDoeFonts } from '../../ensure-yrkie-doe-fonts/index.js';
import { renderDeck as __doeFn_renderDeck } from '../../render-deck/index.js';
import { announceReady as __doeFn_announceReady } from '../../announce-ready/index.js';
import { post as __doeFn_post } from '../../post/index.js';
import { setGenerationReadOnly } from '../../set-generation-read-only/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1812
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
if (__doeScope.runtimeSurface === 'work' && !__doeScope.state.formalDeckLoaded) setGenerationReadOnly(true);
void (0, __doeFn_ensureYrkieDoeFonts)()
    .then(() => {
      __doeScope.state.fontsReady = true;
      return (0, __doeFn_renderDeck)();
    })
    .then(() => {
      __doeScope.state.initialized = true;
      (0, __doeFn_announceReady)();
    })
    .catch((error) => {
      __doeScope.elements.loading.hidden = false;
      __doeScope.elements.loading.textContent = error?.message || "Yrkie-doe 初始化失败";
      (0, __doeFn_post)("error", { message: __doeScope.elements.loading.textContent });
    });
}
