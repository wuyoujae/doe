// Origin: public/yrkie-doe/layout-engine/components.js:40
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function runtimeIcon(name, className) {
    const iconData = __doeScope.global.lucide?.icons?.[name] || __doeScope.global.lucide?.[name];
    if (!iconData || typeof __doeScope.global.lucide?.createElement !== "function") return null;
    return __doeScope.global.lucide.createElement(iconData, {
      class: className,
      "data-lucide": name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
      "aria-hidden": "true",
      "stroke-width": 1.8,
    });
  }
