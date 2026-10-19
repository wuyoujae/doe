// Origin: public/yrkie-doe/core/semantic-text-layout.js:598
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function renderedLineOverflowRatio(element) {
    if (element.dataset.semanticRender === "plaintext" && element.firstChild?.nodeType === 3) {
      const scale = element.getBoundingClientRect().width / Math.max(1, element.clientWidth);
      const available = Math.max(1, element.clientWidth - (parseFloat(__doeScope.global.getComputedStyle(element).paddingLeft) || 0)
        - (parseFloat(__doeScope.global.getComputedStyle(element).paddingRight) || 0));
      let offset = 0; let ratio = 1;
      for (const line of element.textContent.split("\n")) {
        const range = __doeScope.global.document.createRange();
        range.setStart(element.firstChild, offset); range.setEnd(element.firstChild, offset + line.length);
        const width = [...range.getClientRects()].reduce((sum, rect) => sum + rect.width, 0) / (scale || 1);
        ratio = Math.min(ratio, available / Math.max(available, width)); offset += line.length + 1;
      }
      return ratio;
    }
    const lines = [...element.querySelectorAll(":scope > .semantic-text-line")];
    if (!lines.length) return 1;
    return lines.reduce((lowestRatio, line) => {
      const available = Math.max(1, line.clientWidth || element.clientWidth || 1);
      const required = Math.max(available, line.scrollWidth || 0);
      return Math.min(lowestRatio, available / required);
    }, 1);
  }
