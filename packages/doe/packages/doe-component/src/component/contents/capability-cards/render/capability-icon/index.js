import { pascalCaseIconName as __doeFn_pascalCaseIconName } from '../../../../../shared/process-diagrams/pascal-case-icon-name/index.js';
import { semanticLucideIcon as __doeFn_semanticLucideIcon } from '../../../../../shared/process-diagrams/semantic-lucide-icon/index.js';
// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:239
import { scope as __doeScope } from "../../../../../shared/process-diagrams/runtime/context/index.js";

export function capabilityIcon(item) {
    const iconName = (0, __doeFn_pascalCaseIconName)(item?.icon || item?.title || "circle");
    const iconData = __doeScope.global.lucide?.icons?.[iconName] || __doeScope.global.lucide?.[iconName];
    if (iconData && typeof __doeScope.global.lucide?.createElement === "function") {
      return (0, __doeFn_semanticLucideIcon)(iconName, iconData, {
        class: "ppt-capability-cards__icon-svg",
        width: 46,
        height: 46,
        "stroke-width": 1.5,
        "aria-hidden": "true",
      });
    }
    return __doeScope.utils.element(
      "span",
      "ppt-capability-cards__icon-fallback",
      String(item?.title || "C").charAt(0),
    );
  }
