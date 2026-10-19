import { defaultSourceSignature as __doeFn_defaultSourceSignature } from '../../default-source-signature/index.js';
// Origin: public/yrkie-doe/work-editor/thumbnail-coordinator.js:417
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.global.WorkSlideThumbnailCoordinator = Object.freeze({
    create(options) {
      return new __doeScope.ThumbnailCoordinator(options);
    },
    sourceSignature: __doeFn_defaultSourceSignature,
  });
}
