// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:127
import { scope as __doeScope } from "../runtime/context/index.js";

export function applyTypographyStyle(element, styleId) {
    if (__doeScope.global.SlideEngine?.applyTypographyStyle) {
      return __doeScope.global.SlideEngine.applyTypographyStyle(element, styleId);
    }
    element.dataset.typographyStyle = styleId;
    return element;
  }
