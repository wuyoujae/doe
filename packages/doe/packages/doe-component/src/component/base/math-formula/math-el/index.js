// Origin: public/yrkie-doe/components/math-formula/math-formula.js:779
import { scope as __doeScope } from "../runtime/context/index.js";

export function mathEl(tagName, text, attrs) {
    const node = document.createElementNS(__doeScope.MATHML_NS, tagName);
    if (text !== undefined && text !== null) node.textContent = text;
    Object.entries(attrs || {}).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== false) {
        node.setAttribute(name, String(value));
      }
    });
    return node;
  }
