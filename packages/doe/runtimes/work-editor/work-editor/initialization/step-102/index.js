import { releaseActiveResult as __doeFn_releaseActiveResult } from '../../release-active-result/index.js';
import { disposeContinuousView } from '../../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1806
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.global.addEventListener("beforeunload", () => {
    __doeScope.resizeObserver.disconnect();
    (0, __doeFn_releaseActiveResult)();
    __doeScope.state.thumbnailCoordinator?.dispose();
    disposeContinuousView();
  });
}
