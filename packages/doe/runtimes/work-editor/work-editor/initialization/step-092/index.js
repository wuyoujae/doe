// Origin: public/yrkie-doe/work-editor/work-editor.js:1568
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.backgroundContentWidth.addEventListener("input", () => {
    __doeScope.elements.backgroundContentWidthOutput.textContent = `${Number(Number(__doeScope.elements.backgroundContentWidth.value).toPrecision(12))}%`;
  });
__doeScope.elements.backgroundOpacity.addEventListener("input", () => {
    __doeScope.elements.backgroundOpacityOutput.textContent = `${__doeScope.elements.backgroundOpacity.value}%`;
  });
}
