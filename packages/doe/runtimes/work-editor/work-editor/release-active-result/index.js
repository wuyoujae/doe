// Origin: public/yrkie-doe/work-editor/work-editor.js:1138
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";
import { releaseContinuousResult } from '../continuous-view/index.js';

export function releaseActiveResult() {
    if (releaseContinuousResult()) return;
    __doeScope.state.activeMountAbortController?.abort();
    __doeScope.state.activeMountAbortController = null;
    __doeScope.state.activeResult?.dispose?.();
    __doeScope.state.activeResult = null;
    __doeScope.state.activeResultRevision = 0;
  }
