// Origin: public/yrkie-doe/components/item-cards/item-cards.js:16
import { scope as __doeScope } from "../runtime/context/index.js";

export function icon(name) {
    const definition = __doeScope.global.lucide?.icons?.[name] || __doeScope.global.lucide?.[name];
    if (definition && __doeScope.global.lucide?.createElement) return __doeScope.global.lucide.createElement(definition, { "aria-hidden": "true", "data-lucide": name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), "stroke-width": 1.8 });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", "m12 3 9 9-9 9-9-9z M8 12h8 M12 8v8"); svg.append(path);
    return svg;
  }
