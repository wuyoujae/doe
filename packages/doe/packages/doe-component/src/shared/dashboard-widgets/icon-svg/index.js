import { pascalCase as __doeFn_pascalCase } from '../pascal-case/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:455
import { scope as __doeScope } from "../runtime/context/index.js";

export function iconSvg(name, className) {
    const lucideName = __doeScope.LUCIDE_ICON_ALIASES[name] || (0, __doeFn_pascalCase)(name);
    const lucideData = __doeScope.global.lucide?.icons?.[lucideName] || __doeScope.global.lucide?.[lucideName];
    if (lucideData && typeof __doeScope.global.lucide?.createElement === "function") {
      return __doeScope.global.lucide.createElement(lucideData, {
        class: `lucide ${className || ""}`.trim(),
        "aria-hidden": "true",
        focusable: "false",
      });
    }
    const svg = __doeScope.utils.svgElement("svg", {
      class: className || "",
      viewBox: "0 0 48 48",
      "aria-hidden": "true",
      focusable: "false",
    });
    const paths = __doeScope.ICON_PATHS[name] || __doeScope.ICON_PATHS.megaphone;
    paths.forEach((data) => {
      svg.append(
        __doeScope.utils.svgElement("path", {
          d: data,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": 3.2,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        })
      );
    });
    return svg;
  }
