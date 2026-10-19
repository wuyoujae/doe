import { clone as __doeFn_clone } from '../clone/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:158


export function semanticComponents(value, output = [], seen = new Set()) {
    if (Array.isArray(value)) {
      value.forEach((item) => (0, semanticComponents)(item, output, seen));
      return output;
    }
    if (!value || typeof value !== "object") return output;
    const type = String(value.type || "");
    const id = String(value.id || "");
    if (id && !seen.has(id) && [
      "grouped-bar-chart",
      "line-chart",
      "stacked-bar-chart",
      "radar-chart",
      "donut-chart",
      "waterfall-chart",
      "table",
      "math-formula",
    ].includes(type)) {
      seen.add(id);
      output.push({ id, type, props: (0, __doeFn_clone)(value.props || {}) });
    }
    Object.values(value).forEach((child) => {
      if (child && typeof child === "object") (0, semanticComponents)(child, output, seen);
    });
    return output;
  }
