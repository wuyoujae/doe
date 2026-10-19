import { remapString as __doeFn_remapString } from "../remap-string/index.js";
// Origin: public/yrkie-doe/core/theme.js:259
import { scope as __doeScope } from "../../runtime/context/index.js";

export function remapStyle(style, theme = __doeScope.YRKIE_THEME) {
    if (!style) return style;
    return style.replace(/(^|;)\s*([^:;]+):([^;]*)/g, (match, separator, property, value) =>
      `${separator}${property}:${__doeFn_remapString(value, /^background/i.test(property.trim()) ? 'background' : 'foreground', theme)}`);
  }
