// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:197
import { scope as __doeScope } from "../runtime/context/index.js";

export function semanticLucideIcon(iconName, iconData, attributes) {
    const icon = __doeScope.global.lucide.createElement(iconData, attributes);
    const semanticName = String(iconName || "circle")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    // Preserve the icon identity in the frozen export DOM.  HTMLIR can then
    // compile every Lucide primitive into one editable PowerPoint icon rather
    // than guessing from individual SVG paths.
    icon.setAttribute("data-lucide", semanticName || "circle");
    return icon;
  }
