import { deepClone as __doeFn_deepClone } from '../../../../doe-core/src/runtime/deep-clone/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:577
import { scope as __doeScope } from '../runtime/context/index.js';

export function registerLayout(id, definition) {
    if (!id || !definition) throw new Error("SlideEngine.registerLayout: 参数无效。");
    __doeScope.layouts.set(id, (0, __doeFn_deepClone)(definition));
  }
