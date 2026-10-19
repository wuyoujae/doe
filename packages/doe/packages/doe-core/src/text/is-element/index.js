// Origin: public/yrkie-doe/core/semantic-text-layout.js:25
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function isElement(value) {
    return Boolean(
      value &&
        (value.nodeType === 1 ||
          (__doeScope.global.Element && value instanceof __doeScope.global.Element)),
    );
  }
