import { remapString as __doeFn_remapString } from "../remap-string/index.js";
import { remapStyle as __doeFn_remapStyle } from "../remap-style/index.js";
// Origin: public/yrkie-doe/core/theme.js:269
import { scope as __doeScope } from "../../runtime/context/index.js";

export function remapElement(element, theme = __doeScope.YRKIE_THEME) {
    __doeScope.COLOR_ATTRS.forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const next = (0, __doeFn_remapString)(value, "foreground", theme);
      if (next !== value) element.setAttribute(attribute, next);
    });
    if (element.style?.fontFamily && /Alexandria|MiSans|Lora|Tomorrow|ZCOOL/i.test(element.style.fontFamily)) element.style.fontFamily = theme.fonts.stack;
    const background = element.getAttribute("background");
    if (background) {
      const next = (0, __doeFn_remapString)(background, "background", theme);
      if (next !== background) element.setAttribute("background", next);
    }
    const style = element.getAttribute("style");
    if (style) {
      const next = (0, __doeFn_remapStyle)(style, theme);
      if (next !== style) element.setAttribute("style", next);
    }
  }
