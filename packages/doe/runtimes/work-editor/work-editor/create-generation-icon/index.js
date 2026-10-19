// Origin: public/yrkie-doe/work-editor/work-editor.js:626
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function createGenerationIcon(name, className) {
    const iconData = __doeScope.global.lucide?.icons?.[name] || __doeScope.global.lucide?.[name];
    if (!iconData || typeof __doeScope.global.lucide?.createElement !== "function") return null;
    return __doeScope.global.lucide.createElement(iconData, {
      class: className,
      "aria-hidden": "true",
      "stroke-width": 2,
    });
  }
