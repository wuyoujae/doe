import { ensureThumbnailCoordinator as __doeFn_ensureThumbnailCoordinator } from '../ensure-thumbnail-coordinator/index.js';
import { isCurrentSlideResult } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1282
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export async function refreshActiveThumbnail(
    result = __doeScope.state.activeResult,
    index = __doeScope.state.activeIndex,
  ) {
    if (!isCurrentSlideResult(result) || !__doeScope.state.hostVisible) return false;
    const slideId = __doeScope.state.slides[index]?.id;
    if (!slideId || slideId !== result.slide?.id) return false;
    const coordinator = (0, __doeFn_ensureThumbnailCoordinator)();
    return coordinator.publishActive(slideId, () => result.captureStaticSnapshot(), { requireActive: false });
  }
