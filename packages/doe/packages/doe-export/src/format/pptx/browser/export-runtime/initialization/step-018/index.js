import { renderSlide as __doeFn_renderSlide, inspectSlide } from '../../render-slide/index.js';
import { snapshot as __doeFn_snapshot, captureSnapshot, captureInspection } from '../../snapshot/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:264
import { scope as __doeScope } from "../../../../../../runtime/context/index.js";

export function initialize() {
__doeScope.global.YrkieDoeExportRuntime = Object.freeze({ renderSlide: __doeFn_renderSlide, inspectSlide, snapshot: __doeFn_snapshot, captureSnapshot, captureInspection });
}
