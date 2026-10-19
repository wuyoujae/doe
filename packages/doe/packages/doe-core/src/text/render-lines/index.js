// Origin: public/yrkie-doe/core/semantic-text-layout.js:585
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function renderLines(element, lines) {
    element.replaceChildren();
    lines.forEach((line) => {
      const span = __doeScope.global.document.createElement("span");
      span.className = "semantic-text-line";
      span.style.display = "block";
      span.style.maxWidth = "100%";
      span.style.whiteSpace = "nowrap";
      span.textContent = line;
      element.append(span);
    });
  }
