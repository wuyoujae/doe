// Origin: public/yrkie-doe/export-runtime/export-runtime.js:126
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export function freezeComputedStyles(element, cloned) {
    const sources = [element, ...element.querySelectorAll("*")];
    const targets = [cloned, ...cloned.querySelectorAll("*")];
    sources.forEach((source, index) => {
      const target = targets[index];
      if (!(target instanceof HTMLElement || target instanceof SVGElement)) return;
      const computed = __doeScope.global.getComputedStyle(source);
      __doeScope.FROZEN_STYLE_PROPERTIES.forEach((property) => {
        const value = computed.getPropertyValue(property);
        if (value) target.style.setProperty(property, value, "important");
      });
    });
  }
