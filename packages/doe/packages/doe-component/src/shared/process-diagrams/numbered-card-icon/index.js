import { pascalCaseIconName as __doeFn_pascalCaseIconName } from '../pascal-case-icon-name/index.js';
import { semanticLucideIcon as __doeFn_semanticLucideIcon } from '../semantic-lucide-icon/index.js';
// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:258
import { scope as __doeScope } from "../runtime/context/index.js";

export function numberedCardIcon(item) {
    const iconName = (0, __doeFn_pascalCaseIconName)(item?.icon || "circle");
    const iconData = __doeScope.global.lucide?.icons?.[iconName] || __doeScope.global.lucide?.[iconName];
    if (iconData && typeof __doeScope.global.lucide?.createElement === "function") {
      return (0, __doeFn_semanticLucideIcon)(iconName, iconData, {
        class: "ppt-numbered-icon-cards__icon-svg",
        width: 52,
        height: 52,
        "stroke-width": Number(item?.strokeWidth) || 2,
        "aria-hidden": "true",
      });
    }
    return __doeScope.utils.element(
      "span",
      "ppt-numbered-icon-cards__icon-fallback",
      String(item?.title || "I").charAt(0),
    );
  }
