// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1459
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createEditorIcon(name, className = "text-edit-toolbar__icon") {
    const iconData = __doeScope.global.lucide?.icons?.[name] || __doeScope.global.lucide?.[name];
    if (!iconData || typeof __doeScope.global.lucide?.createElement !== "function") {
      return null;
    }
    return __doeScope.global.lucide.createElement(iconData, {
      class: className,
      "aria-hidden": "true",
      "stroke-width": 2,
    });
  }
