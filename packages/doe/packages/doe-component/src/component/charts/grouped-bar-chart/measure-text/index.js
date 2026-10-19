// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:38
import { scope as __doeScope } from "../runtime/context/index.js";

export function measureText(text, font) {
    if (!text) return 0;

    if (!__doeScope.measurementContext) {
      const canvas = document.createElement("canvas");
      __doeScope.measurementContext = canvas.getContext("2d");
    }

    if (!__doeScope.measurementContext) return String(text).length * 12;
    __doeScope.measurementContext.font = font;
    return __doeScope.measurementContext.measureText(String(text)).width;
  }
