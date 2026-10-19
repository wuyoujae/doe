import { mapColor as __doeFn_mapColor } from "../map-color/index.js";
// Origin: public/yrkie-doe/core/theme.js:254
import { scope as __doeScope } from "../../runtime/context/index.js";

export function remapString(text, context, theme = __doeScope.YRKIE_THEME) {
    if (!text) return text;
    const colors = new RegExp(`rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)|${__doeScope.HEX_RE.source}`, 'gi');
    return String(text).replace(colors, (match, r, g, b) => {
      const hex = r === undefined ? match : '#' + [r, g, b].map(v => Number(v).toString(16).padStart(2, '0')).join('');
      return (0, __doeFn_mapColor)(hex, theme, context) || match;
    });
  }
