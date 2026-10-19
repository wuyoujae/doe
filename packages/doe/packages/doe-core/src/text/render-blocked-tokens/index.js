// Origin: public/yrkie-doe/core/semantic-text-layout.js:573
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function renderBlockedTokens(element, tokens) {
    element.replaceChildren();
    tokens.forEach((token, index) => {
      if (index > 0 && token.spaceBefore) element.append(" ");
      const span = __doeScope.global.document.createElement("span");
      span.className = "semantic-text-token";
      span.style.whiteSpace = "nowrap";
      span.textContent = token.text;
      element.append(span);
    });
  }
