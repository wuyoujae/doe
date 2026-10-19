// Origin: public/yrkie-doe/core/chart-utils.js:26
import { scope as __doeScope } from "../../../component/charts/shared/runtime/context/index.js";

export function measureText(text, font) {
    if (!text) return 0;
    if (!__doeScope.measurementContext) {
      __doeScope.measurementContext = document.createElement("canvas").getContext("2d");
    }
    if (!__doeScope.measurementContext) return String(text).length * 12;
    __doeScope.measurementContext.font = font;
    return __doeScope.measurementContext.measureText(String(text)).width;
  }
