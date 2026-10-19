import { deepClone as __doeFn_deepClone } from '../deep-clone/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:602
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function currentDeck() {
    return {
      version: 4,
      logo: (0, __doeFn_deepClone)(__doeScope.state.logo || null),
      pageNumber: (0, __doeFn_deepClone)(__doeScope.state.pageNumber),
      deck: {
        title: __doeScope.state.title,
        theme: __doeScope.state.theme,
        slides: (0, __doeFn_deepClone)(__doeScope.state.slides),
      },
    };
  }
